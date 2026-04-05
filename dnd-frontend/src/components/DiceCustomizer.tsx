import React from 'react';
import { X, Sparkles, Flame, Shield, Zap, Circle, Check } from 'lucide-react';
import { DiceMaterial } from './Dice3D';

interface DiceCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: DiceMaterial;
  onSelect: (style: DiceMaterial) => void;
}

const styles: { id: DiceMaterial; name: string; description: string; color: string; icon: any }[] = [
  { id: 'default', name: 'Padrão', description: 'O clássico azul do mestre.', color: 'bg-blue-600', icon: Circle },
  { id: 'crystal', name: 'Cristalino', description: 'Transparente e místico.', color: 'bg-cyan-400', icon: Sparkles },
  { id: 'magma', name: 'Magma', description: 'Forjado no fogo das profundezas.', color: 'bg-orange-600', icon: Flame },
  { id: 'metal', name: 'Aço', description: 'Para os guerreiros de linhagem.', color: 'bg-slate-400', icon: Shield },
  { id: 'gold', name: 'Ouro Fino', description: 'A recompensa de um herói.', color: 'bg-amber-400', icon: Zap },
];

export default function DiceCustomizer({ isOpen, onClose, currentStyle, onSelect }: DiceCustomizerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#15234b]/90 border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <Sparkles className="w-32 h-32 text-blue-400" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase mb-1">Tesouros do Destino</h2>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Escolha a cor da sua sorte</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar-thin pr-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => onSelect(style.id)}
              className={`group p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 relative overflow-hidden ${
                currentStyle === style.id 
                ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${style.color}`}>
                <style.icon className="w-8 h-8 text-white drop-shadow-md" />
              </div>
              
              <div className="text-left">
                <p className="text-lg font-black text-white italic tracking-tight">{style.name}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{style.description}</p>
              </div>

              {currentStyle === style.id && (
                <div className="absolute top-4 right-4 bg-blue-500 p-1.5 rounded-full shadow-lg border border-blue-400">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Hover Glow */}
              <div className={`absolute -inset-2 opacity-0 group-hover:opacity-20 transition-opacity blur-2xl -z-10 ${style.color}`} />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-8 bg-black/20 text-center">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black italic uppercase tracking-tighter hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            Guardar na Algibeira
          </button>
        </div>
      </div>
    </div>
  );
}
