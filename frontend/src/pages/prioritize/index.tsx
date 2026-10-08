import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import WaveLayout from '@/layouts/wave-layout';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import CountUp from 'react-countup';
import '@/styles/gradient-text.css';

/* ------------------------------------------------------------------ types -- */
interface Item {
  old_blob: string; fixed_blob: string | null; path: string;
  reach: number; n_commits: number; categories: string[];
  severity: number; score: number; sample_projects: string[]; more_projects: number;
}
interface Doc {
  generated_on: string;
  totals: { shared_vulns: number; distinct_projects: number; total_diffs_scanned: number };
  method: string; severity_weights: Record<string, number>; items: Item[];
}

/* -------------------------------------------------------------- severity ---- */
// category → { label, hue slot } using the validated categorical palette
const PALETTE = {
  light: ['#e34948', '#eb6834', '#eda100', '#4a3aa7', '#2a78d6', '#1baf7a', '#8a8a82'],
  dark: ['#e66767', '#d95926', '#c98500', '#9085e9', '#3987e5', '#199e70', '#9a998e']
};
const CAT: Record<string, { label: string; slot: number }> = {
  cve: { label: 'CVE', slot: 0 }, cvss_exp: { label: 'CVSS/exploit', slot: 0 }, rce: { label: 'RCE', slot: 0 },
  sqli: { label: 'SQL injection', slot: 1 }, authbypass: { label: 'auth bypass', slot: 1 },
  overflow: { label: 'overflow', slot: 1 }, memory: { label: 'memory', slot: 1 }, deser_xxe: { label: 'deserialize/XXE', slot: 1 },
  csrf_ssrf: { label: 'CSRF/SSRF', slot: 2 }, xss: { label: 'XSS', slot: 2 }, dos: { label: 'DoS', slot: 2 },
  inputval: { label: 'input validation', slot: 3 }, secfix: { label: 'security fix', slot: 4 },
  concurrency: { label: 'concurrency', slot: 5 }, vuln: { label: 'vuln', slot: 6 }
};
const catInfo = (c: string) => CAT[c] || { label: c, slot: 6 };
const catColor = (c: string, mode: 'light' | 'dark') => PALETTE[mode][catInfo(c).slot];

/* --------------------------------------------------------------- helpers -- */
const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n));
const sha = (s: string | null, n = 10) => (s ? s.slice(0, n) : '—');
const proj = (p: string) => p.replace(/_/, '/');
const ghUrl = (p: string) => {
  const dot = p.indexOf('.'), us = p.indexOf('_');
  if (dot >= 0 && dot < us) return 'https://' + p.replace(/_/g, '/');
  return us < 0 ? null : 'https://github.com/' + p.slice(0, us) + '/' + p.slice(us + 1);
};

/* --------------------------------------------------------------- row -- */
function Row({ item, rank, mode, maxScore }: { item: Item; rank: number; mode: 'light' | 'dark'; maxScore: number }) {
  const [open, setOpen] = useState(false);
  const top = item.categories[0];
  const tone = top ? catColor(top, mode) : PALETTE[mode][6];
  const pct = Math.max(4, (item.score / maxScore) * 100);
  return (
    <div className={cn('rounded-lg border transition-colors', open ? 'border-primary/30 dark:bg-slate-800/40 bg-slate-100/60' : 'border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/30')}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
        <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-700 tabular-nums',
          rank <= 3 ? 'text-white' : 'text-primary/50')} style={rank <= 3 ? { background: tone } : undefined}>{rank}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-mono text-sm font-500">{item.path.split('/').pop()}</span>
            <div className="flex flex-wrap gap-1">
              {item.categories.slice(0, 3).map((c) => {
                const col = catColor(c, mode);
                return <span key={c} className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ color: col, background: col + '18', border: `1px solid ${col}44` }}>{catInfo(c).label}</span>;
              })}
            </div>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50 dark:bg-slate-700/40">
            <div className="h-full rounded-full" style={{ width: pct + '%', background: tone }} />
          </div>
          <div className="text-primary/50 mt-1 text-xs">
            reach <b className="text-primary/70">{item.reach}</b> projects · {item.n_commits} fix commits · vuln <span className="font-mono">blob:{sha(item.old_blob)}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-700 tabular-nums" style={{ color: tone }}>{item.score.toFixed(1)}</div>
          <div className="text-primary/40 text-[10px]">priority</div>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-200/50 px-4 py-3 text-xs dark:border-slate-700/40">
          <div className="text-primary/60 mb-2">
            <span className="font-mono">{item.path}</span> — vulnerable <span className="font-mono text-primary/80">blob:{sha(item.old_blob, 12)}</span>
            {item.fixed_blob && <> → fixed <span className="font-mono text-primary/80">blob:{sha(item.fixed_blob, 12)}</span></>}
          </div>
          <div className="text-primary/50 mb-1 font-medium">Carried &amp; fixed in {item.reach} projects (sample):</div>
          <div className="flex flex-wrap gap-1">
            {item.sample_projects.map((p) => {
              const u = ghUrl(p);
              return u ? <a key={p} href={u} target="_blank" className="dark:bg-slate-8 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] hover:underline">{proj(p)}</a>
                : <span key={p} className="dark:bg-slate-8 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">{proj(p)}</span>;
            })}
            {item.more_projects > 0 && <span className="text-primary/40 px-1 text-[11px]">+{item.more_projects} more</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- page -- */
export default function PrioritizePage() {
  const { resolvedTheme } = useTheme();
  const mode: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light';
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  useEffect(() => {
    fetch('/prioritize-data/top.json').then((r) => r.json()).then(setDoc).catch(() => setErr(true));
  }, []);

  const cats = useMemo(() => {
    if (!doc) return [];
    const s = new Set<string>();
    doc.items.forEach((i) => i.categories.forEach((c) => s.add(c)));
    return ['all', ...Array.from(s).sort((a, b) => (doc.severity_weights[b] || 0) - (doc.severity_weights[a] || 0))];
  }, [doc]);

  const shown = useMemo(() => {
    if (!doc) return [];
    return doc.items.filter((i) => {
      if (cat !== 'all' && !i.categories.includes(cat)) return false;
      if (q.trim()) {
        const n = q.trim().toLowerCase();
        if (!i.path.toLowerCase().includes(n) && !i.sample_projects.some((p) => p.toLowerCase().includes(n))) return false;
      }
      return true;
    });
  }, [doc, cat, q]);

  const maxScore = doc?.items[0]?.score || 1;

  if (err) return <WaveLayout><div className="rounded-md border-2 border-dashed border-slate-500 p-6 text-sm">Could not load the prioritization dataset.</div></WaveLayout>;
  if (!doc) return <WaveLayout><div className="flex w-full max-w-3xl flex-col gap-4 pt-16"><Skeleton className="h-12 w-72 rounded-lg" /><Skeleton className="h-40 w-full rounded-xl" /></div></WaveLayout>;

  return (
    <WaveLayout>
      <Helmet><title>WoC — Vulnerability Prioritization</title><meta name="robots" content="noindex" /></Helmet>
      <div className="flex w-full max-w-4xl flex-col items-center gap-4">
        <div className="z-1 flex flex-col items-center gap-3 pt-10">
          <div className="dark:bg-slate-8/70 flex items-center gap-2 rounded-full bg-slate-100/70 px-4 py-1 text-xs backdrop-blur-sm">
            <span className="i-material-symbols:shield-lock-outline text-primary/60" />
            <span className="text-primary/70 font-medium">Copied vulnerable code, ranked by reach × severity</span>
          </div>
          <h1 className="gradient-text text-center text-4xl font-bold md:text-5xl">Vulnerability Prioritization</h1>
          <p className="text-primary/60 max-w-2xl text-center">
            The same vulnerable file is copied across many projects. This ranks security fixes by how
            far the vulnerable code spread (<b>reach</b>) and how severe the flagged issue is
            (<b>severity</b>) — so the fixes that matter most surface first.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Stat value={doc.totals.shared_vulns} label="Shared vulnerabilities" sub="copied across ≥2 projects" />
            <Stat value={doc.totals.distinct_projects} label="Projects" sub="carrying flagged fixes" />
            <Stat value={doc.totals.total_diffs_scanned} label="Fix commits" sub="vuln-keyword flagged" />
          </div>
        </div>

        <div className="z-1 flex w-full max-w-3xl flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[14rem]">
            <span className="i-material-symbols:search text-primary/40 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by file or project…" className="h-9 pl-9 text-sm" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)}
            className="dark:bg-slate-8 dark:border-slate-700 h-9 rounded-md border border-slate-200 bg-white px-2 text-xs">
            {cats.map((c) => <option key={c} value={c}>{c === 'all' ? 'all categories' : catInfo(c).label}</option>)}
          </select>
        </div>

        <div className="z-1 w-full max-w-3xl">
          <div className="text-primary/40 mb-2 text-xs">{shown.length} of top {doc.items.length}</div>
          <div className="flex flex-col gap-1.5">
            {shown.map((it, i) => <Row key={it.old_blob} item={it} rank={doc.items.indexOf(it) + 1} mode={mode} maxScore={maxScore} />)}
          </div>
        </div>

        <div className="z-1 w-full max-w-3xl">
          <div className="dark:bg-slate-8/50 flex items-start gap-2 rounded-lg bg-slate-100/60 p-3 text-xs">
            <span className="i-material-symbols:info-outline text-primary/40 mt-0.5 shrink-0" />
            <span className="text-primary/70">
              <b>Method:</b> {doc.method} Severity comes from a keyword classifier over the fix commit's
              message (not curated CVSS). <b>Reach counts projects that carried and <i>fixed</i> the blob</b> —
              the full still-exposed (never-fixed) set needs a fresh blob→project map (b2P). All counts are lower bounds.
            </span>
          </div>
        </div>
      </div>
    </WaveLayout>
  );
}

function Stat({ value, label, sub }: { value: number; label: string; sub?: string }) {
  return (
    <div className="flex w-40 flex-col items-center gap-1">
      <span className="text-primary/80 text-2xl font-600 tabular-nums"><CountUp end={value} duration={1.3} formattingFn={fmt} /></span>
      <Separator className="color-primary/80 w-3/4" />
      <span className="text-primary/70 text-sm font-medium">{label}</span>
      {sub && <span className="text-primary/40 text-center text-xs">{sub}</span>}
    </div>
  );
}
