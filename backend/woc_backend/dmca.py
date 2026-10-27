"""DMCA serve-blocklist gate.

A FastAPI dependency that blocks retrieval of specific object SHAs at the serve
layer, BEFORE any underlying store (.tch / da8) is touched. For a legal takedown
we return **410 Gone** (permanent removal), not 404.

The underlying stores are NOT modified here — da2's job is only to stop serving.
Data-layer removal on da8 is a separate coordination task.

- Blocklist file (`WOC_DMCA_BLOCKLIST`, default `/etc/woc-dmca/blocklist.txt`) is
  re-read on every request so SHAs can be added without a restart. One 40-hex SHA
  per line; `#` comments and blank lines ignored; the first whitespace token of a
  line is taken (so inline `sha  # note` works).
- Every blocked request is logged (UTC timestamp, source IP, requested SHA, path)
  to loguru (stdout → docker logs) and appended as JSON to `WOC_DMCA_LOG`
  (default `/etc/woc-dmca/log/blocklog.jsonl`) for the UTK-side records.
"""
import json
import os
import time

from fastapi import HTTPException, Request
from loguru import logger

BLOCKLIST_PATH = os.environ.get("WOC_DMCA_BLOCKLIST", "/etc/woc-dmca/blocklist.txt")
LOG_PATH = os.environ.get("WOC_DMCA_LOG", "/etc/woc-dmca/log/blocklog.jsonl")

_HEX = frozenset("0123456789abcdef")
# Fallback 410 body if the blocklist file has no "# message:" header line.
# "<sha>" is replaced with the blocked SHA(s) at response time.
_DEFAULT_MSG = (
    "Object <sha> is no longer served: removed in response to a DMCA takedown "
    "notice. To dispute, contact audris@utk.edu."
)


def _is_sha(tok: str) -> bool:
    return len(tok) == 40 and all(c in _HEX for c in tok)


def _load_config() -> "tuple[set[str], str]":
    """Read the blocklist fresh each call (tiny file). Returns (shas, message).

    A line ``# message: <text>`` sets the 410 body template; ``<sha>`` in it is
    substituted with the blocked SHA(s) at response time. This lets the wording be
    reworded live (no rebuild/restart). Other ``#`` lines are plain comments.
    Missing file => (empty set, default message).
    """
    shas: "set[str]" = set()
    msg = _DEFAULT_MSG
    try:
        with open(BLOCKLIST_PATH, "r") as f:
            for line in f:
                raw = line.strip()
                if not raw:
                    continue
                if raw.startswith("#"):
                    body = raw[1:].strip()
                    if body.lower().startswith("message:"):
                        text = body[len("message:"):].strip()
                        if text:
                            msg = text
                    continue
                tok = raw.split()[0].lower()
                if _is_sha(tok):
                    shas.add(tok)
    except FileNotFoundError:
        pass
    except Exception as e:  # never let blocklist IO errors 500 a normal request
        logger.error(f"DMCA blocklist read failed ({BLOCKLIST_PATH}): {e}")
    return shas, msg


def _candidate_shas(request: Request) -> "set[str]":
    """All 40-hex tokens in the request's path params and query values.

    Covers single-key paths (/object/{type}/{key}, /map/{map}/{key}), batch `?q=`
    (comma- or space-joined), and any other sha-bearing query param (e.g. mozdemo
    ?commit=). Matching only ever adds a block when the token equals a listed SHA,
    so scanning broadly is safe.
    """
    cands: "set[str]" = set()
    for v in request.path_params.values():
        if isinstance(v, str):
            cands.add(v.strip().lower())
    for _, v in request.query_params.multi_items():
        for part in v.replace(",", " ").split():
            cands.add(part.strip().lower())
    return {c for c in cands if _is_sha(c)}


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "?"


def _log_block(request: Request, sha: str) -> None:
    ip = _client_ip(request)
    rec = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "ip": ip,
        "sha": sha,
        "method": request.method,
        "path": request.url.path,
    }
    logger.warning(f"DMCA-BLOCK sha={sha} ip={ip} path={request.url.path}")
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a") as f:
            f.write(json.dumps(rec) + "\n")
    except Exception as e:
        logger.error(f"DMCA log write failed ({LOG_PATH}): {e}")


async def dmca_gate(request: Request) -> None:
    """Router dependency: 410 if the request targets a blocklisted SHA."""
    blocklist, msg_template = _load_config()
    if not blocklist:
        return
    hits = _candidate_shas(request) & blocklist
    if hits:
        ordered = sorted(hits)
        for sha in ordered:
            _log_block(request, sha)
        detail = msg_template.replace("<sha>", ", ".join(ordered))
        raise HTTPException(status_code=410, detail=detail)
