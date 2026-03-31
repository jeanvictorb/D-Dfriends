import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Users, Plus, LogIn, Swords, Shield, Ghost, Dice5, Loader2, BookOpen, ChevronRight } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  code: string;
  style: string;
  is_ai_mode: boolean;
}

interface Props {
  user: any;
  onRoomSelected: (room: Room) => void;
}

const RoomManager: React.FC<Props> = ({ user, onRoomSelected }) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create' | 'saved'>('join');
  const [loading, setLoading] = useState(false);
  const [savedRooms, setSavedRooms] = useState<Room[]>([]);
  
  // Fetch saved rooms on mount
  React.useEffect(() => {
    fetchSavedRooms();
  }, [user]);

  const fetchSavedRooms = async () => {
    setLoading(true);
    try {
      // 1. Rooms created by user
      const { data: createdRooms } = await supabase.from('rooms').select('*').eq('created_by', user.id);
      
      // 2. Rooms where user has characters
      const { data: charData } = await supabase.from('characters').select('room_id').eq('user_id', user.id);
      const charRoomIds = (charData || []).map(c => c.room_id).filter(Boolean) as string[];
      
      let allRooms = createdRooms || [];
      if (charRoomIds.length > 0) {
        const { data: joinedRooms } = await supabase.from('rooms').select('*').in('id', charRoomIds);
        if (joinedRooms) {
          allRooms = [...allRooms, ...joinedRooms];
        }
      }
      
      // Deduplicate by ID
      const uniqueRooms = Array.from(new Map(allRooms.map(r => [r.id, r])).values());
      setSavedRooms(uniqueRooms);
      
      // If we have rooms, default to the saved tab
      if (uniqueRooms.length > 0) {
        setActiveTab('saved');
      }
    } catch (err) {
      console.error("Error fetching saved rooms:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Create Room State
  const [roomName, setRoomName] = useState('');
  const [gameStyle, setGameStyle] = useState('Épico');
  const [isAiMode, setIsAiMode] = useState(true);

  // Join Room State
  const [roomCode, setRoomCode] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    
    setLoading(true);
    const code = generateCode();
    
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name: roomName,
        code,
        style: gameStyle,
        is_ai_mode: isAiMode,
        created_by: user.id
      })
      .select()
      .single();

    setLoading(false);
    if (!error && data) {
      onRoomSelected(data as Room);
    } else {
      alert("Erro ao criar sala: " + (error?.message || "Tente novamente"));
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode.toUpperCase())
      .single();

    setLoading(false);
    if (!error && data) {
      onRoomSelected(data as Room);
    } else {
      alert("Sala não encontrada ou código inválido.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950/20">
      <div className="max-w-xl w-full">
        {/* Header Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-3xl mb-6 shadow-2xl relative">
            <Shield className="w-10 h-10 text-white" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">D-Dfriends</h1>
          <p className="text-slate-400 font-medium">Sua jornada começa no coração de uma taverna...</p>
        </div>

        {/* Action Tabs */}
        <div className="panel p-2 flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <BookOpen className="w-4 h-4" /> Minhas Mesas
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'join' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <LogIn className="w-4 h-4" /> Entrar
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Plus className="w-4 h-4" /> Criar
          </button>
        </div>

        {/* Forms */}
        <div className="panel p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          {activeTab === 'saved' ? (
            <div className="space-y-4 relative z-10">
              <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Suas Jornadas Ativas</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {savedRooms.length > 0 ? (
                  savedRooms.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onRoomSelected(r)}
                      className="w-full p-4 bg-slate-900 border border-slate-700/50 rounded-2xl flex items-center justify-between hover:border-blue-500 transition-all group"
                    >
                      <div className="text-left">
                        <span className="block text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{r.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{r.style} • {r.code}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-blue-400 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="py-10 text-center space-y-4">
                    <Ghost className="w-12 h-12 text-slate-700 mx-auto opacity-20" />
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Nenhuma mesa encontrada...</p>
                    <button 
                      onClick={() => setActiveTab('create')}
                      className="text-[10px] font-black text-blue-400 hover:underline uppercase tracking-widest"
                    >
                      Criar minha primeira mesa
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'join' ? (
            <form onSubmit={handleJoinRoom} className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Código da Mesa</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="EX: XPT-789"
                  maxLength={10}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-white text-3xl font-black tracking-[0.2em] outline-none focus:border-blue-500 transition-all text-center placeholder:opacity-20 uppercase"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Swords className="w-6 h-6" /> Entrar na Aventura</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateRoom} className="space-y-6 relative z-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Nome da Aventura</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Ex: A Maldição do Rei"
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Estilo de Campanha</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Sparkles, label: 'Épico', color: 'text-amber-400' },
                      { icon: Ghost, label: 'Sombrio', color: 'text-purple-400' },
                      { icon: Dice5, label: 'Cômico', color: 'text-green-400' },
                      { icon: Swords, label: 'Battle Royale', color: 'text-red-400' }
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setGameStyle(s.label)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${gameStyle === s.label ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-500'}`}
                      >
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                        <span className="text-xs font-bold text-white uppercase tracking-tighter">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                  <div>
                    <span className="block text-[10px] font-black text-indigo-400 uppercase mb-1">Mestre IA Ativo</span>
                    <span className="text-[10px] text-slate-500 font-medium">A IA do Gemini assumirá a narração.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsAiMode(!isAiMode)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isAiMode ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAiMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6" /> Criar Mesa</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomManager;
