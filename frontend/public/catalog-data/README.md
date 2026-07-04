# Data Catalog registry

`registry.json` powers the `/catalog` page (Data Catalog / Table Explorer). It is a static
asset the page fetches at runtime — one entry per WoC table family (schema, join axis, shard
layout, storage locations, validity, byte sizes, producer/consumers).

## Regenerating

```
python3 frontend/scripts/build-catalog-data.py
```

Two passes (per `~/lookup/DATA_CATALOG_SPEC.md`):
1. a hand-curated **seed** transcribed from `~/lookup/TABLE_INVENTORY.md`, `DATA_CATALOG_SPEC.md`,
   and `map-types.md` (schemas, axes, producers, consumers);
2. a read-only **auto-scan** of the reachable flat-table dirs (`/da?_data/basemaps/gz`,
   `~/work1/gz`) that fills real `bytes_per_shard`, shard count, validity (a ≤1 KB gzip is an
   empty never-built table → `valid:false`), and field count (to flag schema drift).

Run it on a da host and on isaac and the passes merge — each host contributes the sizes/validity
for the mounts it can see. Watermark is `V2604`; bump `VER` in the script for a new corpus.

The catalog is read-only: it never mutates any table. Sample-row and calibrate actions are
rendered as copy-paste commands rather than executed, so no backend shells into da3.
