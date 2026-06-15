import React, { useEffect, useState, useRef } from 'react';
import { Search, ArrowRight, Video, LayoutDashboard, Bot, Palette, Boxes, Wrench } from 'lucide-react';
import { View } from '../../types';

interface CommandPaletteProps {
  onNavigate: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items = [
    { id: View.COURSE_CREATOR_DASHBOARD, label: 'Course Creator', icon: LayoutDashboard, category: 'Studio' },
    { id: View.PRD_STUDIO, label: 'PRD Studio', icon: Bot, category: 'Studio' },
    { id: View.BRANDING_OS_MANIFESTO, label: 'Branding OS', icon: Palette, category: 'Studio' },
    { id: View.MEDIA_STUDIO, label: 'Media Studio', icon: Video, category: 'Studio' },
    { id: View.ECOSYSTEM_CLONES, label: 'Mapa Operacional', icon: Boxes, category: 'Ecosystem' },
    { id: View.ECOSYSTEM_MATRIX, label: 'Leitura do Ecossistema', icon: Boxes, category: 'Ecosystem' },
    { id: View.DESIGN_SYSTEM, label: 'Design System', icon: Palette, category: 'System' },
    { id: View.AI_CONTROL_CENTER, label: 'AI Control Center', icon: Wrench, category: 'System' },
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[#111] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-[#222]">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar módulo, fluxo ou painel..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-lg font-sans"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="px-2 py-0.5 rounded bg-[#222] text-[10px] text-gray-400 font-mono border border-[#333]">ESC</div>
        </div>

        <div className="max-h-[300px] overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">Nenhum resultado encontrado.</div>
          ) : (
            <>
              {['Studio', 'Ecosystem', 'System'].map(category => {
                 const categoryItems = filteredItems.filter(i => i.category === category);
                 if (categoryItems.length === 0) return null;
                 const categoryLabel =
                   category === 'Studio' ? 'Estúdios' :
                   category === 'Ecosystem' ? 'Ecossistema' :
                   'Sistema';
                 return (
                   <div key={category} className="mb-2">
                     <div className="px-4 py-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest">{categoryLabel}</div>
                     {categoryItems.map(item => (
                       <button
                         key={item.id}
                         onClick={() => { onNavigate(item.id); onClose(); }}
                         className="w-full flex items-center justify-between px-4 py-2 hover:bg-primary/10 hover:text-primary text-gray-300 group transition-colors"
                       >
                         <div className="flex items-center gap-3">
                           <item.icon size={16} className="text-gray-500 group-hover:text-primary" />
                           <span className="text-sm font-medium">{item.label}</span>
                         </div>
                         <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                       </button>
                     ))}
                   </div>
                 );
              })}
            </>
          )}
        </div>
        
        <div className="px-4 py-2 bg-[#0A0A0A] border-t border-[#222] text-[10px] text-gray-600 flex justify-between">
           <span>Navegue com as setas</span>
           <span>Entrelaç[OS]</span>
        </div>
      </div>
    </div>
  );
};
