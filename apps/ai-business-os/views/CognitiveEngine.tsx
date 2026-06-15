import React, { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CognitiveSystem, View, InferenceEvent } from '../types';
import { 
    Activity, Search,
    Network, Box, Server,
    BarChart3, GitMerge,
    FlaskConical, Sparkles, Bell, Settings,
    ChevronRight,
    ArrowRight as ArrowForward, Lock, Download, 
    Eye, Target, Brain, Microscope, TrendingUp
} from 'lucide-react';

const MOCK_SYSTEMS: CognitiveSystem[] = [
    {
        id: 's2',
        name: 'Big Five (OCEAN)',
        description: 'O padrão-ouro da psicologia de personalidade. Modelo empírico com décadas de pesquisa cross-cultural.',
        category: 'clinical',
        type: 'dim',
        componentsCount: 5,
        validity: 'High',
        utility: 'Medium',
        coverage: 88,
        originYear: 1980,
        detectionConfidence: 95,
        tags: ['Abertura', 'Conscienciosidade', 'Extroversão', 'Amabilidade', 'Neuroticismo'],
    },
    {
        id: 's7',
        name: 'HEXACO',
        description: 'Modelo de seis dimensões de personalidade humana, introduzindo Honestidade-Humildade. Melhor predição de comportamentos éticos.',
        category: 'clinical',
        type: 'dim',
        componentsCount: 6,
        validity: 'High',
        utility: 'Medium',
        coverage: 94,
        originYear: 2000,
        detectionConfidence: 90,
        tags: ['Honestidade-Humildade', 'Emocionalidade', 'Extroversão', 'Amabilidade', 'Conscienciosidade', 'Abertura'],
    }
];

const MOCK_INFERENCE_STREAM: InferenceEvent[] = [
    {
        id: 'evt_01',
        timestamp: 'há 2 s',
        userHash: 'U_9281',
        inputType: 'behavior',
        inputSnippet: 'análise comportamental',
        detectedDriver: 'Eneagrama 6 - Autopreservação',
        mappedSystem: 'Eneagrama',
        confidenceScore: 92,
        actionSuggested: 'Validar autonomia em tomadas de decisão e fornecer segurança estrutural nos processos críticos.'
    },
    {
        id: 'evt_02',
        timestamp: 'há 15 s',
        userHash: 'U_8812',
        inputType: 'text',
        inputSnippet: 'análise textual',
        detectedDriver: 'Eneagrama 4 - Social',
        mappedSystem: 'Eneagrama',
        confidenceScore: 87,
        actionSuggested: 'Reduzir carga cognitiva em tarefas repetitivas. Estimular expressão de identidade nos projetos atuais.'
    }
];

interface CognitiveEngineProps {
    view: View;
}

export const CognitiveEngine: React.FC<CognitiveEngineProps> = ({ view }) => {
    const [selectedSystem, setSelectedSystem] = useState<CognitiveSystem | null>(null);

    // --- Shared Header ---
    const renderHeader = () => {
        if (view === View.COGNITIVE_ENGINE_PRECISION) {
            return (
                <header className="h-16 border-b border-[#7f13ec]/10 flex items-center justify-between px-8 shrink-0 bg-[#191022]">
                    <div className="flex items-center gap-4 text-white">
                        <Microscope className="text-[#7f13ec]" size={20} />
                        <h2 className="text-lg font-bold tracking-tight font-display uppercase">Detalhe de Precisão</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search className="text-slate-400 cursor-pointer hover:text-white transition-colors" size={20} />
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="size-10 rounded-lg bg-[#7f13ec]/5 border border-[#7f13ec]/10 flex items-center justify-center text-slate-400 hover:text-[#7f13ec] transition-all">
                                <Bell size={18} />
                            </button>
                            <div className="h-8 w-[1px] bg-[#7f13ec]/10"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold leading-none text-white">Painel local</p>
                                    <p className="text-[10px] text-[#7f13ec] font-bold uppercase tracking-wider">leitura de referência</p>
                                </div>
                                <div className="size-10 rounded-full border-2 border-[#7f13ec]/20 bg-[#2b1938] flex items-center justify-center text-xs font-bold text-[#d7b8ff]">
                                    CE
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            );
        }

        return (
            <header className="z-40 flex items-center justify-between px-10 py-4 bg-[#000000] border-b border-white/10 shrink-0 sticky top-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                            <GitMerge className="text-white" size={18} />
                        </div>
                        <div>
                            <h2 className="text-white text-base font-bold leading-tight tracking-tight uppercase font-sans">Entrelaç[OS]</h2>
                            <p className="text-[9px] text-primary font-bold tracking-[0.2em] uppercase opacity-80">Mapeamento Cognitivo</p>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 ml-4">
                        <button className={`text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 ${view === View.COGNITIVE_ENGINE_SYSTEMS ? 'text-white font-bold' : 'text-[#ad92c9] hover:text-white'}`} onClick={() => {}}>
                            Sistemas
                        </button>
                        <button className={`text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 ${view === View.COGNITIVE_ENGINE_RELATIONSHIPS ? 'text-white font-bold' : 'text-[#ad92c9] hover:text-white'}`} onClick={() => {}}>
                            Correlações
                        </button>
                        <button className={`text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 ${view === View.COGNITIVE_ENGINE_SCIENTIFIC ? 'text-white font-bold' : 'text-[#ad92c9] hover:text-white'}`} onClick={() => {}}>
                            Base científica
                        </button>
                        <button className={`text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 ${view === View.COGNITIVE_ENGINE_PRECISION ? 'text-white font-bold border-b-2 border-primary pb-1' : 'text-[#ad92c9] hover:text-white'}`} onClick={() => {}}>
                            Precisão
                        </button>
                        <button className={`text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 ${view === View.COGNITIVE_ENGINE_INFERENCE ? 'text-white font-bold' : 'text-[#ad92c9] hover:text-white'}`} onClick={() => {}}>
                            Ponte de inferência
                        </button>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/20 text-white hover:bg-primary/40 transition-all">
                            <Bell size={18} />
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/20 text-white hover:bg-primary/40 transition-all">
                            <Settings size={18} />
                        </button>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">AU</div>
                </div>
            </header>
        );
    }

    // --- VIEW: PRECISION DETAIL ---
    const renderPrecisionDetail = () => (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#191022] font-display">
            <style>{`
                .font-display { font-family: 'Space Grotesk', sans-serif; }
                .font-serif { font-family: 'Source Serif 4', serif; }
                .liquid-bar-container { background: rgba(127, 19, 236, 0.08); position: relative; overflow: hidden; }
                .liquid-fill { background: linear-gradient(90deg, #7f13ec 0%, #a855f7 100%); box-shadow: 0 0 15px rgba(127, 19, 236, 0.4); position: relative; }
                .glow-ring { box-shadow: 0 0 25px rgba(127, 19, 236, 0.3), inset 0 0 15px rgba(127, 19, 236, 0.2); }
                .sidebar-blur { backdrop-filter: blur(8px); background-color: rgba(35, 24, 45, 0.8); }
            `}</style>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
                <span>Seção 3.2</span>
                <ChevronRight size={12} className="text-slate-600" />
                <span>Engenharia cognitiva</span>
                <ChevronRight size={12} className="text-slate-600" />
                <span className="text-[#7f13ec]">Precisão</span>
            </nav>

            {/* Page Heading */}
            <div className="flex flex-wrap justify-between items-start mb-12 gap-6">
                <div className="max-w-2xl">
                    <h3 className="text-4xl font-black tracking-tight text-white mb-3">Matriz Dimensional Big Five</h3>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Visão de referência das cinco dimensões e facetas usadas para orientar leituras estruturadas.
                        Esta área ainda funciona como painel demonstrativo de precisão.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-[#7f13ec]/10 border border-[#7f13ec]/20 rounded-lg text-[#7f13ec] text-xs font-black uppercase tracking-widest hover:bg-[#7f13ec]/20 transition-all">
                        Recalibrar matriz
                    </button>
                    <button className="px-5 py-2.5 bg-[#7f13ec] rounded-lg text-white text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[#7f13ec]/30 transition-all flex items-center gap-2">
                        <Download size={14} />
                        Exportar dados
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Column: Dimensional Matrix */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    
                    {/* Dimension Card: Openness */}
                    <div className="bg-[#23182d]/40 border border-[#7f13ec]/10 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-5">
                                <div className="size-14 rounded-xl bg-[#7f13ec]/20 flex items-center justify-center border border-[#7f13ec]/30 shadow-inner">
                                    <Eye className="text-[#7f13ec]" size={28} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-white tracking-tight">Abertura à Experiência</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Grupo de Facetas A</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-[#7f13ec]">94.2%</span>
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Precisão agregada</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {[
                                { label: 'Imaginação', val: 98 },
                                { label: 'Interesse artístico', val: 91 },
                                { label: 'Emocionalidade', val: 87 },
                                { label: 'Abertura ao novo', val: 99 }
                            ].map(facet => (
                                <div key={facet.label} className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                        <span>{facet.label}</span>
                                        <span className="text-[#7f13ec]">{facet.val}%</span>
                                    </div>
                                    <div className="h-1.5 w-full liquid-bar-container rounded-full">
                                        <div className="h-full liquid-fill rounded-full transition-all duration-1000 ease-out" style={{ width: `${facet.val}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dimension Card: Conscientiousness */}
                    <div className="bg-[#23182d]/40 border border-[#7f13ec]/10 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-5">
                                <div className="size-14 rounded-xl bg-[#7f13ec]/20 flex items-center justify-center border border-[#7f13ec]/30 shadow-inner">
                                    <Target className="text-[#7f13ec]" size={28} />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-white tracking-tight">Conscienciosidade</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Grupo de Facetas B</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-[#7f13ec]">89.7%</span>
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Precisão agregada</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                            {[
                                { label: 'Autoeficácia', val: 92 },
                                { label: 'Organização', val: 85 }
                            ].map(facet => (
                                <div key={facet.label} className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                        <span>{facet.label}</span>
                                        <span className="text-[#7f13ec]">{facet.val}%</span>
                                    </div>
                                    <div className="h-1.5 w-full liquid-bar-container rounded-full">
                                        <div className="h-full liquid-fill rounded-full" style={{ width: `${facet.val}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & AI Panel */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    
                    {/* Cobertura Humana Metric */}
                    <div className="bg-[#23182d]/60 border border-[#7f13ec]/20 rounded-2xl p-10 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#7f13ec]/5 group-hover:bg-[#7f13ec]/10 transition-colors -z-10"></div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7f13ec] mb-8">Cobertura humana</p>
                        
                        <div className="relative size-56 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-[#7f13ec]/10"></div>
                            {/* Animated SVG Ring */}
                            <svg className="absolute inset-0 size-full -rotate-90">
                                <circle 
                                    cx="112" cy="112" r="108" 
                                    fill="transparent" stroke="#7f13ec" strokeWidth="8"
                                    strokeDasharray="678" strokeDashoffset="11"
                                    strokeLinecap="round"
                                    className="glow-ring transition-all duration-1000 ease-in-out"
                                />
                            </svg>
                            <div className="flex flex-col items-center">
                                <span className="text-6xl font-black tracking-tighter text-white">98.4%</span>
                                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-1">
                                    <TrendingUp size={14} />
                                    +2.1%
                                </span>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-[#7f13ec]/10 w-full text-left">
                            <p className="text-sm font-medium text-slate-400 leading-relaxed italic font-serif">
                                "Painel de referência para orientar critérios de leitura, não um stream científico em produção."
                            </p>
                        </div>
                    </div>

                    <div className="sidebar-blur border border-[#7f13ec]/20 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Brain className="text-[#7f13ec]" size={24} />
                            <h5 className="text-base font-black uppercase tracking-tight text-white">Lógica de inferência</h5>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-4 bg-white/5 rounded-xl border-l-4 border-[#7f13ec]">
                                <p className="text-xs leading-relaxed text-slate-300">
                                    A <span className="text-white font-bold">ponte de inferência</span> resume como dimensões amplas podem orientar leituras consistentes sem depender de tipologias frágeis.
                                </p>
                            </div>
                            
                            <div className="pt-4 border-t border-[#7f13ec]/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Referências-base</p>
                                <div className="space-y-5 font-serif italic text-sm text-slate-400">
                                    <div className="leading-relaxed border-b border-white/5 pb-4">
                                        "A estrutura dos traços fenotípicos de personalidade oferece um quadro estável para modelagem preditiva."
                                        <span className="block mt-2 font-sans not-italic text-[9px] font-black text-[#7f13ec] uppercase">— Goldberg, L. R. (1990)</span>
                                    </div>
                                    <div className="leading-relaxed">
                                        "Facetas oferecem maior precisão diagnóstica do que domínios amplos para inferência individual."
                                        <span className="block mt-2 font-sans not-italic text-[9px] font-black text-[#7f13ec] uppercase">— Costa & McCrae (1995)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-10 py-4 rounded-xl bg-[#7f13ec]/10 border border-[#7f13ec]/20 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#7f13ec] transition-all flex items-center justify-center gap-3">
                            <Sparkles size={16} />
                            Solicitar análise aprofundada
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- VIEW: SCIENTIFIC BASE ---
    const renderScientificView = () => (
        <div className="flex-1 flex flex-col bg-[#000000] overflow-y-auto custom-scrollbar items-center py-10 px-6 lg:px-20 font-display">
            <style>{`
                .glass-border { border: 1px solid rgba(127, 19, 236, 0.2); }
                .liquid-bar-glow { box-shadow: 0 0 8px rgba(127, 19, 236, 0.4); }
                .gauge-container { position: relative; width: 80px; height: 80px; }
                .gauge-svg { transform: rotate(-90deg); }
                .valid-high { color: #0bda73; }
                .valid-low { color: #ef4444; }
                .surface-dark { background-color: #0a060e; }
            `}</style>

            <div className="max-w-[1100px] w-full flex flex-col gap-10">
                
                {/* Heading & Global Gauge */}
                <div className="flex flex-wrap justify-between items-center gap-6 surface-dark p-8 rounded-xl glass-border">
                    <div className="flex flex-col gap-2">
                        <span className="text-primary font-bold text-[10px] uppercase tracking-widest">Base científica</span>
                        <h1 className="text-white text-5xl font-black leading-tight tracking-[-0.033em]">Hub de Modelos Cognitivos</h1>
                        <p className="text-[#ad92c9] text-lg font-serif italic">Painel de referência para validade psicométrica e leitura comportamental.</p>
                    </div>
                    
                    <div className="flex items-center gap-6 bg-black/40 p-6 rounded-xl border border-white/5">
                        <div className="flex flex-col items-end">
                            <p className="text-[#ad92c9] text-sm font-medium uppercase tracking-tighter">Cobertura Média</p>
                            <p className="text-white text-3xl font-black">31%</p>
                            <p className="valid-high text-[10px] font-bold">+2,4% vs ciclo anterior</p>
                        </div>
                        <div className="gauge-container">
                            <svg className="gauge-svg w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-white/10 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8"></circle>
                                <circle className="text-primary stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeDasharray="251.2" strokeDashoffset="173.3" strokeLinecap="round" strokeWidth="8"></circle>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <BarChart3 className="text-primary" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-4">
                    <div className="h-px grow bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    <h2 className="text-white text-xs font-black uppercase tracking-widest px-4">Sistemas mapeados</h2>
                    <div className="h-px grow bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                </div>

                {/* Drivers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    
                    {/* Big Five Card */}
                    <div className="flex flex-col gap-5 p-6 surface-dark rounded-xl glass-border hover:border-primary/60 transition-all group">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-white text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">Big Five (OCEAN)</h3>
                                <p className="text-[#ad92c9] text-xs font-serif italic mt-1 leading-relaxed max-w-[85%]">
                                    A taxonomia para traços de personalidade, o modelo mais aceito cientificamente.
                                </p>
                            </div>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0bda73]/10 text-[#0bda73] text-[9px] font-black uppercase tracking-tighter border border-[#0bda73]/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0bda73]"></div> Alta Validade
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end text-[9px] font-semibold text-[#ad92c9] uppercase tracking-widest">
                                <span>Cobertura do espectro</span>
                                <span className="text-white">88%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full liquid-bar-glow" style={{ width: '88%' }}></div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {['Abertura', 'Conscienciosidade', 'Extroversão', 'Amabilidade', 'Neuroticismo'].map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[#ad92c9] text-[9px] font-semibold">{tag}</span>
                            ))}
                        </div>
                        <button className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">
                            <span>Ver documentação</span>
                            <ArrowForward size={14} />
                        </button>
                    </div>

                    {/* HEXACO Model Card */}
                    <div className="flex flex-col gap-5 p-6 surface-dark rounded-xl glass-border hover:border-primary/60 transition-all group">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-white text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">HEXACO Model</h3>
                                <p className="text-[#ad92c9] text-xs font-serif italic mt-1 leading-relaxed max-w-[85%]">
                                    Modelo de seis dimensões introduzindo Honestidade-Humildade para melhor predição ética.
                                </p>
                            </div>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0bda73]/10 text-[#0bda73] text-[9px] font-black uppercase tracking-tighter border border-[#0bda73]/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0bda73]"></div> Alta Validade
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end text-[9px] font-semibold text-[#ad92c9] uppercase tracking-widest">
                                <span>Cobertura do espectro</span>
                                <span className="text-white">94%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full liquid-bar-glow" style={{ width: '94%' }}></div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {['Honestidade-Humildade', 'Emocionalidade', 'Extroversão', 'Amabilidade', 'Conscienciosidade'].map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[#ad92c9] text-[9px] font-semibold">{tag}</span>
                            ))}
                        </div>
                        <button className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">
                            <span>Ver documentação</span>
                            <ArrowForward size={14} />
                        </button>
                    </div>

                    {/* MBTI Card (Low Validity) */}
                    <div className="flex flex-col gap-5 p-6 surface-dark rounded-xl glass-border border-[#ef4444]/10 hover:border-[#ef4444]/40 transition-all group opacity-60 grayscale hover:grayscale-0">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-white text-2xl font-bold tracking-tight group-hover:valid-low transition-colors">MBTI Indicator</h3>
                                <p className="text-[#ad92c9] text-xs font-serif italic mt-1 leading-relaxed max-w-[85%]">
                                    Preferências psicológicas na percepção do mundo. Baixa validade estatística teste-reteste.
                                </p>
                            </div>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-[9px] font-black uppercase tracking-tighter border border-[#ef4444]/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></div> Baixa Validade
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end text-[9px] font-semibold text-[#ad92c9] uppercase tracking-widest">
                                <span>Cobertura do espectro</span>
                                <span className="valid-low">12%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#ef4444]/40 rounded-full" style={{ width: '12%' }}></div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 opacity-50">
                            {['E/I Version', 'S/N Sensing', 'T/F Thinking', 'J/P Judging'].map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[#ad92c9] text-[9px] font-semibold">{tag}</span>
                            ))}
                        </div>
                        <button className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-white/10 text-white/40 text-xs font-bold cursor-not-allowed">
                            <span>Documentação restrita</span>
                            <Lock size={12} />
                        </button>
                    </div>

                    {/* Enneagram Card (Low Validity) */}
                    <div className="flex flex-col gap-5 p-6 surface-dark rounded-xl glass-border border-[#ef4444]/10 hover:border-[#ef4444]/40 transition-all group opacity-60 grayscale hover:grayscale-0">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-white text-2xl font-bold tracking-tight group-hover:valid-low transition-colors">Eneagrama</h3>
                                <p className="text-[#ad92c9] text-xs font-serif italic mt-1 leading-relaxed max-w-[85%]">
                                    Modelo de tipologia qualitativa. Útil para autoconhecimento, sem fundamentação psicométrica.
                                </p>
                            </div>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-[9px] font-black uppercase tracking-tighter border border-[#ef4444]/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></div> Baixa Validade
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end text-[9px] font-semibold text-[#ad92c9] uppercase tracking-widest">
                                <span>Cobertura do espectro</span>
                                <span className="valid-low">5%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#ef4444]/40 rounded-full" style={{ width: '5%' }}></div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 opacity-50">
                            {['Type 1-9 Integration', 'Wings Theory', 'Triads'].map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[#ad92c9] text-[9px] font-semibold">{tag}</span>
                            ))}
                        </div>
                        <button className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-white/10 text-white/40 text-xs font-bold cursor-not-allowed">
                            <span>Documentação restrita</span>
                            <Lock size={12} />
                        </button>
                    </div>
                </div>

                {/* Footer Auditoria */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10 border-t border-white/10 mt-auto mb-10">
                    <div className="flex flex-col gap-1">
                        <span className="text-[#ad92c9] text-[9px] uppercase font-bold tracking-widest">Sistemas ativos</span>
                        <span className="text-white text-xl font-black">2,481</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[#ad92c9] text-[9px] uppercase font-bold tracking-widest">Ciclo de validação</span>
                        <span className="text-white text-xl font-black">Q2 - 2026</span>
                    </div>
                    <div className="flex flex-col gap-1 items-end justify-center">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black rounded-lg hover:bg-primary hover:text-white transition-all uppercase tracking-widest">
                            <span>Exportar dados</span>
                            <Download size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- VIEW: INFERENCE BRIDGE (STREAM) ---
    const renderInferenceBridge = () => (
        <div className="flex-1 flex flex-col bg-[#0A0A0A] overflow-hidden p-8">
             <style>{`
                .liquid-bar {
                    background: linear-gradient(90deg, #38003d 0%, #c98dce 100%);
                    box-shadow: 0 0 10px rgba(201, 141, 206, 0.4);
                }
                .glass-panel {
                    background: rgba(34, 15, 35, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(71, 32, 75, 0.5);
                }
            `}</style>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-white font-sans">Ponte de Interferências</h1>
                    <p className="text-[#c98dce] text-sm">Stream de referência para leituras comportamentais e consistência de critério.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-green-500 uppercase">leitura local ativa</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="xl:col-span-7 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                            <Activity className="text-[#c98dce]" size={18} />
                            Stream cognitivo
                        </h3>
                        <span className="text-[10px] text-[#c98dce]/60 italic">Atualizado há instantes</span>
                    </div>

                    <div className="relative border-l-2 border-[#47204b] ml-4 pl-8 flex flex-col gap-10">
                        {MOCK_INFERENCE_STREAM.map((evt, idx) => (
                            <div key={evt.id} className="relative">
                                <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 ring-4 bg-[#38003d] border-[#000000] ring-[#38003d]/20"></div>
                                <div className={`glass-panel p-6 rounded-xl flex flex-col gap-4 border-l-4 ${idx % 2 === 0 ? 'border-l-[#c98dce]' : 'border-l-[#38003d]'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-bold text-[#c98dce] uppercase tracking-widest mb-1">Driver detectado</p>
                                            <h4 className="text-lg font-bold text-white leading-none">{evt.detectedDriver}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-[#c98dce] font-medium">Confiança</p>
                                            <p className="text-xl font-black text-white">{evt.confidenceScore}%</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                                        <div className="liquid-bar h-full" style={{ width: `${evt.confidenceScore}%` }}></div>
                                    </div>
                                    <div className="bg-[#38003d]/20 border border-[#38003d]/40 p-4 rounded-lg">
                                        <p className="text-xs text-slate-200 leading-relaxed font-serif">
                                            <span className="font-bold text-white">Ação Sugerida:</span> {evt.actionSuggested}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-5 space-y-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                        <FlaskConical className="text-[#c98dce]" size={18} />
                        Validade científica
                    </h3>
                    {['Big Five (OCEAN)', 'HEXACO Model'].map(sys => (
                        <div key={sys} className="glass-panel p-5 rounded-xl border-l-4 border-l-green-500">
                            <div className="flex justify-between items-center mb-4">
                                <h5 className="text-sm font-bold text-white">{sys}</h5>
                                <Badge variant="soft" color="success">Padrão forte</Badge>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full" style={{ width: sys.includes('OCEAN') ? '99%' : '94%' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // --- VIEW: SYSTEMS (DATABASE) ---
    const renderSystemsView = () => (
        <div className="flex-1 flex flex-col p-8 bg-[#0A0A0A] overflow-hidden">
            <div className="flex justify-between items-center mb-8 bg-[#0E0E0E] p-3 rounded-xl border border-[#1F1F1F]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-[#333]">
                        <Server size={16} className="text-gray-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Painel operacional</div>
                        <div className="text-xs text-gray-300 font-medium">Matriz operacional</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase">sistema: online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
                {MOCK_SYSTEMS.map(system => (
                    <div 
                        key={system.id}
                        onClick={() => setSelectedSystem(system)}
                        className={`bg-[#141414] border rounded-2xl p-6 cursor-pointer transition-all group relative overflow-hidden ${
                            selectedSystem?.id === system.id
                                ? 'border-primary/60 shadow-[0_0_0_1px_rgba(210,163,92,0.2)]'
                                : 'border-[#222] hover:border-primary/50'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Box size={20} />
                             </div>
                             <Badge variant="soft" color="neutral">VALIDADE: {system.validity}</Badge>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{system.name}</h3>
                        <p className="text-xs text-gray-400 font-serif leading-relaxed line-clamp-3 mb-6">{system.description}</p>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {system.tags?.slice(0,3).map(d => (
                                <span key={d} className="px-2 py-0.5 bg-[#0A0A0A] rounded text-[9px] text-gray-500 border border-[#222]">{d}</span>
                            ))}
                        </div>
                        <Button variant="secondary" className="w-full text-xs h-9 border-[#333]">Abrir base</Button>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- VIEW: CORRELATION GRAPH ---
    const renderCorrelationsView = () => (
        <div className="relative flex-1 flex flex-col overflow-hidden bg-[#050505]">
            <style>{`
                .glow-node { box-shadow: 0 0 15px 2px rgba(127, 19, 236, 0.6); }
                .graph-grid {
                    background-image: radial-gradient(#2a1b3d 0.5px, transparent 0.5px);
                    background-size: 30px 30px;
                }
                .node-pulse { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: .7; transform: scale(1.05); }
                }
                .correlation-line { stroke: rgba(127, 19, 236, 0.15); stroke-width: 0.5; }
            `}</style>
            <main className="relative flex-1 overflow-hidden graph-grid bg-[#050505] rounded-xl m-2 border border-[#2a1b3d]/30 flex items-center justify-center">
                 <div className="text-center space-y-4">
                    <Network size={64} className="text-primary mx-auto animate-pulse" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">Visualizador de correlações</h2>
                    <p className="text-[#ad92c9] font-serif italic">Área demonstrativa para mapas relacionais entre sistemas cognitivos.</p>
                 </div>
            </main>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[#000000]">
            {renderHeader()}
            
            <div className="flex-1 flex flex-col min-h-0">
                {view === View.COGNITIVE_ENGINE_SYSTEMS && renderSystemsView()}
                {view === View.COGNITIVE_ENGINE_INFERENCE && renderInferenceBridge()}
                {view === View.COGNITIVE_ENGINE_RELATIONSHIPS && renderCorrelationsView()}
                {view === View.COGNITIVE_ENGINE_SCIENTIFIC && renderScientificView()}
                {view === View.COGNITIVE_ENGINE_PRECISION && renderPrecisionDetail()}
            </div>

            {/* Fallback */}
            {![View.COGNITIVE_ENGINE_SYSTEMS, View.COGNITIVE_ENGINE_INFERENCE, View.COGNITIVE_ENGINE_RELATIONSHIPS, View.COGNITIVE_ENGINE_SCIENTIFIC, View.COGNITIVE_ENGINE_PRECISION].includes(view) && (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                        <Activity size={48} className="mx-auto mb-4 opacity-20" />
                        <h2 className="text-xl font-bold text-gray-400">Em Desenvolvimento</h2>
                        <p className="text-sm mt-2 font-serif italic">Módulo cognitivo em fase de compilação.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
