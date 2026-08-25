from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./terpschedule.db"
    TESTUDO_BASE_URL: str = "https://app.testudo.umd.edu/soc"
    PLANETTERP_BASE_URL: str = "https://planetterp.com/api/v1"
    DEFAULT_TERM: str = "202608"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    CACHE_MAX_SIZE: int = 256
    CACHE_TTL: int = 3600
    OPTIMIZER_TIMEOUT_MS: int = 250
    BEAM_SEARCH_THRESHOLD: int = 1_000_000
    DEFAULT_WALK_MINUTES: int = 10

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
