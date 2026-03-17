import React, { useState, useEffect } from 'react';
import { Character, InventoryItem, Profile } from '../types';
import { Shield, Users, Heart, PackagePlus, Loader2, LogOut, CheckCircle, Trash2, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Socket } from 'socket.io-client';
import { getClassIcon } from '../lib/classIcons';

interface Props {
  onLogout: () => void;
  socket?: Socket | null;
}

export default function DMDashboard({ onLogout, socket }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  // Item Form State
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemType, setItemType] = useState('item');
  const [itemDesc, setItemDesc] = useState('');

  // Voice AI State
  const [ttsMessage, setTtsMessage] = useState('');

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

  // Keep selectedChar in sync when the characters list refreshes
  useEffect(() => {
    if (selectedChar) {
      const fresh = characters.find(c => c.id === selectedChar.id);
      if (fresh) setSelectedChar(fresh);
    }
  }, [characters]);

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
      // Also keep the selected character panel in sync
      setSelectedChar(prev => prev ? (data.find(c => c.id === prev.id) ?? prev) : null);
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
      // fetchCharacters will be called via realtime subscription
    } else {
      console.error("Erro ao dar item:", error);
      alert("Erro ao enviar item!");
    }
  };

  const updateAttribute = async (char: Character, attr: keyof Character, amount: number) => {
    const currentValue = Number(char[attr]) || 10;
    const newValue = Math.max(1, Math.min(30, currentValue + amount));
    
    await supabase
      .from('characters')
      .update({ [attr]: newValue })
      .eq('id', char.id);
  };

  const removeItem = async (char: Character, itemId: string) => {
    const currentInventory = char.inventory || [];
    const updatedInventory = currentInventory.filter(item => item.id !== itemId);

    await supabase
      .from('characters')
      .update({ inventory: updatedInventory })
      .eq('id', char.id);
  };

  const handleTTS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsMessage.trim() || !socket) return;
    socket.emit('play_tts', { salaId: 'default', text: ttsMessage });
    setTtsMessage('');
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
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Class Icon */}
                      {(() => { const ic = getClassIcon(char.class_subclass); return (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ backgroundColor: ic.color + '22', border: `1.5px solid ${ic.color}55` }}>{ic.emoji}</div>
                      ); })()}
                      <h3 className="text-xl font-bold text-white truncate" title={char.name}>{char.name}</h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-900/50 text-blue-200 border border-blue-500/30 flex-shrink-0">
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

                  {/* Manage Character Button */}
                  <button 
                    onClick={() => setSelectedChar(char)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 transition-colors font-bold text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Gerenciar Ficha
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
            
            {/* Voice AI Panel */}
            <div className="mb-6 bg-[#0c1527] border border-purple-500/30 rounded-lg p-4 shadow-lg shadow-purple-900/10">
              <h3 className="text-sm font-bold text-purple-400 uppercase flex items-center gap-2 mb-3">
                <Mic className="w-4 h-4" /> Voz do Mestre (IA)
              </h3>
              <form onSubmit={handleTTS} className="space-y-2">
                <textarea 
                  value={ttsMessage} 
                  onChange={e => setTtsMessage(e.target.value)} 
                  className="w-full bg-[#15234b] border border-purple-500/30 rounded p-2 text-white text-sm focus:border-purple-500 outline-none min-h-[60px] resize-y" 
                  placeholder="Digite uma fala épica para todos os jogadores escutarem..." 
                />
                <button 
                  type="submit" 
                  disabled={!ttsMessage.trim() || !socket}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded transition-colors text-xs font-bold"
                >
                  Anunciar na Taverna
                </button>
              </form>
            </div>
            
            {selectedChar ? (
              <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm text-slate-300">Gerenciando:</p>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-white text-lg">{selectedChar.name}</p>
                    <button onClick={() => setSelectedChar(null)} className="text-slate-400 hover:text-white text-xs underline">Fechar</button>
                  </div>
                </div>

                {/* Attributes Management */}
                <div className="bg-[#0c1527] border border-[#2a4387]/50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-blue-300 uppercase mb-3">Atributos</h3>
                  <div className="space-y-2">
                    {[
                      { key: 'strength', label: 'Força' },
                      { key: 'dexterity', label: 'Destreza' },
                      { key: 'constitution', label: 'Constituição' },
                      { key: 'intelligence', label: 'Inteligência' },
                      { key: 'wisdom', label: 'Sabedoria' },
                      { key: 'charisma', label: 'Carisma' }
                    ].map(attr => (
                      <div key={attr.key} className="flex justify-between items-center bg-[#15234b]/50 p-2 rounded">
                        <span className="text-xs font-bold text-slate-300">{attr.label}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateAttribute(selectedChar, attr.key as keyof Character, -1)} className="w-6 h-6 rounded bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white flex items-center justify-center text-sm font-bold">-</button>
                          <span className="font-bold text-white w-6 text-center">{selectedChar[attr.key as keyof Character] as number}</span>
                          <button onClick={() => updateAttribute(selectedChar, attr.key as keyof Character, 1)} className="w-6 h-6 rounded bg-green-900/40 text-green-400 hover:bg-green-600 hover:text-white flex items-center justify-center text-sm font-bold">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory Management */}
                <div className="bg-[#0c1527] border border-[#2a4387]/50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-blue-300 uppercase mb-3 flex items-center justify-between">
                    <span>Inventário Atual</span>
                    <span className="text-xs bg-blue-900/50 px-2 py-0.5 rounded-full">{selectedChar.inventory?.length || 0}</span>
                  </h3>
                  
                  {selectedChar.inventory && selectedChar.inventory.length > 0 ? (
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedChar.inventory.map(item => (
                        <li key={item.id} className="flex items-start justify-between bg-[#15234b]/50 p-2 rounded border border-[#2a4387]/30 group">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-blue-200 leading-tight">
                              {item.name} <span className="text-slate-400 text-xs font-normal ml-1">x{item.quantity}</span>
                            </p>
                            {item.description && <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.description}</p>}
                          </div>
                          <button 
                            onClick={() => removeItem(selectedChar, item.id)}
                            className="text-red-400/50 hover:text-red-400 p-1 ml-2 transition-colors"
                            title="Remover Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">Mochila Vazia.</p>
                  )}
                </div>

                {/* Add Item Form */}
                <form onSubmit={handleGiveItem} className="bg-[#0c1527] border border-[#2a4387]/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-bold text-amber-500 uppercase flex items-center gap-2 mb-2">
                    <PackagePlus className="w-4 h-4" /> Dar Novo Item
                  </h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Item</label>
                    <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} className="w-full bg-[#15234b] border border-[#2a4387]/50 rounded p-2 text-white text-xs focus:border-blue-500 outline-none" placeholder="Ex: Poção de Cura" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd.</label>
                      <input type="number" required min="1" value={itemQuantity} onChange={e => setItemQuantity(parseInt(e.target.value))} className="w-full bg-[#15234b] border border-[#2a4387]/50 rounded p-2 text-white text-xs focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
                      <select value={itemType} onChange={e => setItemType(e.target.value)} className="w-full bg-[#15234b] border border-[#2a4387]/50 rounded p-2 text-white text-xs focus:border-blue-500 outline-none">
                        <option value="item">Geral</option>
                        <option value="arma">Arma</option>
                        <option value="pocao">Poção</option>
                        <option value="equipamento">Equipamento</option>
                        <option value="relíquia">Relíquia</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</label>
                    <textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="w-full bg-[#15234b] border border-[#2a4387]/50 rounded p-2 text-white text-xs focus:border-blue-500 outline-none min-h-[50px]" placeholder="Efeitos, bônus..." />
                  </div>

                  <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-xs font-bold mt-2">
                    Adicionar à Mochila
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Selecione um personagem <br/> para gerenciar as atributos e inventário.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
