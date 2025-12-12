from fastapi import FastAPI, HTTPException
from sqlmodel import Field, SQLModel, Session, create_engine, select
from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    neon_db_url: str

settings = Settings(_env_file=None)

engine = create_engine(settings.neon_db_url, echo=False, future=True)

# ---------- Models ----------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str
    full_name: Optional[str] = None

SQLModel.metadata.create_all(engine)  # creates table if missing

# ---------- FastAPI ----------
app = FastAPI(title="Melobase API")

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

@app.get("/")
def home():
    return {
        "message": "Melobase API + Neon live in Europe",
        "db": "connected",
        "docs": "/docs"
    }

@app.post("/users/", response_model=User)
def create_user(user: User):
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

@app.get("/users/{user_id}", response_model=User)
def read_user(user_id: int):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

@app.get("/users/")
def read_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return users
