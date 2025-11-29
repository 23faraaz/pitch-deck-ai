import os
from utils.get_env import get_app_data_directory_env, get_database_url_env
from urllib.parse import urlsplit, urlunsplit, parse_qsl
import ssl


def get_database_url_and_connect_args() -> tuple[str, dict]:
    if get_database_url_env():
        database_url = get_database_url_env()
    else:
        db_path = os.path.join(
            get_app_data_directory_env() or "/tmp/decklan", "fastapi.db"
        )
        # Ensure proper SQLite URL format for SQLAlchemy
        # For absolute paths, SQLAlchemy requires 4 slashes: sqlite:////absolute/path
        # This is because SQLAlchemy parses sqlite:///path as a relative path
        # and sqlite:////path as an absolute path starting with /
        db_path = os.path.abspath(db_path)
        if db_path.startswith("/"):
            database_url = (
                "sqlite:///" + db_path
            )  # sqlite:/// + /path = sqlite:////path (4 slashes for absolute)
        else:
            database_url = "sqlite:///" + db_path

    if database_url.startswith("sqlite://"):
        database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("mysql://"):
        database_url = database_url.replace("mysql://", "mysql+aiomysql://", 1)
    else:
        database_url = database_url

    connect_args = {}
    if "sqlite" in database_url:
        connect_args["check_same_thread"] = False

    try:
        split_result = urlsplit(database_url)
        if split_result.query:
            query_params = parse_qsl(split_result.query, keep_blank_values=True)
            driver_scheme = split_result.scheme
            for k, v in query_params:
                key_lower = k.lower()
                if key_lower == "sslmode" and "postgresql+asyncpg" in driver_scheme:
                    if v.lower() != "disable" and "sqlite" not in database_url:
                        connect_args["ssl"] = ssl.create_default_context()

            database_url = urlunsplit(
                (
                    split_result.scheme,
                    split_result.netloc,
                    split_result.path,
                    "",
                    split_result.fragment,
                )
            )
    except Exception:
        pass

    return database_url, connect_args
