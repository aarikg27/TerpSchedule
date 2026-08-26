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
    DATA_REFRESH_HOURS: int = 6
    WALKING_REFRESH_DAYS: int = 30
    METRICS_REFRESH_DAYS: int = 14
    AUTO_SYNC_DEPARTMENTS: list[str] = ["CMSC", "MATH", "STAT", "ENGL", "PHYS", "BMGT", "COMM", "PSYC"]
    UMD_BUILDINGS_URL: str = "https://services9.arcgis.com/1rOwFRpAwrxe0rBl/arcgis/rest/services/CampusMapDefault_NoInsite/FeatureServer/0/query"
    ADMIN_SYNC_TOKEN: str | None = None
    CONTACT_EMAIL: str = "replace-me@example.com"
    RATE_LIMIT_PER_MINUTE: int = 60
    OPTIMIZE_RATE_LIMIT_PER_MINUTE: int = 15

    @property
    def outbound_user_agent(self) -> str:
        return f"TerpSchedule/1.0 (+mailto:{self.CONTACT_EMAIL})"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
