"""Application configuration via environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "Cogniqs"
    APP_VERSION: str = "0.0.4"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    DATABASE_URL: str = "sqlite+aiosqlite:///./cogniqs.db"
    DB_ECHO: bool = False

    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ENCRYPTION_KEY: str = ""

    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4o-mini"

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    MISTRAL_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    CHROMA_PERSIST_DIR: str = "./chroma_data"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # ── ML / AutoGluon ──────────────────────────────────────────────────
    DATASET_STORAGE_DIR: str = "./data/datasets"
    MODEL_STORAGE_DIR: str = "./data/models"
    TRAINING_STAGING_DIR: str = "./data/training"
    AUTO_INSTALL_ML: bool = True
    DEFAULT_TRAINING_TIME_LIMIT: int = 300
    KAGGLE_USERNAME: str = ""
    KAGGLE_KEY: str = ""
    AZUREML_SUBSCRIPTION_ID: str = ""
    AZUREML_RESOURCE_GROUP: str = ""
    AZUREML_WORKSPACE: str = ""

    DEFAULT_NODE_TIMEOUT: int = 300
    MAX_WORKFLOW_NODES: int = 200

    REDIS_URL: str = ""
    SESSION_TTL_SECONDS: int = 3600

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL


settings = Settings()
