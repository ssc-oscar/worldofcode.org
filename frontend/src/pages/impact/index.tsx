import { useEffect, useMemo, useRef, useState } from 'react';
import WaveLayout from '@/layouts/wave-layout';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountUp from 'react-countup';
import '@/styles/gradient-text.css';

/* ------------------------------------------------------------------ types -- */
interface Anchor {
  key: string;
  n: number;
  dep: number;
  grounding: number;
  uptake: number;
  publishes: number;
  depMed: number;
  depP90: number;
}
interface FieldAgg { field: string; count: number; dependents: number }
interface SoftwareRow {
  name: string;
  dependents: number;
  tags: string;
  field: string | null;
  layer: string | null;
  stars: number | null;
}
interface GroundedRow {
  name: string;
  papers: number;
  field: string | null;
  layer: string | null;
  stars: number | null;
  tags: string;
  aggregator: boolean;
}
interface PaperRow {
  doi: string;
  repos: number;
  title: string | null;
  year: number | null;
  cites: number | null;
}
interface AuthorRow {
  name: string;
  reach: number;
  papers: number | null;
  cites: number | null;
  who: string | null;
}
interface ScatterPt {
  name: string;
  dependents: number;
  papers: number;
  field: string;
  stars: number;
}
interface Summary {
  watermark: string;
  stats: Record<string, number>;
  counts: Record<string, number>;
  anchors: Anchor[];
  decoupling: { anchor: string; n: number; rho: number }[];
  fields: FieldAgg[];
  leaderboards: {
    software: SoftwareRow[];
    grounded: GroundedRow[];
    papers: PaperRow[];
    authors: AuthorRow[];
  };
  scatter: ScatterPt[];
  caveats: string[];
}
type RepoRow = [string, number, number, number, number, string, string | null, number | null];
interface Repos { cols: string[]; rows: RepoRow[] }

/* ---------------------------------------------------------------- palette -- */
// Validated categorical palette (dataviz skill). Field identity is fixed by
// name, never by rank, so colors never repaint when a filter changes.
const FIELD_ORDER = [
  'Computer Science', 'Biology', 'Engineering', 'Earth Science',
  'Medicine', 'Physics', 'Data Science', 'Statistics'
];
const PALETTE = {
  light: ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'],
  dark: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926']
};
const OTHER = { light: '#8a8a82', dark: '#9a998e' };
function fieldColor(field: string | null | undefined, mode: 'light' | 'dark') {
  const i = field ? FIELD_ORDER.indexOf(field) : -1;
  return i >= 0 ? PALETTE[mode][i] : OTHER[mode];
}

/* anchor provenance letters -> label + hue slot */
const ANCHOR_META: Record<string, { label: string; full: string; slot: number }> = {
  S: { label: 'SciCat', full: 'SciCat — LLM-curated science repositories', slot: 0 },
  J: { label: 'JOSS', full: 'Journal of Open Source Software', slot: 1 },
  C: { label: 'Softcite', full: 'Softcite curator tool-name set', slot: 6 },
  P: { label: 'SciPkg', full: 'CRAN / conda package registry', slot: 4 }
};

/* --------------------------------------------------------------- helpers -- */
function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k';
  return String(n);
}
function displayName(woc: string): string {
  return woc.replace(/_/, '/');
}
function repoUrl(woc: string): string | null {
  // host-prefixed names (bitbucket.org_..., codeberg.org_...) -> that host
  const dot = woc.indexOf('.');
  const us = woc.indexOf('_');
  if (dot >= 0 && dot < us) return 'https://' + woc.replace(/_/g, '/');
  if (us < 0) return null;
  return 'https://github.com/' + woc.slice(0, us) + '/' + woc.slice(us + 1);
}

/* ------------------------------------------------------------------- data -- */
function useImpact() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [repos, setRepos] = useState<Repos | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/impact-data/summary.json')
      .then((r) => r.json())
      .then((d) => live && setSummary(d))
      .catch(() => live && setErr(true));
    fetch('/impact-data/repos.json')
      .then((r) => r.json())
      .then((d) => live && setRepos(d))
      .catch(() => {});
    return () => { live = false; };
  }, []);
  return { summary, repos, err };
}

/* ------------------------------------------------------------------- hero -- */
function Ticker({ value, label, sub, icon }: { value: number; label: string; sub?: string; icon: string }) {
  return (
    <div className="group hover:scale-102 flex w-40 flex-col items-center justify-center gap-1 transition-all duration-300">
      <div className="text-primary/80 flex items-center gap-2 text-2xl font-600 tabular-nums tracking-wider">
        <span className={cn('text-primary/50 text-lg', icon)} />
        <CountUp end={value} duration={1.6} formattingFn={fmt} />
      </div>
      <Separator className="color-primary/80 w-3/4 transition-all duration-300 group-hover:w-full" />
      <p className="text-primary/80 text-sm font-medium">{label}</p>
      {sub && <p className="text-primary/50 text-center text-xs">{sub}</p>}
    </div>
  );
}

function Hero({ s }: { s: Summary }) {
  return (
    <div className="z-1 flex flex-col items-center gap-5 pt-10">
      <div className="dark:bg-slate-8/70 flex items-center gap-2 rounded-full bg-slate-100/70 px-4 py-1 text-xs backdrop-blur-sm">
        <span className="i-material-symbols:hub-outline text-primary/60" />
        <span className="text-primary/70 font-medium">
          Cross-corpus graph · {fmt(s.stats.edges)} typed edges · watermark {s.watermark}
        </span>
      </div>
      <h1 className="gradient-text text-center text-5xl font-bold md:text-6xl">Impact Explorer</h1>
      <p className="text-primary/60 max-w-2xl text-center text-lg">
        The reciprocal impact of <span className="text-primary/90 font-medium">software</span> and{' '}
        <span className="text-primary/90 font-medium">science</span> — which papers a tool grounds
        itself in, which research it enables, and how far its reuse reaches. Every path is a
        traversal over one graph joining World&nbsp;of&nbsp;Code projects, papers, authors, and
        packages.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
        <Ticker value={s.stats.anchoredRepos} label="Science repos" sub="triangulated anchors" icon="i-material-symbols:labs-outline" />
        <Ticker value={s.stats.dependsOn} label="Dependencies" sub="project → project" icon="i-material-symbols:account-tree-outline" />
        <Ticker value={s.stats.mentionsDoi} label="Paper links" sub="repo cites paper" icon="i-material-symbols:menu-book-outline" />
        <Ticker value={s.stats.papers} label="Papers" sub="DOIs in the graph" icon="i-material-symbols:description-outline" />
        <Ticker value={s.stats.s2authors} label="Scholars" sub="linked authors" icon="i-material-symbols:groups-outline" />
      </div>
    </div>
  );
}

/* --------------------------------------------------------- provenance tag -- */
function AnchorBadges({ tags, mode }: { tags: string; mode: 'light' | 'dark' }) {
  const letters = Array.from(new Set(tags.split(''))).filter((l) => ANCHOR_META[l]);
  if (!letters.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {letters.map((l) => {
        const m = ANCHOR_META[l];
        const c = PALETTE[mode][m.slot];
        return (
          <span
            key={l}
            title={m.full}
            className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ color: c, borderColor: c + '66', background: c + '14' }}
          >
            {m.label}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ search card -- */
function SearchPanel({ repos, mode }: { repos: Repos | null; mode: 'light' | 'dark' }) {
  const [q, setQ] = useState('');
  const idx = useMemo(() => {
    if (!repos) return null;
    return repos.rows;
  }, [repos]);

  const matches = useMemo(() => {
    if (!idx || q.trim().length < 2) return [];
    const needle = q.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\//g, '_');
    const out: RepoRow[] = [];
    for (let i = 0; i < idx.length && out.length < 8; i++) {
      if (idx[i][0].includes(needle)) out.push(idx[i]);
    }
    // rank exact / prefix first, then by dep_indeg
    out.sort((a, b) => {
      const ap = a[0] === needle ? 0 : a[0].startsWith(needle) ? 1 : 2;
      const bp = b[0] === needle ? 0 : b[0].startsWith(needle) ? 1 : 2;
      return ap - bp || b[1] - a[1];
    });
    return out.slice(0, 6);
  }, [idx, q]);

  const [picked, setPicked] = useState<RepoRow | null>(null);
  const active = picked ?? (matches.length ? matches[0] : null);

  return (
    <div className="w-full max-w-3xl">
      <div className="relative">
        <span className="i-material-symbols:search text-primary/40 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg" />
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPicked(null); }}
          placeholder={repos ? 'Look up any repository — e.g. pytorch/pytorch, nf-core/rnaseq, wviechtb/metafor' : 'Loading index…'}
          disabled={!repos}
          className="h-12 pl-10 text-base"
        />
      </div>

      {q.trim().length >= 2 && matches.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matches.map((m) => (
            <button
              key={m[0]}
              onClick={() => setPicked(m)}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                active && active[0] === m[0]
                  ? 'bg-primary text-primary-foreground'
                  : 'dark:bg-slate-8 dark:hover:bg-slate-7 bg-slate-100 hover:bg-slate-200'
              )}
            >
              {displayName(m[0])}
            </button>
          ))}
        </div>
      )}

      {q.trim().length >= 2 && !matches.length && (
        <p className="text-primary/50 mt-3 text-sm">
          No anchored repository matches “{q}”. The index covers the {fmt(50835)} triangulated
          science-software anchors; a general repo may simply not be in the seed set.
        </p>
      )}

      {active && <ImpactCard row={active} mode={mode} />}
    </div>
  );
}

function CardStat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="dark:bg-slate-900/60 flex flex-col gap-0.5 rounded-lg bg-white/60 p-3">
      <span className="text-2xl font-700 tabular-nums" style={accent ? { color: accent } : undefined}>{value}</span>
      <span className="text-primary/70 text-xs font-medium">{label}</span>
      {hint && <span className="text-primary/40 text-[10px] leading-tight">{hint}</span>}
    </div>
  );
}

function ImpactCard({ row, mode }: { row: RepoRow; mode: 'light' | 'dark' }) {
  const [name, dep, grounding, uptake, publishes, tags, field, stars] = row;
  const url = repoUrl(name);
  const accent = fieldColor(field, mode);
  return (
    <div className="dark:bg-slate-8/70 mt-4 rounded-xl border border-slate-200/60 bg-slate-50/80 p-5 backdrop-blur-sm dark:border-slate-700/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full" style={{ background: accent }} />
            <a
              href={url ?? undefined}
              target={url ? '_blank' : undefined}
              className={cn('font-mono text-lg font-600', url && 'hover:underline underline-offset-4')}
            >
              {displayName(name)}
            </a>
            {url && <span className="i-material-symbols:open-in-new text-primary/40 text-sm" />}
          </div>
          <div className="text-primary/60 flex flex-wrap items-center gap-2 text-xs">
            {field && <span>{field}</span>}
            {stars != null && stars > 0 && (
              <span className="flex items-center gap-0.5">
                <span className="i-material-symbols:star text-yellow-500" /> {fmt(stars)}
              </span>
            )}
          </div>
        </div>
        <AnchorBadges tags={tags} mode={mode} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CardStat label="Ecosystem impact" value={fmt(dep)} hint="projects depending on it" accent={dep > 0 ? accent : undefined} />
        <CardStat label="Literature grounding" value={fmt(grounding)} hint="distinct papers it cites" />
        <CardStat label="Scientific uptake" value={fmt(uptake)} hint="papers that name it" />
        <CardStat label="Publishes package" value={publishes ? 'Yes' : 'No'} hint="on a package registry" />
      </div>
      <p className="text-primary/40 mt-3 text-[11px]">
        All counts are lower bounds. Provenance badges show which independent anchor(s) flagged this
        as scientific software.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ leaderboards -- */
function Rank({ i }: { i: number }) {
  return (
    <span className={cn(
      'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-700 tabular-nums',
      i < 3 ? 'bg-primary/10 text-primary' : 'text-primary/40'
    )}>{i + 1}</span>
  );
}

function BarRow({
  i, name, url, value, valueLabel, max, sub, color, badges, aggregator
}: {
  i: number; name: string; url?: string | null; value: number; valueLabel: string;
  max: number; sub?: React.ReactNode; color: string; badges?: React.ReactNode; aggregator?: boolean;
}) {
  const pct = Math.max(2, (value / max) * 100);
  return (
    <div className="group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/40">
      <Rank i={i} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {url ? (
            <a href={url} target="_blank" className="truncate font-mono text-sm font-500 hover:underline underline-offset-4">{name}</a>
          ) : (
            <span className="truncate font-mono text-sm font-500">{name}</span>
          )}
          {aggregator && (
            <span title="Bibliography-aggregation repo: enumerates thousands of DOIs; high count ≠ software impact" className="i-material-symbols:info-outline text-primary/30 shrink-0 text-xs" />
          )}
          {badges}
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50 dark:bg-slate-700/40">
          <div className="h-full rounded-full" style={{ width: pct + '%', background: color }} />
        </div>
        {sub && <div className="text-primary/50 mt-1 text-xs">{sub}</div>}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-700 tabular-nums">{valueLabel}</div>
      </div>
    </div>
  );
}

function Leaderboards({ s, mode }: { s: Summary; mode: 'light' | 'dark' }) {
  const lb = s.leaderboards;
  const swMax = lb.software[0]?.dependents || 1;
  const grMax = lb.grounded[0]?.papers || 1;
  const paMax = lb.papers[0]?.repos || 1;
  const auMax = lb.authors[0]?.reach || 1;

  return (
    <Tabs defaultValue="software" className="w-full">
      <TabsList className="mx-auto flex w-fit flex-wrap">
        <TabsTrigger value="software" className="gap-1"><span className="i-material-symbols:deployed-code-outline" />Software impact</TabsTrigger>
        <TabsTrigger value="grounded" className="gap-1"><span className="i-material-symbols:menu-book-outline" />Paper-grounded</TabsTrigger>
        <TabsTrigger value="papers" className="gap-1"><span className="i-material-symbols:trending-up" />Reaching papers</TabsTrigger>
        <TabsTrigger value="authors" className="gap-1"><span className="i-material-symbols:person-outline" />Toolmakers</TabsTrigger>
      </TabsList>

      <TabsContent value="software" className="mt-4">
        <LbCaption>Science software ranked by <b>ecosystem impact</b> — how many other projects depend on it (reverse <code>DEPENDS_ON</code>).</LbCaption>
        <div className="max-h-[28rem] overflow-y-auto pr-1">
          {lb.software.map((r, i) => (
            <BarRow key={r.name} i={i} name={displayName(r.name)} url={repoUrl(r.name)}
              value={r.dependents} valueLabel={fmt(r.dependents)} max={swMax}
              color={fieldColor(r.field, mode)}
              sub={<span>{r.field ?? '—'}{r.stars ? ` · ★ ${fmt(r.stars)}` : ''}</span>}
              badges={<AnchorBadges tags={r.tags} mode={mode} />} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="grounded" className="mt-4">
        <LbCaption>Repositories most <b>grounded in literature</b> — distinct papers they cite (giants flagged are bibliography aggregators).</LbCaption>
        <div className="max-h-[28rem] overflow-y-auto pr-1">
          {lb.grounded.map((r, i) => (
            <BarRow key={r.name} i={i} name={displayName(r.name)} url={repoUrl(r.name)}
              value={r.papers} valueLabel={fmt(r.papers)} max={grMax}
              color={fieldColor(r.field, mode)} aggregator={r.aggregator}
              sub={<span>{r.field ?? '—'}{r.stars ? ` · ★ ${fmt(r.stars)}` : ''}</span>}
              badges={<AnchorBadges tags={r.tags} mode={mode} />} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="papers" className="mt-4">
        <LbCaption>Papers reaching the <b>most distinct science repositories</b> — the reproducibility/packaging layer leads, distinct from raw citation count.</LbCaption>
        <div className="max-h-[28rem] overflow-y-auto pr-1">
          {lb.papers.map((r, i) => (
            <BarRow key={r.doi} i={i}
              name={r.title ?? r.doi}
              url={`https://doi.org/${r.doi}`}
              value={r.repos} valueLabel={fmt(r.repos)} max={paMax}
              color={PALETTE[mode][1]}
              sub={<span>{r.year ? `${r.year} · ` : ''}{r.cites != null ? `${fmt(r.cites)} scholarly citations` : r.doi}</span>} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="authors" className="mt-4">
        <LbCaption>Scholars whose work the corpus builds on — repositories reachable from their papers. DOI-anchored linking surfaces real <b>toolmakers</b>, not homonyms.</LbCaption>
        <div className="max-h-[28rem] overflow-y-auto pr-1">
          {lb.authors.map((r, i) => (
            <BarRow key={r.name + i} i={i} name={r.name}
              value={r.reach} valueLabel={fmt(r.reach)} max={auMax}
              color={PALETTE[mode][4]}
              badges={r.who ? <Badge variant="secondary" className="text-[10px]">{r.who}</Badge> : undefined}
              sub={<span>{r.papers != null ? `${r.papers} papers` : ''}{r.cites != null ? ` · ${fmt(r.cites)} citations` : ''}</span>} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
function LbCaption({ children }: { children: React.ReactNode }) {
  return <p className="text-primary/60 mx-auto mb-3 max-w-3xl text-center text-sm">{children}</p>;
}

/* --------------------------------------------------------------- scatter -- */
function Scatter({ pts, mode }: { pts: ScatterPt[]; mode: 'light' | 'dark' }) {
  const [hover, setHover] = useState<ScatterPt | null>(null);
  const W = 760, H = 460, padL = 54, padR = 20, padT = 20, padB = 46;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const logTicks = [1, 10, 100, 1000, 10000];
  const xMin = 0, xMax = Math.log10(10000); // papers (grounding)
  const yMin = 0, yMax = Math.log10(20000); // dependents
  const sx = (v: number) => padL + (Math.log10(Math.max(1, v)) - xMin) / (xMax - xMin) * plotW;
  const sy = (v: number) => padT + plotH - (Math.log10(Math.max(1, v)) - yMin) / (yMax - yMin) * plotH;
  const grid = mode === 'dark' ? '#ffffff14' : '#0000000f';
  const axis = mode === 'dark' ? '#c3c2b7' : '#52514e';
  const fieldsUsed = FIELD_ORDER.filter((f) => pts.some((p) => p.field === f));

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {fieldsUsed.map((f) => (
          <span key={f} className="text-primary/70 flex items-center gap-1.5 text-xs">
            <span className="inline-block size-2.5 rounded-full" style={{ background: fieldColor(f, mode) }} />{f}
          </span>
        ))}
        <span className="text-primary/50 flex items-center gap-1.5 text-xs">
          <span className="inline-block size-2.5 rounded-full" style={{ background: OTHER[mode] }} />Other
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full min-w-[560px] max-w-3xl" role="img"
          aria-label="Reuse versus literature grounding for science software">
          {/* grid + axes (log-log) */}
          {logTicks.map((t) => (
            <g key={'x' + t}>
              <line x1={sx(t)} y1={padT} x2={sx(t)} y2={padT + plotH} stroke={grid} />
              <text x={sx(t)} y={padT + plotH + 16} fill={axis} fontSize="10" textAnchor="middle">{fmt(t)}</text>
            </g>
          ))}
          {logTicks.map((t) => (
            <g key={'y' + t}>
              <line x1={padL} y1={sy(t)} x2={padL + plotW} y2={sy(t)} stroke={grid} />
              <text x={padL - 8} y={sy(t) + 3} fill={axis} fontSize="10" textAnchor="end">{fmt(t)}</text>
            </g>
          ))}
          <text x={padL + plotW / 2} y={H - 6} fill={axis} fontSize="11" textAnchor="middle">Distinct papers cited  →  literature grounding</text>
          <text x={14} y={padT + plotH / 2} fill={axis} fontSize="11" textAnchor="middle" transform={`rotate(-90 14 ${padT + plotH / 2})`}>Dependent projects  →  ecosystem impact</text>

          {pts.map((p) => {
            const r = Math.max(2.5, Math.min(9, Math.sqrt((p.stars || 1)) / 12 + 2.5));
            const c = fieldColor(p.field, mode);
            const on = hover?.name === p.name;
            return (
              <circle key={p.name} cx={sx(p.papers)} cy={sy(p.dependents)} r={on ? r + 2 : r}
                fill={c} fillOpacity={on ? 0.95 : 0.62}
                stroke={mode === 'dark' ? '#1a1a19' : '#ffffff'} strokeWidth={1}
                onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }} />
            );
          })}
        </svg>
      </div>
      <div className="text-primary/70 mt-1 h-5 text-center text-xs">
        {hover ? (
          <span><b className="font-mono">{displayName(hover.name)}</b> — {fmt(hover.dependents)} dependents · {fmt(hover.papers)} papers · {hover.field}{hover.stars ? ` · ★ ${fmt(hover.stars)}` : ''}</span>
        ) : (
          <span className="text-primary/40">Hover a point · marker size ∝ √stars · axes are log-scaled</span>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- decoupling -- */
function Decoupling({ rows, mode }: { rows: { anchor: string; n: number; rho: number }[]; mode: 'light' | 'dark' }) {
  return (
    <div className="dark:bg-slate-8/60 rounded-xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60">
      <h3 className="text-primary/90 font-600">Reuse vs. citation coupling</h3>
      <p className="text-primary/60 mt-1 text-sm">
        Does a tool that gets reused a lot also announce a well-cited paper? Correlating ecosystem
        impact with the citations of the announcing paper gives a <b>weak, consistently positive</b>{' '}
        coupling across every anchor — the sign is stable, but it is far from a strong signal.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {rows.map((r) => {
          const w = (r.rho / 0.5) * 100;
          return (
            <div key={r.anchor} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm font-500">{r.anchor}</span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/40">
                <div className="h-full rounded-full" style={{ width: Math.min(100, w) + '%', background: PALETTE[mode][0] }} />
              </div>
              <span className="w-28 shrink-0 text-right text-xs tabular-nums text-primary/70">
                ρ = +{r.rho.toFixed(2)} <span className="text-primary/40">(n={fmt(r.n)})</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-primary/40 mt-3 text-[11px]">
        Spearman ρ over repos with positive reuse and citations. JOSS is strongest (+0.35) because
        its paper→repo link is direct; the others use a repo-declared-DOI proxy, so their magnitudes
        are lower bounds.
      </p>
    </div>
  );
}

/* --------------------------------------------------------- anchor table -- */
function AnchorTable({ anchors, mode }: { anchors: Anchor[]; mode: 'light' | 'dark' }) {
  const cols: { k: keyof Anchor; label: string }[] = [
    { k: 'dep', label: '% depended-upon' },
    { k: 'grounding', label: '% cites a paper' },
    { k: 'uptake', label: '% named by paper' },
    { k: 'publishes', label: '% publishes pkg' }
  ];
  return (
    <div className="dark:bg-slate-8/60 rounded-xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60">
      <h3 className="text-primary/90 font-600">Four independent anchors, triangulated</h3>
      <p className="text-primary/60 mt-1 text-sm">
        “Scientific software” has no single ground truth, so four independently-built seeds are
        unioned and cross-checked. They span a gradient — SciCat is paper-grounded, SciPkg is highly
        reused but weakly grounded — and their agreement stands in for the missing label.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-primary/50 text-left text-xs">
              <th className="pb-2 pr-3 font-500">Anchor</th>
              <th className="pb-2 pr-3 text-right font-500">Repos</th>
              {cols.map((c) => <th key={c.k} className="pb-2 pr-3 text-right font-500">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {anchors.map((a) => {
              const isUnion = a.key === 'Union';
              return (
                <tr key={a.key} className={cn('border-t border-slate-200/50 dark:border-slate-700/40', isUnion && 'font-600')}>
                  <td className="py-2 pr-3">{a.key}{isUnion && <span className="text-primary/40 ml-1 text-xs font-400">(all)</span>}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmt(a.n)}</td>
                  {cols.map((c) => {
                    const v = a[c.k] as number;
                    return (
                      <td key={c.k} className="py-2 pr-3 text-right tabular-nums">
                        <span className="relative inline-flex items-center justify-end gap-2">
                          <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-slate-200/60 sm:inline-block dark:bg-slate-700/40">
                            <span className="block h-full rounded-full" style={{ width: Math.min(100, v) + '%', background: PALETTE[mode][0] }} />
                          </span>
                          {v.toFixed(1)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- fields -- */
function Fields({ fields, mode }: { fields: FieldAgg[]; mode: 'light' | 'dark' }) {
  const max = Math.max(...fields.map((f) => f.count));
  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col gap-2">
        {fields.map((f) => (
          <div key={f.field} className="flex items-center gap-3">
            <span className="text-primary/80 w-32 shrink-0 truncate text-right text-sm">{f.field}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-md bg-slate-200/40 dark:bg-slate-700/30">
              <div className="h-full rounded-md" style={{ width: (f.count / max) * 100 + '%', background: fieldColor(f.field, mode) }} />
            </div>
            <span className="text-primary/60 w-14 shrink-0 text-xs tabular-nums">{fmt(f.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- section -- */
function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: string; children: React.ReactNode }) {
  return (
    <section className="z-1 flex w-full max-w-5xl flex-col items-center gap-5 pt-6">
      <div className="w-full px-4">
        <h2 className="text-primary/85 flex items-center gap-2 text-2xl font-semibold">
          {icon && <span className={cn('text-primary/50', icon)} />}{title}
        </h2>
        {subtitle && <p className="text-primary/50 mt-1 max-w-3xl text-sm">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/* --------------------------------------------------------------- page -- */
export default function ImpactPage() {
  const { resolvedTheme } = useTheme();
  const mode: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light';
  const { summary, repos, err } = useImpact();
  const topRef = useRef<HTMLDivElement>(null);

  if (err) {
    return (
      <WaveLayout>
        <div className="flex items-center gap-3 rounded-md border-2 border-dashed border-slate-500 p-6">
          <div className="i-fluent-emoji-flat:warning size-7" />
          <p>Could not load the impact dataset. Please try again shortly.</p>
        </div>
      </WaveLayout>
    );
  }

  if (!summary) {
    return (
      <WaveLayout>
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 pt-16">
          <Skeleton className="h-12 w-72 rounded-lg" />
          <Skeleton className="h-6 w-96 rounded-md" />
          <div className="flex gap-6">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-32 rounded-md" />)}
          </div>
          <Skeleton className="mt-6 h-12 w-full rounded-lg" />
        </div>
      </WaveLayout>
    );
  }

  return (
    <WaveLayout>
      <div ref={topRef} className="flex w-full flex-col items-center gap-4">
        <Hero s={summary} />

        <Section title="Look up a repository" icon="i-material-symbols:search"
          subtitle="Resolve any repository to its impact card: which anchors flag it as scientific software, and its reuse, grounding, uptake, and publishing signals.">
          <SearchPanel repos={repos} mode={mode} />
        </Section>

        <Section title="Leaderboards" icon="i-material-symbols:trophy-outline"
          subtitle="Four complementary lenses on the same graph — each surfaces a different tier of impact.">
          <Leaderboards s={summary} mode={mode} />
        </Section>

        <Section title="Reuse vs. grounding" icon="i-material-symbols:scatter-plot-outline"
          subtitle="Every science repository placed by how much it is reused (dependents) against how much literature it cites. The two are largely independent — a tool can be heavily reused with little citation, and vice versa.">
          <Scatter pts={summary.scatter} mode={mode} />
          <div className="grid w-full max-w-4xl grid-cols-1 gap-4 px-4 md:grid-cols-2">
            <Decoupling rows={summary.decoupling} mode={mode} />
            <AnchorTable anchors={summary.anchors} mode={mode} />
          </div>
        </Section>

        <Section title="Reach across scientific fields" icon="i-material-symbols:category-outline"
          subtitle="How the anchored science repositories distribute across disciplines.">
          <Fields fields={summary.fields} mode={mode} />
        </Section>

        <Section title="Read the numbers honestly" icon="i-material-symbols:balance">
          <div className="grid w-full max-w-4xl grid-cols-1 gap-3 px-4 sm:grid-cols-2">
            {summary.caveats.map((c, i) => (
              <div key={i} className="dark:bg-slate-8/50 flex items-start gap-2 rounded-lg bg-slate-100/60 p-3 text-sm">
                <span className="i-material-symbols:info-outline text-primary/40 mt-0.5 shrink-0" />
                <span className="text-primary/70">{c}</span>
              </div>
            ))}
          </div>
          <p className="text-primary/40 mt-2 max-w-2xl px-4 text-center text-xs">
            Built from the World of Code cross-corpus graph ({fmt(summary.stats.edges)} typed edges,
            watermark {summary.watermark}) joining projects, papers, authors, and packages.
          </p>
        </Section>
      </div>
    </WaveLayout>
  );
}
