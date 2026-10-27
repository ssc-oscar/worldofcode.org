# Real-Time Security Flagging (candidate CVEs)

World of Code ingests **new public commits hourly** and runs each commit message through a
**19-category keyword net** to surface *potential* security fixes and vulnerabilities — in
near-real-time, across all of open source. This page explains what that signal is, how to use it for
your project, and — critically — **what it is not**.

> [!WARNING]
> **These are keyword-flagged *candidates*, not confirmed CVEs.** The net matches words in the
> **commit message** (e.g. "fix buffer overflow", "CVE-2026-1234", "sanitize input"). It is a triage
> starting point with real false positives. **Always confirm** by reading the diff and cross-checking
> the CVE/GHSA ID before acting.

## 1. What it is — and what it isn't

- **Is:** an ecosystem-wide, hourly-refreshed *triage* signal — "these commits *look like* security
  work, here are the categories, here is the fix diff, and here is who else copied the vulnerable code."
- **Is not:** a vulnerability database, a scanner of your code, or a statement that a CVE exists.
  Precision varies a lot by category (see §3).

The signal has three parts you can use:
1. **Flagged commits** for a project (message matched the net).
2. **The fix diff** for a flagged commit (which file versions changed: vulnerable → fixed blob).
3. **Still-exposed downstream** — other projects that copied the *vulnerable* blob and have **not**
   taken the fix.

## 2. Find your project's flagged commits

**Interactive (coming to the site):** a *Project → Security* panel — enter `owner_repo` and get a
table of flagged commits: `sha · categories · subject · date · [view fix diff]`. Watch the
[Explore](https://worldofcode.org/explore) / security surfaces.

**Programmatic (today):**

- **Commit-message search (any user, via ClickHouse):** the same idea the net is built on —
  ```sh
  echo "select lower(hex(sha1)), author, comment from commit_v2605 \
    where match(comment, '(?i)CVE-20|buffer overflow|use[- ]after[- ]free') limit 20 FORMAT CSV" \
    | clickhouse-client --host=da3 --format_csv_delimiter=";"
  ```
- **Map the commit to your project** with `c2p` (raw) or `c2P` (deforked), and back with
  `p2c`/`P2c` — via `python-woc` or the [HTTP API](https://worldofcode.org/api):
  ```python
  from woc.local import WocMapsLocal
  woc = WocMapsLocal()
  woc.get_values("c2P", "e4af89166a17785c1d741b8b1d5775f3223f510f")  # -> deforked project(s)
  ```

**Raw real-time flag stream (read it directly on `/da8_data`):** the hourly flagger drains its output
to `da8`, which any WoC user can read — **never query clone0** (it has no user access and is the
throttled RT ingest box). Two files, both kept current:

- **Flagged commits** — `/da8_data/update/clone0_vuln_flagged/flagged.dedup.jsonl.gz`
  — ~12M unique flagged commits, **auto-refreshed daily**. One JSON per line:
  `{sha, tree, parents, match:[categories], subject}`.
- **Commit → project (`c2r`)** — `/da8_data/basemaps/gz/rt_commits/<YYYY-MM-DD>/<HH>/c2r.edges.gz`
  — `sha40<TAB>woc_project`, **current to the live hour** (one dir per ingested hour).

```sh
# flagged commits for one project, entirely off /da8_data (no clone0):
REPO=torvalds_linux
zcat /da8_data/update/clone0_vuln_flagged/flagged.dedup.jsonl.gz \
 | python3 -c 'import sys,json
for l in sys.stdin:
  d=json.loads(l); print(d["sha"]+"\t"+",".join(d["match"])+"\t"+d["subject"])' \
 | LC_ALL=C sort > /tmp/flagged.tsv
zcat /da8_data/basemaps/gz/rt_commits/*/*/c2r.edges.gz | grep -P "\t$REPO$" | cut -f1 \
 | LC_ALL=C sort | LC_ALL=C join -t$'\t' - /tmp/flagged.tsv   # sha  categories  subject
```
For whole-history (not just the RT window) use the base maps `c2P`/`P2c` above instead of `c2r`.

## 3. Read the categories

A commit is flagged if its message matches any of these **19 categories** (case-insensitive). The
`cve`/`ghsa` labels are **high precision**; `secfix`/`inputval`/`vuln` are **noisier** — treat them as
weaker hints.

| category | flags on (message contains) | precision |
|---|---|---|
| `cve` | `CVE-YYYY-NNNN` id | high |
| `ghsa` | `GHSA-xxxx-xxxx-xxxx` id | high |
| `rce` | RCE / remote code execution / arbitrary code exec | high |
| `xss` | XSS / cross-site scripting | high |
| `csrf_ssrf` | CSRF / SSRF | high |
| `sqli` | SQL injection / SQLi | high |
| `overflow` | buffer/heap/stack/integer overflow, out-of-bounds, underflow | med-high |
| `memory` | use-after-free, double-free, memory corruption, null-ptr deref, format string | med-high |
| `deser_xxe` | deserialization, XXE, unsafe pickle/yaml/eval | med-high |
| `injection` | command/code/template/LDAP injection | med |
| `traversal` | path/directory traversal, LFI/RFI | med |
| `authz` | auth bypass, privilege escalation, privesc, access control | med |
| `dos` | denial of service, DoS/DDoS/ReDoS | med |
| `cvss_exp` | CVSS, exploit, 0-day, backdoor, malicious | med |
| `secret` | hardcoded/leaked password/secret/key/credential/token | med |
| `concurrency` | race condition, TOCTOU | med |
| `vuln` | the word "vulnerab…" | low |
| `secfix` | "security fix/patch/advisory/update/hardening…" | low |
| `inputval` | sanitize, input validation, bounds check, escape html/input | low |

A commit can carry several labels (e.g. `["cve","overflow"]`). The net (`cvepats.py`) is the source of
truth and is shared with the WoC vulnerability-trend study.

## 4. Inspect the fix

For a flagged commit, WoC extracts the **file-level diff** — for each changed path, the **vulnerable
`old_blob`** and the **fixed `new_blob`**. You can read either blob's exact content by SHA:

```python
woc.show_content("blob", "<old_blob_sha>")   # the vulnerable version
woc.show_content("blob", "<new_blob_sha>")   # the fixed version
```

The `old_blob → new_blob` pair is the heart of the still-exposed check below.

## 5. "Am I still exposed?" — copy-based exposure

Vulnerable code is often **copied** between projects rather than pulled in as a dependency — so a fix
in the upstream repo doesn't reach the copies. WoC can trace this directly:

- **`b2P(old_blob)`** → every deforked project that contains the *vulnerable* blob.
- A project is **still exposed** if it carries the `old_blob` but **not** the `new_blob`.

```python
carriers  = set(woc.get_values("b2P", old_blob))   # have the vulnerable code
patched   = set(woc.get_values("b2P", new_blob))   # already have the fix
exposed   = carriers - patched                      # copied it, never fixed it
```

This is the signal behind the WoC [prioritization demo](https://worldofcode.org/prioritize) (copied
vulnerable code ranked by reach × severity).

## 6. Confirm before acting

The flag is a **starting point**, not a verdict:
1. **Read the diff** (§4) — does the change actually address a security issue?
2. **Cross-reference** any `CVE`/`GHSA` id against the [NVD](https://nvd.nist.gov/) / GitHub Advisory DB.
3. **Check the category precision** (§3) — a lone `secfix`/`vuln` hit is weak; `cve`+`overflow`
   together is strong.

## 7. Programmatic access & data

| what you want | how |
|---|---|
| commit → project | `c2p` / `c2P` (raw / deforked) — python-woc or API |
| project → commits | `p2c` / `P2c` |
| blob → projects (exposure) | `b2P` |
| commit message search | ClickHouse `commit_v2605` `match(comment, …)` on `da3` |
| blob content | `show_content("blob", sha)` |
| RT flagged commits | `/da8_data/update/clone0_vuln_flagged/flagged.dedup.jsonl.gz` (daily refresh) |
| RT commit → project (`c2r`) | `/da8_data/basemaps/gz/rt_commits/<date>/<hh>/c2r.edges.gz` (live hour) |

> **Always read `/da8_data/`, never clone0.** clone0 is the RT ingest box (no user access, throttled);
> it drains both files above to da8. Raw RT commit *content* is landing in a ClickHouse `commit_rt`
> store (on da4, still being built) — not a user-facing path yet, so for now use the flagged + `c2r`
> files on da8.

- **Python:** `pip install python-woc` → [docs](https://ssc-oscar.github.io/python-woc/)
- **HTTP API:** [worldofcode.org/api](https://worldofcode.org/api)
- **Shell (da servers):** `getValues`, `showCnt`

## Caveats (please read)

- **Keyword heuristic on commit messages ⇒ candidates, not confirmed CVEs.** Precision varies by
  category; confirm before acting.
- **Freshness:** flags are as current as the last ingested hour; the interactive panel shows the
  watermark. The full historical maps (`c2P`/`b2P`/…) are at the released corpus version.
- **Very recent commits may show "fix diff pending":** real-time ingestion is commit-first; trees and
  blobs (needed for the diff and the still-exposed check) arrive shortly after via backfill.
- **A flagged commit with no recorded date shows "unknown"** (the flag stream is joined to commit
  dates separately).
- **A project may arrive through more than one ingest path.** Real-time ingestion is **not
  GitHub-only**: it covers GitHub (hourly GH-Archive push events) **and other forges — GitLab and the
  rest — via their own real-time forge updates**. Separately, a mirror lane pulls large/full histories
  (e.g. full clones) that don't come through the per-event feeds. So a single project can show up under
  several names/paths across these. Firefox, for example, is split: the live `mozilla-firefox`/`firefox`
  repos (real-time forge updates) plus the `gecko-dev` history mirror — "all of Firefox" means **all**
  of them. When scoping a project, union its names across the forge-update and mirror paths rather than
  assuming one covers everything.

*See also: [What WoC Can Do](capabilities.md) · [Prioritization demo](https://worldofcode.org/prioritize) · [Backport Provenance](https://worldofcode.org/mozdemo)*
