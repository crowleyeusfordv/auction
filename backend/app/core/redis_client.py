import os

from dotenv import load_dotenv
from redis.asyncio import Redis
from redis.asyncio.connection import BlockingConnectionPool


load_dotenv()

redis_client: Redis | None = None


def get_redis_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


def get_redis_max_connections() -> int:
    return int(os.getenv("REDIS_MAX_CONNECTIONS", "500"))


def get_redis_pool_timeout() -> int:
    return int(os.getenv("REDIS_POOL_TIMEOUT", "10"))


async def init_redis() -> Redis:
    global redis_client

    pool = BlockingConnectionPool.from_url(
        get_redis_url(),
        encoding="utf-8",
        decode_responses=True,
        max_connections=get_redis_max_connections(),
        timeout=get_redis_pool_timeout(),
        socket_connect_timeout=5,
        socket_timeout=5,
        health_check_interval=30,
    )
    client = Redis(connection_pool=pool)

    try:
        await client.ping()
    except Exception:
        await client.aclose()
        raise

    redis_client = client
    return redis_client


def get_redis() -> Redis:
    if redis_client is None:
        raise RuntimeError("Redis client is not initialized")

    return redis_client


async def redis_healthcheck() -> bool:
    return await get_redis().ping()


async def close_redis() -> None:
    global redis_client

    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None
