from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Field, SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from pydantic_settings import BaseSettings
from typing import Optional, AsyncGenerator # Added AsyncGenerator for typing

class Settings(BaseSettings):
    neon_db_url: str

settings = Settings()

# FIX: Force the URL to use the async driver
# Old/Current version
# New/Fixed version
connection_string = str(settings.neon_db_url).replace(
    "postgresql://", "postgresql+asyncpg://"
).replace("?sslmode=require", "")  # <--- Removes the crashing part

engine = create_async_engine(
    connection_string, 
    connect_args={"ssl": "require"},  # <--- Re-adds SSL in a way asyncpg understands
    echo=False, 
    future=True
)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str
    full_name: Optional[str] = None

# --- DELETE THIS LINE BELOW ---
# SQLModel.metadata.create_all(bind=engine) 
# ------------------------------

app = FastAPI(title="Melobase API")

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSession(engine) as session:
        yield session

# Note: on_event is deprecated in newer FastAPI versions, consider lifespan context managers, 
# but this will still work for now.
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # This is the CORRECT way to create tables with an async engine
        await conn.run_sync(SQLModel.metadata.create_all)

@app.get("/")
def home():
    return {"message": "Melobase API + Neon LIVE", "docs": "/docs"}

@app.post("/users/", response_model=User)
async def create_user(user: User, session: AsyncSession = Depends(get_session)):
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@app.get("/users/{user_id}", response_model=User)
async def read_user(user_id: int, session: AsyncSession = Depends(get_session)):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/")
async def read_users(session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(User))
    return result.all()