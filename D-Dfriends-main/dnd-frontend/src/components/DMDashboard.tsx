import React, { useState, useEffect } from 'react';
import { Shield, Users, Heart, PackagePlus, Loader2, LogOut, CheckCircle, Trash2, Mic, Swords, Volume2, Skull, Sparkles, Zap, Flame, Droplets, Plus, Dice5, ChevronRight, Ghost, BookOpen, HelpCircle, Info, User, Target } from 'lucide-react';
import { Character, InventoryItem, Profile, DiceEvent } from '../types';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getClassIcon } from '../lib/classIcons';
import { generateRandomNPC } from '../lib/npcGenerator';
import ClassCompendium from './ClassCompendium';
import BattleMap from './BattleMap';

interface Props {
  onLogout: () => void;
  channel?: RealtimeChannel | null;
  viewMode: 'standard' | 'theater' | 'map';
  backgroundUrl: string;
  diceLogs: DiceEvent[];
}

export default function DMDashboard({ onLogout, channel, viewMode, backgroundUrl, diceLogs }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'characters' | 'combat' | 'sounds' | 'rules' | 'scenes'>('characters');
  const [showCompendium, setShowCompendium] = useState(false);

  // Combat State
  const [combatParticipants, setCombatParticipants] = useState<{charId: number, name: string, initiative: number, isTurn: boolean}[]>([]);

  // Item Form State
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemType, setItemType] = useState('item');
  const [itemDesc, setItemDesc] = useState('');

  // Voice AI State
  const [ttsMessage, setTtsMessage] = useState('');

  const handleRoll = (dieType: string, dieSize: number) => {
    if (!channel) return;
    const naturalRoll = Math.floor(Math.random() * dieSize) + 1;
    const event: DiceEvent = {
      player: 'Mestre',
      dieType,
      naturalRoll,
      modifier: 0,
      total: naturalRoll,
      timestamp: new Date().toISOString()
    };
    channel.send({ type: 'broadcast', event: 'dice_event', payload: event });
  };

  useEffect(() => {
    fetchCharacters();

    const charSub = supabase
      .channel('dm_characters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, fetchCharacters)
      .subscribe();

    return () => {
      charSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedChar) {
      const fresh = characters.find(c => c.id === selectedChar.id);
      if (fresh) setSelectedChar(fresh);
    }
  }, [characters]);


  const fetchCharacters = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('characters').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setCharacters(data);
    }
    setLoading(false);
  };

  const updateHP = async (char: Character, amount: number) => {
    const newHP = Math.max(0, Math.min(char.hp_max, char.hp_current + amount));
    await supabase.from('characters').update({ hp_current: newHP }).eq('id', char.id);
  };

  const handleGiveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChar) return;
    const newItem: InventoryItem = { id: crypto.randomUUID(), name: itemName, quantity: itemQuantity, type: itemType, description: itemDesc };
    const updatedInventory = [...(selectedChar.inventory || []), newItem];
    await supabase.from('characters').update({ inventory: updatedInventory }).eq('id', selectedChar.id);
    setItemName(''); setItemQuantity(1); setItemDesc('');
  };

  const updateAttribute = async (char: Character, attr: keyof Character, amount: number) => {
    const newValue = Math.max(1, Math.min(30, (Number(char[attr]) || 10) + amount));
    await supabase.from('characters').update({ [attr]: newValue }).eq('id', char.id);
  };

  const removeItem = async (char: Character, itemId: string) => {
    const updatedInventory = (char.inventory || []).filter(item => item.id !== itemId);
    await supabase.from('characters').update({ inventory: updatedInventory }).eq('id', char.id);
  };

  const handleTTS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsMessage.trim() || !channel) return;
    channel.send({ type: 'broadcast', event: 'tts_event', payload: { text: ttsMessage } });
    setTtsMessage('');
  };

  const syncCombat = (participants: typeof combatParticipants) => {
    if (channel) channel.send({ type: 'broadcast', event: 'combat_update', payload: participants });
  };

  const setViewMode = (mode: 'standard' | 'theater' | 'map') => {
    if (channel) channel.send({ type: 'broadcast', event: 'view_update', payload: { mode } });
  };

  const setBackground = (url: string) => {
    if (channel) channel.send({ type: 'broadcast', event: 'background_update', payload: { url } });
  };

  const addToCombat = (char: Character) => {
    const updated = [...combatParticipants, { charId: char.id, name: char.name, initiative: 0, isTurn: false }];
    setCombatParticipants(updated);
    syncCombat(updated);
  };

  const updateInitiative = (idx: number, val: number) => {
    const updated = [...combatParticipants];
    updated[idx].initiative = val;
    setCombatParticipants(updated);
    syncCombat(updated);
  };

  const sortCombat = () => {
    const sorted = [...combatParticipants].sort((a, b) => b.initiative - a.initiative);
    if (sorted.length > 0) sorted.forEach((p, i) => p.isTurn = i === 0);
    setCombatParticipants(sorted);
    syncCombat(sorted);
  };

  const nextTurn = () => {
    const currentIdx = combatParticipants.findIndex(p => p.isTurn);
    const updated = [...combatParticipants].map(p => ({ ...p, isTurn: false }));
    if (currentIdx === -1 || currentIdx === updated.length - 1) updated[0].isTurn = true;
    else updated[currentIdx + 1].isTurn = true;
    setCombatParticipants(updated);
    syncCombat(updated);
  };

  const clearCombat = () => { setCombatParticipants([]); syncCombat([]); };

  const toggleCondition = async (char: Character, condition: string) => {
    const current = char.conditions || [];
    const updated = current.includes(condition) ? current.filter(c => c !== condition) : [...current, condition];
    await supabase.from('characters').update({ conditions: updated }).eq('id', char.id);
  };

  const addXP = async (char: Character, amount: number) => {
    await supabase.from('characters').update({ xp: (char.xp || 0) + amount }).eq('id', char.id);
  };

  const levelUp = async (char: Character) => {
    await supabase.from('characters').update({ level: char.level + 1 }).eq('id', char.id);
  };

  const handleCreateNPC = async () => {
    const npc = generateRandomNPC();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    
    const { error } = await supabase.from('characters').insert({
      ...npc,
      user_id: userData.user.id
    });
    
    if (!error) fetchCharacters();
  };

  const deleteCharacter = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja apagar este personagem/NPC?')) return;
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (!error) fetchCharacters();
  };

  if (loading && characters.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-blue-400 font-bold"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0c1527] text-slate-200 relative overflow-hidden font-sans pb-20">
      {/* Premium Atmospheric Effects */}
      <div className="mist-overlay"></div>
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              '--duration': `${15 + Math.random() * 25}s`,
              animationDelay: `${Math.random() * 10}s`
            } as any}
          ></div>
        ))}
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto p-4 lg:p-8 max-w-[1800px] relative z-10 animate-in fade-in duration-1000">
        {/* Floating Premium DM Header */}
        <header className="bg-[#15234b]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 mb-10 shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-8 group transition-all hover:border-white/20">
          <div className="flex items-center gap-8 w-full lg:w-auto">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative w-24 h-24 rounded-[2rem] bg-[#0c1527]/80 flex items-center justify-center border border-white/10 shadow-inner p-3 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <div className="absolute bottom-0 right-0 bg-amber-500 text-[10px] font-black px-2 py-1 rounded-tl-xl border-t border-l border-white/20 shadow-lg text-black">
                  MESTRE
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-md">
                  Mestre do Calabouço
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  Sistema Ativo
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2"><span className="text-amber-500 text-lg">✦</span> Dashboard de Controle Global</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Desktop Tab Switcher */}
            <div className="hidden md:flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
              {[
                { id: 'characters', label: 'GRUPO', icon: Users },
                { id: 'combat', label: 'COMBATE', icon: Swords },
                { id: 'rules', label: 'REGRAS', icon: HelpCircle },
                { id: 'sounds', label: 'ÁUDIO', icon: Volume2 },
                { id: 'scenes', label: 'CENÁRIO', icon: Sparkles }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 border-l border-white/5 pl-6">
              <button
                onClick={() => setShowCompendium(true)}
                className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-all hover:scale-110 shadow-lg group"
                title="Abrir Compêndio"
              >
                <BookOpen className="w-5 h-5 group-hover:animate-pulse" />
              </button>
              <button
                onClick={onLogout}
                className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all hover:scale-110 shadow-lg"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex md:hidden mb-8 bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'characters', icon: Users },
            { id: 'combat', icon: Swords },
            { id: 'rules', icon: HelpCircle },
            { id: 'sounds', icon: Volume2 },
            { id: 'scenes', icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
            >
              <tab.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8 pb-20">
            {viewMode === 'map' ? (
              <div className="col-span-full animate-in zoom-in-95 duration-500">
                <BattleMap 
                  partyCharacters={characters} 
                  channel={channel!} 
                  isAdmin={true} 
                  backgroundUrl={backgroundUrl}
                  onBack={() => setViewMode('standard')}
                />
              </div>
            ) : (
              <>
                {activeTab === 'characters' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Party Insights */}
                    <div className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl flex flex-wrap items-center gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block">Composição do Grupo</span>
                        <div className="flex -space-x-3">
                          {characters.map((char, i) => {
                            const ic = getClassIcon(char.class_subclass);
                            return (
                              <div key={i} className="w-10 h-10 rounded-full border-2 border-[#15234b] bg-[#0c1527] flex items-center justify-center text-lg shadow-lg group relative" title={char.name}>
                                {ic.emoji}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="h-12 w-px bg-white/5 hidden md:block"></div>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(
                          characters.reduce((acc, char) => {
                            const cls = char.class_subclass.split(' ')[0];
                            acc[cls] = (acc[cls] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([cls, count]) => (
                          <div key={cls} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{cls}</span>
                            <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg">{count}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={handleCreateNPC} className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-lg active:scale-95">
                        <Plus className="w-4 h-4" /> NOVO NPC
                      </button>
                    </div>

                    {/* Adventurers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {characters.map(char => {
                        const ic = getClassIcon(char.class_subclass);
                        return (
                          <div key={char.id} className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl group hover:border-white/20 transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl transition-transform group-hover:scale-110 shadow-lg relative"
                                       style={{ backgroundColor: ic.color + '20', border: `2px solid ${ic.color}40`, color: ic.color }}>
                                    {ic.emoji}
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white border border-white/20 shadow-lg">
                                      {char.level}
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase">{char.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{char.class_subclass}</span>
                                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">• {char.race}</span>
                                    </div>
                                  </div>
                                </div>
                                {char.name.includes('(NPC)') && (
                                  <button onClick={() => deleteCharacter(char.id)} className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <div className="space-y-6">
                                {/* HP Bar Section */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                    <span className="text-red-400">Vitalidade</span>
                                    <span className="text-white">{char.hp_current} / {char.hp_max} PV</span>
                                  </div>
                                  <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                    <div 
                                      className="h-full bg-gradient-to-r from-red-600 to-orange-400 transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                      style={{ width: `${(char.hp_current/char.hp_max)*100}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex gap-2">
                                    {[-5, -1, 1, 5].map(v => (
                                      <button 
                                        key={v}
                                        onClick={() => updateHP(char, v)}
                                        className={`flex-1 py-1.5 rounded-xl border font-black text-[10px] transition-all ${v < 0 ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}
                                      >
                                        {v > 0 ? '+' : ''}{v}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">XP Atual</span>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-black text-amber-500 italic">{char.xp || 0}</span>
                                      <button onClick={() => addXP(char, 100)} className="text-[8px] font-black text-blue-400 hover:text-white uppercase">+100</button>
                                    </div>
                                  </div>
                                  <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col justify-center items-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1 text-center">Defesa (CA)</span>
                                    <span className="text-lg font-black text-white italic">{(char as any).ac || 10}</span>
                                  </div>
                                </div>

                                {/* Conditions */}
                                <div className="flex flex-wrap gap-2">
                                  {['Caído', 'Cego', 'Preso', 'Lento'].map(cond => {
                                    const isActive = char.conditions?.includes(cond);
                                    return (
                                      <button
                                        key={cond}
                                        onClick={() => toggleCondition(char, cond)}
                                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${isActive ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
                                      >
                                        {cond}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                              <button onClick={() => setSelectedChar(char)} className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition-all uppercase">
                                <PackagePlus className="w-3.5 h-3.5 inline mr-2" /> Inventário
                              </button>
                              <button onClick={() => addToCombat(char)} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-black text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-lg uppercase">
                                <Swords className="w-3.5 h-3.5 inline mr-2" /> Combate
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'combat' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <section className="bg-[#15234b]/40 backdrop-blur-xl border border-blue-500/30 rounded-[2.5rem] p-8 shadow-xl">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-2xl font-black text-white italic tracking-tight uppercase flex items-center gap-3">
                            <Swords className="w-6 h-6 text-blue-400" /> Registro de Iniciativa
                          </h2>
                          <p className="text-xs text-slate-400 font-medium mt-1">Gerencie a ordem dos turnos e efeitos de combate.</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={sortCombat} className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-lg hover:bg-blue-500 transition-all">ORDENAR</button>
                          <button onClick={clearCombat} className="px-6 py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl font-black text-[10px] tracking-widest hover:bg-red-500/20 transition-all">LIMPAR</button>
                        </div>
                      </div>

                      <div className="bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-[#15234b]/60 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-white/5">
                              <th className="p-6">Ordem</th>
                              <th className="p-6">Combatente</th>
                              <th className="p-6 text-center">Iniciativa</th>
                              <th className="p-6 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {combatParticipants.map((p, idx) => (
                              <tr key={idx} className={`transition-all ${p.isTurn ? 'bg-blue-600/10' : 'hover:bg-white/5'}`}>
                                <td className="p-6">
                                  <span className={`text-sm font-black ${p.isTurn ? 'text-blue-400' : 'text-slate-600'}`}>#{idx + 1}</span>
                                </td>
                                <td className="p-6">
                                  <div className="flex items-center gap-3">
                                    {p.isTurn && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse"></div>}
                                    <span className={`text-sm font-black uppercase italic ${p.isTurn ? 'text-white' : 'text-slate-400'}`}>{p.name}</span>
                                  </div>
                                </td>
                                <td className="p-6 text-center">
                                  <input 
                                    type="number" 
                                    className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-center text-sm font-black text-white focus:border-blue-500 outline-none transition-all shadow-inner"
                                    value={p.initiative} 
                                    onChange={e => updateInitiative(idx, parseInt(e.target.value)||0)} 
                                  />
                                </td>
                                <td className="p-6 text-right">
                                  <button onClick={() => setCombatParticipants(prev => prev.filter((_, i) => i !== idx))} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {combatParticipants.length === 0 && (
                          <div className="p-20 text-center space-y-4">
                            <Skull className="w-12 h-12 text-slate-700 mx-auto opacity-20" />
                            <p className="text-sm text-slate-600 font-black uppercase tracking-widest italic">O campo de batalha está em silêncio...</p>
                          </div>
                        )}
                      </div>
                      
                      {combatParticipants.length > 0 && (
                        <button onClick={nextTurn} className="w-full mt-8 py-5 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-4">
                          PASSAR O TURNO <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                    </section>
                  </div>
                )}

                {activeTab === 'sounds' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <section className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                      <h2 className="text-2xl font-black text-white italic tracking-tight uppercase mb-8 flex items-center gap-3">
                        <Volume2 className="w-6 h-6 text-indigo-400" /> Mesa de Efeitos Sonoros
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: 'Espadas', icon: Swords, type: 'sword', color: 'text-slate-400' },
                          { label: 'Feitiço', icon: Sparkles, type: 'magic', color: 'text-indigo-400' },
                          { label: 'Tesouro', icon: Dice5, type: 'coin', color: 'text-amber-400' },
                          { label: 'Dragão', icon: Ghost, url: 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/sounds/mob/enderdragon/growl1.ogg', color: 'text-red-400' },
                          { label: 'Geleia', icon: Droplets, url: 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/sounds/mob/slime/big1.ogg', color: 'text-emerald-400' },
                          { label: 'Cripta', icon: Skull, url: 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/sounds/mob/skeleton/say1.ogg', color: 'text-slate-500' },
                          { label: 'Sucesso', icon: CheckCircle, type: 'success', color: 'text-green-500' },
                          { label: 'Falha Critical', icon: Zap, type: 'error', color: 'text-red-600' },
                        ].map(s => (
                          <button 
                            key={s.label} 
                            onClick={() => {
                              const soundUrl = s.url || `synth:${s.type}`;
                              channel?.send({ type: 'broadcast', event: 'sound_event', payload: { url: soundUrl } });
                            }} 
                            className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4 group hover:bg-white/5 hover:border-white/20 transition-all shadow-lg active:scale-95"
                          >
                            <div className={`p-4 rounded-xl bg-white/5 transition-transform group-hover:scale-110 ${s.color}`}>
                              <s.icon className="w-8 h-8" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'scenes' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <section className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                      <h2 className="text-2xl font-black text-white italic tracking-tight uppercase mb-8 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-purple-400" /> Direção de Arte e Cenário
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { id: 'standard', label: 'Modo Ficha', desc: 'Visualização clássica e focada.', icon: User },
                          { id: 'theater', label: 'Teatro Virtual', desc: 'Foco total na narrativa visual.', icon: Sparkles },
                          { id: 'map', label: 'Estratégia Real', desc: 'Batalha tática com grid.', icon: Target }
                        ].map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as any)}
                            className={`p-8 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 group overflow-hidden relative ${viewMode === mode.id ? 'bg-blue-600/10 border-blue-500 shadow-2xl' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                          >
                            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110 ${viewMode === mode.id ? 'text-blue-400' : 'text-slate-500'}`}>
                              <mode.icon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-black text-white uppercase tracking-widest mt-2">{mode.label}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">{mode.desc}</span>
                            {viewMode === mode.id && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>}
                          </button>
                        ))}
                      </div>

                      <div className="mt-12 space-y-6">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Biblioteca de Atmosferas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { name: 'Taverna', url: '/images/scenes/taverna.png' },
                            { name: 'Caverna', url: '/images/scenes/porao.png' },
                            { name: 'Tumba', url: '/images/scenes/tumba.png' },
                            { name: 'Floresta', url: '/images/scenes/floresta.png' }
                          ].map(scene => (
                            <button
                              key={scene.url}
                              onClick={() => setBackground(scene.url)}
                              className={`group relative h-40 rounded-2xl overflow-hidden border-2 transition-all ${backgroundUrl === scene.url ? 'border-blue-500 shadow-2xl' : 'border-transparent hover:border-white/20'}`}
                            >
                              <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: `url(${scene.url})` }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-4">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{scene.name}</span>
                              </div>
                              {backgroundUrl === scene.url && <div className="absolute top-2 right-2 p-1 bg-blue-600 rounded-lg text-white"><CheckCircle className="w-3 h-3" /></div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                )}
                
                {activeTab === 'rules' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <section className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                       <h2 className="text-2xl font-black text-white italic tracking-tight uppercase mb-8 flex items-center gap-3">
                        <HelpCircle className="w-6 h-6 text-amber-500" /> Guia Rápido de Dungeon Master
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Dicas de Narração</h3>
                          <div className="space-y-3">
                            {['Use os 5 sentidos para descrever cada cena.', 'Mantenha o ritmo - não deixe o silêncio durar demais.', 'Siga a "Regra do Sim, Mas..." para encorajar criatividade.'].map((tip, i) => (
                              <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl text-xs font-semibold text-slate-400">
                                <span className="text-blue-500 mr-2">◈</span> {tip}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">Mecânicas de Emergência</h3>
                          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] space-y-4">
                            <p className="text-[11px] font-bold text-amber-200/80 leading-relaxed uppercase">Em caso de dúvida sobre uma regra complexa, decida rapidamente o que faz sentido narrativamente e verifique o manual após a sessão.</p>
                            <div className="flex items-center gap-3 text-amber-500">
                                <Info className="w-5 h-5" />
                                <span className="text-[10px] font-black tracking-widest">O DIVERSÃO VEM PRIMEIRO</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar - Global DM Tools */}
          <aside className="space-y-8">
            {/* Quick Dice Log (Shared style) */}
            <div className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col min-h-[450px]">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
                <Dice5 className="w-4 h-4 text-blue-400" /> MESA EM TEMPO REAL
              </h2>
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar-thin">
                {diceLogs.slice(0, 15).map((log, i) => (
                  <div key={i} className="flex justify-between items-center gap-4 animate-in fade-in slide-in-from-right duration-500">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block truncate">{log.player}</span>
                      <span className="text-[10px] font-bold text-slate-600 block uppercase">Rolou {log.dieType}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg border ${log.naturalRoll === 20 ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/5'}`}>
                      {log.total}
                    </div>
                  </div>
                ))}
                {diceLogs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 italic space-y-3 py-20">
                    <Skull className="w-10 h-10 opacity-10" />
                    <span className="text-[9px] font-black uppercase tracking-widest">A aguardar o destino...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Narrator AI / DM Voice */}
            <div className="bg-[#15234b]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Mic className="w-4 h-4 text-purple-400" /> VOZ DO NARRADOR
              </h2>
              <form onSubmit={handleTTS} className="space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
                  <textarea 
                    value={ttsMessage} 
                    onChange={e => setTtsMessage(e.target.value)} 
                    className="relative w-full bg-[#0c1527] border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-purple-500/50 min-h-[120px] resize-none transition-all placeholder:text-slate-700 font-bold" 
                    placeholder="Descreva a cena ou faça um anúncio épico..." 
                  />
                </div>
                <button 
                  disabled={!ttsMessage.trim() || !channel} 
                  className="w-full py-4 bg-gradient-to-r from-purple-700 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:shadow-purple-500/20 active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-4 h-4" /> TRANSMITIR NARRAÇÃO
                </button>
              </form>
            </div>

            {/* Item Allocation Modal (Repurposed as floating panel) */}
            {selectedChar && (
              <div className="bg-indigo-600/10 backdrop-blur-3xl border border-indigo-500/30 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic">{selectedChar.name}</h3>
                  <button onClick={() => setSelectedChar(null)} className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-all"><Plus className="w-4 h-4 rotate-45" /></button>
                </div>
                
                <div className="space-y-6">
                  <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar-thin space-y-2">
                    {selectedChar.inventory?.map(i => (
                      <div key={i.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 group">
                        <span className="text-[10px] font-black text-slate-300 uppercase truncate pr-2">{i.name} <span className="text-slate-600 font-medium">x{i.quantity}</span></span>
                        <button onClick={() => removeItem(selectedChar, i.id)} className="text-red-500/30 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    {(!selectedChar.inventory || selectedChar.inventory.length === 0) && <p className="text-[10px] text-slate-700 italic text-center py-4">Mochila vazia</p>}
                  </div>

                  <form onSubmit={handleGiveItem} className="space-y-3 pt-4 border-t border-white/5">
                    <input 
                      type="text" 
                      value={itemName} 
                      onChange={e => setItemName(e.target.value)} 
                      placeholder="Nome do item..." 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-[10px] font-bold outline-none focus:border-indigo-500 transition-all" 
                      required 
                    />
                    <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg hover:bg-indigo-500 active:scale-95 transition-all">
                      CONCEDER ITEM
                    </button>
                  </form>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {showCompendium && <ClassCompendium onClose={() => setShowCompendium(false)} />}
    </div>
  );
}
