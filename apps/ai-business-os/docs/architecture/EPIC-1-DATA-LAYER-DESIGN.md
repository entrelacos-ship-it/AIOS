# Epic 1 — Camada de Dados Durável (Supabase/Postgres)

> Autor: Winston (Architect) · Data: 2026-06-12
> Escopo: schema Supabase para os registries hoje persistidos em `.aiox/*.json`, Supabase Auth (single-tenant, roles), RLS, e plano de migração sem perda de dados.
> Dono de implementação: `@data-engineer` (Dara). Migration SQL: `supabase/migrations/0001_init_business_os_schema.sql`.
> Decisão de base: single-tenant interno, confirmada com Tatiana — ver `docs/product/AI-BUSINESS-OS-ROADMAP.md`.

## 1. Princípios do design

1. **Sem `org_id`.** Um único tenant (Entrelaços). Isolamento é por `user_id` + `role` (admin/editor/viewer via Supabase Auth), não por organização.
2. **Padrão de colunas comuns** em toda tabela "pessoal": `id uuid`, `created_at`, `updated_at`, `user_id`. Mesmo onde a interface TS atual não expõe `updatedAt`/`userId` (ex.: `SquadRun`), a tabela recebe a coluna — é higiene de banco, não obriga mudança imediata no frontend.
3. **Tipagem honesta (Constitution Art. IV — No Invention).** Todas as 22 tabelas têm colunas tipadas a partir de fontes confirmadas: interfaces de `types.ts` (Squad, SquadRun, BrandManifestoRecord, BrandEditorialLineRecord, BrandVisualIdentityRecord, BrandCalendarPostRecord, CloneRecord, CloneConversation, EditAIVideoProject, AutoEditProject, AdsAuditRecord/AdsCopyRecord/AdsStrategyRecord, AIProviderConfig/AIProviderRecord/AIRoutingPolicy/AIProviderHealth, AIPromptTemplate) ou tipos exportados pelos próprios `services/*Registry.ts` (`BrandCarouselDraftRecord`, `EloCutProjectRecord`, `SlidesRecord`, `AIUsageEvent`, `InstagramConnection`/`InstagramSyncJob`). `jsonb` é usado só para arrays/estruturas aninhadas internas (`slides`, `transcription`, `scenes`, `brand_profile`, etc.), nunca como payload genérico não tipado.
4. **jsonb para arrays/estruturas aninhadas** que não precisam de query relacional no curto prazo (ex.: `agents` de um squad, `stages` de um run, `words`/`segments` de projetos de vídeo). Normalização futura é possível sem dor — ficam isolados em colunas próprias.
5. **Tabelas "globais"** (config de providers de IA, prompt templates) não são por-usuário — são config compartilhada do tenant único, com RLS por `role` em vez de `user_id`.

## 2. Inventário — Registry → Tabela

| # | Registry (`services/`) | Arquivo `.aiox/*.json` atual | Tabela(s) Supabase | Confiança no shape TS |
|---|---|---|---|---|
| 1 | `squadRegistry.ts` | `squads.json` | `squads` | Alta (lido integral) |
| 2 | `squadRunRegistry.ts` | `squad-runs.json` | `squad_runs` | Alta |
| 3 | `brandManifestoRegistry.ts` | `branding-manifestos.json` | `brand_manifestos` | Alta |
| 4 | `brandEditorialRegistry.ts` | `branding-editorial-lines.json` | `brand_editorial_lines` | Alta |
| 5 | `brandVisualIdentityRegistry.ts` | `branding-visual-identities.json` | `brand_visual_identities` | Alta (`types.ts:244-271`) |
| 6 | `brandCalendarRegistry.ts` | `branding-calendar-workspaces.json` | `brand_calendar_posts` | Alta (post), workspace key a confirmar |
| 7 | `brandCarouselDraftRegistry.ts` | `branding-carousel-drafts.json` | `brand_carousel_drafts` | Alta (`brandCarouselDraftRegistry.ts:9-52`) |
| 8 | `cloneRegistry.ts` | `clones.json` + `clone-conversations.json` | `clones`, `clone_conversations` | Alta |
| 9 | `editaiProjectRegistry.ts` | `editai-projects.json` | `editai_projects` | Alta |
| 10 | `autoEditRegistry.ts` | `auto-edit.json` | `autoedit_projects` | Alta |
| 11 | `eloCutProjectRegistry.ts` | `elocut-projects.json` | `elocut_projects` | Alta (`eloCutProjectRegistry.ts:7-29`) |
| 12 | `adsRegistry.ts` | `ads.json` | `ads_audits`, `ads_copy`, `ads_strategies` | Alta |
| 13 | `slidesRegistry.ts` | `slides-registry.json` | `slides` | Alta (`slidesRegistry.ts:4-16`) |
| 14 | `aiProviderRegistry.ts` | `provider-config.json` | `ai_provider_configs`, `ai_routing_policies` | Alta (`types.ts:145-182`) |
| 15 | `aiPromptRegistry.ts` | `agent-prompt-config.json` | `ai_prompt_templates` | Alta (`types.ts:184-214`) |
| 16 | `aiUsageRegistry.ts` | `ai-usage.json` | `ai_usage_logs` | Alta (`aiUsageRegistry.ts:5-14`) |
| 17 | `instagramScheduler.ts` | `instagram-sync.json` (+ `.key` próprio) | `instagram_accounts`, `instagram_sync_jobs` | Alta (`instagramScheduler.ts:5-51`) |

Total: **22 tabelas Supabase** (17 registries, alguns mapeando para múltiplas tabelas), todas com colunas totalmente tipadas a partir de fontes confirmadas — nenhuma usa `data jsonb` genérico.

**Fora de escopo do Epic 1** (achados durante o levantamento, ver seção 7):
- `localPluginRegistry.ts` → lê `.agents/plugins/marketplace.json`, é catálogo de plugins do filesystem, não dado de negócio do usuário. Não migra.
- Course Creator, Design Studio, PRD Studio, Cognitive Engine → `types.ts` define interfaces ricas (`Course`/`Module`/`Lesson`/`Persona`, `DesignBrief`/`DesignArtifact`, `Project`/`Epic`/`UserStory`/`SWOT`, `CognitiveSystem`/`InferenceEvent`) mas **nenhum registry server-side existe** para esses 4 domínios hoje.

## 3. Supabase Auth — Single-tenant com roles

```sql
create type public.app_role as enum ('admin', 'editor', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- Trigger `handle_new_user()` em `auth.users` cria a linha em `profiles` automaticamente com `role = 'viewer'`.
- **Bootstrap do primeiro admin**: após o primeiro signup (Tatiana), rodar manualmente:
  ```sql
  update public.profiles set role = 'admin' where id = '<uuid do primeiro usuário>';
  ```
- `editor`: acesso de leitura/escrita aos dados "pessoais" (squads, branding, etc.) e leitura das configs globais de IA.
- `admin`: tudo do `editor` + escrita em `ai_provider_configs`/`ai_prompt_templates` + bypass de RLS via `public.is_admin()` para suporte/correções.
- `viewer`: leitura apenas.

## 4. Padrão de colunas comuns + triggers

```sql
-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- helper de RLS
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
```

Toda tabela "pessoal" recebe:
```sql
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) default auth.uid(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

## 5. RLS — Template (tabelas pessoais)

Aplicado via loop `DO $$ ... $$` no migration para as 17 tabelas pessoais (ver SQL):

```sql
alter table public.<t> enable row level security;

create policy "select_own_or_admin" on public.<t>
  for select using (auth.uid() = user_id or public.is_admin());

create policy "insert_own" on public.<t>
  for insert with check (auth.uid() = user_id);

create policy "update_own_or_admin" on public.<t>
  for update using (auth.uid() = user_id or public.is_admin());

create policy "delete_own_or_admin" on public.<t>
  for delete using (auth.uid() = user_id or public.is_admin());

create trigger set_updated_at before update on public.<t>
  for each row execute function public.set_updated_at();
```

### Tabelas globais (`ai_provider_configs`, `ai_prompt_templates`)

RLS por `role`, não por `user_id`:
```sql
create policy "read_all_authenticated" on public.ai_provider_configs
  for select using (auth.role() = 'authenticated');

create policy "write_admin_only" on public.ai_provider_configs
  for all using (public.is_admin()) with check (public.is_admin());
```
(idêntico para `ai_prompt_templates`)

### `ai_usage_logs` (append-only)

```sql
alter table public.ai_usage_logs enable row level security;

create policy "insert_own" on public.ai_usage_logs
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "select_own_or_admin" on public.ai_usage_logs
  for select using (auth.uid() = user_id or public.is_admin());
```
Sem `update`/`delete` (log imutável) e sem trigger `updated_at`.

## 6. Schema por domínio (resumo — DDL completo em `supabase/migrations/0001_init_business_os_schema.sql`)

### 6.1 Squad Manager
- `squads (id, user_id, name, description, agents jsonb, created_at, updated_at)` — `agents` = `SquadAgent[]`.
- `squad_runs (id, user_id, squad_id fk→squads, squad_name, task, stages jsonb, status, current_stage_index, created_at, finished_at, updated_at)` — `status` com `check` nos 6 valores do enum TS; `stages` = `SquadStage[]`.

### 6.2 Branding OS
- `brand_manifestos (id, user_id, name, content, source_type check('uploaded_file'|'manual'|'ai'), source_file_name, created_at, updated_at)`.
- `brand_editorial_lines (id, user_id, manifesto_id fk→brand_manifestos nullable, scope_mode check('manifesto'|'blank'), blank_workspace_id, content, selected bool, source check('ai'|'manual'), created_at, updated_at)`.
- `brand_visual_identities (id, user_id, manifesto_id fk→brand_manifestos, scope_mode check('manifesto'|'blank'), blank_workspace_id, brand_name, brand_handle, brand_studio_label, instagram_page_name, instagram_username, profile_image_url, primary/secondary/accent/background/surface/text_color, title_font_family check('serif'|'sans'), body_font_family check('serif'|'sans'), title_font_size, body_font_size, visual_style, imagery_direction, layout_notes, source check('manual'|'instagram_seed'), created_at, updated_at)` — totalmente tipado, confirmado em `types.ts:244-271`.
- `brand_calendar_posts (id, user_id, workspace_id, day, format, editorial_line, theme, description, status check('Draft'|'Scheduled'|'Published'), approval_status, scheduled_at, instagram_status, image_url, created_at, updated_at)`.
- `brand_carousel_drafts (id, user_id, manifesto_id fk→brand_manifestos nullable, name, selected_asset, carousel_style_preset, selected_slide_index, packaging_editor_panel, brand_profile jsonb, slides jsonb, created_at, updated_at)` — totalmente tipado, confirmado em `brandCarouselDraftRegistry.ts:9-52`. `brand_profile` = `BrandCarouselDraftBrandProfile` (4 campos), `slides` = `BrandCarouselDraftSlideRecord[]` (21 campos por slide — editor de carrossel, não confundir com a tabela `slides` da Slides Studio em 6.6).

### 6.3 Clone Studio
- `clones (id, user_id, name, category check(5 valores), description, tags jsonb, system_prompt, validation_score, validation_tier, is_prebuilt bool, created_at, updated_at)`.
- `clone_conversations (id, user_id, clone_id fk→clones, clone_name, messages jsonb, created_at, updated_at)` — `messages` = `CloneMessage[]`.

### 6.4 Edição de Vídeo (EditAI / AutoEdit / EloCut)
- `editai_projects (id, user_id, title, source_file_name, status check(12 valores `EditAIProjectStatus`), formato_destino check('reels'|'youtube'), edit_preset check('auto'|'clean'|'kinetic'|'cinematic'), original_path, normalized_path, cut_path, render_path, fps, words jsonb, transcription text, cut_report jsonb, plan_text, plan_approved bool, template check(4 valores `EditAITemplate`), formato, paleta jsonb, scenes jsonb, render_progress, error, created_at, updated_at)` — totalmente tipado, confirmado em `types.ts:651-676`.
- `autoedit_projects (id, user_id, title, source_file_name, source_path, normalized_path, output_path, shorts_path, captions_path, stage check(10 valores `AutoEditStage`), words jsonb, transcript text, segments jsonb, metadata jsonb, include_shorts bool, error, created_at, updated_at)` — totalmente tipado, confirmado em `types.ts:945-963`.
- `elocut_projects (id, user_id, title, source_file_name, input_video_path, output_video_path, transcription jsonb, scenes jsonb, total_duration, fps, status check(6 valores `EloCutProject['status']`), render_progress, download_ready bool, error, created_at, updated_at, last_rendered_at, publication_status check(4 valores `EloCutPublicationStatus`), publication_platform, publication_url, publication_notes, published_at)` — totalmente tipado, confirmado em `eloCutProjectRegistry.ts:7-29` (status enum em `eloCutService.ts:58`).

> Nota Epic 6: nomes de tabela seguem a nomenclatura atual dos registries. Se Epic 6 consolidar EditAI/EloCut↔AutoEdit, as tabelas podem ser unificadas/migradas depois — não bloqueia Epic 1.

### 6.5 Ads Studio
- `ads_audits (id, user_id, platform, industry, monthly_spend, goal, metrics_raw jsonb, health_score, grade check('A'|'B'|'C'|'D'|'F') — `AdsHealthGrade` (`types.ts:830`), categories jsonb, quick_wins jsonb, summary, created_at, updated_at)`.
- `ads_copy (id, user_id, platform, framework, product_description, target_audience, goal, variants jsonb, created_at, updated_at)`.
- `ads_strategies (id, user_id, brand_description, goal, monthly_budget, active_platforms jsonb, concepts jsonb, budget_recommendation jsonb, created_at, updated_at)`.

### 6.6 Slides Studio
- `slides (id, user_id, title, format, input_mode, output_type, ds_brand, slide_count, html, pptx_filename, created_at, updated_at)` — totalmente tipado, confirmado em `slidesRegistry.ts:4-16` (`SlidesRecord`). Domínio separado de `SlideData`/`BrandCarouselDraftSlideRecord` (editor de carrossel da Branding OS, ver 6.2) — aqui são exports de apresentação (html/pptx) da Slides Studio.

### 6.7 AI Control Center (base do Epic 2)
- `ai_provider_configs (id text = 'groq'|'gemini'|'openai'|'anthropic'|'openrouter', label, enabled, base_url, model_defaults jsonb, capabilities jsonb, credential_status check('missing'|'configured'|'invalid'), secret_masked_key, secret_has_key, secret_updated_at, health_state/health_message/health_checked_at, updated_by, created_at, updated_at)` — totalmente tipado a partir de `AIProviderConfig`+`AIProviderSecretStatus`+`AIProviderHealth` (`types.ts:145-182`); credenciais reais ficam fora desta tabela (Epic 2 decide Vault vs `pgcrypto`).
- `ai_routing_policies (capability primary key, primary_provider fk→ai_provider_configs, fallback_order jsonb, updated_by, created_at, updated_at)` — `AIRoutingPolicy` (`types.ts:171-175`), uma linha por `AICapability`.
- `ai_prompt_templates (id text primary key check(13 `AIPromptTemplateId`), label, description, template_group check(5 valores `AIPromptTemplateGroup`), scope='branding', prompt, updated_by, created_at, updated_at)` — totalmente tipado a partir de `AIPromptTemplate` (`types.ts:184-214`); conteúdo real de `label`/`description`/`prompt` é populado pelo script de migração (seção 9), não inventado aqui.
- `ai_usage_logs (id, user_id nullable, provider_id fk→ai_provider_configs, model, capability, requested_at, prompt_tokens, completion_tokens, total_tokens, created_at)` — append-only, totalmente tipado a partir de `AIUsageEvent` (`aiUsageRegistry.ts:5-14`).

### 6.8 Instagram Scheduler
- `instagram_accounts (id, user_id unique, page_id, page_name, ig_user_id, ig_username, encrypted_page_access_token, encrypted_user_access_token, token_expires_at, connected_at, created_at, updated_at)` — totalmente tipado a partir de `InstagramConnection` (`instagramScheduler.ts:5-15`). Tokens permanecem cifrados com `instagram-sync.key` próprio até Epic 2 decidir o padrão único (ver seção 9).
- `instagram_sync_jobs (id, user_id, local_post_id fk→brand_calendar_posts nullable, caption, image_url, scheduled_at, day, format, theme, status check(4 valores `InstagramJobStatus`), attempts, created_at, updated_at, last_attempt_at, last_error, published_media_id)` — totalmente tipado a partir de `InstagramSyncJob` (`instagramScheduler.ts:29-45`). `local_post_id` referencia `brand_calendar_posts.id` por convenção de nome — confirmar com `@dev` antes de aplicar a FK em produção.

## 7. Achado adicional — gap não mapeado (Course/Design/PRD/Cognitive)

Durante o levantamento de `types.ts`, identifiquei 4 domínios com interfaces de dados ricas e nenhuma persistência server-side:

- **Course Creator**: `Course`, `Module`, `Lesson`, `Persona`, `Blueprint`, `PipelineTask`.
- **Design Studio**: `DesignBrief`, `DesignCritiqueScore`, `DesignArtifact`, `DesignDirection`, `DesignVariationsResult`.
- **PRD Studio**: `Project`, `Epic`, `UserStory`, `SWOT`, `ResearchData`, `BriefData`, `Stakeholder`, `SmartGoal`, `MoSCoWItem`.
- **Cognitive Engine**: `CognitiveSystem`, `InferenceEvent`, `InferenceStats`.

Sem registry, esses dados provavelmente vivem só em estado de frontend (perdidos em reload/redeploy) — o mesmo problema do item 2.1 do assessment, só que sem nem o paliativo do JSON local. **Recomendo a `@pm`** avaliar um novo Epic (Epic 8) para estender o mesmo padrão (Auth + common columns + RLS já estabelecidos por este Epic 1) a esses 4 domínios. Não bloqueia Epics 1-7.

## 8. Dependências de pacote

- Adicionar `@supabase/supabase-js` (`^2.x`) a `dependencies` em `package.json`.
- Criar `services/supabaseClient.ts`:
  - client server-side (Express) com `SUPABASE_SERVICE_ROLE_KEY` — bypassa RLS, usado pelos registries durante a migração e por rotas administrativas.
  - client browser-side com `SUPABASE_ANON_KEY` — respeita RLS, usado para auth (login/sessão).

## 9. Plano de migração `.aiox/*.json` → Supabase

1. **Schema**: aplicar `supabase/migrations/0001_init_business_os_schema.sql` (via `supabase db push` ou MCP `apply_migration`).
2. **Bootstrap de auth**: Tatiana cria conta via Supabase Auth (signup); promover para `admin` (seção 3).
3. **Script de migração** (`scripts/migrate-json-to-supabase.ts`, executado via CLI — `npm run migrate:supabase`, consistente com CLI First):
   - Para cada `.aiox/*.json`, ler o array do `Store` (`version` é descartado — schema agora vive no Postgres).
   - Inserir cada registro via `supabase-js` com `service_role` (bypassa RLS), atribuindo `user_id = <uuid do admin>` em todas as linhas (single-tenant — todo histórico pertence à conta operacional).
   - `instagram-sync.json`: migrar payload cifrado como está para `instagram_accounts.data`; `instagram-sync.key` permanece como está até Epic 2 unificar o padrão de criptografia.
   - `provider-config.json`/`agent-prompt-config.json`: migrar apenas campos não-sensíveis para `ai_provider_configs`/`ai_prompt_templates`; qualquer API key em texto plano **não migra** — recriada via UI após Epic 2 (Vault/`pgcrypto`).
4. **Troca de implementação dos registries**: cada `*Registry.ts` passa a usar `supabaseClient` em vez de `fs.readFile`/`writeFile`, **mantendo a mesma interface pública exportada** (funções `list*`, `get*`, `create*`, `update*`, `delete*`) — zero mudança nas rotas/UI que os consomem.
5. **Backup**: manter `.aiox/*.json` no filesystem (não deletar) por período de validação; rollback = revert do commit que troca a implementação dos registries (volta a ler dos JSON, que continuam intactos).

## 10. Relação com Epic 2

`ai_provider_configs.config` (Epic 1) guarda configuração não-sensível (modelos habilitados, políticas de roteamento, status de saúde). Credenciais (API keys dos 5 providers) ficam **fora** desta tabela — Epic 2 escolhe entre Supabase Vault (`pgsodium`) ou coluna `bytea` + `pgcrypto`. `instagram-sync.key` (já existente, cifragem própria do registry do Instagram) é o precedente de padrão a avaliar/unificar.

## 11. Próximos passos

- `@data-engineer`: revisar este doc e `supabase/migrations/0001_init_business_os_schema.sql` — as 22 tabelas estão totalmente tipadas a partir de fontes confirmadas (`types.ts` ou `services/*Registry.ts`, ver seção 2). Único ponto a confirmar com `@dev` antes de aplicar: a FK `instagram_sync_jobs.local_post_id → brand_calendar_posts.id` (inferida por convenção de nome, ver 6.8). Após validação, aplicar a migration (`supabase db push` ou MCP `apply_migration`) e seguir o plano da seção 9.
- `@architect` (eu): após schema estabilizar, Epic 3 (auth/access control na API Express + UI) e Epic 7 (Squad-as-orchestrator).
- `@pm`: achado da seção 7 avaliado — Epic 8 (persistência Course/Design/PRD/Cognitive) adicionado a `docs/product/AI-BUSINESS-OS-ROADMAP.md`.
- `@devops`: adicionar `@supabase/supabase-js` ao `package.json` e variáveis `SUPABASE_*` ao ambiente de deploy (já existem em `.env.example`).
