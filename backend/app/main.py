import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine

# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

from app.routers import auth, messages, notifications, posts, professors, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "watcards"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "posts"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "profiles"), exist_ok=True)
    yield


app = FastAPI(title="UW Engineering Network API", lifespan=lifespan)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(professors.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "UW Engineering Network API"}


# Mount uploads directory for static file serving.
# Must come after route definitions so /uploads doesn't shadow any routes.
uploads_dir = settings.UPLOAD_DIR.lstrip("./")
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
