from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "AdaptIQ AI API"
    environment: str = os.getenv("ENVIRONMENT", "development")
    allowed_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    )
    ai_demo_mode: bool = os.getenv("AI_DEMO_MODE", "false").strip().lower() in {"1", "true", "yes", "on"}
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    ai_timeout_seconds: float = float(os.getenv("AI_TIMEOUT_SECONDS", "45"))
    supabase_url: str | None = os.getenv("SUPABASE_URL")
    supabase_service_role_key: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


settings = Settings()
