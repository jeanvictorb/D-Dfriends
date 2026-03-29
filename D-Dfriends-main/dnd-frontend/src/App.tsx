import React, { useState, useEffect, useRef } from 'react';
import { Heart, User, LogOut, Package, BookOpen, Star, HelpCircle, Info, Users, Swords, Zap, Skull, Shield as ShieldIcon, Flame, Droplets, Wind, Ghost, Shield, PackagePlus, Loader2, CheckCircle, Trash2, Mic, Volume2, VolumeX, Sparkles, Plus, Dice5, ChevronRight, Target, RotateCcw, Move } from 'lucide-react';
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
import { Campaign, Scene, CAMPAIGNS } from './data/campaigns';
import { classData, ClassData } from './data/classData';
import { supabase } from './lib/supabase';
import { getClassIcon } from './lib/classIcons';
import { playSynthSound } from './lib/SoundSynth';
import { User as SupabaseUser, Session, RealtimeChannel } from '@supabase/supabase-js';
import RoomManager from './components/RoomManager';
import LandingPage from './components/LandingPage';

// Constantes removidas pois a lógica foi consolidada

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showLanding, setShowLanding] = useState(true);
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

  // Campaign & Scene State
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [discoveredSceneIds, setDiscoveredSceneIds] = useState<string[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');

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
      .on('broadcast', { event: 'background_update' }, ({ payload }: { payload: { url: string, sceneId?: string } }) => {
        setBackgroundUrl(payload.url);
        if (payload.sceneId) setCurrentSceneId(payload.sceneId);
      })
      .on('broadcast', { event: 'scene_discovery' }, ({ payload }: { payload: { discoveredIds: string[] } }) => {
        setDiscoveredSceneIds(payload.discoveredIds);
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

      const isDataValid = data && (data instanceof Blob || data instanceof ArrayBuffer || typeof data === 'object');
      if (!isDataValid) {
        console.error('[TTS] Formato de resposta inválido:', typeof data);
        throw new Error('Falha ao obter áudio: Formato inválido');
      }

      // Se o data for um objeto com erro (caso de falha silenciosa vinda da func)
      if (typeof data === 'object' && !(data instanceof Blob) && !(data instanceof ArrayBuffer) && (data as any).error) {
        throw new Error(`Erro retornado pela função: ${(data as any).error}`);
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      let audioUrl: string;
      if (data instanceof Blob) {
        console.log('[TTS] Dado recebido como Blob');
        audioUrl = URL.createObjectURL(data);
      } else if (data instanceof ArrayBuffer) {
        console.log('[TTS] Dado recebido como ArrayBuffer');
        const blob = new Blob([data], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(blob);
      } else {
        // Fallback robusto
        console.warn('[TTS] Tentando converter objeto/string para Blob...');
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
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play().catch(e => {
        console.warn('[TTS] Autoplay bloqueado ou erro de reprodução:', e);
        // Tentar fallback se for erro de codec ou outro
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

  const isNarrator = (name: string) => name === 'Narrador IA' || name === 'Narrador';

  const handleSelectScene = (scene: Scene) => {
    setCurrentSceneId(scene.id);
    setBackgroundUrl(scene.imageUrl);
    // Sync to other players via channel
    if (channel) {
      channel.send({ type: 'broadcast', event: 'background_update', payload: { url: scene.imageUrl, sceneId: scene.id } });
    }
  };

  const handleDiscoverScene = (sceneId: string) => {
    const updated = [...new Set([...discoveredSceneIds, sceneId])];
    setDiscoveredSceneIds(updated);
    if (channel) {
      channel.send({ type: 'broadcast', event: 'scene_discovery', payload: { discoveredIds: updated } });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!room || !character) return;
    
    setIsAiThinking(true);
    
    const isCampaignStart = content.startsWith('INÍCIO DE CAMPANHA:');

    // Handle Campaign Initialization
    if (isCampaignStart) {
      const campaignName = content.split(':')[1].trim().split('.')[0];
      const foundCampaign = CAMPAIGNS.find(c => c.title.includes(campaignName) || c.id.includes(campaignName.toLowerCase().replace(/ /g, '_')));
      if (foundCampaign) {
        setActiveCampaign(foundCampaign);
        const firstScene = foundCampaign.scenes[0];
        if (firstScene) {
          setDiscoveredSceneIds([firstScene.id]);
          setCurrentSceneId(firstScene.id);
          setBackgroundUrl(firstScene.imageUrl);
        }
      }
    }

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
        } else if (aiRes?.text) {
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
    if (showLanding) {
      return (
        <LandingPage 
          onStart={() => setShowLanding(false)} 
          onLogin={() => setShowLanding(false)} 
        />
      );
    }
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto p-4 lg:p-8 max-w-7xl relative z-10 animate-in fade-in duration-1000">
        {(rollingDice.isRolling || rollingDice.value > 0) && (
          <Dice3D
            value={rollingDice.value}
            isRolling={rollingDice.isRolling}
            onAnimationEnd={finalizeRoll}
          />
        )}

        {/* Floating Premium Header */}
        {viewMode === 'standard' && (
          <header className="bg-[#15234b]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 mb-10 shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-8 group transition-all hover:border-white/20">
            <div className="flex items-center gap-8 w-full lg:w-auto">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative w-24 h-24 rounded-[2rem] bg-[#0c1527]/80 flex items-center justify-center border border-white/10 shadow-inner p-3 overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <div className="absolute bottom-0 right-0 bg-blue-600 text-[10px] font-black px-2 py-1 rounded-tl-xl border-t border-l border-white/20 shadow-lg">
                    NV {character.level}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-md">
                    {character.name}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-[9px] font-black text-green-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2"><span className="text-blue-500">◈</span> {character.race} {character.class_subclass}</span>
                  {room?.code && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(room.code); alert(`Código "${room.code}" copiado!`); }}
                      className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px]"
                    >
                      <Users className="w-3.5 h-3.5" /> {room.code}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Desktop View Switcher */}
              <div className="hidden md:flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                {[
                  { id: 'standard', label: 'FICHA', icon: User },
                  { id: 'theater', label: 'TEATRO', icon: Sparkles },
                  { id: 'map', label: 'MAPA', icon: Target }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === mode.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <mode.icon className="w-3.5 h-3.5" /> {mode.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 border-l border-white/5 pl-6">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-2xl border transition-all hover:scale-110 ${isMuted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setCharacter(null)}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all hover:scale-110"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all hover:scale-110"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Dynamic View Content */}
        {viewMode === 'theater' && (
          <TheaterView 
            room={room!}
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
            isNarrator={isNarrator}
            activeCampaign={activeCampaign}
            discoveredSceneIds={discoveredSceneIds}
            currentSceneId={currentSceneId}
            onSelectScene={handleSelectScene}
            onDiscoverScene={handleDiscoverScene}
            isMaster={!!(user?.email === 'admin@admin.com' || user?.email?.startsWith('mestre'))}
          />
        )}

        {viewMode === 'map' && (
          <BattleMap 
            partyCharacters={partyCharacters} 
            channel={channel!} 
            isAdmin={false}
            backgroundUrl={backgroundUrl}
            onBack={() => setViewMode('standard')}
          />
        )}

        {viewMode === 'standard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Character Sheet Column */}
            <div className="lg:col-span-3 space-y-8 pb-12">
              
              {/* Combat Tracker (Initiative) Overlay */}
              {combatOrder.length > 0 && (
                <div className="bg-[#15234b]/40 backdrop-blur-xl border border-blue-500/30 rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-top duration-500">
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
                          className={`min-w-[140px] p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-blue-600/20 border-blue-500 ring-4 ring-blue-500/20' : 'bg-black/20 border-white/5'}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-[10px] font-black ${isCurrent ? 'text-blue-300' : 'text-slate-500'}`}>#{idx + 1}</span>
                            <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/10">{item.initiative}</span>
                          </div>
                          <p className={`text-sm font-black truncate uppercase tracking-tight ${isCurrent ? 'text-white' : 'text-slate-400'}`}>{item.name}</p>
                          {isMyTurn && (
                            <div className="mt-2 text-[8px] font-black text-blue-400 animate-pulse uppercase tracking-[0.2em] text-center italic">Seu Turno!</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Runic Attributes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: 'Força', key: 'strength', color: 'from-orange-600/40 to-orange-900/40', shadow: 'shadow-orange-900/20' },
                  { label: 'Destreza', key: 'dexterity', color: 'from-emerald-600/40 to-emerald-900/40', shadow: 'shadow-emerald-900/20' },
                  { label: 'Constit.', key: 'constitution', color: 'from-red-600/40 to-red-900/40', shadow: 'shadow-red-900/20' },
                  { label: 'Inteligência', key: 'intelligence', color: 'from-blue-600/40 to-blue-900/40', shadow: 'shadow-blue-900/20' },
                  { label: 'Sabedoria', key: 'wisdom', color: 'from-purple-600/40 to-purple-900/40', shadow: 'shadow-purple-900/20' },
                  { label: 'Carisma', key: 'charisma', color: 'from-pink-600/40 to-pink-900/40', shadow: 'shadow-pink-900/20' }
                ].map(attr => (
                  <button
                    key={attr.key}
                    onClick={() => handleRoll(attr.label, (character as any)[attr.key])}
                    className={`group relative h-32 bg-gradient-to-br ${attr.color} backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center transition-all hover:-translate-y-1 hover:border-white/30 hover:shadow-2xl ${attr.shadow} overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                    <span className="relative text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">
                      {attr.label}
                    </span>
                    <span className="relative text-4xl font-black text-white drop-shadow-lg group-hover:scale-110 transition-transform">
                      {(character as any)[attr.key]}
                    </span>
                    <div className="relative mt-2 px-3 py-1 bg-black/30 rounded-full border border-white/5 text-[10px] font-black text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {calculateModifier((character as any)[attr.key]) >= 0 ? '+' : ''}{calculateModifier((character as any)[attr.key])}
                    </div>
                  </button>
                ))}
              </div>

              {/* Combat Overview Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3 text-red-500 font-black uppercase text-[10px] tracking-widest">
                      <Heart className="w-4 h-4 fill-red-500" /> Vitalidade
                    </div>
                    <button className="text-white/20 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-end justify-between mb-4">
                    <span className="text-6xl font-black text-white italic tracking-tighter drop-shadow-lg">{character.hp_current}</span>
                    <span className="text-xl font-bold text-slate-500 mb-2">/ {character.hp_max} PV</span>
                  </div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400 transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      style={{ width: `${(character.hp_current/character.hp_max)*100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Classe de Armadura', value: character.ac, icon: Shield, color: 'text-amber-500' },
                    { label: 'Iniciativa', value: calculateModifier(character.dexterity) >= 0 ? '+' + calculateModifier(character.dexterity) : calculateModifier(character.dexterity), icon: Zap, color: 'text-blue-500' },
                    { label: 'Deslocamento', value: '9m', icon: Move, color: 'text-emerald-500' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center group transition-all hover:border-white/20 hover:bg-white/5 shadow-lg">
                      <stat.icon className={`w-6 h-6 ${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                      <span className="text-3xl font-black text-white italic tracking-tighter mb-1 leading-none">{stat.value}</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dice Tray */}
              <section className="bg-[#15234b]/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <Dice5 className="w-5 h-5 text-blue-400" /> Mesa de Rolagens
                </h2>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
                  {[4, 6, 8, 10, 12, 20, 100].map(size => (
                    <button
                      key={size}
                      onClick={() => handleDiceRoll(`d${size}`, size)}
                      className="group relative flex flex-col items-center justify-center py-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600 hover:border-blue-400 transition-all hover:-translate-y-1 active:scale-95 shadow-lg"
                    >
                      <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">d{size}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Inventory and Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                  <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                    <Package className="w-6 h-6 text-amber-500" /> Mochila
                  </h2>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto px-2 custom-scrollbar">
                    {character.inventory?.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <div>
                          <p className="font-black text-white text-sm uppercase italic group-hover:text-blue-400 transition-colors">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">x{item.quantity} • {item.type}</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-slate-700" />
                      </div>
                    ))}
                    {(!character.inventory || character.inventory.length === 0) && (
                      <p className="text-xs text-slate-500 italic text-center py-8">Sua mochila está vazia...</p>
                    )}
                  </div>
                </section>

                <section className="bg-[#15234b]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                  <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                    <Star className="w-6 h-6 text-blue-400" /> Habilidades
                  </h2>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto px-2 custom-scrollbar">
                    {currentCharClassData?.abilities.slice(0, character.level + 2).map((skill, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-blue-600/10 to-transparent p-4 rounded-2xl border-l-4 border-l-blue-500 border-y border-r border-white/5">
                        <p className="text-xs font-black text-blue-300 uppercase tracking-widest mb-1">{skill.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{skill.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Sidebar Column */}
            <aside className="space-y-8">
              {/* Party Members */}
              <div className="bg-[#15234b]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <h2 className="text-sm font-black text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-white/5 pb-4">
                  <Users className="w-5 h-5 text-blue-400" /> Aventureiros
                </h2>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {partyCharacters.filter(c => c.id !== character.id).map(comp => {
                    const ic = getClassIcon(comp.class_subclass);
                    return (
                      <button 
                        key={comp.id}
                        onClick={() => setSelectedCompanion(comp)}
                        className="w-full bg-white/5 border border-white/5 hover:border-blue-500/50 rounded-2xl p-4 flex items-center gap-4 transition-all group hover:bg-white/10"
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                             style={{ backgroundColor: ic.color + '20', border: `1px solid ${ic.color}40` }}>
                          {ic.emoji}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-black text-white text-sm truncate uppercase italic tracking-tight">{comp.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500" style={{ width: `${(comp.hp_current/comp.hp_max)*100}%` }}></div>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase">NV {comp.level}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {partyCharacters.length <= 1 && (
                    <p className="text-[11px] text-slate-500 text-center py-6 italic">A taverna está vazia...</p>
                  )}
                </div>
              </div>

              {/* dice logs shortcut */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-inner overflow-hidden flex flex-col min-h-[400px]">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Mesa em Tempo Real</h2>
                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar-thin">
                  {diceLogs.slice(0, 15).map((log, i) => (
                    <div key={i} className="flex justify-between items-center gap-4 animate-in fade-in slide-in-from-right duration-500">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block truncate">{log.player}</span>
                        <span className="text-[10px] font-bold text-slate-600 block uppercase">Rolou {log.dieType}</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-white text-lg">
                        {log.total}
                      </div>
                    </div>
                  ))}
                  {diceLogs.length === 0 && <p className="text-[11px] text-slate-700 italic text-center py-8 uppercase tracking-widest">Aguardando o destino...</p>}
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
