import React, { useState } from 'react';
import { CAMPAIGNS, Campaign } from '../data/campaigns';
import { Sparkles, Scroll, ChevronRight, X, Play } from 'lucide-react';

interface Props {
  onSelectCampaign: (campaign: Campaign) => void;
  onClose: () => void;
}

const CampaignSelector: React.FC<Props> = ({ onSelectCampaign, onClose }) => {
  const [selected, setSelected] = useState<Campaign | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0c1527] border border-[#2a4387]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#2a4387]/30 flex items-center justify-between bg-gradient-to-r from-indigo-900/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Scroll className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Escolha sua Aventura</h2>
              <p className="text-xs text-slate-400 font-medium">Selecione uma campanha pré-montada para começar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Campaign list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {CAMPAIGNS.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => setSelected(campaign)}
              className={`w-full text-left p-4 rounded-2xl border transition-all group hover:scale-[1.01] ${
                selected?.id === campaign.id
                  ? 'bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/50 border-slate-700/30 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0 mt-0.5">{campaign.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-black text-white text-sm uppercase tracking-wide group-hover:text-indigo-300 transition-colors">
                      {campaign.title}
                    </h3>
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      {campaign.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {campaign.description}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 shrink-0 mt-1 transition-all ${selected?.id === campaign.id ? 'text-indigo-400 translate-x-1' : 'text-slate-600'}`} />
              </div>
            </button>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="p-6 border-t border-[#2a4387]/30 bg-black/20">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-xl">{selected.icon}</span>
                <div>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-wide">{selected.title}</p>
                  <p className="text-[10px] text-slate-400">{selected.openingNarration}</p>
                </div>
              </div>
              <button
                onClick={() => onSelectCampaign(selected)}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Play className="w-5 h-5" />
                Iniciar Aventura
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500 font-medium py-2">
              Selecione uma campanha acima para começar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignSelector;
