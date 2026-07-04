import { useEffect, useMemo, useState } from 'react';
import WaveLayout from '@/layouts/wave-layout';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import CountUp from 'react-countup';
import '@/styles/gradient-text.css';

/* ------------------------------------------------------------------ types -- */
interface Location {
  tier: 'da' | 'isaac' | 'mongo' | 'clickhouse' | 'graph';
  host?: string;
  mount_host?: string; // /da?_data mounts are host-specific — read from this host
  path: string;
  verified?: boolean;
  bytes_per_shard?: number;
}
interface Table {
  name: string;
  axis: string;
  key: string;
  schema: string[];
  shard: { count: number; by: string; sorted_by: string };
  row_scale: string | null;
  producer: string | null;
  consumers: string[];
  notes: string | null;
  store: string;
  access: string | null;
  locations: Location[];
  valid: boolean;
  scanned?: boolean;
  discovered?: boolean;
  bytes_per_shard: number | null;
  total_bytes: number | null;
  schema_drift?: string;
}
interface Registry {
  watermark: string;
  generated_on: string;
  conventions: { format: string; present_not_valid: string; mount_topology: string };
  cost_model: { read_mb_s_per_core: number; cores: Record<string, number>; split_multiplier: number; note: string };
  synonyms: Record<string, string[]>;
  tables: Table[];
}

/* ---------------------------------------------------------------- palette -- */
const PALETTE = {
  light: ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'],
  dark: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926']
};
const AXIS_SLOT: Record<string, number> = { commit: 0, project: 1, author: 4, blob: 7, edge: 6, doc: 3, package: 5 };
function axisColor(axis: string, mode: 'light' | 'dark') {
  const s = AXIS_SLOT[axis];
  return s == null ? (mode === 'dark' ? '#9a998e' : '#8a8a82') : PALETTE[mode][s];
}
const TIER_LABEL: Record<string, string> = {
  da: 'da flat', isaac: 'isaac flat', mongo: 'Mongo (da3)', clickhouse: 'ClickHouse (da3)', graph: 'graph'
};

/* --------------------------------------------------------------- helpers -- */
function fmtBytes(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return (n / 1e12).toFixed(1) + ' TB';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' MB';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + ' KB';
  return n + ' B';
}
function fmtTime(sec: number | null): string {
  if (sec == null) return 'unknown';
  if (sec < 90) return Math.max(1, Math.round(sec)) + ' s';
  if (sec < 5400) return (sec / 60).toFixed(0) + ' min';
  return (sec / 3600).toFixed(1) + ' h';
}
function oneShard(path: string): string {
  return path.replace('$i', '0');
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1200); }); }}
      className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
        'dark:bg-slate-8 dark:hover:bg-slate-7 bg-slate-100 hover:bg-slate-200', className)}
      title="Copy to clipboard"
    >
      <span className={ok ? 'i-material-symbols:check' : 'i-material-symbols:content-copy-outline'} />
      {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div className="dark:bg-slate-9 group relative overflow-x-auto rounded-lg bg-slate-900 p-3">
      <pre className="text-xs leading-relaxed text-slate-100"><code>{children}</code></pre>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <CopyButton text={children} />
      </div>
    </div>
  );
}

function AxisBadge({ axis, mode }: { axis: string; mode: 'light' | 'dark' }) {
  const c = axisColor(axis, mode);
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ color: c, borderColor: c + '55', background: c + '14', border: '1px solid' }}>
      <span className="inline-block size-1.5 rounded-full" style={{ background: c }} />{axis}
    </span>
  );
}

/* ------------------------------------------------------------------- data -- */
function useRegistry() {
  const [reg, setReg] = useState<Registry | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/catalog-data/registry.json').then((r) => r.json())
      .then((d) => live && setReg(d)).catch(() => live && setErr(true));
    return () => { live = false; };
  }, []);
  return { reg, err };
}

/* ------------------------------------------------------------------- hero -- */
function Chip({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div className="group hover:scale-102 flex w-32 flex-col items-center gap-1 transition-all duration-300">
      <div className="text-primary/80 flex items-center gap-2 text-2xl font-600 tabular-nums">
        <span className={cn('text-primary/50 text-lg', icon)} />
        <CountUp end={value} duration={1.3} />
      </div>
      <Separator className="color-primary/80 w-3/4 transition-all duration-300 group-hover:w-full" />
      <p className="text-primary/70 text-xs font-medium">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------- cost model + plan -- */
const RATE = 250e6; // bytes/s/core
function axisKey(axis: string, t?: Table): string {
  if (axis === 'commit') return 'commit';
  if (axis === 'project') return 'project';
  if (axis === 'author') return 'A';
  if (axis === 'blob') return 'blob';
  return t ? t.schema[0] : 'key';
}
function joinCost(tables: Table[], cores: number): number | null {
  let B = 0;
  for (const t of tables) { if (t.total_bytes == null) return null; B += t.total_bytes; }
  const shards = Math.max(...tables.map((t) => t.shard.count || 1));
  return B / (Math.min(cores, shards) * RATE);
}
function splitCost(t: Table, cores: number): number | null {
  if (t.total_bytes == null) return null;
  const shards = t.shard.count || 1;
  return (4 * t.total_bytes) / (Math.min(cores, shards) * RATE);
}
// a bridge table carries both axis keys
function findBridge(fromAxis: string, toAxis: string, all: Table[]): Table | null {
  const kf = axisKey(fromAxis), kt = axisKey(toAxis);
  const cands = all.filter((t) => t.valid && t.schema.includes(kf) && t.schema.includes(kt));
  cands.sort((a, b) => (a.total_bytes ?? 1e99) - (b.total_bytes ?? 1e99));
  return cands[0] ?? null;
}

interface PlanStep { kind: 'read' | 'join' | 'split'; tables: Table[]; key?: string; from?: string; to?: string; bridge?: Table | null; cost: number | null; reducer?: boolean; }
interface Plan { chosen: Table[]; uncovered: string[]; steps: PlanStep[]; total: number | null; targetAxis: string; }

function buildPlan(selected: string[], tables: Table[], cores: number): Plan | null {
  const sel = new Set(selected);
  if (!sel.size) return null;
  const cands = tables.filter((t) => t.valid && t.schema.some((f) => sel.has(f)));
  const chosen: Table[] = [];
  const covered = new Set<string>();
  const score = (t: Table) => (t.total_bytes ?? 1e15) + (t.locations.some((l) => l.verified) ? 0 : 5e14) + (t.store === 'flat' ? 0 : 2e14);
  while (covered.size < sel.size) {
    let best: Table | null = null, bestGain = 0;
    for (const t of cands) {
      if (chosen.includes(t)) continue;
      const gain = t.schema.filter((f) => sel.has(f) && !covered.has(f)).length;
      if (gain > bestGain || (gain === bestGain && gain > 0 && best && score(t) < score(best))) {
        best = t; bestGain = gain;
      }
    }
    if (!best || bestGain === 0) break;
    chosen.push(best);
    best.schema.forEach((f) => { if (sel.has(f)) covered.add(f); });
  }
  const uncovered = [...sel].filter((f) => !covered.has(f));

  // target axis = axis of chosen table covering most selected fields (prefer commit)
  const cov = (t: Table) => t.schema.filter((f) => sel.has(f)).length;
  const sortedChosen = [...chosen].sort((a, b) => cov(b) - cov(a) || (a.axis === 'commit' ? -1 : 1));
  const targetAxis = sortedChosen.length ? sortedChosen[0].axis : 'commit';

  const steps: PlanStep[] = [];
  const same = chosen.filter((t) => t.axis === targetAxis);
  const multi = (t: Table) => ['c2pFull', 'c2fbbFull', 'p2cFull', 'agc2fbb', 'agc2pFull'].includes(t.name);
  if (same.length > 1) {
    steps.push({ kind: 'join', tables: same, key: axisKey(targetAxis, same[0]), cost: joinCost(same, cores), reducer: same.some(multi) });
  } else if (same.length === 1) {
    steps.push({ kind: 'read', tables: same, key: axisKey(targetAxis, same[0]), cost: joinCost(same, cores), reducer: multi(same[0]) });
  }
  for (const t of chosen.filter((x) => x.axis !== targetAxis)) {
    steps.push({ kind: 'split', tables: [t], from: t.axis, to: targetAxis, bridge: findBridge(t.axis, targetAxis, tables), cost: splitCost(t, cores) });
  }
  const costs = steps.map((s) => s.cost);
  const total = costs.some((c) => c == null) ? null : costs.reduce((a, b) => a! + b!, 0)!;
  return { chosen, uncovered, steps, total, targetAxis };
}

function planScript(plan: Plan, selected: string[]): string {
  const sel = new Set(selected);
  const pick = (t: Table) => t.schema.filter((f) => sel.has(f)).join(',');
  const path0 = (t: Table) => {
    const l = t.locations.find((x) => x.tier === 'da') ?? t.locations[0];
    return l.path;
  };
  const mounts = Array.from(new Set(plan.chosen.flatMap((t) => t.locations.filter((l) => l.tier === 'da').map((l) => l.mount_host)).filter(Boolean)));
  const lines: string[] = ['#!/bin/bash', '# Estimated plan — verify with the Calibrate command. LC_ALL=C throughout.',
    mounts.length ? `# run on a host mounting the /da?_data paths (basemaps mount on: ${mounts.join(', ')})` : '',
    'set -euo pipefail', ''].filter(Boolean);
  const join = plan.steps.find((s) => s.kind === 'join');
  const read = plan.steps.find((s) => s.kind === 'read');
  const splits = plan.steps.filter((s) => s.kind === 'split');
  const shardN = Math.max(1, ...plan.chosen.map((t) => t.shard.count || 1));
  if (join) {
    const [a, b, ...rest] = join.tables;
    lines.push(`# same-axis streaming join on '${join.key}' (per shard, parallel across i=0..${shardN - 1})`);
    lines.push(`for i in $(seq 0 ${shardN - 1}); do`);
    const red = (t: Table) => `<(zcat ${path0(t).replace('$i', '$i')}${join.reducer && ['c2pFull','p2cFull','c2fbbFull','agc2pFull','agc2fbb'].includes(t.name) ? " | awk -F';' '{if($1!=p){print;p=$1}}'" : ''})`;
    lines.push(`  LC_ALL=C join -t';' ${red(a)} ${red(b)} \\`);
    for (const t of rest) lines.push(`    | LC_ALL=C join -t';' - ${red(t)} \\`);
    lines.push(`    # fields available: ${join.tables.map(pick).filter(Boolean).join(',')}`);
    lines.push(`  ;`);
    lines.push(`done`);
  } else if (read) {
    const t = read.tables[0];
    lines.push(`# single source covers the requested fields — no join needed`);
    lines.push(`for i in $(seq 0 ${(t.shard.count || 1) - 1}); do`);
    lines.push(`  zcat ${path0(t)}${read.reducer ? " | awk -F';' '{if($1!=p){print;p=$1}}'" : ''}   # ${t.schema.join(';')}`);
    lines.push(`done`);
  }
  for (const s of splits) {
    const t = s.tables[0];
    lines.push('');
    lines.push(`# SPLIT/reshard ${t.name} from ${s.from}-axis to ${s.to}-axis (the expensive step)`);
    if (s.bridge) lines.push(`#   bridge via ${s.bridge.name} (${s.bridge.schema.join(';')})`);
    lines.push(`#   project the join column -> splitSecCh.perl into ${shardN} sections -> merge-sort each`);
    lines.push(`#   see runAuthBaseMaps.sh (64 split + 128 merge jobs) for the pattern`);
  }
  return lines.join('\n');
}

/* --------------------------------------------------------------- planner -- */
function Planner({ tables, cores, setCores, mode }: { tables: Table[]; cores: number; setCores: (n: number) => void; mode: 'light' | 'dark' }) {
  const [sel, setSel] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const fieldIndex = useMemo(() => {
    const m = new Map<string, Table[]>();
    for (const t of tables) {
      if (!t.valid) continue; // only offer fields a real (non-empty) table can supply
      for (const f of t.schema) {
        if (!m.has(f)) m.set(f, []);
        m.get(f)!.push(t);
      }
    }
    return m;
  }, [tables]);
  const allFields = useMemo(() => [...fieldIndex.keys()].sort((a, b) => fieldIndex.get(b)!.length - fieldIndex.get(a)!.length), [fieldIndex]);
  const shown = useMemo(() => {
    if (!q.trim()) return allFields;
    const n = q.trim().toLowerCase();
    return allFields.filter((f) => f.toLowerCase().includes(n));
  }, [allFields, q]);
  const toggle = (f: string) => setSel((s) => s.includes(f) ? s.filter((x) => x !== f) : [...s, f]);
  const plan = useMemo(() => buildPlan(sel, tables, cores), [sel, tables, cores]);

  return (
    <div className="w-full max-w-4xl">
      <div className="dark:bg-slate-8/60 rounded-xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[15rem]">
            <span className="i-material-symbols:search text-primary/40 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter fields — commit, A, project, atime, sigtype, blob…" className="h-10 pl-9 text-sm" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary/50">Estimate on</span>
            {[['da3', 8], ['isaac', 40]].map(([name, c]) => (
              <button key={name as string} onClick={() => setCores(c as number)}
                className={cn('rounded-md px-2 py-1 font-medium transition-colors',
                  cores === c ? 'bg-primary text-primary-foreground' : 'dark:bg-slate-8 dark:hover:bg-slate-7 bg-slate-100 hover:bg-slate-200')}>
                {name} ({c as number} cores)
              </button>
            ))}
          </div>
        </div>

        <p className="text-primary/50 mt-3 text-xs">Tick the fields you want in one result row — the planner finds the source tables, the join/split steps, and an estimated run time.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {shown.slice(0, 60).map((f) => {
            const on = sel.includes(f);
            const providers = fieldIndex.get(f)!;
            return (
              <button key={f} onClick={() => toggle(f)} title={`in ${providers.length} table(s): ${providers.map((t) => t.name).slice(0, 6).join(', ')}`}
                className={cn('rounded-md px-2 py-1 font-mono text-xs transition-colors',
                  on ? 'bg-primary text-primary-foreground' : 'dark:bg-slate-8 dark:hover:bg-slate-7 bg-slate-100 hover:bg-slate-200')}>
                {f}<span className={cn('ml-1', on ? 'opacity-70' : 'text-primary/30')}>{providers.length}</span>
              </button>
            );
          })}
        </div>
        {sel.length > 0 && (
          <button onClick={() => setSel([])} className="text-primary/50 hover:text-primary mt-2 text-xs underline underline-offset-2">Clear {sel.length} selected</button>
        )}
      </div>

      {plan && <PlanOutput plan={plan} sel={sel} mode={mode} />}
    </div>
  );
}

function PlanOutput({ plan, sel, mode }: { plan: Plan; sel: string[]; mode: 'light' | 'dark' }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200/60 bg-white/60 p-5 dark:border-slate-700/60 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-primary/90 flex items-center gap-2 font-600">
          <span className="i-material-symbols:route-outline text-primary/50" /> Plan
          <span className="text-primary/40 text-xs font-400">{plan.chosen.length} source{plan.chosen.length !== 1 ? 's' : ''} · target axis {plan.targetAxis}</span>
        </h3>
        <div className="text-right">
          <div className="text-2xl font-700 tabular-nums" style={{ color: axisColor(plan.targetAxis, mode) }}>~{fmtTime(plan.total)}</div>
          <div className="text-primary/40 text-[10px]">estimated wall-clock · calibrate to confirm</div>
        </div>
      </div>

      {plan.uncovered.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
          <span className="i-material-symbols:warning-outline mt-0.5 shrink-0" />
          <span>No valid table provides: <span className="font-mono">{plan.uncovered.join(', ')}</span>. These may live only in an empty/never-built table, or need a different key.</span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {plan.steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2 dark:bg-slate-800/40 bg-slate-100/50">
            <span className={cn('mt-0.5 shrink-0',
              s.kind === 'split' ? 'i-material-symbols:call-split text-orange-500' :
              s.kind === 'join' ? 'i-material-symbols:merge text-primary/60' : 'i-material-symbols:description-outline text-primary/60')} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-500 capitalize">{s.kind === 'read' ? 'Read' : s.kind}</span>
                {s.tables.map((t) => (
                  <span key={t.name} className="flex items-center gap-1">
                    <span className="font-mono text-xs">{t.name}</span><AxisBadge axis={t.axis} mode={mode} />
                  </span>
                ))}
                {s.kind === 'join' && <span className="text-primary/50 text-xs">streaming join on <span className="font-mono">{s.key}</span></span>}
                {s.kind === 'split' && <span className="text-orange-600 dark:text-orange-400 text-xs">reshard {s.from} → {s.to}{s.bridge ? <> via <span className="font-mono">{s.bridge.name}</span></> : ''}</span>}
              </div>
              {s.reducer && <div className="text-primary/40 mt-0.5 text-[11px]">multiple rows / key — reducer keeps the first (<span className="font-mono">awk '$1!=p'</span>)</div>}
              {s.kind === 'split' && <div className="text-primary/40 mt-0.5 text-[11px]">cross-axis reshard is the expensive step (~4× a streaming read); shown explicitly, never hidden.</div>}
            </div>
            <span className="text-primary/60 shrink-0 text-xs tabular-nums">~{fmtTime(s.cost)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-primary/60 text-xs font-medium">Generated script</span>
        </div>
        <Code>{planScript(plan, sel)}</Code>
        <p className="text-primary/40 mt-2 text-[11px]">
          Prefer this dynamic join over materializing a new table — only store it if you will reuse it. All times are estimates
          from compressed byte size at 250 MB/s/core; run the calibrate command on one shard to rescale.
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- browse + detail -- */
function Browse({ tables, mode }: { tables: Table[]; mode: 'light' | 'dark' }) {
  const [axis, setAxis] = useState('all');
  const [tier, setTier] = useState('all');
  const [validity, setValidity] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const axes = ['all', ...Array.from(new Set(tables.map((t) => t.axis)))];
  const tiers = ['all', 'da', 'isaac', 'mongo', 'clickhouse', 'graph'];

  const rows = tables.filter((t) => {
    if (axis !== 'all' && t.axis !== axis) return false;
    if (tier !== 'all' && !t.locations.some((l) => l.tier === tier)) return false;
    if (validity === 'valid' && !t.valid) return false;
    if (validity === 'invalid' && t.valid) return false;
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      if (!t.name.toLowerCase().includes(n) && !t.schema.some((f) => f.toLowerCase().includes(n))) return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <span className="i-material-symbols:search text-primary/40 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tables or fields…" className="h-9 pl-9 text-sm" />
        </div>
        <Facet label="axis" value={axis} set={setAxis} opts={axes} />
        <Facet label="tier" value={tier} set={setTier} opts={tiers} />
        <Facet label="validity" value={validity} set={setValidity} opts={['all', 'valid', 'invalid']} />
      </div>
      <div className="text-primary/40 mb-2 text-xs">{rows.length} table{rows.length !== 1 ? 's' : ''}</div>
      <div className="flex flex-col gap-1.5">
        {rows.map((t) => (
          <div key={t.name} className={cn('rounded-lg border transition-colors', open === t.name ? 'border-primary/30 dark:bg-slate-800/40 bg-slate-100/60' : 'border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/30')}>
            <button onClick={() => setOpen(open === t.name ? null : t.name)} className="flex w-full items-center gap-3 px-3 py-2 text-left">
              <span className={cn('shrink-0 transition-transform', open === t.name ? 'i-material-symbols:expand-more rotate-0' : 'i-material-symbols:chevron-right')} />
              <span className="font-mono text-sm font-500">{t.name}</span>
              <AxisBadge axis={t.axis} mode={mode} />
              {!t.valid && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">empty · not valid</span>}
              {t.discovered && <span className="text-primary/40 rounded bg-slate-500/10 px-1.5 py-0.5 text-[10px]">auto-found</span>}
              <span className="text-primary/40 ml-auto hidden shrink-0 font-mono text-[11px] sm:block">{t.schema.join(';')}</span>
              <span className="text-primary/50 shrink-0 text-xs tabular-nums">{t.shard.count} sh · {fmtBytes(t.total_bytes)}</span>
            </button>
            {open === t.name && <TableDetail t={t} mode={mode} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Facet({ label, value, set, opts }: { label: string; value: string; set: (v: string) => void; opts: string[] }) {
  return (
    <select value={value} onChange={(e) => set(e.target.value)} title={label}
      className="dark:bg-slate-8 dark:border-slate-700 h-9 rounded-md border border-slate-200 bg-white px-2 text-xs capitalize">
      {opts.map((o) => <option key={o} value={o}>{o === 'all' ? `all ${label}` : o}</option>)}
    </select>
  );
}

function accessCmd(t: Table, l: Location): string {
  // /da?_data mounts are host-specific — read the path from the host that mounts it.
  if (l.tier === 'da') return `ssh ${l.mount_host || 'da7'} 'zcat ${oneShard(l.path)}' | head -20`;
  if (l.tier === 'isaac') return `zcat ${oneShard(l.path)} | head -20   # on isaac`;
  return t.access || l.path;
}

function TableDetail({ t, mode }: { t: Table; mode: 'light' | 'dark' }) {
  const total = t.total_bytes;
  return (
    <div className="border-t border-slate-200/50 px-4 py-4 dark:border-slate-700/40">
      {t.notes && <p className="text-primary/70 mb-3 text-sm">{t.notes}</p>}
      {t.schema_drift && <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">⚠ schema drift: {t.schema_drift}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Join key" value={t.key} mono />
        <Meta label="Shards" value={`${t.shard.count} · ${t.shard.by}`} />
        <Meta label="Sorted by" value={t.shard.sorted_by} mono />
        <Meta label="Total size" value={fmtBytes(total)} />
        {t.row_scale && <Meta label="Row scale" value={t.row_scale} />}
        {t.store !== 'flat' && <Meta label="Store" value={t.store} />}
      </div>

      <div className="mt-4">
        <span className="text-primary/60 text-xs font-medium">Schema</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {t.schema.map((f, i) => (
            <span key={i} className="dark:bg-slate-8 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
              <span className="text-primary/40 mr-1">{i}</span>{f}
            </span>
          ))}
        </div>
      </div>

      {(t.producer || t.consumers.length > 0) && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {t.producer && <Meta label="Producer" value={t.producer} mono />}
          {t.consumers.length > 0 && <Meta label="Consumers" value={t.consumers.join(', ')} mono />}
        </div>
      )}

      <div className="mt-4">
        <span className="text-primary/60 text-xs font-medium">How to get it {t.valid ? '' : '(⚠ empty — reproduce by dynamic join instead)'}</span>
        <div className="mt-1 flex flex-col gap-2">
          {t.locations.map((l, i) => (
            <div key={i}>
              <div className="text-primary/50 mb-1 flex items-center gap-2 text-[11px]">
                <span className="dark:bg-slate-8 rounded bg-slate-100 px-1.5 py-0.5 font-medium">{TIER_LABEL[l.tier]}</span>
                <span>{l.tier === 'da' ? <>mounts on <span className="font-mono">{l.mount_host}</span></> : l.host}</span>
                {l.verified && <span className="text-green-600 dark:text-green-400">✓ readable during scan</span>}
              </div>
              <Code>{accessCmd(t, l)}</Code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-primary/40 text-[10px] uppercase tracking-wide">{label}</span>
      <span className={cn('text-primary/80 text-xs', mono && 'font-mono break-all')}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------- section -- */
function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: string; children: React.ReactNode }) {
  return (
    <section className="z-1 flex w-full max-w-5xl flex-col items-center gap-4 pt-8">
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
export default function CatalogPage() {
  const { resolvedTheme } = useTheme();
  const mode: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light';
  const { reg, err } = useRegistry();
  const [cores, setCores] = useState(8);

  if (err) {
    return (
      <WaveLayout>
        <div className="flex items-center gap-3 rounded-md border-2 border-dashed border-slate-500 p-6">
          <div className="i-fluent-emoji-flat:warning size-7" />
          <p>Could not load the table registry. Please try again shortly.</p>
        </div>
      </WaveLayout>
    );
  }
  if (!reg) {
    return (
      <WaveLayout>
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 pt-16">
          <Skeleton className="h-12 w-72 rounded-lg" />
          <Skeleton className="h-6 w-96 rounded-md" />
          <Skeleton className="mt-6 h-40 w-full rounded-lg" />
        </div>
      </WaveLayout>
    );
  }

  const valid = reg.tables.filter((t) => t.valid).length;
  const totalBytes = reg.tables.reduce((a, t) => a + (t.total_bytes || 0), 0);
  const flatTables = reg.tables; // planner may use any valid table

  return (
    <WaveLayout>
      <div className="flex w-full flex-col items-center gap-4">
        <div className="z-1 flex flex-col items-center gap-5 pt-10">
          <div className="dark:bg-slate-8/70 flex items-center gap-2 rounded-full bg-slate-100/70 px-4 py-1 text-xs backdrop-blur-sm">
            <span className="i-material-symbols:database-outline text-primary/60" />
            <span className="text-primary/70 font-medium">Watermark {reg.watermark} · registry scanned on {reg.generated_on}</span>
          </div>
          <h1 className="gradient-text text-center text-5xl font-bold md:text-6xl">Data Catalog</h1>
          <p className="text-primary/60 max-w-2xl text-center text-lg">
            Every World of Code table — <span className="text-primary/90 font-medium">where it lives</span>, its{' '}
            <span className="text-primary/90 font-medium">schema</span>, and{' '}
            <span className="text-primary/90 font-medium">how to read it</span>. Pick the fields you need and get a
            concrete join/split plan with an estimated run time.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Chip value={reg.tables.length} label="Tables" icon="i-material-symbols:table-rows-outline" />
            <Chip value={valid} label="Valid" icon="i-material-symbols:check-circle-outline" />
            <Chip value={Math.round(totalBytes / 1e12)} label="TB indexed" icon="i-material-symbols:hard-drive-2-outline" />
            <Chip value={new Set(reg.tables.map((t) => t.axis)).size} label="Join axes" icon="i-material-symbols:account-tree-outline" />
          </div>
        </div>

        <Section title="Plan a query" icon="i-material-symbols:checklist"
          subtitle="Search the fields across every table, tick what you need in one row, and the planner returns the minimal source tables, the streaming-join and reshard steps, a cost estimate, and a copy-paste script. Dynamic join is always preferred over materializing a new table.">
          <Planner tables={flatTables} cores={cores} setCores={setCores} mode={mode} />
        </Section>

        <Section title="Browse every table" icon="i-material-symbols:folder-data-outline"
          subtitle="Filter by join axis, storage tier, and validity. Open a table for its schema, shard layout, producer/consumers, and the exact command to read it on this host.">
          <Browse tables={reg.tables} mode={mode} />
        </Section>

        <Section title="Things to remember" icon="i-material-symbols:tips-and-updates-outline">
          <div className="grid w-full max-w-4xl grid-cols-1 gap-3 px-4 sm:grid-cols-3">
            <div className="dark:bg-slate-8/50 flex items-start gap-2 rounded-lg bg-slate-100/60 p-3 text-sm">
              <span className="i-material-symbols:visibility-off-outline text-primary/40 mt-0.5 shrink-0" />
              <span className="text-primary/70"><b>Present ≠ valid.</b> {reg.conventions.present_not_valid}</span>
            </div>
            <div className="dark:bg-slate-8/50 flex items-start gap-2 rounded-lg bg-slate-100/60 p-3 text-sm">
              <span className="i-material-symbols:bolt-outline text-primary/40 mt-0.5 shrink-0" />
              <span className="text-primary/70"><b>Reuse, don't rebuild.</b> Prefer a dynamic join over materializing a new table; only store a result you will query repeatedly.</span>
            </div>
            <div className="dark:bg-slate-8/50 flex items-start gap-2 rounded-lg bg-slate-100/60 p-3 text-sm">
              <span className="i-material-symbols:dns-outline text-primary/40 mt-0.5 shrink-0" />
              <span className="text-primary/70"><b>Mounts are host-specific.</b> {reg.conventions.mount_topology}</span>
            </div>
          </div>
          <p className="text-primary/40 mt-2 max-w-2xl px-4 text-center text-xs">
            All tables are {reg.conventions.format}. Time estimates use {reg.cost_model.read_mb_s_per_core / 1e6} MB/s/core and are
            labelled estimates — calibrate on one shard to confirm.
          </p>
        </Section>
      </div>
    </WaveLayout>
  );
}
