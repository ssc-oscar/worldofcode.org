import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import WaveLayout from '@/layouts/wave-layout';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getValues, getCommit } from '@/api/lookup';
import { getAuthor, getProject, searchAuthor, searchProject, type MongoAuthor, type MongoProject } from '@/api/mongo';
import '@/styles/gradient-text.css';

/* ------------------------------------------------------------- model ------ */
type NType = 'author' | 'project' | 'commit' | 'blob' | 'file';
interface GNode { id: string; type: NType; key: string; x: number; y: number; vx: number; vy: number; fixed?: boolean; seed?: boolean; }
interface GEdge { id: string; s: string; t: string; rel: string; }

interface Rel { id: string; map: string; from: NType; to: NType; label: string; }
const RELS: Rel[] = [
  { id: 'A2P', map: 'A2P', from: 'author', to: 'project', label: 'Projects' },
  { id: 'A2c', map: 'A2c', from: 'author', to: 'commit', label: 'Commits' },
  { id: 'A2f', map: 'A2f', from: 'author', to: 'file', label: 'Files' },
  { id: 'P2A', map: 'P2A', from: 'project', to: 'author', label: 'Authors' },
  { id: 'P2c', map: 'P2c', from: 'project', to: 'commit', label: 'Commits' },
  { id: 'P2f', map: 'P2f', from: 'project', to: 'file', label: 'Files' },
  { id: 'c2a', map: 'c2a', from: 'commit', to: 'author', label: 'Author' },
  { id: 'c2P', map: 'c2P', from: 'commit', to: 'project', label: 'Project' },
  { id: 'c2cc', map: 'c2cc', from: 'commit', to: 'commit', label: 'Children' },
  { id: 'c2b', map: 'c2b', from: 'commit', to: 'blob', label: 'Blobs' },
  { id: 'c2f', map: 'c2f', from: 'commit', to: 'file', label: 'Files' },
  { id: 'b2c', map: 'b2c', from: 'blob', to: 'commit', label: 'Commits' },
  { id: 'b2P', map: 'b2P', from: 'blob', to: 'project', label: 'Projects' },
  { id: 'b2A', map: 'b2A', from: 'blob', to: 'author', label: 'Authors' },
  { id: 'f2a', map: 'f2a', from: 'file', to: 'author', label: 'Authors' },
  { id: 'f2c', map: 'f2c', from: 'file', to: 'commit', label: 'Commits' }
];
const relsFor = (t: NType) => RELS.filter((r) => r.from === t);

const PALETTE = {
  light: { author: '#4a3aa7', project: '#2a78d6', commit: '#1baf7a', blob: '#eb6834', file: '#eda100' },
  dark: { author: '#9085e9', project: '#3987e5', commit: '#199e70', blob: '#d95926', file: '#c98500' }
};
const TYPE_ICON: Record<NType, string> = {
  author: 'i-material-symbols:person', project: 'i-material-symbols:package-2-outline',
  commit: 'i-material-symbols:commit', blob: 'i-material-symbols:data-object', file: 'i-material-symbols:description-outline'
};

const MAX_NODES = 260;
const MAX_EXPAND = 20;
const FRONTIER_PER_SOURCE = 8; // per-source cap when expanding a whole frontier at once
const BATCH_CHUNK = 40;        // keys per request (bounds GET URL length; chunks run in parallel)

/* Session caches — each (map,key) lookup and each metadata doc is deterministic for a given
   watermark, so we fetch once and reuse. This is what keeps re-expansion / back-and-forth
   navigation instant: a repeat expand or reselect never hits the network. */
const relCache = new Map<string, string[]>();
const metaCache = new Map<string, unknown>();
async function fetchRel(map: string, key: string): Promise<string[]> {
  const ck = `${map} ${key}`;
  const hit = relCache.get(ck);
  if (hit) return hit;
  const res = await getValues<unknown>(map, [key]);
  const vals = Array.from(new Set(normValues((res as Record<string, unknown>)[key])));
  relCache.set(ck, vals);
  return vals;
}
// Batched multi-key lookup: one request per BATCH_CHUNK uncached keys, chunks fired in
// parallel — grows a whole frontier in a single wave of round-trips instead of one-per-node.
async function fetchRelBatch(map: string, keys: string[]): Promise<Map<string, string[]>> {
  const missing = keys.filter((k) => !relCache.has(`${map} ${k}`));
  const chunks: string[][] = [];
  for (let i = 0; i < missing.length; i += BATCH_CHUNK) chunks.push(missing.slice(i, i + BATCH_CHUNK));
  await Promise.all(chunks.map(async (chunk) => {
    const res = (await getValues<unknown>(map, chunk)) as Record<string, unknown>;
    for (const k of chunk) relCache.set(`${map} ${k}`, Array.from(new Set(normValues(res[k]))));
  }));
  const out = new Map<string, string[]>();
  for (const k of keys) out.set(k, relCache.get(`${map} ${k}`) || []);
  return out;
}
// Author maps (A2*) key on the CANONICAL (aliased) author, not a raw name/email.
// a2A maps a raw identity -> its canonical A; fall back to the raw string if unmapped.
async function canonAuthor(raw: string): Promise<string> {
  try {
    const vals = await fetchRel('a2A', raw);
    return vals[0] || raw;
  } catch { return raw; }
}

/* ------------------------------------------------------------- helpers ---- */
function label(type: NType, key: string): string {
  if (type === 'author') {
    const m = key.match(/^(.*?)\s*<(.+?)>/);
    if (m) return (m[1].trim() || m[2]).slice(0, 28);
    return key.slice(0, 28);
  }
  if (type === 'project') return key.replace(/_/, '/').slice(0, 32);
  if (type === 'commit' || type === 'blob') return key.slice(0, 7);
  if (type === 'file') { const p = key.split('/'); return (p[p.length - 1] || key).slice(0, 24); }
  return key.slice(0, 28);
}
function normValues(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  const out: string[] = [];
  for (const v of arr) {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v) && v.length) out.push(String(v[0]));
    else if (v != null) out.push(String(v));
  }
  return out;
}

/* ------------------------------------------------------------- page ------- */
export default function ExplorePage() {
  const { resolvedTheme } = useTheme();
  const mode: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light';
  const colors = PALETTE[mode];

  const nodesRef = useRef<GNode[]>([]);
  const edgesRef = useRef<GEdge[]>([]);
  const alphaRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [, bump] = useReducer((x) => x + 1, 0);

  const view = useRef({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const W = 1000, H = 640;

  const [selected, setSelected] = useState<string | null>(null);
  const [expanding, setExpanding] = useState<string | null>(null);
  const [busyFront, setBusyFront] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [seedType, setSeedType] = useState<NType>('project');
  const [seedKey, setSeedKey] = useState('');
  const [sugg, setSugg] = useState<{ key: string; label: string; sub: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const pickedRef = useRef(false);

  /* ---- seed search (resolve a name / email / project to an exact WoC key) ---- */
  useEffect(() => {
    if (pickedRef.current) { pickedRef.current = false; setSugg([]); return; } // don't reopen right after a pick
    const q = seedKey.trim();
    if (seedType === 'commit' || q.length < 2) { setSugg([]); return; }
    let live = true; setSearching(true);
    const h = setTimeout(async () => {
      try {
        if (seedType === 'project') {
          const rows = await searchProject(q, 30);
          rows.sort((a, b) => (b.NumCommits || 0) - (a.NumCommits || 0)); // most active first
          if (live) setSugg(rows.slice(0, 12).map((p) => ({ key: p.ProjectID, label: p.ProjectID, sub: `${p.NumCommits} commits · ${p.NumAuthors} authors` })));
        } else {
          // partial-name match over canonical authors (A); fetch wide, then rank by
          // commit volume so the significant identities surface above 1-commit namesakes.
          const byEmail = q.includes('@');
          const rows = await searchAuthor(q, 30, byEmail ? 'email' : 'author');
          rows.sort((a, b) => (b.NumCommits || 0) - (a.NumCommits || 0));
          if (live) setSugg(rows.slice(0, 12).map((a) => {
            const nAlias = a.NumAlias > 0 ? a.NumAlias : (a.Alias?.length || 0);
            return {
              key: a.AuthorID, label: a.AuthorID,
              sub: `${a.NumCommits} commits · ${a.NumProjects} projects${nAlias ? ` · ${nAlias} aliases` : ''}`
            };
          }));
        }
      } catch { if (live) setSugg([]); }
      finally { if (live) setSearching(false); }
    }, 300);
    return () => { live = false; clearTimeout(h); };
  }, [seedKey, seedType]);

  const pickSuggestion = async (key: string) => {
    setSugg([]); pickedRef.current = true;
    if (seedType === 'author') {
      setResolving(true);
      const canon = await canonAuthor(key); // A2* maps need the canonical author
      setResolving(false);
      setSeedKey(key); seed('author', canon);
    } else {
      setSeedKey(key); seed(seedType, key);
    }
  };
  const submitSeed = () => {
    const q = seedKey.trim(); if (!q) return;
    if (sugg.length) return pickSuggestion(sugg[0].key);
    if (seedType === 'author') return pickSuggestion(q); // canonicalize a raw-typed identity
    seed(seedType, q);
  };

  /* ---- force simulation ---- */
  const kick = (a = 0.9) => {
    alphaRef.current = Math.max(alphaRef.current, a);
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
  };
  const tick = () => {
    const nodes = nodesRef.current, edges = edgesRef.current;
    const cx = W / 2, cy = H / 2;
    const a = alphaRef.current;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        let dx = n.x - m.x, dy = n.y - m.y;
        let d2 = dx * dx + dy * dy; if (d2 < 1) { d2 = 1; dx = Math.random(); dy = Math.random(); }
        const f = 5200 / d2;
        const d = Math.sqrt(d2); const fx = (dx / d) * f, fy = (dy / d) * f;
        n.vx += fx; n.vy += fy; m.vx -= fx; m.vy -= fy;
      }
      n.vx += (cx - n.x) * 0.015; n.vy += (cy - n.y) * 0.015;
    }
    for (const e of edges) {
      const s = nodes.find((z) => z.id === e.s), t = nodes.find((z) => z.id === e.t);
      if (!s || !t) continue;
      const dx = t.x - s.x, dy = t.y - s.y; const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 90) * 0.03; const fx = (dx / d) * f, fy = (dy / d) * f;
      s.vx += fx; s.vy += fy; t.vx -= fx; t.vy -= fy;
    }
    for (const n of nodes) {
      if (n.fixed) { n.vx = 0; n.vy = 0; continue; }
      n.x += n.vx * a * 0.5; n.y += n.vy * a * 0.5;
      n.vx *= 0.82; n.vy *= 0.82;
    }
    alphaRef.current *= 0.985;
    bump();
    if (alphaRef.current > 0.006) rafRef.current = requestAnimationFrame(tick);
    else rafRef.current = null;
  };
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /* ---- graph mutation ---- */
  const addNode = (type: NType, key: string, seed = false): GNode | null => {
    const id = `${type}:${key}`;
    let n = nodesRef.current.find((z) => z.id === id);
    if (n) return n;
    if (nodesRef.current.length >= MAX_NODES) { setNotice(`Graph capped at ${MAX_NODES} nodes — clear or prune to add more.`); return null; }
    n = { id, type, key, seed, x: W / 2 + (Math.random() - 0.5) * 120, y: H / 2 + (Math.random() - 0.5) * 120, vx: 0, vy: 0 };
    nodesRef.current.push(n);
    return n;
  };
  const addEdge = (s: string, t: string, rel: string) => {
    const id = `${rel}:${s}>${t}`;
    if (s === t) return;
    if (!edgesRef.current.find((e) => e.id === id)) edgesRef.current.push({ id, s, t, rel });
  };

  const seed = (type: NType, key: string) => {
    const k = key.trim(); if (!k) return;
    nodesRef.current = []; edgesRef.current = []; setSelected(null); setNotice(null);
    const n = addNode(type, k, true);
    if (n) { n.x = W / 2; n.y = H / 2; setSelected(n.id); kick(1); }
  };

  const expand = async (node: GNode, rel: Rel) => {
    const cached = relCache.get(`${rel.map} ${node.key}`);
    if (!cached) setExpanding(node.id + rel.id);
    setNotice(null);
    try {
      const vals = await fetchRel(rel.map, node.key);
      if (!vals.length) { setNotice(`No ${rel.label.toLowerCase()} found for this ${node.type}.`); return; }
      const capped = vals.slice(0, MAX_EXPAND);
      for (const v of capped) { const nn = addNode(rel.to, v); if (nn) addEdge(node.id, nn.id, rel.id); }
      if (vals.length > capped.length) setNotice(`Showing ${capped.length} of ${vals.length} ${rel.label.toLowerCase()} (capped for legibility).`);
      kick(0.9);
    } catch {
      setNotice(`Could not load ${rel.label.toLowerCase()} — the ${node.type} may not be in this map.`);
    } finally {
      setExpanding(null);
    }
  };

  // Batched frontier expand: grow EVERY node of `type` by `rel` in one wave of requests.
  const expandFrontier = async (type: NType, rel: Rel) => {
    const src = nodesRef.current.filter((n) => n.type === type);
    if (!src.length) return;
    setBusyFront(type + rel.id); setNotice(null);
    try {
      const byKey = await fetchRelBatch(rel.map, src.map((n) => n.key));
      let added = 0, capped = false;
      for (const n of src) {
        const vals = byKey.get(n.key) || [];
        for (const v of vals.slice(0, FRONTIER_PER_SOURCE)) {
          if (nodesRef.current.length >= MAX_NODES) { capped = true; break; }
          const nn = addNode(rel.to, v); if (nn) { addEdge(n.id, nn.id, rel.id); added++; }
        }
        if (capped) break;
      }
      setNotice(added
        ? `Expanded ${src.length} ${type}${src.length > 1 ? 's' : ''} → +${added} ${rel.label.toLowerCase()} in one batched wave${capped ? ` (stopped at the ${MAX_NODES}-node cap)` : ''}.`
        : `No new ${rel.label.toLowerCase()} to add.`);
      kick(0.95);
    } catch {
      setNotice(`Batched expand of ${rel.label.toLowerCase()} failed.`);
    } finally {
      setBusyFront(null);
    }
  };

  const prune = (node: GNode) => {
    // remove leaf neighbors reachable only from this node's edges (keep the node)
    const touching = edgesRef.current.filter((e) => e.s === node.id);
    const targets = new Set(touching.map((e) => e.t));
    for (const tid of targets) {
      const deg = edgesRef.current.filter((e) => e.s === tid || e.t === tid).length;
      if (deg <= 1) { nodesRef.current = nodesRef.current.filter((z) => z.id !== tid); }
    }
    edgesRef.current = edgesRef.current.filter((e) => nodesRef.current.find((z) => z.id === e.s) && nodesRef.current.find((z) => z.id === e.t));
    kick(0.5);
  };

  const clear = () => { nodesRef.current = []; edgesRef.current = []; setSelected(null); setNotice(null); bump(); };

  /* ---- pointer: pan / zoom / drag / select ---- */
  const drag = useRef<{ id: string | null; moved: boolean; px: number; py: number; panning: boolean } | null>(null);
  const toGraph = (clientX: number, clientY: number) => {
    const svg = svgRef.current!; const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const vb = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const v = view.current; return { x: (vb.x - v.x) / v.k, y: (vb.y - v.y) / v.k, vbx: vb.x, vby: vb.y };
  };
  const onDownNode = (e: React.PointerEvent, n: GNode) => {
    e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id: n.id, moved: false, px: e.clientX, py: e.clientY, panning: false };
  };
  const onDownBg = (e: React.PointerEvent) => {
    drag.current = { id: null, moved: false, px: e.clientX, py: e.clientY, panning: true };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    if (Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) > 3) d.moved = true;
    if (d.id) {
      const g = toGraph(e.clientX, e.clientY);
      const n = nodesRef.current.find((z) => z.id === d.id); if (n) { n.x = g.x; n.y = g.y; n.fixed = true; }
      kick(0.3);
    } else if (d.panning) {
      // convert screen-pixel delta to viewBox units so panning tracks the cursor 1:1
      const dx = e.clientX - d.px, dy = e.clientY - d.py; d.px = e.clientX; d.py = e.clientY;
      const m = svgRef.current!.getScreenCTM()!;
      view.current.x += dx / m.a; view.current.y += dy / m.d; bump();
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null; if (!d) return;
    if (d.id && !d.moved) { setSelected(d.id); const n = nodesRef.current.find((z) => z.id === d.id); if (n) n.fixed = false; }
    if (d.id) { const n = nodesRef.current.find((z) => z.id === d.id); if (n) n.fixed = false; }
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault(); const g = toGraph(e.clientX, e.clientY); const v = view.current;
    const k2 = Math.min(4, Math.max(0.2, v.k * (e.deltaY < 0 ? 1.12 : 0.89)));
    v.x = g.vbx - g.x * k2; v.y = g.vby - g.y * k2; v.k = k2; bump();
  };

  const sel = selected ? nodesRef.current.find((z) => z.id === selected) ?? null : null;
  const nodes = nodesRef.current, edges = edgesRef.current;

  const examples: [NType, string, string][] = [
    ['project', 'tensorflow_tensorflow', 'tensorflow/tensorflow'],
    ['project', 'python_cpython', 'python/cpython'],
    ['project', 'facebook_react', 'facebook/react']
  ];

  return (
    <WaveLayout className="max-w-none">
      <div className="flex w-full max-w-7xl flex-col items-center gap-4 px-2">
        <div className="z-1 flex flex-col items-center gap-3 pt-8">
          <h1 className="gradient-text text-center text-4xl font-bold md:text-5xl">Network Explorer</h1>
          <p className="text-primary/60 max-w-2xl text-center">
            Start from a project, author, or commit and expand outward — every edge is a live World of Code
            relation. Build a graph of who wrote what, which projects share code, and how commits connect.
          </p>
        </div>

        {/* seed bar — z-30 so the suggestions dropdown overlays the graph below it */}
        <div className="relative z-30 flex w-full max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="dark:bg-slate-8 flex rounded-md bg-slate-100 p-0.5">
              {(['project', 'author', 'commit'] as NType[]).map((t) => (
                <button key={t} onClick={() => setSeedType(t)}
                  className={cn('rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                    seedType === t ? 'bg-primary text-primary-foreground' : 'text-primary/60 hover:text-primary')}>{t}</button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[16rem]">
              <Input value={seedKey} onChange={(e) => setSeedKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSeed(); if (e.key === 'Escape') setSugg([]); }}
                placeholder={seedType === 'project' ? 'Search a project — e.g. tensorflow or python_cpython' : seedType === 'author' ? 'Search by name or email — e.g. torvalds or linus@…' : 'commit sha1'}
                className="h-9 w-full pr-8 text-sm" />
              {(searching || resolving) && <span className="i-material-symbols:progress-activity animate-spin text-primary/40 absolute right-2 top-1/2 -translate-y-1/2" />}
              {sugg.length > 0 && (
                <div className="dark:bg-slate-8 absolute left-0 top-10 z-50 max-h-72 w-full min-w-[22rem] overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700"
                  onWheel={(e) => e.stopPropagation()}>
                  {sugg.map((s) => (
                    <button key={s.key} type="button" onClick={() => pickSuggestion(s.key)}
                      className="hover:bg-accent flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left">
                      <span className="truncate font-mono text-xs font-500">{seedType === 'project' ? s.label.replace(/_/, '/') : s.label}</span>
                      <span className="text-primary/40 text-[10px]">{s.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button size="sm" onClick={submitSeed} className="gap-1"><span className="i-material-symbols:travel-explore" />Explore</Button>
          </div>
          <p className="text-primary/40 text-[11px]">
            Projects key on <span className="font-mono">owner_repo</span>; authors on the full{' '}
            <span className="font-mono">Name &lt;email&gt;</span> commit identity — so pick from the search results
            (a bare email isn&apos;t the key). Author picks are canonicalized through aliases automatically.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-primary/40 text-xs">Try:</span>
            {examples.map(([t, k, disp]) => (
              <button key={k} onClick={() => { setSeedType(t); setSeedKey(k); seed(t, k); }}
                className="dark:bg-slate-8 dark:hover:bg-slate-7 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs hover:bg-slate-200">{disp}</button>
            ))}
          </div>
        </div>

        {/* frontier expander — grow every node of a type in one batched wave */}
        {nodes.length > 0 && (
          <div className="z-1 flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200/50 bg-slate-50/60 px-3 py-2 dark:border-slate-700/40 dark:bg-slate-800/40">
            <span className="text-primary/50 flex items-center gap-1 text-xs font-medium"><span className="i-material-symbols:hub" />Grow frontier:</span>
            {(['project', 'author', 'commit', 'blob', 'file'] as NType[]).map((t) => {
              const count = nodes.filter((n) => n.type === t).length;
              if (!count) return null;
              return (
                <div key={t} className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-xs" style={{ color: colors[t] }}>
                    <span className={TYPE_ICON[t]} />{count} {t}{count > 1 ? 's' : ''}
                  </span>
                  {relsFor(t).map((r) => (
                    <button key={r.id} onClick={() => expandFrontier(t, r)} disabled={!!busyFront}
                      onPointerEnter={() => { fetchRelBatch(r.map, nodes.filter((n) => n.type === t).map((n) => n.key)).catch(() => {}); }}
                      className="dark:bg-slate-8 dark:hover:bg-slate-7 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-slate-200 disabled:opacity-50">
                      {busyFront === t + r.id && <span className="i-material-symbols:progress-activity animate-spin" />}
                      →{r.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* graph + side panel */}
        <div className="z-1 grid w-full grid-cols-1 gap-3 lg:grid-cols-[1fr_20rem]">
          <div className="dark:bg-slate-9/40 relative overflow-hidden rounded-xl border border-slate-200/60 bg-white/50 dark:border-slate-700/50">
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-[64vh] max-h-[640px] w-full touch-none select-none"
              onPointerDown={onDownBg} onPointerMove={onMove} onPointerUp={onUp} onWheel={onWheel}
              style={{ cursor: drag.current?.panning ? 'grabbing' : 'grab' }}>
              <g transform={`translate(${view.current.x},${view.current.y}) scale(${view.current.k})`}>
                {edges.map((e) => {
                  const s = nodes.find((z) => z.id === e.s), t = nodes.find((z) => z.id === e.t);
                  if (!s || !t) return null;
                  const hot = selected === e.s || selected === e.t;
                  return <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={mode === 'dark' ? '#ffffff' : '#000000'} strokeOpacity={hot ? 0.35 : 0.12} strokeWidth={hot ? 1.6 : 1} />;
                })}
                {nodes.map((n) => {
                  const c = colors[n.type]; const on = selected === n.id;
                  const r = n.seed ? 13 : 9;
                  return (
                    <g key={n.id} transform={`translate(${n.x},${n.y})`} style={{ cursor: 'pointer' }}
                      onPointerDown={(e) => onDownNode(e, n)}>
                      <circle r={on ? r + 3 : r} fill={c} fillOpacity={on ? 1 : 0.85}
                        stroke={mode === 'dark' ? '#0b0b0b' : '#ffffff'} strokeWidth={on ? 2.5 : 1.5} />
                      <text y={r + 12} textAnchor="middle" fontSize={11}
                        fill={mode === 'dark' ? '#e6e6e6' : '#1a1a1a'} style={{ pointerEvents: 'none', fontWeight: on ? 600 : 400 }}>
                        {label(n.type, n.key)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* overlay controls */}
            <div className="absolute left-3 top-3 flex items-center gap-2 text-xs">
              {(['author', 'project', 'commit', 'blob', 'file'] as NType[]).map((t) => (
                <span key={t} className="text-primary/60 flex items-center gap-1">
                  <span className="inline-block size-2.5 rounded-full" style={{ background: colors[t] }} />{t}
                </span>
              ))}
            </div>
            <div className="absolute right-3 top-3 flex gap-1">
              <button onClick={() => { view.current = { x: 0, y: 0, k: 1 }; kick(0.4); }} title="Reset view"
                className="dark:bg-slate-8/80 rounded-md bg-white/80 p-1.5 backdrop-blur"><span className="i-material-symbols:recenter" /></button>
              <button onClick={clear} title="Clear graph"
                className="dark:bg-slate-8/80 rounded-md bg-white/80 p-1.5 backdrop-blur"><span className="i-material-symbols:delete-outline" /></button>
            </div>
            <div className="text-primary/40 absolute bottom-2 left-3 text-[11px]">{nodes.length} nodes · {edges.length} edges · drag to pan · scroll to zoom</div>
            {notice && <div className="absolute bottom-2 right-3 max-w-[60%] rounded-md bg-amber-500/15 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300">{notice}</div>}
            {!nodes.length && (
              <div className="text-primary/40 pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="i-material-symbols:graph-3 text-4xl" />
                <span className="text-sm">Seed the graph above to begin exploring.</span>
              </div>
            )}
          </div>

          {/* side panel */}
          <div className="dark:bg-slate-8/60 rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/50">
            {sel ? <NodePanel node={sel} mode={mode} expanding={expanding} onExpand={expand} onPrune={prune} /> : (
              <div className="text-primary/50 flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-sm">
                <span className="i-material-symbols:touch-app-outline text-2xl" />
                Select a node to see its details and expand its connections.
              </div>
            )}
          </div>
        </div>
      </div>
    </WaveLayout>
  );
}

/* ------------------------------------------------------ node detail panel -- */
function NodePanel({ node, mode, expanding, onExpand, onPrune }:
  { node: GNode; mode: 'light' | 'dark'; expanding: string | null; onExpand: (n: GNode, r: Rel) => void; onPrune: (n: GNode) => void }) {
  const [meta, setMeta] = useState<any>(undefined);
  const c = PALETTE[mode][node.type];
  useEffect(() => {
    let live = true;
    const setMetaSafe = (v: any) => { if (live) setMeta(v); metaCache.set(node.id, v); };
    if (metaCache.has(node.id)) { setMeta(metaCache.get(node.id)); return; } // instant on revisit
    setMeta(undefined);
    const load = async () => {
      try {
        if (node.type === 'author') return setMetaSafe(await getAuthor(node.key));
        if (node.type === 'project') return setMetaSafe(await getProject(node.key));
        if (node.type === 'commit') return setMetaSafe(await getCommit(node.key));
        setMetaSafe(null);
      } catch { setMetaSafe({ __err: true }); }
    };
    load();
    return () => { live = false; };
  }, [node.id]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={cn('text-lg', TYPE_ICON[node.type])} style={{ color: c }} />
        <div className="min-w-0">
          <div className="text-primary/50 text-[10px] uppercase tracking-wide">{node.type}</div>
          <div className="truncate font-mono text-sm font-600" title={node.key}>{label(node.type, node.key)}</div>
        </div>
      </div>
      <div className="dark:bg-slate-9/50 break-all rounded bg-white/60 px-2 py-1 font-mono text-[10px] text-primary/60">{node.key}</div>

      <div>
        <div className="text-primary/60 mb-1.5 text-xs font-medium">Expand connections</div>
        <div className="flex flex-wrap gap-1.5">
          {relsFor(node.type).map((r) => {
            const busy = expanding === node.id + r.id;
            return (
              <button key={r.id} onClick={() => onExpand(node, r)} disabled={!!expanding}
                onPointerEnter={() => { fetchRel(r.map, node.key).catch(() => {}); }}
                className="dark:bg-slate-8 dark:hover:bg-slate-7 flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium transition-colors hover:bg-slate-200 disabled:opacity-50">
                <span className={cn(busy ? 'i-material-symbols:progress-activity animate-spin' : TYPE_ICON[r.to])} style={{ color: PALETTE[mode][r.to] }} />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <MetaView node={node} meta={meta} />

      <button onClick={() => onPrune(node)} className="text-primary/50 hover:text-primary mt-1 flex items-center gap-1 text-xs">
        <span className="i-material-symbols:content-cut" /> prune leaf neighbors
      </button>
    </div>
  );
}

function langTop(fi: Record<string, number> | undefined, n = 4): string {
  if (!fi) return '';
  return Object.entries(fi).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k).join(', ');
}
function ymd(ts?: number): string { return ts ? new Date(ts * 1000).toISOString().slice(0, 7) : '—'; }

function MetaView({ node, meta }: { node: GNode; meta: any }) {
  if (meta === undefined) return <div className="text-primary/40 text-xs">Loading metadata…</div>;
  if (meta === null) return <div className="text-primary/40 text-xs">No metadata for this node type.</div>;
  if (meta.__err) return <div className="text-primary/40 text-xs">No metadata record found.</div>;
  const rows: [string, string][] = [];
  if (node.type === 'author') {
    const a = meta as MongoAuthor;
    rows.push(['Commits', String(a.NumCommits)], ['Projects', String(a.NumProjects)], ['Files', String(a.NumFiles)],
      ['Aliases', String(a.NumAlias)], ['Active', `${ymd(a.EarliestCommitDate)} → ${ymd(a.LatestCommitDate)}`], ['Languages', langTop(a.FileInfo)]);
  } else if (node.type === 'project') {
    const p = meta as MongoProject;
    rows.push(['Authors', String(p.NumAuthors)], ['Commits', String(p.NumCommits)], ['Files', String(p.NumFiles)],
      ['Forks', String(p.NumForks)], ['Community', String(p.CommunitySize)], ['Active', `${ymd(p.EarliestCommitDate)} → ${ymd(p.LatestCommitDate)}`], ['Languages', langTop(p.FileInfo)]);
  } else if (node.type === 'commit') {
    const cmt = meta;
    rows.push(['Author', String(cmt.author || '—').slice(0, 30)], ['When', cmt.authored_at ? new Date(cmt.authored_at).toISOString().slice(0, 10) : '—'],
      ['Message', String(cmt.message || '').split('\n')[0].slice(0, 60)]);
  }
  if (!rows.length) return null;
  return (
    <div className="dark:bg-slate-9/40 rounded-lg bg-white/50 p-2">
      <div className="text-primary/60 mb-1 text-xs font-medium">Metadata</div>
      <div className="flex flex-col gap-1">
        {rows.filter(([, v]) => v && v !== '—' && v !== '').map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 text-xs">
            <span className="text-primary/40 shrink-0">{k}</span>
            <span className="text-primary/80 truncate text-right" title={v}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
