import React from 'react';
import { Character } from '../types';
import { Plus, LogOut, Trash2, Sparkles, User, Heart, Swords } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getClassIcon } from '../lib/classIcons';

interface Props {
  characters: Character[];
  onSelect: (char: Character) => void;
  onCreateNew: () => void;
  onDelete: (id: number) => void;
}

export default function CharacterSelection({ characters, onSelect, onCreateNew, onDelete }: Props) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#0c1527] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto p-6 lg:p-12 max-w-7xl relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-6 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img src="/logo.png" alt="D&D Friends" className="w-16 h-16 object-contain relative drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">
                Seus Heróis
              </h1>
              <div className="flex items-center gap-2 text-blue-400/60 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                Mundo de Aventuras • {characters.length}/2 Ativos
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-2xl text-red-400 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Encerrar Sessão
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {characters.map((char, index) => {
            const icon = getClassIcon(char.class_subclass);
            return (
              <button
                key={char.id}
                onClick={() => onSelect(char)}
                className="group relative flex flex-col bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-left transition-all hover:-translate-y-2 hover:border-white/20 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Class Themed Glow */}
                <div 
                  className="absolute -top-12 -right-12 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                  style={{ backgroundColor: icon.color }}
                ></div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div 
                    className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-4xl shadow-lg relative overflow-hidden"
                    style={{ backgroundColor: icon.color + '15', border: `1.5px solid ${icon.color}44` }}
                  >
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
                    <span className="relative drop-shadow-lg">{icon.emoji}</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(char.id); }}
                      className="p-3 text-slate-500 hover:text-red-500 transition-colors bg-white/5 hover:bg-red-500/10 rounded-2xl border border-white/10"
                      title="Deletar Personagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white tracking-widest uppercase">
                      Nv. {char.level}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 mb-8">
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight mb-2 group-hover:text-amber-400 transition-colors">
                    {char.name}
                  </h2>
                  <p className="text-sm font-bold text-blue-400/80 uppercase tracking-widest">
                    {char.class_subclass}
                  </p>
                </div>
                
                <div className="mt-auto space-y-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Heart className="w-3 h-3 text-red-500" /> Vitalidade</span>
                      <span className="text-white">{char.hp_current}/{char.hp_max}</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000"
                        style={{ width: `${(char.hp_current / char.hp_max) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs font-black uppercase tracking-widest text-blue-400">
                    <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                      <Swords className="w-4 h-4" /> Jogar Agora &rarr;
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {characters.length < 2 ? (
            <button
              onClick={onCreateNew}
              className="group relative flex flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] p-8 min-h-[320px] transition-all hover:bg-white/10 hover:border-blue-500/50 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300"
            >
              <div className="w-20 h-20 rounded-full bg-[#15234b]/80 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:scale-110 transition-all shadow-xl">
                <Plus className="w-8 h-8 text-blue-400 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">
                Novo Destino
              </h3>
              <p className="text-[10px] font-bold text-slate-500 mt-3 uppercase tracking-[0.2em]">
                Vagas disponíveis: {2 - characters.length}/2
              </p>
              
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]"></div>
            </button>
          ) : (
            <div className="relative flex flex-col items-center justify-center bg-red-500/5 border-2 border-dashed border-red-500/20 rounded-[2rem] p-8 min-h-[320px] opacity-75 animate-bounce-subtle">
              <div className="w-20 h-20 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center mb-6 grayscale">
                <User className="w-8 h-8 text-red-500/50" />
              </div>
              <h3 className="text-xl font-black text-red-500/80 uppercase tracking-widest">
                Limite Excedido
              </h3>
              <p className="text-[10px] font-bold text-red-500/60 mt-3 uppercase tracking-[0.2em] text-center">
                Você já possui o máximo de 2 heróis ativos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
