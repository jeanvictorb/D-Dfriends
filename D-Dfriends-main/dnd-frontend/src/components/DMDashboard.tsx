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
    <div className="container mx-auto p-4 lg:p-8 min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 border-b border-[#2a4387]/50 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
            <Shield className="text-blue-500 w-10 h-10" /> Painel do Mestre
          </h1>
          <div className="flex gap-4 mt-6">
            {[
              { id: 'characters', label: 'Jogadores', icon: Users },
              { id: 'combat', label: 'Combate', icon: Swords },
              { id: 'rules', label: 'Regras', icon: HelpCircle },
              { id: 'sounds', label: 'Ambiente', icon: Volume2 },
              { id: 'scenes', label: 'Cenário', icon: Sparkles }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#0c1527] text-slate-400 border border-[#2a4387]/30'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
            <button onClick={handleCreateNPC} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/50 transition-all">
              <Plus className="w-4 h-4" /> Gerar NPC
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowCompendium(true)} className="flex items-center gap-2 px-6 py-3 interactive-btn text-amber-300 border-amber-500/30 text-sm font-bold shadow-lg">
            <BookOpen className="w-5 h-5" /> Compêndio
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 interactive-btn text-red-300 border-red-500/30 text-sm font-bold shadow-lg">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'map' ? (
            <div className="col-span-full">
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
            <>
              {/* Party Composition Summary */}
              <div className="flex flex-wrap gap-2 mb-4 bg-[#0c1527]/40 p-4 rounded-xl border border-[#2a4387]/30">
                <div className="w-full mb-2"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Composição do Grupo</span></div>
                {Object.entries(
                  characters.reduce((acc, char) => {
                    const cls = char.class_subclass.split(' ')[0];
                    acc[cls] = (acc[cls] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([cls, count]) => (
                  <div key={cls} className="px-3 py-1 bg-blue-900/30 border border-blue-500/20 rounded-full flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white uppercase">{cls}</span>
                    <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[8px] font-black text-white">{count}</span>
                  </div>
                ))}
                {characters.length === 0 && <span className="text-xs text-slate-500 italic">Nenhum aventureiro ativo...</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characters.map(char => (
                  <div key={char.id} className="panel flex flex-col justify-between h-fit">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {(() => { const ic = getClassIcon(char.class_subclass); return <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: ic.color + '22', border: `1px solid ${ic.color}55` }}>{ic.emoji}</div>; })()}
                          <div>
                            <h3 className="text-lg font-bold text-white leading-tight">{char.name}</h3>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{char.class_subclass}</p>
                            <p className="text-[9px] text-slate-500 font-medium">Nv {char.level} • XP {char.xp || 0}</p>
                          </div>
                        </div>
                        {char.name.includes('(NPC)') && (
                          <button onClick={() => deleteCharacter(char.id)} className="text-red-500/30 hover:text-red-500 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="bg-[#0c1527] p-2 rounded-xl border border-[#2a4387]/50">
                          <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span>Vida</span><span className="text-white">{char.hp_current}/{char.hp_max}</span></div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden inline-block group relative">
                            <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(char.hp_current/char.hp_max)*100}%` }}></div>
                          </div>
                          <div className="flex gap-1 mt-2">
                             <button onClick={() => updateHP(char, -1)} className="flex-1 py-1 rounded bg-red-900/30 border border-red-500/20 text-[8px] font-black text-red-400 hover:bg-red-600 hover:text-white transition-all">-1</button>
                             <button onClick={() => updateHP(char, -5)} className="flex-1 py-1 rounded bg-red-900/30 border border-red-500/20 text-[8px] font-black text-red-400 hover:bg-red-600 hover:text-white transition-all">-5</button>
                             <button onClick={() => updateHP(char, 1)} className="flex-1 py-1 rounded bg-green-900/30 border border-green-500/20 text-[8px] font-black text-green-400 hover:bg-green-600 hover:text-white transition-all">+1</button>
                             <button onClick={() => updateHP(char, 5)} className="flex-1 py-1 rounded bg-green-900/30 border border-green-500/20 text-[8px] font-black text-green-400 hover:bg-green-600 hover:text-white transition-all">+5</button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['Envenenado', 'Atordoado', 'Caído', 'Sangrando'].map(cond => (
                            <button key={cond} onClick={() => toggleCondition(char, cond)} className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all ${char.conditions?.includes(cond) ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{cond}</button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => addXP(char, 100)} className="flex-1 py-1 px-2 rounded bg-blue-900/40 border border-blue-500/30 text-[9px] font-black text-blue-300">+100 XP</button>
                           <button onClick={() => levelUp(char)} className="flex-1 py-1 px-2 rounded bg-amber-900/40 border border-amber-500/30 text-[9px] font-black text-amber-300">Level Up</button>
                        </div>

                        {/* Attribute Adjustment Grid */}
                        <div className="grid grid-cols-3 gap-2 mt-4 bg-[#0c1527] p-2 rounded-xl border border-[#2a4387]/30">
                          {[
                            { key: 'strength', label: 'FOR' },
                            { key: 'dexterity', label: 'DES' },
                            { key: 'constitution', label: 'CON' },
                            { key: 'intelligence', label: 'INT' },
                            { key: 'wisdom', label: 'SAB' },
                            { key: 'charisma', label: 'CAR' }
                          ].map(attr => (
                            <div key={attr.key} className="flex flex-col items-center">
                              <span className="text-[8px] font-black text-slate-500 uppercase">{attr.label}</span>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => updateAttribute(char, attr.key as any, -1)} className="text-red-500 hover:text-red-400 font-bold text-xs">-</button>
                                <span className="text-white font-bold text-xs">{(char as any)[attr.key]}</span>
                                <button onClick={() => updateAttribute(char, attr.key as any, 1)} className="text-green-500 hover:text-green-400 font-bold text-xs">+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setSelectedChar(char)} className="flex-1 py-2 rounded-lg border border-[#2a4387]/30 text-slate-400 font-bold text-xs"><Plus className="w-3 h-3 inline mr-1" /> Itens</button>
                      <button onClick={() => addToCombat(char)} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs"><Swords className="w-3 h-3 inline mr-1" /> Combate</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'combat' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Swords className="w-5 h-5 text-blue-400" /> Iniciativa</h2><div className="flex gap-2"><button onClick={sortCombat} className="px-3 py-1 bg-blue-600 text-white rounded font-bold text-xs">Ordenar</button><button onClick={clearCombat} className="px-3 py-1 bg-slate-800 text-slate-400 rounded font-bold text-xs">Limpar</button></div></div>
              <div className="bg-[#0c1527] rounded-xl overflow-hidden border border-[#2a4387]/30">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#15234b]/60 text-slate-400 uppercase text-[10px] font-black"><tr><th className="p-3">#</th><th className="p-3">Nome</th><th className="p-3 text-center">Inic.</th><th className="p-3"></th></tr></thead>
                  <tbody className="divide-y divide-[#2a4387]/20 text-white">
                    {combatParticipants.map((p, idx) => (
                      <tr key={idx} className={p.isTurn ? 'bg-blue-600/10' : ''}><td className="p-3 text-slate-500">{idx+1}</td><td className="p-3 flex items-center gap-2">{p.isTurn && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}{p.name}</td><td className="p-3 text-center"><input type="number" className="w-12 bg-slate-900 border border-[#2a4387]/30 rounded text-center" value={p.initiative} onChange={e => updateInitiative(idx, parseInt(e.target.value)||0)} /></td><td className="p-3 text-right"><button onClick={() => setCombatParticipants(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3 text-red-500/50" /></button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {combatParticipants.length > 0 && <button onClick={nextTurn} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2">PRÓXIMO TURNO <ChevronRight className="w-5 h-5" /></button>}
            </div>
          )}

          {activeTab === 'sounds' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Espadas', icon: Swords, type: 'sword' },
                  { label: 'Magia', icon: Sparkles, type: 'magic' },
                  { label: 'Ouro', icon: Dice5, type: 'coin' },
                  { label: 'Dragão', icon: Ghost, url: 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/sounds/mob/enderdragon/growl1.ogg' },
                  { label: 'Geleia', icon: Droplets, url: 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/sounds/mob/slime/big1.ogg' },
                  { label: 'Ossos', icon: Skull, url: 'https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/sounds/mob/skeleton/say1.ogg' },
                  { label: 'Sucesso', icon: CheckCircle, type: 'success' },
                  { label: 'Erro', icon: Zap, type: 'error' },
                ].map(s => (
                  <button key={s.label} onClick={async () => {
                    const soundUrl = s.url || `synth:${s.type}`;
                    console.log('[SOUND] Sending sound event:', soundUrl);
                    const status = await channel?.send({ type: 'broadcast', event: 'sound_event', payload: { url: soundUrl } });
                    console.log('[SOUND] Broadcast status:', status);
                  }} className="p-4 rounded-xl border border-[#2a4387]/30 bg-[#0c1527] flex flex-col items-center gap-2 hover:border-blue-500/50 transition-all font-bold text-[10px] text-slate-400 uppercase">
                    <s.icon className="w-5 h-5 text-blue-400" />
                    {s.label}
                  </button>
                ))}
            </div>
          )}

          {activeTab === 'scenes' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="panel bg-[#0c1527]/40 border-blue-500/30">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <Swords className="text-blue-400 w-6 h-6" /> Modo de Visualização
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'standard', label: 'Ficha Padrão', desc: 'Foco nos atributos e inventário.', icon: User },
                    { id: 'theater', label: 'Teatro da Mente', desc: 'Imersão visual com cenário e log.', icon: Sparkles },
                    { id: 'map', label: 'Mapa de Batalha', desc: 'Combate tático com grid e tokens.', icon: Target }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id as any)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${viewMode === mode.id ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-[#0c1527] border-[#2a4387]/30 hover:border-blue-500/50'}`}
                    >
                      <mode.icon className={`w-8 h-8 ${viewMode === mode.id ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="font-black text-white uppercase tracking-wider">{mode.label}</span>
                      <span className="text-xs text-slate-400 font-medium">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel bg-[#0c1527]/40 border-purple-500/30">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <Sparkles className="text-purple-400 w-6 h-6" /> Cenários Predefinidos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Taverna Aconchegante', url: '/images/scenes/taverna.png', color: 'bg-amber-900/40 border-amber-500/30' },
                    { name: 'Porão Sombrio', url: '/images/scenes/porao.png', color: 'bg-slate-900/40 border-slate-500/30' },
                    { name: 'Tumba Antiga', url: '/images/scenes/tumba.png', color: 'bg-emerald-900/40 border-emerald-500/30' }
                  ].map(scene => (
                    <button
                      key={scene.url}
                      onClick={() => setBackground(scene.url)}
                      className={`group relative h-32 rounded-2xl overflow-hidden border-2 transition-all ${backgroundUrl === scene.url ? 'border-white ring-2 ring-purple-500/50' : 'border-transparent'}`}
                    >
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" 
                        style={{ backgroundImage: `url(${scene.url})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                        <span className="text-xs font-black text-white uppercase tracking-widest">{scene.name}</span>
                      </div>
                      {backgroundUrl === scene.url && (
                        <div className="absolute top-2 right-2 bg-white text-purple-600 p-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-[#2a4387]/30">
                  <h4 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">URL de Cenário Personalizado</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="flex-1 bg-[#0c1527] border border-[#2a4387]/50 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500"
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          setBackground(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
          </>
          )}
        </div>

        <div className="space-y-6">
          {/* DM Dice Tray */}
          <div className="panel bg-[#0c1527]/60 border-amber-500/30">
            <h3 className="text-xs font-black text-amber-400 uppercase mb-4 flex items-center gap-2">
              <Dice5 className="w-4 h-4" /> Dados do Mestre
            </h3>
            <div className="flex flex-wrap gap-2">
              {[4, 6, 8, 10, 12, 20, 100].map(die => (
                <button
                  key={die}
                  onClick={() => handleRoll(`d${die}`, die)}
                  className="w-10 h-10 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-center justify-center font-black text-xs text-amber-200 hover:bg-amber-600 hover:text-white transition-all active:scale-95"
                >
                  {die === 100 ? '%' : `d${die}`}
                </button>
              ))}
            </div>
          </div>

          <div className="panel flex flex-col">
            <h3 className="text-sm font-black text-white uppercase mb-4 flex items-center gap-2"><Mic className="w-4 h-4 text-purple-400" /> Voz do Mestre</h3>
            <form onSubmit={handleTTS} className="space-y-3">
              <textarea value={ttsMessage} onChange={e => setTtsMessage(e.target.value)} className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded-xl p-3 text-white text-xs outline-none focus:border-purple-500 min-h-[100px]" placeholder="Fale algo épico..." />
              <button disabled={!ttsMessage.trim() || !channel} className="w-full py-3 bg-purple-600 text-white rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-30">Anunciar</button>
            </form>
          </div>

          {selectedChar ? (
            <div className="panel h-fit space-y-4">
              <div className="flex justify-between items-center"><h3 className="font-bold text-white leading-tight">{selectedChar.name}</h3><button onClick={() => setSelectedChar(null)} className="text-[10px] text-slate-500 underline">Fechar</button></div>
              <div className="space-y-3 pt-3 border-t border-[#2a4387]/30">
                 <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedChar.inventory?.map(i => (
                      <li key={i.id} className="flex justify-between text-xs bg-[#0c1527] p-2 rounded border border-[#2a4387]/30"><span>{i.name} x{i.quantity}</span><button onClick={() => removeItem(selectedChar, i.id)} className="text-red-500/40"><Trash2 className="w-3 h-3" /></button></li>
                    ))}
                 </ul>
                 <form onSubmit={handleGiveItem} className="space-y-2 mt-4 pt-4 border-t border-[#2a4387] border-dashed">
                    <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Novo item..." className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded p-2 text-xs" required />
                    <button className="w-full py-2 bg-blue-600 text-white rounded font-bold text-xs uppercase">Dar Item</button>
                 </form>
              </div>
            </div>
          ) : (
            <div className="panel text-center py-8 text-slate-600 italic text-xs">Selecione um herói para gerenciar itens.</div>
          )}


          {/* Dice Log */}
          <div className="panel h-[400px] flex flex-col bg-[#0c1527]/40 border-blue-500/20">
            <h3 className="text-xs font-black text-blue-400 uppercase mb-6 tracking-widest flex items-center gap-2">
              <Dice5 className="w-4 h-4" /> Log de Dados da Mesa
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {diceLogs.map((log, index) => (
                <div key={index} className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-[#2a4387]/20 animate-in slide-in-from-right duration-300">
                  <div>
                    <span className="font-bold text-blue-400 block">{log.player}</span>
                    <span className="text-slate-500 text-[10px]">{log.dieType} {log.modifier >= 0 ? '+' : ''}{log.modifier}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${log.naturalRoll === 20 ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-white'}`}>
                      {log.total}
                    </span>
                  </div>
                </div>
              ))}
              {diceLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
                  <Dice5 className="w-8 h-8 opacity-20 mb-2" />
                  <span>Aguardando rolagens...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showCompendium && <ClassCompendium onClose={() => setShowCompendium(false)} />}
    </div>
  );
}
