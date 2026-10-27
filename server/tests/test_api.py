import json, os, threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError

PNG = bytes.fromhex("89504e470d0a1a0a")
seen = {}


class AI(BaseHTTPRequestHandler):
    def do_POST(self):
        seen.update(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
        self.send_response(200); self.send_header("Content-Type", "image/png"); self.end_headers(); self.wfile.write(PNG)

    def log_message(self, *a): pass


# Fake collections: no MongoDB is needed to run the tests, so Mongo itself is not exercised here.
class Cursor:
    def __init__(self, rows): self.rows = rows
    def sort(self, key, d): self.rows = sorted(self.rows, key=lambda r: r[key], reverse=d < 0); return self
    def limit(self, n): self.rows = self.rows[:n]; return self
    async def to_list(self, n): return [{k: v for k, v in r.items() if k != "data"} for r in self.rows]


class Coll:
    def __init__(self, unique=None): self.rows, self.unique = [], unique
    def _m(self, q): return [r for r in self.rows if all(r.get(k) == v for k, v in q.items())]
    async def insert_one(self, d):
        if self.unique and any(r[self.unique] == d[self.unique] for r in self.rows): raise DuplicateKeyError("dup")
        d.setdefault("_id", ObjectId()); self.rows.append(d); return SimpleNamespace(inserted_id=d["_id"])
    async def find_one(self, q, proj=None): return (self._m(q) or [None])[0]
    def find(self, q, proj=None): return Cursor(self._m(q))
    async def delete_one(self, q):
        m = self._m(q); [self.rows.remove(r) for r in m[:1]]; return SimpleNamespace(deleted_count=len(m[:1]))


@pytest.fixture(scope="module")
def c():
    srv = HTTPServer(("127.0.0.1", 0), AI); threading.Thread(target=srv.serve_forever, daemon=True).start()
    os.environ.update(JWT_SECRET="test-secret", IMAGE_API_URL=f"http://127.0.0.1:{srv.server_port}/generate")
    import main
    main.users, main.images = Coll("email"), Coll()
    yield TestClient(main.app)
    srv.shutdown()


def signup(c, email):
    return c.post("/api/auth/register", json={"email": email, "password": "longenough1"}).json()["token"]


def test_auth_rules(c):
    assert c.post("/api/auth/register", json={"email": "bad", "password": "longenough1"}).status_code == 400
    assert c.post("/api/auth/register", json={"email": "a@b.co", "password": "short"}).status_code == 400
    signup(c, "dup@b.co")
    assert c.post("/api/auth/register", json={"email": "DUP@b.co", "password": "longenough1"}).status_code == 409
    assert c.post("/api/auth/login", json={"email": "dup@b.co", "password": "wrongwrong"}).status_code == 401
    assert c.post("/api/auth/login", json={"email": "dup@b.co", "password": "longenough1"}).status_code == 200


def test_generate_list_delete_ownership(c):
    me, other = ({"Authorization": "Bearer " + signup(c, e)} for e in ("me@b.co", "other@b.co"))
    assert c.post("/api/generate", json={"prompt": "x"}).status_code == 401
    assert c.post("/api/generate", headers=me, json={"prompt": "  "}).status_code == 400
    r = c.post("/api/generate", headers=me, json={"prompt": "a fox", "steps": 999, "seed": -1})
    assert r.status_code == 201
    img = r.json()
    assert seen["steps"] == 50                                # clamped
    assert isinstance(img["seed"], int) and img["seed"] >= 0  # random seed recorded
    assert c.get(img["url"]).content == PNG
    assert len(c.get("/api/images", headers=me).json()) == 1
    assert len(c.get("/api/images", headers=other).json()) == 0
    assert c.delete("/api/images/" + img["id"], headers=other).status_code == 404
    assert c.delete("/api/images/" + img["id"], headers=me).status_code == 204
    assert c.get(img["url"]).status_code == 404
