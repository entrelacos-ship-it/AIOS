import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { generateImage, editImage, generateVideo } from '../services/geminiService';
import { ImageSize, AspectRatio } from '../types';
import { ImagePlus, Video, Wand2, Download, AlertTriangle } from 'lucide-react';

enum Mode {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  VIDEO = 'VIDEO'
}

export const MediaStudio: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.GENERATE);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // Settings
  const [size, setSize] = useState<ImageSize>(ImageSize.S_1K);
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleModeChange = (newMode: Mode) => {
      setMode(newMode);
      setResult(null);
      
      // Auto-adjust ratio for video
      if (newMode === Mode.VIDEO && ![AspectRatio.WIDE, AspectRatio.MOBILE_PORTRAIT].includes(ratio)) {
          setRatio(AspectRatio.WIDE); // Default to 16:9
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (mode === Mode.GENERATE) {
        const images = await generateImage(prompt, size, ratio);
        setResult(images[0]);
      } else if (mode === Mode.EDIT && uploadedImage) {
        const edited = await editImage(uploadedImage, prompt);
        setResult(edited);
      } else if (mode === Mode.VIDEO) {
        const videoUrl = await generateVideo(prompt, ratio === AspectRatio.MOBILE_PORTRAIT ? '9:16' : '16:9');
        setResult(videoUrl);
      }
    } catch (e) {
      console.error(e);
      alert('A operação falhou. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-white mb-1">Media Studio</h2>
            <p className="text-textSecondary font-serif text-sm">Gerar, editar e revisar ativos visuais com o roteador multimodal.</p>
        </div>
        <div className="flex bg-card p-1 rounded-full border border-border gap-1">
            {[
                { id: Mode.GENERATE, icon: ImagePlus, label: 'Gerar imagem' },
                { id: Mode.EDIT, icon: Wand2, label: 'Editar imagem' },
                { id: Mode.VIDEO, icon: Video, label: 'Gerar vídeo' },
            ].map((m) => (
                <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                        mode === m.id ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <m.icon size={16} /> {m.label}
                </button>
            ))}
        </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Controls */}
           <div className="space-y-6">
                <Card title="Configuration">
                    <div className="space-y-4">
                        {mode === Mode.EDIT && (
                            <div className="border border-dashed border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-primary">
                                <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept="image/*" />
                                <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                                    {uploadedImage ? (
                                        <img src={uploadedImage} alt="Preview" className="h-32 mx-auto object-contain" />
                                    ) : (
                                        <div className="text-gray-500 py-4">Clique para enviar a imagem-base</div>
                                    )}
                                </label>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 uppercase font-bold">Instrução</label>
                            <textarea
                                className="w-full bg-[#0A0A0A] border border-border rounded-lg p-3 text-white text-sm focus:border-primary outline-none resize-none h-24"
                                placeholder={mode === Mode.EDIT ? 'Ex.: remova o fundo, reforce luz lateral, aplique textura editorial...' : 'Descreva o ativo visual que você quer gerar...'}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>

                        {mode !== Mode.EDIT && (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 uppercase font-bold">Proporção</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.values(AspectRatio).filter(r => mode === Mode.VIDEO ? ['16:9','9:16'].includes(r) : true).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRatio(r)}
                                            className={`text-xs border rounded-full py-1 px-2 ${ratio === r ? 'border-primary text-primary bg-primary/10' : 'border-border text-gray-400 hover:border-gray-500'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mode === Mode.GENERATE && (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 uppercase font-bold">Resolução</label>
                                <div className="flex gap-2">
                                    {Object.values(ImageSize).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSize(s)}
                                            className={`flex-1 text-xs border rounded-full py-1 ${size === s ? 'border-primary text-primary bg-primary/10' : 'border-border text-gray-400 hover:border-gray-500'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {mode === Mode.VIDEO && (
                           <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-xs text-yellow-500 flex items-start gap-2">
                              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                              <p>A geração de vídeo usa o roteador do backend. Habilite um provider com suporte a vídeo no AI Control Center antes de executar.</p>
                           </div>
                        )}

                        <Button 
                            className="w-full mt-4" 
                            onClick={handleAction} 
                            isLoading={loading}
                            disabled={!prompt || (mode === Mode.EDIT && !uploadedImage)}
                        >
                            {mode === Mode.GENERATE ? 'Gerar imagem' : mode === Mode.EDIT ? 'Aplicar edição' : 'Gerar vídeo'}
                        </Button>
                    </div>
                </Card>
           </div>

           {/* Preview */}
           <div className="col-span-1 md:col-span-2">
               <Card className="h-full min-h-[500px] flex items-center justify-center bg-[#050505]">
                   {loading ? (
                       <div className="text-center space-y-4">
                           <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                           <p className="text-textSecondary animate-pulse">
                               {mode === Mode.VIDEO ? 'Montando o vídeo... isso pode levar um pouco mais.' : 'Renderizando prévia...'}
                           </p>
                       </div>
                   ) : result ? (
                       <div className="relative group w-full h-full flex items-center justify-center p-4">
                           {mode === Mode.VIDEO ? (
                               <video src={result} controls className="max-w-full max-h-[600px] rounded shadow-2xl" autoPlay loop />
                           ) : (
                               <img src={result} alt="Generated result" className="max-w-full max-h-[600px] object-contain rounded shadow-2xl" />
                           )}
                           <a 
                             href={result} 
                             download={`entrelacos_${Date.now()}.${mode === Mode.VIDEO ? 'mp4' : 'png'}`}
                             className="absolute bottom-6 right-6 bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black"
                           >
                               <Download size={20} />
                           </a>
                       </div>
                   ) : (
                       <div className="text-gray-600 text-center">
                           <div className="text-4xl mb-4 opacity-20">🎨</div>
                           <p>Seu canvas de criação</p>
                       </div>
                   )}
               </Card>
           </div>
       </div>
    </div>
  );
};
