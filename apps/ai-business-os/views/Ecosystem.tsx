import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { analyzeEcosystem } from '../services/geminiService';
import { Bot, Network, Users, Globe, BrainCircuit } from 'lucide-react';

export const Ecosystem: React.FC = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalysis = async () => {
      setAnalyzing(true);
      try {
          const snapshotData = `
            Snapshot operacional local do Entrelaç[OS].
            Branding OS: fluxo mais maduro e com exportação PNG funcionando.
            AI Control Center: providers, credenciais e roteamento central já conectados.
            EloCut: editor e histórico local ativos, ainda exigindo revisão fina de UX.
            Ecosystem: painel de leitura ainda sem conectores reais de telemetria.
            Design System: biblioteca visual disponível, mas com trechos ainda demonstrativos.
            Prioridade atual: reduzir telas mockadas e consolidar superfícies de produção.
          `;
          const result = await analyzeEcosystem(snapshotData);
          setAnalysis(result);
      } catch (e) {
          console.error(e);
      } finally {
          setAnalyzing(false);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Mapa do Ecossistema</h2>
                <p className="text-gray-500 text-sm font-serif">Visão de maturidade dos módulos, integrações e sinais de operação local.</p>
            </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
               <h3 className="text-lg font-bold text-gray-300 flex items-center gap-2">
                   <Bot size={20} className="text-primary" /> Módulos em operação
               </h3>
               <div className="grid gap-4">
                   {[
                       { name: 'Branding OS', status: 'Ativo', type: 'Conteúdo e packaging', desc: 'Fluxo mais sólido hoje, com geração de carrossel e exportação PNG.' },
                       { name: 'AI Control Center', status: 'Ativo', type: 'Governança', desc: 'Providers, credenciais e roteamento centralizados.' },
                       { name: 'EloCut', status: 'Revisão', type: 'Vídeo', desc: 'Pipeline funcional, mas ainda com ajustes pendentes de UX e acabamento.' },
                   ].map((bot, i) => (
                       <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer group">
                           <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                       <Bot size={20} />
                                   </div>
                                   <div>
                                       <div className="font-bold text-white text-sm">{bot.name}</div>
                                       <div className="text-[10px] text-gray-500">{bot.type}</div>
                                   </div>
                               </div>
                               <Badge 
                                variant={bot.status === 'Ativo' ? 'solid' : 'soft'} 
                                color={bot.status === 'Ativo' ? 'success' : bot.status === 'Revisão' ? 'warning' : 'neutral'}
                               >
                                   {bot.status}
                               </Badge>
                           </div>
                           <p className="text-xs text-gray-400 font-serif pl-[52px]">{bot.desc}</p>
                       </Card>
                   ))}
               </div>
           </div>

           <div className="space-y-4">
               <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-300 flex items-center gap-2">
                        <Network size={20} className="text-accent" /> Leitura do ecossistema
                    </h3>
                    <Button 
                        variant="secondary" 
                        className="h-8 text-xs px-3" 
                        onClick={handleAnalysis}
                        isLoading={analyzing}
                    >
                        <BrainCircuit size={14} className="mr-1"/> Gerar leitura
                    </Button>
               </div>
               
               <Card className="h-full min-h-[400px] flex flex-col relative overflow-hidden">
                    {analysis ? (
                        <div className="relative z-20 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="solid" color="primary">Leitura pronta</Badge>
                                <span className="text-[10px] text-gray-500 uppercase">Baseada no snapshot local atual</span>
                            </div>
                            <div className="flex-1 overflow-y-auto font-serif text-sm text-gray-300 leading-relaxed custom-scrollbar whitespace-pre-wrap">
                                {analysis}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0A0A0A] to-[#0A0A0A]"></div>
                            <div className="relative z-10 flex-1 flex items-center justify-center">
                                <div className="relative w-64 h-64 border border-gray-800 rounded-full flex items-center justify-center animate-[spin_60s_linear_infinite]">
                                    <div className="absolute w-48 h-48 border border-gray-800 rounded-full flex items-center justify-center border-dashed"></div>
                                    <div className="absolute w-32 h-32 border border-gray-800 rounded-full flex items-center justify-center"></div>
                                    
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-primary rounded-full shadow-[0_0_10px_#8F43F6]"></div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-2 h-2 bg-gray-600 rounded-full"></div>
                                    <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full"></div>
                                </div>
                                <div className="absolute text-center">
                                    <div className="text-2xl font-bold text-white">6</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">frentes mapeadas</div>
                                </div>
                            </div>
                            <div className="relative z-10 grid grid-cols-2 gap-4 mt-auto">
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="text-xs text-gray-400 flex items-center gap-2 mb-1"><Globe size={12}/> Integrações reais</div>
                                    <div className="text-white font-bold">parciais</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="text-xs text-gray-400 flex items-center gap-2 mb-1"><Users size={12}/> Foco imediato</div>
                                    <div className="text-white font-bold">acabamento de produto</div>
                                </div>
                            </div>
                        </>
                    )}
               </Card>
           </div>
       </div>
    </div>
  );
};
