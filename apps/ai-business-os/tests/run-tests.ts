import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { View } from '../types';
import { resolveBrandingStepFromView, resolveBrandingViewFromStep } from '../views/brandosStepView';

const repoRoot = process.cwd();
const tempRoot = path.join(repoRoot, '.tmp-tests');

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

const importFresh = async <T>(relativePath: string): Promise<T> => {
  const moduleUrl = `${pathToFileURL(path.join(repoRoot, relativePath)).href}?t=${Date.now()}-${Math.random()}`;
  return import(moduleUrl) as Promise<T>;
};

const withTempCwd = async (name: string, run: (cwd: string) => Promise<void>) => {
  await fs.mkdir(tempRoot, { recursive: true });
  const originalCwd = process.cwd();
  const sandbox = await fs.mkdtemp(path.join(tempRoot, `${name}-`));

  process.chdir(sandbox);
  try {
    await run(sandbox);
  } finally {
    process.chdir(originalCwd);
    await fs.rm(sandbox, { recursive: true, force: true });
  }
};

const tests: TestCase[] = [
  {
    name: 'view-step mapping stays synchronized',
    run: () => {
      assert.equal(resolveBrandingStepFromView(View.BRANDING_OS_MANIFESTO), 0);
      assert.equal(resolveBrandingStepFromView(View.BRANDING_OS_CALENDAR), 2);
      assert.equal(resolveBrandingStepFromView(View.BRANDING_OS_EXPORT), 8);
      assert.equal(resolveBrandingStepFromView(View.BRANDING_OS), 0);
      assert.equal(resolveBrandingViewFromStep(0), View.BRANDING_OS_MANIFESTO);
      assert.equal(resolveBrandingViewFromStep(3), View.BRANDING_OS_ASSET);
      assert.equal(resolveBrandingViewFromStep(8), View.BRANDING_OS_EXPORT);
    },
  },
  {
    name: 'manifesto registry creates, updates, lists and deletes records',
    run: async () => {
      await withTempCwd('manifesto', async () => {
        const registry = await importFresh<typeof import('../services/brandManifestoRegistry')>('services/brandManifestoRegistry.ts');

        const created = await registry.createBrandManifesto({
          name: 'Manifesto QA',
          content: 'Conteudo QA',
          sourceType: 'manual',
        });
        const listed = await registry.listBrandManifestos();

        assert.equal(listed.length, 1);
        assert.equal(listed[0].id, created.id);

        const updated = await registry.updateBrandManifesto(created.id, {
          name: 'Manifesto QA Atualizado',
          content: 'Conteudo QA Atualizado',
        });

        assert.equal(updated.name, 'Manifesto QA Atualizado');
        assert.equal(updated.content, 'Conteudo QA Atualizado');

        await registry.deleteBrandManifesto(created.id);
        const empty = await registry.listBrandManifestos();
        assert.equal(empty.length, 0);
      });
    },
  },
  {
    name: 'manifesto registry surfaces corrupted store files instead of silently resetting',
    run: async () => {
      await withTempCwd('manifesto-corrupted', async (cwd) => {
        const aioxDir = path.join(cwd, '.aiox');
        await fs.mkdir(aioxDir, { recursive: true });
        await fs.writeFile(path.join(aioxDir, 'branding-manifestos.json'), '{invalid-json', 'utf8');

        const registry = await importFresh<typeof import('../services/brandManifestoRegistry')>('services/brandManifestoRegistry.ts');
        await assert.rejects(() => registry.listBrandManifestos(), /Brand manifesto store is corrupted or unreadable\./);
      });
    },
  },
  {
    name: 'editorial registry isolates manifesto and blank scopes',
    run: async () => {
      await withTempCwd('editorial', async () => {
        const registry = await importFresh<typeof import('../services/brandEditorialRegistry')>('services/brandEditorialRegistry.ts');

        const manifestoLines = await registry.replaceBrandEditorialLines({
          manifestoId: 'manifesto-1',
          scopeMode: 'manifesto',
          lines: [
            { content: 'Linha 1', selected: true, source: 'manual' },
            { content: 'Linha 2', selected: false, source: 'ai' },
          ],
        });

        const blankLines = await registry.replaceBrandEditorialLines({
          manifestoId: null,
          scopeMode: 'blank',
          lines: [{ content: 'Linha blank', selected: true, source: 'manual' }],
        });

        assert.equal(manifestoLines.length, 2);
        assert.equal(blankLines.length, 1);

        const loadedManifesto = await registry.listBrandEditorialLines({
          manifestoId: 'manifesto-1',
          scopeMode: 'manifesto',
        });
        const loadedBlank = await registry.listBrandEditorialLines({
          manifestoId: null,
          scopeMode: 'blank',
        });

        assert.equal(loadedManifesto.length, 2);
        assert.equal(loadedBlank.length, 1);

        await registry.deleteBrandEditorialLinesByManifesto('manifesto-1');
        const deletedManifesto = await registry.listBrandEditorialLines({
          manifestoId: 'manifesto-1',
          scopeMode: 'manifesto',
        });

        assert.equal(deletedManifesto.length, 0);
      });
    },
  },
  {
    name: 'editorial registry isolates two distinct blank workspaceIds',
    run: async () => {
      await withTempCwd('editorial-blank-isolation', async () => {
        const registry = await importFresh<typeof import('../services/brandEditorialRegistry')>('services/brandEditorialRegistry.ts');

        await registry.replaceBrandEditorialLines({
          manifestoId: null,
          scopeMode: 'blank',
          blankWorkspaceId: 'workspace-a',
          lines: [{ content: 'Linha de Brand A', selected: true, source: 'manual' }],
        });

        await registry.replaceBrandEditorialLines({
          manifestoId: null,
          scopeMode: 'blank',
          blankWorkspaceId: 'workspace-b',
          lines: [
            { content: 'Linha de Brand B 1', selected: true, source: 'ai' },
            { content: 'Linha de Brand B 2', selected: false, source: 'manual' },
          ],
        });

        const loadedA = await registry.listBrandEditorialLines({
          manifestoId: null,
          scopeMode: 'blank',
          blankWorkspaceId: 'workspace-a',
        });

        const loadedB = await registry.listBrandEditorialLines({
          manifestoId: null,
          scopeMode: 'blank',
          blankWorkspaceId: 'workspace-b',
        });

        assert.equal(loadedA.length, 1);
        assert.equal(loadedA[0].content, 'Linha de Brand A');
        assert.equal(loadedB.length, 2);
        assert.equal(loadedB[0].content, 'Linha de Brand B 1');
      });
    },
  },
  {
    name: 'editorial registry blank legacy records (no workspaceId) remain accessible',
    run: async () => {
      await withTempCwd('editorial-blank-legacy', async () => {
        const registry = await importFresh<typeof import('../services/brandEditorialRegistry')>('services/brandEditorialRegistry.ts');

        await registry.replaceBrandEditorialLines({
          manifestoId: null,
          scopeMode: 'blank',
          lines: [{ content: 'Linha legacy sem workspaceId', selected: true, source: 'manual' }],
        });

        const loaded = await registry.listBrandEditorialLines({
          manifestoId: null,
          scopeMode: 'blank',
        });

        assert.equal(loaded.length, 1);
        assert.equal(loaded[0].content, 'Linha legacy sem workspaceId');
      });
    },
  },
  {
    name: 'calendar registry isolates two distinct blank workspaceIds',
    run: async () => {
      await withTempCwd('calendar-blank-isolation', async () => {
        const registry = await importFresh<typeof import('../services/brandCalendarRegistry')>('services/brandCalendarRegistry.ts');

        await registry.replaceBrandCalendarWorkspace({
          manifestoId: null,
          scopeMode: 'blank',
          blankWorkspaceId: 'ws-calendar-a',
          posts: [{
            id: 'post-a',
            day: '2026-05-01',
            format: 'Post',
            editorialLine: 'Linha A',
            theme: 'Tema A',
            description: 'Desc A',
            status: 'Draft',
            approvalStatus: 'Needs Review',
            scheduledAt: '',
            imageUrl: '',
            instagramStatus: 'Not Synced',
          }],
        });

        await registry.replaceBrandCalendarWorkspace({
          manifestoId: null,
          scopeMode: 'blank',
          blankWorkspaceId: 'ws-calendar-b',
          posts: [{
            id: 'post-b',
            day: '2026-05-02',
            format: 'Reels',
            editorialLine: 'Linha B',
            theme: 'Tema B',
            description: 'Desc B',
            status: 'Draft',
            approvalStatus: 'Needs Review',
            scheduledAt: '',
            imageUrl: '',
            instagramStatus: 'Not Synced',
          }],
        });

        const loadedA = await registry.listBrandCalendarWorkspace({
          manifestoId: null,
          scopeMode: 'blank',
          blankWorkspaceId: 'ws-calendar-a',
        });

        const loadedB = await registry.listBrandCalendarWorkspace({
          manifestoId: null,
          scopeMode: 'blank',
          blankWorkspaceId: 'ws-calendar-b',
        });

        assert.equal(loadedA.length, 1);
        assert.equal(loadedA[0].theme, 'Tema A');
        assert.equal(loadedB.length, 1);
        assert.equal(loadedB[0].theme, 'Tema B');
      });
    },
  },
  {
    name: 'calendar registry persists workspaces by scope',
    run: async () => {
      await withTempCwd('calendar', async () => {
        const registry = await importFresh<typeof import('../services/brandCalendarRegistry')>('services/brandCalendarRegistry.ts');

        const savedManifestoPosts = await registry.replaceBrandCalendarWorkspace({
          manifestoId: 'manifesto-calendar',
          scopeMode: 'manifesto',
          posts: [
            {
              id: 'post-1',
              day: '2026-04-20',
              format: 'Post de Instagram',
              editorialLine: 'Linha 1',
              theme: 'Tema 1',
              description: 'Descricao 1',
              status: 'Draft',
              approvalStatus: 'Needs Review',
              scheduledAt: '',
              instagramStatus: 'Not Synced',
              imageUrl: '',
            },
          ],
        });

        const savedBlankPosts = await registry.replaceBrandCalendarWorkspace({
          manifestoId: null,
          scopeMode: 'blank',
          posts: [
            {
              id: 'post-blank',
              day: '2026-04-21',
              format: 'Carousel',
              editorialLine: '',
              theme: 'Tema blank',
              description: 'Descricao blank',
              status: 'Scheduled',
              approvalStatus: 'Approved',
              scheduledAt: '2026-04-21T09:00',
              instagramStatus: 'Ready',
              imageUrl: 'https://example.com/image.png',
            },
          ],
        });

        assert.equal(savedManifestoPosts.length, 1);
        assert.equal(savedBlankPosts.length, 1);

        const loadedManifestoPosts = await registry.listBrandCalendarWorkspace({
          manifestoId: 'manifesto-calendar',
          scopeMode: 'manifesto',
        });
        const loadedBlankPosts = await registry.listBrandCalendarWorkspace({
          manifestoId: null,
          scopeMode: 'blank',
        });

        assert.equal(loadedManifestoPosts.length, 1);
        assert.equal(loadedBlankPosts.length, 1);

        await registry.deleteBrandCalendarWorkspaceByManifesto('manifesto-calendar');
        const deletedManifestoPosts = await registry.listBrandCalendarWorkspace({
          manifestoId: 'manifesto-calendar',
          scopeMode: 'manifesto',
        });

        assert.equal(deletedManifestoPosts.length, 0);
      });
    },
  },
  {
    name: 'visual identity registry validates manifesto scope and clamps values',
    run: async () => {
      await withTempCwd('identity', async () => {
        const registry = await importFresh<typeof import('../services/brandVisualIdentityRegistry')>('services/brandVisualIdentityRegistry.ts');

        await assert.rejects(
          () => registry.upsertBrandVisualIdentity({
            manifestoId: null,
            scopeMode: 'manifesto',
            brandName: 'Marca',
            brandHandle: '@marca',
          }),
          /manifestoId is required for manifesto scope\./,
        );

        const saved = await registry.upsertBrandVisualIdentity({
          manifestoId: 'manifesto-2',
          scopeMode: 'manifesto',
          brandName: 'Marca QA',
          brandHandle: '@marcaqa',
          titleFontSize: 300,
          bodyFontSize: 1,
          primaryColor: 'invalid-color',
        });

        assert.equal(saved.brandName, 'Marca QA');
        assert.equal(saved.brandHandle, '@marcaqa');
        assert.equal(saved.titleFontSize, 96);
        assert.equal(saved.bodyFontSize, 20);
        assert.equal(saved.primaryColor, '#9900ff');

        const loaded = await registry.getBrandVisualIdentity({
          manifestoId: 'manifesto-2',
          scopeMode: 'manifesto',
        });

        assert.ok(loaded);
        assert.equal(loaded?.brandName, 'Marca QA');
      });
    },
  },
  {
    name: 'carousel draft registry performs CRUD and normalizes slide payloads',
    run: async () => {
      await withTempCwd('drafts', async () => {
        const registry = await importFresh<typeof import('../services/brandCarouselDraftRegistry')>('services/brandCarouselDraftRegistry.ts');

        const created = await registry.createBrandCarouselDraft({
          name: 'Draft QA',
          manifestoId: 'manifesto-3',
          slides: [
            {
              title: 'Slide 1',
              body: 'Body 1',
              visualPrompt: 'Prompt 1',
              titleFontSize: 999,
              bodyFontSize: 1,
            },
          ],
        });

        assert.equal(created.slides.length, 1);
        assert.equal(created.slides[0].titleFontSize, 120);
        assert.equal(created.slides[0].bodyFontSize, 20);

        const loaded = await registry.getBrandCarouselDraft(created.id);
        assert.equal(loaded.name, 'Draft QA');

        const updated = await registry.updateBrandCarouselDraft(created.id, {
          name: 'Draft QA Atualizado',
        });
        assert.equal(updated.name, 'Draft QA Atualizado');

        await registry.deleteBrandCarouselDraft(created.id);
        await assert.rejects(() => registry.getBrandCarouselDraft(created.id), /Carousel draft not found\./);
      });
    },
  },
  {
    name: 'shared branding slide markup covers all BrandOS templates',
    run: async () => {
      const premiumSlides = await importFresh<typeof import('../shared/brandingPremiumSlides')>('shared/brandingPremiumSlides.ts');

      for (const templateId of premiumSlides.SUPPORTED_BRANDING_HTML_TEMPLATE_IDS) {
        const html = premiumSlides.buildPremiumBrandingSlideMarkup({
          templateId,
          title: `Template ${templateId}`,
          body: 'Linha 1\nLinha 2\nLinha 3',
          brandName: 'Entrelaços',
          brandHandle: '@entrelacos',
        });

        assert.ok(html, `expected HTML for template ${templateId}`);
        assert.match(html, /<!doctype html>/i);
        assert.match(html, new RegExp(`Template ${templateId}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }

      const unsupportedHtml = premiumSlides.buildPremiumBrandingSlideMarkup({
        templateId: 'unknown-template',
        title: 'Legacy',
        body: 'Legacy body',
      });

      assert.equal(unsupportedHtml, null);
      assert.equal(premiumSlides.getBrandingTypographyGuide('entrelacos-premium-cover').bodyMin, 34);
      assert.equal(premiumSlides.getBrandingTypographyGuide('story').captionMin, 20);
    },
  },
  {
    name: 'local plugin registry discovers repo marketplace and bundled skills',
    run: async () => {
      await withTempCwd('plugins', async (cwd) => {
        await fs.mkdir(path.join(cwd, '.agents', 'plugins'), { recursive: true });
        await fs.mkdir(path.join(cwd, 'plugins', 'branding-os', '.codex-plugin'), { recursive: true });
        await fs.mkdir(path.join(cwd, 'plugins', 'branding-os', 'skills', 'slide-creator', 'agents'), { recursive: true });

        await fs.writeFile(path.join(cwd, '.agents', 'plugins', 'marketplace.json'), JSON.stringify({
          plugins: [
            {
              name: 'branding-os',
              source: {
                source: 'local',
                path: './plugins/branding-os',
              },
              category: 'Design',
            },
          ],
        }, null, 2), 'utf8');

        await fs.writeFile(path.join(cwd, 'plugins', 'branding-os', '.codex-plugin', 'plugin.json'), JSON.stringify({
          name: 'branding-os',
          skills: './skills/',
          interface: {
            displayName: 'BrandingOS',
            shortDescription: 'Slides',
            longDescription: 'Branding skillset',
          },
        }, null, 2), 'utf8');

        await fs.writeFile(path.join(cwd, 'plugins', 'branding-os', 'skills', 'slide-creator', 'SKILL.md'), `---
name: slide-creator
description: Create branded slides.
---

# Slide Creator
`, 'utf8');

        await fs.writeFile(path.join(cwd, 'plugins', 'branding-os', 'skills', 'slide-creator', 'agents', 'openai.yaml'), `interface:
  display_name: "BrandingOS Slide Creator"
  short_description: "Create branded slides"
  default_prompt: "Use $slide-creator to render slides."
`, 'utf8');

        const registry = await importFresh<typeof import('../services/localPluginRegistry')>('services/localPluginRegistry.ts');
        const plugins = await registry.listLocalPlugins();

        assert.equal(plugins.length, 1);
        assert.equal(plugins[0].name, 'branding-os');
        assert.equal(plugins[0].skills.length, 1);
        assert.equal(plugins[0].skills[0].name, 'slide-creator');
        assert.equal(plugins[0].skills[0].defaultPrompt, 'Use $slide-creator to render slides.');
      });
    },
  },
  {
    name: 'branding API endpoints support create, read, update and delete flows',
    run: async () => {
      await withTempCwd('branding-api', async () => {
        process.env['NODE_ENV'] = 'production';
        process.env['BRANDING_OS_SKIP_AUTO_START'] = '1';

        await fs.mkdir(path.join(process.cwd(), '.agents', 'plugins'), { recursive: true });
        await fs.mkdir(path.join(process.cwd(), 'plugins', 'branding-os', '.codex-plugin'), { recursive: true });
        await fs.mkdir(path.join(process.cwd(), 'plugins', 'branding-os', 'skills', 'slide-creator', 'agents'), { recursive: true });

        await fs.writeFile(path.join(process.cwd(), '.agents', 'plugins', 'marketplace.json'), JSON.stringify({
          plugins: [
            {
              name: 'branding-os',
              source: {
                source: 'local',
                path: './plugins/branding-os',
              },
              category: 'Design',
            },
          ],
        }, null, 2), 'utf8');

        await fs.writeFile(path.join(process.cwd(), 'plugins', 'branding-os', '.codex-plugin', 'plugin.json'), JSON.stringify({
          name: 'branding-os',
          skills: './skills/',
          interface: {
            displayName: 'BrandingOS',
            shortDescription: 'Slides',
            longDescription: 'Branding skillset',
          },
        }, null, 2), 'utf8');

        await fs.writeFile(path.join(process.cwd(), 'plugins', 'branding-os', 'skills', 'slide-creator', 'SKILL.md'), `---
name: slide-creator
description: Create branded slides.
---

# Slide Creator
`, 'utf8');

        await fs.writeFile(path.join(process.cwd(), 'plugins', 'branding-os', 'skills', 'slide-creator', 'agents', 'openai.yaml'), `interface:
  display_name: "BrandingOS Slide Creator"
  short_description: "Create branded slides"
  default_prompt: "Use $slide-creator to render slides."
`, 'utf8');

        const { startServer } = await importFresh<typeof import('../server')>('server.ts');
        const server = await startServer({
          port: 0,
          host: '127.0.0.1',
          includeVite: false,
          startSchedulers: false,
        });

        const address = server.address() as AddressInfo;
        const baseUrl = `http://127.0.0.1:${address.port}`;

        try {
          const createManifestoResponse = await fetch(`${baseUrl}/api/branding/manifestos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Manifesto API',
              content: 'Conteudo via API',
              sourceType: 'manual',
            }),
          });
          assert.equal(createManifestoResponse.status, 201);
          const manifesto = await createManifestoResponse.json() as { id: string; name: string };
          assert.ok(manifesto.id);

          const listManifestosResponse = await fetch(`${baseUrl}/api/branding/manifestos`);
          assert.equal(listManifestosResponse.status, 200);
          const manifestosPayload = await listManifestosResponse.json() as { manifestos: Array<{ id: string }> };
          assert.equal(manifestosPayload.manifestos.length, 1);

          const visualIdentityResponse = await fetch(`${baseUrl}/api/branding/visual-identity`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              manifestoId: manifesto.id,
              scopeMode: 'manifesto',
              brandName: 'Marca API',
              brandHandle: '@marcaapi',
            }),
          });
          assert.equal(visualIdentityResponse.status, 200);

          const editorialResponse = await fetch(`${baseUrl}/api/branding/editorial-lines`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              manifestoId: manifesto.id,
              scopeMode: 'manifesto',
              lines: [
                { content: 'Linha A', selected: true, source: 'manual' },
                { content: 'Linha B', selected: false, source: 'ai' },
              ],
            }),
          });
          assert.equal(editorialResponse.status, 200);

          const calendarResponse = await fetch(`${baseUrl}/api/branding/calendar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              manifestoId: manifesto.id,
              scopeMode: 'manifesto',
              posts: [
                {
                  id: 'calendar-1',
                  day: '2026-04-20',
                  format: 'Post',
                  editorialLine: 'Linha A',
                  theme: 'Tema A',
                  description: 'Descricao A',
                  status: 'Draft',
                  approvalStatus: 'Needs Review',
                  scheduledAt: '',
                  instagramStatus: 'Not Synced',
                  imageUrl: '',
                },
              ],
            }),
          });
          assert.equal(calendarResponse.status, 200);

          const getCalendarResponse = await fetch(`${baseUrl}/api/branding/calendar?scopeMode=manifesto&manifestoId=${manifesto.id}`);
          assert.equal(getCalendarResponse.status, 200);
          const calendarPayload = await getCalendarResponse.json() as { posts: Array<{ id: string }> };
          assert.equal(calendarPayload.posts.length, 1);

          const createDraftResponse = await fetch(`${baseUrl}/api/branding/carousel-drafts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Draft API',
              manifestoId: manifesto.id,
              slides: [{ title: 'Slide 1', body: 'Body 1', visualPrompt: 'Prompt 1' }],
            }),
          });
          assert.equal(createDraftResponse.status, 201);
          const draft = await createDraftResponse.json() as { id: string };
          assert.ok(draft.id);

          const getDraftResponse = await fetch(`${baseUrl}/api/branding/carousel-drafts/${draft.id}`);
          assert.equal(getDraftResponse.status, 200);

          const localPluginsResponse = await fetch(`${baseUrl}/api/plugins/local`);
          assert.equal(localPluginsResponse.status, 200);
          const localPluginsPayload = await localPluginsResponse.json() as { plugins: Array<{ name: string; skills: Array<{ name: string }> }> };
          assert.equal(localPluginsPayload.plugins.length, 1);
          assert.equal(localPluginsPayload.plugins[0].name, 'branding-os');
          assert.equal(localPluginsPayload.plugins[0].skills[0].name, 'slide-creator');

          const deleteManifestoResponse = await fetch(`${baseUrl}/api/branding/manifestos/${manifesto.id}`, {
            method: 'DELETE',
          });
          assert.equal(deleteManifestoResponse.status, 204);

          const getEditorialAfterDelete = await fetch(`${baseUrl}/api/branding/editorial-lines?scopeMode=manifesto&manifestoId=${manifesto.id}`);
          assert.equal(getEditorialAfterDelete.status, 200);
          const editorialPayload = await getEditorialAfterDelete.json() as { editorialLines: unknown[] };
          assert.equal(editorialPayload.editorialLines.length, 0);

          const getIdentityAfterDelete = await fetch(`${baseUrl}/api/branding/visual-identity?scopeMode=manifesto&manifestoId=${manifesto.id}`);
          assert.equal(getIdentityAfterDelete.status, 200);
          const identityPayload = await getIdentityAfterDelete.json() as { visualIdentity: unknown | null };
          assert.equal(identityPayload.visualIdentity, null);

          const getCalendarAfterDelete = await fetch(`${baseUrl}/api/branding/calendar?scopeMode=manifesto&manifestoId=${manifesto.id}`);
          assert.equal(getCalendarAfterDelete.status, 200);
          const calendarAfterDeletePayload = await getCalendarAfterDelete.json() as { posts: unknown[] };
          assert.equal(calendarAfterDeletePayload.posts.length, 0);

          const invalidResponse = await fetch(`${baseUrl}/api/branding/visual-identity?scopeMode=manifesto`);
          assert.equal(invalidResponse.status, 400);
        } finally {
          await new Promise<void>((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          });
        }
      });
    },
  },
  // ── EditAI: Word Index ───────────────────────────────────────────────────────
  {
    name: 'editai/wordIndex: reindexWordsAfterCut removes words inside cut and shifts timestamps',
    run: async () => {
      const { reindexWordsAfterCut } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const words = [
        { index: 0, word: 'Hoje', start: 0.0, end: 0.5 },
        { index: 1, word: 'eu', start: 0.6, end: 0.9 },   // inside cut
        { index: 2, word: 'quero', start: 2.5, end: 3.0 },
        { index: 3, word: 'falar', start: 3.1, end: 3.5 },
      ];
      const cuts = [{ tipo: 'silencio' as const, inicio: 0.55, fim: 2.4, duracao: 999, preview: '', aprovado: true }];

      const result = reindexWordsAfterCut(words, cuts);

      assert.equal(result.length, 3, 'word inside cut removed');
      assert.equal(result[0].index, 0, 'word[0] index immutable');
      assert.equal(result[1].index, 2, 'word[2] index immutable after removal');
      assert.equal(result[2].index, 3, 'word[3] index immutable');
      // 2.5 - (2.4 - 0.55) = 2.5 - 1.85 = 0.65
      assert.ok(Math.abs(result[1].start - 0.65) < 0.001, `word[2].start shifted correctly (got ${result[1].start})`);
      assert.ok(Math.abs(result[1].end - 1.15) < 0.001, `word[2].end shifted correctly (got ${result[1].end})`);
    },
  },
  {
    name: 'editai/wordIndex: aprovado=false cuts are ignored',
    run: async () => {
      const { reindexWordsAfterCut } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const words = [
        { index: 0, word: 'A', start: 0.0, end: 0.5 },
        { index: 1, word: 'B', start: 2.0, end: 2.5 },
      ];
      const cuts = [{ tipo: 'silencio' as const, inicio: 0.5, fim: 1.9, duracao: 1.4, preview: '', aprovado: false }];

      const result = reindexWordsAfterCut(words, cuts);
      assert.equal(result.length, 2, 'no words removed when cut not approved');
      assert.ok(Math.abs(result[1].start - 2.0) < 0.001, 'timestamps unchanged when cut not approved');
    },
  },
  {
    name: 'editai/wordIndex: empty input returns empty',
    run: async () => {
      const { reindexWordsAfterCut } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');
      assert.deepEqual(reindexWordsAfterCut([], []), []);
      assert.deepEqual(reindexWordsAfterCut([{ index: 0, word: 'A', start: 0, end: 0.5 }], []), [{ index: 0, word: 'A', start: 0, end: 0.5 }]);
    },
  },
  {
    name: 'editai/wordIndex: F1 fix — uses fim-inicio not duracao for shift',
    run: async () => {
      const { reindexWordsAfterCut } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const words = [
        { index: 0, word: 'A', start: 0.0, end: 0.4 },
        { index: 1, word: 'B', start: 2.0, end: 2.5 },
      ];
      // Stale duracao = 999 — should be ignored; real duration = fim(1.9) - inicio(0.5) = 1.4
      const cuts = [{ tipo: 'silencio' as const, inicio: 0.5, fim: 1.9, duracao: 999, preview: '', aprovado: true }];

      const result = reindexWordsAfterCut(words, cuts);
      assert.equal(result.length, 2);
      // Expected: 2.0 - 1.4 = 0.6, NOT 2.0 - 999
      assert.ok(Math.abs(result[1].start - 0.6) < 0.001, `F1: shift uses fim-inicio not duracao (got ${result[1].start})`);
    },
  },
  {
    name: 'editai/wordIndex: F2 fix — word.end clamped when crossing into cut',
    run: async () => {
      const { reindexWordsAfterCut } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      // word[0] starts at 0.0, ends at 2.2 — but cut starts at 1.0
      // word[0].end should be clamped to 1.0, then shifted by 0 = 1.0
      const words = [
        { index: 0, word: 'Longa', start: 0.0, end: 2.2 },
        { index: 1, word: 'palavra', start: 3.0, end: 3.5 },
      ];
      const cuts = [{ tipo: 'silencio' as const, inicio: 1.0, fim: 2.8, duracao: 1.8, preview: '', aprovado: true }];

      const result = reindexWordsAfterCut(words, cuts);
      assert.equal(result.length, 2);
      assert.ok(result[0].end <= 1.0 + 0.001, `F2: word.end clamped at cut boundary (got ${result[0].end})`);
      assert.ok(result[0].start < result[0].end, 'start < end invariant maintained');
    },
  },
  {
    name: 'editai/wordIndex: two sequential cuts — cumulative shift correct',
    run: async () => {
      const { reindexWordsAfterCut } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const words = [
        { index: 0, word: 'A', start: 0.0, end: 0.3 },
        { index: 1, word: 'B', start: 1.0, end: 1.3 }, // inside cut 1 (0.5–1.8)
        { index: 2, word: 'C', start: 3.0, end: 3.3 }, // inside cut 2 (2.5–3.8)
        { index: 3, word: 'D', start: 6.0, end: 6.3 },
      ];
      const cuts = [
        { tipo: 'silencio' as const, inicio: 0.5, fim: 1.8, duracao: 999, preview: '', aprovado: true }, // 1.3s real
        { tipo: 'silencio' as const, inicio: 2.5, fim: 3.8, duracao: 999, preview: '', aprovado: true }, // 1.3s real
      ];

      const result = reindexWordsAfterCut(words, cuts);
      assert.equal(result.length, 2, 'B and C removed (inside cuts)');
      assert.equal(result[0].index, 0);
      assert.equal(result[1].index, 3);
      // D: 6.0 - (1.8-0.5) - (3.8-2.5) = 6.0 - 1.3 - 1.3 = 3.4
      assert.ok(Math.abs(result[1].start - 3.4) < 0.001, `D shifted by 2 cuts (got ${result[1].start})`);
    },
  },
  {
    name: 'editai/wordIndex: computeSceneFrames converts word indices to frames',
    run: async () => {
      const { computeSceneFrames } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const words = [
        { index: 0, word: 'A', start: 0.0, end: 0.5 },
        { index: 5, word: 'F', start: 2.0, end: 2.5 }, // non-sequential index (after cut)
        { index: 10, word: 'K', start: 4.0, end: 4.5 },
      ];
      const scenes = [{ id: 1, tipo: 'A' as const, startLeg: 0, endLeg: 5, conteudo: {} }];

      const result = computeSceneFrames(scenes, words, 30);
      assert.equal(result[0].frame_inicio, Math.round(0.0 * 30)); // 0
      assert.equal(result[0].frame_fim, Math.round(2.5 * 30)); // 75
    },
  },
  {
    name: 'editai/wordIndex: computeSceneFrames throws on missing word index',
    run: async () => {
      const { computeSceneFrames } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const words = [{ index: 0, word: 'A', start: 0.0, end: 0.5 }];
      const scenes = [{ id: 1, tipo: 'A' as const, startLeg: 0, endLeg: 99, conteudo: {} }];

      await assert.rejects(
        async () => computeSceneFrames(scenes, words, 30),
        /Word index 99 not found/,
      );
    },
  },
  {
    name: 'editai/wordIndex: validateScenesAgainstWords detects invalid refs',
    run: async () => {
      const { validateScenesAgainstWords } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const words = [
        { index: 0, word: 'A', start: 0, end: 0.5 },
        { index: 1, word: 'B', start: 1, end: 1.5 },
      ];

      const validScene = { id: 1, tipo: 'A' as const, startLeg: 0, endLeg: 1, conteudo: {} };
      const missingRef = { id: 2, tipo: 'B' as const, startLeg: 0, endLeg: 99, conteudo: {} };
      const inverted = { id: 3, tipo: 'C+' as const, startLeg: 1, endLeg: 0, conteudo: {} };
      const bothBad = { id: 4, tipo: 'E' as const, startLeg: 99, endLeg: 0, conteudo: {} };

      const r1 = validateScenesAgainstWords([validScene], words);
      assert.equal(r1.valid, true);
      assert.equal(r1.invalidSceneIds.length, 0);

      const r2 = validateScenesAgainstWords([missingRef], words);
      assert.equal(r2.valid, false);
      assert.ok(r2.invalidSceneIds.includes(2));

      const r3 = validateScenesAgainstWords([inverted], words);
      assert.equal(r3.valid, false);
      assert.ok(r3.invalidSceneIds.includes(3));

      // F3: scene with both bad ref AND inverted → appears only once
      const r4 = validateScenesAgainstWords([bothBad], words);
      assert.equal(r4.invalidSceneIds.filter((id) => id === 4).length, 1, 'F3: no duplicate scene IDs');
    },
  },
  {
    name: 'editai/wordIndex: normalizeScenesAgainstWords repairs sequential positions after cuts',
    run: async () => {
      const { normalizeScenesAgainstWords, validateScenesAgainstWords } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const words = [
        { index: 15, word: 'documentos', start: 0, end: 0.18 },
        { index: 27, word: 'psicólogo', start: 0.74, end: 0.74 },
        { index: 28, word: 'organizacional', start: 0.74, end: 1.74 },
        { index: 35, word: 'GRO', start: 2.44, end: 2.8 },
        { index: 39, word: 'Ocupacionais', start: 3.08, end: 4.18 },
        { index: 60, word: 'NRs', start: 4.66, end: 5.26 },
      ];
      const scenes = [
        { id: 1, tipo: 'A' as const, startLeg: 0, endLeg: 2, conteudo: {} },
        { id: 2, tipo: 'B' as const, startLeg: 3, endLeg: 5, conteudo: {} },
        { id: 3, tipo: 'C+' as const, startLeg: 5, endLeg: 3, conteudo: {} },
      ];

      const normalized = normalizeScenesAgainstWords(scenes, words);
      assert.deepEqual(
        normalized.map((scene) => [scene.startLeg, scene.endLeg]),
        [[15, 28], [35, 60], [35, 60]],
      );

      const result = validateScenesAgainstWords(normalized, words);
      assert.equal(result.valid, true);
    },
  },
  {
    name: 'editai/wordIndex: normalizeSceneFrameOrder sorts and prevents visual overlap',
    run: async () => {
      const { normalizeSceneFrameOrder } = await importFresh<typeof import('../services/editaiWordIndex')>('services/editaiWordIndex.ts');

      const scenes = [
        { id: 2, tipo: 'B' as const, startLeg: 1, endLeg: 2, conteudo: {}, frame_inicio: 60, frame_fim: 120 },
        { id: 1, tipo: 'A' as const, startLeg: 0, endLeg: 1, conteudo: {}, frame_inicio: 0, frame_fim: 90 },
      ];

      const result = normalizeSceneFrameOrder(scenes, 30);
      assert.deepEqual(result.map((scene) => scene.id), [1, 2]);
      assert.equal(result[0].frame_fim, 60);
      assert.equal(result[1].frame_inicio, 60);
    },
  },

  // ── EditAI: Cut Planner ──────────────────────────────────────────────────────
  {
    name: 'editai/cutPlanner: detects silence gap > 0.45s',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'Olá', start: 0.0, end: 0.5 },
        { index: 1, word: 'mundo', start: 1.0, end: 1.4 }, // gap = 0.5 > 0.45
      ];
      const report = buildCutReport(words, 'reels');
      assert.equal(report.filter((c) => c.tipo === 'silencio').length, 1);
      assert.ok(Math.abs(report[0].inicio - 0.5) < 0.001);
      assert.ok(Math.abs(report[0].fim - 1.0) < 0.001);
    },
  },
  {
    name: 'editai/cutPlanner: silence below threshold not cut',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'A', start: 0.0, end: 0.5 },
        { index: 1, word: 'B', start: 0.9, end: 1.3 }, // gap = 0.4 < 0.45
      ];
      const report = buildCutReport(words, 'reels');
      assert.equal(report.filter((c) => c.tipo === 'silencio').length, 0);
    },
  },
  {
    name: 'editai/cutPlanner: youtube uses 0.75s silence threshold',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'A', start: 0.0, end: 0.5 },
        { index: 1, word: 'B', start: 1.1, end: 1.5 }, // gap = 0.6 > reels(0.45) but < youtube(0.75)
      ];
      const reelsReport = buildCutReport(words, 'reels');
      const youtubeReport = buildCutReport(words, 'youtube');

      assert.equal(reelsReport.filter((c) => c.tipo === 'silencio').length, 1, 'reels: cuts 0.6s gap');
      assert.equal(youtubeReport.filter((c) => c.tipo === 'silencio').length, 0, 'youtube: ignores 0.6s gap');
    },
  },
  {
    name: 'editai/cutPlanner: audio silence inside long transcription word is cut',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'do', start: 20.2, end: 23.62 },
        { index: 1, word: 'sistema', start: 23.62, end: 24.16 },
        { index: 2, word: 'determina', start: 25.42, end: 28.92 },
      ];
      const report = buildCutReport(words, 'reels', {
        audioSilences: [
          { start: 20.726, end: 21.814 },
          { start: 25.563, end: 26.83 },
        ],
        totalDuration: 29,
      });
      const silences = report.filter((cut) => cut.tipo === 'silencio');
      assert.ok(silences.some((cut) => Math.abs(cut.inicio - 20.726) < 0.01 && Math.abs(cut.fim - 21.814) < 0.01), 'cuts silence inside word at 20s');
      assert.ok(silences.some((cut) => Math.abs(cut.inicio - 25.563) < 0.01 && Math.abs(cut.fim - 26.83) < 0.01), 'cuts silence inside word at 25s');
    },
  },
  {
    name: 'editai/cutPlanner: detects stutter (repeated word)',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'eu', start: 0.0, end: 0.2 },
        { index: 1, word: 'eu', start: 0.25, end: 0.45 }, // repeat
        { index: 2, word: 'acho', start: 0.5, end: 0.8 },
      ];
      const report = buildCutReport(words, 'reels');
      const stutters = report.filter((c) => c.tipo === 'gaguejo');
      assert.equal(stutters.length, 1, 'stutter detected');
      assert.ok(stutters[0].inicio < stutters[0].fim, 'stutter has valid range');
    },
  },
  {
    name: 'editai/cutPlanner: cuts near repeated phrase and keeps the second take',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'a', start: 0.0, end: 0.1 },
        { index: 1, word: 'empresa', start: 0.1, end: 0.5 },
        { index: 2, word: 'precisa', start: 0.5, end: 0.9 },
        { index: 3, word: 'a', start: 1.2, end: 1.3 },
        { index: 4, word: 'empresa', start: 1.3, end: 1.7 },
        { index: 5, word: 'precisa', start: 1.7, end: 2.1 },
        { index: 6, word: 'consolidar', start: 2.1, end: 2.7 },
      ];
      const report = buildCutReport(words, 'reels');
      const repeated = report.find((cut) => cut.tipo === 'gaguejo' && cut.inicio === 0 && Math.abs(cut.fim - 1.2) < 0.001);
      assert.ok(repeated, 'first take is cut until the repeated phrase restarts');
      assert.equal(repeated!.status, 'approved');
    },
  },
  {
    name: 'editai/cutPlanner: does not cut rhetorical repeated connectors in a list',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'com', start: 0.0, end: 0.2 },
        { index: 1, word: 'liderança', start: 0.2, end: 0.7 },
        { index: 2, word: 'com', start: 0.8, end: 1.0 },
        { index: 3, word: 'clima', start: 1.0, end: 1.4 },
        { index: 4, word: 'com', start: 1.5, end: 1.7 },
        { index: 5, word: 'comunicação', start: 1.7, end: 2.3 },
      ];
      const report = buildCutReport(words, 'reels');
      assert.equal(report.filter((cut) => cut.tipo !== 'silencio').length, 0);
    },
  },
  {
    name: 'editai/cutPlanner: fast natural speech is not treated as stutter',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'psicologia', start: 0.0, end: 0.42 },
        { index: 1, word: 'organizacional', start: 0.43, end: 1.1 },
        { index: 2, word: 'transforma', start: 1.11, end: 1.55 },
        { index: 3, word: 'ambientes', start: 1.56, end: 2.0 },
      ];

      const report = buildCutReport(words, 'reels');
      assert.equal(report.filter((cut) => cut.tipo === 'gaguejo').length, 0);
    },
  },
  {
    name: 'editai/cutPlanner: long repeated phrase is review-only, not auto-approved',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      const words = [
        { index: 0, word: 'vamos', start: 0.0, end: 0.3 },
        { index: 1, word: 'falar', start: 0.4, end: 0.8 },
        { index: 2, word: 'vamos', start: 2.6, end: 2.9 },
        { index: 3, word: 'falar', start: 3.0, end: 3.4 },
      ];

      const report = buildCutReport(words, 'reels');
      const stutter = report.find((cut) => cut.tipo === 'gaguejo');
      assert.ok(stutter, 'repeated phrase detected');
      assert.equal(stutter!.aprovado, false);
    },
  },
  {
    name: 'editai/cutPlanner: empty and single word return no cuts',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      assert.deepEqual(buildCutReport([], 'reels'), []);
      assert.deepEqual(buildCutReport([{ index: 0, word: 'só', start: 0, end: 0.5 }], 'reels'), []);
    },
  },
  {
    name: 'editai/cutPlanner: duracao in generated cuts equals fim - inicio',
    run: async () => {
      const { buildCutReport } = await importFresh<typeof import('../services/editaiCutPlanner')>('services/editaiCutPlanner.ts');

      // 3 gaps all > 0.8s — verify duracao is always fim-inicio (not stale)
      const words = [
        { index: 0, word: 'A', start: 0.0, end: 0.1 },
        { index: 1, word: 'B', start: 1.5, end: 1.6 }, // gap 1.4s
        { index: 2, word: 'C', start: 3.0, end: 3.1 }, // gap 1.4s
        { index: 3, word: 'D', start: 4.5, end: 4.8 }, // gap 1.4s
      ];
      const report = buildCutReport(words, 'reels');
      const silences = report.filter((c) => c.tipo === 'silencio');
      assert.equal(silences.length, 3, '3 silence gaps detected');
      for (const cut of silences) {
        const expected = cut.fim - cut.inicio;
        assert.ok(Math.abs(cut.duracao - expected) < 0.001, `duracao(${cut.duracao}) matches fim-inicio(${expected})`);
      }
    },
  },

  // ── EditAI: Timeline helpers ─────────────────────────────────────────────────
  {
    name: 'editai/timeline: merged cuts produce expected kept duration',
    run: async () => {
      const { buildKeptSegments, getKeptDuration, normalizeApprovedCuts } = await importFresh<typeof import('../services/editaiTimeline')>('services/editaiTimeline.ts');

      const cuts = [
        { tipo: 'silencio' as const, inicio: 1, fim: 2, duracao: 999, preview: '', aprovado: true },
        { tipo: 'gaguejo' as const, inicio: 1.9, fim: 3, duracao: 999, preview: '', aprovado: true },
        { tipo: 'refazimento' as const, inicio: 5, fim: 6, duracao: 999, preview: '', aprovado: false },
      ];

      const normalized = normalizeApprovedCuts(cuts, 10);
      assert.equal(normalized.length, 1);
      assert.ok(Math.abs(normalized[0].duracao - 2) < 0.001);

      const segments = buildKeptSegments(10, cuts);
      assert.deepEqual(segments.map((segment) => [segment.start, segment.end]), [[0, 1], [3, 10]]);
      assert.ok(Math.abs(getKeptDuration(segments) - 8) < 0.001);
    },
  },

  // ── EditAI: Registry ─────────────────────────────────────────────────────────
  {
    name: 'editai/registry: creates, retrieves, updates and deletes project',
    run: async () => {
      await withTempCwd('editai-registry', async () => {
        const registry = await importFresh<typeof import('../services/editaiProjectRegistry')>('services/editaiProjectRegistry.ts');

        const project = {
          id: 'test-id-001',
          title: 'Test Project',
          sourceFileName: 'test.mp4',
          status: 'uploading' as const,
          formatoDestino: 'reels' as const,
          originalPath: '/tmp/test.mp4',
          normalizedPath: '',
          cutPath: '',
          renderPath: '',
          fps: 30,
          words: [],
          transcription: '',
          cutReport: [],
          planText: '',
          planApproved: false,
          template: null,
          formato: '',
          paleta: null,
          scenes: [],
          renderProgress: 0,
          error: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await registry.syncEditAIProject(project);

        const fetched = await registry.getEditAIProject('test-id-001');
        assert.ok(fetched, 'project found after sync');
        assert.equal(fetched!.title, 'Test Project');
        assert.equal(fetched!.planApproved, false);
        assert.equal(fetched!.formatoDestino, 'reels');

        // Update planApproved
        await registry.syncEditAIProject({ ...fetched!, planApproved: true, status: 'awaiting_plan' });
        const updated = await registry.getEditAIProject('test-id-001');
        assert.equal(updated!.planApproved, true, 'planApproved persisted');

        // List
        const list = await registry.listEditAIProjects();
        assert.equal(list.length, 1);

        // Delete
        await registry.deleteEditAIProject('test-id-001');
        const deleted = await registry.getEditAIProject('test-id-001');
        assert.equal(deleted, null, 'project not found after delete');

        const emptyList = await registry.listEditAIProjects();
        assert.equal(emptyList.length, 0);
      });
    },
  },
  {
    name: 'editai/registry: normalizeProject sets planApproved=false when missing',
    run: async () => {
      await withTempCwd('editai-registry-normalize', async () => {
        const registry = await importFresh<typeof import('../services/editaiProjectRegistry')>('services/editaiProjectRegistry.ts');

        // Simulate project saved without planApproved field (legacy/migration)
        const raw = {
          id: 'norm-001',
          title: '',
          sourceFileName: '',
          status: 'uploading' as const,
          // planApproved intentionally missing — normalizeProject should default to false
        };
        await registry.syncEditAIProject(raw as Parameters<typeof registry.syncEditAIProject>[0]);
        const fetched = await registry.getEditAIProject('norm-001');
        assert.equal(fetched!.planApproved, false, 'planApproved defaults to false');
        assert.equal(fetched!.formatoDestino, 'reels', 'formatoDestino defaults to reels');
      });
    },
  },

  // ── EditAI: Gate enforcement ─────────────────────────────────────────────────
  {
    name: 'editai/gate: generateScenes throws when planApproved=false',
    run: async () => {
      const { generateScenes } = await importFresh<typeof import('../services/editaiAIPlanner')>('services/editaiAIPlanner.ts');

      await assert.rejects(
        async () => generateScenes([], '', 'plan text', false, null, 'reels'),
        /planApproved.*true|Plan must be approved/,
        'gate rejects when planApproved is false',
      );
    },
  },
];

const run = async () => {
  const failures: Array<{ name: string; error: unknown }> = [];

  for (const testCase of tests) {
    try {
      await testCase.run();
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      failures.push({ name: testCase.name, error });
      console.error(`FAIL ${testCase.name}`);
      console.error(error);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} test(s) failed.`);
    process.exit(1);
  }

  console.log(`\n${tests.length} test(s) passed.`);
  process.exit(0);
};

await run();
