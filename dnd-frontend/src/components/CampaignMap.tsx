import React from 'react';
import { Scene } from '../data/campaigns';
import { MapPin, Lock, CheckCircle2, Navigation } from 'lucide-react';

interface Props {
  scenes: Scene[];
  discoveredSceneIds: string[];
  currentSceneId: string;
  onSelectScene: (scene: Scene) => void;
  isMaster: boolean;
  onDiscoverScene?: (sceneId: string) => void;
}

const CampaignMap: React.FC<Props> = ({ 
  scenes, 
  discoveredSceneIds, 
  currentSceneId, 
  onSelectScene, 
  isMaster,
  onDiscoverScene 
}) => {
  return (
    <div className="relative w-full aspect-[4/3] bg-[#f4e4bc] rounded-3xl border-4 border-[#8b5e3c] overflow-hidden shadow-2xl p-6 group">
      {/* Parchment Texture Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]" />
      
      {/* Decorative Border */}
      <div className="absolute inset-2 border border-[#8b5e3c]/30 rounded-2xl pointer-events-none" />

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <path 
          d={`M ${scenes[0].x}% ${scenes[0].y}% L ${scenes[1].x}% ${scenes[1].y}% L ${scenes[2].x}% ${scenes[2].y}%`}
          fill="none"
          stroke="#8b5e3c"
          strokeWidth="3"
          strokeDasharray="8 4"
          className="animate-pulse"
        />
      </svg>

      {/* Scene Markers */}
      {scenes.map((scene, idx) => {
        const isDiscovered = discoveredSceneIds.includes(scene.id);
        const isCurrent = currentSceneId === scene.id;
        const isLocked = !isDiscovered;

        return (
          <div 
            key={scene.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${scene.x}%`, top: `${scene.y}%` }}
          >
            <div className="relative flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-[#2a1b0e] text-[#f4e4bc] text-[8px] font-black px-2 py-1 rounded-md whitespace-nowrap uppercase tracking-widest border border-[#8b5e3c]">
                  {isLocked ? '??? Desconhecido' : scene.name}
                </div>
              </div>

              {/* Marker Button */}
              <button
                disabled={isLocked && !isMaster}
                onClick={() => {
                  if (isLocked && isMaster && onDiscoverScene) {
                    onDiscoverScene(scene.id);
                  } else if (!isLocked) {
                    onSelectScene(scene);
                  }
                }}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg relative
                  ${isLocked 
                    ? 'bg-slate-800/20 border-2 border-slate-800/40 text-slate-800/40 grayscale' 
                    : isCurrent
                      ? 'bg-[#8b5e3c] border-2 border-[#f4e4bc] text-[#f4e4bc] scale-125 z-10 animate-bounce-slow'
                      : 'bg-[#f4e4bc] border-2 border-[#8b5e3c] text-[#8b5e3c] hover:scale-110'
                  }
                `}
              >
                {isLocked ? (
                  isMaster ? <Navigation className="w-5 h-5 animate-pulse text-amber-900/40" /> : <Lock className="w-4 h-4" />
                ) : isCurrent ? (
                  <MapPin className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}

                {/* Pulsing ring for current location */}
                {isCurrent && (
                  <div className="absolute -inset-2 border-2 border-[#8b5e3c] rounded-full animate-ping opacity-20" />
                )}
              </button>
            </div>
          </div>
        );
      })}

      {/* Legendary Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#2a1b0e]/10 px-4 py-1 rounded-full border border-[#8b5e3c]/20">
        <span className="text-[9px] font-black text-[#8b5e3c] uppercase tracking-[0.3em]">Mapa de Jornada</span>
      </div>
    </div>
  );
};

export default CampaignMap;
