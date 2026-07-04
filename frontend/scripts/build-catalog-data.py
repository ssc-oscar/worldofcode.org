#!/usr/bin/env python3
"""Build catalog/registry.json for the WoC Data Catalog / Table Explorer page.

Two passes (per ~/lookup/DATA_CATALOG_SPEC.md):
  1. a hand-curated SEED transcribed from ~/lookup/TABLE_INVENTORY.md + DATA_CATALOG_SPEC.md
     + map-types.md (schemas, axes, producers, consumers);
  2. a read-only AUTO-SCAN of the reachable flat-table dirs that fills real bytes_per_shard,
     shard count, validity (present != valid: <=1KB gzip == empty), and field count (to flag
     schema drift). Run on isaac and on a da host and merge; here it runs on whatever mounts
     the current host can see.

Output: frontend/public/catalog-data/registry.json
"""
import glob, gzip, json, os, subprocess

VER = "V2604"
OUT = os.path.expanduser("~/swsc/worldofcode.org/frontend/public/catalog-data")
os.makedirs(OUT, exist_ok=True)

# Directories that may hold flat basemaps (read-only scan). Missing ones are skipped.
SCAN_DIRS = [
    "/da7_data/basemaps/gz", "/da5_data/basemaps/gz", "/da1_data/basemaps/gz",
    "/da0_data/basemaps", "/da3_data/basemaps/gz", "/da8_data/basemaps/gz",
    os.path.expanduser("~/work1/gz"),
]

# ---------------------------------------------------------------- seed ------
# axis: commit | project | author | blob | doc | package | edge
# tier: da | isaac | mongo | clickhouse | graph
def T(name, axis, key, schema, shards, sorted_by, tier_paths,
      row_scale=None, producer=None, consumers=None, notes=None, seed_valid=True,
      shard_by=None, store="flat", access=None):
    return {
        "name": name, "axis": axis, "key": key, "schema": schema,
        "shard": {"count": shards, "by": shard_by or (f"{key.split('(')[0]} hash" if shards and shards > 1 else "single"),
                  "sorted_by": sorted_by},
        "row_scale": row_scale, "producer": producer, "consumers": consumers or [],
        "notes": notes, "seed_valid": seed_valid, "store": store, "access": access,
        "locations": tier_paths,
    }

import re
def mount_host_of(path):
    # /da?_data mounts are host-specific — the owning host is encoded in the path.
    m = re.match(r"/da(\d+)_data", path)
    return f"da{m.group(1)}" if m else "da"
def da(path):  return {"tier": "da", "mount_host": mount_host_of(path), "path": path}
def isa(path): return {"tier": "isaac", "host": "isaac", "path": path}

C = "commit(sha1 hex)"
SEED = [
    # ---- commit-axis (128 shards, sorted by commit sha1) ----
    T("c2datFull", "commit", C,
      ["commit","tree","parent","author","committer","atime","ctime","atz","ctz","msg"],
      128, "commit", [da(f"/da7_data/basemaps/gz/c2datFull.{VER}.$i.s"), isa(f"~/work1/gz/c2datFull.{VER}.$i.s")],
      row_scale="~5.87e9 (1 / commit)", producer="roots-c2ta.slurm:c2dat (lstCmt.perl 9)",
      consumers=["c2sigFull","c2dAtFull","commit_v2604 (join)"], notes="RAW author/committer strings. Tier-1 root table.",
      shard_by="sha1 hex prefix"),
    T("c2dAtFull", "commit", C,
      ["commit","tree","parent","A","C","atime","ctime","atz","ctz","msg"],
      128, "commit", [da(f"/da7_data/basemaps/gz/c2dAtFull.{VER}.$i.s"), isa(f"~/work1/gz/c2dAtFull.{VER}.$i.s")],
      row_scale="~5.87e9 (1 / commit)", notes="A / C = canonical (aliased) author & committer.",
      shard_by="sha1 hex prefix"),
    T("agc2datFull", "commit", C,
      ["commit","project","tree","parent","author","committer","atime","ctime","atz","ctz","msg"],
      128, "commit", [da(f"/da5_data/basemaps/gz/agc2datFull.{VER}.$i.s")],
      notes="Already carries project (field 2) + full __NEWLINE__-encoded msg — the materialized c2ch shape.",
      consumers=["commit_v2604 (direct import alt.)"], shard_by="sha1 hex prefix"),
    T("c2aAcCtFull", "commit", C, ["commit","a","A","c","C","atime"],
      128, "commit", [da(f"/da7_data/basemaps/gz/c2aAcCtFull.{VER}.$i.s"), isa(f"~/work1/gz/c2aAcCtFull.{VER}.$i.s")],
      notes="Lean identity: raw + canonical author and committer.", shard_by="sha1 hex prefix"),
    T("c2fbbFull", "commit", C, ["commit","filepath","newblob","oldblob"],
      128, "commit", [da(f"/da7_data/basemaps/gz/c2fbbFull.{VER}.$i.s"), isa(f"~/work1/gz/c2fbbFull.{VER}.$i.s")],
      notes="File-blob deltas per commit (many rows / commit).", shard_by="sha1 hex prefix"),
    T("c2pFull", "commit", C, ["commit","project"],
      128, "commit", [da(f"/da7_data/basemaps/gz/c2pFull.{VER}.$i.s"), isa(f"~/work1/gz/c2pFull.{VER}.$i.s")],
      notes="Raw; MULTIPLE projects per commit, commit-sorted. Reduce with awk '$1!=p' for one project/commit.",
      consumers=["commit_v2604 (join)"], shard_by="sha1 hex prefix"),
    T("c2PAtFull", "commit", C, ["commit","project","A","atime"],
      128, "commit", [da(f"/da7_data/basemaps/gz/c2PAtFull.{VER}.$i.s"), isa(f"~/work1/gz/c2PAtFull.{VER}.$i.s")],
      notes="Commit → deforked project + canonical author + author time.", shard_by="sha1 hex prefix"),
    T("c2sigFull", "commit", C, ["commit","sigtype"],
      128, "commit", [da(f"/da7_data/basemaps/gz/c2sigFull.{VER}.$i.s"), isa(f"~/work1/gz/c2sigFull.{VER}.$i.s")],
      notes="Signed commits only (sigtype ∈ gpg/ssh/…).", shard_by="sha1 hex prefix"),
    T("c2chFull", "commit", C, ["commit","project","tree","parent","author","committer","atime","ctime","atz","ctz","comment"],
      128, "commit", [da(f"/da7_data/basemaps/gz/c2chFull.{VER}.$i.s")],
      notes="EMPTY for V2604 — never built (20-byte gzip). Do NOT use; reproduce by dynamic join (c2pFull ⋈ c2datFull).",
      seed_valid=False, shard_by="sha1 hex prefix"),

    # ---- project-axis ----
    T("p2cFull", "project", "project", ["project","commit"],
      128, "project", [da(f"/da7_data/basemaps/gz/p2cFull.{VER}.$i.s"), isa(f"~/work1/gz/p2cFull.{VER}.$i.s")],
      notes="Inverse of c2pFull, project-sorted.", shard_by="project hash"),
    T("p2PFull", "project", "rawrepo", ["rawrepo","canonicalProject"],
      1, "rawrepo", [da(f"/da5_data/basemaps/gz/p2PFull.{VER}.s"), isa(f"~/work1/gz/p2PFull.{VER}.s")],
      notes="Deforking map: raw repo → canonical project.", shard_by="single"),

    # ---- author-axis (32 shards, key = A hash) ----
    T("a2PFull", "author", "A", ["A","project"],
      32, "A", [da(f"/da7_data/basemaps/gz/a2PFull.{VER}.$i.s"), isa(f"~/work1/gz/a2PFull.{VER}.$i.s")],
      notes="Canonical author → project.", shard_by="A hash"),
    T("P2aFull", "author", "project", ["project","A"],
      32, "project", [da(f"/da7_data/basemaps/gz/P2aFull.{VER}.$i.s"), isa(f"~/work1/gz/P2aFull.{VER}.$i.s")],
      notes="Project → canonical author (author-hash sharded).", shard_by="A hash"),
    T("A2clsFull", "author", "A", ["A","class","privacy","evidence","nIds","nCmt"],
      32, "A", [da(f"/da5_data/basemaps/gz/A2clsFull.{VER}.$i.s"), isa(f"~/work1/gz/A2clsFull.{VER}.$i.s")],
      notes="Per-id classification (A2cls dataset). class ∈ developer/bot/bad/local.", shard_by="A hash"),
    T("A2mncFull", "author", "A", ["A","m","n","c"],
      32, "A", [isa(f"~/work1/gz/A2mncFull.{VER}.$i.s")],
      notes="Author message/name/commit counts.", shard_by="A hash"),
    T("key2AFull", "author", "keyid16", ["keyid16","A"],
      1, "keyid16", [isa(f"~/work1/gz/key2AFull.{VER}.s")],
      notes="Signing key → author (586k signed keys).", shard_by="single"),
    T("key2fanoutFull", "author", "keyid16", ["keyid16","fanout"],
      1, "keyid16", [isa(f"~/work1/gz/key2fanoutFull.{VER}.s")],
      notes="Signing-key fan-out (# authors per key).", shard_by="single"),
    T("A2summFull", "author", "A", ["A","summ(json)"],
      32, "A", [da(f"/da3_data/basemaps/gz/A2summFull{VER}.$i.s")],
      notes="Per-author Mongo-style summary JSON. EMPTY for V2604 shards → rebuild before use.",
      seed_valid=False, shard_by="A hash"),

    # ---- blob-axis ----
    T("b2fACcFull", "blob", "blob", ["blob","t","A","C","commit"],
      128, "blob", [isa(f"~/work1/gz/b2fACcFull.{VER}.$i.s")],
      notes="First blob provenance: earliest time, author, committer, commit.", shard_by="blob hash"),
    T("b2tACcFull", "blob", "blob", ["blob","t","A","C","commit"],
      128, "blob", [isa(f"~/work1/gz/b2tACcFull.{VER}.$i.s")],
      notes="Blob → time/author/committer/commit (tree axis).", shard_by="blob hash"),

    # ---- non-flat stores ----
    T("A_metadata", "author", "A", ["A","(document fields)"],
      1, "A", [{"tier": "mongo", "host": "da3", "path": "WoC.A_metadata.V2604"}],
      store="mongo", notes="Per-author metadata documents.",
      access="ssh da3 'mongosh --quiet WoC --eval \"db[\\\"A_metadata.V2604\\\"].findOne({_id:<A>})\"'"),
    T("P_metadata", "project", "project", ["project","(document fields)"],
      1, "project", [{"tier": "mongo", "host": "da3", "path": "WoC.P_metadata.V2604"}],
      store="mongo", notes="Per-project metadata documents.",
      access="ssh da3 'mongosh --quiet WoC --eval \"db[\\\"P_metadata.V2604\\\"].findOne({_id:<project>})\"'"),
    T("commit_v2604", "commit", C,
      ["sha1","time","tc","tree","parent","taz","tcz","author","commiter","project","comment"],
      1, "time", [{"tier": "clickhouse", "host": "da3", "path": "commit_v2604"}],
      store="clickhouse", row_scale="~5.82e9 rows (INT32 time min..max)",
      producer="dynamic join c2pFull ⋈ c2datFull → chImportCmt.perl → INSERT RowBinary",
      notes="MergeTree ORDER BY time. Built from a streaming join, not a stored c2chFull.",
      access="ssh da3 'clickhouse-client -q \"SELECT … FROM commit_v2604 WHERE time BETWEEN … LIMIT 20\"'"),
    T("edges.typed", "edge", "src(type,id)",
      ["srctype","srcid","relation","dsttype","dstid","weight","source"],
      1, "srctype", [{"tier": "graph", "host": "ssc-oscar/cite-sw", "path": "graph/edges.typed.gz"}],
      store="graph", row_scale="69,758,902 edges",
      notes="Cross-corpus heterogeneous graph: P·D·A·S·K·I nodes; DEPENDS_ON/MENTIONS_DOI/HAS_AUTHOR/… relations. Powers the Impact Explorer.",
      access="zcat cite-sw/graph/edges.typed.gz"),
]

# discovered-but-not-seeded flat tables worth surfacing (real, da2-reachable)
DISCOVERED = {
    "agc2fbb":    ("commit", C, ["commit","filepath","newblob","oldblob"], "commit", "sha1 hex prefix", "agg c2fbb with project scope"),
    "agc2pFull":  ("commit", C, ["commit","project"], "commit", "sha1 hex prefix", "aggregated commit→project"),
    "aFull":      ("author", "a", ["a(raw author string)"], "a", "single", "raw-author dictionary"),
    "pFull":      ("project", "project", ["project"], "project", "single", "project dictionary"),
    "flFull":     ("commit", "forgelang", ["forge/lang","count"], "forge/lang", "single", "forge/language rollup"),
    "pOld2pNew":  ("project", "project", ["projectOld","projectNew"], "projectOld", "single", "project rename/migration map"),
}

# ---------------------------------------------------------- auto-scan -------
def scan():
    found = {}  # name -> {dir, shards, bytes0, valid, nfields}
    for d in SCAN_DIRS:
        if not os.path.isdir(d):
            continue
        for f in sorted(glob.glob(os.path.join(d, f"*.{VER}.0.s")) +
                        glob.glob(os.path.join(d, f"*.{VER}.s"))):
            base = os.path.basename(f)
            name = base.split(f".{VER}.")[0].split(f".{VER}")[0]
            if name in found:  # first mount wins (da before isaac by SCAN_DIRS order)
                continue
            shards = len(glob.glob(os.path.join(d, f"{name}.{VER}.*.s"))) or 1
            try:
                sz = os.path.getsize(f)
            except OSError:
                continue
            valid = sz > 1024
            nf = None
            try:
                with gzip.open(f, "rt", errors="replace") as fh:
                    line = fh.readline()
                    if line:
                        nf = len(line.rstrip("\n").split(";"))
            except Exception:
                pass
            found[name] = {"dir": d, "shards": shards, "bytes0": sz, "valid": valid, "nfields": nf}
    return found

scanned = scan()

# ---------------------------------------------------------- merge ----------
def tier_of(d):
    return "isaac" if "work1" in d else "da"

registry = []
for t in SEED:
    s = scanned.get(t["name"])
    t["scanned"] = False
    if s:
        t["scanned"] = True
        t["bytes_per_shard"] = s["bytes0"]
        t["total_bytes"] = s["bytes0"] * max(1, s["shards"])
        t["valid"] = s["valid"]
        if s["shards"]:
            t["shard"]["count"] = s["shards"]
        # schema-drift flag
        if s["nfields"] and s["nfields"] != len(t["schema"]):
            t["schema_drift"] = f"scan found {s['nfields']} fields, seed lists {len(t['schema'])}"
        # attach a concrete verified da/isaac location
        for loc in t["locations"]:
            if loc["tier"] == tier_of(s["dir"]):
                loc["verified"] = True
                loc["bytes_per_shard"] = s["bytes0"]
    else:
        t["bytes_per_shard"] = None
        t["total_bytes"] = None
        t["valid"] = t["seed_valid"]
    registry.append(t)

# add discovered flat tables
seed_names = {t["name"] for t in SEED}
for name, (axis, key, schema, sortby, shard_by, note) in DISCOVERED.items():
    s = scanned.get(name)
    if not s:
        continue
    registry.append({
        "name": name, "axis": axis, "key": key, "schema": schema,
        "shard": {"count": s["shards"], "by": shard_by, "sorted_by": sortby},
        "row_scale": None, "producer": None, "consumers": [],
        "notes": note + " (auto-discovered; not in the curated seed).",
        "seed_valid": s["valid"], "store": "flat", "access": None,
        "locations": [{"tier": tier_of(s["dir"]),
                       **({"mount_host": mount_host_of(s["dir"])} if tier_of(s["dir"]) == "da" else {"host": "isaac"}),
                       "path": os.path.join(s["dir"], f"{name}.{VER}.$i.s" if s["shards"] > 1 else f"{name}.{VER}.s"),
                       "verified": True, "bytes_per_shard": s["bytes0"]}],
        "scanned": True, "bytes_per_shard": s["bytes0"],
        "total_bytes": s["bytes0"] * max(1, s["shards"]),
        "valid": s["valid"], "discovered": True,
    })

# field synonyms for search (spec §2c)
synonyms = {
    "A": ["canonical author", "aliased author", "developer id"],
    "a": ["raw author", "author string"],
    "C": ["canonical committer"], "c": ["raw committer"],
    "P": ["deforked project", "canonical project"],
    "p": ["project"], "project": ["repo", "P", "canonical project"],
    "commit": ["sha1", "c2*"], "blob": ["content", "b2*"],
    "atime": ["author time", "time"], "ctime": ["commit time"],
    "sigtype": ["signature", "signed"], "tree": ["dir"],
    "newblob": ["blob"], "oldblob": ["blob"], "filepath": ["file", "path"],
}

out = {
    "watermark": VER,
    "generated_on": subprocess.run(["hostname"], capture_output=True, text=True).stdout.strip(),
    "conventions": {
        "format": "';'-separated, gzip, LC_ALL=C-sorted by first key",
        "present_not_valid": "A <=1KB gzip shard is an empty never-built table — flagged valid:false, never offered as a source.",
        "mount_topology": "The da cluster (da0–da8) shares one /home, so code and Mongo/ClickHouse clients are uniform — but the /da?_data data mounts are host-specific (da7–da8 differ). Basemaps physically live on da7. Read each /da?_data path from its mount_host, don't assume any da host sees every /da?_data.",
    },
    "cost_model": {
        "read_mb_s_per_core": 250, "cores": {"da3": 8, "isaac": 40},
        "split_multiplier": 4,
        "note": "Estimates only — use the Calibrate command to time one shard and rescale.",
    },
    "synonyms": synonyms,
    "tables": registry,
}
with open(os.path.join(OUT, "registry.json"), "w") as f:
    json.dump(out, f, separators=(",", ":"))

nv = sum(1 for t in registry if not t["valid"])
sc = sum(1 for t in registry if t.get("scanned"))
print(f"registry.json: {len(registry)} tables ({sc} scanned live, {nv} invalid/empty)")
print(f"  size: {os.path.getsize(os.path.join(OUT,'registry.json'))/1024:.0f} KB")
for t in registry:
    if t.get("schema_drift"):
        print(f"  DRIFT {t['name']}: {t['schema_drift']}")
