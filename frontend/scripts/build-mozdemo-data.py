#!/usr/bin/env python3
"""Precompute the mozdemo worked examples to static JSON (frontend/public/mozdemo-data).

Thin wrapper over the backend engine (single source of truth), using python-woc against the
production profile (/home/wocprofile.json) — the same reader the live API container uses, so
static and live results are identical. Adds per-commit metadata (author + verbatim first
message line). Never fabricates.
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.expanduser("~/swsc/worldofcode.org/backend"))
from woc.local import WocMapsLocal  # noqa: E402
from woc_backend.mozdemo.engine import analyze  # noqa: E402

WOCPROFILE = os.environ.get("WOCPROFILE", "/home/wocprofile.json")
OUT = os.path.expanduser("~/swsc/worldofcode.org/frontend/public/mozdemo-data")

# Curated worked examples — distinct libwebrtc vendor bumps with rich fix fragmentation.
EXAMPLES = [
    "ce01c5611ac88355310806ec8fa28ebdaaf5ce13",  # decision_logic.cc — integer overflow
    "049bf99e5f4f05cfb749ccd444d99d5dedd98d2e",  # openssl_stream_adapter — TLS/SSL
    "1bde75eebbbd56042a53d9e620a65c33383bc817",  # rtp_sender.h — RTP
]

woc = WocMapsLocal(WOCPROFILE)


def commit_meta(commit):
    try:
        c = woc.show_content("commit", commit)  # (tree, parent, (author,ts,tz), (committer,..), message)
        line = c[4].split("\n")[0].strip()
        bug = (re.search(r"Bug\s+(\d+)", line) or [None, None])[1]
        return {"author": c[2][0], "message_line": line or None, "bug": bug}
    except Exception:
        return {"author": None, "message_line": None, "bug": None}


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    host = subprocess.run(["hostname"], capture_output=True, text=True).stdout.strip()
    examples = []
    for c in EXAMPLES:
        e = analyze(c, woc)
        e.update(commit_meta(c))
        examples.append(e)
    ver = examples[0]["version"] if examples else "?"
    doc = {
        "version": ver, "generated_on": host,
        "snapshot_note": (f"Computed from the WoC production maps (bb2cf {ver}) via python-woc — "
                          "the same reader the live analysis uses. Counts are lower bounds."),
        "examples": examples,
    }
    with open(os.path.join(OUT, "examples.json"), "w") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=False)
    print(f"wrote examples.json — {len(examples)} examples, bb2cf {ver}, "
          f"{os.path.getsize(os.path.join(OUT,'examples.json'))} bytes")
    for e in examples:
        fl = e["files"][0] if e["files"] else {}
        pa = fl.get("panel_a", {})
        print(f"  {e.get('label','?'):26s} {e['commit'][:10]} files={len(e['files'])} "
              f"variants={pa.get('variant_count')} gap={pa.get('gap_days_from_upstream')}d/"
              f"{pa.get('gap_days_from_first_downstream')}d")
