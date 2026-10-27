import os, random, re, time
from collections import defaultdict, deque
from datetime import datetime, timezone

import bcrypt, httpx, jwt
from bson import ObjectId
from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo import AsyncMongoClient
from pymongo.errors import DuplicateKeyError
from starlette.exceptions import HTTPException

JWT_SECRET = os.environ["JWT_SECRET"]
IMAGE_API_URL = os.environ.get("IMAGE_API_URL", "http://127.0.0.1:8000/generate")

db = AsyncMongoClient(os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/darkroom")).get_default_database("darkroom")
users, images = db.users, db.images  # images keep the PNG bytes in `data`; shortcut: move to object storage when Atlas M0 (512 MB) fills

app = FastAPI(docs_url=None, redoc_url=None)


class Fail(Exception):
    def __init__(self, code, error):
        self.code, self.error = code, error


@app.exception_handler(Fail)
async def _fail(_, e: Fail):
    return JSONResponse({"error": e.error}, e.code)


@app.exception_handler(HTTPException)
async def _http(_, e: HTTPException):
    return JSONResponse({"error": "Not found." if e.status_code == 404 else "Bad request."}, e.status_code)


@app.exception_handler(RequestValidationError)
async def _bad(*_):
    return JSONResponse({"error": "Bad request."}, 400)


@app.exception_handler(Exception)
async def _boom(_, e):
    print(repr(e))
    return JSONResponse({"error": "Something went wrong on our side."}, 500)


# shortcut: in-memory limiter, one process only; use Redis when you run several instances
_hits: dict[str, deque] = defaultdict(deque)


def limit(key: str, count: int, window: int):
    q, now = _hits[key], time.monotonic()
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= count:
        raise Fail(429, "Too many requests. Wait a moment and try again.")
    q.append(now)


def num(v, lo, hi, default):
    try:
        n = float(v)
    except (TypeError, ValueError):
        return default
    return min(hi, max(lo, n)) if n == n else default


async def body(req: Request) -> dict:
    try:
        b = await req.json()
    except ValueError:
        return {}
    return b if isinstance(b, dict) else {}


def dto(i):
    return {
        "id": str(i["_id"]), "url": f"/api/img/{i['_id']}", "prompt": i["prompt"], "negative": i["negative"],
        "steps": i["steps"], "guidance": i["guidance"], "loraScale": i["loraScale"], "seed": i["seed"],
        "createdAt": i["createdAt"].isoformat(),
    }


def session(uid, email):
    exp = int(time.time()) + 7 * 86400
    return {"token": jwt.encode({"sub": str(uid), "exp": exp}, JWT_SECRET, "HS256"), "user": {"email": email}}


def auth(req: Request) -> str:
    try:
        return jwt.decode(req.headers.get("authorization", "").removeprefix("Bearer "), JWT_SECRET, ["HS256"])["sub"]
    except jwt.PyJWTError:
        raise Fail(401, "Sign in to continue.")


def oid(s):
    return ObjectId(s) if ObjectId.is_valid(s) else None


@app.post("/api/auth/register", status_code=201)
async def register(req: Request):
    limit("auth:" + req.client.host, 30, 900)
    b = await body(req)
    email, password = str(b.get("email", "")).strip().lower(), str(b.get("password", ""))
    if not re.fullmatch(r"\S+@\S+\.\S+", email):
        raise Fail(400, "Enter a valid email address.")
    if len(password) < 8:
        raise Fail(400, "Use at least 8 characters for your password.")
    try:
        r = await users.insert_one({"email": email, "hash": bcrypt.hashpw(password.encode(), bcrypt.gensalt(10))})
    except DuplicateKeyError:
        raise Fail(409, "An account with this email already exists.")
    return session(r.inserted_id, email)


@app.post("/api/auth/login")
async def login(req: Request):
    limit("auth:" + req.client.host, 30, 900)
    b = await body(req)
    u = await users.find_one({"email": str(b.get("email", "")).strip().lower()})
    if not u or not bcrypt.checkpw(str(b.get("password", "")).encode(), u["hash"]):
        raise Fail(401, "Email or password is wrong.")
    return session(u["_id"], u["email"])


@app.post("/api/generate", status_code=201)
async def generate(req: Request):
    uid = auth(req)
    limit("gen:" + uid, 6, 60)
    b = await body(req)
    prompt = str(b.get("prompt", "")).strip()[:500]
    if not prompt:
        raise Fail(400, "Write a prompt first.")
    seed = b.get("seed")
    p = {
        "prompt": prompt, "negative": str(b.get("negative", ""))[:500],
        "steps": round(num(b.get("steps"), 10, 50, 25)), "guidance": num(b.get("guidance"), 1, 15, 7.5),
        "loraScale": num(b.get("loraScale"), 0, 1.5, 1),
        "seed": seed if isinstance(seed, int) and not isinstance(seed, bool) and seed >= 0 else random.randrange(2**31),  # stored so any print can be repeated
    }
    try:
        async with httpx.AsyncClient(timeout=300) as c:
            r = await c.post(IMAGE_API_URL, json={
                "prompt": p["prompt"], "negative": p["negative"], "steps": p["steps"],
                "guidance": p["guidance"], "lora_scale": p["loraScale"], "seed": p["seed"]})
            r.raise_for_status()
    except httpx.HTTPError:
        raise Fail(502, "The image service is not responding. Try again in a moment.")
    doc = {"user": uid, **p, "data": r.content, "createdAt": datetime.now(timezone.utc)}
    doc["_id"] = (await images.insert_one(doc)).inserted_id
    return dto(doc)


@app.get("/api/images")
async def list_images(req: Request):
    uid = auth(req)
    # shortcut: newest 100 only, add paging when galleries outgrow that
    return [dto(i) for i in await images.find({"user": uid}, {"data": 0}).sort("createdAt", -1).limit(100).to_list(100)]


@app.delete("/api/images/{id}", status_code=204)
async def delete_image(id: str, req: Request):
    uid = auth(req)
    if not oid(id) or not (await images.delete_one({"_id": oid(id), "user": uid})).deleted_count:
        raise Fail(404, "Image not found.")
    return Response(status_code=204)


# public on purpose: <img> tags cannot send the auth header; ids are unguessable
@app.get("/api/img/{id}")
async def image(id: str):
    img = oid(id) and await images.find_one({"_id": oid(id)}, {"data": 1})
    if not img:
        raise Fail(404, "Image not found.")
    return Response(img["data"], media_type="image/png", headers={"Cache-Control": "public, max-age=604800, immutable"})
