# EntrelaOS → AI Business OS Completo: Avaliação Estrutural

> Autor: Winston (Architect) · Data: 2026-06-12
> Escopo: revisão estrutural do repo `d:\EntrelaOS-app` (React 19 + Vite + Express + 34 services), para identificar o que falta/quebra na transição de "conjunto de Studios" para "AI Business OS completo".

## 1. Estado Atual (resumo)

- 19 módulos top-level ("Studios": BrandingOS, CourseCreator, SquadManager, AdsStudio, EditAI, etc.) + 8 submódulos, todos lazy-loaded em `App.tsx`.
- Backend Express (`server.ts`, 3.366 linhas) com 34 services/registries.
- Roteamento multi-provider de IA (Groq, Gemini, OpenAI, Anthropic, OpenRouter) com spec completa em `docs/architecture/api-provider-control-center.md` (Fase 1 implementada, Fases 2-3 pendentes).
- Deploy via Docker (Chromium, ffmpeg, Claude Code CLI embarcado) — pronto para Railway/Vercel.
- `package.json` depende de `aiox-core` (framework deste repo `EntrlacOS`) para a automação de Squads.

## 2. Gaps Estruturais Críticos (priorizados)

### 2.1 Camada de Dados — JSON local, sem multi-tenant (BLOQUEADOR #1)

**Evidência:** `services/squadRegistry.ts` (e os outros ~15 `*Registry.ts`) persistem em `process.cwd()/.aiox/*.json` via `fs.readFile`/`fs.writeFile`. `.env.example` define `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, mas **nenhum arquivo do repo usa o client Supabase** — zero `createClient`, zero schema SQL.

**Impacto:** Um "Business OS" pressupõe dados de negócio (manifestos de marca, campanhas, squads, cursos) persistentes, multiusuário e consultáveis. Hoje:
- Deploy em Railway/Vercel com filesystem efêmero → **perda de dados em cada redeploy**.
- Sem separação por usuário/organização → um único "tenant" implícito, qualquer chamada à API vê tudo.
- Sem backup, sem queries relacionais, sem auditoria.

**Recomendação:** Migrar os 15+ registries de `.aiox/*.json` para tabelas Supabase com RLS por `org_id`/`user_id`. Escopo natural para `@data-engineer`.

### 2.2 Autenticação & Multi-tenancy — inexistente

**Evidência:** busca por `auth`/`supabase` em todo o repo (exceto node_modules) não retornou nenhum arquivo.

**Impacto:** Não há login, sessão, papéis (admin/editor/viewer) nem isolamento entre clientes/organizações. Decisão de produto necessária antes do design técnico: EntrelaOS é (a) ferramenta interna de uma operação só, ou (b) SaaS multi-cliente? Isso muda drasticamente o modelo de dados e o RLS do item 2.1.

**Recomendação:** `@pm` define o modelo de negócio (single-tenant vs multi-tenant) → `@architect`/`@data-engineer` desenham auth (Supabase Auth) e RLS em conjunto com 2.1.

### 2.3 Monólitos de Frontend não decompostos

**Evidência:** `views/BrandingOS.tsx` = 437KB; `views/TrafficTeam.tsx` = 87KB; `views/EloCut.tsx` = 54KB; `views/CognitiveEngine.tsx` = 49KB; `components/Layout/Sidebar.tsx` = 37KB. Comparar com `views/squad-manager/` (decomposto em Dashboard/Builder/Runner/AIWizard) ou `views/design-studio/` — padrão correto já existe e não foi replicado.

**Impacto:** Risco alto de regressão, bundle splitting ineficaz mesmo com lazy-loading (um único chunk gigante), difícil paralelizar trabalho entre devs/agents.

**Recomendação:** `@ux-design-expert` mapeia a decomposição em sub-componentes/sub-rotas seguindo o padrão `squad-manager/`; `@dev` executa por story.

### 2.4 AI Provider Control Center — Fases 2/3 pendentes

**Evidência:** `docs/architecture/api-provider-control-center.md` define Fase 1 (config local `.aiox/provider-config.json`) como única implementada. Fase 2 (credenciais cifradas) e Fase 3 (override por módulo) não existem.

**Impacto:** Credenciais de 5 providers de IA em JSON plano no filesystem do servidor — risco de segurança real em produção, especialmente combinado com 2.1/2.2 (sem isolamento de tenant, qualquer vazamento expõe todas as chaves).

**Recomendação:** Priorizar Fase 2 (cifragem) junto com a migração Supabase de 2.1 — mesmo esforço de "mover secrets para storage seguro".

### 2.5 Sistemas de edição de vídeo duplicados

**Evidência:** `EditAI`/`EloCut` (interno, services `editai*`) e `AutoEdit` (`autoEditService`, `autoEditRegistry`) implementam pipelines de corte de vídeo sobrepostos (detecção de silêncio/gagueira via ffmpeg).

**Impacto:** Manutenção duplicada, UX inconsistente entre dois fluxos que resolvem o mesmo problema.

**Recomendação:** `@pm`/`@ux` decidem se consolidam em um único módulo ou mantêm como "modo simples vs avançado" explícito.

### 2.6 Navegação/IA em escala

**Evidência:** Sidebar estático de 37KB cobrindo 19 módulos top-level + 8 submódulos, sem agrupamento por domínio aparente (Branding, Conteúdo, Vídeo, Agentes, Configuração).

**Impacto:** Conforme o produto crescer rumo a "OS completo", navegação plana vira gargalo de descoberta. CmdK (busca) ajuda mas não substitui IA.

**Recomendação:** `@ux-design-expert` propõe agrupamento por domínio funcional + possível reestruturação do Sidebar.

### 2.7 Squad Manager como camada de orquestração isolada

**Evidência:** `SquadDashboard.tsx` (aberto pela usuária) é o módulo mais "OS-like" — orquestra agentes de IA com pipelines multi-stage via `/api/squads/*`, mas não há evidência de integração com os outros 18 Studios (ex.: um Squad disparado a partir do BrandingOS ou CourseCreator).

**Impacto:** O "cérebro orquestrador" do Business OS existe mas está desconectado dos módulos de produto — cada Studio roda sua própria lógica de IA via `aiProviderRegistry`, sem passar pelos Squads.

**Recomendação:** `@architect` (eu, próxima fase) + `@pm` definem se Squad Manager se torna a camada de orquestração transversal (qualquer módulo pode disparar um Squad) ou permanece um módulo independente.

## 3. Plano de Fases Recomendado

| Fase | Dono | Entregável |
|------|------|------------|
| 1 | @architect (este doc) | Avaliação estrutural — DONE |
| 2 | @pm | Definir modelo de negócio (multi-tenant?), priorizar gaps em epics |
| 3 | @ux-design-expert | Revisão de IA/navegação + plano de decomposição dos monólitos |
| 4 | @data-engineer | Schema Supabase + RLS para os 15 registries + migração |
| 5 | @architect | Design da camada de auth + Squad-as-orchestrator (2.7) |
| 6 | @dev | Implementação por stories, story-driven |
| 7 | @qa | Quality gate completo |

## 4. Próximos Passos Imediatos

Disparando agora, em paralelo:
- `@pm` → roadmap/epic de priorização (Fase 2 acima)
- `@ux-design-expert` → revisão de IA + decomposição de monólitos (Fase 3 acima)
