import React, { useState, useEffect, useRef } from 'react';
import { View } from '../../types';
import {
  LayoutDashboard,
  Video,
  Bot,
  Palette,
  Boxes,
  Network,
  ChevronDown,
  ChevronRight,
  Activity,
  Layers,
  Users,
  BookOpen,
  FileText,
  Wrench,
  Search,
  LayoutTemplate,
  Telescope,
  ClipboardList,
  ScrollText,
  Share,
  Fingerprint,
  UploadCloud,
  BrainCircuit,
  Download,
  Layout,
  Combine,
  GitMerge,
  Book,
  HeartHandshake,
  Database,
  Hammer,
  Lightbulb,
  Microscope,
  Image,
  Calendar,
  List,
  Clapperboard,
  Wand2,
  History,
  PenTool,
  Cpu,
  Play,
  Scissors,
  TrendingUp,
  BarChart2,
  Presentation,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

interface SidebarItem {
  id: View;
  label: string;
  icon: LucideIcon;
}

const getActiveSectionKey = (view: string): string | null => {
  if (view.startsWith('COURSE_CREATOR_')) return 'course';
  if (view.startsWith('PRD_STUDIO_') || view === View.PRD_STUDIO) return 'prd';
  if (view.startsWith('BRANDING_OS')) return 'branding';
  if (view.startsWith('COGNITIVE_ENGINE_')) return 'cognitive';
  if (view.startsWith('EDIT_AI')) return 'editai';
  if (view.startsWith('DESIGN_STUDIO')) return 'design';
  if (view.startsWith('SQUAD_MANAGER')) return 'squad';
  if (view.startsWith('CLONE_STUDIO')) return 'clone';
  if (view.startsWith('AUTO_EDIT')) return 'autoedit';
  if (view.startsWith('ADS_STUDIO')) return 'ads';
  if (view.startsWith('SLIDES_STUDIO')) return 'slides';
  return null;
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const isCourseCreatorActive = currentView.startsWith('COURSE_CREATOR_');
  const isPrdStudioActive = currentView.startsWith('PRD_STUDIO_') || currentView === View.PRD_STUDIO;
  const isBrandingOsActive = currentView.startsWith('BRANDING_OS');
  const isCognitiveActive = currentView.startsWith('COGNITIVE_ENGINE_');
  const isEditAIActive = currentView.startsWith('EDIT_AI');
  const isDesignStudioActive = currentView.startsWith('DESIGN_STUDIO');
  const isSquadActive = currentView.startsWith('SQUAD_MANAGER');
  const isCloneActive = currentView.startsWith('CLONE_STUDIO');
  const isAutoEditActive = currentView.startsWith('AUTO_EDIT');
  const isAdsActive = currentView.startsWith('ADS_STUDIO');
  const isSlidesActive = currentView.startsWith('SLIDES_STUDIO');

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const key = getActiveSectionKey(currentView);
    return key ? new Set([key]) : new Set<string>();
  });

  // Auto-expand when external navigation (command palette, etc.) changes the active section
  const prevViewRef = useRef(currentView);
  useEffect(() => {
    const prev = prevViewRef.current;
    prevViewRef.current = currentView;
    if (prev === currentView) return;
    const key = getActiveSectionKey(currentView);
    if (key) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedSections(s => {
        if (s.has(key)) return s;
        const next = new Set(s);
        next.add(key);
        return next;
      });
    }
  }, [currentView]);

  const toggle = (key: string, defaultView: View) => {
    const expanding = !expandedSections.has(key);
    const next = new Set(expandedSections);
    if (expanding) next.add(key); else next.delete(key);
    setExpandedSections(next);
    if (expanding) onNavigate(defaultView);
  };

  const courseCreatorExpanded = expandedSections.has('course');
  const prdStudioExpanded     = expandedSections.has('prd');
  const brandingOsExpanded    = expandedSections.has('branding');
  const cognitiveExpanded     = expandedSections.has('cognitive');
  const editAIExpanded        = expandedSections.has('editai');
  const designStudioExpanded  = expandedSections.has('design');
  const squadExpanded         = expandedSections.has('squad');
  const cloneExpanded         = expandedSections.has('clone');
  const autoEditExpanded      = expandedSections.has('autoedit');
  const adsExpanded           = expandedSections.has('ads');
  const slidesExpanded        = expandedSections.has('slides');

  const courseCreatorSubMenu = [
    { id: View.COURSE_CREATOR_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.COURSE_CREATOR_PIPELINE, label: 'Pipeline de Produção', icon: Activity },
    { id: View.COURSE_CREATOR_FRAMEWORKS, label: 'Frameworks', icon: Layers },
    { id: View.COURSE_CREATOR_BLUEPRINTS, label: 'Ferramentas', icon: Wrench },
    { id: View.COURSE_CREATOR_PERSONAS, label: 'Personas', icon: Users },
    { id: View.COURSE_CREATOR_DETAILS, label: 'Detalhes do Curso', icon: BookOpen },
    { id: View.COURSE_CREATOR_EDITOR, label: 'Editor de Aulas', icon: FileText },
  ];

  const prdStudioSubMenu = [
    { id: View.PRD_STUDIO_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.PRD_STUDIO_BRIEF, label: 'Brief Builder', icon: ClipboardList }, 
    { id: View.PRD_STUDIO_KNOWLEDGE, label: 'Ingestão de Conhecimento', icon: UploadCloud },
    { id: View.PRD_STUDIO_ANALYSIS, label: 'Análise (Radar)', icon: Search },
    { id: View.PRD_STUDIO_RESEARCH, label: 'Pesquisas (Persona)', icon: Telescope },
    { id: View.PRD_STUDIO_SPECS, label: 'Spec Wizard (PRD)', icon: ScrollText }, 
    { id: View.PRD_STUDIO_PLAN, label: 'Plan (Épicos)', icon: LayoutTemplate }, 
    { id: View.PRD_STUDIO_EXPORT, label: 'Exportar (Gateway)', icon: Share }, 
  ];

  const brandingOsSubMenu = [
    { id: View.BRANDING_OS_MANIFESTO, label: '0. Base da Marca', icon: Book },
    { id: View.BRANDING_OS_EDITORIAL_LINES, label: 'Linhas Editoriais', icon: List },
    { id: View.BRANDING_OS_CALENDAR, label: 'Calendário de Conteúdo', icon: Calendar },
    { id: View.BRANDING_OS_ASSET, label: '1. Formato', icon: Layout },
    { id: View.BRANDING_OS_CONTEXT, label: '2. Ingestão', icon: UploadCloud },
    { id: View.BRANDING_OS_OBJECTIVE, label: '3. Decomposição', icon: Combine },
    { id: View.BRANDING_OS_CONTENT, label: '4. Construção', icon: BrainCircuit },
    { id: View.BRANDING_OS_VISUAL, label: '5. Embalagem', icon: Palette },
    { id: View.BRANDING_OS_EXPORT, label: '6. Entrega', icon: Download },
  ];

  const cognitiveEngineSubMenu = [
      { id: View.COGNITIVE_ENGINE_INFERENCE, label: 'Ponte de Interferências', icon: GitMerge },
      { id: View.COGNITIVE_ENGINE_PRECISION, label: 'Precisão (Engineering)', icon: Microscope },
      { id: View.COGNITIVE_ENGINE_SCIENTIFIC, label: 'Bases Científicas', icon: Book },
      { id: View.COGNITIVE_ENGINE_RELATIONSHIPS, label: 'Drivers de Relação', icon: HeartHandshake },
      { id: View.COGNITIVE_ENGINE_SYSTEMS, label: 'Mapa do Sistema', icon: Database },
      { id: View.COGNITIVE_ENGINE_TOOLS, label: 'Ferramentas', icon: Hammer },
      { id: View.COGNITIVE_ENGINE_MODELS, label: 'Modelos Mentais', icon: Lightbulb },
  ];

  const studios = [
    { id: View.MEDIA_STUDIO, label: 'Media Studio', icon: Video },
  ];

  const ecosystem = [
      { id: View.ECOSYSTEM_CLONES, label: 'Mapa Operacional', icon: Boxes },
      { id: View.ECOSYSTEM_MATRIX, label: 'Leitura do Ecossistema', icon: Network },
  ];

  const system = [
      { id: View.DESIGN_REFERENCES, label: 'Design References', icon: BookOpen },
      { id: View.DESIGN_SYSTEM, label: 'Design System', icon: Palette },
      { id: View.AI_CONTROL_CENTER, label: 'AI Control Center', icon: Wrench },
  ];

  const designSystemSubMenu = [
      { id: View.DESIGN_SYSTEM_FOUNDATIONS, label: 'Foundations', icon: Book },
      { id: View.DESIGN_SYSTEM_COMPONENTS, label: 'Components', icon: LayoutTemplate },
      { id: View.DESIGN_SYSTEM_ASSETS, label: 'Brand & Assets', icon: Image },
  ];

  const renderLink = (item: SidebarItem) => {
    const isActive = currentView === item.id || 
                     (item.id === View.COURSE_CREATOR_DASHBOARD && currentView.startsWith('COURSE_CREATOR_')) ||
                     (item.id === View.PRD_STUDIO_DASHBOARD && currentView.startsWith('PRD_STUDIO_')) ||
                     (item.id === View.BRANDING_OS && currentView.startsWith('BRANDING_OS')) ||
                     (item.id === View.COGNITIVE_ENGINE_INFERENCE && currentView.startsWith('COGNITIVE_ENGINE_')) ||
                     (item.id === View.DESIGN_SYSTEM && currentView.startsWith('DESIGN_SYSTEM'));

    return (
    <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-r-full text-sm font-medium transition-all group border-l-2 ${
            isActive 
            ? 'bg-primary/20 text-primary border-primary' 
            : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
        }`}
    >
        <item.icon size={18} className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`} />
        {item.label}
    </button>
  )};

  return (
    <div className="w-64 border-r border-border bg-[#0A0A0A] flex flex-col h-full fixed left-0 top-0 overflow-y-auto custom-scrollbar">
      <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Entrelaç<span className="text-primary">[OS]</span>
        </h1>
      </div>
      
      <div className="p-4 space-y-8 flex-1 pr-0">
        <div>
          <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 px-2">
            Estúdios
          </h3>
          <nav className="space-y-0.5">
            <div>
              <button
                onClick={() => toggle('course', View.COURSE_CREATOR_DASHBOARD)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-r-full text-sm font-medium transition-all group border-l-2 ${
                    isCourseCreatorActive
                    ? 'bg-primary/20 text-white border-primary' 
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                    <LayoutDashboard size={18} className={`transition-colors ${isCourseCreatorActive ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`} />
                    <span>Course Creator</span>
                </div>
                {courseCreatorExpanded ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} />}
              </button>
              
              {courseCreatorExpanded && (
                  <div className="mt-1 ml-4 border-l border-gray-800 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                      {courseCreatorSubMenu.map(subItem => (
                          <button
                            key={subItem.id}
                            onClick={() => onNavigate(subItem.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                                currentView === subItem.id 
                                ? 'text-primary bg-primary/10' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                             <span className={currentView === subItem.id ? 'translate-x-0' : 'translate-x-0'}>{subItem.label}</span>
                          </button>
                      ))}
                  </div>
              )}
            </div>

            <div>
              <button
                onClick={() => toggle('prd', View.PRD_STUDIO_DASHBOARD)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-r-full text-sm font-medium transition-all group border-l-2 ${
                    isPrdStudioActive
                    ? 'bg-emerald-500/20 text-white border-emerald-500' 
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                    <Bot size={18} className={`transition-colors ${isPrdStudioActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-white'}`} />
                    <span>PRD Studio</span>
                </div>
                {prdStudioExpanded ? <ChevronDown size={14} className="text-emerald-500" /> : <ChevronRight size={14} />}
              </button>
              
              {prdStudioExpanded && (
                  <div className="mt-1 ml-4 border-l border-gray-800 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                      {prdStudioSubMenu.map(subItem => (
                          <button
                            key={subItem.id}
                            onClick={() => onNavigate(subItem.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                                currentView === subItem.id 
                                ? 'text-emerald-400 bg-emerald-500/10' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                             <span className={currentView === subItem.id ? 'translate-x-0' : 'translate-x-0'}>{subItem.label}</span>
                          </button>
                      ))}
                  </div>
              )}
            </div>

            {studios.map(renderLink)}

            {/* Design Studio expandable */}
            <div>
              <button
                onClick={() => toggle('design', View.DESIGN_STUDIO_DASHBOARD)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDesignStudioActive
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Wand2 size={16} />
                <span className="flex-1 text-left">Design Studio</span>
                {designStudioExpanded
                  ? <ChevronDown size={14} className="opacity-60" />
                  : <ChevronRight size={14} className="opacity-60" />
                }
              </button>
              {designStudioExpanded && (
                <div className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-3 py-1">
                  {[
                    { id: View.DESIGN_STUDIO_DASHBOARD, label: 'Novo Artefato', icon: Wand2 },
                    { id: View.DESIGN_STUDIO_HISTORY, label: 'Histórico', icon: History },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-violet-400 bg-violet-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Open Design — external service */}
            <a
              href="https://opendesign.entrelacospsicologia.com.br"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              <PenTool size={16} />
              <span className="flex-1 text-left">Open Design</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-medium">
                nexu-io ↗
              </span>
            </a>

            {/* Squad Manager expandable */}
            <div>
              <button
                onClick={() => toggle('squad', View.SQUAD_MANAGER)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSquadActive
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Cpu size={16} className={isSquadActive ? 'text-cyan-400' : ''} />
                <span className="flex-1 text-left">Squad Manager</span>
                {squadExpanded
                  ? <ChevronDown size={14} className="opacity-60" />
                  : <ChevronRight size={14} className="opacity-60" />
                }
              </button>
              {squadExpanded && (
                <div className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-3 py-1">
                  {[
                    { id: View.SQUAD_MANAGER, label: 'Squads', icon: Users },
                    { id: View.SQUAD_MANAGER_BUILDER, label: 'Novo Squad', icon: Cpu },
                    { id: View.SQUAD_MANAGER_RUN, label: 'Executar', icon: Play },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-cyan-400 bg-cyan-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clone Studio expandable */}
            <div>
              <button
                onClick={() => toggle('clone', View.CLONE_STUDIO)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isCloneActive
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <BrainCircuit size={16} className={isCloneActive ? 'text-amber-400' : ''} />
                <span className="flex-1 text-left">Clone Studio</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                  Stark
                </span>
                {cloneExpanded
                  ? <ChevronDown size={14} className="opacity-60" />
                  : <ChevronRight size={14} className="opacity-60" />
                }
              </button>
              {cloneExpanded && (
                <div className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-3 py-1">
                  {[
                    { id: View.CLONE_STUDIO, label: 'Biblioteca', icon: Users },
                    { id: View.CLONE_STUDIO_BUILDER, label: 'Criar Clone', icon: Lightbulb },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* AutoEdit expandable */}
            <div>
              <button
                onClick={() => toggle('autoedit', View.AUTO_EDIT)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isAutoEditActive
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Scissors size={16} className={isAutoEditActive ? 'text-rose-400' : ''} />
                <span className="flex-1 text-left">AutoEdit</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium">
                  auto-edit
                </span>
                {autoEditExpanded
                  ? <ChevronDown size={14} className="opacity-60" />
                  : <ChevronRight size={14} className="opacity-60" />
                }
              </button>
              {autoEditExpanded && (
                <div className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-3 py-1">
                  {[
                    { id: View.AUTO_EDIT, label: 'Projetos', icon: LayoutDashboard },
                    { id: View.AUTO_EDIT_UPLOAD, label: 'Novo Projeto', icon: UploadCloud },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Ads Studio expandable */}
            <div>
              <button
                onClick={() => toggle('ads', View.ADS_STUDIO)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isAdsActive
                    ? 'text-teal-400 bg-teal-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <TrendingUp size={16} className={isAdsActive ? 'text-teal-400' : ''} />
                <span className="flex-1 text-left">Ads Studio</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 font-medium">
                  claude-ads
                </span>
                {adsExpanded
                  ? <ChevronDown size={14} className="opacity-60" />
                  : <ChevronRight size={14} className="opacity-60" />
                }
              </button>
              {adsExpanded && (
                <div className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-3 py-1">
                  {[
                    { id: View.ADS_STUDIO, label: 'Dashboard', icon: LayoutDashboard },
                    { id: View.ADS_STUDIO_AUDIT, label: 'Auditoria', icon: TrendingUp },
                    { id: View.ADS_STUDIO_COPY, label: 'Copy Generator', icon: Wand2 },
                    { id: View.ADS_STUDIO_STRATEGY, label: 'Estratégia', icon: Lightbulb },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-teal-400 bg-teal-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time de Tráfego Pago */}
            <button
              onClick={() => onNavigate(View.TRAFFIC_TEAM)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === View.TRAFFIC_TEAM
                  ? 'text-orange-400 bg-orange-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <BarChart2 size={16} className={currentView === View.TRAFFIC_TEAM ? 'text-orange-400' : ''} />
              <span className="flex-1 text-left">Time de Tráfego</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">
                meta ads
              </span>
            </button>

            {/* Slides Studio expandable */}
            <div>
              <button
                onClick={() => toggle('slides', View.SLIDES_STUDIO_DASHBOARD)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSlidesActive
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Presentation size={16} className={isSlidesActive ? 'text-violet-400' : ''} />
                <span className="flex-1 text-left">Slides Studio</span>
                {slidesExpanded
                  ? <ChevronDown size={14} className="opacity-60" />
                  : <ChevronRight size={14} className="opacity-60" />
                }
              </button>
              {slidesExpanded && (
                <div className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-3 py-1">
                  {[
                    { id: View.SLIDES_STUDIO_DASHBOARD, label: 'Biblioteca', icon: LayoutDashboard },
                    { id: View.SLIDES_STUDIO_NEW, label: 'Nova Apresentação', icon: Presentation },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-violet-400 bg-violet-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Carousel Studio */}
            <button
              onClick={() => onNavigate(View.CAROUSEL_STUDIO_DASHBOARD)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView.startsWith('CAROUSEL_STUDIO')
                  ? 'text-fuchsia-400 bg-fuchsia-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Layers size={16} className={currentView.startsWith('CAROUSEL_STUDIO') ? 'text-fuchsia-400' : ''} />
              <span className="flex-1 text-left">Carrosséis</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 font-medium">
                crud
              </span>
            </button>
          </nav>
        </div>

        <div>
           <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 px-2">
            Ecossistema
          </h3>
          <nav className="space-y-0.5">
            {ecosystem.map(renderLink)}

            <div>
              <button
                onClick={() => toggle('cognitive', View.COGNITIVE_ENGINE_PRECISION)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-r-full text-sm font-medium transition-all group border-l-2 ${
                    isCognitiveActive
                    ? 'bg-[#7f13ec]/20 text-white border-[#7f13ec]' 
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                    <BrainCircuit size={18} className={`transition-colors ${isCognitiveActive ? 'text-[#7f13ec]' : 'text-gray-400 group-hover:text-white'}`} />
                    <span>Mentes Sintéticas</span>
                </div>
                {cognitiveExpanded ? <ChevronDown size={14} className="text-[#7f13ec]" /> : <ChevronRight size={14} />}
              </button>
              
              {cognitiveExpanded && (
                  <div className="mt-1 ml-4 border-l border-gray-800 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                      {cognitiveEngineSubMenu.map(subItem => (
                          <button
                            key={subItem.id}
                            onClick={() => onNavigate(subItem.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                                currentView === subItem.id 
                                ? 'text-[#7f13ec] bg-[#7f13ec]/10 font-bold' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                             <span className={currentView === subItem.id ? 'translate-x-0' : 'translate-x-0'}>{subItem.label}</span>
                          </button>
                      ))}
                  </div>
              )}
            </div>

            <div>
              <button
                onClick={() => toggle('branding', View.BRANDING_OS_MANIFESTO)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-r-full text-sm font-medium transition-all group border-l-2 ${
                    isBrandingOsActive
                    ? 'bg-orange-500/20 text-white border-orange-500' 
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                    <Fingerprint size={18} className={`transition-colors ${isBrandingOsActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-white'}`} />
                    <span>Brand[OS]</span>
                </div>
                {brandingOsExpanded ? <ChevronDown size={14} className="text-orange-500" /> : <ChevronRight size={14} />}
              </button>
              
              {brandingOsExpanded && (
                  <div className="mt-1 ml-4 border-l border-gray-800 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                      {brandingOsSubMenu.map(subItem => (
                          <button
                            key={subItem.id}
                            onClick={() => onNavigate(subItem.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                                currentView === subItem.id 
                                ? 'text-orange-400 bg-orange-500/10' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                             <span className={currentView === subItem.id ? 'translate-x-0' : 'translate-x-0'}>{subItem.label}</span>
                          </button>
                      ))}
                  </div>
              )}
            </div>

            {renderLink({ id: View.ELO_CUT, label: 'EloCut', icon: Video })}

            {/* EditAI expandable */}
            <div>
              <button
                onClick={() => toggle('editai', View.EDIT_AI_DASHBOARD)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isEditAIActive
                    ? 'text-sky-400 bg-sky-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Clapperboard size={16} />
                <span className="flex-1 text-left">EditAI</span>
                {editAIExpanded
                  ? <ChevronDown size={14} className="opacity-60" />
                  : <ChevronRight size={14} className="opacity-60" />
                }
              </button>
              {editAIExpanded && (
                <div className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-3 py-1">
                  {[
                    { id: View.EDIT_AI_DASHBOARD, label: 'Projetos', icon: LayoutDashboard },
                    { id: View.EDIT_AI_UPLOAD, label: 'Novo Projeto', icon: UploadCloud },
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-xs font-medium transition-all ${
                        currentView === subItem.id
                          ? 'text-sky-400 bg-sky-500/10'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <subItem.icon size={13} />
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div>
           <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 px-2">
            Core System
          </h3>
          <nav className="space-y-0.5">
            <div>
              {system.map(renderLink)}
              {currentView.startsWith('DESIGN_SYSTEM') && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-border/50 pl-3 py-1">
                      {designSystemSubMenu.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => onNavigate(subItem.id as View)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all duration-200 flex items-center gap-2 ${
                                currentView === subItem.id 
                                ? 'text-primary bg-primary/10' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                             <subItem.icon size={14} />
                             <span className={currentView === subItem.id ? 'translate-x-0' : 'translate-x-0'}>{subItem.label}</span>
                          </button>
                      ))}
                  </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-[#0A0A0A] flex-shrink-0">
         <div className="mt-auto p-4">
            <div className="bg-[#7f13ec]/5 rounded-xl p-4 border border-[#7f13ec]/10">
                <p className="text-[10px] text-[#7f13ec] font-bold uppercase mb-2">System Status</p>
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs text-slate-300">Precision Engine Active</span>
                </div>
            </div>
         </div>
         <div className="flex items-center gap-3 p-2 rounded-full hover:bg-white/5 cursor-pointer transition-colors mt-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">AU</div>
             <div className="flex-1">
                 <div className="text-white text-xs font-medium">Admin User</div>
                 <div className="text-gray-500 text-[10px]">Pro Workspace</div>
             </div>
             <div className="w-2 h-2 rounded-full bg-accent"></div>
         </div>
      </div>
    </div>
  );
};
