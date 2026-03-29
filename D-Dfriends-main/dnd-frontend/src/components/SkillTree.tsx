import React from 'react';
import { Star, Shield, Zap, Sparkles } from 'lucide-react';

interface Ability {
  name: string;
  level: number;
  description: string;
}

interface SkillTreeProps {
  abilities: Ability[];
  color: string;
  currentLevel?: number;
}

const SkillTree: React.FC<SkillTreeProps> = ({ abilities, color, currentLevel = 1 }) => {
  const sortedAbilities = [...abilities].sort((a, b) => a.level - b.level);

  return (
    <div className="relative py-8 px-4 sm:px-8">
      {/* Glow Line Background */}
      <div className="absolute left-[33px] sm:left-[49px] top-0 bottom-0 w-[2px] bg-slate-800/50 rounded-full overflow-hidden">
        <div className={`w-full h-full bg-gradient-to-b ${color} opacity-20 shadow-[0_0_15px_${color.split('-')[1]}]`}></div>
      </div>

      <div className="space-y-10 relative z-10">
        {sortedAbilities.map((ability, idx) => {
          const isUnlocked = currentLevel >= ability.level;
          
          return (
            <div key={`${ability.name}-${idx}`} className={`relative pl-14 sm:pl-20 group transition-all duration-500 ${isUnlocked ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'}`}>
              
              {/* Connection Node */}
              <div className={`absolute left-[33px] sm:left-[49px] top-7 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-slate-950 z-30 transition-all duration-500 group-hover:scale-125 ${isUnlocked ? `bg-gradient-to-br ${color} shadow-[0_0_15px_rgba(59,130,246,0.5)]` : 'bg-slate-800 border-slate-700'}`}>
                {isUnlocked && <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20"></div>}
              </div>

              {/* Level Indicator Bubble */}
              <div className="absolute left-0 top-3 flex flex-col items-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 border ${isUnlocked ? 'border-blue-500/50 shadow-lg shadow-blue-900/20' : 'border-slate-800'} flex flex-col items-center justify-center transition-all duration-300 group-hover:rotate-6 z-20`}>
                  <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-0.5">LVL</span>
                  <span className={`text-sm sm:text-lg font-black leading-none ${isUnlocked ? `bg-gradient-to-br ${color} bg-clip-text text-transparent` : 'text-slate-600'}`}>
                    {ability.level}
                  </span>
                </div>
              </div>

              {/* Ability Content Card */}
              <div className={`w-full p-5 sm:p-6 rounded-3xl bg-slate-900/40 border ${isUnlocked ? 'border-slate-700/50 hover:border-blue-500/30' : 'border-slate-800/30'} transition-all duration-300 backdrop-blur-md relative overflow-hidden group-hover:bg-slate-800/40`}>
                {/* Subtle Background Icon */}
                <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white opacity-[0.02] -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className={`text-base sm:text-lg font-black transition-colors tracking-tight uppercase ${isUnlocked ? 'text-white group-hover:text-blue-400' : 'text-slate-500'}`}>
                      {ability.name}
                    </h4>
                    <div className={`h-1 w-8 bg-gradient-to-r ${color} rounded-full mt-1.5 opacity-60 group-hover:w-16 transition-all duration-500 ${!isUnlocked && 'grayscale'}`}></div>
                  </div>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-slate-800/50 border border-slate-700/50 group-hover:border-slate-500/50 transition-colors`}>
                    <Zap className={`w-4 h-4 ${isUnlocked ? 'text-blue-400' : 'text-slate-600'}`} />
                  </div>
                </div>
                
                <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                  {ability.description}
                </p>

                {!isUnlocked && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-500 uppercase">
                      Bloqueado
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTree;
