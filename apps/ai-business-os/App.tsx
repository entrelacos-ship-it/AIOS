import React, { Suspense, lazy, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { View } from './types';
import { Sidebar } from './components/Layout/Sidebar';
import { CommandPalette } from './components/ui/CommandPalette';
import { Card } from './components/ui/Card';
import { DesignReferences } from './views/DesignReferences';
import { TrafficTeam } from './views/TrafficTeam';

// Retry wrapper for lazy imports — avoids infinite re-render loop on transient network errors
function lazyRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
): React.LazyExoticComponent<T> {
  return lazy(() => {
    const attempt = (remaining: number): Promise<{ default: T }> =>
      factory().catch((err) => {
        if (remaining <= 0) throw err;
        return new Promise<{ default: T }>((resolve) =>
          setTimeout(() => resolve(attempt(remaining - 1)), 800),
        );
      });
    return attempt(retries);
  });
}

import { ChunkErrorBoundary } from './components/ChunkErrorBoundary';

const CourseCreator = lazyRetry(() =>
  import('./views/CourseCreator').then((module) => ({ default: module.CourseCreator as React.ComponentType<unknown> })),
);
const PRDStudio = lazyRetry(() =>
  import('./views/PRDStudio').then((module) => ({ default: module.PRDStudio as React.ComponentType<unknown> })),
);
const MediaStudio = lazyRetry(() =>
  import('./views/MediaStudio').then((module) => ({ default: module.MediaStudio as React.ComponentType<unknown> })),
);
const EloCutView = lazyRetry(() =>
  import('./views/EloCut').then((module) => ({ default: module.EloCutView as React.ComponentType<unknown> })),
);
const BrandingOS = lazyRetry(() =>
  import('./views/BrandingOS').then((module) => ({ default: module.BrandingOS as React.ComponentType<unknown> })),
);
const CognitiveEngine = lazyRetry(() =>
  import('./views/CognitiveEngine').then((module) => ({ default: module.CognitiveEngine as React.ComponentType<unknown> })),
);
const DesignSystem = lazyRetry(() =>
  import('./views/DesignSystem').then((module) => ({ default: module.DesignSystem as React.ComponentType<unknown> })),
);
const Ecosystem = lazyRetry(() =>
  import('./views/Ecosystem').then((module) => ({ default: module.Ecosystem as React.ComponentType<unknown> })),
);
const AIControlCenter = lazyRetry(() =>
  import('./views/AIControlCenter').then((module) => ({ default: module.AIControlCenter as React.ComponentType<unknown> })),
);
const EditAIView = lazyRetry(() =>
  import('./views/EditAI').then((module) => ({ default: module.EditAIView as React.ComponentType<unknown> })),
);
const DesignStudio = lazyRetry(() =>
  import('./views/DesignStudio').then((module) => ({ default: module.DesignStudio as React.ComponentType<unknown> })),
);
const SquadManager = lazyRetry(() =>
  import('./views/SquadManager').then((module) => ({ default: module.SquadManager as React.ComponentType<unknown> })),
);
const CloneStudio = lazyRetry(() =>
  import('./views/CloneStudio').then((module) => ({ default: module.CloneStudio as React.ComponentType<unknown> })),
);
const AutoEdit = lazyRetry(() =>
  import('./views/AutoEdit').then((module) => ({ default: module.AutoEdit as React.ComponentType<unknown> })),
);
const AdsStudio = lazyRetry(() =>
  import('./views/AdsStudio').then((module) => ({ default: module.AdsStudio as React.ComponentType<unknown> })),
);
const SlidesStudio = lazyRetry(() =>
  import('./views/SlidesStudio').then((module) => ({ default: module.SlidesStudio as React.ComponentType<unknown> })),
);
const CarouselStudio = lazyRetry(() =>
  import('./views/CarouselStudio').then((module) => ({ default: module.CarouselStudio as React.ComponentType<unknown> })),
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.COURSE_CREATOR_DASHBOARD);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  const renderViewFallback = () => (
    <div className="flex items-center justify-center h-full min-h-[40vh]">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
        <h2 className="text-xl text-white mb-2">Carregando módulo</h2>
        <p className="text-gray-500">Separando dependências e preparando a interface.</p>
      </Card>
    </div>
  );

  // Global Key Listener for Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCmdOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const renderView = () => {
    // Route all Course Creator views to the CourseCreator component
    if (currentView.startsWith('COURSE_CREATOR_')) {
      return <CourseCreator view={currentView} />;
    }

    // Route all PRD Studio views to PRDStudio component
    if (currentView.startsWith('PRD_STUDIO_') || currentView === View.PRD_STUDIO) {
      return <PRDStudio view={currentView} />;
    }

    // Route all Branding OS views to BrandingOS component
    if (currentView.startsWith('BRANDING_OS')) {
      return <BrandingOS view={currentView} onViewChange={setCurrentView} />;
    }

    // Route all Cognitive Engine views to CognitiveEngine component
    if (currentView.startsWith('COGNITIVE_ENGINE_')) {
      return <CognitiveEngine view={currentView} />;
    }

    // Route all Design Studio views to DesignStudio component
    if (currentView.startsWith('DESIGN_STUDIO')) {
      return <DesignStudio view={currentView} onViewChange={setCurrentView} />;
    }

    // Squad Manager
    if (currentView.startsWith('SQUAD_MANAGER')) {
      return <SquadManager view={currentView} onViewChange={setCurrentView} />;
    }

    // Clone Studio
    if (currentView.startsWith('CLONE_STUDIO')) {
      return <CloneStudio view={currentView} onViewChange={setCurrentView} />;
    }

    // AutoEdit
    if (currentView.startsWith('AUTO_EDIT')) {
      return <AutoEdit view={currentView} onViewChange={setCurrentView} />;
    }

    // Ads Studio
    if (currentView.startsWith('ADS_STUDIO')) {
      return <AdsStudio view={currentView} onViewChange={setCurrentView} />;
    }

    // Slides Studio
    if (currentView.startsWith('SLIDES_STUDIO')) {
      return <SlidesStudio view={currentView} onViewChange={setCurrentView} />;
    }

    // Carousel Studio
    if (currentView.startsWith('CAROUSEL_STUDIO')) {
      return <CarouselStudio view={currentView} onViewChange={setCurrentView} />;
    }

    // Route all Design System views to DesignSystem component
    if (currentView.startsWith('DESIGN_SYSTEM')) {
      return <DesignSystem view={currentView} />;
    }

    // Route all EditAI views to EditAIView component
    if (currentView.startsWith('EDIT_AI')) {
      return <EditAIView view={currentView} onViewChange={setCurrentView} />;
    }

    switch (currentView) {
      case View.ELO_CUT:
        return <EloCutView />;
      case View.MEDIA_STUDIO:
        return <MediaStudio />;
      case View.AI_CONTROL_CENTER:
        return <AIControlCenter />;
      case View.DESIGN_REFERENCES:
        return <DesignReferences />;
      case View.TRAFFIC_TEAM:
        return <TrafficTeam />;
      case View.ECOSYSTEM_CLONES:
      case View.ECOSYSTEM_MATRIX:
        return <Ecosystem />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <Card className="p-12 text-center">
              <h2 className="text-2xl text-white mb-2">Área em preparação</h2>
              <p className="text-gray-500">Esta seção ainda não foi conectada à experiência principal do app.</p>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans selection:bg-primary/30">
      <CommandPalette 
        isOpen={isCmdOpen} 
        onClose={() => setIsCmdOpen(false)} 
        onNavigate={setCurrentView} 
      />

      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <main className="pl-64">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center px-8 justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-40">
           <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-semibold text-gray-400">Entrelaç[OS]</span>
              <span>/</span>
              <span className="text-white font-medium">{currentView.replace(/_/g, ' ')}</span>
           </div>
           <div className="flex items-center gap-4">
               <button 
                onClick={() => setIsCmdOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-[#222] rounded text-xs text-gray-500 hover:border-gray-600 transition-colors"
               >
                   <span>Search</span>
                   <kbd className="font-sans bg-[#222] px-1 rounded text-[10px] text-gray-400">⌘K</kbd>
               </button>
           </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
           <ChunkErrorBoundary fallback={
             <div className="flex items-center justify-center h-64">
               <Card className="p-8 text-center">
                 <h2 className="text-xl text-white mb-2">Falha ao carregar módulo</h2>
                 <p className="text-gray-500 mb-4">O navegador esgotou recursos de rede. Recarregue a página.</p>
                 <button
                   onClick={() => window.location.reload()}
                   className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                 >
                   Recarregar
                 </button>
               </Card>
             </div>
           }>
             <Suspense fallback={renderViewFallback()}>
               {renderView()}
             </Suspense>
           </ChunkErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default App;
