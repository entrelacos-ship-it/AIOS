# AI Business OS — Roadmap de Transformação (Fase PM)

> Nota: os agentes especializados `aiox-pm`/`aiox-ux` (e suas variantes general-purpose) ficam sandboxed ao repo `d:\AI_Workspace\Projects\EntrlacOS` e não conseguem ler/escrever em `d:\EntrelaOS-app`. Esta fase foi conduzida pelo architect orquestrador (Winston), aplicando a lente de PM (Morgan), com base em `docs/architecture/AI-BUSINESS-OS-STRUCTURAL-ASSESSMENT.md`.

## Decisão de Modelo de Negócio (confirmada com Tatiana, 2026-06-12)

**Single-tenant interno.** EntrelaOS é o OS operacional da Entrelaços (1 organização). Múltiplos usuários/papéis via Supabase Auth + roles (admin/editor/viewer). **Sem** `org_id`/RLS multi-organização — schema mais simples, foco em durabilidade dos dados e segurança de credenciais, não em isolamento entre clientes externos.

## Evidências de Direção de Produto

- `package.json`: `name: "entrelaç[os]---o-melhor-oficial"` — branding próprio da Entrelaços, não um produto white-label.
- `README.md`: app local "AI Studio", roda em `localhost:3010`, fluxo de single-user dev (`npm run dev`/`npm run local`).
- 19 Studios cobrem todo o ciclo de marca, conteúdo, vídeo, tráfego, educação e orquestração de agentes — consistente com "OS interno completo" de uma operação, não com um produto SaaS genérico.

## Roadmap Priorizado (Epics)

### Epic 1 — Camada de Dados Durável (XL · P0)
Migrar os 15+ registries JSON (`services/*Registry.ts` → `.aiox/*.json`) para Supabase/Postgres. Single-tenant: sem `org_id` obrigatório, mas RLS por `user_id`/role onde fizer sentido (ex.: squads de um usuário). **Sem dependências — desbloqueia tudo abaixo.** Dono: `@data-engineer`.

### Epic 2 — Segurança de Credenciais de IA (M · P0 · paralelo ao Epic 1)
Fase 2 do AI Provider Control Center (`docs/architecture/api-provider-control-center.md`): mover `provider-config.json` (credenciais dos 5 providers) para Supabase com encryption-at-rest, atrás do Supabase Auth do Epic 3. Dono: `@architect` + `@data-engineer`.

### Epic 3 — Auth & Controle de Acesso (M · P0 · depende do Epic 1)
Supabase Auth (login Entrelaços), roles básicos (admin/editor/viewer), proteção de rotas `/api/*` e da UI. Dono: `@architect` + `@dev`.

### Epic 4 — Decomposição de Monólitos Frontend (L · P1 · independente)
`views/BrandingOS.tsx` (437KB) → `views/branding-os/*`, mesmo tratamento para `TrafficTeam.tsx` (87KB), `EloCut.tsx` (54KB), `CognitiveEngine.tsx` (49KB). Detalhamento em `docs/architecture/UX-IA-AND-DECOMPOSITION-REVIEW.md`. Dono: `@ux-design-expert` (plano) → `@dev` (execução por stories).

### Epic 5 — Navegação/IA em Escala (M · P1 · parcialmente dependente do Epic 4)
Reagrupar `Sidebar.tsx` por domínio funcional (6 grupos para 19 módulos). Mesmo doc de UX. Dono: `@ux-design-expert` + `@dev`.

### Epic 6 — Consolidação de Edição de Vídeo (M · P2 · requer decisão de produto)
`EditAI`/`EloCut` vs `AutoEdit` resolvem o mesmo problema (corte por silêncio/gagueira via ffmpeg) com pipelines separados. Decidir: consolidar em um único módulo, ou manter como "modo simples (AutoEdit) vs avançado (EloCut)" — explícito na UI. **Aguarda decisão de Tatiana antes de `@dev` tocar.**

### Epic 7 — Squad Manager como Orquestrador Transversal (L · P2 · depende dos Epics 1+3)
Hoje cada Studio chama `aiProviderRegistry` direto; Squads (orquestração multi-agente) ficam isolados em `SquadManager`. Avaliar permitir que qualquer Studio dispare um Squad via API unificada (ex.: "gerar calendário de conteúdo" no BrandingOS aciona um Squad em vez de uma chamada direta). Dono: `@architect` (design) → `@dev`.

### Epic 8 — Persistência para Course Creator / Design Studio / PRD Studio / Cognitive Engine (L · P1 · depende do Epic 1)
Achado durante o Epic 1 (`docs/architecture/EPIC-1-DATA-LAYER-DESIGN.md`, seção 7): esses 4 domínios têm 23 interfaces ricas confirmadas em `types.ts` — `Course`/`Module`/`Lesson`/`Persona` (`types.ts:481-521`), `DesignBrief`/`DesignArtifact`/`DesignDirection`/`DesignVariationsResult`/`DesignCritiqueScore` (`types.ts:698-737`), `Project`/`Epic`/`UserStory`/`SWOT`/`ResearchData`/`Stakeholder`/`SmartGoal`/`MoSCoWItem`/`BriefData`/`Blueprint`/`PipelineTask` (`types.ts:337-442`), `CognitiveSystem`/`InferenceEvent`/`InferenceStats` (`types.ts:543-576`) — mas **nenhum registry server-side existe**: hoje vivem só em estado de frontend, perdidos em reload/redeploy (mesmo gap do item 2.1 do assessment, sem nem o paliativo do JSON local). Escopo: "Epic 1b" — aplicar o mesmo padrão (registries + tabelas Supabase + RLS por `user_id`, reusando `supabaseClient`/helpers do Epic 1) a esses 4 domínios. Alta confiança de tipagem (todas as interfaces já confirmadas em `types.ts`), análogo em forma ao Epic 1. Dono: `@architect` (design, mesmo formato do doc do Epic 1) → `@data-engineer` (schema/migration) → `@dev` (registries + rotas `/api/*` + wiring no frontend).

## Sequenciamento Recomendado

| Fase | Epics | Observação |
|------|-------|------------|
| A — Fundação (paralelo) | Epic 1 + Epic 2 | Sem dependências externas |
| B — Acesso | Epic 3 | Depende de A (precisa de tabelas/usuários) |
| C — Frontend (paralelo a A/B) | Epic 4 + Epic 5 | Independente do backend |
| D — Decisão de produto | Epic 6 | Aguarda Tatiana; depois @architect+@dev |
| E — Orquestração | Epic 7 | Depende de A + B |
| F — Extensão de dados (paralelo a B-E) | Epic 8 | Depende de A (reusa schema/infra do Epic 1 para 4 domínios novos) |

## Decisão de Produto Pendente

**Epic 6**: consolidar `AutoEdit` + `EditAI`/`EloCut` em um único fluxo de edição de vídeo, ou manter os dois como "simples vs avançado" com posicionamento explícito na UI? Aguardando input de Tatiana — não bloqueia as Fases A-C.
