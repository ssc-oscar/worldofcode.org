"""mozdemo live API — analyze an arbitrary Firefox backport commit.

GET /mozdemo/analyze?commit=<40-hex sha1>  ->  the same three-panel structure the
static worked examples use (see frontend/public/mozdemo-data). Results are memoised.
Commit metadata (author + verbatim first message line) is read via python-woc.
"""
import re

from fastapi import APIRouter, HTTPException, Request

from ..models import WocResponse
from .engine import analyze

api = APIRouter()
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def _cache(request: Request):
    return getattr(request.app.state, "lookup_cache", None)


def _commit_meta(request: Request, commit: str):
    """author + verbatim first message line via python-woc (labeled, not fabricated)."""
    try:
        woc = request.app.state.woc
        tree, parent, author, committer, message = woc.show_content("commit", commit)
        line = (message or "").split("\n")[0].strip()
        m = re.search(r"Bug\s+(\d+)", line)
        return {"author": author[0] if isinstance(author, (list, tuple)) else author,
                "message_line": line or None, "bug": m.group(1) if m else None}
    except Exception:
        return {"author": None, "message_line": None, "bug": None}


@api.get("/analyze", response_model=WocResponse, response_model_exclude_none=True)
def analyze_commit(request: Request, commit: str):
    """Analyze a Firefox backport commit for the three updatebot scenarios."""
    commit = commit.strip().lower()
    if not SHA_RE.match(commit):
        raise HTTPException(status_code=400, detail="commit must be a 40-char lowercase hex sha1")

    cache = _cache(request)
    ckey = f"mozdemo:{commit}"
    if cache is not None:
        hit = cache.get(ckey)
        if hit is not None:
            return WocResponse(data=hit)

    try:
        data = analyze(commit, request.app.state.woc)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"map lookup failed: {e}")

    if not data.get("files"):
        raise HTTPException(status_code=404, detail=f"{commit} touches no vendored source file we can trace")

    data.update(_commit_meta(request, commit))
    if cache is not None:
        cache.put(ckey, data, ttl=3600)
    return WocResponse(data=data)
