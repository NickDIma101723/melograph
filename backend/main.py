from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Field, SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.engine.url import make_url # <--- Added this import
from pydantic_settings import BaseSettings
from typing import Optional, AsyncGenerator

class Settings(BaseSettings):
    neon_db_url: str

settings = Settings()

# --- FIX START: robustly handle the connection string ---
# 1. Parse the string into a URL object
url = make_url(settings.neon_db_url)

# 2. Switch the driver to asyncpg
url = url.set(drivername="postgresql+asyncpg")

# 3. Remove ALL query parameters (sslmode, channel_binding, etc)
#    This guarantees no junk is left at the end of the database name.
url = url.set(query={})

# 4. Create the engine, passing SSL explicitly
engine = create_async_engine(
    url,
    connect_args={"ssl": "require"}, 
    echo=False, 
    future=True
)
# --- FIX END ---

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str
    full_name: Optional[str] = None

app = FastAPI(title="Melobase API")

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSession(engine) as session:
        yield session

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
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