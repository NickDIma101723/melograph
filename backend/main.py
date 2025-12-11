from fastapi import FastAPI
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    neon_db_url: str = "postgres://will-be-replaced-by-secret"

settings = Settings()

app = FastAPI(title="My FastAPI on Cloud Run")

@app.get("/")
def home():
    return {"Hello": "World", "deployed": "Google Cloud Run + Neon"}

@app.get("/health")
def health():
    return {"status": "healthy"}
