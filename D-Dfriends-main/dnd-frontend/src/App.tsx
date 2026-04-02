import React, { useState, useEffect, useRef } from 'react';
import {
  Users, User, LogOut, Sparkles, Volume2, VolumeX, Dice5,
  Target, RotateCcw, BookOpen, Book, Scroll, Heart, Package, Star, HelpCircle, Info, Swords, Zap, Skull, Shield as ShieldIcon, Flame, Droplets, Wind, Ghost, Shield, PackagePlus, Loader2, CheckCircle, Trash2, Mic, ChevronRight, Move, Briefcase
} from 'lucide-react';
import { Character, DiceEvent, Profile, CombatItem, Room, RoomMessage } from './types';
import CharacterCreator from './components/CharacterCreator';
import CharacterSelection from './components/CharacterSelection';
import Auth from './components/Auth';
import DMDashboard from './components/DMDashboard';
import Dice3D from './components/Dice3D';
import ClassCompendium from './components/ClassCompendium';
import { CampaignDiary } from './components/CampaignDiary';
import Atmosphere from './components/Atmosphere';
import CompanionModal from './components/CompanionModal';
import TheaterView from './components/TheaterView';
import BattleMap from './components/BattleMap';
import ClassGuideOverlay from './components/ClassGuideOverlay';
import LandingPage from './components/LandingPage';
import RoomManager from './components/RoomManager';
import DiceCustomizer from './components/DiceCustomizer';
import SkillTreeModal from './components/SkillTreeModal';
import { Campaign, Scene, CAMPAIGNS } from './data/campaigns';
import { classData } from './data/classData';
import { supabase } from './lib/supabase';
import { User as SupabaseUser, Session, RealtimeChannel } from '@supabase/supabase-js';

const TUTORIAL_CHARACTER: Character = {
  id: 0,
  name: 'Recruta',
  class_subclass: 'Aventureiro em Treinamento',
  race: 'Humano',
  level: 1,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  hp_current: 10,
  hp_max: 10,
  ac: 10,
  xp: 0,
  conditions: [],
  inventory: [],
  user_id: 'tutorial',
  created_at: new Date().toISOString()
};

const App: React.FC = () => {
  // --- Auth & Profile State ---
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  // --- Room & Game State ---
  const [room, setRoom] = useState<Room | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [partyCharacters, setPartyCharacters] = useState<Character[]>([]);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [diceLogs, setDiceLogs] = useState<DiceEvent[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // --- UI State ---
  const [viewMode, setViewMode] = useState<'standard' | 'theater' | 'map'>('standard');
  const [showCreator, setShowCreator] = useState(false);
  const [showCompendium, setShowCompendium] = useState(false);
  const [showClassGuide, setShowClassGuide] = useState(false);
  const [showDiceCustomizer, setShowDiceCustomizer] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<Character | null>(null);
  const [isTutorialMode, setIsTutorialMode] = useState(false);
  const [tutorialSelectedClass, setTutorialSelectedClass] = useState<string | null>(null);

  // --- Campaign & Scene State ---
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [discoveredSceneIds, setDiscoveredSceneIds] = useState<string[]>([]);
  const [backgroundUrl, setBackgroundUrl] = useState('/images/scenes/taverna.png');
  const [combatOrder, setCombatOrder] = useState<CombatItem[]>([]);

  // --- Audio & Effects State ---
  const [isMuted, setIsMuted] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isFurious, setIsFurious] = useState(false);
  const [showLevelUpAnim, setShowLevelUpAnim] = useState(false);
  const [lastLevel, setLastLevel] = useState<number | null>(null);
  const [isGeneratingChronicle, setIsGeneratingChronicle] = useState(false);
  const [diceStyle, setDiceStyle] = useState<'default' | 'crystal' | 'magma' | 'metal' | 'gold'>('default');
  const [selectedDie, setSelectedDie] = useState(20);
  const [rollingDice, setRollingDice] = useState<{ isRolling: boolean, value: number, event: DiceEvent | null }>({ isRolling: false, value: 0, event: null });

  // --- Derived State ---
  const latestChronicle = roomMessages
    ?.filter(m => m.type === 'chronicle')
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.content || '';

  // --- Effects ---
  useEffect(() => {
    if (character && lastLevel !== null && character.level > lastLevel) {
      setShowLevelUpAnim(true);
      setTimeout(() => setShowLevelUpAnim(false), 5000);
    }
    if (character) setLastLevel(character.level);
  }, [character?.level]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) checkProfileAndCharacters(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) checkProfileAndCharacters(session.user);
      else resetAppState();
    });

    const channelName = room ? `mesa_${room.code}` : 'mesa_default';
    const mesaChannel = supabase.channel(channelName, { config: { broadcast: { self: true } } });

    mesaChannel
      .on('broadcast', { event: 'dice_event' }, ({ payload }) => setDiceLogs((prev) => [payload, ...prev.slice(0, 49)]))
      .on('broadcast', { event: 'hp_sync' }, ({ payload }) => setCharacter(prev => (prev && prev.id === payload.charId) ? { ...prev, hp_current: payload.hp_current } : prev))
      .on('broadcast', { event: 'sound_event' }, ({ payload }) => {
        const audio = new Audio(payload.url);
        audio.volume = 0.5;
        audio.play().catch(e => console.error(e));
      })
      .on('broadcast', { event: 'combat_update' }, ({ payload }) => setCombatOrder(payload))
      .on('broadcast', { event: 'view_update' }, ({ payload }) => setViewMode(payload.mode))
      .on('broadcast', { event: 'background_update' }, ({ payload }) => {
        setBackgroundUrl(payload.url);
        if (payload.sceneId) setCurrentSceneId(payload.sceneId);
      })
      .on('broadcast', { event: 'scene_discovery' }, ({ payload }) => setDiscoveredSceneIds(payload.discoveredIds))
      .on('broadcast', { event: 'tts_event' }, ({ payload }) => {
        if (!isMuted) {
          playNarration(payload.text, `tts_${Date.now()}`);
        }
      })
      .subscribe();

    setChannel(mesaChannel);
    return () => { mesaChannel.unsubscribe(); subscription.unsubscribe(); };
  }, [room?.code]);

  useEffect(() => {
    if (roomMessages.length > 0 && !isMuted) {
      const lastMessage = roomMessages[roomMessages.length - 1];
      if (lastMessage.player_name === 'Narrador IA' && lastMessage.type === 'narration') {
        playNarration(lastMessage.content, lastMessage.id);
      }
    }
  }, [roomMessages.length]);

  // --- Helpers ---
  const resetAppState = () => {
    setCharacter(null); setRoom(null); setUserCharacters([]); setProfile(null); setShowCreator(false); setLoading(false);
  };

  const checkProfileAndCharacters = async (currentUser: SupabaseUser) => {
    setLoading(true);
    const { data: charData } = await supabase.from('characters').select('*').eq('user_id', currentUser.id);
    if (charData) setUserCharacters(charData);
    let { data: profData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (profData) setProfile(profData as Profile);
    if (room) { fetchRoomMessages(room.id); fetchAllCharacters(room.id); }
    setLoading(false);
  };

  const fetchRoomMessages = async (roomId: string) => {
    const { data } = await supabase.from('room_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
    if (data) setRoomMessages(data);
  };

  const fetchAllCharacters = async (roomId: string) => {
    const { data } = await supabase.from('characters').select('*').eq('room_id', roomId).order('name', { ascending: true });
    if (data) setPartyCharacters(data);
  };

  const handleCreate = async (newChar: Partial<Character>) => {
    if (!user) return;
    const characterData = { ...newChar, user_id: user.id, room_id: room?.id };
    const { data, error } = await supabase.from('characters').insert([characterData]).select().single();
    if (!error && data) { setUserCharacters(prev => [data, ...prev]); setCharacter(data); setShowCreator(false); }
  };

  const updateHP = async (amount: number) => {
    if (!character) return;
    const newHP = Math.max(0, Math.min(character.hp_max, character.hp_current + amount));
    const { error } = await supabase.from('characters').update({ hp_current: newHP }).eq('id', character.id);
    if (!error) {
      setCharacter({ ...character, hp_current: newHP });
      channel?.send({ type: 'broadcast', event: 'hp_sync', payload: { charId: character.id, hp_current: newHP } });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!room || !character) return;
    setIsAiThinking(true);
    await supabase.from('room_messages').insert({ room_id: room.id, player_name: character.name, content, type: 'action' });
    await fetchRoomMessages(room.id);
    if (room.is_ai_mode) {
      const { data } = await supabase.functions.invoke('ai-master', { body: { message: content, roomId: room.id, characterContext: character } });
      if (data?.text) await fetchRoomMessages(room.id);
    }
    setIsAiThinking(false);
  };

  const playNarration = async (text: string, messageId: string) => {
    if (isMuted || currentlyPlaying === messageId) return;
    
    // Para narrações curtas, toca direto. Para longas, divide em parágrafos para evitar limites de API.
    const chunks = text.split(/\n\n+/).filter(t => t.trim().length > 0);
    setCurrentlyPlaying(messageId);

    try {
      for (const [index, chunk] of chunks.entries()) {
        // Se mudou a mensagem ou silenciou, para o loop
        if (currentlyPlaying !== null && currentlyPlaying !== messageId) break;
        if (isMuted) break;

        const { data } = await supabase.functions.invoke('tts', { 
          body: { text: chunk, style: room?.style || 'Epic' } 
        });

        if (data) {
          const blob = data instanceof Blob ? data : new Blob([data], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
          }
          
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.volume = 0.5;
          
          await new Promise((resolve, reject) => {
            audio.onended = () => {
              URL.revokeObjectURL(url);
              resolve(true);
            };
            audio.onerror = reject;
            audio.play().catch(reject);
          });
        }
        
        // Se for o último pedaço, limpa o estado
        if (index === chunks.length - 1) {
          setCurrentlyPlaying(null);
        }
      }
    } catch (e) { 
      console.error('[Audio] Erro na narração:', e); 
      setCurrentlyPlaying(null); 
    }
  };

  const calculateModifier = (val: number) => Math.floor((val - 10) / 2);
  const handleRoll = (statName: string, dieSize: number) => {
    if (!character || !channel) return;
    const statMap: { [key: string]: keyof Character } = { 'Força': 'strength', 'Destreza': 'dexterity', 'Constituição': 'constitution', 'Inteligência': 'intelligence', 'Sabedoria': 'wisdom', 'Carisma': 'charisma' };
    const key = statMap[statName] || statName.toLowerCase() as keyof Character;
    const statValue = (character as any)[key] || 10;
    const modifier = calculateModifier(statValue);
    const naturalRoll = Math.floor(Math.random() * dieSize) + 1;
    setRollingDice({ isRolling: true, value: naturalRoll, event: { player: character.name, dieType: `D${dieSize} (${statName})`, naturalRoll, modifier, total: naturalRoll + modifier, timestamp: new Date().toISOString() } });
  };

  const finalizeRoll = () => {
    if (rollingDice.event && channel) {
      channel.send({ type: 'broadcast', event: 'dice_event', payload: rollingDice.event });
      const saveAndTrigger = async (event: DiceEvent) => {
        const content = `${event.player} rolou ${event.dieType}: **${event.total}**`;
        await supabase.from('room_messages').insert({ room_id: room!.id, player_name: event.player, content, type: 'dice' });
        await fetchRoomMessages(room!.id);
        if (room!.is_ai_mode) {
          const { data } = await supabase.functions.invoke('ai-master', { body: { message: `ROLAGEM: ${content}`, roomId: room!.id, characterContext: character } });
          if (data?.text) await fetchRoomMessages(room!.id);
        }
      };
      saveAndTrigger(rollingDice.event);
    }
    setTimeout(() => setRollingDice({ isRolling: false, value: 0, event: null }), 1500);
  };

  const handleGenerateChronicle = async () => {
    if (!room || !character) return;
    setIsGeneratingChronicle(true);
    await supabase.functions.invoke('ai-master', { body: { isChronicle: true, roomId: room.id, characterContext: character } });
    await fetchRoomMessages(room.id);
    setIsGeneratingChronicle(false);
  };

  const handleToggleMute = () => setIsMuted(prev => !prev);
  const handleSelectScene = (scene: Scene) => {
    setCurrentSceneId(scene.id); setBackgroundUrl(scene.imageUrl);
    channel?.send({ type: 'broadcast', event: 'background_update', payload: { url: scene.imageUrl, sceneId: scene.id } });
  };
  const handleDiscoverScene = (sceneId: string) => {
    const updated = [...new Set([...discoveredSceneIds, sceneId])];
    setDiscoveredSceneIds(updated);
    channel?.send({ type: 'broadcast', event: 'scene_discovery', payload: { discoveredIds: updated } });
  };

  const handleSelectSubclass = async (subclassName: string) => {
    if (!character) return;
    const newClassSubclass = `${character.class_subclass.split(' / ')[0]} / ${subclassName}`;
    const { error } = await supabase.from('characters').update({ class_subclass: newClassSubclass }).eq('id', character.id);
    if (!error) setCharacter({ ...character, class_subclass: newClassSubclass });
    setShowSkillTree(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-400 font-bold animate-pulse text-2xl">CARREGANDO MESA...</div>;
  if (!session) return showLanding ? <LandingPage onStart={() => setShowLanding(false)} onLogin={() => setShowLanding(false)} /> : <Auth onAuthSuccess={() => { }} />;
  if (!room) return <RoomManager user={user} onRoomSelected={setRoom} />;
  
  if (user?.email === 'admin@admin.com' || user?.email?.startsWith('admin') || user?.email?.startsWith('mestre')) {
    return <DMDashboard onLogout={() => supabase.auth.signOut()} channel={channel} viewMode={viewMode} backgroundUrl={backgroundUrl} diceLogs={diceLogs} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-slate-200 font-inter">
      {/* Background stays the same for selection/creator/dashboard for consistency, or we can customize */}
      <div className="fixed inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ backgroundImage: `url(${backgroundUrl})` }} />
      <div className="fixed inset-0 bg-[#0c1527]/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full h-full">
        {!character ? (
          showCreator ? (
            <div className="container mx-auto p-4 lg:p-12 animate-in fade-in duration-500">
               <CharacterCreator 
                 onCreate={handleCreate} 
                 initialClass={tutorialSelectedClass} 
                 onOpenCompendium={() => setShowCompendium(true)}
               />
               <button onClick={() => setShowCreator(false)} className="mt-8 mx-auto block px-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase hover:bg-white/10 transition-all text-slate-400">Voltar</button>
            </div>
          ) : (
            <div className="container mx-auto p-4 lg:p-12 animate-in fade-in duration-500">
              <CharacterSelection 
                characters={userCharacters} 
                onSelect={setCharacter} 
                onCreateNew={() => setShowCreator(true)} 
                onDelete={(id) => supabase.from('characters').delete().eq('id', id).then(() => setUserCharacters(p => p.filter(c => c.id !== id)))} 
              />
            </div>
          )
        ) : (
          /* Main Application (Standard / Theater / Map) */
          <div className="container mx-auto p-4 lg:p-12">
            {(rollingDice.isRolling || rollingDice.value > 0) && (
              <Dice3D value={rollingDice.value} isRolling={rollingDice.isRolling} onAnimationEnd={finalizeRoll} material={diceStyle} />
            )}

            {viewMode === 'theater' && (
              <TheaterView room={room} backgroundUrl={backgroundUrl} messages={roomMessages} partyCharacters={partyCharacters} character={character} onSendMessage={handleSendMessage} isAiThinking={isAiThinking} isMuted={isMuted} onToggleMute={handleToggleMute} playNarration={playNarration} currentlyPlaying={currentlyPlaying} onClose={() => setViewMode('standard')} isNarrator={(n) => n === 'Narrador IA'} activeCampaign={activeCampaign} currentSceneId={currentSceneId} discoveredSceneIds={discoveredSceneIds} onSelectScene={handleSelectScene} onDiscoverScene={handleDiscoverScene} isMaster={false} onOpenDiary={() => setShowDiary(true)} />
            )}

            {viewMode === 'map' && <BattleMap partyCharacters={partyCharacters} channel={channel!} isAdmin={false} backgroundUrl={backgroundUrl} onBack={() => setViewMode('standard')} />}

            {viewMode === 'standard' && (
              <div className="flex flex-col animate-in fade-in slide-in-from-bottom duration-700">
                {/* Header */}
                <header className="bg-[#15234b]/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 mb-8 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className={`w-24 h-24 rounded-[2rem] bg-[#0c1527]/90 flex items-center justify-center border border-white/10 p-4 relative ${isFurious ? 'animate-fury' : ''}`}>
                      <img src="/logo.png" className="w-full h-full object-contain opacity-80" alt="Logo" />
                      <div className={`absolute -bottom-1 -right-1 text-xs font-black px-3 py-1 rounded-xl shadow-lg ${showLevelUpAnim ? 'bg-amber-500 animate-bounce' : 'bg-blue-600'}`}>NÍVEL {character.level}</div>
                    </div>
                    <div>
                      <h1 className={`text-4xl lg:text-5xl font-black italic uppercase tracking-tighter ${showLevelUpAnim ? 'animate-level-up text-amber-400' : 'text-white'}`}>{character.name}</h1>
                      <p className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mt-1">{character.race} {character.class_subclass}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-black/40 p-1.5 rounded-[1.5rem] border border-white/5 flex gap-1">
                      {['standard', 'theater', 'map'].map(mode => (
                        <button key={mode} onClick={() => setViewMode(mode as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-500 hover:text-white'}`}>{mode.toUpperCase()}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowCompendium(true)} title="Compêndio de Classes" className="p-4 bg-white/5 border border-white/10 rounded-2xl text-amber-400 hover:bg-amber-600 hover:text-white transition-all"><BookOpen className="w-6 h-6" /></button>
                      <button onClick={() => { console.log("Toggling Skill Tree. Character:", character); setShowSkillTree(true); }} title="Habilidades" className="p-4 bg-white/5 border border-white/10 rounded-2xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all"><Star className="w-6 h-6" /></button>
                      <button onClick={() => setShowDiceCustomizer(true)} title="Dados" className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:bg-white/10 transition-all"><Dice5 className="w-6 h-6" /></button>
                      <button onClick={handleToggleMute} className="p-4 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10">{isMuted ? <VolumeX className="w-6 h-6 text-red-500" /> : <Volume2 className="w-6 h-6 text-blue-400" />}</button>
                      <button onClick={() => supabase.auth.signOut()} className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 transition-all hover:text-white"><LogOut className="w-6 h-6" /></button>
                    </div>
                  </div>
                </header>

                {/* Grid Layout */}
                <div className="space-y-8">
                  <div className="attr-bar-horizontal">
                    {[{l:'FORÇA',k:'strength',c:'attr-red'},{l:'DESTREZA',k:'dexterity',c:'attr-teal'},{l:'CONSTITUIÇÃO',k:'constitution',c:'attr-pink'},{l:'INTELIGÊNCIA',k:'intelligence',c:'attr-blue'},{l:'SABEDORIA',k:'wisdom',c:'attr-purple'},{l:'CARISMA',k:'charisma',c:'attr-magenta'}].map(a=>(
                      <button key={a.k} onClick={()=>handleRoll(a.l,20)} className={`attr-card-premium ${a.c}`}>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{a.l}</span>
                        <span className="text-4xl font-black italic text-white leading-none">{(character as any)[a.k]}</span>
                        <span className="text-xs font-black text-blue-400 mt-1">({calculateModifier((character as any)[a.k]) >= 0 ? '+' : ''}{calculateModifier((character as any)[a.k])})</span>
                      </button>
                    ))}
                  </div>

                  <div className="dice-tray-container">
                    {[4,6,8,10,12,20,100].map(s=>(
                      <button key={s} onClick={()=>handleRoll(`D${s}`,s)} className="dice-card-premium group">
                        <div className="dice-icon-placeholder"><span className="text-xl">d{s}</span></div>
                        <span className="text-[10px] font-black text-slate-500 group-hover:text-white transition-colors uppercase tracking-widest">ROLAR D{s}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 dashboard-section">
                      <h3 className="dashboard-section-title"><Heart className="w-4 h-4 text-red-500" /> STATUS VITAL</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex flex-col items-center justify-center p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/10">
                          <span className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.3em] mb-4">PONTOS DE VIDA</span>
                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-5xl font-black text-white italic">{character.hp_current}</span>
                            <span className="text-lg font-bold text-slate-600">/ {character.hp_max}</span>
                          </div>
                          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-6"><div className="h-full bg-red-500" style={{width:`${(character.hp_current/character.hp_max)*100}%`}} /></div>
                          <div className="flex gap-4 w-full">
                            <button onClick={()=>updateHP(-1)} className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-black hover:bg-red-500/20 active:scale-95 transition-all">-1 HP</button>
                            <button onClick={()=>updateHP(1)} className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-black hover:bg-blue-500/20 active:scale-95 transition-all">+1 HP</button>
                          </div>
                        </div>
                        {[{i:Shield,l:'DEFESA (CA)',v:character.ac,c:'text-blue-400'},{i:Zap,l:'INICIATIVA',v:(calculateModifier(character.dexterity)>=0?'+':'')+calculateModifier(character.dexterity),c:'text-amber-400'},{i:Move,l:'DESLOCAMENTO',v:'9m',c:'text-emerald-400'}].map((s,i)=>(
                          <div key={i} className="status-mini-card">
                            <s.i className={`w-8 h-8 ${s.c} mb-3`} />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">{s.l}</span>
                            <span className="text-4xl font-black text-white italic">{s.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-4 dashboard-section">
                      <h3 className="dashboard-section-title"><Users className="w-4 h-4 text-blue-400" /> MESA DE JOGADORES</h3>
                      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar-thin">
                        {partyCharacters.map(char=>(
                          <div key={char.id} className="player-card-mini group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:bg-blue-600/20 transition-all">{char.icon || '👤'}</div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-white uppercase truncate">{char.name}</p>
                              <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{char.class_subclass}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 dashboard-section">
                       <div className="flex justify-between items-center mb-8">
                          <h3 className="dashboard-section-title mb-0"><Package className="w-4 h-4 text-amber-500" /> MOCHILA DE AVENTURA</h3>
                          <button className="p-3 bg-white/5 rounded-2xl hover:bg-amber-500/20 border border-white/5 transition-all"><PackagePlus className="w-5 h-5 text-amber-400" /></button>
                       </div>
                       <div className="inventory-grid">
                          {character.inventory && character.inventory.length > 0 ? character.inventory.map((item, idx) => (
                            <div key={idx} className="inventory-item group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">📦</div>
                                <div>
                                  <p className="text-xs font-black text-white uppercase">{item.name}</p>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">QUANTIDADE: {item.quantity || 1}</p>
                                </div>
                              </div>
                              <button className="p-3 text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          )) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                              <Briefcase className="w-16 h-16 mb-4" />
                              <p className="text-xs font-black uppercase tracking-[0.3em]">Seu inventário está vazio</p>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="lg:col-span-4 dashboard-section">
                      <h3 className="dashboard-section-title"><Scroll className="w-4 h-4 text-purple-400" /> MESA EM TEMPO REAL</h3>
                      <div className="log-container h-[420px]">
                        {diceLogs.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-32 text-center">
                            <Dice5 className="w-12 h-12 mb-4 animate-spin-slow" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando Destino...</p>
                          </div>
                        ) : diceLogs.map((log, i) => (
                          <div key={i} className="log-entry hover:bg-white/5 transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                 <span className="text-[11px] font-black text-blue-400 uppercase block mb-1">{log.player}</span>
                                 <span className="text-[9px] font-bold text-slate-500 uppercase italic tracking-widest">{log.dieType}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-white italic tracking-tighter leading-none">{log.total}</span>
                                <span className="text-[9px] font-black text-slate-600 uppercase mt-1">MOD: {log.modifier >= 0 ? '+' : ''}{log.modifier}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {showDiary && <CampaignDiary isOpen={showDiary} onClose={() => setShowDiary(false)} chronicle={latestChronicle} onGenerateChronicle={handleGenerateChronicle} isGenerating={isGeneratingChronicle} />}
        {showCompendium && <ClassCompendium onClose={() => setShowCompendium(false)} />}
        {selectedCompanion && <CompanionModal character={selectedCompanion} onClose={() => setSelectedCompanion(null)} />}
        
        <DiceCustomizer isOpen={showDiceCustomizer} onClose={() => setShowDiceCustomizer(false)} currentStyle={diceStyle} onSelect={(s) => { setDiceStyle(s); setShowDiceCustomizer(false); }} />
        
        {character && (
          <SkillTreeModal 
            isOpen={showSkillTree} 
            onClose={() => setShowSkillTree(false)} 
            character={character} 
            onSelectSubclass={handleSelectSubclass}
          />
        )}
      </div>
    </div>
  );
};

export default App;
