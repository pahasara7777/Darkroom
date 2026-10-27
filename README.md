# Darkroom

MERN image-generation site: React (Vite + Tailwind) client, Express + MongoDB server, and a Python service that runs Stable Diffusion 1.5 with your LoRA.

## Run it (three terminals)

1. **AI service** (needs an NVIDIA GPU for usable speed)
   ```
   cd ai && pip install -r requirements.txt && uvicorn api:app --port 8000
   ```
   `pytorch_lora_weights.safetensors` must sit in `ai/`. First start downloads the ~4 GB base model.
2. **Server** (needs MongoDB running, Node 22+)
   ```
   cd server && cp .env.example .env   # set JWT_SECRET to a long random string
   npm install && npm run dev
   ```
3. **Client**
   ```
   cd client && npm install && npm run dev   # http://localhost:5173
   ```

## Production
`cd client && npm run build`, then `cd server && npm start`. Express serves the built client and `/uploads` on one port.

## Notes
- Rename the site in `client/src/brand.js` and `client/index.html`.
- Generated images are saved to `server/uploads/` on local disk. Move to S3 or similar before hosting on a platform with temporary disk.
- The AI service makes one image at a time. The server allows 6 generations per minute per user.
- Tests: `cd server && npm test` (uses a fake database, not real MongoDB).
