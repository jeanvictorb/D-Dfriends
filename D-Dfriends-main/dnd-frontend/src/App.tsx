import React, { useState, useEffect, useRef } from 'react';
import { Heart, User, LogOut, Package, BookOpen, Star, HelpCircle, Info, Users, Swords, Zap, Skull, Shield as ShieldIcon, Flame, Droplets, Wind, Ghost, Shield, PackagePlus, Loader2, CheckCircle, Trash2, Mic, Volume2, VolumeX, Sparkles, Plus, Dice5, ChevronRight } from 'lucide-react';
import { Character, DiceEvent, Profile, CombatItem, Room, RoomMessage } from './types';
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
import RoomManager from './components/RoomManager';

// Constantes removidas pois a lógica foi consolidada

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const [character, setCharacter] = useState<Character | null>(null);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
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
  const [isMuted, setIsMuted] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedMessagesRef = useRef<Set<string>>(new Set());

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
        setRoom(null);
        setUserCharacters([]);
        setProfile(null);
        setShowCreator(false);
      }
    });

    // Initialize Supabase Realtime Channel
    const channelName = room ? `mesa_${room.code}` : 'mesa_default';
    const mesaChannel = supabase.channel(channelName, {
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
      .on('broadcast', { event: 'sound_event' }, ({ payload }: { payload: { url: string } }) => {
        console.log('[SOUND] Received sound event:', payload.url);
        if (payload.url.startsWith('synth:')) {
          const type = payload.url.replace('synth:', '');
          playSynthSound(type);
          return;
        }
        const audio = new Audio(payload.url);
        audio.play().catch(e => console.error("[SOUND] Play failed:", e));
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
      .subscribe();

    setChannel(mesaChannel);

    return () => {
      mesaChannel.unsubscribe();
      subscription.unsubscribe();
    };
  }, [room?.code]);

  const playNarration = async (text: string, messageId: string) => {
    if (isMuted) return;
    try {
      console.log(`[TTS] Iniciando narração para: "${text.substring(0, 30)}..." (ID: ${messageId})`);
      setCurrentlyPlaying(messageId);
      
      const { data, error } = await supabase.functions.invoke('tts', {
        body: { text, style: room?.style || 'default' }
      });

      if (error) {
        console.error('[TTS] Erro na Edge Function:', error);
        throw error;
      }

      if (!data) {
        console.error('[TTS] Resposta vazia da Edge Function');
        throw new Error('Falha ao obter áudio: Dados vazios');
      }

      // Check if data is actually a Blob or ArrayBuffer
      console.log('[TTS] Audio recebido. Tipo do dado:', typeof data, data instanceof Blob ? 'is Blob' : 'is NOT Blob');

      // Se o data for um objeto com erro (caso de falha silenciosa vinda da func)
      if (typeof data === 'object' && !(data instanceof Blob) && (data as any).error) {
        throw new Error(`Erro retornado pela função: ${(data as any).error}`);
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      let audioUrl: string;
      if (data instanceof Blob) {
        audioUrl = URL.createObjectURL(data);
      } else {
        // Fallback for cases where it might be returned differently
        const blob = new Blob([data], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(blob);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => { 
        console.log('[TTS] Reprodução finalizada');
        setCurrentlyPlaying(null); 
        URL.revokeObjectURL(audioUrl); 
      };

      audio.onerror = (e) => {
        console.error('[TTS] Erro no elemento de áudio:', e);
        setCurrentlyPlaying(null);
      };

      await audio.play().catch(e => {
        console.warn('[TTS] Autoplay bloqueado ou erro de reprodução:', e);
        // Tentar interatividade: se o browser bloqueou, o usuário pode clicar no botão manual
      });

    } catch (err) {
      console.error('[TTS] Falha crítica ao reproduzir narração:', err);
      setCurrentlyPlaying(null);
    }
  };

  // Auto-play new narrations
  useEffect(() => {
    if (roomMessages.length > 0) {
      const lastMessage = roomMessages[roomMessages.length - 1];
      const isNarrator = (name: string) => name === 'Narrador IA' || name === 'Narrador';
      if (
        lastMessage.type === 'narration' && 
        isNarrator(lastMessage.player_name) &&
        !playedMessagesRef.current.has(lastMessage.id)
      ) {
        playedMessagesRef.current.add(lastMessage.id);
        playNarration(lastMessage.content, lastMessage.id);
      }
    }
  }, [roomMessages.length, isMuted, room?.style]);

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
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'characters',
        filter: room ? `room_id=eq.${room.id}` : undefined 
      }, () => {
        if (room) fetchAllCharacters(room.id);
      })
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      partySubscription.unsubscribe();
    };
  }, [user?.id, room?.id]);

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
        status: 'approved'
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
      // Auto-approve and fetch if room exists
      if (room) {
        await fetchUserCharacters(currentUser.id, room.id);
        await fetchAllCharacters(room.id);
        await fetchRoomMessages(room.id);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const fetchAllCharacters = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('room_id', roomId)
        .order('name', { ascending: true });

      if (!error && data) {
        setPartyCharacters(data);
      }
    } catch (err) {
      console.error("Erro ao buscar aventureiros:", err);
    }
  };

  const fetchUserCharacters = async (userId: string, roomId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .eq('room_id', roomId)
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

  const fetchRoomMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    
    if (data) setRoomMessages(data);
  };

  const handleTTS = async (text: string, style: string = 'Epic') => {
    // Redireciona para o playNarration reativo via Ref ou simplesmente aguarda o watch do roomMessages
    console.log("[TTS] Aguardando reprodução reativa...");
  };

  const handleSendMessage = async (content: string) => {
    if (!room || !character) return;
    
    setIsAiThinking(true);
    
    const isCampaignStart = content.startsWith('INÍCIO DE CAMPANHA:');

    // 1. Insert player message ONLY for real player actions (not campaign start system triggers)
    if (!isCampaignStart) {
      const { error } = await supabase.from('room_messages').insert({
        room_id: room.id,
        player_name: character.name,
        content,
        type: 'action'
      });

      if (error) {
        console.error("Erro ao enviar mensagem:", error);
        setIsAiThinking(false);
        return;
      }

      // Refresh locally so the player sees their own message
      await fetchRoomMessages(room.id);
    }

    // 2. Call AI Master if in AI mode
    if (room.is_ai_mode) {
      try {
        console.log('[AI] Invoking ai-master with message:', content.slice(0, 80));
        
        const { data: aiRes, error: aiErr } = await supabase.functions.invoke('ai-master', {
          body: { 
            message: content, 
            roomId: room.id,
            characterContext: character
          }
        });

        console.log('[AI] Response:', aiRes, 'Error:', aiErr);

        if (aiErr) {
          console.error("AI Master error:", aiErr);
          // Friendly local feedback could be added here if needed, 
          // but we avoid DB pollution.
        } else if (aiRes?.text) {
          // O áudio será tocado automaticamente pelo useEffect que observa roomMessages
          await fetchRoomMessages(room.id);
        } else if (aiRes?.error) {
          console.error("AI returned error:", aiRes.error);
        }
      } catch (err) {
        console.error("AI Master invoke failed:", err);
      }
    }
    
    setIsAiThinking(false);
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
      user_id: user.id,
      room_id: room?.id
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

      // PERSISTENCE: Save roll to room_messages and trigger AI
      const saveRollAndTriggerAi = async (event: DiceEvent) => {
        if (!room || !character) return;
        
        const content = `${event.player} rolou ${event.dieType}: **${event.total}** (${event.naturalRoll}${event.modifier >= 0 ? ' + ' : ' - '}${Math.abs(event.modifier)})`;
        
        const { error } = await supabase.from('room_messages').insert({
          room_id: room.id,
          player_name: event.player,
          content,
          type: 'dice'
        });

        if (!error && room.is_ai_mode) {
          setIsAiThinking(true);
          try {
            const { data: aiRes, error: aiErr } = await supabase.functions.invoke('ai-master', {
              body: { 
                message: `ROLAGEM: ${content}`, 
                roomId: room.id,
                characterContext: character
              }
            });

            if (!aiErr && aiRes?.text) {
              // O áudio será tocado automaticamente pelo useEffect que observa roomMessages
              await fetchRoomMessages(room.id);
            }
          } catch (err) {
            console.error("AI Master invoke failed after roll:", err);
          } finally {
            setIsAiThinking(false);
          }
        }
      };

      saveRollAndTriggerAi(rollingDice.event);
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

  if (!room) {
    return <RoomManager user={user} onRoomSelected={(r) => setRoom(r)} />;
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

      {/* Header - Only visible in Standard mode */}
      {viewMode === 'standard' && (
        <header className="panel mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl font-black border border-white/10 shadow-2xl overflow-hidden">
                {character.image_url ? (
                  <img src={character.image_url} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white drop-shadow-lg">{character.name[0]}</span>
                )}
                <div className="absolute bottom-0 right-0 bg-blue-600 text-[10px] font-black px-1.5 py-0.5 rounded-tl-lg border-t border-l border-white/20">
                  Lvl {character.level}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">{character.name}</h1>
                <div className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  Ativo
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                  <span className="text-blue-500">◈</span> {character.race} {character.class_subclass}
                </p>
                {room?.code && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(room.code); alert(`Código "${room.code}" copiado!`); }}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-600/20 border border-indigo-500/40 rounded-full text-[10px] font-black text-indigo-300 hover:bg-indigo-600/40 hover:text-white transition-all group"
                  >
                    <Users className="w-3 h-3" />
                    <span className="tracking-widest uppercase">{room.code}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Switcher for Players */}
            <div className="flex bg-[#0c1527] p-1 rounded-xl border border-blue-500/20 mr-2">
              <button
                onClick={() => setViewMode('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'standard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                FICHA
              </button>
              <button
                onClick={() => setViewMode('theater')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${(viewMode as string) === 'theater' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                TEATRO
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${(viewMode as string) === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                MAPA
              </button>
            </div>

            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (isMuted && audioRef.current === null) {
                  const unlock = new Audio();
                  unlock.play().catch(() => {});
                }
              }}
              title={isMuted ? "Ativar som" : "Mutar narração"}
              className={`p-2 rounded-xl border transition-all ${isMuted ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-green-900/20 border-green-500/30 text-green-400'}`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowCompendium(true)}
              className="flex items-center gap-2 px-4 py-2 interactive-btn text-amber-400 hover:text-white hover:bg-amber-600/50 border-amber-500/30 text-sm font-bold"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Compêndio</span>
            </button>

            <div className="text-right flex flex-col items-end border-r border-[#2a4387]/30 pr-6 hidden sm:flex group relative">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-bold text-slate-300 uppercase">HP</span>
              </div>
              <p className="text-2xl font-black text-white">{character.hp_current} / {character.hp_max}</p>
            </div>

            <button
              onClick={() => setCharacter(null)}
              className="flex items-center gap-2 px-4 py-2 interactive-btn text-blue-300 hover:text-white hover:bg-blue-600/50 border-blue-500/30 text-sm font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </header>
      )}


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
            room={room}
            backgroundUrl={backgroundUrl} 
            messages={roomMessages}
            partyCharacters={partyCharacters}
            currentCharacter={character}
            onSendMessage={handleSendMessage}
            isAiThinking={isAiThinking}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            playNarration={playNarration}
            currentlyPlaying={currentlyPlaying}
            onClose={() => setViewMode('standard')}
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
