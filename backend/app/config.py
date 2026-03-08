from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    SECRET_KEY: str = "change-this-secret-key-before-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    WATCARD_VERIFICATION_ENABLED: bool = False
    VISION_API_KEY: str = ""
    VISION_API_PROVIDER: str = "claude"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://uwengnetwork.vercel.app"
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"


settings = Settings()
