import React, { useState, useEffect } from 'react';
import { Character, InventoryItem, Profile } from '../types';
import { Shield, Users, Heart, PackagePlus, Loader2, LogOut, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onLogout: () => void;
}

export default function DMDashboard({ onLogout }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  // Item Form State
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemType, setItemType] = useState('item');
  const [itemDesc, setItemDesc] = useState('');

  useEffect(() => {
    fetchCharacters();
    fetchPendingProfiles();

    const charSub = supabase
      .channel('dm_characters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, fetchCharacters)
      .subscribe();

    const profileSub = supabase
      .channel('dm_profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchPendingProfiles)
      .subscribe();

    return () => {
      charSub.unsubscribe();
      profileSub.unsubscribe();
    };
  }, []);

  const fetchPendingProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending');
    if (!error && data) {
      setPendingProfiles(data);
    }
  };

  const approvePlayer = async (profileId: string) => {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', profileId);
  };

  const fetchCharacters = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('characters').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setCharacters(data);
    } else {
      console.error("Erro ao buscar personagens:", error);
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

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: itemName,
      quantity: itemQuantity,
      type: itemType,
      description: itemDesc
    };

    const currentInventory = selectedChar.inventory || [];
    const updatedInventory = [...currentInventory, newItem];

    const { error } = await supabase
      .from('characters')
      .update({ inventory: updatedInventory })
      .eq('id', selectedChar.id);

    if (!error) {
      setItemName('');
      setItemQuantity(1);
      setItemDesc('');
      setSelectedChar(null);
      // fetchCharacters will be called via realtime subscription
    } else {
      console.error("Erro ao dar item:", error);
      alert("Erro ao enviar item!");
    }
  };

  if (loading && characters.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-blue-400 font-bold"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 min-h-screen">
      <header className="flex justify-between items-center mb-12 border-b border-[#2a4387]/50 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
            <Shield className="text-blue-500 w-10 h-10" />
            Painel do Mestre
          </h1>
          <p className="text-slate-400 font-medium">Controle total sobre a campanha e jogadores ativos.</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-6 py-3 interactive-btn text-red-300 hover:text-white hover:bg-red-600/50 border-red-500/30 text-sm font-bold shadow-lg"
        >
          <LogOut className="w-5 h-5" />
          Sair da Mesa
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Character List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
            <Users className="w-6 h-6 text-blue-400" />
            Aventureiros ({characters.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map(char => (
              <div key={char.id} className="panel flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white max-w-[70%] truncate" title={char.name}>{char.name}</h3>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-900/50 text-blue-200 border border-blue-500/30">
                      Nv {char.level}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{char.class_subclass}</p>
                </div>

                <div className="space-y-4">
                  {/* HP Control */}
                  <div className="flex items-center justify-between bg-[#0c1527] p-3 rounded-xl border border-[#2a4387]/50">
                    <div className="flex items-center gap-2">
                      <Heart className={`w-5 h-5 ${char.hp_current === 0 ? 'text-slate-600' : char.hp_current <= char.hp_max / 4 ? 'text-red-500 animate-pulse' : 'text-red-400'}`} />
                      <span className="font-bold text-white">{char.hp_current} / {char.hp_max}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => updateHP(char, -1)} className="w-8 h-8 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center font-bold text-lg transition-colors">-1</button>
                      <button onClick={() => updateHP(char, -5)} className="w-8 h-8 rounded bg-red-900/40 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center font-bold text-xs transition-colors">-5</button>
                      <button onClick={() => updateHP(char, 1)} className="w-8 h-8 rounded bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white flex items-center justify-center font-bold text-lg transition-colors ml-2">+1</button>
                    </div>
                  </div>

                  {/* Give Item Button */}
                  <button 
                    onClick={() => setSelectedChar(char)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 transition-colors font-bold text-sm"
                  >
                    <PackagePlus className="w-4 h-4" />
                    Dar Item
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Players Section */}
          {pendingProfiles.length > 0 && (
            <div className="mt-12 bg-[#0c1527] border border-amber-500/50 rounded-xl p-6 shadow-lg shadow-amber-900/20">
              <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-4">
                <Users className="w-6 h-6" />
                Jogadores Pendentes na Fila ({pendingProfiles.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingProfiles.map(prof => (
                  <div key={prof.id} className="flex items-center justify-between bg-[#15234b] p-4 rounded-lg border border-[#2a4387]/50">
                    <span className="font-bold text-white text-lg">{prof.username}</span>
                    <button 
                      onClick={() => approvePlayer(prof.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-bold shadow-md"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprovar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Panel (Right Side) */}
        <div>
          <div className="panel sticky top-8">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2a4387]/50 pb-4">
              Ações do Mestre
            </h2>
            
            {selectedChar ? (
              <form onSubmit={handleGiveItem} className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-slate-300">Enviando item para:</p>
                  <p className="font-bold text-white">{selectedChar.name}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome do Item</label>
                  <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none" placeholder="Ex: Poção de Cura" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Qtd.</label>
                    <input type="number" required min="1" value={itemQuantity} onChange={e => setItemQuantity(parseInt(e.target.value))} className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                    <select value={itemType} onChange={e => setItemType(e.target.value)} className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none">
                      <option value="item">Geral</option>
                      <option value="arma">Arma</option>
                      <option value="pocao">Poção</option>
                      <option value="equipamento">Equipamento</option>
                      <option value="relíquia">Relíquia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição Opcional</label>
                  <textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="w-full bg-[#0c1527] border border-[#2a4387]/50 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none min-h-[80px]" placeholder="Efeitos, dano, etc..." />
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setSelectedChar(null)} className="flex-1 py-2 border border-[#2a4387]/50 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-bold">Enviar</button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <PackagePlus className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Selecione um personagem <br/> para enviar um item.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
