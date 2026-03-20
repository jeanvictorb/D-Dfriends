import React, { useState, useEffect } from 'react';
import { Heart, User, LogOut, Package, BookOpen, Star, HelpCircle, Info, Users, Swords, Zap, Skull, Shield as ShieldIcon, Flame, Droplets, Wind, Ghost, Shield, PackagePlus, Loader2, CheckCircle, Trash2, Mic, Volume2, Sparkles, Plus, Dice5, ChevronRight } from 'lucide-react';
import { Character, DiceEvent, Profile, CombatItem } from './types/index';
import CharacterCreator from './components/CharacterCreator';
import CharacterSelection from './components/CharacterSelection';
import Auth from './components/Auth';
import DMDashboard from './components/DMDashboard';
import Dice3D from './components/Dice3D';
import ClassCompendium from './components/ClassCompendium';
import SkillTree from './components/SkillTree';
import CompanionModal from './components/CompanionModal';
import TheaterView from './components/TheaterView';
import BattleMap from './components/BattleMap';
import { classData, ClassData } from './data/classData';
import { supabase } from './lib/supabase';
import { getClassIcon } from './lib/classIcons';
import { playSynthSound } from './lib/SoundSynth';
import { User as SupabaseUser, Session, RealtimeChannel } from '@supabase/supabase-js';

const EDGE_FUNCTION_URL = 'https://kgxvjeqjcyphlkuszmoi.supabase.co/functions/v1/tts';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [character, setCharacter] = useState<Character | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [partyCharacters, setPartyCharacters] = useState<Character[]>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<Character | null>(null);
  const [combatOrder, setCombatOrder] = useState<CombatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [diceLogs, setDiceLogs] = useState<DiceEvent[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [showCompendium, setShowCompendium] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'theater' | 'map'>('standard');
  const [backgroundUrl, setBackgroundUrl] = useState('/images/scenes/taverna.png');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        checkProfileAndCharacters(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        checkProfileAndCharacters(session.user);
      } else {
        setCharacter(null);
        setUserCharacters([]);
        setProfile(null);
        setShowCreator(false);
      }
    });

    // Initialize Supabase Realtime Channel
    const mesaChannel = supabase.channel('mesa_default', {
      config: { broadcast: { self: true } }
    });

    mesaChannel
      .on('broadcast', { event: 'dice_event' }, ({ payload }: { payload: DiceEvent }) => {
        setDiceLogs((prev: DiceEvent[]) => [payload, ...prev.slice(0, 49)]);
      })
      .on('broadcast', { event: 'hp_sync' }, ({ payload }: { payload: { charId: number, hp_current: number } }) => {
        setCharacter((prev: Character | null) => {
          if (prev && prev.id === payload.charId) {
            return { ...prev, hp_current: payload.hp_current };
          }
          return prev;
        });
      })
      .on('broadcast', { event: 'tts_event' }, ({ payload }: { payload: { text: string } }) => {
        console.log('[TTS] Event received:', payload.text);
        if (payload.text) playText(payload.text);
      })
      .on('broadcast', { event: 'sound_event' }, ({ payload }: { payload: { url: string } }) => {
        console.log('[SOUND] Received sound event:', payload.url);
        
        if (payload.url.startsWith('synth:')) {
          const type = payload.url.replace('synth:', '');
          playSynthSound(type);
          return;
        }

        const audio = new Audio(payload.url);
        audio.play().then(() => {
          console.log('[SOUND] Audio playing successfully');
        }).catch((e: Error) => {
          console.error("[SOUND] Play failed:", e);
          if (e.name === 'NotAllowedError') {
            console.warn('[SOUND] Browser blocked autoplay. User must interact with page first.');
          }
        });
      })
      .on('broadcast', { event: 'combat_update' }, ({ payload }: { payload: any[] }) => {
        setCombatOrder(payload);
      })
      .on('broadcast', { event: 'view_update' }, ({ payload }: { payload: { mode: 'standard' | 'theater' | 'map' } }) => {
        setViewMode(payload.mode);
      })
      .on('broadcast', { event: 'background_update' }, ({ payload }: { payload: { url: string } }) => {
        setBackgroundUrl(payload.url);
      })
      .subscribe((status: string) => {
        console.log('[REALTIME] Mesa channel status:', status);
      });

    setChannel(mesaChannel);

    const playText = async (textToPlay: string) => {
      // Split into chunks of max 200 chars
      const chunks: string[] = [];
      let remaining = textToPlay;
      while (remaining.length > 0) {
        let cutAt = Math.min(200, remaining.length);
        if (cutAt < remaining.length) {
          const lastSpace = remaining.lastIndexOf(' ', cutAt);
          if (lastSpace > 80) cutAt = lastSpace;
        }
        chunks.push(remaining.slice(0, cutAt).trim());
        remaining = remaining.slice(cutAt).trim();
      }

      for (const chunk of chunks) {
        const encoded = encodeURIComponent(chunk);
        try {
          // Fetch via Supabase Edge Function -> Google Translate TTS
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          
          const res = await fetch(`${EDGE_FUNCTION_URL}?text=${encoded}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          const blob = new Blob([buf], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          await new Promise<void>((resolve) => {
            const audio = new Audio(url);
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            audio.play().catch(() => resolve());
          });
        } catch (err) {
          console.error('[TTS] Edge Function failed, falling back to Web Speech:', err);
          if ('speechSynthesis' in window) {
            await new Promise<void>((resolve) => {
              window.speechSynthesis.cancel();
              const utt = new SpeechSynthesisUtterance(chunk);
              utt.lang = 'pt-BR';
              utt.onend = () => resolve();
              utt.onerror = () => resolve();
              window.speechSynthesis.speak(utt);
            });
          }
        }
      }
    };

    return () => {
      mesaChannel.unsubscribe();
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Realtime subscription for Profile updates (so the waiting room updates instantly)
    const profileSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: { new: Profile }) => {
        if (payload.new.id === user.id) {
          setProfile(payload.new as Profile);
        }
      })
      .subscribe();

    // Listen for ALL character updates for the party dashboard
    const partySubscription = supabase
      .channel('public:characters_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, () => {
        fetchAllCharacters();
      })
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      partySubscription.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!character) return;

    // Listen for realtime updates to the current character (e.g. DM changing HP/Items)
    const charSubscription = supabase
      .channel(`character_update_${character.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'characters',
        filter: `id=eq.${character.id}`
      }, (payload: { new: Character }) => {
        setCharacter(payload.new as Character);
        // Also update the character in the userCharacters array
        setUserCharacters((prev: Character[]) => prev.map((c: Character) => c.id === payload.new.id ? payload.new as Character : c));
      })
      .subscribe();

    return () => {
      charSubscription.unsubscribe();
    };
  }, [character?.id]);

  const checkProfileAndCharacters = async (currentUser: SupabaseUser) => {
    setLoading(true);

    // 1. Fetch or create Profile
    let { data: profData, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (profError && profError.code === 'PGRST116') {
      // Profile doesn't exist yet, wait for trigger or create it manually to be safe
      const newProf = {
        id: currentUser.id,
        username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'Desconhecido',
        status: 'pending'
      };

      const { data: insertedProf, error: insertErr } = await supabase
        .from('profiles')
        .insert([newProf])
        .select()
        .single();

      if (!insertErr && insertedProf) {
        profData = insertedProf;
      }
    }

    if (profData) {
      setProfile(profData as Profile);
      // Only fetch characters if they are approved or admin
      if (profData.status === 'approved' || currentUser.email?.startsWith('admin') || currentUser.email?.startsWith('mestre')) {
        await fetchUserCharacters(currentUser.id);
        await fetchAllCharacters();
      } else {
        setLoading(false); // Stop loading, show waiting room
      }
    } else {
      setLoading(false);
    }
  };

  const fetchAllCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        setPartyCharacters(data);
      }
    } catch (err) {
      console.error("Erro ao buscar aventureiros:", err);
    }
  };

  const fetchUserCharacters = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserCharacters(data);
      }
    } catch (err) {
      console.error("Erro ao buscar personagens:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (newChar: Partial<Character>) => {
    if (!user) return;

    // Final sanity check before creation
    if (userCharacters.length >= 2) {
      alert("Você atingiu o limite máximo de 2 personagens.");
      return;
    }

    const characterData = {
      ...newChar,
      user_id: user.id
    };

    const { data, error } = await supabase.from('characters').insert([characterData]).select().single();
    if (!error && data) {
      setUserCharacters(prev => [data, ...prev]);
      setCharacter(data);
      setShowCreator(false);
    } else {
      console.error("Erro ao criar personagem:", error);
      alert("Erro ao criar personagem. Tente novamente.");
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja apagar este personagem permanentemente?")) return;
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (!error) {
      setUserCharacters(prev => prev.filter(c => c.id !== id));
      if (character?.id === id) setCharacter(null);
    } else {
      alert("Erro ao apagar personagem.");
    }
  };

  const [rollingDice, setRollingDice] = useState<{ isRolling: boolean, value: number, event: DiceEvent | null }>({ isRolling: false, value: 0, event: null });

  const calculateModifier = (val: number) => Math.floor((val - 10) / 2);
  const calculateProficiency = (level: number) => Math.floor((level - 1) / 4) + 2;

  const getThemeClass = (classSubclass: string) => {
    const c = classSubclass.toLowerCase();
    if (c.includes('mago') || c.includes('feiticeiro') || c.includes('bruxo')) return 'theme-arcane';
    if (c.includes('guerreiro') || c.includes('bárbaro') || c.includes('monge')) return 'theme-martial';
    if (c.includes('druida') || c.includes('patrulheiro')) return 'theme-nature';
    if (c.includes('clérigo') || c.includes('paladino')) return 'theme-divine';
    if (c.includes('ladino')) return 'theme-stealth';
    return '';
  };

  const handleRoll = (attrName: string, value: number) => {
    if (!character || !channel) return;

    const modifier = calculateModifier(value);
    const naturalRoll = Math.floor(Math.random() * 20) + 1;
    const total = naturalRoll + modifier;

    const rollEvent: DiceEvent = {
      player: character.name,
      dieType: 'd20',
      naturalRoll,
      modifier,
      total,
      timestamp: new Date().toISOString()
    };

    // Store the event and start rolling animation
    setRollingDice({ isRolling: true, value: naturalRoll, event: rollEvent });
  };

  const handleDiceRoll = (dieType: string, dieSize: number) => {
    if (!character || !channel) return;
    const naturalRoll = Math.floor(Math.random() * dieSize) + 1;
    const rollEvent: DiceEvent = {
      player: character.name,
      dieType,
      naturalRoll,
      modifier: 0,
      total: naturalRoll,
      timestamp: new Date().toISOString()
    };
    setRollingDice({ isRolling: true, value: naturalRoll, event: rollEvent });
  };

  const finalizeRoll = () => {
    if (rollingDice.event && channel) {
      channel.send({
        type: 'broadcast',
        event: 'dice_event',
        payload: rollingDice.event
      });

      // Fallback: Add to local logs immediately in case backend is unreliable or just for instant feedback
      setDiceLogs(prev => [rollingDice.event!, ...prev.slice(0, 49)]);
    }
    // Mostra o resultado por 1,5 segundos depois que "para" de rolar, então fecha o modal
    setTimeout(() => {
      setRollingDice({ isRolling: false, value: 0, event: null });
    }, 1500);
  };

  const updateHP = async (amount: number) => {
    if (!character) return;
    const newHP = Math.max(0, Math.min(character.hp_max, character.hp_current + amount));

    const { error } = await supabase
      .from('characters')
      .update({ hp_current: newHP })
      .eq('id', character.id);

    if (error) console.error("Erro ao atualizar HP:", error);

    setCharacter({ ...character, hp_current: newHP });
    channel?.send({
      type: 'broadcast',
      event: 'hp_sync',
      payload: { charId: character.id, hp_current: newHP }
    });
  };

  // Helper to find class data
  const currentCharClassData = character ? classData.find(c => character.class_subclass.includes(c.name)) : null;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-400 font-bold text-xl animate-pulse">Carregando a Taverna...</div>;

  if (!session) {
    return <Auth onAuthSuccess={() => { }} />;
  }

  // DM Dashboard Routing
  if (user?.email === 'admin@admin.com' || user?.email?.startsWith('mestre') || user?.email?.startsWith('admin')) {
    return (
      <DMDashboard 
        onLogout={() => supabase.auth.signOut()} 
        channel={channel} 
        viewMode={viewMode}
        backgroundUrl={backgroundUrl}
        diceLogs={diceLogs}
      />
    );
  }

  // Waiting Room Logic
  if (profile && profile.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="panel max-w-md w-full space-y-6 p-10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl"></div>
          <div className="mx-auto w-16 h-16 bg-[#15234b]/80 border border-[#2a4387]/50 rounded-2xl flex items-center justify-center mb-6 shadow-lg z-10 relative">
            <User className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white z-10 relative">Sala de Espera</h2>
          <p className="text-slate-400 font-medium z-10 relative">
            Bem-vindo à Taverna, <strong className="text-blue-400">{profile.username}</strong>!<br /><br />
            Aguarde enquanto o Mestre aprova sua entrada na mesa.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-6 w-full py-3 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-xl transition-colors font-bold z-10 relative"
          >
            Sair da Fila
          </button>
        </div>
      </div>
    );
  }

  if (!character) {
    if (showCreator) {
      return (
        <>
          <div className="container mx-auto p-4 lg:p-8 flex flex-col items-center justify-center min-h-screen">
            <CharacterCreator onCreate={handleCreate} />
            <button
              onClick={() => setShowCreator(false)}
              className="mt-6 text-slate-400 hover:text-white font-bold transition-colors underline"
            >
              Cancelar Criação
            </button>
          </div>

          {/* Universal Floating Compendium Button */}
          <button
            onClick={() => setShowCompendium(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-500 transition-all hover:scale-110 z-40 group"
            title="Abrir Compêndio de Classes"
          >
            <BookOpen className="w-6 h-6" />
            <span className="absolute right-16 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Compêndio de Classes
            </span>
          </button>

          {showCompendium && <ClassCompendium onClose={() => setShowCompendium(false)} />}
        </>
      );
    }

    return (
      <>
        <CharacterSelection
          characters={userCharacters}
          onSelect={(char) => setCharacter(char)}
          onCreateNew={() => setShowCreator(true)}
          onDelete={handleDeleteCharacter}
        />

        {/* Universal Floating Compendium Button for Selection/Creator screens */}
        <button
          onClick={() => setShowCompendium(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-500 transition-all hover:scale-110 z-40 group"
          title="Abrir Compêndio de Classes"
        >
          <BookOpen className="w-6 h-6" />
          <span className="absolute right-16 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Compêndio de Classes
          </span>
        </button>

        {showCompendium && <ClassCompendium onClose={() => setShowCompendium(false)} />}
      </>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-6xl min-h-screen relative">
      {(rollingDice.isRolling || rollingDice.value > 0) && (
        <Dice3D
          value={rollingDice.value}
          isRolling={rollingDice.isRolling}
          onAnimationEnd={finalizeRoll}
        />
      )}
      {/* Header */}
      <header className="panel mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{character.name}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span>{character.class_subclass} • Nível {character.level}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCompendium(true)}
            className="flex items-center gap-2 px-4 py-2 interactive-btn text-amber-400 hover:text-white hover:bg-amber-600/50 border-amber-500/30 text-sm font-bold"
          >
            <BookOpen className="w-4 h-4" />
            Compêndio
          </button>
          <div className="text-right flex flex-col items-end border-r border-[#2a4387]/30 pr-6 hidden sm:flex group relative">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-bold text-slate-300 uppercase">Bônus de Proficiência</span>
              <HelpCircle className="w-3 h-3 text-slate-500" />
            </div>
            <span className="text-2xl font-bold text-white">+{calculateProficiency(character.level)}</span>
            
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl">
              Um bônus que você soma em testes de perícias, resistências e ataques com os quais seu personagem tem treinamento. Começa em +2 e aumenta com o nível.
            </div>
          </div>
          <div className="text-right flex flex-col items-end border-r border-[#2a4387]/30 pr-6 hidden sm:flex group relative">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-bold text-slate-300 uppercase">HP Atual</span>
              <HelpCircle className="w-3 h-3 text-slate-500" />
            </div>
            <p className="text-3xl font-black text-white">{character.hp_current} / {character.hp_max}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {character.conditions?.map(cond => (
                <div key={cond} className="px-1.5 py-0.5 rounded bg-red-900/40 border border-red-500/30 text-[9px] font-black text-red-300 uppercase flex items-center gap-1 group relative">
                  {cond === 'Envenenado' && <Skull className="w-2.5 h-2.5" />}
                  {cond === 'Atordoado' && <Zap className="w-2.5 h-2.5" />}
                  {cond === 'Caído' && <Swords className="w-2.5 h-2.5" />}
                  {cond === 'Queimando' && <Flame className="w-2.5 h-2.5" />}
                  {cond === 'Sangrando' && <Droplets className="w-2.5 h-2.5" />}
                  {cond}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Condição: {cond}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setCharacter(null)}
            title="Voltar para seleção"
            className="flex items-center gap-2 px-4 py-2 interactive-btn text-blue-300 hover:text-white hover:bg-blue-600/50 border-blue-500/30 text-sm font-bold"
          >
            Sair da Ficha
          </button>
        </div>
      </header>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Combat Tracker (Initiative) Overlay */}
        {combatOrder.length > 0 && (
          <div className="panel bg-[#0c1527]/90 border-blue-500/50 backdrop-blur-md mb-8 animate-in slide-in-from-top duration-500">
            <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Swords className="w-4 h-4" /> Ordem de Combate
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {combatOrder.map((item, idx) => {
                const isCurrent = item.isTurn;
                const isMyTurn = item.charId === character?.id && isCurrent;
                
                return (
                  <div 
                    key={idx} 
                    className={`min-w-[120px] p-3 rounded-xl border transition-all ${isCurrent ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30' : 'bg-slate-900/50 border-slate-700/50'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-black ${isCurrent ? 'text-blue-300' : 'text-slate-500'}`}>#{idx + 1}</span>
                      <span className="text-[10px] font-bold text-white bg-slate-800 px-1 rounded">{item.initiative}</span>
                    </div>
                    <p className={`text-sm font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-400'}`}>{item.name}</p>
                    {isMyTurn && (
                      <div className="mt-2 text-[9px] font-black text-blue-400 animate-pulse uppercase tracking-widest text-center italic">Seu Turno!</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic View Content */}
        {viewMode === 'theater' && (
          <TheaterView 
            backgroundUrl={backgroundUrl} 
            diceLogs={diceLogs} 
            partyCharacters={partyCharacters}
            currentCharacter={character}
          />
        )}

        {viewMode === 'map' && (
          <BattleMap 
            partyCharacters={partyCharacters} 
            channel={channel} 
            isAdmin={false}
            backgroundUrl={backgroundUrl}
            onBack={() => setViewMode('standard')}
          />
        )}

        {viewMode === 'standard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <main className="lg:col-span-3 space-y-6">
              {/* Health Section */}
              <section className="panel">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex items-center gap-3">
                    <Heart className="text-rose-500 w-5 h-5" />
                    <h2 className="text-lg font-bold text-white">Pontos de Vida</h2>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {character.hp_current} <span className="text-slate-400 text-xl font-normal">/ {character.hp_max}</span>
                  </p>
                </div>

                <div className="w-full h-3 bg-[#0c1527] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(character.hp_current / character.hp_max) * 100}%` }}
                  ></div>
                </div>
              </section>

              {/* Dice Tray */}
              <section className="panel bg-[#0c1527]/40 border-blue-500/20">
                <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Dice5 className="w-4 h-4" /> Bandeja de Dados (Danos e Testes)
                </h2>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'd4', size: 4, desc: 'Danos pequenos (Adagas, Clavas) e feitiços como Bênção.' },
                    { label: 'd6', size: 6, desc: 'Armas comuns (Espadas Curtas, Arcos) e a clássica Bola de Fogo.' },
                    { label: 'd8', size: 8, desc: 'Armas marciais (Espadas Longas, Rapiárias) e Curar Ferimentos.' },
                    { label: 'd10', size: 10, desc: 'Armas pesadas ou habilidades de classe como Rajada Mística.' },
                    { label: 'd12', size: 12, desc: 'Machados de Batalha enormes e a Fúria do Bárbaro.' },
                    { label: 'd20', size: 20, desc: 'O dado principal! Usado para Ataques, Testes e Resistências.' },
                    { label: 'd100', size: 100, desc: 'Usado para tabelas de sorte raras e Intervenção Divina.' },
                  ].map((die) => (
                    <button
                      key={die.label}
                      onClick={() => handleDiceRoll(die.label, die.size)}
                      className="flex-1 min-w-[80px] group relative bg-[#15234b] border border-[#2a4387]/50 rounded-xl p-3 hover:border-blue-500 hover:bg-blue-600/20 transition-all active:scale-95"
                    >
                      <span className="text-lg font-black text-white group-hover:text-blue-200">{die.label}</span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl">
                        {die.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'FORÇA', val: character.strength, desc: 'Poder físico, atletismo e dano corpo-a-corpo.' },
                  { label: 'DESTREZA', val: character.dexterity, desc: 'Agilidade, reflexos, equilíbrio e precisão.' },
                  { label: 'CONSTITUIÇÃO', val: character.constitution, desc: 'Saúde, vigor e resistência vital.' },
                  { label: 'INTELIGÊNCIA', val: character.intelligence, desc: 'Raciocínio lógico, memória e saber arcano.' },
                  { label: 'SABEDORIA', val: character.wisdom, desc: 'Percepção, intuição e conexão com o mundo.' },
                  { label: 'CARISMA', val: character.charisma, desc: 'Personalidade, persuasão e liderança.' },
                ].map((attr) => (
                  <button
                    key={attr.label}
                    onClick={() => handleRoll(attr.label, attr.val)}
                    className="panel hover:bg-[#1e3470] cursor-pointer flex flex-col items-center justify-center py-6 px-4 transition-all group relative overflow-visible"
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs font-bold text-slate-400 group-hover:text-blue-300 transition-colors">{attr.label}</span>
                      <HelpCircle className="w-3 h-3 text-slate-600 opacity-50" />
                    </div>
                    <span className="text-3xl font-bold text-white mb-2">{attr.val}</span>
                    <div className="text-sm font-medium text-blue-300">
                      ({calculateModifier(attr.val) >= 0 ? '+' : ''}{calculateModifier(attr.val)})
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl text-center">
                      <p className="mb-2 text-white font-bold">{attr.desc}</p>
                      <div className="pt-2 border-t border-slate-700/50 text-[10px] italic">
                        Cálculo: (Valor - 10) / 2 <br/>
                        Ex: 16 vira +3, 8 vira -1.
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Inventory / Backpack */}
              <section className="panel">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Sua Mochila
                </h2>
                <div className="bg-[#0c1527] rounded-xl border border-[#2a4387]/50 p-4 min-h-[120px]">
                  {character.inventory && character.inventory.length > 0 ? (
                    <ul className="space-y-3">
                      {character.inventory.map(item => (
                        <li key={item.id} className="flex justify-between items-center border-b border-[#2a4387]/30 pb-2 last:border-0 last:pb-0">
                          <div>
                            <span className="font-bold text-blue-300">{item.name} <span className="text-slate-500 text-xs ml-1">x{item.quantity}</span></span>
                            {item.description && <p className="text-xs text-slate-400 mt-1">{item.description}</p>}
                          </div>
                          <span className="text-xs font-bold px-2 py-1 bg-blue-900/40 text-blue-400 rounded border border-blue-500/20 capitalize">{item.type}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 py-6">
                      <Package className="w-8 h-8 opacity-30 mb-2" />
                      <span className="text-sm font-medium">Sua mochila está vazia...</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Skill Tree */}
              {currentCharClassData && (
                <section className="panel overflow-hidden relative group">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-blue-400" />
                        Suas Habilidades de {currentCharClassData.name}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1 max-w-xl">
                        Esta é a sua progressão de classe. Conforme você sobe de nível, desbloqueia novas capacidades marciais e mágicas únicas.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-500/20 rounded-lg">
                      <Info className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-300">Nível {character.level}</span>
                    </div>
                  </div>
                  <div className="bg-[#0c1527]/50 rounded-2xl border border-[#2a4387]/30">
                    <SkillTree 
                      abilities={currentCharClassData.abilities} 
                      color={currentCharClassData.color} 
                    />
                  </div>
                </section>
              )}
            </main>

            <aside className="space-y-6">
              {/* Party Dashboard */}
              <div className="panel flex flex-col overflow-hidden">
                <h2 className="text-sm font-black text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Companheiros
                </h2>
                
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {partyCharacters.filter((c: Character) => c.id !== character.id).map((comp: Character) => {
                    const ic = getClassIcon(comp.class_subclass);
                    const hpPerc = (comp.hp_current / comp.hp_max) * 100;
                    
                    return (
                      <button 
                        key={comp.id}
                        onClick={() => setSelectedCompanion(comp)}
                        className="w-full bg-[#0c1527] border border-[#2a4387]/30 hover:border-blue-500/50 rounded-xl p-3 px-4 flex items-center gap-4 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                             style={{ backgroundColor: ic.color + '15', border: `1px solid ${ic.color}33` }}>
                          {ic.emoji}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">{comp.name}</span>
                            <span className="text-[10px] font-black text-slate-500">NV {comp.level}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-rose-600 to-red-500" style={{ width: `${hpPerc}%` }}></div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {partyCharacters.filter((c: Character) => c.id !== character.id).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4 italic">Sozinho na taverna por enquanto...</p>
                  )}
                </div>
              </div>

              {/* mesa log */}
              <div className="panel h-full min-h-[400px] flex flex-col">
                <h2 className="text-sm font-black text-white mb-6 uppercase tracking-[0.2em]">
                  Log da Mesa
                </h2>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {diceLogs.map((log: DiceEvent, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm mb-2 pb-2 border-b border-[#2a4387]/30">
                      <div>
                        <span className="font-medium text-blue-200 block">{log.player}</span>
                        <span className="text-slate-400 text-xs">d20 {log.modifier >= 0 ? '+' : ''}{log.modifier}</span>
                      </div>
                      <span className={`text-xl font-bold ${log.naturalRoll === 20 ? 'text-blue-400' : 'text-white'}`}>
                        {log.total}
                      </span>
                    </div>
                  ))}
                  {diceLogs.length === 0 && (
                    <p className="text-sm text-slate-400">Nenhuma rolagem ainda...</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
      {showCompendium && <ClassCompendium onClose={() => setShowCompendium(false)} />}
      {selectedCompanion && (
        <CompanionModal 
          character={selectedCompanion} 
          onClose={() => setSelectedCompanion(null)} 
        />
      )}
    </div>
  );
};

export default App;
