#!/usr/bin/env python3
"""Build compact JSON for the WoC Impact Explorer page from ~/swsc/cite-sw tables.

Outputs to frontend/public/impact-data/{summary.json, repos.json}.
Join key everywhere is the lowercased WoC project name (url2woc space).
"""
import csv, gzip, json, os, sys

SRC = os.path.expanduser("~/swsc/cite-sw")
OUT = os.path.expanduser("~/swsc/worldofcode.org/frontend/public/impact-data")
os.makedirs(OUT, exist_ok=True)

def rd(path):
    p = os.path.join(SRC, path)
    op = gzip.open if path.endswith(".gz") else open
    with op(p, "rt", encoding="utf-8", errors="replace") as f:
        for line in f:
            yield line.rstrip("\n")

def tsv(path):
    for line in rd(path):
        if line:
            yield line.split("\t")

# ---- signals: proj -> (dep_indeg, grounding, uptake, publishes) --------------
sig = {}
for r in tsv("sci/triangulate/signals.tsv"):
    if len(r) < 5: continue
    name = r[0].lower()
    sig[name] = (int(r[1]), int(r[2]), int(r[3]), int(r[4]))

# ---- anchors: proj -> tag (S/J/C/P combos) -----------------------------------
# tag letters: S=SciCat, J=JOSS, C=Softcite, P=SciPkg
anch = {}
for r in tsv("sci/triangulate/anchors.tsv"):
    if len(r) < 2: continue
    anch[r[0].lower()] = r[1]

# ---- repo_sw_impact: name, dependents, field, layer, stars, forks, auth, cmts
meta = {}  # name -> {field, layer, stars, forks}
for r in tsv("sci/repo_sw_impact.tsv"):
    if len(r) < 6: continue
    name = r[0].lower()
    try:
        stars = int(r[4]); forks = int(r[5])
    except ValueError:
        stars = forks = 0
    meta[name] = {"field": r[2], "layer": r[3], "stars": stars, "forks": forks}

# ---- repo_meta: name, field, layer, forks, stars, authors, commits (SciCat) --
# fills field/stars for repos not in repo_sw_impact (no dependents)
for r in tsv("sci/repo_meta.tsv"):
    if len(r) < 5: continue
    name = r[0].lower()
    if name in meta: continue
    field = r[1]
    layer = r[2]
    try:
        forks = int(r[3]) if r[3] else 0
        stars = int(r[4]) if r[4] else 0
    except ValueError:
        forks = stars = 0
    meta[name] = {"field": field, "layer": layer, "stars": stars, "forks": forks}

# ---- GHArchive stars/forks (isaac, ~2026-06) — override the stale ~2023 seed ----
# P2nStar/P2nFork: `project;count`, WoC-project-keyed, published to da8 basemaps.
# Source: WatchEvent/ForkEvent rollups (coord/isaac/reply-stars-provenance.md).
STAR_SRC = "gharchive-2026-06"  # provenance label surfaced in the UI
def _load_counts(path, want):
    out = {}
    if not os.path.exists(path):
        return out
    with gzip.open(path, "rt", errors="replace") as f:
        for line in f:
            i = line.find(";")
            if i < 0: continue
            name = line[:i]
            if name in want:
                try: out[name] = int(line[i+1:].strip())
                except ValueError: pass
    return out

_want = set()  # anchored-repo universe (built below from signals/anchors); load counts for those
# NOTE: `sig` and `anch` are already populated above; the union is the repo universe.
_want = set(sig) | set(anch)
_gha_star = _load_counts("/da8_data/basemaps/gz/P2nStar.gz", _want)
_gha_fork = _load_counts("/da8_data/basemaps/gz/P2nFork.gz", _want)
for name in _want:
    m = meta.setdefault(name, {"field": None, "layer": None, "stars": None, "forks": None})
    if name in _gha_star:
        m["stars"] = _gha_star[name]
        m["stars_src"] = STAR_SRC
    if name in _gha_fork:
        m["forks"] = _gha_fork[name]

# ---- repo_paper_cnt: name -> #distinct papers (grounding leaderboard) ---------
paper_cnt = {}
for r in tsv("sci/repo_paper_cnt.tsv"):
    if len(r) < 2: continue
    try: paper_cnt[r[0].lower()] = int(r[1])
    except ValueError: pass

# ---- paper_impact.clean: doi -> #sci-repos ; enrich w/ titles ----------------
paper_reach = {}
for r in tsv("sci/paper_impact.clean.tsv"):
    if len(r) < 2: continue
    try: paper_reach[r[0].lower()] = int(r[1])
    except ValueError: pass

paper_title = {}  # doi -> (title, year, s2cites)
for r in tsv("sci/top_paper_titles.tsv"):
    if len(r) < 4: continue
    doi = r[0].lower()
    try: yr = int(r[2])
    except ValueError: yr = None
    try: cites = int(r[3])
    except ValueError: cites = None
    paper_title[doi] = (r[1], yr, cites)

# ---- authors: top_author_names (s2id,name,papers=,cites=) + author_impact reach
auth_reach = {}
for r in tsv("sci/author_impact.tsv"):
    if len(r) < 2: continue
    try: auth_reach[r[0]] = int(r[1])
    except ValueError: pass

# hand-curated "who" recognition from SCICAT_IMPACT.md Q3
WHO = {
    "Paolo Di Tommaso": "Nextflow", "G. M. Kurtzer": "Singularity",
    "S. Salzberg": "Bowtie / Salmon", "A. Stamatakis": "RAxML",
    "Ben Langmead": "Bowtie", "Heng Li": "SAMtools / BWA / minimap2",
    "R. Durbin": "Wellcome / Ensembl",
}
authors = []
for r in tsv("sci/top_author_names.tsv"):
    if len(r) < 2: continue
    s2id = r[0]; name = r[1]
    papers = cites = None
    for f in r[2:]:
        if f.startswith("papers="):
            try: papers = int(f.split("=",1)[1])
            except ValueError: pass
        elif f.startswith("cites="):
            try: cites = int(f.split("=",1)[1])
            except ValueError: pass
    authors.append({
        "name": name, "reach": auth_reach.get(s2id),
        "papers": papers, "cites": cites, "who": WHO.get(name),
    })
authors = [a for a in authors if a["reach"] is not None]
authors.sort(key=lambda a: a["reach"], reverse=True)
authors = authors[:24]

# ---- assemble per-repo universe (all anchored repos) -------------------------
names = set(sig) | set(anch)
repos = []
for name in names:
    d, g, u, p = sig.get(name, (0, 0, 0, 0))
    tag = anch.get(name, "")
    m = meta.get(name)
    field = m["field"] if m else None
    stars = m["stars"] if m else None
    forks = m.get("forks") if m else None
    fresh = 1 if (m and m.get("stars_src") == STAR_SRC) else 0
    repos.append([name, d, g, u, p, tag, field, stars, forks, fresh])

# repos.json — compact array-of-arrays for client-side search
repos_out = {
    "cols": ["name", "dep_indeg", "grounding", "uptake", "publishes", "tags", "field", "stars", "forks", "stars_fresh"],
    "rows": repos,
}
with open(os.path.join(OUT, "repos.json"), "w") as f:
    json.dump(repos_out, f, separators=(",", ":"))

# ---- leaderboards ------------------------------------------------------------
def enrich(name):
    m = meta.get(name, {})
    return {"field": m.get("field"), "layer": m.get("layer"),
            "stars": m.get("stars"), "forks": m.get("forks")}

# RQ-D1 science-enabling software: top by dep_indeg, restricted to curated
# science-anchored repos (a known SciCat Field) so the board reflects research
# software rather than general dev tooling that merely has a huge npm dep-graph.
software = []
for name, (d, g, u, p) in sig.items():
    if d <= 0 or name not in meta: continue
    e = enrich(name)
    software.append({"name": name, "dependents": d, "tags": anch.get(name, ""),
                     "field": e["field"], "layer": e["layer"], "stars": e["stars"]})
software.sort(key=lambda x: x["dependents"], reverse=True)
software = software[:60]

# RQ-D2 most paper-grounded repos (exclude bibliography-aggregator outliers by flag)
BIB_OUTLIERS = {"tpall_geo-rnaseq", "bitbucket.org_pbradz_preta", "igbb_past"}
grounded = []
for name, c in paper_cnt.items():
    e = enrich(name)
    grounded.append({"name": name, "papers": c, "field": e["field"],
                     "layer": e["layer"], "stars": e["stars"], "tags": anch.get(name, ""),
                     "aggregator": name in BIB_OUTLIERS})
grounded.sort(key=lambda x: x["papers"], reverse=True)
grounded = grounded[:60]

# RQ-P3 furthest-reaching papers
papers = []
for doi, reach in paper_reach.items():
    t = paper_title.get(doi)
    papers.append({"doi": doi, "repos": reach,
                   "title": t[0] if t else None,
                   "year": t[1] if t else None,
                   "cites": t[2] if t else None})
papers.sort(key=lambda x: (x["repos"], x["cites"] or 0), reverse=True)
papers = papers[:50]

# ---- fields breakdown among science repos (with dependents) ------------------
field_agg = {}
for name, m in meta.items():
    fld = m["field"]
    if not fld: continue
    d = sig.get(name, (0,0,0,0))[0]
    a = field_agg.setdefault(fld, {"field": fld, "count": 0, "dependents": 0})
    a["count"] += 1
    a["dependents"] += d
fields = sorted(field_agg.values(), key=lambda x: x["count"], reverse=True)[:12]

# ---- anchor connectivity + decoupling (from TRIANGULATION.md, static) --------
anchor_stats = [
    {"key": "SciCat",  "n": 18247, "dep": 11.1, "grounding": 37.0, "uptake": 3.6, "publishes": 25.5, "depMed": 3, "depP90": 37},
    {"key": "JOSS",    "n": 3260,  "dep": 23.4, "grounding": 36.1, "uptake": 3.8, "publishes": 65.2, "depMed": 3, "depP90": 28},
    {"key": "Softcite","n": 2195,  "dep": 0.9,  "grounding": 1.6,  "uptake": 0.2, "publishes": 3.2,  "depMed": 2, "depP90": 32},
    {"key": "SciPkg",  "n": 29051, "dep": 52.0, "grounding": 21.0, "uptake": 1.2, "publishes": 100.0,"depMed": 5, "depP90": 123},
    {"key": "Union",   "n": 50835, "dep": 33.1, "grounding": 25.1, "uptake": 2.0, "publishes": 67.1, "depMed": 4, "depP90": 105},
]
decoupling = [
    {"anchor": "SciCat", "n": 981,  "rho": 0.128},
    {"anchor": "JOSS",   "n": 473,  "rho": 0.348},
    {"anchor": "SciPkg", "n": 3467, "rho": 0.140},
    {"anchor": "Union",  "n": 4205, "rho": 0.167},
]

# ---- scatter: reuse (dep_indeg) vs literature grounding, science repos --------
scatter = []
for name, m in meta.items():
    d, g, u, p = sig.get(name, (0,0,0,0))
    if d <= 0 or g <= 0: continue
    scatter.append({"name": name, "dependents": d, "papers": g,
                    "field": m["field"], "stars": m["stars"]})
scatter.sort(key=lambda x: x["dependents"] + x["papers"], reverse=True)
scatter = scatter[:400]

summary = {
    "watermark": "V2604",
    "starSource": {"label": "GitHub stars (GHArchive, ~2026-06)", "matched": len(_gha_star),
                   "note": "Star/fork counts are GHArchive WatchEvent/ForkEvent rollups (isaac P2nStar/P2nFork, ~mid-2026), replacing the ~2023 SciCat seed."},
    "stats": {
        "edges": 69758902, "anchoredRepos": 50835, "dependsOn": 49207245,
        "mentionsDoi": 2401620, "papers": 1759169, "wocProjects": 4966344,
        "s2authors": 3088155,
    },
    "counts": {
        "depended": sum(1 for v in sig.values() if v[0] > 0),
        "grounded": sum(1 for v in sig.values() if v[1] > 0),
        "uptake":   sum(1 for v in sig.values() if v[2] > 0),
        "publishes":sum(1 for v in sig.values() if v[3] > 0),
    },
    "anchors": anchor_stats,
    "decoupling": decoupling,
    "fields": fields,
    "leaderboards": {
        "software": software, "grounded": grounded,
        "papers": papers, "authors": authors,
    },
    "scatter": scatter,
    "caveats": [
        "These are WoC-derived signals, not live GitHub — expect them to differ from a repo's current GitHub page.",
        "Ecosystem impact is the WoC dependency-graph in-degree, built from ecosyste.ms package-manifest dependencies (not GitHub's dependency graph / 'Used by', which counts every lockfile reference and runs far higher). It is bounded by ecosyste.ms package coverage and the package/repo→WoC name resolution, is deforked to canonical projects, and misses vendored/copied and non-published dependencies.",
        "\"Papers co-mentioned\" counts distinct DOI strings appearing in a repo's tracked file content (WoC blob→DOI regex over ALL blobs, not just BibTeX) — co-occurrence, NOT curated citation. It is over-attributed (a data/vignette blob listing downstream studies injects their DOIs) and, in this build, under-attributed (a fixed cite-sw bug dropped some co-holder projects). Strict BibTeX-only 'cites' and origin-de-bleeded variants are being produced upstream.",
        "Scientific uptake (a paper naming a repo) is sparse everywhere (~2-4%): the MENTIONS_REPO channel is only ~12,310 edges ecosystem-wide (s2orc-derived), so a blank means 'not captured', not 'unused'. Softcite/CZI mention data is not joined here.",
        "Star and fork counts are GHArchive WatchEvent/ForkEvent rollups current to ~mid-2026 (not live-to-the-minute); repos with no GHArchive match fall back to the ~2023 SciCat seed.",
        "\"Scientific software\" is operationalization-dependent: four independent anchors (SciCat, JOSS, Softcite, SciPkg) are triangulated rather than asserting one ground truth.",
        "Reuse vs. citation coupling is weakly positive (Spearman +0.13 to +0.35), not a strong signal.",
    ],
}
with open(os.path.join(OUT, "summary.json"), "w") as f:
    json.dump(summary, f, separators=(",", ":"))

sz_r = os.path.getsize(os.path.join(OUT, "repos.json"))
sz_s = os.path.getsize(os.path.join(OUT, "summary.json"))
print(f"repos.json: {len(repos):,} rows, {sz_r/1024:.0f} KB")
print(f"summary.json: {sz_s/1024:.0f} KB")
print(f"leaderboards: software={len(software)} grounded={len(grounded)} papers={len(papers)} authors={len(authors)}")
print(f"scatter={len(scatter)} fields={len(fields)}")
