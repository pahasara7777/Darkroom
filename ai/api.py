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
