import React from 'react';
import { Character } from '../types';
import { Shield, Plus, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  characters: Character[];
  onSelect: (char: Character) => void;
  onCreateNew: () => void;
}

export default function CharacterSelection({ characters, onSelect, onCreateNew }: Props) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 flex flex-col min-h-screen">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Shield className="text-blue-500 w-8 h-8" />
          Seus Personagens
        </h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 interactive-btn text-red-300 hover:text-white hover:bg-red-600/50 border-red-500/30 text-sm font-bold"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map(char => (
          <button
            key={char.id}
            onClick={() => onSelect(char)}
            className="panel hover:bg-[#1e3470] transition-colors text-left flex flex-col cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                {char.name}
              </h2>
              <span className="text-xs font-bold px-2 py-1 rounded bg-blue-900/50 text-blue-200 border border-blue-500/30">
                Nível {char.level}
              </span>
            </div>
            
            <p className="text-sm font-medium text-slate-400 mb-6">
              {char.class_subclass}
            </p>

            <div className="mt-auto pt-4 border-t border-[#2a4387]/30 flex justify-between items-center w-full">
              <span className="text-xs font-bold text-slate-500 uppercase">PV: {char.hp_current}/{char.hp_max}</span>
              <span className="text-xs font-bold text-blue-400 group-hover:underline">Jogar &rarr;</span>
            </div>
          </button>
        ))}

        {/* Max 2 characters logic */}
        {characters.length < 2 ? (
          <button
            onClick={onCreateNew}
            className="panel border-dashed border-2 hover:bg-[#1e3470] border-[#2a4387] hover:border-blue-500/50 flex flex-col items-center justify-center min-h-[200px] transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-[#15234b] border border-[#2a4387] flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
              <Plus className="w-6 h-6 text-blue-400 group-hover:text-white" />
            </div>
            <span className="font-bold text-slate-300 group-hover:text-white">
              Criar Novo Personagem
            </span>
            <span className="text-xs text-slate-500 mt-2 font-medium">
              Vagas restantes: {2 - characters.length}/2
            </span>
          </button>
        ) : (
          <div className="panel border-dashed border-2 border-red-500/30 bg-red-950/20 flex flex-col items-center justify-center min-h-[200px] opacity-75">
            <Shield className="w-8 h-8 text-red-500/50 mb-3" />
            <span className="font-bold text-red-400/80">Limite Máximo Atingido</span>
            <span className="text-xs text-red-500/60 mt-2 font-medium">
              Você já possui 2 personagens ativos.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
