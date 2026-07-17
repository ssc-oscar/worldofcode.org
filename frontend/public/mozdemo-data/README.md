# mozdemo data

`examples.json` powers the `/mozdemo` page ("Backport Provenance") — the Mozilla-facing
demo of WoC answering three updatebot scenarios for vendored libwebrtc backports
(see `bb:swsc/lookup` `coord/shared/mozdemo/`).

Precomputed worked examples: for each Firefox backport commit, the three panels
(when the upstream fix landed + fix-variant fragmentation; adoption vs. supersession;
who is still exposed) resolved from WoC maps.

## Regenerating

```
python3 frontend/scripts/build-mozdemo-data.py
```

Bound to **V2604** via the `~/lookup/getValues` CLI (the reliable data path on da2; the
HTTP `/lookup/map` API 500s on the compound `bb2cf` map, and python-woc's default profile
can't locate the shard files from da2). Maps used: `c2fbb` (commit→file/blob deltas),
`bb2cf` (old_blob→fix transitions), `c2P` (commit→projects), `c2dat` (commit time),
`b2fa` (blob first appearance). Commit title comes verbatim from the commit-object API.

**Known limit (surfaced on the page, not hidden):** panel (b)'s "still-exposed" enumeration
needs a fresh `b2P`; `b2P` V..V2605 do not index the Nov-2023 target blobs, so only the
"known-fixed" set is listed. Proven end to end on libpixman/CVE-2022-44638 (662 projects).
