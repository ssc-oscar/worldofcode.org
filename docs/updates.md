# Major updates in August, 2026

- **V2605 data now available** — the latest corpus watermark: **7.3B commits**, 27.0B blobs, 25.5B trees, 350.7M repositories (283.6M projects after fork resolution), 123.7M raw author IDs. All servers on RHEL9. (The homepage counters show these live.)

- **New interactive tools on the site** — no setup required, explore directly in the browser:
  - [Impact Explorer](https://worldofcode.org/impact) — the reciprocal impact of software and science: which papers a tool cites, which papers use it, and how far its reuse reaches (built on the cross-corpus graph; data & method: [arXiv:2606.28120](https://arxiv.org/abs/2606.28120)).
  - [Data Catalog](https://worldofcode.org/catalog) — every WoC table: where it lives, its schema, and how to read it, with a field-checklist that turns a chosen set of fields into a concrete join/split plan with an estimated run time.
  - [Network Explorer](https://worldofcode.org/explore) — start from any project, author, or commit and expand the World-of-Code relationship graph outward, node by node.
  - [Backport Provenance](https://worldofcode.org/mozdemo) — for a vendored third-party fix, answers when the upstream fix landed, whether it was adopted or superseded, and who downstream is still exposed.

- Near-real-time data ingestion (hourly GitHub-Archive streaming), an incremental layered object store, and faster commit-diff extraction are being rolled into the pipeline.

# Major updates in May, 2026

- The docs now include a new unified hackathon tutorial that brings together setup, architecture, shell lookup workflows, Python usage, MongoDB, ClickHouse, and web API access. Start with [Current Tutorial](tutorial.md).

# Major updates in Sep, 2025

- Major new functionality: risk assessment <a href="https://worldofcode.org/drs">DRS</a>

- all servers are now on rhel9: please report problems

- p2c and all (except fot p2P and P2p) maps are bad for version V2412: estimated fix in two to three weeks

- V2412 has project names in lower case to avoid duplicating
  them

- project names have format host_folder_folder/... for non-github
  and user_repo for github
