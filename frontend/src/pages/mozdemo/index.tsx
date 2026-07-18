import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import WaveLayout from '@/layouts/wave-layout';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/gradient-text.css';

/* ------------------------------------------------------------------ types -- */
type Mode = 'deforked' | 'raw';
interface Attr { deforked: string[]; deforked_count: number; raw: string[]; raw_count: number; raw_truncated: boolean }
interface Variant {
  new_blob: string | null; deleted: boolean; commits: number;
  proj: Attr; first_date: string | null; is_firefox: boolean;
}
interface FileRec {
  path: string; old_blob: string; firefox_new_blob: string;
  panel_a: {
    fix_first_appeared: string | null; fix_first_author: string | null;
    first_downstream_date: string | null; gap_days_from_upstream: number | null;
    gap_days_from_first_downstream: number | null; variant_count: number; variants: Variant[];
  };
  panel_b: { known_fixed: Attr; still_exposed_available: boolean; note: string };
  panel_c: { firefox_blob: string; firefox_adopters: Attr; consensus_blob: string | null; consensus_adopters: Attr; other_variant_adopters: Attr };
}
const list = (a: Attr, m: Mode) => (m === 'raw' ? a.raw : a.deforked);
const count = (a: Attr, m: Mode) => (m === 'raw' ? a.raw_count : a.deforked_count);
interface Example {
  commit: string; commit_date: string | null; author: string | null;
  message_line: string | null; bug: string | null; files: FileRec[];
}
interface Doc { version: string; generated_on: string; snapshot_note: string; examples: Example[] }

/* --------------------------------------------------------------- helpers -- */
const sha = (s: string | null | undefined, n = 12) => (s ? s.slice(0, n) : '—');
const proj = (p: string) => p.replace(/_/, '/');
const ghUrl = (p: string) => {
  const dot = p.indexOf('.'), us = p.indexOf('_');
  if (dot >= 0 && dot < us) return 'https://' + p.replace(/_/g, '/');
  return us < 0 ? null : 'https://github.com/' + p.slice(0, us) + '/' + p.slice(us + 1);
};
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '—');

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function ProjChips({ attr, mode }: { attr: Attr; mode: Mode }) {
  const items = list(attr, mode);
  if (!items.length) return <span className="text-primary/40 text-xs">none</span>;
  const hidden = mode === 'raw' && attr.raw_truncated ? attr.raw_count - items.length : 0;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((p) => {
        const u = ghUrl(p);
        return u ? (
          <a key={p} href={u} target="_blank" className="dark:bg-slate-8 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] hover:underline">{proj(p)}</a>
        ) : (
          <span key={p} className="dark:bg-slate-8 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">{proj(p)}</span>
        );
      })}
      {hidden > 0 && <span className="text-primary/40 px-1 py-0.5 text-[11px]">+{hidden} more</span>}
    </div>
  );
}

/* --------------------------------------------------------------- panels -- */
function Panel({ id, title, subtitle, tone, children, onDownload }:
  { id: string; title: string; subtitle: string; tone: string; children: React.ReactNode; onDownload?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="dark:bg-slate-8/60 w-full rounded-xl border border-slate-200/60 bg-slate-50/70 dark:border-slate-700/50">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-5 py-3 text-left">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-700" style={{ color: tone, background: tone + '18' }}>{id}</span>
        <div className="min-w-0 flex-1">
          <div className="text-primary/90 font-600">{title}</div>
          <div className="text-primary/50 text-xs">{subtitle}</div>
        </div>
        {onDownload && open && (
          <span onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="dark:bg-slate-8 dark:hover:bg-slate-7 hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 sm:inline-flex">
            <span className="i-material-symbols:download" />JSON
          </span>
        )}
        <span className={cn('text-primary/40 shrink-0', open ? 'i-material-symbols:expand-less' : 'i-material-symbols:expand-more')} />
      </button>
      {open && <div className="border-t border-slate-200/50 px-5 py-4 dark:border-slate-700/40">{children}</div>}
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: string; accent?: string }) {
  return (
    <div className="dark:bg-slate-9/50 flex flex-col gap-0.5 rounded-lg bg-white/60 p-3">
      <span className="text-xl font-700 tabular-nums" style={accent ? { color: accent } : undefined}>{value}</span>
      <span className="text-primary/70 text-xs font-medium">{label}</span>
      {hint && <span className="text-primary/40 text-[10px] leading-tight">{hint}</span>}
    </div>
  );
}

const C = { a: '#2a78d6', b: '#eb6834', c: '#1baf7a' };

function FilePanels({ f, mode }: { f: FileRec; mode: Mode }) {
  const a = f.panel_a, b = f.panel_b, c = f.panel_c;
  return (
    <div className="flex flex-col gap-3">
      <div className="dark:bg-slate-9/40 rounded-lg bg-white/50 p-3 text-xs">
        <span className="text-primary/50">File: </span>
        <span className="font-mono">{f.path}</span>
        <div className="text-primary/50 mt-1">
          vulnerable blob <span className="font-mono text-primary/70">{sha(f.old_blob)}</span> →
          Firefox's fix <span className="font-mono text-primary/70">{sha(f.firefox_new_blob)}</span>
        </div>
      </div>

      <Panel id="a" title="When did the upstream fix land?" tone={C.a}
        subtitle="First appearance of the fix anywhere, and the gap Firefox experienced"
        onDownload={() => download(`mozdemo_${sha(f.old_blob, 8)}_when.json`, a)}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Upstream fix appeared" value={day(a.fix_first_appeared)} hint={a.fix_first_author || undefined} accent={C.a} />
          <Stat label="First downstream" value={day(a.first_downstream_date)} hint="first project to adopt" />
          <Stat label="Backport gap" value={a.gap_days_from_upstream != null ? `${a.gap_days_from_upstream}d` : '—'}
            hint={a.gap_days_from_first_downstream != null ? `${a.gap_days_from_first_downstream}d from first downstream` : undefined} accent={C.a} />
          <Stat label="Fix variants" value={a.variant_count} hint="the file was fixed N different ways" />
        </div>
        <p className="text-primary/60 mt-3 text-xs">The same vulnerable blob was fixed <b>{a.variant_count} different ways</b> across the ecosystem — fragmentation Firefox can't see today:</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="text-primary/50 text-left text-xs">
              <th className="pb-1 pr-3 font-500">fix variant (new blob)</th>
              <th className="pb-1 pr-3 text-right font-500">first seen</th>
              <th className="pb-1 pr-3 text-right font-500">commits</th>
              <th className="pb-1 pr-3 text-right font-500">{mode === 'raw' ? 'raw repos' : 'projects'}</th>
            </tr></thead>
            <tbody>
              {a.variants.map((v, i) => (
                <tr key={i} className={cn('border-t border-slate-200/40 dark:border-slate-700/30', v.is_firefox && 'font-600')}>
                  <td className="py-1.5 pr-3 font-mono text-xs">
                    {v.deleted ? <span className="text-primary/50">file removed / renamed</span> : sha(v.new_blob)}
                    {v.is_firefox && <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: C.a, background: C.a + '18' }}>FIREFOX</span>}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{v.first_date || '—'}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{v.commits}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{count(v.proj, mode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel id="c" title="Did Firefox's fix get adopted — or superseded?" tone={C.c}
        subtitle="Who took Firefox's exact blob vs a different fix variant"
        onDownload={() => download(`mozdemo_${sha(f.old_blob, 8)}_adoption.json`, c)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="text-primary/70 mb-1 text-xs font-medium">Took Firefox's blob <span className="font-mono">{sha(c.firefox_blob)}</span> ({count(c.firefox_adopters, mode)})</div>
            <ProjChips attr={c.firefox_adopters} mode={mode} />
          </div>
          <div>
            <div className="text-primary/70 mb-1 text-xs font-medium">Took the consensus blob <span className="font-mono">{sha(c.consensus_blob)}</span> ({count(c.consensus_adopters, mode)})</div>
            <ProjChips attr={c.consensus_adopters} mode={mode} />
          </div>
        </div>
        {c.consensus_blob && (
          <p className="text-primary/60 mt-3 text-xs">
            <b>Signal:</b> a different fix (<span className="font-mono">{sha(c.consensus_blob)}</span>) is more widely adopted than Firefox's — the code Firefox shipped may already be superseded upstream. Exactly the "your fix got superseded" ping updatebot could surface for copy-based reuse.
          </p>
        )}
      </Panel>

      <Panel id="b" title="Who downstream is still exposed?" tone={C.b}
        subtitle="Projects still shipping the pre-fix blob"
        onDownload={() => download(`mozdemo_${sha(f.old_blob, 8)}_exposed.json`, b)}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Known to have carried it" value={count(b.known_fixed, mode)} hint={`${mode} projects that later fixed`} accent={C.b} />
          <Stat label="Still-exposed set" value={b.still_exposed_available ? 'available' : 'blocked'} hint="needs fresh b2P" />
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          <span className="i-material-symbols:warning-outline mt-0.5 shrink-0" />
          <span>{b.note}</span>
        </div>
        <div className="mt-3">
          <div className="text-primary/70 mb-1 text-xs font-medium">Projects known to have carried the vulnerable blob ({count(b.known_fixed, mode)})</div>
          <ProjChips attr={b.known_fixed} mode={mode} />
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------------------------------------------- page -- */
export default function MozDemoPage() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState(false);
  const [commit, setCommit] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('deforked');

  useEffect(() => {
    fetch('/mozdemo-data/examples.json').then((r) => r.json())
      .then((d: Doc) => { setDoc(d); if (d.examples[0]) setSelected(d.examples[0].commit); })
      .catch(() => setErr(true));
  }, []);

  const [live, setLive] = useState<Example | null>(null);
  const [liveState, setLiveState] = useState<'idle' | 'loading' | 'error' | 'notfound' | 'unavailable'>('idle');
  const byCommit = useMemo(() => new Map((doc?.examples || []).map((e) => [e.commit, e])), [doc]);
  const example = selected ? (byCommit.get(selected) ?? (live && live.commit === selected ? live : undefined)) : undefined;

  const submit = async () => {
    const c = commit.trim().toLowerCase();
    if (!c) return;
    setLive(null);
    if (byCommit.has(c)) { setSelected(c); setLiveState('idle'); return; }
    if (!/^[0-9a-f]{40}$/.test(c)) { setSelected(c); setLiveState('error'); return; }
    setSelected(c); setLiveState('loading');
    try {
      const r = await fetch(`/api/mozdemo/analyze?commit=${c}`);
      if (r.status === 404) { setLiveState('notfound'); return; }
      if (!r.ok) { setLiveState(r.status === 400 ? 'error' : 'unavailable'); return; }
      const j = await r.json();
      setLive(j.data as Example); setLiveState('idle');
    } catch { setLiveState('unavailable'); }
  };

  return (
    <WaveLayout>
      <Helmet>
        <title>WoC — Mozilla updatebot demo</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="flex w-full max-w-4xl flex-col items-center gap-4">
        <div className="z-1 flex flex-col items-center gap-3 pt-10">
          <div className="dark:bg-slate-8/70 flex items-center gap-2 rounded-full bg-slate-100/70 px-4 py-1 text-xs backdrop-blur-sm">
            <span className="i-material-symbols:track-changes text-primary/60" />
            <span className="text-primary/70 font-medium">Vendored-library backport provenance · WoC {doc?.version || '…'}</span>
          </div>
          <h1 className="gradient-text text-center text-4xl font-bold md:text-5xl">Backport Provenance</h1>
          <p className="text-primary/60 max-w-2xl text-center">
            For a vendored third-party fix (a Firefox libwebrtc backport), World of Code answers three
            questions from blob-level provenance: <b>when the upstream fix landed</b>, <b>whether Firefox's fix
            was adopted or superseded</b>, and <b>who downstream is still exposed</b> — updatebot-style, extended
            from <span className="font-mono text-xs">moz.yaml</span> vendoring to copy-based reuse.
          </p>
        </div>

        {/* input */}
        <div className="z-1 flex w-full max-w-2xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={commit} onChange={(e) => setCommit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Firefox backport commit SHA-1" className="h-9 flex-1 min-w-[16rem] font-mono text-sm" />
            <Button size="sm" onClick={submit} className="gap-1"><span className="i-material-symbols:search" />Analyze</Button>
          </div>
          {doc && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-primary/40 text-xs">Worked examples:</span>
              {doc.examples.map((e) => (
                <button key={e.commit} onClick={() => { setSelected(e.commit); setCommit(''); }}
                  className={cn('rounded-md px-2 py-0.5 font-mono text-xs transition-colors',
                    selected === e.commit ? 'bg-primary text-primary-foreground' : 'dark:bg-slate-8 dark:hover:bg-slate-7 bg-slate-100 hover:bg-slate-200')}>
                  {e.bug ? `Bug ${e.bug}` : sha(e.commit, 10)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* body */}
        <div className="z-1 w-full">
          {err && <div className="rounded-md border-2 border-dashed border-slate-500 p-6 text-sm">Could not load the demo dataset.</div>}
          {!doc && !err && <div className="flex flex-col gap-3"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /></div>}
          {liveState === 'loading' && !example && (
            <div className="flex flex-col gap-3"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /></div>
          )}
          {doc && selected && !example && liveState !== 'loading' && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-300">
              {liveState === 'error' && <>“{selected}” is not a 40-character commit SHA-1. Paste a Firefox backport commit hash, or click a worked example.</>}
              {liveState === 'notfound' && <><b className="font-mono">{sha(selected, 16)}</b> doesn't touch a vendored source file we can trace (or isn't in WoC {doc.version}).</>}
              {liveState === 'unavailable' && <>Live analysis of arbitrary commits isn't reachable right now. The worked examples above run offline and reproduce the batch prototype exactly against WoC {doc.version}.</>}
              {liveState === 'idle' && <><b className="font-mono">{sha(selected, 16)}</b> isn't a precomputed example — click one above.</>}
            </div>
          )}
          {example && (
            <div className="flex flex-col gap-4">
              <div className="dark:bg-slate-8/60 rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/50">
                <a href={`https://github.com/mozilla/gecko-dev/commit/${example.commit}`} target="_blank"
                  className="font-mono text-sm font-600 hover:underline">{sha(example.commit, 16)}</a>
                {example.message_line && (
                  <p className="text-primary/70 mt-1 text-sm">{example.message_line}</p>
                )}
                <p className="text-primary/40 mt-1 text-xs">
                  {example.author} · {day(example.commit_date)}{example.bug && <> · Bug {example.bug}</>}
                  <span className="ml-1 italic">(commit message shown verbatim)</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-primary/50">Project attribution:</span>
                <div className="dark:bg-slate-8 flex rounded-md bg-slate-100 p-0.5">
                  {(['deforked', 'raw'] as Mode[]).map((m) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={cn('rounded px-2.5 py-1 font-medium capitalize transition-colors',
                        mode === m ? 'bg-primary text-primary-foreground' : 'text-primary/60 hover:text-primary')}>
                      {m === 'deforked' ? 'Deforked (canonical)' : 'Raw (every repo)'}
                    </button>
                  ))}
                </div>
                <span className="text-primary/40">
                  {mode === 'deforked'
                    ? 'forks collapsed to one canonical project (matches the batch report)'
                    : 'every raw repository counted — shows the true ecosystem spread'}
                </span>
              </div>
              {example.files.map((f, i) => <FilePanels key={i} f={f} mode={mode} />)}
            </div>
          )}
        </div>

        {doc && (
          <p className="text-primary/40 z-1 mt-2 max-w-2xl px-4 text-center text-xs">
            {doc.snapshot_note} All numbers are computed live from WoC maps; a failed or stale lookup is shown as such,
            never fabricated. Generated on {doc.generated_on}.
          </p>
        )}
      </div>
    </WaveLayout>
  );
}
