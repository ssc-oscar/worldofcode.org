#!/usr/bin/env python3
"""Precompute the mozdemo worked examples (Mozilla updatebot scenarios) to static JSON.

For each Firefox backport commit SHA, resolve the three panels from WoC maps via the
getValues CLI (the reliable path on da2). Bound to VER. Output:
    frontend/public/mozdemo-data/examples.json

Panels (per changed source file):
  (a) when the upstream fix landed + the "fixed N ways" variant table
  (b) known-fixed project count + honest b2P-freshness degradation
  (c) who took Firefox's exact blob vs a different (consensus) fix variant
Never fabricates: a failed/empty lookup is recorded as such.
"""
import subprocess, os, sys, json, datetime, re

GV = os.path.expanduser("~/lookup/getValues")
API = "http://localhost:38580"
VER = "V2604"
OUT = os.path.expanduser("~/swsc/worldofcode.org/frontend/public/mozdemo-data")
README = ("README.mozilla", "README.moz-ff-commit")  # vendoring bookkeeping, not source

# Curated worked examples (extend as more backport SHAs are confirmed).
EXAMPLES = ["ce01c5611ac88355310806ec8fa28ebdaaf5ce13"]

def gv(map_, key, ver=VER):
    try:
        out = subprocess.run([GV, map_, ver], input=key + "\n", capture_output=True,
                             text=True, timeout=90).stdout.strip()
    except Exception:
        return []
    if not out:
        return []
    parts = [p.replace("\x00", "").strip() for p in out.split(";")]
    return parts[1:] if parts and parts[0] == key else parts

def triples(fields, n=3):
    return [tuple(fields[i:i + n]) for i in range(0, len(fields) - n + 1, n)]

def ts_to_dt(s):
    s = s.strip()
    return datetime.datetime.utcfromtimestamp(int(s)) if s.isdigit() else None

def commit_dt(commit):
    f = gv("c2dat", commit)
    return ts_to_dt(f[0]) if f else None

RAW_CAP = 80  # cap raw-project lists in the JSON (counts are always exact)

def projects_of(commit, deforked=True):
    return {p for p in gv("c2P" if deforked else "c2p", commit) if p}

def attribution(commits):
    """Project attribution for a set of commits, both deforked (c2P) and raw (c2p)."""
    dedf, raw = set(), set()
    for c in commits:
        dedf |= projects_of(c, True)
        raw |= projects_of(c, False)
    rl = sorted(raw)
    return {"deforked": sorted(dedf), "deforked_count": len(dedf),
            "raw": rl[:RAW_CAP], "raw_count": len(raw), "raw_truncated": len(raw) > RAW_CAP}

def commit_meta(commit):
    """author + verbatim first message line via the commit-object API (labeled, not fabricated)."""
    try:
        import urllib.request
        with urllib.request.urlopen(f"{API}/lookup/object/commit/{commit}", timeout=15) as r:
            d = json.load(r)["data"]
        author = d[2][0]
        msg = d[4].split("\n")[0].strip()
        bug = (re.search(r"Bug\s+(\d+)", msg) or [None, None])[1]
        return {"author": author, "message_line": msg, "bug": bug}
    except Exception:
        return {"author": None, "message_line": None, "bug": None}

LIBPIXMAN_NOTE = ("Still-exposed enumeration needs a fresh b2P (blob->project). b2P V..V2605 "
                  "do not index these Nov-2023 blobs, so the never-fixed set can't be listed "
                  "here yet - the near-real-time thrust builds exactly this map. Proven end to "
                  "end on libpixman/CVE-2022-44638: 662 projects still carried the pre-fix blob.")

def analyze(commit):
    meta = commit_meta(commit)
    cdt = commit_dt(commit)
    cf = triples(gv("c2fbb", commit))
    files_src = [t for t in cf if not any(t[0].endswith(r) for r in README)]
    files = []
    for path, old, new in files_src:
        rev = triples(gv("bb2cf", old))  # (new_blob, fix_commit, path)
        variants = {}
        for nb, fc, _ in rev:
            v = variants.setdefault(nb, {"new_blob": nb, "commits": set(), "dates": []})
            v["commits"].add(fc)
        for v in variants.values():
            for fc in v["commits"]:
                d = commit_dt(fc)
                if d:
                    v["dates"].append(d)
            v["proj"] = attribution(v["commits"])

        def vrec(v):
            return {"new_blob": v["new_blob"] or None, "deleted": not v["new_blob"],
                    "commits": len(v["commits"]), "proj": v["proj"],
                    "first_date": min(v["dates"]).date().isoformat() if v["dates"] else None,
                    "is_firefox": v["new_blob"] == new}
        # rank by deforked count (report-consistent), then raw, then commits
        vlist = sorted((vrec(v) for v in variants.values()),
                       key=lambda x: (x["proj"]["deforked_count"], x["proj"]["raw_count"], x["commits"]), reverse=True)

        bf = gv("b2fa", new)
        first = ts_to_dt(bf[0]) if bf else None
        first_author = bf[1].strip() if len(bf) > 1 else None
        ff = next((v for v in vlist if v["is_firefox"]), None)
        first_downstream = ff["first_date"] if ff else None
        gap_up = (cdt.date() - first.date()).days if (cdt and first) else None
        gap_down = (cdt.date() - datetime.date.fromisoformat(first_downstream)).days if (cdt and first_downstream) else None

        consensus = next((v for v in vlist if not v["deleted"] and not v["is_firefox"]), None)
        all_commits = {c for v in variants.values() for c in v["commits"]}
        other_commits = {c for v in variants.values() if v["new_blob"] and v["new_blob"] != new for c in v["commits"]}

        files.append({
            "path": path, "old_blob": old, "firefox_new_blob": new,
            "panel_a": {
                "fix_first_appeared": first.isoformat() if first else None,
                "fix_first_author": first_author,
                "first_downstream_date": first_downstream,
                "gap_days_from_upstream": gap_up,
                "gap_days_from_first_downstream": gap_down,
                "variant_count": len(vlist),
                "variants": vlist,
            },
            "panel_b": {
                "known_fixed": attribution(all_commits),
                "still_exposed_available": False,
                "note": LIBPIXMAN_NOTE,
            },
            "panel_c": {
                "firefox_blob": new,
                "firefox_adopters": ff["proj"] if ff else attribution(set()),
                "consensus_blob": consensus["new_blob"] if consensus else None,
                "consensus_adopters": consensus["proj"] if consensus else attribution(set()),
                "other_variant_adopters": attribution(other_commits),
            },
        })
    return {"commit": commit, "commit_date": cdt.isoformat() if cdt else None, **meta, "files": files}


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    host = subprocess.run(["hostname"], capture_output=True, text=True).stdout.strip()
    examples = [analyze(c) for c in EXAMPLES]
    doc = {
        "version": VER, "generated_on": host,
        "snapshot_note": (f"Bound to WoC {VER} (March 2026 snapshot). The batch prototype used "
                          "V2510; V2604 reproduces its structure and may surface later variants."),
        "examples": examples,
    }
    with open(os.path.join(OUT, "examples.json"), "w") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=False)
    e = examples[0]; fl = e["files"][0] if e["files"] else {}
    pa = fl.get("panel_a", {})
    print(f"wrote examples.json ({len(examples)} example) — {os.path.getsize(os.path.join(OUT,'examples.json'))} bytes")
    kf = fl.get("panel_b", {}).get("known_fixed", {})
    print(f"  {e['commit'][:12]} '{e.get('message_line')}'")
    print(f"  file {fl.get('path','?').split('/')[-1]}: {pa.get('variant_count')} variants, "
          f"gap {pa.get('gap_days_from_upstream')}d/{pa.get('gap_days_from_first_downstream')}d, "
          f"known-fixed deforked={kf.get('deforked_count')} raw={kf.get('raw_count')}")
