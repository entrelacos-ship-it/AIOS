import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Download, FileArchive, Loader2, Image as ImageIcon,
  ChevronLeft, ChevronRight, Layers, Edit3,
} from 'lucide-react';
import { View } from '../../types';

interface SlideRecord {
  id: number;
  title: string;
  body: string;
  visualPrompt: string;
  eyebrow: string;
  footerLabel: string;
  imageUrl: string;
  templateId: string;
  accentColor: string;
  secondaryColor: string;
  surfaceColor: string;
  textColor: string;
  titleFontSize: number;
  bodyFontSize: number;
  textAlign: string;
  titleFontFamily: string;
  bodyFontFamily: string;
  imageFit: string;
  imagePlacement: string;
  imageScale: number;
  backgroundColor: string;
}

interface BrandProfile {
  brandName: string;
  brandHandle: string;
  studioLabel: string;
  profileImageUrl: string;
}

interface CarouselDraft {
  id: string;
  name: string;
  manifestoId: string | null;
  selectedAsset: string;
  carouselStylePreset: string;
  slides: SlideRecord[];
  brandProfile: BrandProfile;
  createdAt: string;
  updatedAt: string;
}

interface RenderedImage {
  id: number;
  filename: string;
  dataUrl: string;
}

interface Props {
  draftId: string;
  onNavigate: (view: View, meta?: { draftId?: string }) => void;
}

function triggerDownload(dataUrl: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

export const CarouselViewer: React.FC<Props> = ({ draftId, onNavigate }) => {
  const [draft, setDraft] = useState<CarouselDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [renderedImages, setRenderedImages] = useState<Map<number, RenderedImage>>(new Map());
  const [renderingSlide, setRenderingSlide] = useState(false);
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [isExportingPack, setIsExportingPack] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/branding/carousel-drafts/${draftId}`);
        if (!res.ok) throw new Error('Draft não encontrado.');
        const data = await res.json();
        setDraft(data.draft ?? data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar draft.');
      } finally {
        setLoading(false);
      }
    };
    void loadDraft();
  }, [draftId]);

  const buildRenderPayload = useCallback(
    (slides: SlideRecord[]) => {
      if (!draft) return null;
      return {
        slides: slides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          body: slide.body,
          eyebrow: slide.eyebrow,
          footerLabel: slide.footerLabel,
          templateId: slide.templateId,
          imageUrl: slide.imageUrl,
          brandName: draft.brandProfile.brandName,
          brandHandle: draft.brandProfile.brandHandle,
          brandStudioLabel: draft.brandProfile.studioLabel,
          profileImageUrl: draft.brandProfile.profileImageUrl,
          accentColor: slide.accentColor,
          secondaryColor: slide.secondaryColor,
          surfaceColor: slide.surfaceColor,
          textColor: slide.textColor,
          backgroundColor: slide.backgroundColor,
          titleFontSize: slide.titleFontSize,
          bodyFontSize: slide.bodyFontSize,
          textAlign: slide.textAlign,
          titleFontFamily: slide.titleFontFamily,
          bodyFontFamily: slide.bodyFontFamily,
          imageFit: slide.imageFit,
          imagePlacement: slide.imagePlacement,
          imageScale: slide.imageScale,
        })),
      };
    },
    [draft],
  );

  const renderSlides = useCallback(
    async (slides: SlideRecord[]): Promise<RenderedImage[]> => {
      const payload = buildRenderPayload(slides);
      if (!payload) return [];
      const res = await fetch('/api/render/branding/png-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Falha ao renderizar slides.');
      const result = await res.json();
      return result.images ?? [];
    },
    [buildRenderPayload],
  );

  // Render selected slide on change
  useEffect(() => {
    if (!draft || draft.slides.length === 0) return;
    const slide = draft.slides[selectedIndex];
    if (!slide || renderedImages.has(slide.id)) return;

    let cancelled = false;
    setRenderingSlide(true);
    renderSlides([slide])
      .then((images) => {
        if (cancelled) return;
        setRenderedImages((prev) => {
          const next = new Map(prev);
          for (const img of images) next.set(img.id, img);
          return next;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRenderingSlide(false);
      });

    return () => { cancelled = true; };
  }, [draft, selectedIndex, renderedImages, renderSlides]);

  const handleExportSingle = async () => {
    if (!draft) return;
    const slide = draft.slides[selectedIndex];
    if (!slide) return;

    setIsExportingSingle(true);
    try {
      const cached = renderedImages.get(slide.id);
      if (cached) {
        triggerDownload(cached.dataUrl, cached.filename);
        return;
      }
      const images = await renderSlides([slide]);
      if (images[0]) {
        setRenderedImages((prev) => {
          const next = new Map(prev);
          next.set(images[0].id, images[0]);
          return next;
        });
        triggerDownload(images[0].dataUrl, images[0].filename);
      }
    } catch {
      setError('Erro ao exportar PNG.');
    } finally {
      setIsExportingSingle(false);
    }
  };

  const handleExportPack = async () => {
    if (!draft) return;
    setIsExportingPack(true);
    try {
      const images = await renderSlides(draft.slides);
      setRenderedImages((prev) => {
        const next = new Map(prev);
        for (const img of images) next.set(img.id, img);
        return next;
      });
      images.forEach((img, i) => {
        window.setTimeout(() => triggerDownload(img.dataUrl, img.filename), i * 180);
      });
    } catch {
      setError('Erro ao exportar pack.');
    } finally {
      setIsExportingPack(false);
    }
  };

  const handleExportZip = async () => {
    if (!draft) return;
    setIsExportingZip(true);
    try {
      const images = await renderSlides(draft.slides);
      setRenderedImages((prev) => {
        const next = new Map(prev);
        for (const img of images) next.set(img.id, img);
        return next;
      });

      const zipRes = await fetch('/api/carousel/export-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: images.map((img) => ({
            filename: img.filename,
            dataUrl: img.dataUrl,
          })),
        }),
      });
      if (!zipRes.ok) throw new Error('Falha ao gerar ZIP.');

      const blob = await zipRes.blob();
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${draft.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`);
      URL.revokeObjectURL(url);
    } catch {
      setError('Erro ao exportar ZIP.');
    } finally {
      setIsExportingZip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-fuchsia-400 animate-spin" />
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => onNavigate(View.CAROUSEL_STUDIO_DASHBOARD)}
          className="text-xs text-fuchsia-400 hover:text-fuchsia-300 uppercase tracking-widest font-bold"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  if (!draft) return null;

  const currentSlide = draft.slides[selectedIndex];
  const cachedImage = currentSlide ? renderedImages.get(currentSlide.id) : null;
  const isAnyExporting = isExportingSingle || isExportingPack || isExportingZip;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate(View.CAROUSEL_STUDIO_DASHBOARD)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{draft.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {draft.slides.length} slide{draft.slides.length !== 1 ? 's' : ''}
              {draft.brandProfile?.brandName ? ` · ${draft.brandProfile.brandName}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(View.BRANDING_OS_VISUAL)}
          className="flex items-center gap-2 text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold uppercase tracking-widest transition-colors"
        >
          <Edit3 size={14} /> Abrir no Editor
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Main preview */}
        <div className="flex-1 min-w-0">
          <div
            className="relative rounded-2xl border border-[#1F1F1F] bg-[#0A0A0A] overflow-hidden"
            style={{ aspectRatio: '4/5', maxHeight: '680px' }}
          >
            {cachedImage ? (
              <img
                src={cachedImage.dataUrl}
                alt={`Slide ${selectedIndex + 1}`}
                className="w-full h-full object-contain"
              />
            ) : renderingSlide ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
                <p className="text-xs text-gray-500">Renderizando slide...</p>
              </div>
            ) : currentSlide ? (
              /* CSS fallback preview */
              <div
                className="w-full h-full flex flex-col justify-center p-8"
                style={{ backgroundColor: currentSlide.backgroundColor || '#0a0a0a' }}
              >
                {currentSlide.eyebrow && (
                  <p
                    className="text-xs uppercase tracking-[0.2em] font-bold mb-3"
                    style={{ color: currentSlide.accentColor || '#9900ff' }}
                  >
                    {currentSlide.eyebrow}
                  </p>
                )}
                <h2
                  className="font-bold leading-tight mb-4"
                  style={{
                    color: currentSlide.textColor || '#f5f5f5',
                    fontSize: `${Math.min(currentSlide.titleFontSize || 48, 48)}px`,
                    fontFamily: currentSlide.titleFontFamily === 'sans' ? 'DM Sans, sans-serif' : 'Syne, serif',
                    textAlign: (currentSlide.textAlign as 'left' | 'center' | 'right') || 'left',
                  }}
                >
                  {currentSlide.title}
                </h2>
                {currentSlide.body && (
                  <p
                    className="leading-relaxed"
                    style={{
                      color: `${currentSlide.textColor || '#f5f5f5'}cc`,
                      fontSize: `${Math.min(currentSlide.bodyFontSize || 18, 24)}px`,
                      fontFamily: currentSlide.bodyFontFamily === 'serif' ? 'Syne, serif' : 'DM Sans, sans-serif',
                      textAlign: (currentSlide.textAlign as 'left' | 'center' | 'right') || 'left',
                    }}
                  >
                    {currentSlide.body}
                  </p>
                )}
              </div>
            ) : null}

            {/* Slide navigation overlay */}
            {draft.slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(Math.min(draft.slides.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex === draft.slides.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 rounded-full px-3 py-1 text-[10px] text-white font-bold">
                  {selectedIndex + 1} / {draft.slides.length}
                </div>
              </>
            )}
          </div>

          {/* Export bar */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleExportSingle}
              disabled={isAnyExporting}
              className="flex-1 flex items-center justify-center gap-2 bg-[#141414] border border-[#1F1F1F] hover:border-fuchsia-500/30 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-2xl transition-all disabled:opacity-40"
            >
              {isExportingSingle ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {isExportingSingle ? 'Renderizando...' : 'Exportar Slide'}
            </button>
            <button
              type="button"
              onClick={handleExportPack}
              disabled={isAnyExporting}
              className="flex-1 flex items-center justify-center gap-2 bg-[#141414] border border-[#1F1F1F] hover:border-fuchsia-500/30 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-2xl transition-all disabled:opacity-40"
            >
              {isExportingPack ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ImageIcon size={14} />
              )}
              {isExportingPack ? 'Renderizando...' : 'Pack PNG'}
            </button>
            <button
              type="button"
              onClick={handleExportZip}
              disabled={isAnyExporting}
              className="flex-1 flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-2xl transition-all disabled:opacity-40"
            >
              {isExportingZip ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileArchive size={14} />
              )}
              {isExportingZip ? 'Gerando ZIP...' : 'Download ZIP'}
            </button>
          </div>
        </div>

        {/* Slide strip sidebar */}
        <div className="w-48 shrink-0 space-y-2 max-h-[740px] overflow-y-auto pr-1 custom-scrollbar">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-3">
            Slides
          </p>
          {draft.slides.map((slide, index) => {
            const isSelected = index === selectedIndex;
            const cached = renderedImages.get(slide.id);
            return (
              <button
                key={slide.id ?? index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`w-full rounded-xl border overflow-hidden transition-all ${
                  isSelected
                    ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20'
                    : 'border-[#1F1F1F] hover:border-[#333]'
                }`}
              >
                {cached ? (
                  <img
                    src={cached.dataUrl}
                    alt={`Slide ${index + 1}`}
                    className="w-full aspect-[4/5] object-cover"
                  />
                ) : (
                  <div
                    className="w-full aspect-[4/5] flex flex-col justify-end p-2"
                    style={{ backgroundColor: slide.backgroundColor || '#0a0a0a' }}
                  >
                    <p
                      className="text-[8px] font-bold leading-tight line-clamp-3"
                      style={{ color: slide.textColor || '#f5f5f5' }}
                    >
                      {slide.title}
                    </p>
                    <div
                      className="mt-1 h-0.5 rounded-full"
                      style={{ backgroundColor: slide.accentColor || '#9900ff' }}
                    />
                  </div>
                )}
                <div className="bg-[#141414] px-2 py-1 text-[10px] text-gray-400 text-center font-bold">
                  {index + 1}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
