import React from 'react';
import { SRD_DATA } from '../lib/srdData';
import { CLASS_ICONS } from '../lib/classIcons';
import { Shield, Zap, Heart, Scroll, Sword, Sparkles, User, Info } from 'lucide-react';

interface ClassGuideOverlayProps {
  onSelectClass: (className: string) => void;
  onClose: () => void;
}

const ClassGuideOverlay: React.FC<ClassGuideOverlayProps> = ({ onSelectClass, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-6xl bg-[#0c1527]/90 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh]">
        
        {/* Left: Attributes Explanation */}
        <div className="w-full md:w-1/3 bg-blue-600/5 p-8 border-r border-white/5 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Entendendo Seus Atributos</h3>
          </div>

          <div className="space-y-6">
            <AttributeLink 
              icon={<Sword className="w-4 h-4 text-red-400" />}
              name="Força (FOR)"
              desc="Poder físico. Essencial para Guerreiros, Bárbaros e Paladinos para causar dano corpo-a-corpo."
            />
            <AttributeLink 
              icon={<Zap className="w-4 h-4 text-amber-400" />}
              name="Destreza (DES)"
              desc="Agilidade e precisão. Vital para Ladinos, Patrulheiros e arqueiros. Também define sua Defesa (CA)."
            />
            <AttributeLink 
              icon={<Heart className="w-4 h-4 text-emerald-400" />}
              name="Constituição (CON)"
              desc="Resistência e saúde. Define seus Pontos de Vida (PV). Todo herói precisa de uma boa base aqui."
            />
            <AttributeLink 
              icon={<Scroll className="w-4 h-4 text-blue-400" />}
              name="Inteligência (INT)"
              desc="Raciocínio lógico e memória. O atributo principal de Magos e Artífices para conjurar feitiços."
            />
            <AttributeLink 
              icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
              name="Sabedoria (SAB)"
              desc="Intuição e percepção do mundo. Fundamental para Clérigos, Druidas e monges."
            />
            <AttributeLink 
              icon={<User className="w-4 h-4 text-purple-400" />}
              name="Carisma (CAR)"
              desc="Força de personalidade. Bardos, Bruxos, Feiticeiros e Paladinos usam para influenciar e conjurar."
            />
          </div>

          <div className="mt-10 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-[11px] font-bold text-amber-200/70 uppercase leading-relaxed tracking-wider">
              Dica: Foque no atributo principal da sua classe para ser mais eficiente em suas ações!
            </p>
          </div>
        </div>

        {/* Right: Class Selection Grid */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-black/20">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Escolha seu Caminho</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Selecione uma classe para ver mais detalhes ou iniciar sua jornada.</p>
            </div>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest transition-all"
            >
              Voltar ao Tutorial
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SRD_DATA.dnd_classes.map((cls) => {
              const icon = CLASS_ICONS[cls.name] || { emoji: '⚔️', color: '#94a3b8' };
              return (
                <div 
                  key={cls.name}
                  className="group relative bg-[#15234b]/20 border border-white/5 rounded-[2rem] p-6 hover:bg-[#15234b]/40 hover:border-blue-500/30 transition-all duration-500 cursor-pointer shadow-xl overflow-hidden"
                  onClick={() => onSelectClass(cls.name)}
                >
                  {/* Decorative Background Icon */}
                  <div className="absolute -top-4 -right-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-0 duration-700">
                    {icon.emoji}
                  </div>

                  <div className="flex flex-col gap-4 relative z-10">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 transition-transform group-hover:scale-110 duration-500"
                      style={{ backgroundColor: icon.color + '20', borderColor: icon.color + '40', color: icon.color }}
                    >
                      {icon.emoji}
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-black text-white italic tracking-tight uppercase">{cls.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cls.primary_ability.map(attr => (
                          <span key={attr} className="px-2.5 py-0.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            {attr}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-3">
                      Domina o campo de batalha com {cls.primary_ability.join(' e ')}. Iniciando com {cls.hit_die} de Pontos de Vida.
                    </p>

                    <button className="w-full mt-2 py-3 bg-white/5 group-hover:bg-blue-600 rounded-xl text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-widest transition-all shadow-lg active:scale-95">
                      ESCOLHER ESTA CLASSE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const AttributeLink: React.FC<{ icon: React.ReactNode; name: string; desc: string }> = ({ icon, name, desc }) => (
  <div className="group space-y-2">
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <span className="text-[11px] font-black text-white uppercase tracking-widest">{name}</span>
    </div>
    <p className="text-[11px] text-slate-500 leading-relaxed font-medium transition-colors group-hover:text-slate-400">
      {desc}
    </p>
  </div>
);

export default ClassGuideOverlay;
