import React from 'react';
import { Book, X, Scroll, History, Sparkles, Feather } from 'lucide-react';

interface CampaignDiaryProps {
  isOpen: boolean;
  onClose: () => void;
  chronicle: string;
  onGenerateChronicle: () => void;
  isGenerating: boolean;
}

export const CampaignDiary: React.FC<CampaignDiaryProps> = ({ 
  isOpen, 
  onClose, 
  chronicle, 
  onGenerateChronicle,
  isGenerating
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#1e293b] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-900/40 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
              <Scroll className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Diário da Campanha</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crônicas das Lendas de Outrora</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content Area (Parchment Style) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar-thin bg-[#162033] relative">
          <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/old-paper.png')]"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            {!chronicle && !isGenerating ? (
              <div className="text-center py-20 space-y-6 opacity-30">
                <Feather className="w-16 h-16 mx-auto text-amber-500/50" />
                <p className="text-xl font-serif italic text-amber-100">
                  As páginas estão em branco... Clique em "Gerar Crônica" para que a IA conte sua história.
                </p>
              </div>
            ) : isGenerating ? (
              <div className="text-center py-20 space-y-6">
                <Sparkles className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
                <p className="text-xl font-serif italic text-blue-300 animate-pulse">
                  Tecendo os fios do destino em palavras...
                </p>
              </div>
            ) : (
              <div className="prose prose-invert prose-amber max-w-none">
                <div className="flex items-center gap-3 mb-8 border-b border-amber-900/30 pb-4">
                  <History className="w-5 h-5 text-amber-500/50" />
                  <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">Última atualização: Sessão Atual</span>
                </div>
                <div className="text-lg md:text-xl font-serif leading-relaxed text-amber-50/90 whitespace-pre-wrap first-letter:text-6xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-amber-500 drop-shadow-sm">
                  {chronicle}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 border-t border-white/5 bg-black/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:block">
            Mantenha suas memórias vivas para as próximas gerações.
          </div>
          <button
            onClick={onGenerateChronicle}
            disabled={isGenerating}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-tighter transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:scale-105 active:scale-95"
          >
            {isGenerating ? (
              <>Escrevendo...</>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Crônica Épica
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
