import React, { useState, useEffect } from 'react';
import { Character, Token } from '../types';
import { Swords, Hand, Target, Ghost, Package, DoorClosed as Door, Trash2, Plus, Skull, Info, ChevronRight } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

const GRID_SIZE = 50;
const MAP_WIDTH = 12;
const MAP_HEIGHT = 12;

const ASSETS = [
  { id: 'monster', name: 'Monstro', icon: 'M', type: 'monster', color: '#ef4444', lucide: Skull },
  { id: 'chest', name: 'Baú', icon: 'B', type: 'object', color: '#f59e0b', lucide: Package },
  { id: 'door', name: 'Porta', icon: 'P', type: 'object', color: '#78350f', lucide: Door },
  { id: 'npc', name: 'NPC', icon: 'N', type: 'monster', color: '#10b981', lucide: Ghost },
];

interface Props {
  partyCharacters: Character[];
  channel: RealtimeChannel | null;
  isAdmin?: boolean;
  backgroundUrl?: string; 
  onBack?: () => void; // Add this prop
}

const BattleMap: React.FC<Props> = ({ partyCharacters, channel, isAdmin, backgroundUrl, onBack }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  // Determine grid map based on scene background
  const getGridMap = () => {
    if (!backgroundUrl) return null;
    if (backgroundUrl.includes('taverna')) return '/images/maps/taverna.png';
    if (backgroundUrl.includes('porao')) return '/images/maps/porao.png';
    if (backgroundUrl.includes('tumba')) return '/images/maps/tumba.png';
    return null;
  };
  
  const gridMapUrl = getGridMap();

  useEffect(() => {
    // Merge new characters into tokens, keeping existing positions
    setTokens((prev: Token[]) => {
      const existingIds = new Set(prev.map((t: Token) => t.id));
      const newTokens: Token[] = partyCharacters
        .filter((char: Character) => !existingIds.has(char.id))
        .map((char: Character) => ({
          id: char.id,
          name: char.name,
          x: 0,
          y: 0,
          color: '#3b82f6',
          icon: char.name[0],
          type: 'player'
        }));
      
      const updatedExisting = prev.map((t: Token) => {
        const char = partyCharacters.find((c: Character) => c.id === t.id);
        if (char && t.type === 'player') {
          return { ...t, name: char.name, icon: char.name[0] };
        }
        return t;
      });

      const partyIds = new Set(partyCharacters.map((c: Character) => c.id));
      return [...updatedExisting, ...newTokens].filter((t: Token) => 
        t.type !== 'player' || partyIds.has(t.id as number)
      );
    });

    if (channel) {
      channel.on('broadcast', { event: 'map_update' }, ({ payload }: { payload: Token[] }) => {
        setTokens(payload);
      });

      channel.on('broadcast', { event: 'map_sync_request' }, () => {
        if (isAdmin) {
          setTokens(current => {
            channel.send({ type: 'broadcast', event: 'map_update', payload: current });
            return current;
          });
        }
      });

      channel.send({ type: 'broadcast', event: 'map_sync_request', payload: {} });
    }
  }, [partyCharacters.length, channel, isAdmin]);
  const handleDragEnd = (tokenId: string | number, x: number, y: number) => {
    setTokens((prev: Token[]) => {
      let updated = prev.map((t: Token) => t.id === tokenId ? { ...t, x, y } : t);
      
      // If a player token moved, check for nearby hidden objects/monsters
      const movingToken = updated.find(t => t.id === tokenId);
      if (movingToken?.type === 'player') {
        updated = updated.map(t => {
          if ((t.type === 'monster' || t.type === 'object') && t.hidden && !t.discovered) {
            // Check distance (adjacent or diagonal = max 1 cell distance)
            const dist = Math.max(Math.abs(t.x - x), Math.abs(t.y - y));
            if (dist <= 1) {
              return { ...t, discovered: true };
            }
          }
          return t;
        });
      }

      if (channel) {
        channel.send({ type: 'broadcast', event: 'map_update', payload: updated });
      }
      return updated;
    });
  };

  const handleCellClick = (x: number, y: number) => {
    if (!isAdmin || !selectedAsset) return;
    const asset = ASSETS.find(a => a.id === selectedAsset);
    if (!asset) return;

    const newToken: Token = {
      id: `asset-${Date.now()}`,
      name: asset.name,
      x,
      y,
      color: asset.color,
      icon: asset.icon,
      type: asset.type as 'player' | 'monster' | 'object',
      hidden: true, // New assets are hidden by default
      discovered: false
    };

    setTokens(prev => {
      const updated = [...prev, newToken];
      if (channel) {
        channel.send({ type: 'broadcast', event: 'map_update', payload: updated });
      }
      return updated;
    });
    setSelectedAsset(null);
  };

  const removeToken = (tokenId: string | number) => {
    if (!isAdmin) return;
    setTokens(prev => {
      const updated = prev.filter(t => t.id !== tokenId);
      if (channel) {
        channel.send({ type: 'broadcast', event: 'map_update', payload: updated });
      }
      return updated;
    });
  };

  return (
    <div className="flex flex-col items-center bg-[#0c1527] min-h-screen p-8 pt-24 overflow-hidden select-none">
      {isAdmin && (
        <div className="fixed top-24 left-8 z-50 flex flex-col gap-4">
          <div className="panel p-4 flex flex-col gap-3 border-l-4 border-l-amber-500 bg-[#15234b]/80 backdrop-blur-xl">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-4 h-4" /> Mestria do Mapa
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ASSETS.map(asset => {
                const Icon = asset.lucide;
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl transition-all border-2
                      ${selectedAsset === asset.id 
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105' 
                        : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/20'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">{asset.name}</span>
                  </button>
                );
              })}
            </div>
            {selectedAsset && (
              <div className="space-y-2">
                <p className="text-[9px] text-amber-200/60 italic mt-1 font-medium bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  Clique no grid para posicionar. 
                </p>
                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="w-full py-2 bg-rose-600/20 text-rose-400 text-[9px] font-black uppercase rounded-lg border border-rose-500/20 hover:bg-rose-600/40 transition-all"
                >
                  Cancelar Seleção
                </button>
                <p className="text-[8px] text-rose-400/80 uppercase font-black tracking-tighter text-center">
                  Invisível para jogadores até descoberto
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-[#15234b] border border-[#2a4387]/50 rounded-xl text-blue-400 hover:text-white hover:border-blue-500 transition-all font-bold text-xs shadow-lg group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Dashboard
          </button>
        )}
        <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-[0.3em]">
          <Target className="text-red-500 w-6 h-6" /> Mapa de Batalha
        </h2>
      </div>

      <div className="relative bg-[#15234b]/40 border border-[#2a4387]/50 rounded-2xl shadow-2xl overflow-visible ring-1 ring-white/5">
        <div 
          className="grid gap-0"
          style={{ 
            gridTemplateColumns: `repeat(${MAP_WIDTH}, ${GRID_SIZE}px)`,
            gridTemplateRows: `repeat(${MAP_HEIGHT}, ${GRID_SIZE}px)`,
            width: `${MAP_WIDTH * GRID_SIZE}px`,
            height: `${MAP_HEIGHT * GRID_SIZE}px`,
            backgroundImage: `
              ${gridMapUrl ? `url(${gridMapUrl}), ` : ''}
              linear-gradient(to right, rgba(42, 67, 135, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(42, 67, 135, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: `
              ${gridMapUrl ? '100% 100%, ' : ''}
              ${GRID_SIZE}px ${GRID_SIZE}px, 
              ${GRID_SIZE}px ${GRID_SIZE}px
            `,
            backgroundColor: '#0c1527',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {Array.from({ length: MAP_WIDTH * MAP_HEIGHT }).map((_, i) => {
            const x = i % MAP_WIDTH;
            const y = Math.floor(i / MAP_WIDTH);
            return (
              <div 
                key={i} 
                className={`w-full h-full border-[0.5px] border-[#2a4387]/10 transition-colors ${selectedAsset ? 'hover:bg-amber-500/10 cursor-crosshair' : ''}`} 
                onClick={() => handleCellClick(x, y)}
              />
            );
          })}
        </div>

        {tokens.map((token: Token) => {
          const isPlayer = token.type === 'player';
          const isHidden = token.hidden && !token.discovered;
          
          // Players only see non-hidden tokens
          if (!isAdmin && isHidden) return null;

          const asset = ASSETS.find(a => a.type === token.type && a.icon === token.icon);
          const Icon = asset?.lucide;

          return (
            <div
              key={token.id}
              className={`absolute flex items-center justify-center transition-all duration-300 ease-out z-10 
                ${(isAdmin || isPlayer) ? 'cursor-grab active:cursor-grabbing' : ''} 
                ${isHidden ? 'opacity-30' : 'opacity-100'} group`}
              style={{
                width: `${GRID_SIZE}px`,
                height: `${GRID_SIZE}px`,
                left: `${token.x * GRID_SIZE}px`,
                top: `${token.y * GRID_SIZE}px`
              }}

              draggable={isAdmin || isPlayer}
              onDragEnd={(e: React.DragEvent<HTMLDivElement>) => {
                if (!isAdmin && !isPlayer) return;
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (!rect) return;
                const newX = Math.floor((e.clientX - rect.left) / GRID_SIZE);
                const newY = Math.floor((e.clientY - rect.top) / GRID_SIZE);
                if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
                  handleDragEnd(token.id, newX, newY);
                }
              }}
              onContextMenu={(e) => {
                if (isAdmin) {
                  e.preventDefault();
                  removeToken(token.id);
                }
              }}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg transition-transform group-hover:scale-110 ${isPlayer ? 'ring-2 ring-white/20' : 'ring-1 ring-white/10'}`}
                style={{ backgroundColor: token.color }}
              >
                {Icon ? <Icon className="w-5 h-5" /> : token.icon}
              </div>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md z-20">
                {token.name}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="panel p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
          <Hand className="w-6 h-6 text-blue-400" />
          <p className="text-xs text-slate-400 font-medium italic">Arraste para se mover no mapa.</p>
        </div>
        <div className="panel p-4 flex items-center gap-4 border-l-4 border-l-red-500">
          <Swords className="w-6 h-6 text-red-400" />
          <p className="text-xs text-slate-400 font-medium italic">Encaixe tático e combate.</p>
        </div>
        <div className="panel p-4 flex items-center gap-4 border-l-4 border-l-amber-500 text-amber-200">
          <Target className="w-6 h-6" />
          <p className="text-xs opacity-80 font-medium italic">Grid de 12x12 células.</p>
        </div>
      </div>
    </div>
  );
};

export default BattleMap;
