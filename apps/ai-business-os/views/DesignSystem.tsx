import React from 'react';
import { View } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Type, Palette, Circle, Square, Triangle, Image as ImageIcon, Sparkles, Zap } from 'lucide-react';

interface DesignSystemProps {
  view: string;
}

const data = [
  { subject: 'Rebelde', A: 120, fullMark: 150 },
  { subject: 'Mago', A: 98, fullMark: 150 },
  { subject: 'Sábio', A: 86, fullMark: 150 },
  { subject: 'Criador', A: 99, fullMark: 150 },
  { subject: 'Herói', A: 85, fullMark: 150 },
  { subject: 'Amante', A: 65, fullMark: 150 },
];

const chartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
];

export const DesignSystem: React.FC<DesignSystemProps> = ({ view }) => {
  
  const renderFoundations = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
            <Card title="Regra dos 8%">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#0A0A0A] border border-border rounded-lg flex items-center justify-center text-xs text-gray-500">
                            92%
                        </div>
                        <div className="flex-1 text-sm text-gray-400">
                            Fundo e superfícies (base neutra)
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center text-xs text-white font-bold shadow-[0_0_15px_rgba(143,67,246,0.4)]">
                            8%
                        </div>
                        <div className="flex-1 text-sm text-gray-400">
                            Ação e foco (roxo secundário)
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-tertiary rounded-lg flex items-center justify-center text-xs text-white font-bold">
                            Acc
                        </div>
                        <div className="flex-1 text-sm text-gray-400">
                            Destaques (laranja terciário)
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-quaternary rounded-lg flex items-center justify-center text-xs text-black font-bold">
                            Acc
                        </div>
                        <div className="flex-1 text-sm text-gray-400">
                            Destaques (turquesa de apoio)
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Paleta de Cores">
                <div className="space-y-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-2">Primária (neutros e fundos)</div>
                        <div className="flex h-16 rounded-md overflow-hidden text-[10px] font-mono">
                            <div className="bg-[#0A0A0A] flex-1 p-2 flex flex-col justify-end text-white/50"><span>Base</span><span>#0A0A0A</span></div>
                            <div className="bg-[#141414] flex-1 p-2 flex flex-col justify-end text-white/60"><span>Card</span><span>#141414</span></div>
                            <div className="bg-[#1F1F1F] flex-1 p-2 flex flex-col justify-end text-white/70"><span>Border</span><span>#1F1F1F</span></div>
                            <div className="bg-[#27272a] flex-1 p-2 flex flex-col justify-end text-white/80"><span>Hover</span><span>#27272a</span></div>
                            <div className="bg-[#3f3f46] flex-1 p-2 flex flex-col justify-end text-white"><span>Muted</span><span>#3f3f46</span></div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-2">Secundária (roxo)</div>
                        <div className="flex h-16 rounded-md overflow-hidden text-[10px] font-mono">
                            <div className="bg-[#4c1d95] flex-1 p-2 flex flex-col justify-end text-white/70"><span>900</span><span>#4c1d95</span></div>
                            <div className="bg-[#6d28d9] flex-1 p-2 flex flex-col justify-end text-white/80"><span>700</span><span>#6d28d9</span></div>
                            <div className="bg-[#8F43F6] flex-1 p-2 flex flex-col justify-end text-white font-bold"><span>500</span><span>#8F43F6</span></div>
                            <div className="bg-[#a78bfa] flex-1 p-2 flex flex-col justify-end text-black/70"><span>400</span><span>#a78bfa</span></div>
                            <div className="bg-[#ddd6fe] flex-1 p-2 flex flex-col justify-end text-black/70"><span>200</span><span>#ddd6fe</span></div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-2">Terciária (laranja)</div>
                        <div className="flex h-16 rounded-md overflow-hidden text-[10px] font-mono">
                            <div className="bg-[#7c2d12] flex-1 p-2 flex flex-col justify-end text-white/70"><span>900</span><span>#7c2d12</span></div>
                            <div className="bg-[#c2410c] flex-1 p-2 flex flex-col justify-end text-white/80"><span>700</span><span>#c2410c</span></div>
                            <div className="bg-[#F79533] flex-1 p-2 flex flex-col justify-end text-white font-bold"><span>500</span><span>#F79533</span></div>
                            <div className="bg-[#fb923c] flex-1 p-2 flex flex-col justify-end text-black/70"><span>400</span><span>#fb923c</span></div>
                            <div className="bg-[#fed7aa] flex-1 p-2 flex flex-col justify-end text-black/70"><span>200</span><span>#fed7aa</span></div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-2">Quaternária (turquesa)</div>
                        <div className="flex h-16 rounded-md overflow-hidden text-[10px] font-mono">
                            <div className="bg-[#115e59] flex-1 p-2 flex flex-col justify-end text-white/70"><span>900</span><span>#115e59</span></div>
                            <div className="bg-[#0f766e] flex-1 p-2 flex flex-col justify-end text-white/80"><span>700</span><span>#0f766e</span></div>
                            <div className="bg-[#3BE0DB] flex-1 p-2 flex flex-col justify-end text-black font-bold"><span>500</span><span>#3BE0DB</span></div>
                            <div className="bg-[#5eead4] flex-1 p-2 flex flex-col justify-end text-black/70"><span>300</span><span>#5eead4</span></div>
                            <div className="bg-[#ccfbf1] flex-1 p-2 flex flex-col justify-end text-black/70"><span>100</span><span>#ccfbf1</span></div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        <div className="col-span-2 space-y-6">
            <Card title="Sistema Tipográfico">
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-[#111]">
                        <div className="p-3 bg-white/5 rounded-full">
                            <Type size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-sans font-semibold text-lg">Inter (interface)</h4>
                            <p className="text-gray-500 text-sm mb-4">Aplicada em navegação, controles, botões e áreas operacionais.</p>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-xs text-gray-500 w-24">Título 1</span>
                                    <span className="text-2xl font-bold text-white flex-1">Clareza antes de complexidade</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-xs text-gray-500 w-24">Título 2</span>
                                    <span className="text-xl font-semibold text-white flex-1">Sistema com hierarquia consistente</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-xs text-gray-500 w-24">Corpo</span>
                                    <span className="text-sm font-normal text-gray-300 flex-1">Textos curtos, legíveis e objetivos para uso diário da aplicação.</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 w-24">Legenda</span>
                                    <span className="text-xs font-medium text-gray-500 flex-1 uppercase tracking-wider">sinais de apoio e metadata</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-[#111]">
                        <div className="p-3 bg-white/5 rounded-full">
                            <span className="font-serif text-2xl text-white">¶</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-serif font-semibold text-lg">Source Serif 4 (leitura)</h4>
                            <p className="text-gray-500 text-sm mb-4">Aplicada em conteúdos longos, documentos, aulas e leitura editorial.</p>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-xs text-gray-500 w-24">Título</span>
                                    <span className="text-2xl font-serif font-semibold text-white flex-1">Narrativa com peso e respiro</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <span className="text-xs text-gray-500 w-24">Parágrafo</span>
                                    <span className="text-base font-serif font-normal text-gray-300 flex-1 leading-relaxed">Esta família serve melhor quando o texto precisa sustentar leitura contínua, contexto e reflexão.</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 w-24">Citação</span>
                                    <span className="text-lg font-serif italic text-gray-400 flex-1 border-l-2 border-primary pl-4">"Boa interface reduz fricção antes de pedir atenção."</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
            
            <div className="grid grid-cols-2 gap-6">
                <Card title="Formas e Profundidade">
                    <div className="flex justify-around items-center h-24">
                        <Square size={32} className="text-gray-700 fill-gray-900 rounded-xl" />
                        <Circle size={32} className="text-gray-700 fill-gray-900" />
                        <Triangle size={32} className="text-gray-700 fill-gray-900" />
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-2">Cantos suaves, sombras controladas e botões com leitura tátil.</div>
                </Card>
                <Card title="Sistema de Espaçamento">
                     <div className="flex flex-col justify-center gap-2 h-24 px-4">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary/50"></div>
                              <span className="text-xs text-gray-500">8px (Base)</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-primary/60"></div>
                              <span className="text-xs text-gray-500">16px (Padding)</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary/80"></div>
                              <span className="text-xs text-gray-500">24px (Section)</span>
                          </div>
                     </div>
                </Card>
            </div>
        </div>
    </div>
  );

  const renderComponents = () => (
    <div className="space-y-6">
        <Card title="Componentes de Referência">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Prompt Input */}
                <div className="space-y-2">
                    <h4 className="text-sm text-gray-400">Campo de prompt</h4>
                    <div className="relative group mt-4">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary via-quaternary to-secondary rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-[#0A0A0A] rounded-lg border border-border p-2">
                            <Sparkles className="text-secondary ml-2" size={18} />
                            <input type="text" placeholder="Descreva o próximo componente, fluxo ou experimento..." className="bg-transparent border-none outline-none text-white text-sm w-full px-3 py-1" />
                            <button className="bg-secondary text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-secondary/80 transition-colors flex items-center gap-1">
                                Gerar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Glassmorphism Card */}
                <div className="space-y-2">
                    <h4 className="text-sm text-gray-400">Painel translúcido</h4>
                    <div className="relative p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden mt-4">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-quaternary/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
                        <div className="relative z-10 flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Zap size={16} className="text-tertiary" />
                            </div>
                            <h5 className="text-white font-medium">Painel contextual</h5>
                        </div>
                        <p className="text-xs text-gray-400 relative z-10">Superfícies translúcidas para overlays, estados contextuais e blocos de apoio visual.</p>
                    </div>
                </div>

                {/* AI Processing State */}
                <div className="space-y-2">
                    <h4 className="text-sm text-gray-400">Estado de processamento</h4>
                    <div className="p-4 rounded-xl border border-border bg-[#111] mt-4 space-y-3">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-5 h-5 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
                            <span className="text-sm text-secondary animate-pulse">Processando dados...</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-secondary to-quaternary w-2/3 rounded-full animate-pulse"></div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="h-3 bg-white/5 rounded w-full animate-pulse"></div>
                            <div className="h-3 bg-white/5 rounded w-5/6 animate-pulse"></div>
                            <div className="h-3 bg-white/5 rounded w-4/6 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Data Visualization */}
                <div className="space-y-2">
                    <h4 className="text-sm text-gray-400">Visualização de dados</h4>
                    <div className="h-48 p-4 rounded-xl border border-border bg-[#111] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8F43F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8F43F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={30} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#141414', borderColor: '#1F1F1F', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#3BE0DB' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#8F43F6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Botões">
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3">Secundário (roxo)</h4>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:bg-secondary/90 transition-colors">
                                Padrão
                            </button>
                            <button className="px-4 py-2 bg-secondary text-white rounded-lg font-medium opacity-50 cursor-not-allowed">
                                Desabilitado
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3">Terciário (laranja)</h4>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-4 py-2 bg-tertiary text-white rounded-lg font-medium hover:bg-tertiary/90 transition-colors">
                                Padrão
                            </button>
                            <button className="px-4 py-2 bg-tertiary text-white rounded-lg font-medium opacity-50 cursor-not-allowed">
                                Desabilitado
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3">Quaternário (turquesa)</h4>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-4 py-2 bg-quaternary text-black rounded-lg font-medium hover:bg-quaternary/90 transition-colors">
                                Padrão
                            </button>
                            <button className="px-4 py-2 bg-quaternary text-black rounded-lg font-medium opacity-50 cursor-not-allowed">
                                Desabilitado
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3">Outline / Ghost</h4>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-4 py-2 border border-border text-white rounded-lg font-medium hover:bg-white/5 transition-colors">
                                Outline
                            </button>
                            <button className="px-4 py-2 text-gray-300 rounded-lg font-medium hover:bg-white/5 hover:text-white transition-colors">
                                Ghost
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Badges">
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3">Sólido</h4>
                        <div className="flex flex-wrap gap-3">
                            <Badge color="primary" variant="solid">Primário</Badge>
                            <Badge color="success" variant="solid">Sucesso</Badge>
                            <Badge color="warning" variant="solid">Alerta</Badge>
                            <Badge color="danger" variant="solid">Erro</Badge>
                            <Badge color="neutral" variant="solid">Neutro</Badge>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3">Contornado</h4>
                        <div className="flex flex-wrap gap-3">
                            <Badge color="primary" variant="outlined">Primário</Badge>
                            <Badge color="success" variant="outlined">Sucesso</Badge>
                            <Badge color="warning" variant="outlined">Alerta</Badge>
                            <Badge color="danger" variant="outlined">Erro</Badge>
                            <Badge color="neutral" variant="outlined">Neutro</Badge>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        <Card title="Cards">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Card padrão" className="border-border">
                    <p className="text-sm text-gray-400">
                        Estrutura-base usada na maior parte da aplicação, com borda sutil e fundo escuro.
                    </p>
                </Card>
                <Card title="Card interativo" className="border-border hover:border-secondary/50 transition-colors cursor-pointer group">
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        Variante indicada para listas clicáveis, galerias e painéis com hover explícito.
                    </p>
                </Card>
            </div>
        </Card>
    </div>
  );

  const renderAssets = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Mandala de Valor">
            <div className="h-[300px] -ml-6">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                        <Radar name="Brand" dataKey="A" stroke="#8F43F6" fill="#8F43F6" fillOpacity={0.3} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-500 font-serif italic mt-[-20px]">
                Dominante: Rebelde / Mago
            </div>
        </Card>

        <Card title="Iconografia">
            <div className="space-y-6">
                <p className="text-sm text-gray-400">
                    O sistema usa <strong>Lucide React</strong> como base. O objetivo é manter stroke, escala e contraste consistentes em todos os contextos.
                </p>
                <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-[#111] rounded-lg border border-border">
                        <Type strokeWidth={1.5} className="text-gray-300 mb-2" />
                        <span className="text-[10px] text-gray-500">Texto</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-[#111] rounded-lg border border-border">
                        <Palette strokeWidth={1.5} className="text-gray-300 mb-2" />
                        <span className="text-[10px] text-gray-500">Paleta</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-[#111] rounded-lg border border-border">
                        <Circle strokeWidth={1.5} className="text-gray-300 mb-2" />
                        <span className="text-[10px] text-gray-500">Círculo</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-[#111] rounded-lg border border-border">
                        <ImageIcon strokeWidth={1.5} className="text-gray-300 mb-2" />
                        <span className="text-[10px] text-gray-500">Imagem</span>
                    </div>
                </div>
                <div className="bg-black/30 p-3 rounded text-xs font-mono text-gray-400">
                    {'<IconName size={18} strokeWidth={1.5} className="text-gray-400" />'}
                </div>
            </div>
        </Card>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case View.DESIGN_SYSTEM_FOUNDATIONS:
        return renderFoundations();
      case View.DESIGN_SYSTEM_COMPONENTS:
        return renderComponents();
      case View.DESIGN_SYSTEM_ASSETS:
        return renderAssets();
      default:
        return renderFoundations();
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Design System</h2>
                <p className="text-gray-500 text-sm font-serif">Biblioteca visual e operacional de referência do Entrelaç[OS].</p>
            </div>
            <div className="flex gap-2">
                <Badge color="primary" variant="solid">v2.0</Badge>
                <Badge color="neutral" variant="outlined">Referência</Badge>
            </div>
       </div>

       {renderContent()}
    </div>
  );
};
