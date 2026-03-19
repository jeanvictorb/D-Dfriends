import React, { useState } from 'react';
import { SRD_DATA } from '../lib/srdData';
import { CLASS_ICONS } from '../lib/classIcons';
import { Character } from '../types';
import { User, Shield, Zap, Heart, Scroll, Dice5, ChevronRight, Check } from 'lucide-react';

interface CharacterCreatorProps {
  onCreate: (char: Partial<Character>) => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCreate }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    classIdx: -1,
    subclassIdx: -1,
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8
  });

  const getPointCost = (score: number) => {
    if (score <= 8) return 0;
    if (score <= 13) return score - 8;
    if (score === 14) return 7;
    if (score === 15) return 9;
    return score > 15 ? 9 : 0;
  };

  const pointsSpent = 
    getPointCost(formData.strength) +
    getPointCost(formData.dexterity) +
    getPointCost(formData.constitution) +
    getPointCost(formData.intelligence) +
    getPointCost(formData.wisdom) +
    getPointCost(formData.charisma);

  const selectedClass = formData.classIdx >= 0 ? SRD_DATA.dnd_classes[formData.classIdx] : null;

  const handleCreate = () => {
    if (!selectedClass) return;
    
    // Calculate HP based on hit die
    const hitDieValue = parseInt(selectedClass.hit_die.substring(1));
    const conMod = Math.floor((formData.constitution - 10) / 2);
    const hp = hitDieValue + conMod;

    onCreate({
      name: formData.name,
      class_subclass: `${selectedClass.name}${formData.subclassIdx >= 0 ? ` (${selectedClass.subclasses[formData.subclassIdx].name})` : ''}`,
      level: 1,
      strength: formData.strength,
      dexterity: formData.dexterity,
      constitution: formData.constitution,
      intelligence: formData.intelligence,
      wisdom: formData.wisdom,
      charisma: formData.charisma,
      hp_current: hp,
      hp_max: hp,
      inventory: [],
      user_id: 'temp-id' // Will be overridden in App.tsx
    });
  };

  return (
    <div className="max-w-2xl mx-auto glass premium-card animate-in fade-in zoom-in duration-500 shadow-2xl shadow-indigo-500/10">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#2a4387]/30 pb-4">
        Criar Novo Personagem
      </h2>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Nome do Personagem</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Digite o nome..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">Classe</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SRD_DATA.dnd_classes.map((c, i) => {
                const icon = CLASS_ICONS[c.name] ?? { emoji: '⚔️', color: '#94a3b8', bg: '' };
                const isSelected = formData.classIdx === i;
                return (
                  <button
                    key={c.name}
                    onClick={() => setFormData({...formData, classIdx: i, subclassIdx: -1})}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-2 ${
                      isSelected
                      ? 'border-2 scale-105 shadow-lg text-white'
                      : 'bg-[#0c1527] border-[#2a4387]/50 text-slate-400 hover:border-blue-500/50 hover:text-white'
                    }`}
                    style={isSelected ? { borderColor: icon.color, backgroundColor: icon.color + '22', color: icon.color } : {}}
                  >
                    <span className="text-2xl">{icon.emoji}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedClass && (
            <div className="pt-2">
              <label className="block text-sm font-bold text-slate-300 mb-3">Especialização</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedClass.subclasses.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => setFormData({...formData, subclassIdx: i})}
                    className={`p-3 rounded-xl border text-sm font-bold text-left transition-colors ${
                      formData.subclassIdx === i 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-[#0c1527] border-[#2a4387]/50 text-slate-400 hover:border-blue-500/50 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            disabled={!formData.name || formData.classIdx === -1}
            onClick={() => setStep(2)}
            className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
          >
            Avançar para Atributos
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-blue-300 uppercase">Pontos Restantes (Point Buy)</span>
            <span className={`text-2xl font-black ${27 - pointsSpent < 0 ? 'text-red-500' : 'text-white'}`}>
              {27 - pointsSpent}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Força', key: 'strength' },
              { label: 'Destreza', key: 'dexterity' },
              { label: 'Constituição', key: 'constitution' },
              { label: 'Inteligência', key: 'intelligence' },
              { label: 'Sabedoria', key: 'wisdom' },
              { label: 'Carisma', key: 'charisma' },
            ].map((attr) => (
              <div key={attr.key} className="bg-[#0c1527] p-4 rounded-xl flex flex-col items-center border border-[#2a4387]/50">
                <span className="text-xs font-bold text-slate-400 mb-2">{attr.label}</span>
                <div className="flex items-center gap-4 mb-2">
                  <button 
                    onClick={() => setFormData({...formData, [attr.key]: Math.max(8, (formData[attr.key as keyof typeof formData] as number) - 1)})}
                    className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-white w-8 text-center">
                    {formData[attr.key as keyof typeof formData]}
                  </span>
                  <button 
                    onClick={() => setFormData({...formData, [attr.key]: Math.min(15, (formData[attr.key as keyof typeof formData] as number) + 1)})}
                    className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
                <div className="px-2 py-1 rounded bg-[#15234b] text-xs font-bold text-blue-300">
                  Mod {Math.floor(((formData[attr.key as keyof typeof formData] as number) - 10) / 2) >= 0 ? '+' : ''}
                  {Math.floor(((formData[attr.key as keyof typeof formData] as number) - 10) / 2)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#2a4387]/30">
            <button 
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-[#0c1527] border border-[#2a4387]/50 text-slate-300 hover:text-white hover:border-[#2a4387] font-bold rounded-xl transition-colors"
            >
              Voltar
            </button>
            <button 
              onClick={handleCreate}
              disabled={pointsSpent > 27}
              className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold rounded-xl transition-colors"
            >
               Gerar Personagem
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCreator;
