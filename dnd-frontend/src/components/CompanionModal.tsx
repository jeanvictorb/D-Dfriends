import React from 'react';
import { X, Heart, Shield, User, Package, Star, Swords, Zap, Brain, Scroll, Sparkles } from 'lucide-react';
import { Character } from '../types';
import { getClassIcon } from '../lib/classIcons';

interface CompanionModalProps {
  character: Character;
  onClose: () => void;
}

const CompanionModal: React.FC<CompanionModalProps> = ({ character, onClose }) => {
  const classIcon = getClassIcon(character.class_subclass);
  
  const calculateModifier = (val: number) => Math.floor((val - 10) / 2);

  const attributes = [
    { label: 'FOR', val: character.strength, icon: Swords, color: 'text-red-400' },
    { label: 'DES', val: character.dexterity, icon: Zap, color: 'text-orange-400' },
    { label: 'CON', val: character.constitution, icon: Heart, color: 'text-rose-400' },
    { label: 'INT', val: character.intelligence, icon: Brain, color: 'text-blue-400' },
    { label: 'SAB', val: character.wisdom, icon: Scroll, color: 'text-emerald-400' },
    { label: 'CAR', val: character.charisma, icon: Sparkles, color: 'text-purple-400' },
  ];

  const hpPercent = (character.hp_current / character.hp_max) * 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#0c1527] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        {/* Header Decor */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-60`}></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          {/* Top Info */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-inner relative overflow-hidden"
                 style={{ backgroundColor: classIcon.color + '15', border: `1.5px solid ${classIcon.color}44` }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundColor: classIcon.color }}></div>
              <span className="relative z-10">{classIcon.emoji}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-white truncate">{character.name}</h2>
                <span className="px-2 py-0.5 bg-blue-900/50 border border-blue-500/30 rounded text-xs font-black text-blue-300">
                  NV {character.level}
                </span>
              </div>
              <p className="text-slate-400 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {character.class_subclass}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stats Column */}
            <div className="space-y-6">
              {/* HP Bar */}
              <div className="bg-[#15234b]/40 border border-[#2a4387]/30 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pontos de Vida</span>
                  <span className="text-sm font-bold text-white">{character.hp_current} / {character.hp_max}</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 bg-gradient-to-r from-rose-600 to-red-500`}
                    style={{ width: `${hpPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-3 gap-3">
                {attributes.map(attr => (
                  <div key={attr.label} className="bg-[#15234b]/40 border border-[#2a4387]/20 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-500 mb-1">{attr.label}</span>
                    <span className="text-lg font-black text-white leading-none mb-1">{attr.val}</span>
                    <span className={`text-[10px] font-bold ${attr.color}`}>
                      ({calculateModifier(attr.val) >= 0 ? '+' : ''}{calculateModifier(attr.val)})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                Mochila do Companheiro
              </h3>
              <div className="bg-[#15234b]/40 border border-[#2a4387]/30 rounded-2xl p-4 min-h-[160px] max-h-[220px] overflow-y-auto custom-scrollbar">
                {character.inventory && character.inventory.length > 0 ? (
                  <ul className="space-y-3">
                    {character.inventory.map(item => (
                      <li key={item.id} className="border-b border-[#2a4387]/20 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-bold text-blue-200">{item.name}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">x{item.quantity}</span>
                        </div>
                        {item.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-500 mt-4">
                    <Package className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">Mochila Vazia</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#2a4387]/30 flex justify-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Modo de Vizualização de Companheiro</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanionModal;
