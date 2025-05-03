import time

from loguru import logger


async def cleanup_tokens():
    from ..auth.models import OneTimeCode, Token

    r = await Token.find(
        {"$or": [{"revoked": True}, {"expires": {"$lt": int(time.time() - 10)}}]}
    ).delete()
    logger.info(f"Deleted {r.deleted_count} tokens")
    r = await OneTimeCode.find(
        {"$or": [{"revoked": True}, {"expires": {"$lt": int(time.time() - 10)}}]}
    ).delete()
    logger.info(f"Deleted {r.deleted_count} one-time codes")
