import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import type { Server } from 'node:http';
import http from 'node:http';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { pathToFileURL } from 'node:url';
import { renderBrandingSlidesToPng } from './renderers/brandingPngRenderer.js';
import {
  getBrowser,
  screenshotHtml,
  exportHtmlToPdf,
  exportPresentationToPdf,
  exportPresentationToPptx,
  captureMotionFrames,
} from './renderers/designStudioRenderer.js';
import {
  buildEloCutEditPlan,
  createEloCutProject,
  transcribeVideo,
  analyzeTranscriptWithClaude,
  renderEloCutVideo,
} from './services/eloCutService.js';
import type { EloCutProject } from './services/eloCutService.js';
import {
  clearProviderCredentials,
  getProviderSequenceForCapability,
  getProviderStatusSummary,
  listProviderHealth,
  listRoutingPolicies,
  routeImageEditing,
  routeImageGeneration,
  routeTextGeneration,
  routeVideoGeneration,
  setProviderCredentials,
  testProvider,
  updateProviderConfig,
  updateRoutingPolicy,
} from './services/aiProviderRegistry.js';
import { getAIUsageSummary } from './services/aiUsageRegistry.js';
import {
  deleteBrandCalendarWorkspaceByManifesto,
  listBrandCalendarWorkspace,
  replaceBrandCalendarWorkspace,
} from './services/brandCalendarRegistry.js';
import {
  deleteEloCutProjectRecord,
  getEloCutProjectRecord,
  listEloCutProjectRecords,
  syncEloCutProjectRecord,
  updateEloCutProjectControl,
} from './services/eloCutProjectRegistry.js';
import { listPromptTemplates, updatePromptTemplate } from './services/aiPromptRegistry.js';
import {
  deleteBrandEditorialLinesByManifesto,
  listBrandEditorialLines,
  replaceBrandEditorialLines,
} from './services/brandEditorialRegistry.js';
import {
  deleteBrandVisualIdentityByManifesto,
  getBrandVisualIdentity,
  upsertBrandVisualIdentity,
} from './services/brandVisualIdentityRegistry.js';
import {
  createBrandCarouselDraft,
  deleteBrandCarouselDraft,
  getBrandCarouselDraft,
  listBrandCarouselDrafts,
  updateBrandCarouselDraft,
} from './services/brandCarouselDraftRegistry.js';
import {
  createBrandManifesto,
  deleteBrandManifesto,
  getBrandManifesto,
  listBrandManifestos,
  updateBrandManifesto,
} from './services/brandManifestoRegistry.js';
import { listLocalPlugins } from './services/localPluginRegistry.js';
import { generateSlideImageWithOpenAI } from './services/openaiSlideService.js';
import {
  createEditAIProject,
  runStage1Normalize,
  runStage2Transcribe,
  runStage3BuildCutReport,
  runStage3ExecuteCuts,
  runStage4APlan,
  runStage4BScenes,
  runStage5Render,
} from './services/editaiService.js';
import { detectAudioSilenceRanges, probeVideoInfo } from './services/editaiFfmpeg.js';
import { buildCutReport } from './services/editaiCutPlanner.js';
import { buildKeptSegments, getKeptDuration, normalizeApprovedCuts } from './services/editaiTimeline.js';
import {
  listEditAIProjects,
  getEditAIProject,
  syncEditAIProject,
  deleteEditAIProject,
} from './services/editaiProjectRegistry.js';
import type { EditAICutReport, EditAIEditPreset } from './types.js';
import {
  buildInstagramAuthUrl,
  completeInstagramOAuth,
  disconnectInstagram,
  getInstagramStatus,
  listInstagramJobs,
  queueInstagramPublication,
  startInstagramScheduler,
} from './services/instagramScheduler.js';
import type {
  AICapability,
  AIProviderId,
  AIPromptTemplateId,
  BrandEditorialLineScopeMode,
} from './types.js';

dotenv.config();

const resolveEloCutOutputPath = (projectId: string, preferredPath?: string) => {
  const candidates = [
    preferredPath,
    path.join(process.cwd(), 'outputs', 'elocut', `${projectId}_output.mp4`),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const resolveEloCutEditedPath = (projectId: string, preferredPath?: string) => {
  const candidates = [
    preferredPath,
    path.join(process.cwd(), 'outputs', 'elocut', `${projectId}_edited_base.mp4`),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const streamVideoFile = (req: express.Request, res: express.Response, filePath: string, inlineFilename?: string) => {
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  const contentType = path.extname(filePath).toLowerCase() === '.webm' ? 'video/webm' : 'video/mp4';

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', contentType);
  if (inlineFilename) {
    res.setHeader('Content-Disposition', `inline; filename="${inlineFilename}"`);
  }

  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : stat.size - 1;

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || end >= stat.size) {
      res.status(416).setHeader('Content-Range', `bytes */${stat.size}`).end();
      return;
    }

    res.status(206);
    res.setHeader('Content-Length', end - start + 1);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.setHeader('Content-Length', stat.size.toString());
  fs.createReadStream(filePath).pipe(res);
};

const escapeForInlineScript = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');

const probeVideoInfoSafe = async (filePath: string) => {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return await probeVideoInfo(filePath);
  } catch {
    return null;
  }
};

type StartServerOptions = {
  host?: string;
  port?: number;
  includeVite?: boolean;
  startSchedulers?: boolean;
};

export async function createApp(options: StartServerOptions = {}) {
  const app = express();
  const eloCutMediaDir = path.join(process.cwd(), 'outputs', 'elocut');
  const includeVite = options.includeVite ?? process.env.NODE_ENV !== 'production';

  app.use(cors());

  app.use(express.json({ limit: '25mb' }));
  const editAIMediaDir = path.join(process.cwd(), 'outputs', 'editai');
  app.use('/__editai_media', express.static(editAIMediaDir, {
    acceptRanges: true,
    immutable: false,
    maxAge: 0,
    setHeaders: (res, filePath) => {
      if (path.extname(filePath).toLowerCase() === '.mp4') {
        res.setHeader('Content-Type', 'video/mp4');
      }
      res.setHeader('Cache-Control', 'no-store');
    },
  }));

  app.use('/__elocut_media', express.static(eloCutMediaDir, {
    acceptRanges: true,
    immutable: false,
    maxAge: 0,
    setHeaders: (res, filePath) => {
      if (path.extname(filePath).toLowerCase() === '.mp4') {
        res.setHeader('Content-Type', 'video/mp4');
      }
      res.setHeader('Cache-Control', 'no-store');
    },
  }));

  app.get('/api/ai/providers', async (_req, res) => {
    try {
      const summary = await getProviderStatusSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load providers.' });
    }
  });

  app.get('/api/ai/routing', async (_req, res) => {
    try {
      const routing = await listRoutingPolicies();
      res.json({ routing });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load routing.' });
    }
  });

  app.get('/api/ai/health', async (_req, res) => {
    try {
      const health = await listProviderHealth();
      res.json({ health });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load provider health.' });
    }
  });

  app.get('/api/ai/providers/status', async (_req, res) => {
    try {
      const summary = await getProviderStatusSummary();
      const groq = summary.providers.find((provider) => provider.config.id === 'groq');
      const gemini = summary.providers.find((provider) => provider.config.id === 'gemini');
      const routing = summary.routing.find((policy) => policy.capability === 'structured_text');
      const availableStructuredProviders = await getProviderSequenceForCapability('structured_text');
      const availableImageProviders = await getProviderSequenceForCapability('image_generation');
      const availableVideoProviders = await getProviderSequenceForCapability('video_generation');
      const configuredProviderIds = new Set(
        summary.providers
          .filter((provider) => provider.config.enabled && provider.secret.hasKey)
          .map((provider) => provider.config.id),
      );

      res.json({
        groqConfigured: Boolean(groq?.secret.hasKey && groq.config.enabled),
        geminiConfigured: Boolean(gemini?.secret.hasKey && gemini.config.enabled),
        textAiConfigured: availableStructuredProviders.some((providerId) => configuredProviderIds.has(providerId)),
        imageAiConfigured: availableImageProviders.some((providerId) => configuredProviderIds.has(providerId)),
        videoAiConfigured: availableVideoProviders.some((providerId) => configuredProviderIds.has(providerId)),
        textPrimaryProvider: routing?.primaryProvider ?? null,
        groqModel: groq?.config.modelDefaults.structured_text || null,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load provider status.' });
    }
  });

  app.get('/api/ai/usage', async (_req, res) => {
    try {
      const usage = await getAIUsageSummary();
      res.json({ usage });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load AI usage.' });
    }
  });

  app.get('/api/ai/prompts', async (_req, res) => {
    try {
      const prompts = await listPromptTemplates();
      res.json({ prompts });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load prompt templates.' });
    }
  });

  app.put('/api/ai/prompts/:promptId', async (req, res) => {
    const promptId = req.params.promptId as AIPromptTemplateId;
    const prompt = String(req.body?.prompt || '');

    if (!prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required.' });
    }

    try {
      const template = await updatePromptTemplate(promptId, prompt);
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save prompt template.' });
    }
  });

  app.get('/api/plugins/local', async (_req, res) => {
    try {
      const plugins = await listLocalPlugins();
      res.json({ plugins });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load local plugins.' });
    }
  });

  app.get('/api/branding/manifestos', async (_req, res) => {
    try {
      const manifestos = await listBrandManifestos();
      res.json({ manifestos });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load manifestos.' });
    }
  });

  app.get('/api/branding/manifestos/:manifestoId', async (req, res) => {
    try {
      const manifesto = await getBrandManifesto(req.params.manifestoId);
      if (!manifesto) {
        res.status(404).json({ error: 'Manifesto not found.' });
        return;
      }
      res.json(manifesto);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load manifesto.' });
    }
  });

  app.post('/api/branding/manifestos', async (req, res) => {
    try {
      const manifesto = await createBrandManifesto(req.body ?? {});
      res.status(201).json(manifesto);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create manifesto.' });
    }
  });

  app.put('/api/branding/manifestos/:manifestoId', async (req, res) => {
    try {
      const manifesto = await updateBrandManifesto(req.params.manifestoId, req.body ?? {});
      res.json(manifesto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update manifesto.';
      res.status(message === 'Manifesto not found.' ? 404 : 400).json({ error: message });
    }
  });

  app.delete('/api/branding/manifestos/:manifestoId', async (req, res) => {
    try {
      await deleteBrandManifesto(req.params.manifestoId);
      await deleteBrandCalendarWorkspaceByManifesto(req.params.manifestoId);
      await deleteBrandEditorialLinesByManifesto(req.params.manifestoId);
      await deleteBrandVisualIdentityByManifesto(req.params.manifestoId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete manifesto.';
      res.status(message === 'Manifesto not found.' ? 404 : 400).json({ error: message });
    }
  });

  app.get('/api/branding/visual-identity', async (req, res) => {
    const scopeMode = req.query.scopeMode === 'blank' ? 'blank' : 'manifesto';
    const manifestoId = typeof req.query.manifestoId === 'string' && req.query.manifestoId.trim()
      ? req.query.manifestoId.trim()
      : null;
    const blankWorkspaceId = typeof req.query.blankWorkspaceId === 'string' && req.query.blankWorkspaceId.trim()
      ? req.query.blankWorkspaceId.trim()
      : null;

    try {
      const visualIdentity = await getBrandVisualIdentity({
        manifestoId,
        scopeMode,
        blankWorkspaceId,
      });
      res.json({ visualIdentity });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load brand visual identity.';
      res.status(message === 'manifestoId is required for manifesto scope.' ? 400 : 500).json({ error: message });
    }
  });

  app.put('/api/branding/visual-identity', async (req, res) => {
    const scopeMode = (req.body?.scopeMode === 'blank' ? 'blank' : 'manifesto') as BrandEditorialLineScopeMode;
    const manifestoId = typeof req.body?.manifestoId === 'string' && req.body.manifestoId.trim()
      ? req.body.manifestoId.trim()
      : null;
    const blankWorkspaceId = typeof req.body?.blankWorkspaceId === 'string' && req.body.blankWorkspaceId.trim()
      ? req.body.blankWorkspaceId.trim()
      : null;

    try {
      const visualIdentity = await upsertBrandVisualIdentity({
        ...req.body,
        manifestoId,
        scopeMode,
        blankWorkspaceId,
      });
      res.json({ visualIdentity });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save brand visual identity.';
      res.status(
        message === 'manifestoId is required for manifesto scope.' || message === 'brandName is required.' || message === 'brandHandle is required.'
          ? 400
          : 500,
      ).json({ error: message });
    }
  });

  app.get('/api/branding/editorial-lines', async (req, res) => {
    const scopeMode = req.query.scopeMode === 'blank' ? 'blank' : 'manifesto';
    const manifestoId = typeof req.query.manifestoId === 'string' && req.query.manifestoId.trim()
      ? req.query.manifestoId.trim()
      : null;
    const blankWorkspaceId = typeof req.query.blankWorkspaceId === 'string' && req.query.blankWorkspaceId.trim()
      ? req.query.blankWorkspaceId.trim()
      : null;

    try {
      const editorialLines = await listBrandEditorialLines({
        manifestoId,
        scopeMode,
        blankWorkspaceId,
      });
      res.json({ editorialLines });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load editorial lines.';
      res.status(message === 'manifestoId is required for manifesto scope.' ? 400 : 500).json({ error: message });
    }
  });

  app.put('/api/branding/editorial-lines', async (req, res) => {
    const scopeMode = (req.body?.scopeMode === 'blank' ? 'blank' : 'manifesto') as BrandEditorialLineScopeMode;
    const manifestoId = typeof req.body?.manifestoId === 'string' && req.body.manifestoId.trim()
      ? req.body.manifestoId.trim()
      : null;
    const blankWorkspaceId = typeof req.body?.blankWorkspaceId === 'string' && req.body.blankWorkspaceId.trim()
      ? req.body.blankWorkspaceId.trim()
      : null;
    const lines = Array.isArray(req.body?.lines) ? req.body.lines : [];

    try {
      const editorialLines = await replaceBrandEditorialLines({
        manifestoId,
        scopeMode,
        blankWorkspaceId,
        lines,
      });
      res.json({ editorialLines });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save editorial lines.';
      res.status(message === 'manifestoId is required for manifesto scope.' ? 400 : 500).json({ error: message });
    }
  });

  app.get('/api/branding/calendar', async (req, res) => {
    const scopeMode = req.query.scopeMode === 'blank' ? 'blank' : 'manifesto';
    const manifestoId = typeof req.query.manifestoId === 'string' && req.query.manifestoId.trim()
      ? req.query.manifestoId.trim()
      : null;
    const blankWorkspaceId = typeof req.query.blankWorkspaceId === 'string' && req.query.blankWorkspaceId.trim()
      ? req.query.blankWorkspaceId.trim()
      : null;

    try {
      const posts = await listBrandCalendarWorkspace({
        manifestoId,
        scopeMode,
        blankWorkspaceId,
      });
      res.json({ posts });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load calendar workspace.';
      res.status(message === 'manifestoId is required for manifesto scope.' ? 400 : 500).json({ error: message });
    }
  });

  app.put('/api/branding/calendar', async (req, res) => {
    const scopeMode = (req.body?.scopeMode === 'blank' ? 'blank' : 'manifesto') as BrandEditorialLineScopeMode;
    const manifestoId = typeof req.body?.manifestoId === 'string' && req.body.manifestoId.trim()
      ? req.body.manifestoId.trim()
      : null;
    const blankWorkspaceId = typeof req.body?.blankWorkspaceId === 'string' && req.body.blankWorkspaceId.trim()
      ? req.body.blankWorkspaceId.trim()
      : null;
    const posts = Array.isArray(req.body?.posts) ? req.body.posts : [];

    try {
      const nextPosts = await replaceBrandCalendarWorkspace({
        manifestoId,
        scopeMode,
        blankWorkspaceId,
        posts,
      });
      res.json({ posts: nextPosts });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save calendar workspace.';
      res.status(message === 'manifestoId is required for manifesto scope.' ? 400 : 500).json({ error: message });
    }
  });

  app.get('/api/branding/carousel-drafts', async (_req, res) => {
    try {
      const drafts = await listBrandCarouselDrafts();
      res.json({ drafts });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load carousel drafts.' });
    }
  });

  app.get('/api/branding/carousel-drafts/:draftId', async (req, res) => {
    try {
      const draft = await getBrandCarouselDraft(req.params.draftId);
      res.json({ draft });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load carousel draft.';
      res.status(message === 'Carousel draft not found.' ? 404 : 400).json({ error: message });
    }
  });

  app.post('/api/branding/carousel-drafts', async (req, res) => {
    try {
      const draft = await createBrandCarouselDraft(req.body ?? {});
      res.status(201).json(draft);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create carousel draft.';
      res.status(
        message === 'name is required.' || message === 'slides are required.'
          ? 400
          : 500,
      ).json({ error: message });
    }
  });

  app.put('/api/branding/carousel-drafts/:draftId', async (req, res) => {
    try {
      const draft = await updateBrandCarouselDraft(req.params.draftId, req.body ?? {});
      res.json(draft);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update carousel draft.';
      res.status(
        message === 'Carousel draft not found.'
          ? 404
          : message === 'name is required.' || message === 'slides are required.'
            ? 400
            : 500,
      ).json({ error: message });
    }
  });

  app.delete('/api/branding/carousel-drafts/:draftId', async (req, res) => {
    try {
      await deleteBrandCarouselDraft(req.params.draftId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete carousel draft.';
      res.status(message === 'Carousel draft not found.' ? 404 : 400).json({ error: message });
    }
  });

  // ── Carousel ZIP export ──────────────────────────────────────────────────
  // Receives rendered slide dataUrls and returns a ZIP file for download.
  // No external zip library needed — uses a minimal stored-ZIP implementation.
  app.post('/api/carousel/export-zip', (req, res) => {
    type SlideInput = { filename: string; dataUrl: string };
    const slides: SlideInput[] = Array.isArray(req.body?.slides) ? req.body.slides : [];

    if (slides.length === 0) {
      return res.status(400).json({ error: 'No slides provided.' });
    }

    try {
      // Minimal CRC-32 (ZIP spec requires it for stored entries)
      const crc32 = (buf: Buffer): number => {
        const table = (() => {
          const t = new Uint32Array(256);
          for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            t[i] = c;
          }
          return t;
        })();
        let crc = 0xffffffff;
        for (const byte of buf) crc = table[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
        return (crc ^ 0xffffffff) >>> 0;
      };

      // Build a stored (no-compression) ZIP from {name, data} entries
      const buildZip = (files: Array<{ name: string; data: Buffer }>): Buffer => {
        const now = new Date();
        const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) >>> 0;
        const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) >>> 0;

        const localParts: Buffer[] = [];
        const cdParts: Buffer[] = [];
        let offset = 0;

        for (const file of files) {
          const nameBuf = Buffer.from(file.name, 'utf8');
          const crc = crc32(file.data);
          const size = file.data.length;

          // Local file header (30 bytes + name)
          const lh = Buffer.allocUnsafe(30 + nameBuf.length);
          lh.writeUInt32LE(0x04034b50, 0);   // signature
          lh.writeUInt16LE(20, 4);            // version needed: 2.0
          lh.writeUInt16LE(0, 6);             // flags
          lh.writeUInt16LE(0, 8);             // method: stored
          lh.writeUInt16LE(dosTime, 10);
          lh.writeUInt16LE(dosDate, 12);
          lh.writeUInt32LE(crc, 14);
          lh.writeUInt32LE(size, 18);         // compressed size
          lh.writeUInt32LE(size, 22);         // uncompressed size
          lh.writeUInt16LE(nameBuf.length, 26);
          lh.writeUInt16LE(0, 28);            // extra field length
          nameBuf.copy(lh, 30);
          localParts.push(lh, file.data);

          // Central directory entry (46 bytes + name)
          const cd = Buffer.allocUnsafe(46 + nameBuf.length);
          cd.writeUInt32LE(0x02014b50, 0);   // signature
          cd.writeUInt16LE(20, 4);           // version made by
          cd.writeUInt16LE(20, 6);           // version needed
          cd.writeUInt16LE(0, 8);            // flags
          cd.writeUInt16LE(0, 10);           // method
          cd.writeUInt16LE(dosTime, 12);
          cd.writeUInt16LE(dosDate, 14);
          cd.writeUInt32LE(crc, 16);
          cd.writeUInt32LE(size, 20);        // compressed
          cd.writeUInt32LE(size, 24);        // uncompressed
          cd.writeUInt16LE(nameBuf.length, 28);
          cd.writeUInt16LE(0, 30);           // extra
          cd.writeUInt16LE(0, 32);           // comment
          cd.writeUInt16LE(0, 34);           // disk start
          cd.writeUInt16LE(0, 36);           // internal attr
          cd.writeUInt32LE(0, 38);           // external attr
          cd.writeUInt32LE(offset, 42);      // local header offset
          nameBuf.copy(cd, 46);
          cdParts.push(cd);

          offset += lh.length + file.data.length;
        }

        const cdBuf = Buffer.concat(cdParts);
        const eocd = Buffer.allocUnsafe(22);
        eocd.writeUInt32LE(0x06054b50, 0);           // EOCD signature
        eocd.writeUInt16LE(0, 4);                    // disk number
        eocd.writeUInt16LE(0, 6);                    // disk with CD start
        eocd.writeUInt16LE(files.length, 8);         // entries on disk
        eocd.writeUInt16LE(files.length, 10);        // total entries
        eocd.writeUInt32LE(cdBuf.length, 12);        // CD size
        eocd.writeUInt32LE(offset, 16);              // CD offset
        eocd.writeUInt16LE(0, 20);                   // comment length

        return Buffer.concat([...localParts, cdBuf, eocd]);
      };

      // Convert dataUrls (base64 or file paths) to Buffers
      const files: Array<{ name: string; data: Buffer }> = [];
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i]!;
        if (!s.dataUrl || !s.filename) continue;
        const name = s.filename.endsWith('.png') ? s.filename : `slide-${String(i + 1).padStart(2, '0')}.png`;
        if (s.dataUrl.startsWith('data:')) {
          const base64 = s.dataUrl.replace(/^data:image\/\w+;base64,/, '');
          files.push({ name, data: Buffer.from(base64, 'base64') });
        } else if (s.dataUrl.startsWith('/__squad_slides/')) {
          // File path on disk — read directly
          const filePath = path.join(process.cwd(), 'outputs', 'squad-slides', s.dataUrl.replace('/__squad_slides/', ''));
          try {
            const data = fs.readFileSync(filePath);
            files.push({ name, data });
          } catch { /* skip missing file */ }
        }
      }

      const zip = buildZip(files);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="entrelacos-carrossel.zip"');
      res.setHeader('Content-Length', zip.length);
      res.send(zip);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'ZIP export failed.' });
    }
  });

  app.put('/api/ai/providers/:providerId', async (req, res) => {
    const providerId = req.params.providerId as AIProviderId;

    try {
      const record = await updateProviderConfig(providerId, req.body ?? {});
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update provider.' });
    }
  });

  app.post('/api/ai/providers/:providerId/credentials', async (req, res) => {
    const providerId = req.params.providerId as AIProviderId;
    const apiKey = String(req.body?.apiKey || '').trim();

    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required.' });
    }

    try {
      const record = await setProviderCredentials(providerId, apiKey);
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save credentials.' });
    }
  });

  app.delete('/api/ai/providers/:providerId/credentials', async (req, res) => {
    const providerId = req.params.providerId as AIProviderId;

    try {
      const record = await clearProviderCredentials(providerId);
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to clear credentials.' });
    }
  });

  app.post('/api/ai/providers/:providerId/test', async (req, res) => {
    const providerId = req.params.providerId as AIProviderId;

    try {
      const health = await testProvider(providerId);
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to test provider.' });
    }
  });

  app.put('/api/ai/routing/:capability', async (req, res) => {
    const capability = req.params.capability as AICapability;

    try {
      const routing = await updateRoutingPolicy(capability, req.body ?? {});
      res.json(routing);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update routing.' });
    }
  });

  // Claude Code CLI chat — usa CLI local com auth da conta do usuário (sem API key).
  // Body: { system?: string, messages: [{role, content}], model? }
  // Resposta: { content: string }
  app.post('/api/ai/claude-cli/chat', async (req, res) => {
    const { system, messages, model } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }
    try {
      const { claudeCliChat } = await import('./services/claudeCliChat.js');
      const result = await claudeCliChat({ system, messages, model });
      return res.json({ content: result.content });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'CLI invocation failed.' });
    }
  });

  app.post('/api/ai/router/chat', async (req, res) => {
    const { capability, messages, responseFormat, temperature, maxTokens, model } = req.body ?? {};

    if (!capability) {
      return res.status(400).json({ error: 'capability is required.' });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }

    try {
      const result = await routeTextGeneration({
        capability,
        messages,
        responseFormat,
        temperature,
        maxTokens,
        model,
      });

      res.json(result);
    } catch (error) {
      console.error('Router chat failed', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to route AI request.' });
    }
  });

  app.post('/api/ai/router/image', async (req, res) => {
    const { prompt, size, ratio, model } = req.body ?? {};

    if (!String(prompt || '').trim()) {
      return res.status(400).json({ error: 'prompt is required.' });
    }

    if (!String(size || '').trim() || !String(ratio || '').trim()) {
      return res.status(400).json({ error: 'size and ratio are required.' });
    }

    try {
      const result = await routeImageGeneration({
        prompt: String(prompt),
        size: String(size),
        ratio: String(ratio),
        model: typeof model === 'string' ? model : undefined,
      });

      res.json(result);
    } catch (error) {
      console.error('Router image failed', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate image.' });
    }
  });

  app.post('/api/ai/router/image/edit', async (req, res) => {
    const { prompt, base64Image, mimeType, model } = req.body ?? {};

    if (!String(prompt || '').trim()) {
      return res.status(400).json({ error: 'prompt is required.' });
    }

    if (!String(base64Image || '').trim()) {
      return res.status(400).json({ error: 'base64Image is required.' });
    }

    try {
      const result = await routeImageEditing({
        prompt: String(prompt),
        base64Image: String(base64Image),
        mimeType: typeof mimeType === 'string' ? mimeType : undefined,
        model: typeof model === 'string' ? model : undefined,
      });

      res.json(result);
    } catch (error) {
      console.error('Router image edit failed', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to edit image.' });
    }
  });

  app.post('/api/ai/router/video', async (req, res) => {
    const { prompt, aspectRatio, model } = req.body ?? {};

    if (!String(prompt || '').trim()) {
      return res.status(400).json({ error: 'prompt is required.' });
    }

    if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
      return res.status(400).json({ error: 'aspectRatio must be 16:9 or 9:16.' });
    }

    try {
      const result = await routeVideoGeneration({
        prompt: String(prompt),
        aspectRatio,
        model: typeof model === 'string' ? model : undefined,
      });

      res.json(result);
    } catch (error) {
      console.error('Router video failed', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate video.' });
    }
  });

  app.post('/api/ai/slide/image', async (req, res) => {
    const {
      slideIndex,
      totalSlides,
      title,
      body,
      visualPrompt,
      primaryColor,
      backgroundColor,
      textColor,
      accentColor,
      brandName,
    } = req.body ?? {};

    if (typeof slideIndex !== 'number' || typeof totalSlides !== 'number') {
      return res.status(400).json({ error: 'slideIndex and totalSlides are required numbers.' });
    }

    if (!String(title || '').trim() && !String(body || '').trim()) {
      return res.status(400).json({ error: 'title or body is required.' });
    }

    try {
      const imageUrl = await generateSlideImageWithOpenAI({
        slideIndex,
        totalSlides,
        title: String(title || '').trim(),
        body: String(body || '').trim(),
        visualPrompt: String(visualPrompt || 'Premium editorial Instagram carousel slide'),
        primaryColor: String(primaryColor || '#9900ff'),
        backgroundColor: String(backgroundColor || '#141414'),
        textColor: String(textColor || '#f5f5f5'),
        accentColor: String(accentColor || '#9900ff'),
        brandName: String(brandName || ''),
      });

      res.json({ imageUrl });
    } catch (error) {
      console.error('Slide image generation failed', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate slide image.' });
    }
  });

  app.post('/api/ai/groq/chat', async (req, res) => {
    const { messages, responseFormat, temperature, maxTokens, model } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }

    try {
      const result = await routeTextGeneration({
        capability: 'structured_text',
        messages,
        responseFormat,
        temperature,
        maxTokens,
        model,
      });

      res.json(result);
    } catch (error) {
      console.error('Structured chat failed', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate text.' });
    }
  });

  // Instagram OAuth Routes
  app.get('/api/auth/instagram/status', async (_req, res) => {
    try {
      const status = await getInstagramStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load Instagram status.' });
    }
  });

  app.delete('/api/auth/instagram/connection', async (_req, res) => {
    try {
      await disconnectInstagram();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to disconnect Instagram.' });
    }
  });

  app.get('/api/auth/instagram/url', (req, res) => {
    try {
      const redirectUri = process.env.INSTAGRAM_REDIRECT_URI?.trim() || `${req.protocol}://${req.get('host')}/auth/callback`;
      const url = buildInstagramAuthUrl(redirectUri);
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to build Instagram auth URL.' });
    }
  });

  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const errorReason = typeof req.query.error_description === 'string' ? req.query.error_description : '';
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI?.trim() || `${req.protocol}://${req.get('host')}/auth/callback`;

    if (!code) {
      const failureMessage = escapeForInlineScript(errorReason || 'Instagram OAuth failed.');
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${failureMessage}' }, '*');
                window.close();
              } else {
                document.body.innerText = '${failureMessage}';
              }
            </script>
            <p>Falha na autenticação do Instagram.</p>
          </body>
        </html>
      `);
    }

    try {
      const connection = await completeInstagramOAuth(code, redirectUri);
      const payload = escapeForInlineScript(JSON.stringify(connection));

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', connection: JSON.parse('${payload}') }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticação concluída. Esta janela será fechada automaticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      const message = escapeForInlineScript(error instanceof Error ? error.message : 'Instagram OAuth failed.');
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${message}' }, '*');
                window.close();
              } else {
                document.body.innerText = '${message}';
              }
            </script>
            <p>Falha na autenticação do Instagram.</p>
          </body>
        </html>
      `);
    }
  });

  app.get('/api/instagram/schedules', async (_req, res) => {
    try {
      const jobs = await listInstagramJobs();
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load Instagram schedules.' });
    }
  });

  // Instagram Publishing Route
  app.post('/api/instagram/publish', async (req, res) => {
    try {
      const {
        localPostId,
        image_url,
        caption,
        scheduled_at,
        day,
        format,
        theme,
      } = req.body ?? {};

      const result = await queueInstagramPublication({
        localPostId: String(localPostId || ''),
        imageUrl: String(image_url || ''),
        caption: String(caption || ''),
        scheduledAt: String(scheduled_at || ''),
        day: typeof day === 'string' ? day : '',
        format: typeof format === 'string' ? format : '',
        theme: typeof theme === 'string' ? theme : '',
      });

      res.json({
        success: true,
        mode: result.mode,
        job: result.job,
        account: result.account,
        message: result.mode === 'published'
          ? 'Post publicado no Instagram com sucesso.'
          : 'Post programado no Instagram com sucesso.',
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to sync Instagram publication.' });
    }
  });

  // EloCut routes
  const eloCutProjects = new Map<string, EloCutProject & { renderProgress?: number }>();

  const eloCutUpload = multer({
    dest: path.join(process.cwd(), 'uploads', 'elocut'),
    limits: { fileSize: 500 * 1024 * 1024 },
  });

  app.get('/api/elocut/history', async (_req, res) => {
    try {
      const projects = await listEloCutProjectRecords();
      res.json({ projects });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load EloCut history.' });
    }
  });

  app.post('/api/elocut/upload', eloCutUpload.single('video'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de vídeo é obrigatório.' });
    }

    try {
      const project = createEloCutProject(req.file.path);
      eloCutProjects.set(project.id, project);
      await syncEloCutProjectRecord(project, {
        sourceFileName: req.file.originalname,
        title: path.parse(req.file.originalname).name,
        renderProgress: 0,
      });
      res.json({ projectId: project.id });

      (async () => {
        try {
          project.status = 'transcribing';
          await syncEloCutProjectRecord(project, { renderProgress: 0 });
          project.transcription = await transcribeVideo(project.inputVideoPath);
          await syncEloCutProjectRecord(project, { renderProgress: 0 });

          project.status = 'analyzing';
          await syncEloCutProjectRecord(project, { renderProgress: 0 });
          project.scenes = await analyzeTranscriptWithClaude(project.transcription);

          if (project.scenes.length > 0) {
            project.totalDuration = project.scenes[project.scenes.length - 1].endTime;
          }

          await syncEloCutProjectRecord(project, { renderProgress: 0 });

          project.status = 'rendering';
          let lastPersistedProgress = 0;
          await buildEloCutEditPlan(project);
          await syncEloCutProjectRecord(project, { renderProgress: 0 });
          await renderEloCutVideo(project, (progress) => {
            (project as EloCutProject & { renderProgress?: number }).renderProgress = progress;
            if (progress === 100 || progress - lastPersistedProgress >= 5) {
              lastPersistedProgress = progress;
              void syncEloCutProjectRecord(project, { renderProgress: progress });
            }
          });

          project.status = 'complete';
          (project as EloCutProject & { renderProgress?: number }).renderProgress = 100;
          await syncEloCutProjectRecord(project, { renderProgress: 100 });
        } catch (err) {
          project.status = 'error';
          project.error = err instanceof Error ? err.message : 'Pipeline error.';
          await syncEloCutProjectRecord(project, {
            renderProgress: (project as EloCutProject & { renderProgress?: number }).renderProgress ?? 0,
          });
          console.error(`[EloCut] Pipeline failed for ${project.id}:`, err);
        }
      })();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start EloCut project.' });
    }
  });

  app.get('/api/elocut/project/:id/status', async (req, res) => {
    const project = eloCutProjects.get(req.params.id);
    if (project) {
      const resolvedOutputPath = resolveEloCutOutputPath(project.id, project.outputVideoPath);
      if (project.status === 'complete' && resolvedOutputPath) {
        project.outputVideoPath = resolvedOutputPath;
      } else if (project.status === 'complete' && !resolvedOutputPath) {
        project.status = 'error';
        project.error = 'Rendered file is missing on disk. Please render the project again.';
      }

      await syncEloCutProjectRecord(project, {
        renderProgress: (project as EloCutProject & { renderProgress?: number }).renderProgress ?? 0,
      });
    }

    const record = await getEloCutProjectRecord(req.params.id);
    if (!record) return res.status(404).json({ error: 'Project not found.' });

    res.json(record);
  });

  app.patch('/api/elocut/project/:id/control', async (req, res) => {
    try {
      const project = await updateEloCutProjectControl(req.params.id, {
        title: typeof req.body?.title === 'string' ? req.body.title : undefined,
        publicationStatus: req.body?.publicationStatus,
        publicationPlatform: typeof req.body?.publicationPlatform === 'string' ? req.body.publicationPlatform : undefined,
        publicationUrl: typeof req.body?.publicationUrl === 'string' ? req.body.publicationUrl : undefined,
        publicationNotes: typeof req.body?.publicationNotes === 'string' ? req.body.publicationNotes : undefined,
      });
      res.json({ project });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update EloCut control.';
      res.status(message === 'Project not found.' ? 404 : 400).json({ error: message });
    }
  });

  app.delete('/api/elocut/project/:id', async (req, res) => {
    const liveProject = eloCutProjects.get(req.params.id);
    if (liveProject && !['complete', 'error', 'pending'].includes(liveProject.status)) {
      return res.status(409).json({ error: 'Project is still being processed. Wait for the pipeline to finish before deleting it.' });
    }

    try {
      const deletedProject = await deleteEloCutProjectRecord(req.params.id, {
        deleteInputFile: true,
        deleteOutputFile: true,
      });

      eloCutProjects.delete(req.params.id);
      res.json({ project: deletedProject, deleted: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete EloCut project.';
      res.status(message === 'Project not found.' ? 404 : 400).json({ error: message });
    }
  });

  app.get('/api/elocut/project/:id/media/:variant', async (req, res) => {
    const liveProject = eloCutProjects.get(req.params.id);
    const record = await getEloCutProjectRecord(req.params.id);

    if (!liveProject && !record) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const variant = req.params.variant;
    let mediaPath: string | null = null;
    let inlineFilename = `${req.params.id}.mp4`;

    if (variant === 'edited') {
      mediaPath = resolveEloCutEditedPath(req.params.id, liveProject?.editedVideoPath);
      inlineFilename = `${req.params.id}_edited_base.mp4`;
    } else if (variant === 'output') {
      mediaPath = resolveEloCutOutputPath(req.params.id, liveProject?.outputVideoPath || record?.outputVideoPath);
      inlineFilename = `${req.params.id}_output.mp4`;
    } else {
      return res.status(404).json({ error: 'Media variant not found.' });
    }

    if (!mediaPath) {
      return res.status(404).json({ error: 'Requested media file is not available on disk.' });
    }

    try {
      streamVideoFile(req, res, mediaPath, inlineFilename);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to stream EloCut media.' });
      } else {
        res.destroy();
      }
    }
  });

  app.get('/api/elocut/project/:id/download', async (req, res) => {
    const liveProject = eloCutProjects.get(req.params.id);
    const record = await getEloCutProjectRecord(req.params.id);

    if (!record) return res.status(404).json({ error: 'Project not found.' });
    if (record.status !== 'complete' && record.status !== 'error') {
      return res.status(409).json({ error: 'Video is not ready yet.' });
    }

    const resolvedOutputPath = resolveEloCutOutputPath(record.id, record.outputVideoPath || liveProject?.outputVideoPath);
    if (!resolvedOutputPath) {
      const missingOutputMessage = 'Rendered file is missing on disk. Please render the project again.';
      if (liveProject) {
        liveProject.status = 'error';
        liveProject.error = missingOutputMessage;
        await syncEloCutProjectRecord(liveProject, {
          renderProgress: (liveProject as EloCutProject & { renderProgress?: number }).renderProgress ?? 0,
        });
      } else {
        await syncEloCutProjectRecord({
          id: record.id,
          inputVideoPath: record.inputVideoPath,
          outputVideoPath: record.outputVideoPath,
          transcription: record.transcription,
          scenes: record.scenes,
          totalDuration: record.totalDuration,
          fps: record.fps,
          status: 'error',
          error: missingOutputMessage,
          createdAt: record.createdAt,
        }, {
          title: record.title,
          sourceFileName: record.sourceFileName,
          renderProgress: record.renderProgress ?? 0,
        });
      }

      return res.status(409).json({ error: missingOutputMessage });
    }

    const stat = fs.statSync(resolvedOutputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size.toString());
    res.setHeader('Content-Disposition', `attachment; filename="elocut_${record.id}.mp4"`);

    const stream = fs.createReadStream(resolvedOutputPath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read rendered video from disk.' });
        return;
      }

      res.destroy();
    });
    stream.pipe(res);
  });

  // ── EditAI routes ──────────────────────────────────────────────────────────
  const editAIPresets = new Set<EditAIEditPreset>(['auto', 'clean', 'kinetic', 'cinematic']);

  const editAIUpload = multer({
    dest: path.join(process.cwd(), 'uploads', 'editai'),
    limits: { fileSize: 500 * 1024 * 1024 },
  });

  app.get('/api/editai/history', async (_req, res) => {
    try {
      const projects = await listEditAIProjects();
      res.json({ projects });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load EditAI history.' });
    }
  });

  app.post('/api/editai/upload', editAIUpload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo de vídeo é obrigatório.' });

    try {
      const rawFormato = req.body?.formatoDestino;
      const formatoDestino = rawFormato === 'youtube' ? 'youtube' : 'reels';
      const project = createEditAIProject(req.file.path, req.file.originalname, formatoDestino);
      await syncEditAIProject(project);
      res.json({ projectId: project.id });

      (async () => {
        try {
          await runStage1Normalize(project.id);
          await runStage2Transcribe(project.id);
          await runStage3BuildCutReport(project.id);
        } catch (err) {
          console.error(`[EditAI] Pipeline stages 1-3 failed for ${project.id}:`, err);
        }
      })();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start EditAI project.' });
    }
  });

  app.get('/api/editai/project/:id', async (req, res) => {
    const project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json(project);
  });

  app.patch('/api/editai/project/:id/settings', async (req, res) => {
    let project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    try {
      if (req.body?.editPreset !== undefined) {
        const editPreset = req.body.editPreset as EditAIEditPreset;
        if (!editAIPresets.has(editPreset)) {
          return res.status(400).json({ error: 'Invalid EditAI preset.' });
        }
        project.editPreset = editPreset;
      }

      project = await syncEditAIProject(project);
      res.json({ project });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update EditAI settings.' });
    }
  });

  app.get('/api/editai/project/:id/timeline', async (req, res) => {
    const project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    try {
      const mediaPaths = {
        original: project.originalPath,
        normalized: project.normalizedPath,
        cut: project.cutPath,
        output: project.renderPath,
      };
      const [normalizedInfo, cutInfo, outputInfo] = await Promise.all([
        probeVideoInfoSafe(project.normalizedPath),
        probeVideoInfoSafe(project.cutPath),
        probeVideoInfoSafe(project.renderPath),
      ]);
      const mediaAvailable = {
        original: Boolean(project.originalPath && fs.existsSync(project.originalPath)),
        normalized: Boolean(normalizedInfo),
        cut: Boolean(cutInfo),
        output: Boolean(outputInfo),
      };
      const sourceDuration = normalizedInfo?.duration
        ?? project.words[project.words.length - 1]?.end
        ?? 0;
      const approvedCuts = normalizeApprovedCuts(project.cutReport, sourceDuration);
      const keptSegments = buildKeptSegments(sourceDuration, approvedCuts);
      const keptDuration = getKeptDuration(keptSegments);
      const removedDuration = Math.max(0, sourceDuration - keptDuration);

      res.json({
        projectId: project.id,
        status: project.status,
        fps: project.fps,
        sourceDuration,
        cutDuration: cutInfo?.duration ?? null,
        outputDuration: outputInfo?.duration ?? null,
        removedDuration,
        keptDuration,
        removalRatio: sourceDuration > 0 ? removedDuration / sourceDuration : 0,
        mediaAvailable,
        media: {
          normalized: mediaAvailable.normalized ? `/api/editai/project/${project.id}/media/normalized` : null,
          cut: mediaAvailable.cut ? `/api/editai/project/${project.id}/media/cut` : null,
          output: mediaAvailable.output ? `/api/editai/project/${project.id}/media/output` : null,
        },
        cuts: project.cutReport,
        approvedCuts,
        keptSegments,
        words: project.words,
        scenes: project.scenes,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to build EditAI timeline.' });
    }
  });

  app.patch('/api/editai/project/:id/cuts', async (req, res) => {
    let project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (!Array.isArray(req.body?.cuts)) return res.status(400).json({ error: 'cuts array required.' });

    try {
      const updates = new Map<string, Partial<EditAICutReport>>();
      for (const raw of req.body.cuts) {
        const id = typeof raw?.id === 'string' ? raw.id : '';
        if (id) updates.set(id, raw as Partial<EditAICutReport>);
      }
      const existingIds = new Set(project.cutReport.map((cut) => cut.id).filter(Boolean));

      project.cutReport = project.cutReport.map((cut) => {
        const update = cut.id ? updates.get(cut.id) : undefined;
        if (!update) return cut;
        const status = update.status === 'approved' || update.status === 'rejected' || update.status === 'pending'
          ? update.status
          : cut.status;
        return {
          ...cut,
          ...update,
          status,
          aprovado: status === 'approved',
        };
      });
      for (const [id, update] of updates) {
        if (existingIds.has(id)) continue;
        const inicio = Number(update.inicio);
        const fim = Number(update.fim);
        const tipo = update.tipo === 'silencio' || update.tipo === 'gaguejo' || update.tipo === 'refazimento'
          ? update.tipo
          : 'refazimento';
        if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) continue;
        const status = update.status === 'approved' || update.status === 'rejected' || update.status === 'pending'
          ? update.status
          : update.source === 'manual'
            ? 'approved'
            : 'pending';
        project.cutReport.push({
          id,
          tipo,
          inicio,
          fim,
          duracao: fim - inicio,
          preview: String(update.preview || 'Corte manual'),
          aprovado: status === 'approved',
          status,
          confidence: typeof update.confidence === 'number' ? update.confidence : 1,
          reason: update.reason || 'Corte manual criado no workspace.',
          source: update.source || 'manual',
          riskLevel: update.riskLevel || (fim - inicio > 2.5 ? 'high' : fim - inicio > 1.2 ? 'medium' : 'low'),
        });
      }

      project = await syncEditAIProject(project);
      res.json({ project, cuts: project.cutReport });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update cuts.' });
    }
  });

  app.post('/api/editai/project/:id/cuts/reanalyze', async (req, res) => {
    let project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (!Array.isArray(project.words) || project.words.length < 2) {
      return res.status(400).json({ error: 'Projeto ainda nao tem palavras suficientes para reanalisar cortes.' });
    }

    try {
      const manualCuts = project.cutReport.filter((cut) => cut.source === 'manual');
      const info = await probeVideoInfo(project.normalizedPath);
      const audioSilences = await detectAudioSilenceRanges(project.normalizedPath, info.duration);
      const nextAiCuts = buildCutReport(project.words, project.formatoDestino, {
        audioSilences,
        totalDuration: info.duration,
      });
      project.cutReport = [...nextAiCuts, ...manualCuts].sort((a, b) => a.inicio - b.inicio);
      project.status = 'awaiting_approval';
      project = await syncEditAIProject(project);
      res.json({ project, cuts: project.cutReport });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reanalyze EditAI cuts.' });
    }
  });

  app.post('/api/editai/project/:id/apply-cuts', async (req, res) => {
    const project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (project.status !== 'awaiting_approval') {
      return res.status(409).json({ error: `Cannot apply cuts in status "${project.status}". Expected "awaiting_approval".` });
    }

    const cuts: EditAICutReport[] = Array.isArray(req.body?.cuts) ? req.body.cuts : project.cutReport;

    try {
      res.json({ ok: true, message: 'Applying approved cuts and generating visual plan.' });
      await runStage3ExecuteCuts(req.params.id, cuts);
      await runStage4APlan(req.params.id);
    } catch (err) {
      console.error(`[EditAI] Apply cuts failed for ${req.params.id}:`, err);
    }
  });

  app.post('/api/editai/project/:id/generate-scenes', async (req, res) => {
    let project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (project.status !== 'awaiting_plan') {
      return res.status(409).json({ error: `Cannot generate scenes in status "${project.status}". Expected "awaiting_plan".` });
    }

    if (typeof req.body?.planText === 'string' && req.body.planText.trim()) {
      project.planText = req.body.planText.trim();
    }
    project.planApproved = true;
    await syncEditAIProject(project);

    try {
      res.json({ ok: true, message: 'Generating scenes from approved plan.' });
      await runStage4BScenes(req.params.id);
    } catch (err) {
      console.error(`[EditAI] Generate scenes failed for ${req.params.id}:`, err);
    }
  });

  app.post('/api/editai/project/:id/cuts/approve', async (req, res) => {
    const project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (project.status !== 'awaiting_approval') {
      return res.status(409).json({ error: `Cannot approve cuts in status "${project.status}". Expected "awaiting_approval".` });
    }

    const cuts: EditAICutReport[] = Array.isArray(req.body?.cuts) ? req.body.cuts : project.cutReport;

    try {
      res.json({ ok: true, message: 'Cuts approved. Running Stage 3b + Stage 4A...' });
      await runStage3ExecuteCuts(req.params.id, cuts);
      await runStage4APlan(req.params.id);
    } catch (err) {
      console.error(`[EditAI] Cuts/plan failed for ${req.params.id}:`, err);
    }
  });

  app.post('/api/editai/project/:id/plan/approve', async (req, res) => {
    let project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (project.status !== 'awaiting_plan') {
      return res.status(409).json({ error: `Cannot approve plan in status "${project.status}". Expected "awaiting_plan".` });
    }

    // Allow user to edit planText before approving
    if (typeof req.body?.planText === 'string' && req.body.planText.trim()) {
      project.planText = req.body.planText.trim();
    }
    project.planApproved = true;
    await syncEditAIProject(project);

    try {
      res.json({ ok: true, message: 'Plan approved. Running Stage 4B...' });
      await runStage4BScenes(req.params.id);
    } catch (err) {
      console.error(`[EditAI] Stage 4B failed for ${req.params.id}:`, err);
    }
  });

  app.put('/api/editai/project/:id/scenes', async (req, res) => {
    let project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (!Array.isArray(req.body?.scenes)) return res.status(400).json({ error: 'scenes array required.' });

    try {
      project.scenes = req.body.scenes;
      await syncEditAIProject(project);
      res.json({ project });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update scenes.' });
    }
  });

  app.post('/api/editai/project/:id/render', async (req, res) => {
    const project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    if (project.status !== 'ready' && project.status !== 'done') {
      return res.status(409).json({ error: `Cannot render in status "${project.status}". Expected "ready" or "done".` });
    }

    try {
      res.json({ ok: true, message: 'Render started.' });
      await runStage5Render(project.id);
    } catch (err) {
      console.error(`[EditAI] Render failed for ${project.id}:`, err);
    }
  });

  app.get('/api/editai/project/:id/media/:variant', async (req, res) => {
    const project = await getEditAIProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const variantMap: Record<string, string> = {
      normalized: project.normalizedPath,
      cut: project.cutPath,
      output: project.renderPath,
    };
    const mediaPath = variantMap[req.params.variant];
    if (!mediaPath || !fs.existsSync(mediaPath)) {
      return res.status(404).json({ error: 'Media file not available on disk.' });
    }

    try {
      streamVideoFile(req, res, mediaPath, `${project.id}_${req.params.variant}.mp4`);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to stream EditAI media.' });
      }
    }
  });

  app.get('/favicon.ico', (_req, res) => {
    res.status(204).end();
  });

  app.delete('/api/editai/project/:id', async (req, res) => {
    try {
      await deleteEditAIProject(req.params.id, { deleteFiles: true });
      res.json({ deleted: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete EditAI project.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/render/branding/png-pack', async (req, res) => {
    const { slides, width, height } = req.body ?? {};

    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ error: 'Slides are required to render PNGs.' });
    }

    try {
      const renderedSlides = await renderBrandingSlidesToPng(slides, {
        width: Number.isFinite(Number(width)) && Number(width) > 0 ? Number(width) : undefined,
        height: Number.isFinite(Number(height)) && Number(height) > 0 ? Number(height) : undefined,
      });

      res.json({ images: renderedSlides });
    } catch (error) {
      console.error('PNG render failed', error);
      res.status(500).json({ error: 'Failed to render branding PNGs.' });
    }
  });

  // ─── Design Studio Export Routes ──────────────────────────────────────────

  app.post('/api/design-studio/export-png', async (req, res) => {
    const { html, width, height } = req.body ?? {};
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'html is required.' });
    }
    try {
      const buf = await screenshotHtml(
        html,
        Number(width) > 0 ? Number(width) : 1200,
        Number(height) > 0 ? Number(height) : 800,
      );
      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', 'attachment; filename="design.png"');
      res.send(buf);
    } catch (err) {
      console.error('Design Studio PNG export failed', err);
      res.status(500).json({ error: 'PNG export failed.' });
    }
  });

  app.post('/api/design-studio/export-pdf', async (req, res) => {
    const { html, width, height, isPresentation } = req.body ?? {};
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'html is required.' });
    }
    try {
      const buf = isPresentation
        ? await exportPresentationToPdf(html)
        : await exportHtmlToPdf(
            html,
            Number(width) > 0 ? Number(width) : 1200,
            Number(height) > 0 ? Number(height) : 800,
          );
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'attachment; filename="design.pdf"');
      res.send(buf);
    } catch (err) {
      console.error('Design Studio PDF export failed', err);
      res.status(500).json({ error: 'PDF export failed.' });
    }
  });

  app.post('/api/design-studio/export-pptx', async (req, res) => {
    const { html, title } = req.body ?? {};
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'html is required.' });
    }
    try {
      const buf = await exportPresentationToPptx(html, title ?? 'Design Studio Presentation');
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.set('Content-Disposition', `attachment; filename="${(title ?? 'presentation').replace(/[^a-z0-9]/gi, '_')}.pptx"`);
      res.send(buf);
    } catch (err) {
      console.error('Design Studio PPTX export failed', err);
      res.status(500).json({ error: 'PPTX export failed.' });
    }
  });

  app.post('/api/design-studio/motion-frames', async (req, res) => {
    const { html, width, height, durationMs, fps } = req.body ?? {};
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'html is required.' });
    }
    try {
      const frames = await captureMotionFrames(
        html,
        Number(width) > 0 ? Number(width) : 960,
        Number(height) > 0 ? Number(height) : 540,
        Number(durationMs) > 0 ? Number(durationMs) : 3000,
        Number(fps) > 0 ? Number(fps) : 10,
      );
      res.json({ frames });
    } catch (err) {
      console.error('Design Studio motion frames failed', err);
      res.status(500).json({ error: 'Motion frame capture failed.' });
    }
  });

  // ─── Squad Manager Routes ─────────────────────────────────────────────────

  app.get('/api/squads', async (_req, res) => {
    const { listSquads } = await import('./services/squadRegistry.js');
    try { res.json({ squads: await listSquads() }); }
    catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.post('/api/squads', async (req, res) => {
    const { createSquad } = await import('./services/squadRegistry.js');
    try { res.status(201).json(await createSquad(req.body ?? {})); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/squads/runs', async (req, res) => {
    const { listSquadRuns } = await import('./services/squadRunRegistry.js');
    try {
      const squadId = typeof req.query.squadId === 'string' ? req.query.squadId : undefined;
      res.json({ runs: await listSquadRuns(squadId) });
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/squads/:id', async (req, res) => {
    const { getSquad } = await import('./services/squadRegistry.js');
    try {
      const squad = await getSquad(req.params.id);
      if (!squad) return res.status(404).json({ error: 'Squad not found.' });
      res.json(squad);
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.put('/api/squads/:id', async (req, res) => {
    const { updateSquad } = await import('./services/squadRegistry.js');
    try { res.json(await updateSquad(req.params.id, req.body ?? {})); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.delete('/api/squads/:id', async (req, res) => {
    const { deleteSquad } = await import('./services/squadRegistry.js');
    try { await deleteSquad(req.params.id); res.status(204).send(); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  // Create run
  app.post('/api/squads/:id/runs', async (req, res) => {
    const { getSquad } = await import('./services/squadRegistry.js');
    const { createSquadRun } = await import('./services/squadRunRegistry.js');
    try {
      const squad = await getSquad(req.params.id);
      if (!squad) return res.status(404).json({ error: 'Squad not found.' });
      const task = String(req.body?.task || '').trim();
      if (!task) return res.status(400).json({ error: 'task is required.' });
      const run = await createSquadRun({
        squadId: squad.id,
        squadName: squad.name,
        task,
        stages: squad.agents.map((a) => ({
          agentId: a.id,
          agentName: a.name,
          agentRole: a.role,
          agentColor: a.color,
          input: '',
          userFeedback: undefined,
        })),
      });
      res.status(201).json(run);
    } catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/squads/runs/:runId', async (req, res) => {
    const { getSquadRun } = await import('./services/squadRunRegistry.js');
    try {
      const run = await getSquadRun(req.params.runId);
      if (!run) return res.status(404).json({ error: 'Run not found.' });
      res.json(run);
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  // Execute stage with SSE streaming
  app.post('/api/squads/runs/:runId/stages/:stageIndex/execute', async (req, res) => {
    const { getSquadRun, updateSquadRun, updateSquadRunStage } = await import('./services/squadRunRegistry.js');
    const { getSquad } = await import('./services/squadRegistry.js');
    const { routeTextGeneration } = await import('./services/aiProviderRegistry.js');
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');

    let brandContext = '';
    try {
      brandContext = await readFile(join(process.cwd(), 'shared/brand/brand-guidelines.md'), 'utf8');
    } catch { /* brand guidelines optional */ }

    let carouselContext = '';
    try {
      carouselContext = await readFile(join(process.cwd(), 'shared/brand/carousel-director.md'), 'utf8');
    } catch { /* carousel director optional */ }

    const stageIndex = Number(req.params.stageIndex);
    const userFeedback = String(req.body?.userFeedback || '').trim();

    try {
      const run = await getSquadRun(req.params.runId);
      if (!run) return res.status(404).json({ error: 'Run not found.' });
      if (stageIndex < 0 || stageIndex >= run.stages.length) return res.status(400).json({ error: 'Invalid stage.' });

      const squad = await getSquad(run.squadId);
      if (!squad) return res.status(404).json({ error: 'Squad not found.' });
      const agent = squad.agents.find((a) => a.id === run.stages[stageIndex]!.agentId);
      if (!agent) return res.status(404).json({ error: 'Agent not found.' });

      // Build context: previous stages + user feedback
      const previousContext = run.stages
        .slice(0, stageIndex)
        .filter((s) => s.status === 'done' && s.output)
        .map((s) => `### ${s.agentName} (${s.agentRole})\n${s.output}${s.userFeedback ? `\n\n**Direção do usuário:** ${s.userFeedback}` : ''}`)
        .join('\n\n---\n\n');

      const userMessage = [
        `**Tarefa:** ${run.task}`,
        previousContext ? `\n\n**Contexto das etapas anteriores:**\n\n${previousContext}` : '',
        userFeedback ? `\n\n**Direção para esta etapa:** ${userFeedback}` : '',
      ].join('');

      // Update run state
      await updateSquadRunStage(run.id, stageIndex, {
        status: 'running',
        input: userMessage,
        userFeedback: userFeedback || undefined,
        startedAt: new Date().toISOString(),
      });
      await updateSquadRun(run.id, { status: 'running', currentStageIndex: stageIndex });

      // SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const send = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const ROUTABLE = new Set(['text_generation', 'structured_text', 'search_grounded_text']);
        const capability = ROUTABLE.has(agent.capability) ? agent.capability as 'text_generation' : 'text_generation';
        const systemPrompt = [
          agent.systemPrompt,
          brandContext ? `\n\n---\n## BRAND GUIDELINES (referência obrigatória)\n${brandContext}` : '',
          carouselContext ? `\n\n---\n## CAROUSEL DIRECTOR (técnica de arte para carrosséis)\n${carouselContext}` : '',
        ].join('');
        const result = await routeTextGeneration({
          capability,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          maxTokens: 4096,
        });

        const fullOutput = result.content;
        send('token', { text: fullOutput });

        // Mark stage done
        await updateSquadRunStage(run.id, stageIndex, {
          status: 'done',
          output: fullOutput,
          finishedAt: new Date().toISOString(),
        });

        const isLast = stageIndex === run.stages.length - 1;
        await updateSquadRun(run.id, {
          status: isLast ? 'done' : 'waiting_input',
          currentStageIndex: stageIndex,
          finishedAt: isLast ? new Date().toISOString() : undefined,
        });

        send('done', { stageIndex, isLast, output: fullOutput });
      } catch (streamErr) {
        const msg = streamErr instanceof Error ? streamErr.message : 'Erro ao executar agente.';
        await updateSquadRunStage(run.id, stageIndex, { status: 'error', output: msg });
        await updateSquadRun(run.id, { status: 'error' });
        send('error', { message: msg });
      }

      res.end();
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' });
    }
  });

  // ── Background job store for slide rendering ─────────────────────────────
  type SlideJob = {
    status: 'rendering' | 'done' | 'error';
    progress: number;
    total: number;
    slides: Array<{ id: number; filename: string; dataUrl: string }>;
    error?: string;
    createdAt: number;
  };
  const slideJobs = new Map<string, SlideJob>();

  // Poll job status
  app.get('/api/squads/runs/:runId/render-slides/status/:jobId', (req, res) => {
    const job = slideJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    res.json({ status: job.status, progress: job.progress, total: job.total, slides: job.status === 'done' ? job.slides : [], error: job.error });
  });

  // Render squad run output as premium carousel slides — background job
  app.post('/api/squads/runs/:runId/render-slides', async (req, res) => {
    const { getSquadRun } = await import('./services/squadRunRegistry.js');
    const { routeTextGeneration, routeImageGeneration } = await import('./services/aiProviderRegistry.js');
    const puppeteer = (await import('puppeteer')).default;
    const { readFile: readFileFn } = await import('fs/promises');
    const { join: joinPath } = await import('path');

    // Build premium slide HTML — faithful to Entrelaços reference style
    const buildSlideHtml = (slide: {
      id: number; eyebrow?: string; title: string; body?: string;
      highlight?: string; bullets?: string[]; type?: string; cta?: string;
      stats?: Array<{ value: string; label: string }>;
      total: number; bgImage?: string; light?: boolean;
    }) => {
      const type = slide.type || (slide.id === 1 ? 'cover' : 'content');
      // Strip ALL markdown markers from fields
      const cleanText = (s?: string) => (s || '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').trim();
      const accentWord = cleanText(slide.highlight);
      // Apply accent color — no asterisks ever appear in output
      const applyAccent = (raw: string, color = '#7C3AED') => {
        const text = cleanText(raw);
        if (!accentWord || !text.toLowerCase().includes(accentWord.toLowerCase())) return text;
        return text.replace(new RegExp(`(${accentWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'),
          `<span style="color:${color};font-weight:800">$1</span>`);
      };

      // No Google Fonts — use system stack to avoid networkidle0 timeout
      const F = `/* system fonts — fast render, no network wait */`;

      // Celtic Knot 2D logo — nó celta entrelaçado
      const celticKnot = (size=40, light=false) => {
        const s = light ? '#5B21B6' : '#A78BFA';
        const s2 = light ? '#7C3AED' : '#7C3AED';
        const bg = light ? 'white' : '#0D0B16';
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ck${size}" x1="0" y1="0" x2="1" y2="1">
              <stop stop-color="${s}"/>
              <stop offset="1" stop-color="${s2}"/>
            </linearGradient>
          </defs>
          <!-- Outer ring - left lobe -->
          <path d="M50 22 C38 22,22 33,22 50 C22 62,30 72,40 76" stroke="url(#ck${size})" stroke-width="6" stroke-linecap="round" fill="none"/>
          <!-- Outer ring - right lobe -->
          <path d="M50 22 C62 22,78 33,78 50 C78 62,70 72,60 76" stroke="url(#ck${size})" stroke-width="6" stroke-linecap="round" fill="none"/>
          <!-- Bottom cross-arc (Celtic weave - over) -->
          <path d="M40 76 C44 82,50 84,56 82 C60 80,62 78,60 76" stroke="url(#ck${size})" stroke-width="6" stroke-linecap="round" fill="none"/>
          <!-- Center crossing — horizontal bridge (under) -->
          <rect x="44" y="47" width="12" height="6" fill="${bg}"/>
          <!-- Inner loop - top left -->
          <path d="M50 38 C44 38,35 43,35 50 C35 58,43 64,50 62" stroke="url(#ck${size})" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".7"/>
          <!-- Inner loop - top right -->
          <path d="M50 38 C56 38,65 43,65 50 C65 58,57 64,50 62" stroke="url(#ck${size})" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".7"/>
          <!-- Center dot -->
          <circle cx="50" cy="50" r="3.5" fill="${s2}" opacity=".9"/>
          <!-- Top dot -->
          <circle cx="50" cy="15" r="4.5" fill="#FF7A1A" ${light?'':'filter="drop-shadow(0 0 3px #FF7A1A)"'}/>
        </svg>`;
      };

      const logoBlock = (dark=false) => `<div style="display:flex;align-items:center;gap:12px">
        ${celticKnot(36, dark)}
        <div>
          <div style="font-size:20px;font-weight:800;letter-spacing:.04em;color:${dark?'#18181B':'#F8F7FF'};line-height:1">ENTRELAÇOS</div>
          <div style="font-size:11px;font-weight:600;letter-spacing:.28em;color:${dark?'#71717A':'rgba(248,247,255,.45)'};margin-top:1px">PSICOLOGIA</div>
        </div>
      </div>`;

      const counter = (dark=false) => `<span style="font-size:16px;'Courier New',Courier,monospace;color:${dark?'#A1A1AA':'rgba(248,247,255,.35)'};letter-spacing:.06em">${String(slide.id).padStart(2,'0')} / ${String(slide.total).padStart(2,'0')}</span>`;

      const grain = `<div style="position:absolute;inset:0;pointer-events:none;opacity:.45;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.05%22/%3E%3C/svg%3E');background-size:200px"></div>`;

      const brandBar = (light=false) => `<div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">${logoSvg}<span style="font-size:20px;font-weight:700;letter-spacing:-.02em;color:${light?'#18181B':'#F8F7FF'};opacity:.9">entrelaços<em style="font-style:normal;color:#7C3AED">.psi</em></span></div>
        <span style="font-size:16px;'Courier New',Courier,monospace;color:${light?'#71717A':'#3F3F46'};letter-spacing:.05em">${String(slide.id).padStart(2,'0')}<span style="color:#7C3AED;margin:0 4px">/</span>${String(slide.total).padStart(2,'0')}</span>
      </div>`;

      const bottomBar = (light=false) => `<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid ${light?'rgba(0,0,0,.08)':'rgba(248,247,255,.07)'};padding-top:24px">
        <span style="font-size:17px;font-weight:500;color:${light?'#A1A1AA':'#3F3F46'};letter-spacing:.04em">@aentrelacospsicologia</span>
        <div style="display:flex;gap:6px;align-items:center">${dots}</div>
      </div>`;


      // ── shared helpers ────────────────────────────────────────────────────
      const topBar = (dark=false) => `<div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:10">
        ${logoBlock(dark)}
        ${counter(dark)}
      </div>`;

      const bottomLogo = (dark=false) => `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:32px;border-top:1px solid ${dark?'rgba(0,0,0,.10)':'rgba(248,247,255,.08)'}">
        ${logoBlock(dark)}
        <div style="font-size:13px;'Courier New',Courier,monospace;letter-spacing:.14em;text-transform:uppercase;color:${dark?'#A1A1AA':'rgba(248,247,255,.25)'}">@aentrelacospsicologia</div>
      </div>`;

      const darkBg = (alpha=0.18) => `
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse 90% 70% at 60% 20%,rgba(88,28,235,${alpha}) 0%,transparent 65%);pointer-events:none"></div>
        <div style="position:absolute;inset:0;background:radial-gradient(circle 500px at 10% 90%,rgba(124,58,237,.08) 0%,transparent 60%);pointer-events:none"></div>
        ${grain}`;

      // ── COVER (ref: slide 1) ─────────────────────────────────────────────
      if (type === 'cover') {
        const hasBg = !!slide.bgImage;
        const titleHtml = applyAccent(slide.title, '#7C3AED');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${hasBg
    ? `<div style="position:absolute;inset:0;background-image:url('${slide.bgImage}');background-size:cover;background-position:center"></div>
       <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,8,20,.98) 0%,rgba(10,8,20,.75) 45%,rgba(10,8,20,.35) 80%,rgba(10,8,20,.15) 100%)"></div>`
    : `<div style="position:absolute;inset:0;background:radial-gradient(ellipse 100% 60% at 70% 40%,rgba(88,28,235,.35) 0%,transparent 65%)"></div>
       <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 20% 80%,rgba(124,58,237,.18) 0%,transparent 60%)"></div>`
  }
  ${grain}
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:20px">
      ${slide.eyebrow ? `<div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:32px;padding:10px 20px;border-radius:100px;border:1px solid rgba(167,139,250,.30);background:rgba(124,58,237,.10);width:fit-content"><span style="width:8px;height:8px;border-radius:50%;background:#A78BFA;flex-shrink:0"></span><span style="font-size:15px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#A78BFA">${slide.eyebrow}</span></div>` : ''}
      <h1 style="font-size:${slide.title.length>40?'88px':'108px'};font-weight:900;line-height:.95;letter-spacing:-.045em;color:#F8F7FF;margin-bottom:${slide.body?'36px':'56px'};text-shadow:${hasBg?'0 2px 40px rgba(0,0,0,.9)':'0 0 60px rgba(88,28,235,.3)'}">${titleHtml}</h1>
      ${slide.body ? `<p style="font-size:28px;font-weight:400;line-height:1.5;color:rgba(248,247,255,.60);margin-bottom:40px;max-width:720px">${slide.body}</p>` : ''}
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
      }

      // ── CONTENT WITH UI PANEL (ref: slides 2 & 5) ────────────────────────
      if (type === 'content') {
        const titleHtml = applyAccent(slide.title, '#7C3AED');
        const items = slide.bullets || [];
        const uiItems = items.slice(0,5).map(item =>
          `<div style="display:flex;align-items:center;gap:14px;padding:16px 20px;border-radius:12px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.18);margin-bottom:10px">
            <div style="width:6px;height:6px;border-radius:50%;background:#A78BFA;flex-shrink:0"></div>
            <span style="font-size:22px;font-weight:500;color:rgba(248,247,255,.75)">${item}</span>
          </div>`
        ).join('');
        const hasPanel = items.length > 0;
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${darkBg(0.20)}
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;align-items:center;gap:60px;padding:40px 0">
      <div style="flex:${hasPanel?'0 0 520px':'1'};display:flex;flex-direction:column;gap:28px">
        ${slide.eyebrow ? `<span style="font-size:14px;font-weight:700;letter-spacing:.20em;text-transform:uppercase;color:rgba(167,139,250,.70)">${slide.eyebrow}</span>` : ''}
        <h2 style="font-size:${slide.title.length>50?'68px':'82px'};font-weight:900;line-height:1.0;letter-spacing:-.04em;color:#F8F7FF">${titleHtml}</h2>
        ${slide.body && !hasPanel ? `<p style="font-size:28px;font-weight:400;line-height:1.55;color:rgba(248,247,255,.55);max-width:680px">${slide.body}</p>` : ''}
      </div>
      ${hasPanel ? `<div style="flex:1;background:rgba(13,11,22,.80);border:1px solid rgba(124,58,237,.25);border-radius:24px;padding:32px;box-shadow:0 0 60px rgba(88,28,235,.18)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
          <div style="width:10px;height:10px;border-radius:50%;background:#FF5F57"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#FFBD2E"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#28C840"></div>
        </div>
        ${uiItems}
      </div>` : ''}
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
      }

      // ── QUOTE WITH AI IMAGE (ref: slide 3) ──────────────────────────────
      if (type === 'quote') {
        const hasBg = !!slide.bgImage;
        const titleHtml = applyAccent(slide.title, '#A78BFA');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${hasBg
    ? `<div style="position:absolute;inset:0;background-image:url('${slide.bgImage}');background-size:cover;background-position:center 30%"></div>
       <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(10,8,20,.15) 0%,rgba(10,8,20,.88) 55%,rgba(10,8,20,.95) 100%)"></div>`
    : `<div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at 30% 50%,rgba(88,28,235,.28) 0%,transparent 65%)"></div>`
  }
  ${grain}
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;${hasBg?'padding-left:420px':'padding:40px 0'}">
      <blockquote style="font-size:${slide.title.length>80?'54px':slide.title.length>55?'64px':'74px'};font-weight:800;line-height:1.12;letter-spacing:-.035em;color:#F8F7FF;margin-bottom:36px;text-shadow:${hasBg?'0 2px 30px rgba(0,0,0,.8)':'none'}">${titleHtml}</blockquote>
      ${slide.body ? `<div style="display:flex;align-items:center;gap:16px"><div style="width:36px;height:2px;background:#A78BFA;border-radius:1px"></div><span style="font-size:20px;font-weight:600;color:#A78BFA;letter-spacing:.08em;text-transform:uppercase">${slide.body}</span></div>` : ''}
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
      }

      // ── DUAL CARDS (ref: slide 4) — list with 2 items ─────────────────────
      if (type === 'list' && (slide.bullets||[]).length <= 2) {
        const items = slide.bullets || [];
        const icons = [
          `<svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="18" cy="26" r="12" stroke="#A78BFA" stroke-width="2.5" fill="none"/><circle cx="34" cy="26" r="12" stroke="#A78BFA" stroke-width="2.5" fill="none"/></svg>`,
          `<svg width="52" height="52" viewBox="0 0 52 52" fill="none"><rect x="8" y="8" width="16" height="16" rx="4" stroke="#A78BFA" stroke-width="2.5" fill="none"/><rect x="28" y="8" width="16" height="16" rx="4" stroke="#A78BFA" stroke-width="2.5" fill="none"/><rect x="8" y="28" width="16" height="16" rx="4" stroke="#A78BFA" stroke-width="2.5" fill="none"/><rect x="28" y="28" width="16" height="16" rx="4" stroke="#A78BFA" stroke-width="2.5" fill="none"/></svg>`,
        ];
        const dualCards = items.map((item, i) => {
          const th = applyAccent(item, '#A78BFA');
          return `<div style="flex:1;background:rgba(20,16,36,.90);border:1px solid rgba(124,58,237,.30);border-radius:28px;padding:52px 40px;display:flex;flex-direction:column;gap:32px;box-shadow:0 0 40px rgba(88,28,235,.15),inset 0 1px 0 rgba(255,255,255,.06)">
            ${icons[i] || icons[0]}
            <div style="font-size:${item.length>30?'32px':'38px'};font-weight:800;line-height:1.2;color:#F8F7FF">${th}</div>
          </div>`;
        }).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${darkBg(0.22)}
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:28px;padding:40px 0">
      ${dualCards}
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
      }

      // ── METHOD LIST (ref: slide 7) — vertical numbered cards ─────────────
      if (type === 'list') {
        const items = (slide.bullets || []).slice(0, 4);
        const methodCards = items.map((item, i) => {
          const parts = item.split(/[.:]/);
          const title = (parts[0] || item).trim();
          const subtitle = parts.slice(1).join(' ').trim();
          const th = applyAccent(title + (title.endsWith('.')?'':'.'), '#A78BFA');
          return `<div style="display:flex;align-items:center;gap:24px;padding:24px 32px;background:rgba(20,16,36,.80);border:1px solid rgba(124,58,237,.${i===0?'40':'18'});border-radius:18px">
            <span style="font-size:18px;font-weight:700;color:rgba(167,139,250,.50);'Courier New',Courier,monospace;width:28px;flex-shrink:0">${String(i+1).padStart(2,'0')}</span>
            <div style="flex:1">
              <div style="font-size:${title.length>20?'36px':'44px'};font-weight:800;line-height:1.05;letter-spacing:-.03em;color:#F8F7FF">${th}</div>
              ${subtitle ? `<div style="font-size:20px;font-weight:500;color:#7C3AED;margin-top:6px">${subtitle}</div>` : ''}
            </div>
          </div>`;
        }).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${darkBg(0.20)}
  <div style="position:absolute;left:118px;top:220px;width:3px;height:900px;background:linear-gradient(180deg,transparent,#7C3AED 15%,#A78BFA 50%,#7C3AED 85%,transparent);border-radius:2px;pointer-events:none"></div>
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:36px 0">
      ${slide.eyebrow ? `<div style="margin-bottom:4px"><span style="font-size:13px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(167,139,250,.50)">${slide.eyebrow}</span></div>` : ''}
      ${methodCards}
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
      }

      // ── DASHBOARD (ref: slide 6) ─────────────────────────────────────────
      if (type === 'dashboard' || type === 'stats') {
        const statsData = slide.stats || (slide.bullets||[]).map((b,i)=>{ const p=b.split(':'); return {value:p[0]?.trim()||`0${i+1}`,label:p[1]?.trim()||b}; });
        const titleHtml = applyAccent(slide.title, '#A78BFA');
        const metricIcons = [
          `<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><polygon points="18,4 32,28 4,28" stroke="#A78BFA" stroke-width="2" fill="none"/></svg>`,
          `<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="14" stroke="#2DD4BF" stroke-width="2" fill="none"/><circle cx="18" cy="18" r="4" fill="#2DD4BF"/></svg>`,
          `<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><polyline points="4,28 12,16 20,22 28,10 32,14" stroke="#FF7A1A" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        ];
        const mColors = ['#A78BFA','#2DD4BF','#FF7A1A'];
        const mBorders = ['rgba(124,58,237,.30)','rgba(45,212,191,.25)','rgba(255,122,26,.25)'];
        const metricCards = statsData.slice(0,3).map((s,i) => `
          <div style="flex:1;background:rgba(20,16,36,.80);border:1px solid ${mBorders[i%3]};border-radius:22px;padding:32px 28px;display:flex;flex-direction:column;gap:16px">
            ${metricIcons[i%3] || metricIcons[0]}
            <div style="font-size:${s.value.length>5?'44px':'56px'};font-weight:900;letter-spacing:-.04em;color:${mColors[i%3]};'Courier New',Courier,monospace;line-height:1">${s.value}</div>
            <div style="font-size:16px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(248,247,255,.40)">${s.label}</div>
          </div>`
        ).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${darkBg(0.22)}
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:40px">
      ${slide.eyebrow ? `<span style="font-size:13px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(167,139,250,.50)">${slide.eyebrow}</span>` : ''}
      <h2 style="font-size:${slide.title.length>55?'60px':'72px'};font-weight:900;line-height:1.05;letter-spacing:-.042em;color:#F8F7FF;max-width:900px">${titleHtml}</h2>
      <div style="display:flex;gap:20px">${metricCards}</div>
      ${slide.body ? `<div style="display:inline-flex;align-items:center;gap:16px;padding:20px 32px;background:rgba(124,58,237,.10);border:1px solid rgba(124,58,237,.22);border-radius:100px;width:fit-content"><span style="font-size:22px;color:rgba(248,247,255,.85)">${slide.body}</span><span style="font-size:20px;color:#A78BFA">→</span></div>` : ''}
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
      }

      // ── TERMINAL (ref: slide 2 panel variant) ───────────────────────────
      if (type === 'terminal') {
        const titleHtml = applyAccent(slide.title, '#7C3AED');
        const lines = (slide.bullets||[slide.body||'']).filter(Boolean);
        const termLines = lines.map((l,i) => {
          const hl = l.replace(/\b(clínica|ética|autonomia|psicologia|carreira)\b/gi, `<span style="color:#A78BFA">$1</span>`)
                      .replace(/\b(\d[\d.,k+%]+)\b/g, `<span style="color:#2DD4BF">$1</span>`)
                      .replace(/\b(ERRO|AVISO|importante)\b/gi, `<span style="color:#FF7A1A">$1</span>`);
          return `<div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid rgba(124,58,237,.12)">
            <span style="color:${i===0?'#A78BFA':'rgba(124,58,237,.35)'};'Courier New',Courier,monospace;font-size:18px;flex-shrink:0">${i===0?'❯':'·'}</span>
            <span style="'Courier New',Courier,monospace;font-size:${i===0?'22px':'20px'};color:${i===0?'#F8F7FF':'rgba(248,247,255,.50)'};line-height:1.4">${hl}</span>
          </div>`;
        }).join('');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${darkBg(0.18)}
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;align-items:center;gap:56px;padding:36px 0">
      <div style="flex:0 0 480px"><h2 style="font-size:${slide.title.length>50?'62px':'76px'};font-weight:900;line-height:1.04;letter-spacing:-.04em;color:#F8F7FF">${titleHtml}</h2></div>
      <div style="flex:1;background:#0A0810;border:1px solid rgba(124,58,237,.25);border-radius:20px;overflow:hidden">
        <div style="display:flex;gap:8px;padding:16px 20px;border-bottom:1px solid rgba(124,58,237,.15);background:rgba(124,58,237,.05)">
          <div style="width:11px;height:11px;border-radius:50%;background:#FF5F57"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:#FFBD2E"></div>
          <div style="width:11px;height:11px;border-radius:50%;background:#28C840"></div>
        </div>
        <div style="padding:20px 24px">${termLines}</div>
      </div>
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
      }

      // ── CTA WITH AI IMAGE (ref: slide 10) ───────────────────────────────
      if (type === 'cta') {
        const hasBg = !!slide.bgImage;
        const titleHtml = applyAccent(slide.title, '#A78BFA');
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${hasBg
    ? `<div style="position:absolute;inset:0;background-image:url('${slide.bgImage}');background-size:cover;background-position:center"></div>
       <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,8,20,.97) 0%,rgba(10,8,20,.80) 50%,rgba(10,8,20,.50) 80%,rgba(10,8,20,.30) 100%)"></div>`
    : `<div style="position:absolute;inset:0;background:radial-gradient(ellipse 100% 60% at 50% 60%,rgba(88,28,235,.40) 0%,transparent 65%)"></div>`
  }
  ${grain}
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:20px">
      <h2 style="font-size:${slide.title.length>50?'80px':'96px'};font-weight:900;line-height:.98;letter-spacing:-.045em;color:#F8F7FF;margin-bottom:48px;text-shadow:${hasBg?'0 2px 40px rgba(0,0,0,.85)':'none'}">${titleHtml}</h2>
      ${slide.cta ? `<div style="display:inline-flex;align-items:center;gap:16px;padding:22px 40px;border-radius:100px;border:1px solid rgba(167,139,250,.35);background:rgba(124,58,237,.15);width:fit-content">
        <span style="font-size:24px;font-weight:600;color:#F8F7FF">${slide.cta}</span>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#A78BFA" stroke-width="1.5"/><path d="M10 14h8M15 11l3 3-3 3" stroke="#A78BFA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>` : ''}
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
      }

      // ── DEFAULT CONTENT ──────────────────────────────────────────────────
      const titleHtml = applyAccent(slide.title, '#7C3AED');
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${F}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden}body{background:#0D0B16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#F8F7FF;position:relative}</style></head>
<body>
  ${darkBg(0.22)}
  <div style="position:relative;z-index:5;width:100%;height:100%;display:flex;flex-direction:column;padding:60px 72px">
    ${topBar()}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:32px;padding:40px 0">
      ${slide.eyebrow ? `<span style="font-size:14px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(167,139,250,.55)">${slide.eyebrow}</span>` : ''}
      <h2 style="font-size:${slide.title.length>65?'62px':slide.title.length>45?'74px':'88px'};font-weight:900;line-height:1.02;letter-spacing:-.044em;color:#F8F7FF;max-width:940px">${titleHtml}</h2>
      ${slide.body ? `<p style="font-size:${slide.body.length>200?'26px':'30px'};font-weight:400;line-height:1.6;color:rgba(248,247,255,.55);max-width:840px;border-left:3px solid #7C3AED;padding-left:28px">${slide.body}</p>` : ''}
    </div>
    ${bottomLogo()}
  </div>
</body></html>`;
    };

    // ── Respond in 0ms — ALL work happens in background ──────────────────────
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const job: SlideJob = { status: 'rendering', progress: 0, total: 0, slides: [], createdAt: Date.now() };
    slideJobs.set(jobId, job);
    res.json({ jobId, status: 'rendering' });

    void (async () => {
      try {
        const run = await getSquadRun(req.params.runId);
        if (!run) { job.status = 'error'; job.error = 'Run not found.'; return; }

        const fullOutput = run.stages
          .filter((s) => s.status === 'done' && s.output)
          .map((s) => `### ${s.agentName}\n${s.output}`)
          .join('\n\n---\n\n');

        if (!fullOutput) { job.status = 'error'; job.error = 'No completed stages with output.'; return; }

        try {
          let directorCtx = '';
          try { directorCtx = await readFileFn(joinPath(process.cwd(), 'shared/brand/carousel-director.md'), 'utf8'); } catch { /* optional */ }

          const extraction = await routeTextGeneration({
            capability: 'structured_text',
            messages: [{
              role: 'system',
              content: `${directorCtx}\n\n---\n\nVocê é o Diretor Criativo de Carrosséis da Entrelaços. Crie 8 a 10 slides premium para Instagram.\n\nResponda APENAS com JSON válido, sem markdown fences:\n{\n  "slides": [\n    {\n      "id": 1,\n      "type": "cover|content|quote|list|dashboard|terminal|cta",\n      "eyebrow": "EYEBROW EM CAPS (máx 4 palavras, SEM asteriscos)",\n      "title": "frase impactante (máx 10 palavras, SEM asteriscos ou markdown)",\n      "body": "texto de apoio (máx 30 palavras, omita se não agregar, SEM asteriscos)",\n      "highlight": "UMA palavra simples do title (sem asteriscos, sem markdown)",\n      "bullets": ["item 1","item 2","item 3","item 4"],\n      "stats": [{"value":"1.000+","label":"PSICÓLOGAS"}],\n      "imagePrompt": "PROMPT OBRIGATÓRIO para todos os slides: crie uma arte cinematográfica completa com texto integrado. Descreva em inglês: (1) composição visual — posição do texto na tela, tipografia, hierarquia; (2) background — preto profundo #050506 ou grafite #101014 com grain cinematográfico; (3) elementos visuais: mínimo 3 elementos como cards flutuantes translúcidos, fios de luz roxa, interface de software, grids, redes neurais, partículas, mapas de conexão, barras de dados, janelas de browser, sombras com glow roxo; (4) paleta: roxo #7C3AED dominante, laranja #FF7A1A em pontos de ação máx 8%, turquesa #2DD4BF só em detalhes tech; (5) texto exato em português que deve aparecer legível. Formato: Instagram carousel slide 1080x1350px vertical, premium dark editorial manifesto, cinematic grain, sophisticated not generic, no cliché therapy imagery, no distorted text.",\n      "cta": "texto do botão (só type=cta, SEM asteriscos)"\n    }\n  ]\n}\n\nRegras críticas:\n- NUNCA use asteriscos (*) ou markdown em nenhum campo de texto\n- imagePrompt OBRIGATÓRIO em TODOS os slides\n- Slide 1: cover com frase-manifesto de impacto e fio luminoso roxo\n- type=quote: cena emocional com silhueta ou forma abstrata de luz\n- type=list: 4 cards verticais com linha roxa conectando (fluxo)\n- type=content: texto esquerda + UI panel/interface direita\n- type=dashboard: 3 métricas com ícones geométricos e barras de progresso\n- type=cta: portal luminoso roxo + texto + botão\n- Tom: manifesto cinematográfico, adulto, elegante, provocador`,
            }, { role: 'user', content: fullOutput }],
            maxTokens: 4000,
          });

          type SlideData = { id: number; type?: string; eyebrow?: string; title: string; body?: string; highlight?: string; bullets?: string[]; stats?: Array<{value:string;label:string}>; cta?: string; imagePrompt?: string };
          let slides: SlideData[];
          const raw = extraction.content || '';
          const parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
          slides = parsed.slides;
          if (!Array.isArray(slides) || slides.length === 0) throw new Error('No slides extracted');

          job.total = slides.length;
          const total = slides.length;
          const rendered: Array<{ id: number; filename: string; dataUrl: string }> = [];

          // Generate each slide — AI image if imagePrompt, else Puppeteer HTML
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
          });

          for (const slide of slides) {
            let dataUrl = '';
            const slug = slide.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40);

            if (slide.imagePrompt && process.env.OPENAI_API_KEY) {
              // Generate full slide as AI image
              try {
                const oRes = await fetch('https://api.openai.com/v1/images/generations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
                  body: JSON.stringify({ model: 'gpt-image-2', prompt: slide.imagePrompt, size: '1024x1536', quality: 'high', n: 1 }),
                });
                if (oRes.ok) {
                  const d = await oRes.json() as { data?: Array<{ b64_json?: string }> };
                  if (d.data?.[0]?.b64_json) dataUrl = `data:image/png;base64,${d.data[0].b64_json}`;
                }
              } catch { /* fallback to puppeteer */ }
            }

            if (!dataUrl) {
              // Puppeteer HTML fallback
              const page = await browser.newPage();
              await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
              await page.setRequestInterception(true);
              page.on('request', (r) => r.url().includes('googleapis') ? r.abort() : r.continue());
              const html = buildSlideHtml({ ...slide, total, bgImage: '', light: false });
              await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await new Promise((r) => setTimeout(r, 120));
              const buf = await page.screenshot({ type: 'png', fullPage: false });
              await page.close();
              dataUrl = `data:image/png;base64,${(buf as Buffer).toString('base64')}`;
            }

            rendered.push({ id: slide.id, filename: `slide-${String(slide.id).padStart(2,'0')}-${slug}.png`, dataUrl });
            job.progress = rendered.length;
          }

          await browser.close();
          job.slides = rendered;
          job.status = 'done';

          // Clean up old jobs after 30 min
          setTimeout(() => slideJobs.delete(jobId), 30 * 60 * 1000);
        } catch (bgErr) {
          job.status = 'error';
          job.error = bgErr instanceof Error ? bgErr.message : 'Render failed.';
        }
      } catch (outerErr) {
        job.status = 'error';
        job.error = outerErr instanceof Error ? outerErr.message : 'Unexpected error.';
      }
    })();
  });

  // Serve saved squad slides as static files
  const squadSlidesDir = path.join(process.cwd(), 'outputs', 'squad-slides');
  app.use('/__squad_slides', express.static(squadSlidesDir, { maxAge: '1d' }));

  // List previously saved slides for a given run (reads from disk)
  app.get('/api/squads/runs/:runId/saved-slides', async (req, res) => {
    const { readdir } = await import('fs/promises');
    const runDir = path.join(squadSlidesDir, req.params.runId);
    try {
      const files = await readdir(runDir);
      const pngs = files.filter((f) => f.endsWith('.png')).sort();
      const baseUrl = process.env.PUBLIC_URL || 'https://os.entrelacospsicologia.com.br';
      const slides = pngs.map((filename, i) => ({
        id: i + 1,
        filename,
        url: `${baseUrl}/__squad_slides/${req.params.runId}/${filename}`,
        localUrl: `/__squad_slides/${req.params.runId}/${filename}`,
      }));
      res.json({ slides });
    } catch {
      // Directory doesn't exist — no saved slides
      res.json({ slides: [] });
    }
  });

  // Save slides to disk and return public URLs
  app.post('/api/squads/runs/:runId/save-slides', async (req, res) => {
    const { slides: slidesIn }: { slides: Array<{ id: number; filename: string; dataUrl: string }> } = req.body ?? {};
    if (!Array.isArray(slidesIn) || slidesIn.length === 0) return res.status(400).json({ error: 'slides required' });
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');
    const runDir = join(squadSlidesDir, req.params.runId);
    await mkdir(runDir, { recursive: true });
    const baseUrl = process.env.PUBLIC_URL || `https://os.entrelacospsicologia.com.br`;
    const saved: Array<{ id: number; filename: string; url: string }> = [];
    for (const slide of slidesIn) {
      const base64 = slide.dataUrl.replace(/^data:image\/png;base64,/, '');
      await writeFile(join(runDir, slide.filename), Buffer.from(base64, 'base64'));
      saved.push({ id: slide.id, filename: slide.filename, url: `${baseUrl}/__squad_slides/${req.params.runId}/${slide.filename}` });
    }
    res.json({ saved });
  });

  // Publish approved slides to Instagram
  app.post('/api/squads/runs/:runId/publish-instagram', async (req, res) => {
    const { slideUrls, caption }: { slideUrls: string[]; caption: string } = req.body ?? {};
    if (!Array.isArray(slideUrls) || slideUrls.length === 0) return res.status(400).json({ error: 'slideUrls required' });
    if (!caption?.trim()) return res.status(400).json({ error: 'caption required' });
    try {
      const results = [];
      for (let i = 0; i < slideUrls.length; i++) {
        const result = await queueInstagramPublication({ localPostId: `squad-${req.params.runId}-slide-${i+1}`, imageUrl: slideUrls[i]!, caption: i===0?caption:'', scheduledAt:'', day:'', format:'carousel', theme:'squad' });
        results.push(result);
      }
      res.json({ success: true, results });
    } catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Publish failed.' }); }
  });

  // ─── Clone Studio Routes ──────────────────────────────────────────────────

  app.get('/api/clones', async (_req, res) => {
    const { listClones } = await import('./services/cloneRegistry.js');
    try { res.json({ clones: await listClones() }); }
    catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.post('/api/clones', async (req, res) => {
    const { createClone } = await import('./services/cloneRegistry.js');
    try { res.status(201).json(await createClone(req.body ?? {})); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/clones/:id', async (req, res) => {
    const { getClone } = await import('./services/cloneRegistry.js');
    try {
      const clone = await getClone(req.params.id);
      if (!clone) return res.status(404).json({ error: 'Clone not found.' });
      res.json(clone);
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.put('/api/clones/:id', async (req, res) => {
    const { updateClone } = await import('./services/cloneRegistry.js');
    try { res.json(await updateClone(req.params.id, req.body ?? {})); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.delete('/api/clones/:id', async (req, res) => {
    const { deleteClone } = await import('./services/cloneRegistry.js');
    try { await deleteClone(req.params.id); res.status(204).send(); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/clones/:id/conversations', async (req, res) => {
    const { listConversations } = await import('./services/cloneRegistry.js');
    try { res.json({ conversations: await listConversations(req.params.id) }); }
    catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.post('/api/clones/:id/conversations', async (req, res) => {
    const { getClone, createConversation } = await import('./services/cloneRegistry.js');
    try {
      const clone = await getClone(req.params.id);
      if (!clone) return res.status(404).json({ error: 'Clone not found.' });
      res.status(201).json(await createConversation(clone.id, clone.name));
    } catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.delete('/api/clones/conversations/:convId', async (req, res) => {
    const { deleteConversation } = await import('./services/cloneRegistry.js');
    try { await deleteConversation(req.params.convId); res.status(204).send(); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.post('/api/clones/conversations/:convId/chat', async (req, res) => {
    const { getConversation, appendMessage } = await import('./services/cloneRegistry.js');
    const { routeTextGeneration: routeText } = await import('./services/aiProviderRegistry.js');
    const userMessage = String(req.body?.message || '').trim();
    if (!userMessage) return res.status(400).json({ error: 'message is required.' });
    try {
      const conv = await getConversation(req.params.convId);
      if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
      const { getClone } = await import('./services/cloneRegistry.js');
      const clone = await getClone(conv.cloneId);
      if (!clone) return res.status(404).json({ error: 'Clone not found.' });
      const ts = new Date().toISOString();
      await appendMessage(conv.id, { role: 'user', content: userMessage, timestamp: ts });
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      try {
        const history = conv.messages.slice(-20);
        const result = await routeText({
          capability: 'text_generation',
          messages: [
            { role: 'system', content: clone.systemPrompt },
            ...history.map(m => ({ role: m.role as 'user'|'assistant', content: m.content })),
            { role: 'user', content: userMessage },
          ],
          maxTokens: 2048,
        });
        send('token', { text: result.content });
        await appendMessage(conv.id, { role: 'assistant', content: result.content, timestamp: new Date().toISOString() });
        send('done', { content: result.content });
      } catch (streamErr) {
        send('error', { message: streamErr instanceof Error ? streamErr.message : 'Stream error.' });
      }
      res.end();
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' });
    }
  });

  // ─── Design References (awesome-design-md submodule) ────────────────────
  app.get('/api/design-references', async (_req, res) => {
    const { readdir } = await import('fs/promises');
    const { join } = await import('path');
    const baseDir = join(process.cwd(), 'shared', 'design-references', 'design-md');
    try {
      const brands = await readdir(baseDir, { withFileTypes: true });
      const list = brands
        .filter((d) => d.isDirectory())
        .map((d) => ({ id: d.name, name: d.name.charAt(0).toUpperCase() + d.name.slice(1).replace(/-/g, ' ') }))
        .sort((a, b) => a.name.localeCompare(b.name));
      res.json({ brands: list });
    } catch { res.json({ brands: [] }); }
  });

  app.get('/api/design-references/:brand', async (req, res) => {
    const { readdir, readFile } = await import('fs/promises');
    const { join, extname } = await import('path');
    const brandDir = join(process.cwd(), 'shared', 'design-references', 'design-md', req.params.brand);
    try {
      const files = await readdir(brandDir);
      const mdFiles = files.filter((f) => extname(f) === '.md');
      const docs = await Promise.all(
        mdFiles.map(async (f) => ({
          file: f,
          content: await readFile(join(brandDir, f), 'utf8'),
        }))
      );
      res.json({ brand: req.params.brand, docs });
    } catch { res.status(404).json({ error: 'Brand not found.' }); }
  });

  app.get('/api/screenshot', async (req, res) => {
    const { url } = req.query as { url?: string };
    if (!url || !/^https?:\/\//.test(url)) {
      return res.status(400).json({ error: 'url inválida' });
    }
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });
      const buf = await page.screenshot({ type: 'png' });
      await page.close();
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=300');
      res.send(buf);
    } catch (err) {
      res.status(500).json({ error: 'screenshot falhou', detail: String(err) });
    }
  });

  // ─── Traffic Team Routes ─────────────────────────────────────────────────

  // Shared helpers
  const metaFetch = async (path: string) => {
    const token = process.env.META_ACCESS_TOKEN;
    const version = process.env.META_API_VERSION || 'v19.0';
    if (!token) throw new Error('META_ACCESS_TOKEN não configurado');
    const url = `https://graph.facebook.com/${version}/${path}&access_token=${token}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Meta API ${r.status}: ${await r.text()}`);
    return r.json();
  };

  const MOCK_CAMPAIGNS = [
    { id: 'c001', name: 'Workshop MAVI — Conversões', status: 'ACTIVE',  daily_budget: 5000, spend: 312.50, impressions: 28400, clicks: 710, ctr: 2.50, cpm: 11.00, conversions: 18, revenue: 1350.00, roas: 4.32, frequency: 1.4, cpa: 17.36, trend: [{ day: 'Seg', spend: 38, roas: 4.1 }, { day: 'Ter', spend: 44, roas: 4.5 }, { day: 'Qua', spend: 41, roas: 4.0 }, { day: 'Qui', spend: 48, roas: 4.8 }, { day: 'Sex', spend: 52, roas: 4.6 }, { day: 'Sáb', spend: 46, roas: 4.2 }, { day: 'Dom', spend: 43, roas: 4.3 }] },
    { id: 'c002', name: 'Mentoría Individual — Leads', status: 'ACTIVE',  daily_budget: 3000, spend: 198.00, impressions: 18200, clicks: 364, ctr: 2.00, cpm: 10.88, conversions: 9, revenue: 594.00, roas: 3.00, frequency: 1.8, cpa: 22.00, trend: [{ day: 'Seg', spend: 26, roas: 3.2 }, { day: 'Ter', spend: 28, roas: 3.1 }, { day: 'Qua', spend: 30, roas: 2.9 }, { day: 'Qui', spend: 29, roas: 3.0 }, { day: 'Sex', spend: 28, roas: 2.8 }, { day: 'Sáb', spend: 29, roas: 3.1 }, { day: 'Dom', spend: 28, roas: 3.0 }] },
    { id: 'c003', name: 'Ebook Gratuito — Awareness',  status: 'ACTIVE',  daily_budget: 2000, spend: 134.80, impressions: 22100, clicks: 221, ctr: 1.00, cpm: 6.10, conversions: 4, revenue: 200.00, roas: 1.48, frequency: 2.1, cpa: 33.70, trend: [{ day: 'Seg', spend: 19, roas: 1.6 }, { day: 'Ter', spend: 20, roas: 1.5 }, { day: 'Qua', spend: 19, roas: 1.4 }, { day: 'Qui', spend: 18, roas: 1.5 }, { day: 'Sex', spend: 20, roas: 1.4 }, { day: 'Sáb', spend: 20, roas: 1.5 }, { day: 'Dom', spend: 18, roas: 1.5 }] },
    { id: 'c004', name: 'Retargeting — Visitantes 7d',  status: 'ACTIVE',  daily_budget: 1500, spend: 88.20, impressions: 9400, clicks: 235, ctr: 2.50, cpm: 9.38, conversions: 3, revenue: 225.00, roas: 2.55, frequency: 3.2, cpa: 29.40, trend: [{ day: 'Seg', spend: 12, roas: 3.1 }, { day: 'Ter', spend: 13, roas: 2.8 }, { day: 'Qua', spend: 13, roas: 2.6 }, { day: 'Qui', spend: 13, roas: 2.5 }, { day: 'Sex', spend: 13, roas: 2.3 }, { day: 'Sáb', spend: 12, roas: 2.4 }, { day: 'Dom', spend: 12, roas: 2.3 }] },
    { id: 'c005', name: 'Interesses Frios — Topo',      status: 'PAUSED', daily_budget: 1000, spend: 56.40, impressions: 14200, clicks: 71, ctr: 0.50, cpm: 3.97, conversions: 0, revenue: 0.00, roas: 0.00, frequency: 1.2, cpa: 0.00, trend: [{ day: 'Seg', spend: 14, roas: 0.4 }, { day: 'Ter', spend: 12, roas: 0.3 }, { day: 'Qua', spend: 10, roas: 0.2 }, { day: 'Qui', spend: 8, roas: 0 }, { day: 'Sex', spend: 6, roas: 0 }, { day: 'Sáb', spend: 4, roas: 0 }, { day: 'Dom', spend: 2, roas: 0 }] },
  ];

  app.get('/api/traffic-team/campaigns', async (_req, res) => {
    const accountId = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '');
    if (!accountId || !process.env.META_ACCESS_TOKEN) {
      return res.json({ campaigns: MOCK_CAMPAIGNS, mock: true });
    }
    try {
      const fields = 'id,name,status,daily_budget,lifetime_budget';
      const data = await metaFetch(`act_${accountId}/campaigns?fields=${fields}&limit=50`);
      const ids = (data.data || []).map((c: any) => c.id).join(',');
      if (!ids) return res.json({ campaigns: [], mock: false });
      // Fetch 7-day insights per campaign
      const insightFields = 'campaign_id,spend,impressions,clicks,ctr,cpm,frequency,actions,action_values';
      const iData = await metaFetch(`insights?ids=${ids}&fields=${insightFields}&date_preset=last_7d&level=campaign`);
      const campaigns = (data.data || []).map((c: any) => {
        const ins = iData[c.id]?.data?.[0] ?? {};
        const conversions = (ins.actions || []).find((a: any) => a.action_type?.includes('purchase'))?.value || 0;
        const revenue = (ins.action_values || []).find((a: any) => a.action_type?.includes('purchase'))?.value || 0;
        const spend = parseFloat(ins.spend || '0');
        return {
          id: c.id, name: c.name, status: c.status,
          daily_budget: parseInt(c.daily_budget || '0') / 100,
          spend, impressions: parseInt(ins.impressions || '0'),
          clicks: parseInt(ins.clicks || '0'),
          ctr: parseFloat(ins.ctr || '0'),
          cpm: parseFloat(ins.cpm || '0'),
          frequency: parseFloat(ins.frequency || '0'),
          conversions: parseInt(conversions), revenue: parseFloat(revenue),
          roas: spend > 0 ? parseFloat(revenue) / spend : 0,
          cpa: parseInt(conversions) > 0 ? spend / parseInt(conversions) : 0,
          trend: [],
        };
      });
      res.json({ campaigns, mock: false });
    } catch (err) {
      res.json({ campaigns: MOCK_CAMPAIGNS, mock: true, error: String(err) });
    }
  });

  app.post('/api/traffic-team/campaigns/:id/status', async (req, res) => {
    const { status } = req.body ?? {};
    if (!process.env.META_ACCESS_TOKEN) return res.status(400).json({ error: 'Token não configurado' });
    try {
      const token = process.env.META_ACCESS_TOKEN;
      const version = process.env.META_API_VERSION || 'v19.0';
      const r = await fetch(`https://graph.facebook.com/${version}/${req.params.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, access_token: token }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(400).json({ error: d.error?.message || 'Falha' });
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  app.post('/api/traffic-team/campaigns/:id/budget', async (req, res) => {
    const { daily_budget } = req.body ?? {};
    if (!process.env.META_ACCESS_TOKEN) return res.status(400).json({ error: 'Token não configurado' });
    try {
      const token = process.env.META_ACCESS_TOKEN;
      const version = process.env.META_API_VERSION || 'v19.0';
      const r = await fetch(`https://graph.facebook.com/${version}/${req.params.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget: Math.round(daily_budget * 100), access_token: token }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(400).json({ error: d.error?.message || 'Falha' });
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  app.get('/api/traffic-team/config', (_req, res) => {
    res.json({
      META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
      META_AD_ACCOUNT_ID: process.env.META_AD_ACCOUNT_ID || '',
      META_PAGE_ID: process.env.META_PAGE_ID || '',
      META_API_VERSION: process.env.META_API_VERSION || 'v19.0',
    });
  });

  app.post('/api/traffic-team/config', async (req, res) => {
    const { META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, META_PAGE_ID, META_API_VERSION } = req.body ?? {};
    const updates: Record<string, string> = {};
    if (META_ACCESS_TOKEN !== undefined) updates.META_ACCESS_TOKEN = String(META_ACCESS_TOKEN);
    if (META_AD_ACCOUNT_ID !== undefined) updates.META_AD_ACCOUNT_ID = String(META_AD_ACCOUNT_ID);
    if (META_PAGE_ID !== undefined) updates.META_PAGE_ID = String(META_PAGE_ID);
    if (META_API_VERSION !== undefined) updates.META_API_VERSION = String(META_API_VERSION);
    // Update process.env in memory
    for (const [k, v] of Object.entries(updates)) process.env[k] = v;
    // Persist to .env file
    try {
      const { readFile, writeFile } = await import('fs/promises');
      const envPath = path.join(process.cwd(), '.env');
      let content = '';
      try { content = await readFile(envPath, 'utf8'); } catch { /* file may not exist */ }
      for (const [key, value] of Object.entries(updates)) {
        const re = new RegExp(`^${key}=.*$`, 'm');
        if (re.test(content)) {
          content = content.replace(re, `${key}=${value}`);
        } else {
          content += `\n${key}=${value}`;
        }
      }
      await writeFile(envPath, content, 'utf8');
    } catch { /* .env write failure is non-fatal */ }
    res.json({ ok: true });
  });

  app.post('/api/traffic-team/chat', async (req, res) => {
    const { systemPrompt, message, history = [] } = req.body ?? {};
    if (!message) return res.status(400).json({ error: 'message required' });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    try {
      const { routeTextGeneration: routeText } = await import('./services/aiProviderRegistry.js');
      const messages = [
        { role: 'system' as const, content: String(systemPrompt || 'Você é um especialista em Meta Ads.') },
        ...(history as Array<{ role: string; content: string }>).slice(-20).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: String(message) },
      ];
      const result = await routeText({ capability: 'text_generation', messages, maxTokens: 2048 });
      send('token', { text: result.content });
      send('done', { content: result.content });
    } catch (err) {
      send('error', { message: err instanceof Error ? err.message : 'Chat error.' });
    }
    res.end();
  });

  // ─── Slides Studio Routes ─────────────────────────────────────────────────

  // CRUD for saved slides
  app.get('/api/slides/saved', async (_req, res) => {
    const { listSlides } = await import('./services/slidesRegistry.js');
    try { res.json({ slides: await listSlides() }); }
    catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/slides/saved/:id', async (req, res) => {
    const { getSlide } = await import('./services/slidesRegistry.js');
    try { res.json(await getSlide(req.params.id)); }
    catch (e) { res.status(404).json({ error: e instanceof Error ? e.message : 'Not found.' }); }
  });

  app.put('/api/slides/saved/:id', async (req, res) => {
    const { updateSlide } = await import('./services/slidesRegistry.js');
    try { res.json(await updateSlide(req.params.id, req.body)); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.delete('/api/slides/saved/:id', async (req, res) => {
    const { deleteSlide } = await import('./services/slidesRegistry.js');
    try { await deleteSlide(req.params.id); res.status(204).send(); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/slides/ds-brands', (_req, res) => {
    const ownBrands = [
      { id: 'entrelacOS', name: 'Entrelaços DS', type: 'own', palette: ['#6B46C1', '#10B981', '#F97316'], description: 'DS oficial — roxo/verde/laranja' },
      { id: 'tatiRibeiro', name: 'Tati Ribeiro DS', type: 'own', palette: ['#EC4899', '#C8963C', '#1A1A2E'], description: 'DS da Tati — rosa/dourado/navy' },
    ];
    const externalBrands = [
      'airbnb', 'apple', 'figma', 'framer', 'notion', 'stripe', 'vercel',
      'spotify', 'nike', 'tesla', 'meta', 'netflix', 'linear.app', 'superhuman',
      'raycast', 'loom', 'miro', 'canva', 'dropbox', 'slack',
    ].map((id) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1).replace('.', ' '), type: 'external' }));
    res.json({ brands: [...ownBrands, ...externalBrands] });
  });

  // Serve generated PPTX files for download
  app.get('/api/slides/pptx/:filename', (req, res) => {
    const safe = path.basename(req.params.filename).replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const fp = path.join(process.cwd(), 'outputs', 'slides', safe);
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'File not found' });
    res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.sendFile(fp);
  });

  app.post('/api/slides/generate', async (req, res) => {
    const {
      format = 'videoaula',
      inputMode = 'A',
      outputType = 'html',
      topic,
      topics,
      copy,
      transcript,
      slideCount,
      dsBrand = 'entrelacOS',
    } = req.body ?? {};

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    // Format-specific slide count defaults
    const FORMAT_COUNTS: Record<string, number> = {
      videoaula: 16,
      palestra: 24,
      webinar: 35,
      masterclass: 28,
      'micro-aula': 8,
      corporativo: 22,
    };
    const FORMAT_STRUCTURES: Record<string, string> = {
      videoaula: `Estrutura para videoaula: cover → agenda → quote/manifesto de abertura → 2-3 blocos de conceito+exemplo → exercise → síntese → step-flow de aplicação → closing. Slides densos mas não excessivos — a aluna está ouvindo enquanto lê. Evite CTA no meio.`,
      palestra: `Estrutura para palestra (manifesto-driven): cover → quote de ruptura → diagnóstico (big-stat ou concept) → manifesto → estrutura do problema → example → virada → caminho de saída (step-flow) → síntese → cta suave → closing. SEM agenda no início — palestra começa com impacto emocional. Máx 25 palavras por slide de texto.`,
      webinar: `Estrutura webinar (PFCO + oferta): cover → agenda → promessa → conceito (3 blocos com exercício) → síntese → pergunta-ponte → conceito de oferta → cta (com included list) → closing. Blocos bem separados: 70% conteúdo / 30% pitch.`,
      masterclass: `Estrutura masterclass: cover → manifesto de abertura → agenda → 3-4 conceitos profundos com exemplos → dois exercícios práticos → síntese → closing com convite suave.`,
      'micro-aula': `Estrutura micro-aula (máx 10 slides): cover com tag MICRO-AULA → promessa rápida → 1 conceito central em 2-3 slides → aplicação → closing com convite para discussão.`,
      corporativo: `Estrutura corporativo: cover light → agenda → problema (diagnóstico) → marco regulatório ou contexto → solução → cases ou evidências → próximos passos → closing. Densidade textual maior, tom técnico-profissional.`,
    };

    const resolvedCount = slideCount ?? FORMAT_COUNTS[format] ?? 16;
    const formatGuidance = FORMAT_STRUCTURES[format] || FORMAT_STRUCTURES.videoaula;

    // Para modos C/D: limitar contagem de slides pela densidade do texto fornecido
    // ~150 chars por slide garante que o modelo não invente conteúdo
    const sourceTextForCount = inputMode === 'C' ? (copy ?? '') : inputMode === 'D' ? (transcript ?? '') : '';
    const autoCount = sourceTextForCount.length > 0
      ? Math.min(resolvedCount, Math.max(5, Math.floor(sourceTextForCount.length / 150)))
      : resolvedCount;

    // Shared layout schema block
    const LAYOUT_SCHEMA = `Layouts disponíveis e seus campos obrigatórios:
- "cinematic-poster" (ou "cover"): { layout, title, subtitle, tag }
- "agenda": { layout, title, items: string[4-7] }
- "concept": { layout, title, body, section }
- "quote": { layout, quote, attribution }
- "before-after" (ou "two-column"): { layout, title, left: { title, items: string[] }, right: { title, items: string[] } }
- "framework-cards" (ou "three-grid"): { layout, title, items: [{ title, body }] (exatamente 3) }
- "saveable-summary" (ou "bullets"): { layout, title, items: string[3-6] }
- "big-stat": { layout, stat, label, subline }
- "journey-map" (ou "step-flow"): { layout, title, steps: string[3-5] }
- "exercise": { layout, label, question }
- "manifesto-fullscreen" (ou "manifesto"): { layout, text, signature }
- "system-cta" (ou "cta"): { layout, tag, title, subtitle, included: string[], price, price_note, cta_label }
- "closing": { layout, text, subtext, signature, socials }`;

    const COPY_RULES = `Regras de copywriting:
- Primeiro slide: layout "cinematic-poster" ou "cover"
- Último slide: layout "closing"
- Máximo 60 palavras no campo "body" ou "text"
- items[]: máximo 6 strings curtas (até 12 palavras cada)
- 1 ideia central por slide, sem redundância
- NÃO use "Obrigada" no closing — use frase-manifesto como assinatura`;

    const JSON_WRAPPER = `Formato de resposta obrigatório:
{
  "meta": {
    "title": "Título da apresentação",
    "subtitle": "Subtítulo (opcional)",
    "author": "Tati Ribeiro · Entrelaços Psicologia",
    "format": "${format}",
    "theme": "dark"
  },
  "slides": [ ... ]
}`;

    // Prompt differs fundamentally for extract modes (C/D) vs create modes (A/B)
    let prompt: string;

    if (inputMode === 'C' || inputMode === 'D') {
      const sourceLabel = inputMode === 'C' ? 'COPY / ROTEIRO' : 'TRANSCRIÇÃO';
      const sourceText = inputMode === 'C' ? copy : transcript;

      prompt = `Você é um designer instrucional especialista em slides premium para psicólogas.

Sua tarefa: transformar o ${sourceLabel} abaixo em slides para o formato "${format}".

REGRAS ABSOLUTAS — violá-las invalida o resultado:
1. Use EXCLUSIVAMENTE o conteúdo do texto fornecido — NÃO invente exemplos, frases, dados ou ideias ausentes no original
2. Preserve frases-chave, termos técnicos e exemplos exatos do original
3. O campo meta.title DEVE ser extraído diretamente do texto fornecido — não invente um título
4. Gere EXATAMENTE ${autoCount} slides. Se o conteúdo não comportar todos com qualidade, gere MENOS — nunca preencha com conteúdo inventado
5. Adapte a linguagem para slides (mais curta, mais impactante), mas sem alterar o sentido

Formato: ${format}
${formatGuidance}

${JSON_WRAPPER}

${LAYOUT_SCHEMA}

${COPY_RULES}

${sourceLabel}:
---
${sourceText}
---

Retorne APENAS o JSON:`;
    } else {
      const contentInput = inputMode === 'A' ? `Tema: ${topic}`
        : `Tema: ${topic}\nTópicos:\n${topics}`;

      prompt = `Você é um designer instrucional especialista em slides premium para psicólogas e educação em saúde mental.

Formato: ${format}
${formatGuidance}

Crie exatamente ${resolvedCount} slides. Retorne SOMENTE JSON válido, sem markdown, sem explicações.

${JSON_WRAPPER}

${LAYOUT_SCHEMA}

${COPY_RULES}
- Linguagem empática, científica, transformadora — nunca genérica ou clichê

Conteúdo:
${contentInput}

Retorne APENAS o JSON:`;
    }

    try {
      send('status', { message: 'Gerando slides com IA...' });

      // Slides generation requires strong instruction-following — use Claude if available,
      // fall back to Gemini (never Groq gpt-oss-20b which ignores complex prompts)
      let rawText = '';
      if (process.env.ANTHROPIC_API_KEY) {
        const AnthropicSDK = await import('@anthropic-ai/sdk');
        const anthropic = new AnthropicSDK.default({ apiKey: process.env.ANTHROPIC_API_KEY });
        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        });
        rawText = msg.content[0].type === 'text' ? msg.content[0].text : '';
      } else if (process.env.GEMINI_API_KEY || process.env.API_KEY) {
        const { GoogleGenAI } = await import('@google/genai');
        const gemini = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || process.env.API_KEY)! });
        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        rawText = response.text ?? '';
      } else {
        const { routeTextGeneration: routeText } = await import('./services/aiProviderRegistry.js');
        const result = await routeText({
          capability: 'text_generation',
          messages: [{ role: 'user', content: prompt }],
          maxTokens: 8000,
        });
        rawText = result.content;
      }
      const result = { content: rawText };

      send('status', { message: 'Parseando estrutura...' });

      const rawJson = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let deckData: { meta: Record<string, unknown>; slides: unknown[] };
      try {
        deckData = JSON.parse(rawJson);
        if (!deckData.slides) throw new Error('No slides field');
      } catch (_parseErr) {
        const match = rawJson.match(/\{[\s\S]*"slides"[\s\S]*\}/);
        if (!match) throw new Error('IA não retornou JSON válido com slides');
        deckData = JSON.parse(match[0]);
      }

      send('status', { message: 'Renderizando HTML editorial premium...' });

      const { randomUUID } = await import('node:crypto');
      const { writeFile, readFile, unlink, mkdir } = await import('node:fs/promises');
      const { spawn } = await import('node:child_process');

      const uuid = randomUUID();
      const outDir = path.join(process.cwd(), 'outputs', 'slides');
      await mkdir(outDir, { recursive: true });

      const tmpJson = path.join(outDir, `${uuid}.json`);
      const tmpHtml = path.join(outDir, `${uuid}.html`);
      const pptxFile = path.join(outDir, `${uuid}.pptx`);

      await writeFile(tmpJson, JSON.stringify(deckData, null, 2), 'utf-8');

      // Render HTML via python script
      const safeBrand = /^[a-zA-Z0-9_-]+$/.test(String(dsBrand)) ? String(dsBrand) : 'entrelacOS';
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('python3', [
          path.join(process.cwd(), 'scripts', 'build_html.py'),
          '-i', tmpJson,
          '-o', tmpHtml,
          '--brand', safeBrand,
        ]);
        let stderr = '';
        proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`build_html.py failed (code ${code}): ${stderr.slice(0, 400)}`));
        });
      });

      const html = await readFile(tmpHtml, 'utf-8');
      await unlink(tmpJson).catch(() => {});
      await unlink(tmpHtml).catch(() => {});

      // Optionally render PPTX
      let pptxFilename: string | null = null;
      if (outputType === 'pptx' || outputType === 'html+pptx') {
        send('status', { message: 'Gerando PPTX...' });
        const writtenJson = path.join(outDir, `${uuid}-pptx.json`);
        await writeFile(writtenJson, JSON.stringify(deckData, null, 2), 'utf-8');
        await new Promise<void>((resolve, reject) => {
          const proc = spawn('python3', [
            path.join(process.cwd(), 'scripts', 'build_pptx.py'),
            '-i', writtenJson,
            '-o', pptxFile,
          ]);
          let stderr = '';
          proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
          proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`build_pptx.py failed (code ${code}): ${stderr.slice(0, 400)}`));
          });
        });
        await unlink(writtenJson).catch(() => {});
        pptxFilename = `${uuid}.pptx`;
      }

      // Auto-save to registry
      const { createSlide } = await import('./services/slidesRegistry.js');
      const slideTitle = (deckData.meta?.title as string) || topic || 'Sem título';
      const savedRecord = await createSlide({
        title: slideTitle,
        format,
        inputMode,
        outputType,
        dsBrand,
        slideCount: deckData.slides.length,
        html: outputType === 'pptx' ? null : html,
        pptxFilename: pptxFilename ?? null,
      });

      send('done', {
        html: outputType === 'pptx' ? null : html,
        pptxUrl: pptxFilename ? `/api/slides/pptx/${pptxFilename}` : null,
        slideCount: deckData.slides.length,
        format,
        savedId: savedRecord.id,
      });
    } catch (err) {
      send('error', { message: err instanceof Error ? err.message : 'Erro ao gerar slides.' });
    }
    res.end();
  });

  // ─── Ads Studio Routes ────────────────────────────────────────────────────

  app.get('/api/ads/audits', async (_req, res) => {
    const { listAdsAudits } = await import('./services/adsRegistry.js');
    try { res.json({ audits: await listAdsAudits() }); }
    catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.delete('/api/ads/audits/:id', async (req, res) => {
    const { deleteAdsAudit } = await import('./services/adsRegistry.js');
    try { await deleteAdsAudit(req.params.id); res.status(204).send(); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  // Audit run — SSE stream
  app.post('/api/ads/audit/run', async (req, res) => {
    const { runAdsAudit } = await import('./services/adsService.js');
    const { saveAdsAudit } = await import('./services/adsRegistry.js');

    const { platform, industry, monthlySpend, goal, metricsRaw } = req.body ?? {};
    if (!platform || !metricsRaw) return res.status(400).json({ error: 'platform e metricsRaw são obrigatórios.' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
      const result = await runAdsAudit(platform, industry ?? 'other', monthlySpend ?? 0, goal ?? 'sales', metricsRaw, send);
      await saveAdsAudit(result);
    } catch (e) {
      send('error', { message: e instanceof Error ? e.message : 'Audit failed.' });
    }

    res.end();
  });

  app.get('/api/ads/copy', async (_req, res) => {
    const { listAdsCopy } = await import('./services/adsRegistry.js');
    try { res.json({ copy: await listAdsCopy() }); }
    catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.delete('/api/ads/copy/:id', async (req, res) => {
    const { deleteAdsCopy } = await import('./services/adsRegistry.js');
    try { await deleteAdsCopy(req.params.id); res.status(204).send(); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.post('/api/ads/copy/generate', async (req, res) => {
    const { generateAdsCopy } = await import('./services/adsService.js');
    const { saveAdsCopy } = await import('./services/adsRegistry.js');
    const { platform, framework, productDescription, targetAudience, goal } = req.body ?? {};
    if (!platform || !framework || !productDescription || !targetAudience) {
      return res.status(400).json({ error: 'platform, framework, productDescription, targetAudience são obrigatórios.' });
    }
    try {
      const variants = await generateAdsCopy(platform, framework, productDescription, targetAudience, goal ?? '');
      const record = await saveAdsCopy({ platform, framework, productDescription, targetAudience, goal: goal ?? '', variants });
      res.json({ variants, record });
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/ads/strategy', async (_req, res) => {
    const { listAdsStrategy } = await import('./services/adsRegistry.js');
    try { res.json({ strategy: await listAdsStrategy() }); }
    catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.delete('/api/ads/strategy/:id', async (req, res) => {
    const { deleteAdsStrategy } = await import('./services/adsRegistry.js');
    try { await deleteAdsStrategy(req.params.id); res.status(204).send(); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.post('/api/ads/strategy/generate', async (req, res) => {
    const { generateAdsStrategy } = await import('./services/adsService.js');
    const { saveAdsStrategy } = await import('./services/adsRegistry.js');
    const { brandDescription, goal, monthlyBudget, activePlatforms } = req.body ?? {};
    if (!brandDescription || !activePlatforms?.length) {
      return res.status(400).json({ error: 'brandDescription e activePlatforms são obrigatórios.' });
    }
    try {
      const { concepts, budgetRecommendation } = await generateAdsStrategy(
        brandDescription, goal ?? 'leads', monthlyBudget ?? 0, activePlatforms,
      );
      const record = await saveAdsStrategy({ brandDescription, goal: goal ?? 'leads', monthlyBudget: monthlyBudget ?? 0, activePlatforms, concepts, budgetRecommendation });
      res.json({ record });
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  // ─── AutoEdit Routes ──────────────────────────────────────────────────────

  const autoEditUpload = multer({
    dest: path.join(process.cwd(), 'uploads', 'auto-edit'),
    limits: { fileSize: 500 * 1024 * 1024 },
  });

  app.get('/api/auto-edit', async (_req, res) => {
    const { listAutoEditProjects } = await import('./services/autoEditRegistry.js');
    try { res.json({ projects: await listAutoEditProjects() }); }
    catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.post('/api/auto-edit/upload', autoEditUpload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo de vídeo é obrigatório.' });
    const { createAutoEditProject, syncAutoEditProject } = await import('./services/autoEditRegistry.js');
    try {
      const includeShorts = req.body?.includeShorts === 'true';
      const project = createAutoEditProject(req.file.path, req.file.originalname, includeShorts);
      await syncAutoEditProject(project);
      res.json({ projectId: project.id });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' });
    }
  });

  app.get('/api/auto-edit/:id', async (req, res) => {
    const { getAutoEditProject } = await import('./services/autoEditRegistry.js');
    try {
      const p = await getAutoEditProject(req.params.id);
      if (!p) return res.status(404).json({ error: 'Project not found.' });
      res.json(p);
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.delete('/api/auto-edit/:id', async (req, res) => {
    const { deleteAutoEditProject } = await import('./services/autoEditRegistry.js');
    try { await deleteAutoEditProject(req.params.id); res.status(204).send(); }
    catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/auto-edit/:id/run', async (req, res) => {
    const { runAutoEditPipeline } = await import('./services/autoEditService.js');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
      await runAutoEditPipeline(req.params.id, send);
    } catch (e) {
      send('error', { message: e instanceof Error ? e.message : 'Pipeline failed.' });
    }

    res.end();
  });

  app.get('/api/auto-edit/:id/video', async (req, res) => {
    const { getAutoEditProject } = await import('./services/autoEditRegistry.js');
    try {
      const p = await getAutoEditProject(req.params.id);
      if (!p || !fs.existsSync(p.outputPath)) return res.status(404).json({ error: 'Video not ready.' });
      streamVideoFile(req, res, p.outputPath, `${p.title}_output.mp4`);
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/auto-edit/:id/shorts', async (req, res) => {
    const { getAutoEditProject } = await import('./services/autoEditRegistry.js');
    try {
      const p = await getAutoEditProject(req.params.id);
      if (!p || !fs.existsSync(p.shortsPath)) return res.status(404).json({ error: 'Shorts not ready.' });
      streamVideoFile(req, res, p.shortsPath, `${p.title}_shorts.mp4`);
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  app.get('/api/auto-edit/:id/captions', async (req, res) => {
    const { getAutoEditProject } = await import('./services/autoEditRegistry.js');
    try {
      const p = await getAutoEditProject(req.params.id);
      if (!p || !fs.existsSync(p.captionsPath)) return res.status(404).json({ error: 'Captions not ready.' });
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${p.title}_captions.srt"`);
      fs.createReadStream(p.captionsPath).pipe(res);
    } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : 'Failed.' }); }
  });

  // Open Slide — reverse proxy to the persistent open-slide dev server so it can
  // be embedded via iframe under the app's own origin (avoids CORS/frame issues).
  // No WebSocket/HMR forwarding: the iframe shows the deck, live-reload just needs
  // a manual refresh after an agent edits the workspace.
  // The open-slide client also calls its own API routes (assets, comments,
  // folders, notes, ...) via root-absolute fetch('/__xyz') calls that Vite's
  // `base` rewriting doesn't touch (only static imports get base-prefixed,
  // not runtime fetch() strings) — so those must be proxied unprefixed too.
  const OPEN_SLIDE_TARGET = process.env.OPEN_SLIDE_URL || 'http://localhost:4100';
  app.use(['/open-slide', /^\/__/], (req, res) => {
    const target = new URL(OPEN_SLIDE_TARGET);
    const proxyReq = http.request({
      host: target.hostname,
      port: target.port,
      // originalUrl keeps the /open-slide prefix — the target's own base is
      // configured as '/open-slide/' (see open-slide.config.ts) to match.
      path: req.originalUrl,
      method: req.method,
      // Vite's dev server rejects unrecognized Host headers (DNS-rebinding
      // guard) but always allows 'localhost' — send that instead of the
      // docker network alias so the proxy isn't blocked with 403.
      headers: { ...req.headers, host: 'localhost' },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Open Slide service unavailable.' }));
    });
    req.pipe(proxyReq);
  });

  // Vite middleware for development
  if (includeVite) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method !== 'GET') {
        next();
        return;
      }

      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (options.startSchedulers ?? true) {
    startInstagramScheduler();
  }

  return app;
}

export async function startServer(options: StartServerOptions = {}): Promise<Server> {
  const PORT = options.port ?? (Number(process.env.PORT) || 3010);
  const host = options.host ?? '0.0.0.0';
  const app = await createApp(options);

  return await new Promise<Server>((resolve, reject) => {
    const server = app.listen(PORT, host, () => {
      const address = server.address();
      const resolvedPort = typeof address === 'object' && address ? address.port : PORT;
      console.log(`Server running on http://localhost:${resolvedPort}`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

const isDirectExecution = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (process.env.BRANDING_OS_SKIP_AUTO_START !== '1' && isDirectExecution) {
  void startServer();
}
