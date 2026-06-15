import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { generateLessonScript, ScriptStructure, ScriptSection } from '../services/geminiService';
import { 
    Users, Activity, FileText, Video,
    UserCircle2, BrainCircuit, Sparkles, Wand2, BookOpen, 
    Clock, MoreVertical, CheckCircle, Clock3,
    Share2, ChevronDown, ChevronRight, GripVertical,
    Bold, Italic, Underline, Link, Image as ImageIcon, List, Quote, Code, CloudUpload,
    Zap, Target, Gamepad2, ArrowRight, Layout, AlignLeft, Scroll, FileType, Terminal,
    Filter, GripHorizontal
} from 'lucide-react';
import { Persona, AwarenessLevel, Archetype, LearningStyle, Course, View, Blueprint, BlueprintType, PipelineTask, PipelineStage } from '../types';

// Mock Data for Personas
const MOCK_PERSONAS: Persona[] = [
    {
        id: 'p1',
        name: 'Ricardo, o Transicionador',
        segment_age: '30-45 anos',
        occupation: 'Analista Financeiro',
        awareness_level: AwarenessLevel.PROBLEM_AWARE,
        pain_points: 'Sente que sua carreira está estagnada e teme ser substituído por IA.',
        aspirations: 'Trabalhar remotamente com tecnologia e dobrar sua renda em 12 meses.',
        objections: ['Falta de tempo', 'Medo de programar'],
        archetype: Archetype.EXPLORER,
        triggers: ['Liberdade', 'Segurança'],
        learning_style: LearningStyle.VISUAL,
        time_availability: '1h/noite',
        prior_knowledge: 'Excel avançado, zero código.',
        ai_insight: 'Ricardo precisa de vitórias rápidas nas primeiras aulas para vencer a insegurança técnica.',
        stats: { technical: 30, emotional: 80, availability: 40 }
    },
    {
        id: 'p2',
        name: 'Julia, a Especialista',
        segment_age: '24-30 anos',
        occupation: 'Designer Sênior',
        awareness_level: AwarenessLevel.SOLUTION_AWARE,
        pain_points: 'Cansada de refações manuais, quer escalar sua produção criativa.',
        aspirations: 'Se tornar referência em Design Generativo na sua agência.',
        objections: ['Qualidade estética', 'Curva de aprendizado'],
        archetype: Archetype.CREATOR,
        triggers: ['Exclusividade', 'Inovação'],
        learning_style: LearningStyle.KINESTHETIC,
        time_availability: 'Fins de semana',
        prior_knowledge: 'Domina Adobe Suite, iniciante em Midjourney.',
        ai_insight: 'Foque em comparativos de antes e depois e em exercícios guiados de prompting.',
        stats: { technical: 85, emotional: 60, availability: 20 }
    }
];

// Mock Data for Blueprints
const MOCK_BLUEPRINTS: Blueprint[] = [
    {
        id: 'bp1',
        title: 'O Mentor Lendário',
        type: 'STRAT',
        description: 'Estrutura narrativa 10-80-10 para aulas de alta retenção técnica.',
        icon: Scroll,
        tags: ['Narrativa', 'Roteiro', 'Retenção'],
        recommendedFor: [Archetype.SAGE, Archetype.MAGICIAN],
        structure: {
            steps: ['10% Gancho', '80% Conteúdo Denso', '10% Próximo Passo']
        }
    },
    {
        id: 'bp2',
        title: 'A Quebra de Muralha',
        type: 'STRAT',
        description: 'Script focado em eliminação de objeções antes de aulas complexas.',
        icon: Target,
        tags: ['Objeções', 'Mindset'],
        recommendedFor: [Archetype.WARRIOR, 'p1'], // Recommended for Ricardo explicitly
        structure: {
            steps: ['Empatia Radical', 'O Inimigo Comum', 'A Nova Verdade']
        }
    },
    {
        id: 'bp3',
        title: 'Workshop Guiado',
        type: 'STRAT',
        description: 'Modelo para aulas de "share-screen" e execução em tempo real.',
        icon: Video,
        tags: ['Prático', 'Execução'],
        recommendedFor: [Archetype.CREATOR],
        structure: {
            steps: ['Setup', 'Execução Guiada', 'Revisão de Erros']
        }
    },
    {
        id: 'bp4',
        title: 'PDF Editorial Dark',
        type: 'DOC',
        description: 'Template minimalista para materiais de apoio com alta legibilidade.',
        icon: FileType,
        tags: ['Material de Apoio', 'Design'],
        structure: {
            format: 'A4 / Dark Mode'
        }
    },
    {
        id: 'bp5',
        title: 'Workbook de Ativação',
        type: 'DOC',
        description: 'Caderno de exercícios focado na vitória de 24h do aluno.',
        icon: FileText,
        tags: ['Exercícios', 'Ação'],
        recommendedFor: ['p1'], // Recommended for Ricardo
        structure: {
            format: 'Interativo'
        }
    },
    {
        id: 'bp6',
        title: 'O Crítico Pedagógico',
        type: 'IA',
        description: 'Prompt de sistema para análise de didática e clareza de roteiros.',
        icon: Terminal,
        tags: ['Feedback', 'QA'],
        structure: {
            temperature: 0.2
        }
    },
    {
        id: 'bp7',
        title: 'Gerador de Analogias',
        type: 'IA',
        description: 'Transforma conceitos técnicos complexos em metáforas do cotidiano.',
        icon: Sparkles,
        tags: ['Criatividade', 'Simplificação'],
        recommendedFor: [Archetype.SAGE],
        structure: {
            temperature: 0.7
        }
    }
];

// Mock Data for Pipeline Tasks
const MOCK_PIPELINE_TASKS: PipelineTask[] = [
    { id: 't1', title: 'Fundamentos de produto educacional', personaId: 'p1', stage: PipelineStage.IDEATION, progress: 20, tags: ['Módulo 1'], assignee: 'AN' },
    { id: 't2', title: 'Integrações de API', personaId: 'p2', stage: PipelineStage.IDEATION, progress: 0, tags: ['Módulo 2'], assignee: 'AN' },
    { id: 't3', title: 'Lógica Booleana', personaId: 'p1', stage: PipelineStage.SCRIPTING, progress: 85, duration: '12m', assignee: 'AN' },
    { id: 't4', title: 'Setup de Ambiente', personaId: 'p2', stage: PipelineStage.ASSETS, progress: 100, isStagnant: true, duration: '15m', assignee: 'JD' },
    { id: 't5', title: 'Banco de Dados Relacional', personaId: 'p2', stage: PipelineStage.PRODUCTION, progress: 40, duration: '22m', assignee: 'AN' },
    { id: 't6', title: 'Intro ao Bubble', personaId: 'p1', stage: PipelineStage.PUBLISHED, progress: 100, duration: '18m', assignee: 'AN' },
];

// Sample Data for Course Sandbox
const VIBE_CODING_COURSE: Course = {
    id: 'c1',
    title: 'Curso Modelo - Operação Educacional com IA',
    subtitle: 'Sandbox editorial',
    author: 'Entrelaç[OS]',
    version: 'v1.2',
    status: 'PUBLISHED',
    updatedAt: 'Atualizado hoje',
    healthScore: 92,
    completionRate: 68,
    completionTrend: 2,
    nps: 4.9,
    students: 1240,
    modules: [
        {
            id: 'm1',
            title: 'Fundamentos & Lógica',
            lessons: [
                { id: 'l1', title: 'Fundamentos da operação educacional', duration: '10:05', type: 'VIDEO', retention: 98, status: 'PUBLISHED', tags: ['BASE'] },
                { id: 'l2', title: 'Arquitetura de Dados Básica', duration: '15:30', type: 'VIDEO', retention: 94, status: 'PUBLISHED' },
                { id: 'l3', title: 'Quiz: Lógica Booleana', duration: '5:00', type: 'QUIZ', retention: 88, status: 'PUBLISHED' },
            ]
        },
        {
            id: 'm2',
            title: 'Construindo o MVP',
            dropOffRate: 40,
            lessons: [
                { id: 'l4', title: 'Estrutura de Dados', duration: '22:10', type: 'VIDEO', retention: 60, status: 'PUBLISHED', tags: ['HARD'] },
                { id: 'l5', title: 'Integração de API', duration: '18:45', type: 'VIDEO', retention: 55, status: 'REVISION' },
            ]
        }
    ]
};

const LiquidBar = ({ value, color = 'bg-primary' }: { value: number, color?: string }) => (
    <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
        <div 
            className={`h-full ${color} rounded-full relative`}
            style={{ width: `${value}%` }}
        >
             <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white opacity-50 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
        </div>
    </div>
);

const ScriptBlock = ({ title, color, data }: { title: string, color: 'yellow' | 'green' | 'blue', data: ScriptSection[] }) => {
    const borderColor = color === 'yellow' ? 'border-yellow-500' : color === 'green' ? 'border-green-500' : 'border-blue-500';
    const bgColor = color === 'yellow' ? 'bg-yellow-500/5' : color === 'green' ? 'bg-green-500/5' : 'bg-blue-500/5';
    const textColor = color === 'yellow' ? 'text-yellow-500' : color === 'green' ? 'text-green-500' : 'text-blue-500';

    return (
        <div className={`border-l-4 ${borderColor} ${bgColor} p-4 rounded-r-lg mb-4`}>
            <div className={`text-xs font-bold uppercase tracking-widest ${textColor} mb-3 flex items-center gap-2`}>
                {title}
            </div>
            <div className="space-y-4">
                {data.map((section, idx) => (
                    <div key={idx} className={section.type === 'direction' ? "pl-0" : "pl-4"}>
                        {section.type === 'direction' ? (
                            <p className="font-sans font-bold text-xs uppercase tracking-wider text-gray-500 mb-1">
                                [{section.text}]
                            </p>
                        ) : (
                            <p className="font-serif text-lg leading-relaxed text-gray-200">
                                "{section.text}"
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
};

interface CourseCreatorProps {
    view: View;
}

interface ToolbarItem {
    icon?: React.ElementType;
    label?: string;
    spacer?: boolean;
}

export const CourseCreator: React.FC<CourseCreatorProps> = ({ view }) => {
    const [activeTab, setActiveTab] = useState('CURRICULO'); // CURRICULO, ALUNOS, ANALYTICS, CONFIGS
    
    // Editor State
    const [lessonTitle, setLessonTitle] = useState("Introdução à operação educacional com IA");
    const [lessonSlug, setLessonSlug] = useState("introducao-operacao-educacional");
    const [lessonContent, setLessonContent] = useState(
`# O que é uma operação educacional assistida por IA?

Uma operação educacional bem desenhada combina conteúdo, clareza de progresso e decisões consistentes de produção.

## Principais Vantagens
1. **Velocidade:** ciclos mais curtos entre ideia, aula e publicação.
2. **Consistência:** padrões mais claros para estrutura, revisão e entrega.
3. **Autonomia:** menos retrabalho operacional entre conteúdo, design e mídia.

> "Escala sem clareza só aumenta ruído."`
    );

    // Script Mode State
    const [isScriptMode, setIsScriptMode] = useState(false);
    const [scriptData, setScriptData] = useState<ScriptStructure | null>(null);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    
    // Blueprint State
    const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);

    // Pipeline State
    const [pipelineTasks, setPipelineTasks] = useState<PipelineTask[]>(MOCK_PIPELINE_TASKS);
    const [aiTriggerToast, setAiTriggerToast] = useState<{show: boolean, msg: string}>({ show: false, msg: '' });

    const handleGenerateScript = async () => {
        setIsGeneratingScript(true);
        setIsScriptMode(true);
        try {
            // Using first persona as context for prototype
            const script = await generateLessonScript(lessonTitle, MOCK_PERSONAS[0]);
            setScriptData(script);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    // --- Pipeline Drag and Drop Handlers ---
    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const onDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        
        // Find task
        const task = pipelineTasks.find(t => t.id === taskId);
        if (!task || task.stage === targetStage) return;

        // Logic for AI Trigger
        if (targetStage === PipelineStage.SCRIPTING && task.stage === PipelineStage.IDEATION) {
            setAiTriggerToast({ show: true, msg: 'IA Trigger: Contexto enviado ao AI Studio' });
            setTimeout(() => setAiTriggerToast({ show: false, msg: '' }), 3000);
        }

        // Move task
        setPipelineTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, stage: targetStage } : t
        ));
    };

    // --- Dashboard Specific Data ---
    const kpis = [
        { label: 'CURSOS ATIVOS', value: '8', change: '+12% vs mês anterior', icon: BookOpen, color: 'text-primary' },
        { label: 'TOTAL DE LIÇÕES', value: '161', change: '+5 novas esta semana', icon: FileText, color: 'text-gray-400' },
        { label: 'HORAS DE CONTEÚDO', value: '28.8h', change: '~0% atualizado hoje', icon: Clock, color: 'text-action' },
        { label: 'ALUNOS IMPACTADOS', value: '3.2k', change: '+15% vs mês anterior', icon: Users, color: 'text-accent' },
    ];

    const pipelineSteps = [
        { id: 1, label: 'BRIEFING', count: 8, active: true },
        { id: 2, label: 'PESQUISA', count: 3, active: false },
        { id: 3, label: 'CURRÍCULO', count: 1, active: false },
        { id: 4, label: 'GERAÇÃO', count: 2, active: false },
        { id: 5, label: 'VALIDAÇÃO', count: 0, active: false },
        { id: 6, label: 'PRODUÇÃO', count: 4, active: false },
        { id: 7, label: 'PUBLICADO', count: 12, active: false },
    ];

    const renderDashboard = () => (
        <div className="space-y-6 pb-12">
             {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Visão Geral</h2>
                    <p className="text-gray-500 text-sm font-serif">Painel de referência para acompanhar produção, estrutura e publicação de cursos.</p>
                </div>
                <Button variant="primary" className="h-9 text-xs font-bold">+ Novo Curso</Button>
            </div>

             {/* KPIs */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                    <Card key={idx} className="p-5 min-h-[120px] relative overflow-hidden flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <kpi.icon size={16} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{kpi.label}</span>
                            <div className="text-3xl font-bold text-white mt-1">{kpi.value}</div>
                        </div>
                        <div className={`text-[10px] font-medium ${kpi.label.includes('HORAS') ? 'text-gray-500' : 'text-green-500'}`}>
                            {kpi.change}
                        </div>
                        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${kpi.color.replace('text-', 'via-')}/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    </Card>
                ))}
            </div>

            {/* Pipeline */}
            <div className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-6 relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={14} className="text-action" /> Pipeline de Produção
                    </h3>
                </div>
                <div className="relative px-4 overflow-x-auto pb-4">
                    <div className="min-w-[800px]">
                        <div className="absolute top-[22px] left-0 w-full h-[2px] bg-[#222] -z-10"></div>
                        <div className="flex justify-between items-start">
                            {pipelineSteps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-3 cursor-pointer group">
                                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center bg-[#141414] transition-all z-10 ${
                                        step.active 
                                        ? 'border-accent text-accent shadow-[0_0_15px_rgba(59,224,219,0.3)]' 
                                        : 'border-[#333] text-gray-600 group-hover:border-gray-500 group-hover:text-gray-400'
                                    }`}>
                                        {step.active ? <Activity size={18} /> : step.id === 7 ? <CheckCircle size={18}/> : <span className="text-xs font-mono">{step.id}</span>}
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${step.active ? 'text-accent' : 'text-gray-500'}`}>
                                            {step.label}
                                        </div>
                                        <div className="text-xs font-mono text-gray-400 mt-0.5">{step.count}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Course List Shortcut to Detail View */}
            <Card title="Cursos Recentes">
                <div className="p-4 bg-[#111] border border-border rounded-lg flex items-center gap-4 cursor-pointer hover:border-primary transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Sparkles size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-white group-hover:text-primary transition-colors">Curso Modelo - Operação Educacional com IA</h4>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>v1.2</span> • <span>Atualizado hoje</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="soft" color="success">Publicado</Badge>
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderCourseDetail = () => {
        const course = VIBE_CODING_COURSE;

        return (
            <div className="space-y-8">
                {/* Hero Section */}
                <div className="flex items-start gap-6">
                    {/* Cover Placeholder */}
                    <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                         <div className="opacity-30"><Video size={32} /></div>
                    </div>

                    <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                             <Badge variant="soft" color="success" className="gap-1 px-2 py-0.5">
                                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                 {course.status}
                             </Badge>
                             <span className="text-xs text-gray-500 font-mono">{course.version} ({course.updatedAt})</span>
                         </div>
                         <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">{course.title}</h1>
                         <div className="flex items-center gap-2 text-sm text-gray-400">
                             <span>Criado por <span className="text-gray-200 font-medium">{course.author}</span></span>
                         </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="secondary" className="h-9 px-3"><Share2 size={14} className="mr-2"/> Compartilhar</Button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4 bg-[#111]">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Health Score</div>
                        <div className="text-2xl font-bold text-white flex items-end gap-1">
                            {course.healthScore} <span className="text-xs text-gray-500 mb-1 font-normal">/100</span>
                        </div>
                        <LiquidBar value={course.healthScore} color="bg-accent" />
                    </Card>
                    <Card className="p-4 bg-[#111]">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Conclusão</div>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {course.completionRate}% <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold">+{course.completionTrend}%</span>
                        </div>
                        <LiquidBar value={course.completionRate} color="bg-green-500" />
                    </Card>
                    <Card className="p-4 bg-[#111]">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">NPS</div>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {course.nps} <div className="flex text-action"><Sparkles size={12} fill="currentColor" /><Sparkles size={12} fill="currentColor" /><Sparkles size={12} fill="currentColor" /><Sparkles size={12} fill="currentColor" /><Sparkles size={12} fill="currentColor" /></div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-[#111]">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Alunos</div>
                        <div className="text-2xl font-bold text-white">
                            {course.students}
                        </div>
                        <div className="flex -space-x-2 mt-1">
                            <div className="w-5 h-5 rounded-full bg-gray-700 border border-[#111]"></div>
                            <div className="w-5 h-5 rounded-full bg-gray-600 border border-[#111]"></div>
                            <div className="w-5 h-5 rounded-full bg-gray-500 border border-[#111]"></div>
                        </div>
                    </Card>
                </div>

                {/* Warning Alert */}
                <div className="bg-orange-900/10 border border-orange-700/30 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-10 bg-action rounded-full"></div>
                        <div>
                            <h4 className="text-action font-bold text-sm mb-0.5">Atenção Pedagógica</h4>
                            <p className="text-gray-400 text-xs">O <span className="text-white font-medium">Módulo 2</span> apresenta uma taxa de abandono 40% acima da média. Considere revisar a aula "Estrutura de Dados".</p>
                        </div>
                    </div>
                    <Button variant="secondary" className="h-8 text-xs border-orange-700/50 text-orange-400 hover:text-orange-200">Ver Análise</Button>
                </div>

                {/* Tabs - Updated to "Tag" style */}
                <div className="flex gap-4 border-b border-border pb-4">
                    {['CURRICULO & CONTEÚDO', 'ALUNOS & PROGRESSO', 'ANALYTICS DETALHADO', 'CONFIGURAÇÕES'].map((tab) => (
                        <Button
                            key={tab}
                            variant={activeTab === tab.split(' ')[0] ? 'white' : 'secondary'}
                            onClick={() => setActiveTab(tab.split(' ')[0])}
                            className="text-xs h-8 px-4"
                        >
                            {tab}
                        </Button>
                    ))}
                </div>

                {/* Content List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-sm font-semibold text-white">
                             Estrutura do Curso
                             <div className="flex gap-2 ml-4 text-[10px]">
                                 <span className="flex items-center gap-1 text-green-500"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"/> Publicado</span>
                                 <span className="flex items-center gap-1 text-yellow-500"><div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"/> Revisão</span>
                                 <span className="flex items-center gap-1 text-gray-500"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"/> Rascunho</span>
                             </div>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="ghost" className="h-8 text-xs">Reordenar</Button>
                             <Button variant="secondary" className="h-8 text-xs">+ Adicionar Módulo</Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {course.modules.map(module => (
                            <div key={module.id} className="bg-[#111] border border-border rounded-lg overflow-hidden">
                                {/* Module Header */}
                                <div className="p-4 bg-white/5 flex justify-between items-center border-b border-border">
                                     <div className="flex items-center gap-3">
                                         <div className="p-1 rounded bg-white/5 cursor-pointer hover:bg-white/10"><GripVertical size={14} className="text-gray-600"/></div>
                                         <h3 className="font-bold text-sm text-gray-200">{module.title}</h3>
                                         <Badge variant="soft" color="neutral" className="ml-2">{module.lessons.length} aulas</Badge>
                                     </div>
                                     <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span>45 min total</span>
                                          <div className="flex gap-1">
                                              <Button variant="ghost" className="h-6 w-6 p-0"><FileText size={14}/></Button>
                                              <Button variant="ghost" className="h-6 w-6 p-0"><ChevronDown size={14}/></Button>
                                          </div>
                                     </div>
                                </div>

                                {/* Lessons */}
                                <div>
                                    {module.lessons.map(lesson => (
                                        <div key={lesson.id} className="flex items-center py-3 px-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                                            <div className="w-8 flex justify-center"><div className={`w-2 h-2 rounded-full ${lesson.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-yellow-500'}`}></div></div>
                                            <div className="w-10 flex justify-center text-gray-600"><Video size={16}/></div>
                                            
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-300 font-medium truncate">{lesson.title}</span>
                                                    {lesson.tags?.map(tag => (
                                                        <span key={tag} className="text-[9px] bg-gray-800 text-gray-400 px-1.5 rounded border border-gray-700">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="w-24 text-right text-xs text-gray-500 font-mono mr-8">
                                                {lesson.duration}
                                            </div>

                                            <div className="w-32 mr-4">
                                                <div className="flex justify-between text-[9px] uppercase font-bold text-gray-600 mb-1">
                                                    <span>Retenção</span>
                                                    <span>{lesson.retention}%</span>
                                                </div>
                                                <LiquidBar value={lesson.retention} color={lesson.retention > 80 ? 'bg-green-500' : lesson.retention < 60 ? 'bg-red-500' : 'bg-yellow-500'} />
                                            </div>

                                            <div className="w-10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <MoreVertical size={16} className="text-gray-500 cursor-pointer hover:text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderLessonEditor = () => {
        const toolbarTools: ToolbarItem[] = [
            { icon: Bold, label: 'Bold' },
            { icon: Italic, label: 'Italic' },
            { icon: Underline, label: 'Underline' },
            { spacer: true },
            { icon: List, label: 'List' },
            { icon: Quote, label: 'Quote' },
            { spacer: true },
            { icon: Link, label: 'Link' },
            { icon: ImageIcon, label: 'Image' },
            { icon: Code, label: 'Code' }
        ];

        return (
            <div className="h-full flex flex-col gap-6">
                {/* Header Actions */}
                <div className="flex justify-between items-start">
                     <div className="space-y-1">
                         <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                             <span>Curso modelo</span>
                             <ChevronRight size={10} />
                             <span>Módulo 1</span>
                             <ChevronRight size={10} />
                             <span className="text-white">Aula 01</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <h2 className="text-2xl font-bold text-white">Introdução à operação educacional com IA</h2>
                             <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                 Rascunho
                             </div>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <Button variant="ghost" className="text-xs h-9 hover:bg-white/5"><Clock size={14} className="mr-2"/> Histórico</Button>
                         <Button variant="secondary" className="text-xs h-9">Salvar Rascunho</Button>
                         <Button variant="primary" className="text-xs h-9 px-6"><CheckCircle size={14} className="mr-2"/> Publicar</Button>
                     </div>
                </div>

                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Left Column: Editor */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Título da Aula</label>
                            <input 
                                type="text" 
                                value={lessonTitle}
                                onChange={(e) => setLessonTitle(e.target.value)}
                                className="w-full bg-transparent border-b border-border text-lg font-bold text-white py-2 focus:border-primary focus:outline-none placeholder-gray-700"
                            />
                        </div>

                        <div className="space-y-1">
                             <label className="text-[10px] uppercase font-bold text-gray-500">URL Slug</label>
                             <div className="flex items-center bg-[#111] border border-border rounded-lg px-3 py-2 text-xs">
                                 <span className="text-gray-500">academialendaria.com/curso/vibecoding/</span>
                                 <input 
                                    type="text" 
                                    value={lessonSlug}
                                    onChange={(e) => setLessonSlug(e.target.value)}
                                    className="flex-1 bg-transparent text-white font-mono focus:outline-none ml-1"
                                 />
                             </div>
                        </div>

                        {/* Rich Text Editor Container */}
                        <div className="flex-1 flex flex-col bg-[#111] border border-border rounded-lg overflow-hidden">
                             {/* Toolbar */}
                             <div className="flex items-center gap-1 p-2 border-b border-border bg-[#161616]">
                                 <div className="flex gap-1 border-r border-gray-700 pr-2 mr-2">
                                     <button 
                                        onClick={() => setIsScriptMode(false)}
                                        className={`p-1.5 rounded transition-colors ${!isScriptMode ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}
                                        title="Editor cru"
                                     >
                                        <AlignLeft size={14} />
                                     </button>
                                     <button 
                                        onClick={() => setIsScriptMode(true)}
                                        className={`p-1.5 rounded transition-colors ${isScriptMode ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}
                                        title="Visual 10-80-10"
                                     >
                                        <Layout size={14} />
                                     </button>
                                 </div>

                                 {!isScriptMode && toolbarTools.map((tool, i) => (
                                     tool.spacer ? (
                                         <div key={i} className="w-px h-4 bg-gray-700 mx-2" />
                                     ) : (
                                         <button key={i} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                                            {tool.icon && <tool.icon size={14} />}
                                         </button>
                                     )
                                 ))}
                                 
                                 <div className="flex-1" />

                                 <Button 
                                    variant="primary" 
                                    className="h-7 text-[10px] px-3" 
                                    onClick={handleGenerateScript}
                                    isLoading={isGeneratingScript}
                                 >
                                    <Wand2 size={12} className="mr-1" />
                                    Gerar Roteiro (10-80-10)
                                 </Button>
                             </div>
                             
                             {/* Content Area */}
                             <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                                {isScriptMode ? (
                                    <div className="p-6">
                                        {isGeneratingScript ? (
                                            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                                                <Wand2 size={32} className="animate-pulse text-primary mb-2" />
                                                <span className="text-xs font-mono">Gerando roteiro...</span>
                                            </div>
                                        ) : scriptData ? (
                                            <div className="max-w-3xl mx-auto space-y-6">
                                                <ScriptBlock title="10% - O Gancho (Atenção)" color="yellow" data={scriptData.hook} />
                                                <ScriptBlock title="80% - Conteúdo Denso (Entrega)" color="green" data={scriptData.content} />
                                                <ScriptBlock title="10% - Próximo Passo (Ação)" color="blue" data={scriptData.cta} />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                                <FileText size={48} strokeWidth={1} className="mb-4 opacity-30" />
                                                <p className="text-sm">Nenhum roteiro gerado.</p>
                                                <Button variant="secondary" className="mt-4" onClick={handleGenerateScript}>
                                                    Gerar com IA
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <textarea 
                                        value={lessonContent}
                                        onChange={(e) => setLessonContent(e.target.value)}
                                        className="w-full h-full bg-[#111] p-6 text-gray-300 font-serif text-base leading-relaxed resize-none focus:outline-none selection:bg-primary/30"
                                    />
                                )}
                             </div>
                        </div>
                    </div>

                    {/* Right Column: Assets */}
                    <div className="w-80 flex flex-col gap-6">
                        <Card title="Video Principal">
                            <div className="space-y-3">
                                <label className="text-[10px] text-gray-500">Link do vídeo (Youtube, Vimeo, Panda)</label>
                                <div className="flex items-center bg-[#0A0A0A] border border-border rounded px-3 py-2 text-xs">
                                    <Link size={12} className="text-gray-500 mr-2" />
                                    <input type="text" placeholder="https://..." className="flex-1 bg-transparent text-white focus:outline-none" />
                                </div>
                                <div className="aspect-video bg-[#0A0A0A] border border-border rounded flex flex-col items-center justify-center text-gray-600">
                                    <Video size={24} className="mb-2 opacity-50" />
                                    <span className="text-[10px]">Nenhum vídeo vinculado</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-border">
                                    <span>Autoplay</span>
                                    <div className="w-8 h-4 bg-[#222] rounded-full relative cursor-pointer">
                                        <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-gray-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Materiais de Apoio">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2 bg-[#1A1A1A] border border-border rounded group cursor-pointer hover:border-primary/50 transition-colors">
                                    <div className="p-2 bg-red-500/10 rounded text-red-500"><FileText size={16} /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-white truncate group-hover:text-primary">Slide_Deck_v1.pdf</div>
                                        <div className="text-[10px] text-gray-500">2.4 MB</div>
                                    </div>
                                    <Button variant="ghost" className="h-6 w-6 p-0 hover:text-red-500"><MoreVertical size={14}/></Button>
                                </div>

                                <div className="border border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                                    <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-gray-500 mb-2 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                        <CloudUpload size={16} />
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium group-hover:text-white">Clique para upload</span>
                                    <span className="text-[10px] text-gray-600 mt-1">SVG, PNG, JPG ou GIF (max. 800x400px)</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    const renderFrameworks = () => {
        const mandalaData = [
            { subject: 'Mindset', A: 100, fullMark: 100 },
            { subject: 'Tooling', A: 85, fullMark: 100 },
            { subject: 'Method', A: 95, fullMark: 100 },
            { subject: 'Scaling', A: 70, fullMark: 100 },
        ];

        return (
            <div className="space-y-6">
                 {/* Header */}
                 <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Biblioteca de Frameworks</h2>
                        <p className="text-gray-500 text-sm font-serif">Coleção de frameworks e estruturas-modelo para produção educacional.</p>
                    </div>
                    <Badge variant="outlined" color="primary">Blueprints v2.0</Badge>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* 1. Mandala de Valor */}
                    <Card className="col-span-1 overflow-visible">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Target size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">A Mandala de Valor</h3>
                                <p className="text-xs text-gray-500">Framework de Estruturação Radial</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mandalaData}>
                                        <PolarGrid stroke="#222" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
                                        <Radar name="Value" dataKey="A" stroke="#8F43F6" fill="#8F43F6" fillOpacity={0.2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { l: 'Mindset', d: 'Quebra de crenças' },
                                    { l: 'Tooling', d: 'Ferramentas práticas' },
                                    { l: 'Methodology', d: 'O Passo a passo' },
                                    { l: 'Scaling', d: 'Expansão de resultados' }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className="text-xs font-bold text-white">{item.l}</span>
                                        <span className="text-[10px] text-gray-500">{item.d}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                            <Button variant="secondary" className="w-full text-xs">Aplicar ao Curso</Button>
                        </div>
                    </Card>

                    {/* 2. Framework Narrativo 10-80-10 */}
                    <Card className="col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Narrativa 10-80-10</h3>
                                <p className="text-xs text-gray-500">O Roteiro da Aula Perfeita (Edutainment)</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex h-8 rounded-lg overflow-hidden font-bold text-[10px] uppercase text-center leading-8">
                                <div className="w-[10%] bg-action text-white">Hook</div>
                                <div className="w-[80%] bg-[#222] text-gray-400 border-x border-[#111]">Conteúdo Denso</div>
                                <div className="w-[10%] bg-accent text-black">CTA</div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 text-center font-bold text-action text-lg">10%</div>
                                    <div>
                                        <h4 className="text-white text-sm font-bold">O Gancho (Hook)</h4>
                                        <p className="text-xs text-gray-500">Conexão emocional imediata. "Por que essa aula muda seu jogo agora?"</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 text-center font-bold text-gray-500 text-lg">80%</div>
                                    <div>
                                        <h4 className="text-white text-sm font-bold">A Entrega (Core)</h4>
                                        <p className="text-xs text-gray-500">Promessa técnica sem enrolação. Frameworks, exemplos e execução.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 text-center font-bold text-accent text-lg">10%</div>
                                    <div>
                                        <h4 className="text-white text-sm font-bold">Próximo Passo (CTA)</h4>
                                        <p className="text-xs text-gray-500">Tarefa imediata. "O que fazer assim que fechar este vídeo."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 3. Retenção & Gamificação */}
                    <Card className="col-span-1">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <Gamepad2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Gamificação de Micro-Doses</h3>
                                <p className="text-xs text-gray-500">Engenharia de Retenção</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-[#111] rounded border border-border">
                                 <Zap size={20} className="text-yellow-500 mb-2"/>
                                 <h4 className="font-bold text-white text-sm">Micro-Learning</h4>
                                 <p className="text-xs text-gray-500 mt-1">Aulas de max. 12min. Se for maior, quebre em partes.</p>
                             </div>
                             <div className="p-4 bg-[#111] rounded border border-border">
                                 <Clock3 size={20} className="text-primary mb-2"/>
                                 <h4 className="font-bold text-white text-sm">The 24h Rule</h4>
                                 <p className="text-xs text-gray-500 mt-1">Toda aula deve ter uma aplicação executável em 24h.</p>
                             </div>
                        </div>
                        <div className="mt-4 p-3 bg-white/5 rounded flex items-center gap-3">
                            <div className="p-1.5 bg-green-500 rounded-full"><CheckCircle size={12} className="text-black"/></div>
                            <span className="text-xs text-gray-300">Checkpoint Psicomático configurado para cada módulo.</span>
                        </div>
                    </Card>

                    {/* 4. AI Contextualização Reversa */}
                    <Card className="col-span-1">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <BrainCircuit size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Contextualização Reversa</h3>
                                <p className="text-xs text-gray-500">O segredo do AI Studio</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono py-6">
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto bg-[#222] rounded-full flex items-center justify-center border border-gray-700 mb-2">
                                    <UserCircle2 size={20} className="text-gray-400"/>
                                </div>
                                <span className="text-gray-500">Persona</span>
                            </div>
                            <ArrowRight size={16} className="text-gray-600"/>
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto bg-[#222] rounded-full flex items-center justify-center border border-gray-700 mb-2">
                                    <Target size={20} className="text-action"/>
                                </div>
                                <span className="text-gray-500">Archetype</span>
                            </div>
                             <ArrowRight size={16} className="text-gray-600"/>
                             <div className="text-center">
                                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary mb-2 shadow-[0_0_15px_rgba(143,67,246,0.3)]">
                                    <Sparkles size={20} className="text-primary"/>
                                </div>
                                <span className="text-white font-bold">AI Content</span>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 bg-[#111] p-3 rounded border border-border">
                            "A IA não cria do zero. Ela lê primeiro quem é o aluno e qual o tom de voz do mentor (Mago/Rebelde) para então gerar o currículo."
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    const renderPersonas = () => {
         const renderPersonaCard = (persona: Persona) => {
            const radarData = [
                { subject: 'Tech Skill', A: persona.stats.technical, fullMark: 100 },
                { subject: 'Emotional', A: persona.stats.emotional, fullMark: 100 },
                { subject: 'Time', A: persona.stats.availability, fullMark: 100 },
            ];
    
            return (
                <Card key={persona.id} className="flex flex-col h-full border-t-4 border-t-primary/50 hover:border-t-primary transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#1F1F1F] flex items-center justify-center border border-border">
                                <UserCircle2 size={24} className="text-gray-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-base leading-tight">{persona.name}</h3>
                                <span className="text-xs text-gray-500">{persona.occupation} • {persona.segment_age}</span>
                            </div>
                        </div>
                        <Badge variant="soft" color={persona.awareness_level === AwarenessLevel.PROBLEM_AWARE ? 'primary' : 'success'}>
                            {persona.awareness_level}
                        </Badge>
                    </div>
    
                    {/* Radar Chart Mandala */}
                    <div className="h-40 w-full mb-2 -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#222" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
                                <Radar name="Stats" dataKey="A" stroke="#8F43F6" fill="#8F43F6" fillOpacity={0.2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
    
                    <div className="space-y-4 flex-grow">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-gray-600 tracking-wider mb-1 block">Deep Psychomatics</span>
                            <p className="font-serif text-sm text-gray-300 italic mb-2">"{persona.pain_points}"</p>
                            <p className="font-serif text-sm text-gray-400">Aspires to: <span className="text-gray-300">{persona.aspirations}</span></p>
                        </div>
    
                        <div className="p-3 bg-blue-900/10 border border-blue-900/30 rounded relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-20">
                                <BrainCircuit size={48} className="text-blue-500" />
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={12} className="text-blue-400" />
                                <span className="text-[10px] font-bold text-blue-400 uppercase">AI Insight</span>
                            </div>
                            <p className="text-xs text-blue-200/80 leading-relaxed relative z-10">
                                {persona.ai_insight}
                            </p>
                        </div>
                    </div>
    
                    <div className="mt-6 pt-4 border-t border-border">
                        <Button variant="primary" className="w-full">
                            <Wand2 size={16} /> Inject Context
                        </Button>
                    </div>
                </Card>
            );
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-end mb-6">
                     <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Gerenciador de Personas</h2>
                        <p className="text-gray-500 text-sm font-serif">Defina o perfil psicológico e técnico dos seus alunos.</p>
                     </div>
                     <Button variant="secondary" className="h-8 text-xs">+ Nova Persona</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {MOCK_PERSONAS.map(renderPersonaCard)}
                    <div className="border border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-600 hover:border-primary/50 hover:text-primary transition-all cursor-pointer min-h-[400px]">
                        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center mb-4">
                            <Users size={32} strokeWidth={1} />
                        </div>
                        <span className="font-semibold text-sm">Criar nova persona</span>
                        <span className="text-xs mt-1 opacity-50">Define your ideal student</span>
                    </div>
                </div>
            </div>
        )
    }

    const renderBlueprints = () => {
        // Active Context Mock
        const activePersona = MOCK_PERSONAS[0]; // Ricardo

        const getBadgeColor = (type: BlueprintType): 'primary' | 'success' | 'danger' | 'neutral' | 'accent' | 'action' => {
            switch(type) {
                case 'IA': return 'accent'; // Mint
                case 'DOC': return 'neutral'; // Blue-ish in our types override or custom CSS
                case 'STRAT': return 'action'; // Gold/Orange
                default: return 'neutral';
            }
        };

        return (
            <div className="h-full flex gap-6">
                {/* Main Grid */}
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Context Header */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Arsenal de Ferramentas</h2>
                            <p className="text-gray-500 text-sm font-serif">Blueprints e frameworks prontos para instanciação no fluxo.</p>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-[#141414] border border-[#222] rounded-full px-3 py-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Contexto Ativo:</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] text-indigo-400 border border-indigo-500/30">R</div>
                                <span className="text-xs text-gray-300 font-medium">{activePersona.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MOCK_BLUEPRINTS.map(bp => {
                            const isRecommended = bp.recommendedFor?.includes(activePersona.id) || bp.recommendedFor?.includes(activePersona.archetype);
                            
                            return (
                                <Card 
                                    key={bp.id} 
                                    className={`cursor-pointer transition-all hover:-translate-y-1 ${selectedBlueprint?.id === bp.id ? 'border-primary shadow-[0_0_15px_rgba(143,67,246,0.15)]' : ''}`}
                                >
                                    <div 
                                        className="h-full flex flex-col p-2"
                                        onClick={() => setSelectedBlueprint(bp)}
                                        onMouseEnter={() => setSelectedBlueprint(bp)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`p-2 rounded-lg bg-[#0A0A0A] border border-[#222] ${isRecommended ? 'text-primary' : 'text-gray-400'}`}>
                                                <bp.icon size={20} />
                                            </div>
                                            <div className="flex gap-2">
                                                {isRecommended && (
                                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/30" title="Recomendado para a persona ativa">
                                                        <Sparkles size={10} />
                                                    </div>
                                                )}
                                                <Badge variant="soft" color={getBadgeColor(bp.type)}>{bp.type}</Badge>
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-sm font-bold text-white mb-1 leading-tight">{bp.title}</h3>
                                        <p className="text-xs text-gray-500 font-serif line-clamp-2 mb-4 flex-grow">{bp.description}</p>
                                        
                                        <div className="flex flex-wrap gap-1 mt-auto">
                                            {bp.tags.map(tag => (
                                                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#111] border border-[#222] text-gray-500">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Right Preview Panel */}
                <div className="w-80 shrink-0 border-l border-border pl-6 flex flex-col">
                    {selectedBlueprint ? (
                        <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                            <div className="mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#222] to-[#111] border border-border flex items-center justify-center mb-4 text-white shadow-lg">
                                    <selectedBlueprint.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{selectedBlueprint.title}</h3>
                                <Badge variant="outlined" color={getBadgeColor(selectedBlueprint.type)} className="mb-4">
                                    {selectedBlueprint.type === 'IA' ? 'Prompt de Sistema' : selectedBlueprint.type === 'STRAT' ? 'Framework Estratégico' : 'Documento Mestre'}
                                </Badge>
                                <p className="text-sm text-gray-400 font-serif leading-relaxed">
                                    {selectedBlueprint.description}
                                </p>
                            </div>

                            <div className="flex-grow space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] uppercase font-bold text-gray-600 tracking-widest border-b border-[#222] pb-1">Estrutura Lógica</h4>
                                    
                                    {selectedBlueprint.structure?.steps ? (
                                        <div className="space-y-2">
                                            {selectedBlueprint.structure.steps.map((step, i) => (
                                                <div key={i} className="flex items-center gap-3 text-sm text-gray-300 bg-[#111] p-2 rounded border border-[#222]">
                                                    <div className="w-5 h-5 rounded-full bg-[#0A0A0A] border border-[#333] flex items-center justify-center text-[10px] font-mono text-gray-500">{i+1}</div>
                                                    {step}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-[#111] rounded border border-[#222] space-y-2">
                                            {selectedBlueprint.structure?.temperature && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Criatividade (temp)</span>
                                                    <span className="text-primary font-mono">{selectedBlueprint.structure.temperature}</span>
                                                </div>
                                            )}
                                            {selectedBlueprint.structure?.format && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Formato</span>
                                                    <span className="text-white">{selectedBlueprint.structure.format}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-border">
                                <Button className="w-full h-10" onClick={() => alert(`Instanciando ${selectedBlueprint.title} no pipeline...`)}>
                                    <Wand2 size={16} /> Instanciar Agora
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 text-center opacity-50">
                            <Layout size={48} strokeWidth={1} className="mb-4" />
                            <p className="text-sm">Selecione um blueprint para visualizar a estrutura.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPipeline = () => {
        const columns = [
            { id: PipelineStage.IDEATION, label: 'Ideação & Briefing' },
            { id: PipelineStage.SCRIPTING, label: 'Roteirização (IA)' },
            { id: PipelineStage.ASSETS, label: 'Ativos & Docs' },
            { id: PipelineStage.PRODUCTION, label: 'Produção' },
            { id: PipelineStage.POST_PRODUCTION, label: 'Pós-Produção' },
            { id: PipelineStage.PUBLISHED, label: 'Publicado' }
        ];

        return (
            <div className="h-full flex flex-col relative overflow-hidden">
                {/* AI Trigger Toast Simulation */}
                {aiTriggerToast.show && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
                        <div className="bg-[#111] border border-primary/30 text-white px-4 py-3 rounded-lg shadow-[0_0_30px_rgba(143,67,246,0.2)] flex items-center gap-3">
                            <Wand2 size={18} className="text-primary animate-pulse" />
                            <span className="text-sm font-medium">{aiTriggerToast.msg}</span>
                        </div>
                    </div>
                )}

                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6 shrink-0 px-1">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Pipeline de Produção</h2>
                        <p className="text-gray-500 text-sm font-serif">O chão de fábrica da Academia Lendária.</p>
                    </div>
                    <div className="flex gap-3">
                         <div className="flex items-center bg-[#141414] border border-[#222] rounded-md px-1 p-0.5">
                             <Button variant="ghost" className="h-7 px-3 text-xs text-white bg-[#222] rounded-sm">Kanban</Button>
                             <Button variant="ghost" className="h-7 px-3 text-xs">Lista</Button>
                         </div>
                         <Button variant="primary" className="h-8 text-xs">+ Nova Aula</Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex gap-4 items-center mb-6 shrink-0 px-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 border-r border-[#222] pr-4">
                        <Filter size={14} />
                        <span>Filtros:</span>
                    </div>
                    <div className="flex gap-2">
                        {['Minhas Aulas', 'Módulo 1', 'Persona: Ricardo'].map(f => (
                            <button key={f} className="text-[10px] px-2 py-1 bg-[#141414] border border-[#222] rounded text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Board Area */}
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <div className="flex h-full gap-4 min-w-[1400px] px-1 pb-4">
                        {columns.map(col => {
                            const tasks = pipelineTasks.filter(t => t.stage === col.id);
                            
                            return (
                                <div 
                                    key={col.id} 
                                    className="flex-shrink-0 w-72 flex flex-col h-full bg-transparent rounded-lg"
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, col.id)}
                                >
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-300">{col.label}</span>
                                            <span className="text-[10px] text-gray-600 bg-[#1A1A1A] px-1.5 py-0.5 rounded-full">{tasks.length}</span>
                                        </div>
                                        {col.id === PipelineStage.SCRIPTING && <Wand2 size={12} className="text-primary opacity-50" />}
                                    </div>

                                    {/* Drop Zone */}
                                    <div className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-2 space-y-3 overflow-y-auto custom-scrollbar relative">
                                        {/* Column Background Hint */}
                                        {tasks.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                                <div className="w-full h-full border-2 border-dashed border-[#222] rounded-lg m-2 flex items-center justify-center">
                                                    <span className="text-[10px] text-gray-700 uppercase font-bold">Drop here</span>
                                                </div>
                                            </div>
                                        )}

                                        {tasks.map(task => (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, task.id)}
                                                className={`
                                                    bg-[#141414] border hover:border-[#444] rounded-md p-3 relative group cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5 hover:shadow-lg
                                                    ${task.isStagnant ? 'border-red-900/30 shadow-[0_0_10px_rgba(220,38,38,0.1)]' : 'border-[#222]'}
                                                `}
                                            >
                                                {/* Stagnant Indicator */}
                                                {task.isStagnant && (
                                                    <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Estagnado > 48h"></div>
                                                )}

                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] text-gray-500 font-mono">{task.id.toUpperCase()}</span>
                                                    <GripHorizontal size={12} className="text-gray-700 opacity-0 group-hover:opacity-100" />
                                                </div>

                                                <h4 className="text-sm font-semibold text-gray-200 mb-3 leading-snug">{task.title}</h4>

                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {task.tags?.map(tag => (
                                                        <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-[#1F1F1F] text-gray-400 rounded border border-[#2A2A2A]">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Metadata Footer */}
                                                <div className="flex items-center justify-between pt-2 border-t border-[#1F1F1F]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[9px]">
                                                            {task.assignee}
                                                        </div>
                                                        {task.duration && (
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                                <Clock size={10} /> {task.duration}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Persona Indicator */}
                                                    <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center text-[8px] text-gray-500" title={`Persona: ${task.personaId}`}>
                                                        {task.personaId === 'p1' ? 'R' : 'J'}
                                                    </div>
                                                </div>

                                                {/* Liquid Progress Bar at bottom edge */}
                                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111] rounded-b-md overflow-hidden">
                                                     <div 
                                                        className={`h-full ${task.progress === 100 ? 'bg-green-500' : 'bg-primary'} transition-all duration-500`} 
                                                        style={{ width: `${task.progress}%` }} 
                                                     />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-w-0 h-full">
            {view === View.COURSE_CREATOR_DASHBOARD && renderDashboard()}
            {view === View.COURSE_CREATOR_DETAILS && renderCourseDetail()}
            {view === View.COURSE_CREATOR_PERSONAS && renderPersonas()}
            {view === View.COURSE_CREATOR_EDITOR && renderLessonEditor()}
            {view === View.COURSE_CREATOR_FRAMEWORKS && renderFrameworks()}
            {view === View.COURSE_CREATOR_BLUEPRINTS && renderBlueprints()}
            {view === View.COURSE_CREATOR_PIPELINE && renderPipeline()}
        </div>
    );
};
