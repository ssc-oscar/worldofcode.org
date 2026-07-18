"""mozdemo query engine — Firefox backport commit -> three updatebot-scenario panels.

Mirrors frontend/scripts/build-mozdemo-data.py (keep in sync). Reads WoC maps via the
getValues CLI (the reliable path on da2; the HTTP map API 500s on compound bb2cf and
python-woc's default profile can't locate the shard files). Bound to VER. Never fabricates.

Both project attributions are computed: deforked (c2P, forks collapsed to one canonical
project) and raw (c2p, every repository). Set env WOC_GETVALUES / MOZDEMO_VER to override.
"""
import os
import re
import subprocess
import datetime

GV = os.environ.get("WOC_GETVALUES", os.path.expanduser("~/lookup/getValues"))
GV_HOME = os.path.dirname(os.path.dirname(GV))  # e.g. /home/audris (so root finds the profile)
GV_CWD = os.path.dirname(GV)                     # e.g. /home/audris/lookup
VER = os.environ.get("MOZDEMO_VER", "V2604")
README = ("README.mozilla", "README.moz-ff-commit")  # vendoring bookkeeping, not source
RAW_CAP = 80
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def gv(map_, key, ver=VER):
    try:
        out = subprocess.run(
            [GV, map_, ver], input=key + "\n", capture_output=True, text=True,
            timeout=90, cwd=GV_CWD, env={**os.environ, "HOME": GV_HOME},
        ).stdout.strip()
    except Exception:
        return []
    if not out:
        return []
    parts = [p.replace("\x00", "").strip() for p in out.split(";")]
    return parts[1:] if parts and parts[0] == key else parts


def _triples(f, n=3):
    return [tuple(f[i:i + n]) for i in range(0, len(f) - n + 1, n)]


def _ts(s):
    s = s.strip()
    return datetime.datetime.utcfromtimestamp(int(s)) if s.isdigit() else None


def _commit_dt(commit):
    f = gv("c2dat", commit)
    return _ts(f[0]) if f else None


def _projects(commit, deforked=True):
    return {p for p in gv("c2P" if deforked else "c2p", commit) if p}


def _attribution(commits):
    dedf, raw = set(), set()
    for c in commits:
        dedf |= _projects(c, True)
        raw |= _projects(c, False)
    rl = sorted(raw)
    return {"deforked": sorted(dedf), "deforked_count": len(dedf),
            "raw": rl[:RAW_CAP], "raw_count": len(raw), "raw_truncated": len(raw) > RAW_CAP}


LIBPIXMAN_NOTE = ("Still-exposed enumeration needs a fresh b2P (blob->project). b2P V..V2605 "
                  "do not index these Nov-2023 blobs, so the never-fixed set can't be listed "
                  "here yet - the near-real-time thrust builds exactly this map. Proven end to "
                  "end on libpixman/CVE-2022-44638: 662 projects still carried the pre-fix blob.")


def analyze(commit):
    """Return {commit, commit_date, version, files:[...three panels...]} or raise ValueError."""
    if not SHA_RE.match(commit):
        raise ValueError("commit must be a 40-char lowercase hex sha1")
    cdt = _commit_dt(commit)
    cf = _triples(gv("c2fbb", commit))
    files_src = [t for t in cf if not any(t[0].endswith(r) for r in README)]
    files = []
    for path, old, new in files_src:
        variants = {}
        for nb, fc, _ in _triples(gv("bb2cf", old)):
            variants.setdefault(nb, {"new_blob": nb, "commits": set(), "dates": []})["commits"].add(fc)
        for v in variants.values():
            for fc in v["commits"]:
                d = _commit_dt(fc)
                if d:
                    v["dates"].append(d)
            v["proj"] = _attribution(v["commits"])

        def vrec(v):
            return {"new_blob": v["new_blob"] or None, "deleted": not v["new_blob"],
                    "commits": len(v["commits"]), "proj": v["proj"],
                    "first_date": min(v["dates"]).date().isoformat() if v["dates"] else None,
                    "is_firefox": v["new_blob"] == new}
        vlist = sorted((vrec(v) for v in variants.values()),
                       key=lambda x: (x["proj"]["deforked_count"], x["proj"]["raw_count"], x["commits"]),
                       reverse=True)

        bf = gv("b2fa", new)
        first = _ts(bf[0]) if bf else None
        first_author = bf[1].strip() if len(bf) > 1 else None
        ff = next((v for v in vlist if v["is_firefox"]), None)
        first_downstream = ff["first_date"] if ff else None
        gap_up = (cdt.date() - first.date()).days if (cdt and first) else None
        gap_down = ((cdt.date() - datetime.date.fromisoformat(first_downstream)).days
                    if (cdt and first_downstream) else None)
        consensus = next((v for v in vlist if not v["deleted"] and not v["is_firefox"]), None)
        all_c = {c for v in variants.values() for c in v["commits"]}
        other_c = {c for v in variants.values() if v["new_blob"] and v["new_blob"] != new for c in v["commits"]}

        files.append({
            "path": path, "old_blob": old, "firefox_new_blob": new,
            "panel_a": {"fix_first_appeared": first.isoformat() if first else None,
                        "fix_first_author": first_author, "first_downstream_date": first_downstream,
                        "gap_days_from_upstream": gap_up, "gap_days_from_first_downstream": gap_down,
                        "variant_count": len(vlist), "variants": vlist},
            "panel_b": {"known_fixed": _attribution(all_c), "still_exposed_available": False,
                        "note": LIBPIXMAN_NOTE},
            "panel_c": {"firefox_blob": new,
                        "firefox_adopters": ff["proj"] if ff else _attribution(set()),
                        "consensus_blob": consensus["new_blob"] if consensus else None,
                        "consensus_adopters": consensus["proj"] if consensus else _attribution(set()),
                        "other_variant_adopters": _attribution(other_c)},
        })
    return {"commit": commit, "commit_date": cdt.isoformat() if cdt else None,
            "version": VER, "files": files}
