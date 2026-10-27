import io, threading, torch
from fastapi import FastAPI, Response
from pydantic import BaseModel, Field
from diffusers import StableDiffusionPipeline

dev = "cuda" if torch.cuda.is_available() else "cpu"
pipe = StableDiffusionPipeline.from_pretrained(
    "stable-diffusion-v1-5/stable-diffusion-v1-5",
    torch_dtype=torch.float16 if dev == "cuda" else torch.float32,
).to(dev)
pipe.load_lora_weights(".", weight_name="pytorch_lora_weights.safetensors")
lock = threading.Lock()  # shortcut: one image at a time, add a queue if you get traffic
app = FastAPI()

class Req(BaseModel):
    prompt: str = Field(min_length=1, max_length=500)
    negative: str = Field("", max_length=500)
    steps: int = Field(25, ge=10, le=50)
    guidance: float = Field(7.5, ge=1, le=15)
    lora_scale: float = Field(1.0, ge=0, le=1.5)
    seed: int = -1

@app.post("/generate")
def generate(r: Req):
    g = torch.Generator(dev).manual_seed(r.seed) if r.seed >= 0 else None
    with lock:
        img = pipe(r.prompt, negative_prompt=r.negative, num_inference_steps=r.steps,
                   guidance_scale=r.guidance, generator=g,
                   cross_attention_kwargs={"scale": r.lora_scale}).images[0]
    buf = io.BytesIO(); img.save(buf, "PNG")
    return Response(buf.getvalue(), media_type="image/png")
