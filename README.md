# Darkroom

AI image-generation site: React (Vite + Tailwind) client, FastAPI + MongoDB server, and a Python service that runs Stable Diffusion 1.5 with your LoRA.

## Run it (three terminals)

1. **AI service** (needs an NVIDIA GPU for usable speed)
   ```
   cd model && pip install -r requirements.txt && uvicorn api:app --port 8000
   ```
   `pytorch_lora_weights.safetensors` must sit in `model/`. First start downloads the ~4 GB base model.
2. **Server** (FastAPI, needs MongoDB running, Python 3.11+)
   ```
   cd server && pip install -r requirements.txt
   JWT_SECRET=<long random string> uvicorn main:app --port 5000
   ```
   Optional env: `MONGO_URI` (default local), `IMAGE_API_URL` (default `http://127.0.0.1:8000/generate`).
3. **Client**
   ```
   cd client && npm install && npm run dev   # http://localhost:5173
   ```

## Production
Deploys to Vercel: `vercel.json` builds the client and serves the FastAPI app from `api/index.py`. Set `JWT_SECRET`, `MONGO_URI` and `IMAGE_API_URL` in the project settings. The AI service needs a GPU, so run it elsewhere (e.g. Colab) and point `IMAGE_API_URL` at it.

## Notes
- Rename the site in `client/src/brand.js` and `client/index.html`.
- Generated images are stored in MongoDB (Atlas free tier is 512 MB). Move to object storage when it fills.
- The AI service makes one image at a time. The server allows 6 generations per minute per user.
- Tests: `cd server && pytest` (uses fake collections, not real MongoDB).
