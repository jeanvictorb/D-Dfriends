import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Flame, Shield, Zap } from 'lucide-react';

export type DiceMaterial = 'default' | 'crystal' | 'magma' | 'metal' | 'gold';

interface Dice3DProps {
  value: number;
  isRolling: boolean;
  onAnimationEnd: () => void;
  material?: DiceMaterial;
}

export default function Dice3D({ value, isRolling, onAnimationEnd, material = 'default' }: Dice3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (isRolling) {
      // Girar loucamente
      setRotation({
        x: Math.random() * 1440 + 720,
        y: Math.random() * 1440 + 720,
        z: Math.random() * 1440 + 720,
      });

      const timer = setTimeout(() => {
        setRotation({ x: 0, y: 0, z: 0 }); 
        setTimeout(onAnimationEnd, 800); 
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isRolling, value, onAnimationEnd]);

  const isCritical = value === 20;
  const isFumble = value === 1;

  const materialClass = useMemo(() => {
    switch (material) {
      case 'crystal': return 'dice-material-crystal';
      case 'magma': return 'dice-material-magma';
      case 'metal': return 'dice-material-metal';
      case 'gold': return 'dice-material-metal-gold';
      default: return 'bg-blue-600 border-4 border-blue-400';
    }
  }, [material]);

  const faces = [
    { label: '20', transform: 'translateZ(64px)', class: materialClass },
    { label: '1', transform: 'rotateY(180deg) translateZ(64px)', class: materialClass },
    { label: '14', transform: 'rotateY(90deg) translateZ(64px)', class: materialClass },
    { label: '7', transform: 'rotateY(-90deg) translateZ(64px)', class: materialClass },
    { label: '18', transform: 'rotateX(90deg) translateZ(64px)', class: materialClass },
    { label: '3', transform: 'rotateX(-90deg) translateZ(64px)', class: materialClass },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-opacity duration-500 animate-in fade-in">
      
      {/* Background Glow for Criticals */}
      {isCritical && !isRolling && (
         <div className="absolute w-[50vw] h-[50vw] bg-amber-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      )}
      
      <div className="flex flex-col items-center relative z-10">
        {isRolling ? (
          <div className="scene w-32 h-32 mb-12 perspective-1000 scale-125 md:scale-150">
            <div 
              className="cube w-full h-full relative preserve-3d transition-transform duration-[2000ms] ease-out"
              style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)` }}
            >
              {faces.map((face, i) => (
                <div 
                  key={i}
                  className={`face absolute w-full h-full rounded-[1.5rem] flex items-center justify-center text-4xl font-black shadow-2xl overflow-hidden shimmer ${face.class}`}
                  style={{ transform: face.transform }}
                >
                  <span className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{face.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`group relative w-48 h-48 flex items-center justify-center rounded-[3rem] mb-12 animate-in zoom-in-50 duration-500 shadow-2xl border-4 shimmer ${materialClass} ${
            isCritical ? 'scale-110 shadow-amber-500/50' : 
            isFumble ? 'grayscale bg-red-950 border-red-500 shadow-red-500/50' : ''}`}
          >
            {isCritical && (
              <div className="absolute -top-6 -right-6 bg-amber-500 p-4 rounded-2xl shadow-xl shadow-amber-500/40 rotate-12 animate-bounce">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            )}
            <span className="text-[120px] font-black drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] tracking-tighter">
              {value}
            </span>
            
            {/* Inner Sparkles for High Value */}
            {value > 15 && (
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-4 left-4"><Sparkles className="w-4 h-4" /></div>
                <div className="absolute bottom-4 right-4"><Sparkles className="w-4 h-4" /></div>
              </div>
            )}
          </div>
        )}

        {!isRolling && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className={`text-5xl font-black uppercase tracking-[0.2em] italic drop-shadow-2xl text-center
              ${isCritical ? 'text-amber-400' : isFumble ? 'text-red-500' : 'text-indigo-200'}`}
            >
              {isCritical ? 'DESTINO HEROICO!' : isFumble ? 'RUÍNA ABSOLUTA!' : 'RESULTADO'}
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-2">Toque em qualquer lugar para continuar</p>
          </div>
        )}
      </div>
    </div>
  );
}
