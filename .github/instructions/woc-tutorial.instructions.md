---
applyTo: "**"
---

# World of Code tutorial instructions

Use this file as the compact, reusable operating guide for World of Code work in this repository.

## Source priority

1. `docs/tutorial.md` is the canonical tutorial and should be treated as the current source of truth.
2. `docs/map-types.md` is the inventory/reference for map families and naming.
3. `docs/old_stuff.md` preserves supplemental older material that is still worth consulting for edge cases or historical workflows.
4. `docs/getting_started.md` keeps useful links, objectives, and disclaimers that complement the tutorial.
5. `docs/tutorial_legacy.md` is legacy material and should not override the current tutorial.

## WoC setup and access

- Assume users need GitHub, Bitbucket, an SSH key, registration, and `da` server access before they can follow data examples.
- Preferred login patterns are `ssh da0` when `~/.ssh/config` is set up, or `ssh -p443 username@da0.eecs.utk.edu` otherwise.
- When describing local-server workflows, prefer paths and commands that run directly on a `da` server.

## WoC architecture model

- Raw git objects live in `/da5_data/All.blobs/{commit,tree,tag,blob}_Num.{idx,bin}`.
- Fast random-access maps live under `/da[345]_fast/` and basemap copies under `/da[0-8]_data/basemaps/`.
- Ordered-by-key flat files live under `/da[0-8]_data/basemaps/gz/`.
- `.tch` maps are for random lookup by key; flat `.s` or `.gz` files are for streaming, scans, joins, and large-scale batch analysis.
- WoC versions matter. Preserve or expose version suffixes such as `S`, `T`, `U`, `V3`, `V2409`, `V2412`, and `V2510` when they affect reproducibility.

## Preferred shell workflow

- For interactive inspection, start with `~/lookup/showCnt` for object content and `~/lookup/getValues` for relationship maps.
- Follow the tutorial's shell progression: inspect a commit, follow tree/blob/object structure, then pivot into map traversals.
- Treat `getValues` as a point-lookup tool, not a bulk-scan tool.
- For large-scale analysis, prefer a shell-first split -> join -> merge pattern over ad hoc random lookups:
  - split work into shard-friendly batches
  - stream sorted or compressed flat files
  - join intermediate outputs with standard shell tools
  - merge results into compact final artifacts
- Prefer scratch space under `/data/play/<username>` for large intermediate files rather than `/home/<username>`.

## Preferred Python workflow

- Emphasize streaming and iterator-based processing instead of loading large WoC datasets into memory.
- Prefer small composable passes over monolithic scripts.
- When using `python-woc` locally, assume `WocMapsLocal` needs a valid profile that includes object metadata and blob mappings if blob content is required.
- If blob content lookups fail because `blob.bin` is missing, the profile is incomplete rather than the blob absent.
- Invoke profile detection as `python -m woc.detect ...`; do not recommend direct execution of `woc/detect.py`.

## Current backend guidance

- Current tutorial guidance reflects MongoDB on `da5`, ClickHouse on `da3`, and recent ClickHouse examples using `commit_v2510`.
- Web API coverage belongs in scope when relevant; current backend routes are organized around `/lookup`, `/mongo`, `/clickhouse`, and `/auth`.
- These deployment details may change, so verify server-specific claims before presenting them as permanent facts.

## Documentation and website guidance

- Preserve useful examples, notes, and edge-case guidance from older material either in the main flow or as linked supplemental content.
- Do not replace the current tutorial with older duplicated text just because it is longer.
- When updating website docs, keep the main tutorial coherent and move overflow, legacy, or reference-heavy content into companion pages instead of deleting it.
- Keep navigation and overview pages pointing to the current local docs rather than stale external tutorial links.
- When homepage or docs notices mention access or onboarding, keep them aligned with the current tutorial and current registration links.

## Response style for tutorial-related work

- Be concrete: include exact commands, paths, map names, and version suffixes when they matter.
- Distinguish random lookup workflows from full-scan workflows.
- Distinguish current deployment facts from historical background.
- If a request conflicts with the current tutorial, follow `docs/tutorial.md` first and use supplemental files only to fill genuine gaps.
