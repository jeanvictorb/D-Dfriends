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
import SkillTree from './components/SkillTree';
import CompanionModal from './components/CompanionModal';
import TheaterView from './components/TheaterView';
import BattleMap from './components/BattleMap';
import ClassGuideOverlay from './components/ClassGuideOverlay';
import LandingPage from './components/LandingPage';
import RoomManager from './components/RoomManager';
import { Campaign, Scene, CAMPAIGNS } from './data/campaigns';
import { classData } from './data/classData';
import { supabase } from './lib/supabase';
import { getClassIcon } from './lib/classIcons';
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
  const [isMuted, setIsMuted] = useState(false); // TTS Mute
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

  // 1. Level Up Detection
  useEffect(() => {
    if (character && lastLevel !== null && character.level > lastLevel) {
      setShowLevelUpAnim(true);
      setTimeout(() => setShowLevelUpAnim(false), 5000);
    }
    if (character) setLastLevel(character.level);
  }, [character?.level]);


  // 3. Auth & Realtime Effect
  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        checkProfileAndCharacters(session.user);
      } else {
        setLoading(false);
      }
    });

    // Auth Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        checkProfileAndCharacters(session.user);
      } else {
        resetAppState();
      }
    });

    // Realtime Channel Setup
    const channelName = room ? `mesa_${room.code}` : 'mesa_default';
    const mesaChannel = supabase.channel(channelName, {
      config: { broadcast: { self: true } }
    });

    mesaChannel
      .on('broadcast', { event: 'dice_event' }, ({ payload }: { payload: DiceEvent }) => {
        setDiceLogs((prev) => [payload, ...prev.slice(0, 49)]);
      })
      .on('broadcast', { event: 'hp_sync' }, ({ payload }) => {
        setCharacter(prev => (prev && prev.id === payload.charId) ? { ...prev, hp_current: payload.hp_current } : prev);
      })
      .on('broadcast', { event: 'sound_event' }, ({ payload }) => {
        if (payload.url.startsWith('synth:')) {
          // Synth sounds disabled per user request
        } else {
          const audio = new Audio(payload.url);
          audio.volume = 0.5;
          audio.play().catch(e => console.error("Sound play failed:", e));
        }
      })
      .on('broadcast', { event: 'combat_update' }, ({ payload }) => setCombatOrder(payload))
      .on('broadcast', { event: 'view_update' }, ({ payload }) => setViewMode(payload.mode))
      .on('broadcast', { event: 'background_update' }, ({ payload }) => {
        setBackgroundUrl(payload.url);
        if (payload.sceneId) setCurrentSceneId(payload.sceneId);
      })
      .on('broadcast', { event: 'scene_discovery' }, ({ payload }) => setDiscoveredSceneIds(payload.discoveredIds))
      .subscribe();

    setChannel(mesaChannel);

    return () => {
      mesaChannel.unsubscribe();
      subscription.unsubscribe();
    };
  }, [room?.code]);

  // 4. Auto-play Narrations
  useEffect(() => {
    if (roomMessages.length > 0 && !isMuted) {
      const lastMessage = roomMessages[roomMessages.length - 1];
      if (lastMessage.player_name === 'Narrador IA' && lastMessage.type === 'narration') {
        playNarration(lastMessage.content, lastMessage.id);
      }
    }
  }, [roomMessages.length]);

  // --- Helper Functions ---

  const resetAppState = () => {
    setCharacter(null);
    setRoom(null);
    setUserCharacters([]);
    setProfile(null);
    setShowCreator(false);
    setLoading(false);
  };

  const checkProfileAndCharacters = async (currentUser: SupabaseUser) => {
    setLoading(true);
    // Fetch User Characters
    const { data: charData } = await supabase.from('characters').select('*').eq('user_id', currentUser.id);
    if (charData) {
      setUserCharacters(charData);
      if (charData.length === 0 && !room) {
        setIsTutorialMode(true);
        setActiveCampaign(CAMPAIGNS.find(c => c.id === 'tutorial_caminho_aventureiro') || null);
        setViewMode('theater');
      }
    }
    // Profile Check
    let { data: profData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (profData) {
      setProfile(profData as Profile);
      if (room) {
        fetchRoomMessages(room.id);
        fetchAllCharacters(room.id);
      }
    }
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

  const fetchUserCharacters = async (userId: string, roomId: string) => {
    setLoading(true);
    const { data } = await supabase.from('characters').select('*').eq('user_id', userId).eq('room_id', roomId).order('created_at', { ascending: false });
    if (data) setUserCharacters(data);
    setLoading(false);
  };

  const handleCreate = async (newChar: Partial<Character>) => {
    if (!user) return;
    const characterData = { ...newChar, user_id: user.id, room_id: room?.id };
    const { data, error } = await supabase.from('characters').insert([characterData]).select().single();
    if (!error && data) {
      setUserCharacters(prev => [data, ...prev]);
      setCharacter(data);
      setShowCreator(false);
    }
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
    const isCampaignStart = content.startsWith('INÍCIO DE CAMPANHA:');

    if (isCampaignStart) {
      const campaignName = content.split(':')[1].trim();
      const found = CAMPAIGNS.find(c => c.title.includes(campaignName));
      if (found && found.scenes[0]) {
        setActiveCampaign(found);
        setCurrentSceneId(found.scenes[0].id);
        setBackgroundUrl(found.scenes[0].imageUrl);
      }
    }

    if (!isCampaignStart) {
      await supabase.from('room_messages').insert({ room_id: room.id, player_name: character.name, content, type: 'action' });
      await fetchRoomMessages(room.id);
    }

    if (room.is_ai_mode) {
      const { data } = await supabase.functions.invoke('ai-master', { body: { message: content, roomId: room.id, characterContext: character } });
      if (data?.text) await fetchRoomMessages(room.id);
    }
    setIsAiThinking(false);
  };

  const playNarration = async (text: string, messageId: string) => {
    if (isMuted) return;
    setCurrentlyPlaying(messageId);
    try {
      const { data } = await supabase.functions.invoke('tts', { body: { text, style: room?.style || 'Epic' } });
      if (data) {
        const audio = new Audio(URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: 'audio/mpeg' })));
        audio.volume = 0.5;
        audio.onended = () => setCurrentlyPlaying(null);
        await audio.play();
      }
    } catch (e) {
      console.error("TTS failed:", e);
      setCurrentlyPlaying(null);
    }
  };

  const calculateModifier = (val: number) => Math.floor((val - 10) / 2);
  const handleRoll = (statName: string, dieSize: number) => {
    if (!character || !channel) return;

    // Correctly map Portuguese display names to English character keys
    const statMap: { [key: string]: keyof Character } = {
      'Força': 'strength',
      'Destreza': 'dexterity',
      'Constituição': 'constitution',
      'Constit.': 'constitution',
      'Inteligência': 'intelligence',
      'Sabedoria': 'wisdom',
      'Carisma': 'charisma'
    };

    const key = statMap[statName] || statName.toLowerCase() as keyof Character;
    const statValue = (character as any)[key] || 10;
    const modifier = calculateModifier(statValue);
    const naturalRoll = Math.floor(Math.random() * dieSize) + 1;

    setRollingDice({
      isRolling: true,
      value: naturalRoll,
      event: {
        player: character.name,
        dieType: `D${dieSize} (${statName})`,
        naturalRoll,
        modifier,
        total: naturalRoll + modifier,
        timestamp: new Date().toISOString()
      }
    });
  };

  const finalizeRoll = () => {
    if (rollingDice.event && channel) {
      channel.send({ type: 'broadcast', event: 'dice_event', payload: rollingDice.event });

      // Save to DB and Trigger AI
      const saveAndTrigger = async (event: DiceEvent) => {
        const content = `${event.player} rolou ${event.dieType}: **${event.total}**`;
        await supabase.from('room_messages').insert({ room_id: room!.id, player_name: event.player, content, type: 'dice' });
        await fetchRoomMessages(room!.id);

        // Play SFX
        // playSynthSound disabled

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
    setCurrentSceneId(scene.id);
    setBackgroundUrl(scene.imageUrl);
    channel?.send({ type: 'broadcast', event: 'background_update', payload: { url: scene.imageUrl, sceneId: scene.id } });
  };
  const handleDiscoverScene = (sceneId: string) => {
    const updated = [...new Set([...discoveredSceneIds, sceneId])];
    setDiscoveredSceneIds(updated);
    channel?.send({ type: 'broadcast', event: 'scene_discovery', payload: { discoveredIds: updated } });
  };

  // --- Render Sections ---

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-400 font-bold animate-pulse">Carregando a Taverna...</div>;

  if (!session) {
    if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} onLogin={() => setShowLanding(false)} />;
    return <Auth onAuthSuccess={() => { }} />;
  }

  if (!room) return <RoomManager user={user} onRoomSelected={setRoom} />;

  if (user?.email === 'admin@admin.com' || user?.email?.startsWith('admin') || user?.email?.startsWith('mestre')) {
    return <DMDashboard onLogout={() => supabase.auth.signOut()} channel={channel} viewMode={viewMode} backgroundUrl={backgroundUrl} diceLogs={diceLogs} />;
  }

  if (!character) {
    if (showCreator) return <div className="container mx-auto p-8 flex flex-col items-center"><CharacterCreator onCreate={handleCreate} initialClass={tutorialSelectedClass} /><button onClick={() => setShowCreator(false)} className="mt-4 underline text-slate-400">Cancelar</button></div>;
    return <CharacterSelection characters={userCharacters} onSelect={setCharacter} onCreateNew={() => setShowCreator(true)} onDelete={(id) => supabase.from('characters').delete().eq('id', id).then(() => setUserCharacters(p => p.filter(c => c.id !== id)))} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-slate-200">
      {/* Dynamic Background Image (No Video) */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 animate-ken-burns scale-105"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div className="container mx-auto p-4 lg:p-12 relative z-10">
        {(rollingDice.isRolling || rollingDice.value > 0) && (
          <Dice3D value={rollingDice.value} isRolling={rollingDice.isRolling} onAnimationEnd={finalizeRoll} material={diceStyle} />
        )}


        {viewMode === 'theater' && (
          <TheaterView
            room={room} backgroundUrl={backgroundUrl} messages={roomMessages} partyCharacters={partyCharacters} character={character} onSendMessage={handleSendMessage} isAiThinking={isAiThinking} isMuted={isMuted} onToggleMute={handleToggleMute} playNarration={playNarration} currentlyPlaying={currentlyPlaying} onClose={() => setViewMode('standard')} isNarrator={(n) => n === 'Narrador IA'} activeCampaign={activeCampaign} currentSceneId={currentSceneId} discoveredSceneIds={discoveredSceneIds} onSelectScene={handleSelectScene} onDiscoverScene={handleDiscoverScene} isMaster={!!(user?.email === 'admin@admin.com' || user?.email?.startsWith('mestre'))} onOpenDiary={() => setShowDiary(true)}
          />
        )}

        {viewMode === 'map' && <BattleMap partyCharacters={partyCharacters} channel={channel!} isAdmin={false} backgroundUrl={backgroundUrl} onBack={() => setViewMode('standard')} />}

        {viewMode === 'standard' && (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom duration-1000">
            <header className="bg-[#15234b]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 mb-10 flex flex-col lg:flex-row justify-between items-center gap-8 animate-in fade-in slide-in-from-top duration-700">
              <div className="flex items-center gap-8">
                <div className={`w-24 h-24 rounded-[2rem] bg-[#0c1527]/80 flex items-center justify-center border border-white/10 p-3 relative ${isFurious ? 'animate-fury' : ''}`}>
                  <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
                  <div className={`absolute bottom-0 right-0 text-[10px] font-black px-2 py-1 rounded-tl-xl ${showLevelUpAnim ? 'bg-amber-500 animate-bounce' : 'bg-blue-600'}`}>NV {character.level}</div>
                </div>
                <div>
                  <h1 className={`text-4xl font-black italic uppercase tracking-tighter ${showLevelUpAnim ? 'animate-level-up text-amber-400' : 'text-white'}`}>{character.name}</h1>
                  <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    <span>{character.race} {character.class_subclass}</span>
                    <button onClick={() => setIsFurious(!isFurious)} className={`px-2 py-0.5 rounded-lg border ${isFurious ? 'bg-red-600 border-red-400 text-white' : 'border-white/10'}`}>
                      {isFurious ? 'FÚRIA ATIVA' : 'ENTRAR EM FÚRIA'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex gap-1">
                  {['standard', 'theater', 'map'].map(mode => (
                    <button key={mode} onClick={() => setViewMode(mode as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowDiceCustomizer(true)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white"><Dice5 className="w-5 h-5" /></button>
                  <button onClick={handleToggleMute} className="p-3 bg-white/5 border border-white/10 rounded-2xl">{isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}</button>
                  <button onClick={() => supabase.auth.signOut()} className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl"><LogOut className="w-5 h-5" /></button>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
              {/* Main Content Area */}
              <div className="lg:col-span-9 space-y-8">

                {/* Colorful Attribute Bar */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {[
                    { label: 'FORÇA', name: 'Força', val: character.strength, colorClass: 'attr-red' },
                    { label: 'DESTREZA', name: 'Destreza', val: character.dexterity, colorClass: 'attr-teal' },
                    { label: 'CONSTIT.', name: 'Constituição', val: character.constitution, colorClass: 'attr-pink' },
                    { label: 'INTELIGÊNCIA', name: 'Inteligência', val: character.intelligence, colorClass: 'attr-blue' },
                    { label: 'SABEDORIA', name: 'Sabedoria', val: character.wisdom, colorClass: 'attr-purple' },
                    { label: 'CARISMA', name: 'Carisma', val: character.charisma, colorClass: 'attr-magenta' }
                  ].map(attr => (
                    <button
                      key={attr.label}
                      onClick={() => handleRoll(attr.name, 20)}
                      className={`h-32 rounded-3xl border-b-4 flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl ${attr.colorClass}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{attr.label}</span>
                      <span className="text-4xl font-black italic tracking-tighter">{attr.val}</span>
                      <span className="text-[11px] font-bold opacity-80 mt-1">({calculateModifier(attr.val) >= 0 ? '+' : ''}{calculateModifier(attr.val)})</span>
                    </button>
                  ))}
                </div>

                {/* Secondary Stats Support Area */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                  {/* Vitalidade (HP) */}
                  <div className="md:col-span-2 vitality-card">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em]">Vitalidade</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-black text-white italic tracking-tighter">{character.hp_current}</span>
                      <span className="text-xl font-bold text-slate-500 truncate">/ {character.hp_max} PV</span>
                    </div>
                    <div className="hp-bar-vitality">
                      <div
                        className="hp-bar-fill-vitality"
                        style={{ width: `${Math.min(100, (character.hp_current / character.hp_max) * 100)}%` }}
                      />
                    </div>
                    <div className="flex gap-2 mt-6">
                      {[-1, 1].map(v => (
                        <button key={v} onClick={() => updateHP(v)} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-400 hover:bg-white/10 transition-all uppercase">
                          {v > 0 ? '+' : ''}{v} HP
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Defense/CA */}
                  <div className="utility-card group">
                    <Shield className="w-8 h-8 text-blue-400 mb-2 transition-transform group-hover:rotate-12" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Classe de Armadura</span>
                    <span className="text-3xl font-black text-white italic tracking-tighter">{character.ac}</span>
                  </div>

                  {/* Initiative */}
                  <div className="utility-card group">
                    <Zap className="w-8 h-8 text-amber-400 mb-2 transition-transform group-hover:scale-125" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Iniciativa</span>
                    <span className="text-3xl font-black text-white italic tracking-tighter">{calculateModifier(character.dexterity) >= 0 ? '+' : ''}{calculateModifier(character.dexterity)}</span>
                  </div>

                  {/* Speed */}
                  <div className="utility-card group">
                    <Move className="w-8 h-8 text-emerald-400 mb-2 transition-transform group-hover:translate-y-[-4px]" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Deslocamento</span>
                    <span className="text-3xl font-black text-white italic tracking-tighter">9m</span>
                  </div>

                  {/* Backpack Section - Now following your request for placement below HP and AC */}
                  <div className="backpack-colorful group mt-2">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Briefcase className="w-40 h-40 text-white" />
                    </div>
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Package className="w-5 h-5 text-amber-500" /> Mochila de Aventura
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      {character.inventory && character.inventory.length > 0 ? (
                        character.inventory.map((item, idx) => (
                          <div key={idx} className="item-slot-colorful group/item">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-lg">📦</div>
                              <div>
                                <p className="text-[10px] font-black text-white uppercase">{item.name}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase">Quant: {item.quantity || 1}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="md:col-span-2 py-10 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl opacity-30">
                          <HelpCircle className="w-8 h-8 mb-2" />
                          <p className="text-[9px] font-black uppercase tracking-widest">Sua mochila está vazia...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  </div>

                {/* Stacked Sidebar Column */}
                <div className="lg:col-span-3 space-y-6">

                  {/* Adventurers List Section */}
                  <div className="sidebar-colorful">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Aventureiros
                    </h3>
                    <div className="space-y-3">
                      {partyCharacters.length === 0 ? (
                        <p className="text-[9px] text-slate-600 italic uppercase">A equipe está vazia...</p>
                      ) : (
                        partyCharacters.map(char => (
                          <div key={char.id} className="p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm">{char.icon || '👤'}</div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-white uppercase truncate">{char.name}</p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase truncate">{char.class_subclass}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Real-time Log Section */}
                  <div className="sidebar-colorful flex-1">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                      <Scroll className="w-4 h-4" /> Mesa em Tempo Real
                    </h3>
                    <div className="space-y-4 overflow-y-auto custom-scrollbar-thin flex-1 pr-1">
                      {diceLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-6">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Aguardando rolagens...</p>
                        </div>
                      ) : (
                        diceLogs.map((log, i) => (
                          <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-3xl animate-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-black text-blue-400 uppercase">{log.player}</span>
                              <span className="text-xl font-black text-white italic tracking-tighter">{log.total}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest italic">{log.dieType}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {showDiary && <CampaignDiary isOpen={showDiary} onClose={() => setShowDiary(false)} chronicle={latestChronicle} onGenerateChronicle={handleGenerateChronicle} isGenerating={isGeneratingChronicle} />}
        {selectedCompanion && <CompanionModal character={selectedCompanion} onClose={() => setSelectedCompanion(null)} />}
      </div>
    </div>
  );
};

export default App;
