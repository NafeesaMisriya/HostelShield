import os

class Settings:
    PROJECT_NAME: str = "Smart Hostel Visitor Management System"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_hostel_key_2026_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    OVERSTAY_LIMIT_MINUTES: int = 240  # 4 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hostel_visitor.db")

settings = Settings()
