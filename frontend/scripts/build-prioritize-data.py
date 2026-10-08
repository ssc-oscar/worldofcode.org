#!/usr/bin/env python3
"""Build the vulnerability-prioritization demo data (static).

Ranks copied/shared vulnerable code by REACH x SEVERITY — the visible form of the
copy-alert feed's criticality_rank (downstream reach) x security_priority (classifier).

Inputs (da8, da2-readable):
  /da8_data/update/RT/vuln-diffs/vuln_diffs.tsv.gz
      project<TAB>commit<TAB>old_blob(vulnerable)<TAB>new_blob(fixed)<TAB>M<TAB>path
  /da8_data/update/clone0_vuln_flagged/flagged.dedup.jsonl.gz
      {"sha","tree","parents","match":[categories],"subject"}   (severity signal)

Output: frontend/public/prioritize-data/top.json
"""
import gzip, json, os, math
from collections import defaultdict, Counter

DIFFS = "/da8_data/update/RT/vuln-diffs/vuln_diffs.tsv.gz"
FLAGGED = "/da8_data/update/clone0_vuln_flagged/flagged.dedup.jsonl.gz"
OUT = os.path.expanduser("~/swsc/worldofcode.org/frontend/public/prioritize-data")
NULL_BLOB = "0" * 40
TOP_N = 100
SAMPLE = 8

# severity weights per flagged match-category (higher = more security-critical)
SEV = {
    "cve": 5.0, "cvss_exp": 5.0, "rce": 5.0, "overflow": 4.0, "memory": 4.0,
    "deser_xxe": 4.0, "csrf_ssrf": 3.5, "xss": 3.5, "sqli": 4.0, "authbypass": 4.0,
    "dos": 3.0, "inputval": 2.5, "secfix": 2.0, "vuln": 1.5, "concurrency": 1.5,
}
def sev_weight(cats):
    return max([SEV.get(c, 1.0) for c in cats], default=1.0)

def display_project(p):
    return p.replace("_", "/", 1)

# ---- 1. aggregate vuln-diffs per vulnerable blob (old_blob) -------------------
per = defaultdict(lambda: {"projects": set(), "commits": set(), "paths": Counter(), "new": Counter()})
with gzip.open(DIFFS, "rt", errors="replace") as f:
    for line in f:
        p = line.rstrip("\n").split("\t")
        if len(p) < 6:
            continue
        proj, commit, old, new, _ct, path = p[0], p[1], p[2], p[3], p[4], p[5]
        if not old or old == NULL_BLOB:
            continue
        d = per[old]
        d["projects"].add(proj)
        d["commits"].add(commit)
        d["paths"][path.lstrip("/")] += 1
        if new and new != NULL_BLOB:
            d["new"][new] += 1

# focus on copied/shared vulnerable code (reach >= 2) — the prioritization story
per = {b: d for b, d in per.items() if len(d["projects"]) >= 2}
wanted_commits = set().union(*[d["commits"] for d in per.values()]) if per else set()

# ---- 2. join severity categories from the flagged stream ---------------------
cats_by_commit = {}
if os.path.exists(FLAGGED):
    with gzip.open(FLAGGED, "rt", errors="replace") as f:
        for line in f:
            i = line.find('"sha"')
            if i < 0:
                continue
            try:
                o = json.loads(line)
            except Exception:
                continue
            sha = o.get("sha")
            if sha in wanted_commits:
                cats_by_commit[sha] = o.get("match", [])

# ---- 3. score + rank ---------------------------------------------------------
rows = []
for old, d in per.items():
    cats = set()
    for c in d["commits"]:
        cats.update(cats_by_commit.get(c, []))
    reach = len(d["projects"])
    sev = sev_weight(cats)
    score = round(sev * math.log2(1 + reach), 3)
    path, _ = d["paths"].most_common(1)[0]
    new = d["new"].most_common(1)[0][0] if d["new"] else None
    rows.append({
        "old_blob": old, "fixed_blob": new, "path": path,
        "reach": reach, "n_commits": len(d["commits"]),
        "categories": sorted(cats, key=lambda c: -SEV.get(c, 1.0)),
        "severity": sev, "score": score,
        "sample_projects": sorted(d["projects"])[:SAMPLE],
        "more_projects": max(0, reach - SAMPLE),
    })
rows.sort(key=lambda r: (r["score"], r["reach"]), reverse=True)
top = rows[:TOP_N]

os.makedirs(OUT, exist_ok=True)
doc = {
    "generated_on": __import__("subprocess").run(["hostname"], capture_output=True, text=True).stdout.strip(),
    "totals": {
        "shared_vulns": len(per),
        "distinct_projects": len(set().union(*[d["projects"] for d in per.values()])) if per else 0,
        "total_diffs_scanned": sum(len(d["commits"]) for d in per.values()),
    },
    "method": "Each item is a vulnerable file (blob) fixed across multiple projects. "
              "Priority = severity(highest flagged category) x log2(1+reach), reach = distinct "
              "projects that carried and fixed this exact vulnerable blob.",
    "severity_weights": SEV,
    "items": top,
}
with open(os.path.join(OUT, "top.json"), "w") as f:
    json.dump(doc, f, separators=(",", ":"), ensure_ascii=False)
print(f"top.json: {len(top)} items, {os.path.getsize(os.path.join(OUT,'top.json'))} bytes")
print(f"  shared vulns: {len(per):,}  matched categories for {len(cats_by_commit):,} commits")
for r in top[:6]:
    print(f"  score {r['score']:6.2f}  reach {r['reach']:3d}  [{','.join(r['categories'][:3])}]  {r['path'].split('/')[-1]}")
