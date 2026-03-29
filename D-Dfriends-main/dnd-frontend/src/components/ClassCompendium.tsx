import React, { useState } from 'react';
import { 
  BookOpen, 
  Shield, 
  Music, 
  Zap, 
  Flame, 
  Trees, 
  Swords, 
  Skull, 
  Ghost, 
  Compass, 
  Star, 
  X,
  ChevronRight,
  Info,
  Trophy
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SkillTree from './SkillTree';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { classData, ClassData } from '../data/classData';

interface ClassCompendiumProps {
  onClose: () => void;
}

const ClassCompendium: React.FC<ClassCompendiumProps> = ({ onClose }) => {
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [activeTab, setActiveTab] = useState<'desc' | 'skills'>('desc');

  const handleSelectClass = (cls: ClassData) => {
    setSelectedClass(cls);
    setActiveTab('desc');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[90vh] glassmorphism-dark rounded-3xl overflow-hidden flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Compêndio de Classes</h2>
              <p className="text-slate-400 text-sm font-medium">Guia de referência baseado no Livro do Jogador 5e</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          {!selectedClass ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {classData.map((cls) => (
                <div 
                  key={cls.name}
                  onClick={() => handleSelectClass(cls)}
                  className="group relative cursor-pointer perspective-1000"
                >
                  <div className="h-full p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg", cls.color)}>
                      <cls.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{cls.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                      {cls.description}
                    </p>
                    <div className="mt-4 flex items-center text-blue-400 text-xs font-bold uppercase tracking-widest gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver detalhes <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-fade-in h-full flex flex-col lg:flex-row gap-10">
              {/* Back button and Class Info */}
              <div className="lg:w-1/3">
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Voltar à lista
                </button>
                
                <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br shadow-2xl", selectedClass.color)}>
                  <selectedClass.icon className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">{selectedClass.name}</h3>
                <p className="text-slate-300 text-lg leading-relaxed font-medium">
                  {selectedClass.description}
                </p>
                
                <div className="mt-8 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl flex gap-3 items-start">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-200 leading-relaxed">
                    Esta é uma descrição resumida da classe. No Livro do Jogador completo, você encontrará tabelas de evolução, espaços de magia e talentos específicos.
                  </p>
                </div>
              </div>

              {/* Tabs and Content */}
              <div className="lg:w-2/3 flex flex-col">
                <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 mt-10 mb-6 sticky top-0 z-10">
                  <button
                    onClick={() => setActiveTab('desc')}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      activeTab === 'desc' 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <Info className="w-4 h-4" />
                    Descrição
                  </button>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      activeTab === 'skills' 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <Trophy className="w-4 h-4" />
                    Habilidades
                  </button>
                </div>
                
                {activeTab === 'desc' ? (
                  <div className="space-y-6 overflow-y-auto pr-2 h-[50vh] custom-scrollbar">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                      {selectedClass.subclassesName}
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4 pb-8">
                      {selectedClass.subclasses.map((sub) => (
                        <div 
                          key={sub.name}
                          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700/30 hover:border-slate-500/50 transition-all group"
                        >
                          <h5 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">{sub.name}</h5>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {sub.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-y-auto pr-2 h-[50vh] custom-scrollbar pb-8">
                    <SkillTree abilities={selectedClass.abilities} color={selectedClass.color} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassCompendium;
