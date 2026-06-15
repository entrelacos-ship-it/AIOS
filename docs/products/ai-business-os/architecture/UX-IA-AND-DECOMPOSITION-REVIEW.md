# UX — Decomposição de Monólitos & IA de Navegação (Fase UX)

> Nota: os agentes `aiox-ux`/general-purpose ficam sandboxed ao repo `d:\AI_Workspace\Projects\EntrlacOS` e não alcançam `d:\EntrelaOS-app`. Esta fase foi conduzida pelo architect orquestrador (Winston), aplicando a lente de UX (Uma), com base em `docs/architecture/AI-BUSINESS-OS-STRUCTURAL-ASSESSMENT.md` e leitura estrutural direta dos arquivos.

## 1. Decomposição de `views/BrandingOS.tsx` (7.174 linhas / 437KB)

**Estrutura atual:**
- Linhas 1-667: tipos/interfaces/constantes compartilhadas (`SlideData`, `CarouselDraftRecord`, `CalendarPost*`, `EditorialLineItem`, presets de estilo de carrossel, prompts default, etc.)
- Linhas 668-7174 (~6.500 linhas): **um único componente** `export const BrandingOS: React.FC<BrandingOSProps>`, controlado pela prop `view` com 9 valores possíveis (`View.BRANDING_OS_*`), cada um correspondendo a um item do Sidebar:

| View enum | Label no Sidebar | Sub-view proposta |
|-----------|------------------|--------------------|
| `BRANDING_OS_MANIFESTO` | 0. Base da Marca | `ManifestoView.tsx` |
| `BRANDING_OS_EDITORIAL_LINES` | Linhas Editoriais | `EditorialLinesView.tsx` |
| `BRANDING_OS_CALENDAR` | Calendário de Conteúdo | `CalendarView.tsx` |
| `BRANDING_OS_ASSET` | 1. Formato | `AssetView.tsx` |
| `BRANDING_OS_CONTEXT` | 2. Ingestão | `ContextView.tsx` |
| `BRANDING_OS_OBJECTIVE` | 3. Decomposição | `ObjectiveView.tsx` |
| `BRANDING_OS_CONTENT` | 4. Construção | `ContentView.tsx` |
| `BRANDING_OS_VISUAL` | 5. Embalagem | `VisualView.tsx` |
| `BRANDING_OS_EXPORT` | 6. Entrega | `ExportView.tsx` |

**Plano de decomposição (segue padrão `views/squad-manager/` e `views/design-studio/`):**

```
views/branding-os/
  types.ts                 ← linhas 1-667 (interfaces, constantes, presets, prompts)
  BrandingOSShell.tsx       ← BrandingOS.tsx atual reduzido: state/contexto compartilhado
                               (manifestos, linhas editoriais, calendário) + roteia para
                               a sub-view ativa conforme `view`
  ManifestoView.tsx
  EditorialLinesView.tsx
  CalendarView.tsx
  AssetView.tsx
  ContextView.tsx
  ObjectiveView.tsx
  ContentView.tsx
  VisualView.tsx
  ExportView.tsx
  hooks/
    useBrandingState.ts     ← estado compartilhado entre sub-views (manifesto ativo,
                               drafts de carrossel, presets) extraído do shell
```

`views/BrandingOS.tsx` passa a ser um re-export fino de `BrandingOSShell` (mantém import path estável em `App.tsx`).

## 2. Decomposição — TrafficTeam, EloCut, CognitiveEngine

| Arquivo | Linhas | Observação | Plano |
|---------|--------|------------|-------|
| `views/CognitiveEngine.tsx` | 743 | Sidebar já expõe 7 sub-views (`COGNITIVE_ENGINE_INFERENCE`, `_PRECISION`, `_SCIENTIFIC`, `_RELATIONSHIPS`, `_SYSTEMS`, `_TOOLS`, `_MODELS`) | Mesmo padrão do BrandingOS: `views/cognitive-engine/{InferenceView,PrecisionView,ScientificView,RelationshipsView,SystemsView,ToolsView,ModelsView}.tsx` + shell. Esforço menor (743 linhas / 7 = ~106 linhas por sub-view). |
| `views/TrafficTeam.tsx` | 1.707 | É um link standalone no Sidebar (sem `View.TRAFFIC_TEAM_*` sub-itens) — provavelmente organizado por **tabs internas**, não por View enum | Mapear as tabs internas (grep por `useState` de tab/seção) e extrair cada tab para `views/traffic-team/{Tab}.tsx`, seguindo o padrão já usado em `views/ads-studio/` (Audit/Copy/Strategy). |
| `views/EloCut.tsx` | 1.211 | Também standalone (`View.ELO_CUT`) | Mesmo tratamento: identificar seções internas (upload, transcrição, plano de corte, timeline, render) e extrair para `views/elo-cut/{Section}.tsx`. Avaliar junto do Epic 6 (consolidação com AutoEdit) antes de investir na decomposição — pode mudar o resultado final. |

## 3. IA de Navegação — Agrupamento por Domínio

`components/Layout/Sidebar.tsx` (778 linhas) hoje lista os 19 módulos em seções sequenciais sem cabeçalhos de domínio. Proposta — 6 grupos colapsáveis no nível mais alto, cada um agrupando os toggles já existentes:

| Grupo | Módulos (label atual no código) |
|-------|----------------------------------|
| **Marca & Conteúdo** | BrandingOS (`branding`), DesignStudio (`design`), DesignSystem, DesignReferences, CarouselStudio, SlidesStudio (`slides`) |
| **Vídeo & Mídia** | EloCut (`ELO_CUT`), EditAI (`editai`), AutoEdit (`autoedit`), MediaStudio |
| **Tráfego & Ads** | AdsStudio (`ads`), TrafficTeam (`TRAFFIC_TEAM`) |
| **Agentes & Automação** | SquadManager (`squad`), CloneStudio (`clone`) |
| **Educação & Cognição** | CourseCreator (`course`), CognitiveEngine (`cognitive`) |
| **Produto & Sistema** | PRDStudio (`prd`), AIControlCenter, Ecosystem (`ECOSYSTEM_*`) |

Cada grupo já corresponde a um ou mais `toggle('<id>', ...)` existentes no Sidebar — a mudança é primariamente de **apresentação** (cabeçalhos de seção colapsáveis), não de roteamento. Baixo risco, alto ganho de descoberta conforme o app crescer além de 19 módulos.

## 4. Sequenciamento

Ambas as frentes (decomposição de monólitos e IA do Sidebar) são independentes da camada de dados (Epics 1-3 do roadmap PM) e podem rodar em paralelo — ver `docs/product/AI-BUSINESS-OS-ROADMAP.md`, Fase C. Ordem sugerida dentro da Fase C:

1. CognitiveEngine (menor, padrão claro) — valida o processo de decomposição.
2. BrandingOS (maior impacto, maior esforço).
3. Sidebar — agrupamento por domínio (pode ser feito a qualquer momento, mas fica mais simples depois de 1-2 já que reduz o nº de itens "soltos").
4. TrafficTeam / EloCut — após decisão do Epic 6 (EloCut pode mudar de forma).
