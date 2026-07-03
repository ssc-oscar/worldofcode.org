# Impact Explorer data

Precomputed JSON that powers the `/impact` page (Impact Explorer). Both files are
static assets served from the site root; the page fetches them at runtime.

- `summary.json` — hero stats, leaderboards (science software, paper-grounded repos,
  furthest-reaching papers, toolmakers), the reuse-vs-grounding scatter, per-anchor
  connectivity + decoupling, field breakdown, and caveats.
- `repos.json` — compact array-of-arrays index of all triangulated science-software
  anchors (~50.8k repos) for the client-side lookup box. Columns in `.cols`.

## Regenerating

Source tables live in `ssc-oscar/cite-sw` (cloned on da2 at `~/swsc/cite-sw`; see its
`WEBSITE_SPEC.md`). Corpus watermark **V2604**. To rebuild after a corpus refresh:

```
python3 frontend/scripts/build-impact-data.py
```

The script joins `sci/triangulate/{signals,anchors}.tsv`, `sci/repo_sw_impact.tsv`,
`sci/repo_meta.tsv`, `sci/repo_paper_cnt.tsv`, `sci/paper_impact.clean.tsv`,
`sci/top_{paper_titles,author_names}.tsv`, and `sci/author_impact.tsv` on the
lowercased WoC project name (url2woc space). Per-anchor connectivity and decoupling
figures are transcribed from `sci/triangulate/TRIANGULATION.md`.
