import React, { useState, useEffect } from 'react';
import { SRD_DATA } from '../lib/srdData';
import { CLASS_ICONS } from '../lib/classIcons';
import { Character } from '../types';
import { User, Shield, Zap, Heart, Scroll, Dice5, ChevronRight, Check, Sparkles, Sword, Info, Star, BookOpen } from 'lucide-react';

interface CharacterCreatorProps {
  onCreate: (char: Partial<Character>) => void;
  initialClass?: string | null;
  onOpenCompendium?: () => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCreate, initialClass, onOpenCompendium }) => {
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

  // Handle initial class from tutorial
  useEffect(() => {
    if (initialClass) {
      const idx = SRD_DATA.dnd_classes.findIndex(c => c.name.toLowerCase() === initialClass.toLowerCase());
      if (idx !== -1) {
        setFormData(prev => ({ ...prev, classIdx: idx, subclassIdx: -1 }));
        setStep(1); // Proceed with the name first, or we could jump to attributes
      }
    }
  }, [initialClass]);

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
      user_id: 'temp-id' 
    });
  };

  const calculateModifier = (val: number) => {
    const mod = Math.floor((val - 10) / 2);
    return mod >= 0 ? `+${mod}` : mod;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Header & Progress */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none flex items-center gap-4">
             <div className="p-3 bg-blue-600 rounded-[1.5rem] shadow-xl shadow-blue-500/20">
               <User className="w-8 h-8 text-white" />
             </div>
             Forjando sua <span className="text-blue-500">Lenda</span>
          </h2>
          <p className="text-slate-400 font-medium mt-3 uppercase tracking-widest text-[10px]">Criação de Personagem • Passo {step} de 2</p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[2rem] border border-white/10">
          <div className={`px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all ${step === 1 ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>IDENTIDADE</div>
          <ChevronRight className="w-4 h-4 text-slate-700" />
          <div className={`px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all ${step === 2 ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>ATRIBUTOS</div>
        </div>
      </div>

      <div className="bg-[#15234b]/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group transition-all hover:border-white/20">
        {/* Background Sparkles */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Sparkles className="w-40 h-40 text-blue-400 rotate-12" />
        </div>

        {step === 1 && (
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            {/* Name Input Section */}
            <div className="relative">
               <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 block">O Nome da sua História</label>
               <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-6 pr-14 text-2xl font-black text-white italic tracking-tight placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-all shadow-inner uppercase"
                  placeholder="DIGITE O NOME DO HERÓI..."
               />
               <div className="absolute right-6 top-[3.7rem] text-slate-700">
                  <Star className="w-6 h-6" />
               </div>
            </div>

            {/* Class Selection Section */}
            <div>
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                     <Sword className="w-4 h-4" /> Escolha sua Vocação
                  </h3>
                  <div className="flex items-center gap-4">
                    {onOpenCompendium && (
                      <button 
                        onClick={onOpenCompendium}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl hover:bg-amber-500/20 transition-all group/info"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Guia de Classes</span>
                      </button>
                    )}
                    {initialClass && (
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-[9px] font-black text-blue-400 rounded-lg uppercase tracking-widest">Pre-selecionado</span>
                    )}
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {SRD_DATA.dnd_classes.map((c, i) => {
                    const icon = CLASS_ICONS[c.name] ?? { emoji: '⚔️', color: '#94a3b8' };
                    const isSelected = formData.classIdx === i;
                    return (
                      <button
                        key={c.name}
                        onClick={() => setFormData({...formData, classIdx: i, subclassIdx: -1})}
                        className={`group p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 relative overflow-hidden ${
                          isSelected
                          ? 'border-blue-500 bg-blue-600/10 shadow-2xl scale-105'
                          : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20 hover:bg-black/40'
                        }`}
                      >
                        <div 
                           className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 transition-transform group-hover:scale-110 duration-500 ${isSelected ? 'shadow-blue-500/20' : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`}
                           style={isSelected ? { backgroundColor: icon.color + '20', borderColor: icon.color + '40', color: icon.color } : {}}
                        >
                          {icon.emoji}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{c.name}</span>
                        {isSelected && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>}
                      </button>
                    );
                  })}
               </div>
            </div>

            {/* Subclass Selection Section */}
            {selectedClass && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <Zap className="w-4 h-4" /> Especialização
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedClass.subclasses.map((s, i) => (
                    <button
                      key={s.name}
                      onClick={() => setFormData({...formData, subclassIdx: i})}
                      className={`p-6 rounded-[1.5rem] border transition-all text-[11px] font-black uppercase tracking-widest text-left flex justify-between items-center group ${
                        formData.subclassIdx === i 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-xl' 
                        : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                      }`}
                    >
                      {s.name}
                      {formData.subclassIdx === i ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              disabled={!formData.name || formData.classIdx === -1}
              onClick={() => setStep(2)}
              className="w-full py-6 mt-12 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-20 text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 text-xs tracking-[0.3em] uppercase flex items-center justify-center gap-4 group"
            >
              AVANÇAR PARA ATRIBUTOS <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            {/* Point Buy Summary */}
            <div className="flex flex-col md:flex-row items-center gap-6">
               <div className="flex-1 bg-blue-600/10 border border-blue-500/30 rounded-[2.5rem] p-8 shadow-xl flex items-center justify-between w-full">
                  <div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Poder de Criação</span>
                    <h4 className="text-sm font-bold text-slate-300 uppercase italic">Pontos Restantes</h4>
                  </div>
                  <div className={`text-6xl font-black italic tracking-tighter ${27 - pointsSpent < 0 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white'}`}>
                    {27 - pointsSpent}
                  </div>
               </div>

               <div className="w-full md:w-auto p-8 bg-amber-500/10 border border-amber-500/30 rounded-[2.5rem] flex items-center gap-6">
                  <div className="p-4 bg-amber-500/20 rounded-[1.5rem]">
                     <Info className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-[9px] font-black text-amber-200/60 uppercase leading-relaxed tracking-wider">
                     Cada atributo começa em 8. <br />Até 13 o custo é 1:1. <br />14 e 15 custam mais pontos.
                  </p>
               </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Força', key: 'strength', icon: <Sword className="w-4 h-4 text-red-400" />, desc: 'Poder físico e ataques marciais.' },
                { label: 'Destreza', key: 'dexterity', icon: <Zap className="w-4 h-4 text-amber-400" />, desc: 'Agilidade e Defesa.' },
                { label: 'Constituição', key: 'constitution', icon: <Heart className="w-4 h-4 text-emerald-400" />, desc: 'Sua reserva de Pontos de Vida.' },
                { label: 'Inteligência', key: 'intelligence', icon: <Scroll className="w-4 h-4 text-blue-400" />, desc: 'Conhecimento e lógica arcana.' },
                { label: 'Sabedoria', key: 'wisdom', icon: <Sparkles className="w-4 h-4 text-indigo-400" />, desc: 'Percepção e força espiritual.' },
                { label: 'Carisma', key: 'charisma', icon: <User className="w-4 h-4 text-purple-400" />, desc: 'Liderança e influência social.' },
              ].map((attr) => (
                <div key={attr.key} className="bg-black/30 p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all flex flex-col items-center group relative overflow-hidden shadow-lg">
                  {/* Subtle highlight if primary for class */}
                  {selectedClass?.primary_ability.includes(attr.label) && (
                    <div className="absolute top-0 right-0 p-4">
                      <Star className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                     {attr.icon}
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{attr.label}</span>
                  </div>

                  <div className="flex items-center gap-6 mb-6">
                    <button 
                      onClick={() => setFormData({...formData, [attr.key]: Math.max(8, (formData[attr.key as keyof typeof formData] as number) - 1)})}
                      className="w-12 h-12 rounded-[1rem] bg-white/5 border border-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all font-black text-xl active:scale-90"
                    >
                      -
                    </button>
                    <div className="text-center group">
                       <span className="text-4xl font-black text-white italic tracking-tighter block leading-none">
                         {formData[attr.key as keyof typeof formData]}
                       </span>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${Number(calculateModifier(formData[attr.key as keyof typeof formData] as number)) >= 1 ? 'text-blue-400' : 'text-slate-600'}`}>
                          MOD {calculateModifier(formData[attr.key as keyof typeof formData] as number)}
                       </span>
                    </div>
                    <button 
                      onClick={() => setFormData({...formData, [attr.key]: Math.min(15, (formData[attr.key as keyof typeof formData] as number) + 1)})}
                      className="w-12 h-12 rounded-[1rem] bg-white/5 border border-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all font-black text-xl active:scale-90"
                    >
                      +
                    </button>
                  </div>
                  
                  <p className="text-[9px] text-slate-500 font-bold uppercase text-center leading-relaxed tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                    {attr.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t border-white/5">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-5 bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase rounded-[2rem] hover:bg-white/10 hover:text-white transition-all shadow-xl"
              >
                VOLTAR
              </button>
              <button 
                onClick={handleCreate}
                disabled={pointsSpent > 27 || formData.name === ''}
                className="flex-[2] py-5 bg-gradient-to-r from-blue-700 to-blue-600 border border-blue-400/30 text-white font-black text-xs tracking-[0.4em] uppercase rounded-[2rem] shadow-2xl shadow-blue-900/40 hover:scale-[1.02] active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-4"
              >
                 GERAR MEU HERÓI <Sparkles className="w-5 h-5 text-amber-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pb-20">
         <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Seu destino começa a ser escrito agora.</p>
      </div>
    </div>
  );
};

export default CharacterCreator;
