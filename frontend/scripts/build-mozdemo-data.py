#!/usr/bin/env python3
"""Precompute the mozdemo worked examples to static JSON (frontend/public/mozdemo-data).

Thin wrapper over the backend engine (the single source of truth for the three panels,
both project attributions, and the V-binding). Adds per-commit metadata (author + verbatim
first message line, via the commit-object API) for display. Never fabricates.
"""
import json
import os
import re
import subprocess
import sys
import urllib.request

# import the engine from the backend (one implementation for static + live)
sys.path.insert(0, os.path.expanduser("~/swsc/worldofcode.org/backend"))
from woc_backend.mozdemo.engine import analyze, VER  # noqa: E402

API = "http://localhost:38580"
OUT = os.path.expanduser("~/swsc/worldofcode.org/frontend/public/mozdemo-data")

# Curated worked examples — distinct libwebrtc vendor bumps with rich fix fragmentation.
EXAMPLES = [
    "ce01c5611ac88355310806ec8fa28ebdaaf5ce13",  # decision_logic.cc — integer overflow (7 variants)
    "049bf99e5f4f05cfb749ccd444d99d5dedd98d2e",  # openssl_stream_adapter — TLS/SSL (9 variants)
    "1bde75eebbbd56042a53d9e620a65c33383bc817",  # rtp_sender.h — RTP (9 variants)
]


def commit_meta(commit):
    try:
        with urllib.request.urlopen(f"{API}/lookup/object/commit/{commit}", timeout=15) as r:
            d = json.load(r)["data"]
        line = d[4].split("\n")[0].strip()
        bug = (re.search(r"Bug\s+(\d+)", line) or [None, None])[1]
        return {"author": d[2][0], "message_line": line or None, "bug": bug}
    except Exception:
        return {"author": None, "message_line": None, "bug": None}


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    host = subprocess.run(["hostname"], capture_output=True, text=True).stdout.strip()
    examples = []
    for c in EXAMPLES:
        e = analyze(c)
        e.update(commit_meta(c))
        examples.append(e)
    doc = {
        "version": VER, "generated_on": host,
        "snapshot_note": (f"Bound to WoC {VER}. The batch prototype used V2510; V2604 reproduces "
                          "its structure and surfaces later fix variants."),
        "examples": examples,
    }
    with open(os.path.join(OUT, "examples.json"), "w") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=False)
    print(f"wrote examples.json — {len(examples)} examples, {os.path.getsize(os.path.join(OUT,'examples.json'))} bytes")
    for e in examples:
        fl = e["files"][0] if e["files"] else {}
        pa = fl.get("panel_a", {})
        print(f"  {e.get('label','?'):26s} {e['commit'][:10]} files={len(e['files'])} "
              f"variants={pa.get('variant_count')} gap={pa.get('gap_days_from_upstream')}d/"
              f"{pa.get('gap_days_from_first_downstream')}d")
