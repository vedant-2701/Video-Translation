import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the .env file in the parent directory
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND")
    STORAGE_PATH: str = os.getenv("STORAGE_PATH", "./storage")

settings = Settings()