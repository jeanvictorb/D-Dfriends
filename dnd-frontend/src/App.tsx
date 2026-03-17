import React, { useState, useEffect } from 'react';
import { Heart, User, LogOut, Package } from 'lucide-react';
import { Character, DiceEvent, Profile } from './types';
import CharacterCreator from './components/CharacterCreator';
import CharacterSelection from './components/CharacterSelection';
import Auth from './components/Auth';
import DMDashboard from './components/DMDashboard';
import Dice3D from './components/Dice3D';
import { supabase } from './lib/supabase';
import { User as SupabaseUser, Session, RealtimeChannel } from '@supabase/supabase-js';

const EDGE_FUNCTION_URL = 'https://kgxvjeqjcyphlkuszmoi.supabase.co/functions/v1/tts';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [diceLogs, setDiceLogs] = useState<DiceEvent[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

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
        setDiceLogs(prev => [payload, ...prev.slice(0, 49)]);
      })
      .on('broadcast', { event: 'hp_sync' }, ({ payload }: { payload: { charId: number, hp_current: number } }) => {
        setCharacter(prev => {
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
      .subscribe();

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
          const res = await fetch(`${EDGE_FUNCTION_URL}?text=${encoded}`, {
            headers: { 'Authorization': `Bearer ${supabase.auth.getSession().then(({data}) => data.session?.access_token)}` } // Optional: add auth if needed
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
         if (payload.new.id === user.id) {
           setProfile(payload.new as Profile);
         }
      })
      .subscribe();
      
    return () => {
      profileSubscription.unsubscribe();
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
      }, (payload) => {
        setCharacter(payload.new as Character);
        // Also update the character in the userCharacters array
        setUserCharacters(prev => prev.map(c => c.id === payload.new.id ? payload.new as Character : c));
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
      } else {
         setLoading(false); // Stop loading, show waiting room
      }
    } else {
      setLoading(false);
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

  const [rollingDice, setRollingDice] = useState<{ isRolling: boolean, value: number, event: DiceEvent | null }>({ isRolling: false, value: 0, event: null });

  const calculateModifier = (value: number) => Math.floor((value - 10) / 2);
  const calculateProficiency = (level: number) => Math.ceil(1 + (level / 4));

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-400 font-bold text-xl animate-pulse">Carregando a Taverna...</div>;

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  // DM Dashboard Routing
  if (user?.email === 'admin@admin.com' || user?.email?.startsWith('mestre') || user?.email?.startsWith('admin')) {
    return <DMDashboard onLogout={() => supabase.auth.signOut()} channel={channel} />;
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
             Bem-vindo à Taverna, <strong className="text-blue-400">{profile.username}</strong>!<br/><br/>
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
        <div className="container mx-auto p-4 lg:p-8 flex flex-col items-center justify-center min-h-screen">
           <CharacterCreator onCreate={handleCreate} />
           <button 
             onClick={() => setShowCreator(false)}
             className="mt-6 text-slate-400 hover:text-white font-bold transition-colors underline"
           >
             Cancelar Criação
           </button>
        </div>
      );
    }
    
    return (
      <CharacterSelection 
        characters={userCharacters} 
        onSelect={(char) => setCharacter(char)}
        onCreateNew={() => setShowCreator(true)}
      />
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
        <div className="flex items-center gap-6">
          <div className="text-right flex flex-col items-end border-r border-[#2a4387]/30 pr-6 hidden sm:flex">
            <span className="text-xs font-bold text-slate-300 uppercase mb-1">Bônus de Proficiência</span>
            <span className="text-2xl font-bold text-white">+{calculateProficiency(character.level)}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Stats */}
        <div className="lg:col-span-3 space-y-6">
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
            
            <div className="w-full h-3 bg-[#0c1527] rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(character.hp_current / character.hp_max) * 100}%` }}
              ></div>
            </div>

            <div className="flex gap-3">
              {[-5, -1, 1, 5].map((val) => (
                <button 
                  key={val}
                  onClick={() => updateHP(val)} 
                  className="flex-1 py-2 interactive-btn text-blue-200 text-sm font-medium"
                >
                  {val > 0 ? '+' : ''}{val} HP
                </button>
              ))}
            </div>
          </section>

          {/* Attributes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'FORÇA', val: character.strength },
              { label: 'DESTREZA', val: character.dexterity },
              { label: 'CONSTITUIÇÃO', val: character.constitution },
              { label: 'INTELIGÊNCIA', val: character.intelligence },
              { label: 'SABEDORIA', val: character.wisdom },
              { label: 'CARISMA', val: character.charisma },
            ].map((attr) => (
              <button 
                key={attr.label}
                onClick={() => handleRoll(attr.label, attr.val)}
                className="panel hover:bg-[#1e3470] cursor-pointer flex flex-col items-center justify-center py-6 px-4 transition-colors"
              >
                <span className="text-xs font-bold text-slate-400 mb-2">{attr.label}</span>
                <span className="text-3xl font-bold text-white mb-2">{attr.val}</span>
                <div className="text-sm font-medium text-blue-300">
                  ({calculateModifier(attr.val) >= 0 ? '+' : ''}{calculateModifier(attr.val)})
                </div>
              </button>
            ))}
          </div>

          {/* Inventory / Backpack */}
          <section className="panel mt-6">
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
        </div>

        {/* Sidebar Log */}
        <aside className="lg:col-span-1">
          <div className="panel h-full min-h-[500px] flex flex-col">
            <h2 className="text-sm font-bold text-white mb-6 uppercase">
              Log da Mesa
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {diceLogs.map((log, index) => (
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
    </div>
  );
};

export default App;
