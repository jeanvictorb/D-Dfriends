import React, { useEffect, useRef } from 'react';
import { DiceEvent, Character } from '../types';
import { MessageSquare, Heart, Shield, Users, Sparkles, ScrollText } from 'lucide-react';

interface Props {
  backgroundUrl: string;
  diceLogs: DiceEvent[];
  partyCharacters: Character[];
  currentCharacter: Character | null;
}

const TheaterView: React.FC<Props> = ({ backgroundUrl, diceLogs, partyCharacters, currentCharacter }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [diceLogs]);

  // Determine if a message is from the IA Narrator (usually has name "IA" or "Narrador")
  const isNarrator = (player: string) => player === 'IA' || player === 'Narrador';

  return (
    <div className="fixed inset-0 z-0 flex flex-col items-center justify-end p-4 md:p-8 overflow-hidden">
      {/* Dynamic Background with Ken Burns effect transition */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out bg-cover bg-center z-[-2] scale-105 animate-ken-burns"
        style={{ backgroundImage: `url(${backgroundUrl || '/images/scenes/taverna.png'})` }}
      />
      
      {/* Advanced Ambient Overlay - Reduced to let image shine */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-[-1]" />
      <div className="absolute inset-0 bg-blue-900/5 mix-blend-overlay z-[-1]" />

      {/* Scene Title Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
        <div className="px-6 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Explorando {backgroundUrl.includes('taverna') ? 'A Taverna' : backgroundUrl.includes('porao') ? 'O Porão' : 'A Tumba'}</h2>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-end h-[90vh] relative">
        {/* Party Status Side Panel (Left) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 pb-6 h-full overflow-y-auto custom-scrollbar pr-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Aventureiros
          </h3>
            <span className="text-[10px] text-slate-400 font-bold">{partyCharacters.length} ON</span>
          </div>
          
          {partyCharacters.map(char => (
            <div key={char.id} className="group relative glassmorphism-dark p-4 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:translate-x-1">
              {/* HP Progress Ring/Background */}
              <div 
                className="absolute inset-0 bg-red-500/5 rounded-2xl transition-all duration-500" 
                style={{ clipPath: `inset(0 ${100 - (char.hp_current / char.hp_max) * 100}% 0 0)` }}
              />
              
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/30 to-slate-800 flex items-center justify-center text-sm font-black border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                {char.name[0]}
              </div>
              
              <div className="relative flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-black text-white truncate uppercase tracking-tight">{char.name}</p>
                  <span className="text-[10px] font-bold text-slate-400">LVL {char.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-700 ${char.hp_current < char.hp_max * 0.3 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
                      style={{ width: `${(char.hp_current / char.hp_max) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-white/60 tabular-nums">{char.hp_current}/{char.hp_max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Immersive Chat / Log (Center/Right) - More transparent */}
        <div className="lg:col-span-12 h-full flex flex-col gap-6 relative">
          <div className="flex-1 bg-black/5 rounded-[40px] border border-white/5 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative">
            {/* Messages are more floating now */}
            {diceLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-30">
                <div className="relative">
                  <MessageSquare className="w-16 h-16" />
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-blue-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black uppercase tracking-[0.4em] text-white/50 mb-2">Crônicas Iniciadas</p>
                  <p className="text-sm font-medium italic">O mestre aguarda sua primeira ação...</p>
                </div>
              </div>
            ) : (
              diceLogs.map((log, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col gap-2 animate-fade-in ${log.player === currentCharacter?.name ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-center gap-2 ${log.player === currentCharacter?.name ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isNarrator(log.player) ? 'text-amber-400 flex items-center gap-2' : 'text-blue-400'}`}>
                      {isNarrator(log.player) && <ScrollText className="w-3 h-3" />}
                      {log.player}
                    </span>
                  </div>

                  <div className={`
                    relative p-6 rounded-3xl max-w-[70%] shadow-2xl border transition-all hover:scale-[1.01]
                    ${isNarrator(log.player) 
                      ? 'bg-black/40 backdrop-blur-md border-amber-500/20 text-amber-50 rounded-tl-none italic font-serif leading-relaxed text-lg' 
                      : log.player === currentCharacter?.name 
                        ? 'bg-blue-600/80 backdrop-blur-md border-blue-400/30 text-white rounded-tr-none' 
                        : 'bg-slate-900/40 backdrop-blur-md border-slate-700/30 text-slate-100 rounded-tl-none'}
                  `}>
                    {isNarrator(log.player) ? (
                      <p className="whitespace-pre-wrap">{log.dieType} {log.naturalRoll}</p> 
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold opacity-60 mb-0.5">Rolagem de {log.dieType}</span>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black ${log.naturalRoll === 20 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : log.naturalRoll === 1 ? 'text-red-500' : ''}`}>
                              {log.total}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
 
          {/* Party HUD Overlay (Bottom) */}
          <div className="flex items-center gap-4 py-4 overflow-x-auto no-scrollbar">
            {partyCharacters.map(char => (
              <div key={char.id} className="min-w-[150px] bg-black/40 backdrop-blur-xl p-3 rounded-2xl flex items-center gap-3 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px] font-black border border-white/10">
                  {char.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-white uppercase truncate">{char.name}</p>
                  <div className="w-full h-1 bg-slate-900/50 rounded-full mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${char.hp_current < char.hp_max * 0.3 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${(char.hp_current / char.hp_max) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Minimalist Suggestion Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
            <span className="text-[10px] font-bold text-blue-200/40 italic tracking-wider uppercase">Crônicas de {backgroundUrl.split('/').pop()?.split('.')[0]}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-red-500/60 animate-pulse">
                <div className="w-1 h-1 rounded-full bg-current" />
                <span className="text-[8px] font-black uppercase tracking-widest">Aventura Ativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheaterView;
