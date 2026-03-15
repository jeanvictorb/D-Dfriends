import React, { useState } from 'react';
import { SRD_DATA } from '../lib/srdData';
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
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  });

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
      user_id: 1 // Mock user id
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
              {SRD_DATA.dnd_classes.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setFormData({...formData, classIdx: i, subclassIdx: -1})}
                  className={`p-3 rounded-xl border text-sm font-bold transition-colors ${
                    formData.classIdx === i 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-[#0c1527] border-[#2a4387]/50 text-slate-400 hover:border-blue-500/50 hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
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
                <input 
                  type="number" 
                  value={formData[attr.key as keyof typeof formData]}
                  onChange={(e) => setFormData({...formData, [attr.key]: parseInt(e.target.value) || 0})}
                  className="w-16 bg-transparent text-2xl font-bold text-center text-white border-b border-[#2a4387] focus:border-blue-500 outline-none transition-colors mb-2"
                />
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
              className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
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
