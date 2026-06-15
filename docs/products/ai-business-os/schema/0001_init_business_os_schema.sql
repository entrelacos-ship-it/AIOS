-- Epic 1 — Camada de Dados Durável
-- Ver docs/architecture/EPIC-1-DATA-LAYER-DESIGN.md para racional completo.
-- Single-tenant interno: sem org_id, RLS por user_id + role (admin/editor/viewer).

create extension if not exists pgcrypto;

-- ============================================================
-- 1. AUTH / PROFILES / ROLES
-- ============================================================

create type public.app_role as enum ('admin', 'editor', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'viewer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. HELPERS COMUNS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ============================================================
-- 3. SQUAD MANAGER
-- ============================================================

create table public.squads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  description text,
  agents jsonb not null default '[]'::jsonb,        -- SquadAgent[]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.squad_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  squad_id uuid references public.squads(id) on delete set null,
  squad_name text not null,
  task text not null,
  stages jsonb not null default '[]'::jsonb,        -- SquadStage[]
  status text not null default 'idle'
    check (status in ('idle','running','waiting_input','done','error','aborted')),
  current_stage_index int not null default 0,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. BRANDING OS
-- ============================================================

create table public.brand_manifestos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  content text not null default '',
  source_type text not null check (source_type in ('uploaded_file','manual','ai')),
  source_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_editorial_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  manifesto_id uuid references public.brand_manifestos(id) on delete cascade,
  scope_mode text not null check (scope_mode in ('manifesto','blank')),
  blank_workspace_id text,
  content text not null default '',
  selected boolean not null default false,
  source text not null check (source in ('ai','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- BrandVisualIdentityRecord confirmado integralmente em types.ts:244-271.
create table public.brand_visual_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  manifesto_id uuid references public.brand_manifestos(id) on delete cascade,
  scope_mode text not null check (scope_mode in ('manifesto','blank')),
  blank_workspace_id text,
  brand_name text not null default '',
  brand_handle text not null default '',
  brand_studio_label text not null default '',
  instagram_page_name text not null default '',
  instagram_username text not null default '',
  profile_image_url text not null default '',
  primary_color text not null default '',
  secondary_color text not null default '',
  accent_color text not null default '',
  background_color text not null default '',
  surface_color text not null default '',
  text_color text not null default '',
  title_font_family text not null default 'sans' check (title_font_family in ('serif','sans')),
  body_font_family text not null default 'sans' check (body_font_family in ('serif','sans')),
  title_font_size numeric not null default 0,
  body_font_size numeric not null default 0,
  visual_style text not null default '',
  imagery_direction text not null default '',
  layout_notes text not null default '',
  source text not null check (source in ('manual','instagram_seed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_calendar_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  workspace_id text,
  day text not null,
  format text not null,
  editorial_line text,
  theme text,
  description text,
  status text not null default 'Draft' check (status in ('Draft','Scheduled','Published')),
  approval_status text,
  scheduled_at timestamptz,
  instagram_status text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- BrandCarouselDraftRecord confirmado integralmente em brandCarouselDraftRegistry.ts:9-52.
create table public.brand_carousel_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  manifesto_id uuid references public.brand_manifestos(id) on delete set null,
  name text not null,
  selected_asset text not null default 'Carousel',
  carousel_style_preset text not null default 'brand-editorial',
  selected_slide_index integer not null default 0,
  packaging_editor_panel text not null default 'content',
  brand_profile jsonb not null default '{}'::jsonb,   -- BrandCarouselDraftBrandProfile
  slides jsonb not null default '[]'::jsonb,          -- BrandCarouselDraftSlideRecord[]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. CLONE STUDIO
-- ============================================================

create table public.clones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  category text not null
    check (category in ('thought_leader','copywriting','marketing','systems','custom')),
  description text,
  tags jsonb not null default '[]'::jsonb,
  system_prompt text not null,
  validation_score numeric,
  validation_tier text,
  is_prebuilt boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clone_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  clone_id uuid references public.clones(id) on delete cascade,
  clone_name text not null,
  messages jsonb not null default '[]'::jsonb,       -- CloneMessage[]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 6. EDIÇÃO DE VÍDEO (EditAI / AutoEdit / EloCut)
-- ============================================================

-- EditAIVideoProject confirmado integralmente em types.ts:651-676.
create table public.editai_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  title text not null,
  source_file_name text not null default '',
  status text not null check (status in (
    'uploading','normalizing','transcribing','cutting','awaiting_approval',
    'planning','awaiting_plan','analyzing','ready','rendering','done','error'
  )),
  formato_destino text not null check (formato_destino in ('reels','youtube')),
  edit_preset text not null default 'auto' check (edit_preset in ('auto','clean','kinetic','cinematic')),
  original_path text not null default '',
  normalized_path text not null default '',
  cut_path text not null default '',
  render_path text not null default '',
  fps numeric not null default 0,
  words jsonb not null default '[]'::jsonb,          -- EditAIWord[]
  transcription text not null default '',
  cut_report jsonb not null default '[]'::jsonb,     -- EditAICutReport[]
  plan_text text not null default '',
  plan_approved boolean not null default false,
  template text check (template in ('dicas-rapidas','aula-teorica','caso-historia','aula-longa')),
  formato text not null default '',
  paleta jsonb,                                       -- EditAIPalette {primaria,secundaria,acento,texto} | null
  scenes jsonb not null default '[]'::jsonb,         -- EditAIScene[]
  render_progress numeric not null default 0,
  error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AutoEditProject confirmado integralmente em types.ts:945-963.
create table public.autoedit_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  title text not null,
  source_file_name text not null default '',
  source_path text not null default '',
  normalized_path text not null default '',
  output_path text not null default '',
  shorts_path text not null default '',
  captions_path text not null default '',
  stage text not null default 'idle' check (stage in (
    'idle','normalizing','transcribing','planning','cutting','captioning','metadata','shorts','done','error'
  )),
  words jsonb not null default '[]'::jsonb,          -- AutoEditWord[]
  transcript text not null default '',
  segments jsonb not null default '[]'::jsonb,       -- AutoEditSegment[]
  metadata jsonb,                                     -- AutoEditMetadata | null
  include_shorts boolean not null default false,
  error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EloCutProjectRecord confirmado integralmente em eloCutProjectRegistry.ts:7-29
-- (status: EloCutProject['status'] em eloCutService.ts:58).
create table public.elocut_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  title text not null,
  source_file_name text not null default '',
  input_video_path text not null default '',
  output_video_path text not null default '',
  transcription jsonb not null default '[]'::jsonb,   -- TranscriptionSegment[]
  scenes jsonb not null default '[]'::jsonb,          -- EloCutScene[]
  total_duration numeric not null default 0,
  fps numeric not null default 0,
  status text not null default 'pending'
    check (status in ('pending','transcribing','analyzing','rendering','complete','error')),
  render_progress numeric not null default 0,
  download_ready boolean not null default false,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_rendered_at timestamptz,
  publication_status text not null default 'draft'
    check (publication_status in ('draft','rendered','scheduled','published')),
  publication_platform text not null default '',
  publication_url text not null default '',
  publication_notes text not null default '',
  published_at timestamptz
);

-- ============================================================
-- 7. ADS STUDIO
-- ============================================================

create table public.ads_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  platform text not null,
  industry text,
  monthly_spend numeric,
  goal text,
  metrics_raw jsonb,
  health_score numeric,
  grade text not null check (grade in ('A','B','C','D','F')),  -- AdsHealthGrade (types.ts:830)
  categories jsonb not null default '[]'::jsonb,
  quick_wins jsonb not null default '[]'::jsonb,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ads_copy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  platform text not null,
  framework text,
  product_description text,
  target_audience text,
  goal text,
  variants jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ads_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  brand_description text,
  goal text,
  monthly_budget numeric,
  active_platforms jsonb not null default '[]'::jsonb,
  concepts jsonb not null default '[]'::jsonb,       -- AdsCampaignConcept[]
  budget_recommendation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 8. SLIDES STUDIO
-- ============================================================

-- SlidesRecord confirmado integralmente em slidesRegistry.ts:4-16.
create table public.slides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  title text not null default 'Sem título',
  format text not null,
  input_mode text not null,
  output_type text not null,
  ds_brand text not null,
  slide_count integer not null default 0,
  html text,
  pptx_filename text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 9. INSTAGRAM SCHEDULER
-- ============================================================

-- InstagramConnection confirmado integralmente em instagramScheduler.ts:5-15.
-- Tokens permanecem cifrados com instagram-sync.key (mesmo padrão atual);
-- Epic 2 decide se migra para Vault/pgcrypto unificado.
create table public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) default auth.uid(),
  page_id text not null,
  page_name text not null,
  ig_user_id text not null,
  ig_username text not null,
  encrypted_page_access_token text not null,
  encrypted_user_access_token text not null,
  token_expires_at timestamptz,
  connected_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- InstagramSyncJob confirmado integralmente em instagramScheduler.ts:29-45.
-- local_post_id referencia brand_calendar_posts.id por convenção de nome (confirmar com @dev).
create table public.instagram_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  local_post_id uuid references public.brand_calendar_posts(id) on delete set null,
  caption text not null,
  image_url text not null,
  scheduled_at timestamptz not null,
  day text not null,
  format text not null,
  theme text not null,
  status text not null default 'queued'
    check (status in ('queued','processing','published','error')),
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  last_error text,
  published_media_id text
);

-- ============================================================
-- 10. AI CONTROL CENTER (base do Epic 2) — tabelas globais
-- ============================================================

-- AIProviderConfig/AIProviderSecretStatus/AIProviderHealth confirmados em types.ts:145-182.
-- id = AIProviderId ('groq'|'gemini'|'openai'|'anthropic'|'openrouter').
create table public.ai_provider_configs (
  id text primary key,
  label text not null,
  enabled boolean not null default false,
  base_url text,
  model_defaults jsonb not null default '{}'::jsonb,   -- Partial<Record<AICapability,string>>
  capabilities jsonb not null default '{}'::jsonb,     -- Record<AICapability,boolean>
  credential_status text not null default 'missing'
    check (credential_status in ('missing','configured','invalid')),
  secret_masked_key text,                              -- AIProviderSecretStatus.maskedKey (mascarado; segredo real fica fora desta tabela — Epic 2)
  secret_has_key boolean not null default false,
  secret_updated_at timestamptz,
  health_state text check (health_state in ('unknown','healthy','degraded','disabled','missing_credentials','error')),
  health_message text,
  health_checked_at timestamptz,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AIRoutingPolicy confirmado em types.ts:171-175 — uma policy por AICapability.
create table public.ai_routing_policies (
  capability text primary key,
  primary_provider text references public.ai_provider_configs(id),
  fallback_order jsonb not null default '[]'::jsonb,   -- AIProviderId[]
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AIPromptTemplate confirmado em types.ts:184-214. id = um dos 13 AIPromptTemplateId.
-- Seed real (label/description/prompt) é feito pelo script de migração (seção 9 do
-- design doc), lendo agent-prompt-config.json — não inventamos conteúdo de prompt aqui.
create table public.ai_prompt_templates (
  id text primary key check (id in (
    'branding_manifesto_agent','branding_editorial_manifesto','branding_editorial_blank',
    'branding_content_calendar','branding_format_prompt_default','branding_format_prompt_carousel',
    'branding_format_prompt_ads','branding_format_prompt_post','branding_format_prompt_slide',
    'branding_content_generation_carousel','branding_content_generation_ads',
    'branding_content_generation_post','branding_content_generation_slide'
  )),
  label text not null default '',
  description text not null default '',
  template_group text not null check (template_group in ('manifesto','editorial','calendar','format_prompt','content_generation')),
  scope text not null default 'branding' check (scope = 'branding'),
  prompt text not null default '',
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AIUsageEvent confirmado integralmente em aiUsageRegistry.ts:5-14.
create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  provider_id text not null references public.ai_provider_configs(id),  -- AIProviderId
  model text not null,
  capability text not null,
  requested_at timestamptz not null,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 11. RLS — tabelas pessoais (user_id-owned)
-- ============================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'squads', 'squad_runs',
    'brand_manifestos', 'brand_editorial_lines', 'brand_visual_identities',
    'brand_calendar_posts', 'brand_carousel_drafts',
    'clones', 'clone_conversations',
    'editai_projects', 'autoedit_projects', 'elocut_projects',
    'ads_audits', 'ads_copy', 'ads_strategies',
    'slides', 'instagram_accounts', 'instagram_sync_jobs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "select_own_or_admin" on public.%I for select using (auth.uid() = user_id or public.is_admin())', t
    );
    execute format(
      'create policy "insert_own" on public.%I for insert with check (auth.uid() = user_id)', t
    );
    execute format(
      'create policy "update_own_or_admin" on public.%I for update using (auth.uid() = user_id or public.is_admin())', t
    );
    execute format(
      'create policy "delete_own_or_admin" on public.%I for delete using (auth.uid() = user_id or public.is_admin())', t
    );

    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t
    );
  end loop;
end $$;

-- ============================================================
-- 12. RLS — tabelas globais (role-based)
-- ============================================================

do $$
declare
  t text;
begin
  foreach t in array array['ai_provider_configs', 'ai_prompt_templates', 'ai_routing_policies']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "read_all_authenticated" on public.%I for select using (auth.role() = ''authenticated'')', t
    );
    execute format(
      'create policy "write_admin_only" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t
    );

    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t
    );
  end loop;
end $$;

-- ============================================================
-- 13. RLS — ai_usage_logs (append-only)
-- ============================================================

alter table public.ai_usage_logs enable row level security;

create policy "insert_own" on public.ai_usage_logs
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "select_own_or_admin" on public.ai_usage_logs
  for select using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- 14. RLS — profiles
-- ============================================================

alter table public.profiles enable row level security;

create policy "select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
