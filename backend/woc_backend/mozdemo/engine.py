"""mozdemo query engine — Firefox backport commit -> three updatebot-scenario panels.

Single source of truth (the frontend precompute imports this). Reads WoC maps via
**python-woc** (a WocMapsLocal instance passed in) so it runs identically inside the API
container and on the host builder — the getValues CLI is not present in the container.
Never fabricates; both project attributions are computed (deforked c2P + raw c2p).

python-woc returns structured tuples/lists directly:
  c2fbb(commit) -> [(file, old_blob, new_blob), ...]
  bb2cf(old)    -> [(new_blob, fix_commit, path), ...]
  c2P/c2p(commit) -> [project, ...]     (deforked / raw)
  b2fa(blob)    -> [(unix_time, author, commit)]
Commit timestamps come from show_content('commit', sha) (c2dat is version-thin in the
production profile), so dates are always available.
"""
import re
import datetime

README = ("README.mozilla", "README.moz-ff-commit")  # vendoring bookkeeping, not source
RAW_CAP = 80
MAX_FILES = 6
SHA_RE = re.compile(r"^[0-9a-f]{40}$")

LIBPIXMAN_NOTE = ("Still-exposed enumeration needs a fresh b2P (blob->project). b2P V..V2605 "
                  "do not index these Nov-2023 blobs, so the never-fixed set can't be listed "
                  "here yet - the near-real-time thrust builds exactly this map. Proven end to "
                  "end on libpixman/CVE-2022-44638: 662 projects still carried the pre-fix blob.")


def _profile_version(woc):
    try:
        return sorted({m.version for m in woc.maps if m.name == "bb2cf"})[-1]
    except Exception:
        return "?"


def analyze(commit, woc):
    """Return {commit, commit_date, label, version, files:[...three panels...]} or raise ValueError.

    `woc` is a woc.local.WocMapsLocal instance.
    """
    if not SHA_RE.match(commit):
        raise ValueError("commit must be a 40-char lowercase hex sha1")

    def gv(map_, key):
        try:
            return woc.get_values(map_, key)
        except Exception:
            return []

    def ctime(sha):
        try:
            return datetime.datetime.utcfromtimestamp(int(woc.show_content("commit", sha)[2][1]))
        except Exception:
            return None

    version = _profile_version(woc)
    cdt = ctime(commit)
    files_src = [t for t in gv("c2fbb", commit) if not any(t[0].endswith(r) for r in README)]
    files = []
    for path, old, new in files_src:
        variants = {}
        for nb, fc, _p in gv("bb2cf", old):
            variants.setdefault(nb, {"new_blob": nb, "commits": set()})["commits"].add(fc)
        allc = sorted({c for v in variants.values() for c in v["commits"]})
        # cache per-commit lookups once for this file (in-process, cheap)
        Pmap = {c: [x for x in gv("c2P", c) if x] for c in allc}
        pmap = {c: [x for x in gv("c2p", c) if x] for c in allc}
        Dmap = {c: ctime(c) for c in allc}

        def attr(commits):
            dedf, raw = set(), set()
            for c in commits:
                dedf |= set(Pmap.get(c, []))
                raw |= set(pmap.get(c, []))
            rl = sorted(raw)
            return {"deforked": sorted(dedf), "deforked_count": len(dedf),
                    "raw": rl[:RAW_CAP], "raw_count": len(raw), "raw_truncated": len(raw) > RAW_CAP}

        def vrec(v):
            dates = [Dmap[c] for c in v["commits"] if Dmap.get(c)]
            return {"new_blob": v["new_blob"] or None, "deleted": not v["new_blob"],
                    "commits": len(v["commits"]), "proj": attr(v["commits"]),
                    "first_date": min(dates).date().isoformat() if dates else None,
                    "is_firefox": v["new_blob"] == new}
        vlist = sorted((vrec(v) for v in variants.values()),
                       key=lambda x: (x["proj"]["deforked_count"], x["proj"]["raw_count"], x["commits"]),
                       reverse=True)

        bf = gv("b2fa", new)
        first, first_author = None, None
        if bf:
            t = bf[0]
            try:
                first = datetime.datetime.utcfromtimestamp(int(t[0]))
                first_author = t[1] if len(t) > 1 else None
            except Exception:
                pass
        ff = next((v for v in vlist if v["is_firefox"]), None)
        first_downstream = ff["first_date"] if ff else None
        gap_up = (cdt.date() - first.date()).days if (cdt and first) else None
        gap_down = ((cdt.date() - datetime.date.fromisoformat(first_downstream)).days
                    if (cdt and first_downstream) else None)
        consensus = next((v for v in vlist if not v["deleted"] and not v["is_firefox"]), None)
        other_c = {c for v in variants.values() if v["new_blob"] and v["new_blob"] != new for c in v["commits"]}

        files.append({
            "path": path, "old_blob": old, "firefox_new_blob": new,
            "panel_a": {"fix_first_appeared": first.isoformat() if first else None,
                        "fix_first_author": first_author, "first_downstream_date": first_downstream,
                        "gap_days_from_upstream": gap_up, "gap_days_from_first_downstream": gap_down,
                        "variant_count": len(vlist), "variants": vlist},
            "panel_b": {"known_fixed": attr(allc), "still_exposed_available": False,
                        "note": LIBPIXMAN_NOTE},
            "panel_c": {"firefox_blob": new,
                        "firefox_adopters": ff["proj"] if ff else attr(set()),
                        "consensus_blob": consensus["new_blob"] if consensus else None,
                        "consensus_adopters": consensus["proj"] if consensus else attr(set()),
                        "other_variant_adopters": attr(other_c)},
        })
    files.sort(key=lambda f: f["panel_a"]["variant_count"], reverse=True)
    interesting = [f for f in files if f["panel_a"]["variant_count"] >= 2]
    files = (interesting or files[:1])[:MAX_FILES]
    label = files[0]["path"].split("/")[-1] if files else None
    return {"commit": commit, "commit_date": cdt.isoformat() if cdt else None,
            "label": label, "version": version, "files": files}
