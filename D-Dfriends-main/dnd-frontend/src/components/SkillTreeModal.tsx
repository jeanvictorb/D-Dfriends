import React, { useState } from 'react';
import { X, Sparkles, Lock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Character } from '../types';
import { classData, ClassData, Ability, Subclass } from '../data/classData';

interface SkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onSelectSubclass: (subclassName: string) => void;
}

export default function SkillTreeModal({ isOpen, onClose, character, onSelectSubclass }: SkillTreeModalProps) {
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentClassName = character.class_subclass.split(/[ / (]/)[0];
  const currentClassData = classData.find(c => c.name === currentClassName);
  const currentSubclassName = character.class_subclass.includes(' / ') 
    ? character.class_subclass.split(' / ')[1] 
    : null;

  if (!currentClassData) {
    console.error("SkillTreeModal: Class data not found for", currentClassName);
    return null;
  }

  const handleConfirmSubclass = () => {
    if (selectedSubclass) {
      onSelectSubclass(selectedSubclass);
      setSelectedSubclass(null);
    }
  };

  const ClassIcon = currentClassData.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-[#0a0f1e]/95 border border-white/10 rounded-[3rem] w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentClassData.color} shadow-lg shadow-black/20`}>
               <ClassIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black italic text-white tracking-tighter uppercase leading-none mb-1">
                Árvore de Habilidades
              </h2>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">
                {currentClassName} • Nível {character.level}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-auto p-12 custom-scrollbar-thin">
          <div className="flex flex-col items-center min-w-max space-y-12">
            
            {/* Trunk */}
            <div className="flex flex-col items-center gap-12">
              {currentClassData.abilities.filter(a => a.level < 3).sort((a,b) => a.level - b.level).map((ability, idx) => (
                <div key={idx} className="relative">
                  <SkillNode ability={ability} isUnlocked={character.level >= ability.level} />
                  {idx < currentClassData.abilities.filter(a => a.level < 3).length - 1 && (
                    <div className="w-0.5 h-12 bg-white/10 absolute left-1/2 -bottom-12" />
                  )}
                </div>
              ))}
              <div className="w-0.5 h-12 bg-white/10 relative">
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-4 border-[#0a0f1e]" />
              </div>
            </div>

            {/* Branches */}
            <div className="flex gap-12 items-start justify-center">
              {currentClassData.subclasses.map((sub, sIdx) => {
                const isSelected = currentSubclassName === sub.name;
                const isActivePath = currentSubclassName ? isSelected : true;
                const canSelect = !currentSubclassName && character.level >= 3;

                return (
                  <div key={sIdx} className={`flex flex-col items-center gap-8 ${!isActivePath ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
                    <div 
                      onClick={() => canSelect && setSelectedSubclass(sub.name)}
                      className={`p-8 rounded-[3rem] border-2 w-72 transition-all cursor-pointer relative overflow-hidden ${
                         isSelected 
                         ? 'bg-blue-600/20 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105' 
                         : selectedSubclass === sub.name
                         ? 'bg-amber-500/20 border-amber-500'
                         : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <h4 className="text-xl font-black italic text-white mb-2 leading-tight uppercase">{sub.name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase mb-4">{sub.description}</p>
                      
                      {isSelected ? (
                        <div className="text-[9px] font-black text-blue-400 tracking-widest flex items-center justify-center gap-2 py-2 bg-blue-500/10 rounded-xl"><CheckCircle2 className="w-3.5 h-3.5"/> CAMINHO ESCOLHIDO</div>
                      ) : canSelect ? (
                         <div className="text-[9px] font-black text-amber-500 animate-pulse tracking-widest py-2 bg-amber-500/10 rounded-xl uppercase">Escolha este Caminho</div>
                      ) : (
                         <div className="text-[9px] font-black text-slate-600 tracking-widest py-2 bg-white/5 rounded-xl uppercase">Disponível no Nível 3</div>
                      )}
                    </div>

                    <div className="w-0.5 h-12 bg-white/10" />

                    <div className="flex flex-col items-center gap-12">
                      {sub.abilities?.map((ability, aIdx) => (
                        <div key={aIdx} className="relative">
                          <SkillNode ability={ability} isUnlocked={character.level >= ability.level && isSelected} />
                          {aIdx < (sub.abilities?.length || 0) - 1 && <div className="w-0.5 h-12 bg-white/10 absolute left-1/2 -bottom-12" />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {selectedSubclass && (
          <div className="absolute inset-0 z-[210] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-in fade-in">
             <div className="bg-[#1a2b5e] border border-amber-500/50 rounded-[3.5rem] p-12 max-w-md text-center shadow-3xl">
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                <h3 className="text-3xl font-black italic text-white tracking-tighter uppercase mb-2 leading-none">Confirmar Escolha?</h3>
                <p className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-6">Caminho do {selectedSubclass}</p>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Esta ação definirá sua especialização para sempre. Outros ramos desta árvore ficarão bloqueados permanentemente.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setSelectedSubclass(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-bold uppercase text-xs transition-all">Cancelar</button>
                  <button onClick={handleConfirmSubclass} className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-[1.5rem] font-black uppercase text-xs shadow-xl shadow-amber-500/30 transition-all active:scale-95">Confirmar</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillNode({ ability, isUnlocked }: { ability: Ability; isUnlocked: boolean }) {
  return (
    <div className={`p-5 rounded-[2.5rem] border-2 transition-all duration-700 w-80 relative flex items-center gap-5 ${
      isUnlocked 
      ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.1)]' 
      : 'bg-black/40 border-white/5 opacity-30 grayscale blur-[0.5px]'
    }`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${
        isUnlocked ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-900 text-slate-600'
      }`}>
        {isUnlocked ? <Sparkles className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-white italic tracking-tight mb-1 uppercase truncate">{ability.name}</p>
        <p className="text-[9px] font-bold text-slate-500 leading-tight uppercase line-clamp-1">Nível {ability.level}</p>
      </div>

      {!isUnlocked && <div className="absolute inset-0 bg-black/10 rounded-[2.5rem]" />}
    </div>
  );
}
