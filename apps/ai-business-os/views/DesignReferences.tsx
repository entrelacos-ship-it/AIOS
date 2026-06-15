import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronRight, Loader2, Search, Code2, Eye, Globe, ExternalLink } from 'lucide-react';
import { marked } from 'marked';

interface Brand { id: string; name: string; }
interface Doc { file: string; content: string; }

const ENTRELACSOS_PAGES: { file: string; label: string }[] = [
  { file: 'filosofia.html',    label: 'Filosofia' },
  { file: 'identidade.html',   label: 'Identidade' },
  { file: 'cores.html',        label: 'Cores' },
  { file: 'tipografia.html',   label: 'Tipografia' },
  { file: 'espaco.html',       label: 'Espaço' },
  { file: 'raio.html',         label: 'Bordas' },
  { file: 'sombra.html',       label: 'Sombra' },
  { file: 'botoes.html',       label: 'Botões' },
  { file: 'inputs.html',       label: 'Inputs' },
  { file: 'cards.html',        label: 'Cards' },
  { file: 'badges.html',       label: 'Badges' },
  { file: 'header.html',       label: 'Header' },
  { file: 'eyebrows.html',     label: 'Eyebrows' },
  { file: 'copy.html',         label: 'Copy' },
  { file: 'voz.html',          label: 'Voz' },
  { file: 'marketing.html',    label: 'Marketing' },
  { file: 'dobras.html',       label: 'Dobras' },
  { file: 'motion.html',       label: 'Motion' },
  { file: 'motion-effects.html', label: 'Motion FX' },
  { file: 'exemplos.html',     label: 'Exemplos' },
  { file: 'quickstart.html',   label: 'Quickstart' },
  { file: 'regras.html',       label: 'Regras' },
  { file: 'stats.html',        label: 'Stats' },
  { file: 'avancados.html',    label: 'Avançados' },
  { file: 'acessibilidade.html', label: 'Acessibilidade' },
];

const ENTRELACSOS_BRAND: Brand = { id: 'entrelacOS', name: 'Entrelaços DS' };

const TATI_PAGES: { file: string; label: string }[] = [
  { file: 'biblia.html',                           label: 'Bíblia DS' },
  { file: 'animacoes.html',                        label: 'Animações' },
  { file: 'tati-ds/index.html',                    label: 'Componentes' },
  { file: 'lp-tatiana/Landing Tatiana Ribeiro.html', label: 'LP Exemplo' },
];

const TATI_BRAND: Brand = { id: 'tatiRibeiro', name: 'Tati Ribeiro DS' };

const BRAND_URLS: Record<string, string> = {
  entrelacOS: 'https://entrelacospsicologia.com.br',
  tatiRibeiro: 'https://tatiribeirocoach.com.br',
  airbnb: 'https://www.airbnb.com',
  airtable: 'https://www.airtable.com',
  apple: 'https://www.apple.com',
  binance: 'https://www.binance.com',
  bmw: 'https://www.bmw.com',
  'bmw-m': 'https://www.bmw-m.com',
  bugatti: 'https://www.bugatti.com',
  cal: 'https://cal.com',
  claude: 'https://claude.ai',
  clay: 'https://www.clay.com',
  clickhouse: 'https://clickhouse.com',
  cohere: 'https://cohere.com',
  coinbase: 'https://www.coinbase.com',
  composio: 'https://composio.dev',
  cursor: 'https://www.cursor.com',
  elevenlabs: 'https://elevenlabs.io',
  expo: 'https://expo.dev',
  ferrari: 'https://www.ferrari.com',
  figma: 'https://www.figma.com',
  framer: 'https://www.framer.com',
  hashicorp: 'https://www.hashicorp.com',
  ibm: 'https://www.ibm.com',
  intercom: 'https://www.intercom.com',
  kraken: 'https://www.kraken.com',
  lamborghini: 'https://www.lamborghini.com',
  'linear.app': 'https://linear.app',
  lovable: 'https://lovable.dev',
  mastercard: 'https://www.mastercard.com',
  meta: 'https://www.meta.com',
  minimax: 'https://www.minimaxi.com',
  mintlify: 'https://mintlify.com',
  miro: 'https://miro.com',
  'mistral.ai': 'https://mistral.ai',
  mongodb: 'https://www.mongodb.com',
  nike: 'https://www.nike.com',
  notion: 'https://www.notion.so',
  nvidia: 'https://www.nvidia.com',
  ollama: 'https://ollama.com',
  'opencode.ai': 'https://opencode.ai',
  pinterest: 'https://www.pinterest.com',
  playstation: 'https://www.playstation.com',
  posthog: 'https://posthog.com',
  raycast: 'https://www.raycast.com',
  renault: 'https://www.renault.com',
  replicate: 'https://replicate.com',
  resend: 'https://resend.com',
  revolut: 'https://www.revolut.com',
  runwayml: 'https://runwayml.com',
  sanity: 'https://www.sanity.io',
  sentry: 'https://sentry.io',
  shopify: 'https://www.shopify.com',
  spacex: 'https://www.spacex.com',
  spotify: 'https://www.spotify.com',
  starbucks: 'https://www.starbucks.com',
  stripe: 'https://stripe.com',
  supabase: 'https://supabase.com',
  superhuman: 'https://superhuman.com',
  tesla: 'https://www.tesla.com',
  theverge: 'https://www.theverge.com',
  'together.ai': 'https://www.together.ai',
  uber: 'https://www.uber.com',
  vercel: 'https://vercel.com',
  vodafone: 'https://www.vodafone.com',
  voltagent: 'https://voltagent.dev',
  warp: 'https://www.warp.dev',
  webflow: 'https://webflow.com',
  wired: 'https://www.wired.com',
  wise: 'https://wise.com',
  'x.ai': 'https://x.ai',
  zapier: 'https://zapier.com',
};

const PREVIEW_STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1a1a1a; max-width: 860px; margin: 0 auto; padding: 2rem; line-height: 1.7; }
  h1 { font-size: 2rem; font-weight: 700; margin-top: 0; }
  h2 { font-size: 1.4rem; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: .4rem; margin-top: 2rem; }
  h3 { font-size: 1.1rem; font-weight: 600; color: #374151; }
  code { background: #f3f4f6; padding: .15rem .4rem; border-radius: 4px; font-size: .85em; }
  pre { background: #1e1e2e; color: #cdd6f4; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  pre code { background: transparent; padding: 0; color: inherit; font-size: .875em; }
  blockquote { border-left: 4px solid #6366f1; margin: 0; padding: .5rem 1rem; background: #f5f3ff; color: #4b5563; }
  table { width: 100%; border-collapse: collapse; font-size: .9em; }
  th { background: #f9fafb; text-align: left; padding: .5rem .75rem; border: 1px solid #e5e7eb; font-weight: 600; }
  td { padding: .5rem .75rem; border: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  a { color: #6366f1; }
  img { max-width: 100%; border-radius: 8px; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
`;

export const DesignReferences: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [lpScreenshot, setLpScreenshot] = useState<string | null>(null);
  const [lpLoading, setLpLoading] = useState(false);
  const [lpError, setLpError] = useState(false);
  const mdIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch('/api/design-references')
      .then((r) => r.json())
      .then((d) => setBrands([ENTRELACSOS_BRAND, TATI_BRAND, ...(d.brands || [])]))
      .finally(() => setLoading(false));
  }, []);

  // Render markdown into iframe when in preview mode
  useEffect(() => {
    const doc = activeTab !== 'lp' ? docs.find((d) => d.file === activeTab) : null;
    if (!mdIframeRef.current || !doc || viewMode !== 'preview') return;
    const html = marked(doc.content) as string;
    const iDoc = mdIframeRef.current.contentDocument;
    if (!iDoc) return;
    iDoc.open();
    iDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PREVIEW_STYLE}</style></head><body>${html}</body></html>`);
    iDoc.close();
  }, [activeTab, viewMode, docs]);

  const brandUrl = selected ? BRAND_URLS[selected.id] : null;
  const isLpTab = activeTab === 'lp';

  // Fetch screenshot when LP tab is active
  useEffect(() => {
    if (!isLpTab || !brandUrl || lpScreenshot) return;
    setLpLoading(true);
    setLpError(false);
    fetch(`/api/screenshot?url=${encodeURIComponent(brandUrl)}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then((blob) => setLpScreenshot(URL.createObjectURL(blob)))
      .catch(() => setLpError(true))
      .finally(() => setLpLoading(false));
  }, [activeTab, brandUrl]);

  const isEntrelacOS = selected?.id === 'entrelacOS';
  const isTatiRibeiro = selected?.id === 'tatiRibeiro';
  const isOwnDS = isEntrelacOS || isTatiRibeiro;

  const selectBrand = async (brand: Brand) => {
    setSelected(brand);
    setDocs([]);
    setActiveDoc(null);
    setActiveTab('');
    setLpScreenshot(null);
    setLpLoading(false);
    setLpError(false);
    if (brand.id === 'entrelacOS') {
      setActiveTab(ENTRELACSOS_PAGES[0].file);
      return;
    }
    if (brand.id === 'tatiRibeiro') {
      setActiveTab(TATI_PAGES[0].file);
      return;
    }
    setLoadingDocs(true);
    try {
      const r = await fetch(`/api/design-references/${brand.id}`).then((r) => r.json());
      setDocs(r.docs || []);
      if (r.docs?.length > 0) {
        setActiveDoc(r.docs[0]);
        setActiveTab(r.docs[0].file);
      }
    } finally {
      setLoadingDocs(false);
    }
  };

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeDocContent = !isLpTab ? docs.find((d) => d.file === activeTab) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-128px)] -m-8 mt-0">
      {/* Brand list */}
      <div className="w-64 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
        <div className="p-4 border-b border-[#1a1a1a]">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Design References</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar marca..."
              className="w-full pl-9 pr-3 py-2 bg-[#111] border border-[#222] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.map((brand) => {
            const isEntrelac = brand.id === 'entrelacOS';
            const isTati = brand.id === 'tatiRibeiro';
            const isOwnBrand = isEntrelac || isTati;
            const isActive = selected?.id === brand.id;
            return (
              <button
                key={brand.id}
                onClick={() => void selectBrand(brand)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors border-l-2 ${
                  isActive && isEntrelac
                    ? 'bg-violet-500/15 text-violet-300 border-violet-500'
                    : isActive && isTati
                    ? 'bg-pink-500/15 text-pink-300 border-pink-500'
                    : isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500'
                    : isEntrelac
                    ? 'text-violet-400 hover:text-violet-200 hover:bg-violet-500/10 border-violet-500/40'
                    : isTati
                    ? 'text-pink-400 hover:text-pink-200 hover:bg-pink-500/10 border-pink-500/40'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/3 border-transparent'
                }`}
              >
                <span className="capitalize font-medium">{brand.name}</span>
                {isOwnBrand ? (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide ${
                    isEntrelac ? 'bg-violet-500/20 text-violet-300' : 'bg-pink-500/20 text-pink-300'
                  }`}>DS</span>
                ) : (
                  <ChevronRight className="w-3 h-3 opacity-40" />
                )}
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-[#1a1a1a]">
          <p className="text-[10px] text-gray-700 text-center">{brands.length} marcas disponíveis</p>
        </div>
      </div>

      {/* Doc tabs + content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Selecione uma marca para ver os guias de design</p>
              <p className="text-gray-700 text-xs mt-1">Apple, Figma, Linear, Cursor e mais</p>
            </div>
          </div>
        ) : loadingDocs ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Tabs bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-0 border-b border-[#1a1a1a] overflow-x-auto gap-4">
              <div className="flex gap-1">
                {/* Entrelaços DS tabs */}
                {isEntrelacOS && ENTRELACSOS_PAGES.map((page) => (
                  <button
                    key={page.file}
                    onClick={() => setActiveTab(page.file)}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === page.file
                        ? 'border-violet-500 text-violet-300'
                        : 'border-transparent text-gray-500 hover:text-violet-300'
                    }`}
                  >
                    {page.label}
                  </button>
                ))}

                {/* Tati Ribeiro DS tabs */}
                {isTatiRibeiro && TATI_PAGES.map((page) => (
                  <button
                    key={page.file}
                    onClick={() => setActiveTab(page.file)}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === page.file
                        ? 'border-pink-500 text-pink-300'
                        : 'border-transparent text-gray-500 hover:text-pink-300'
                    }`}
                  >
                    {page.label}
                  </button>
                ))}

                {/* Doc tabs (other brands) */}
                {!isOwnDS && docs.map((doc) => (
                  <button
                    key={doc.file}
                    onClick={() => { setActiveTab(doc.file); setActiveDoc(doc); }}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === doc.file
                        ? 'border-cyan-500 text-cyan-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {doc.file.replace('.md', '')}
                  </button>
                ))}

                {/* LP tab — only when URL mapped */}
                {brandUrl && (
                  <button
                    onClick={() => setActiveTab('lp')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isLpTab
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    LP
                  </button>
                )}
              </div>

              {/* View mode toggle — only for doc tabs (not own DS, not LP) */}
              {!isLpTab && !isOwnDS && (
                <div className="flex items-center gap-1 shrink-0 pb-2">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      viewMode === 'code'
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Código
                  </button>
                </div>
              )}
            </div>

            {/* ── Entrelaços DS content ── */}
            {isEntrelacOS && !isLpTab && (
              <iframe
                key={activeTab}
                src={`/design-system/entrelacOS/biblia/${activeTab}`}
                className="flex-1 w-full border-0"
                title={activeTab}
              />
            )}

            {/* ── Tati Ribeiro DS content ── */}
            {isTatiRibeiro && !isLpTab && (
              <iframe
                key={activeTab}
                src={`/design-system/tatiRibeiro/${activeTab}`}
                className="flex-1 w-full border-0"
                title={activeTab}
              />
            )}

            {/* ── LP tab content ── */}
            {isLpTab && brandUrl && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border-b border-[#1a1a1a]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-[#1a1a1a] rounded-md px-3 py-1.5 text-xs text-gray-400 font-mono">
                    <Globe className="w-3 h-3 text-gray-600 shrink-0" />
                    <span className="truncate">{brandUrl}</span>
                  </div>
                  <a
                    href={brandUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                  </a>
                </div>

                {/* Screenshot content */}
                {lpLoading ? (
                  <div className="flex-1 flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-gray-400 text-sm">Capturando screenshot...</span>
                  </div>
                ) : lpError ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
                    <Globe className="w-10 h-10 text-gray-700" />
                    <p className="text-gray-400 text-sm">Não foi possível capturar o site.</p>
                    <a
                      href={brandUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir {selected.name} no navegador
                    </a>
                  </div>
                ) : lpScreenshot ? (
                  <div className="flex-1 overflow-auto">
                    <img src={lpScreenshot} alt={`${selected.name} LP`} className="w-full" />
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Doc tab content ── */}
            {!isLpTab && !isOwnDS && (
              viewMode === 'preview' ? (
                <iframe
                  ref={mdIframeRef}
                  className="flex-1 w-full bg-white border-0"
                  sandbox="allow-same-origin"
                  title="preview"
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-6">
                  {activeDocContent && (
                    <div className="max-w-3xl mx-auto">
                      <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono bg-transparent">
                        {activeDocContent.content}
                      </pre>
                    </div>
                  )}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};
