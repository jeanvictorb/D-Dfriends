import React, { useEffect, useState } from 'react';

interface Dice3DProps {
  value: number;
  isRolling: boolean;
  onAnimationEnd: () => void;
}

export default function Dice3D({ value, isRolling, onAnimationEnd }: Dice3DProps) {
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
        // Parar na face correta (Aproximação de D20 em 3D simplificado com cubo para D6 ou pseudo-rotações fixas para D20)
        // Para simplificar a física sem bibliotecas, vamos fazer o cubo girar muito e quando parar, mostramos um popup
        setRotation({ x: 0, y: 0, z: 0 }); 
        setTimeout(onAnimationEnd, 500); 
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isRolling, value, onAnimationEnd]);

  // Se o dado parou e não está mais rolando, mostramos o resultado com estilo
  const isCritical = value === 20;
  const isFumble = value === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center">
        {/* Container do "Dado 3D" simplificado (um cubo girando) */}
        {isRolling ? (
          <div className="scene w-32 h-32 mb-8 perspective-1000">
            <div 
              className="cube w-full h-full relative preserve-3d transition-transform duration-[1500ms] ease-out"
              style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)` }}
            >
              <div className="face front absolute w-full h-full bg-blue-600 border-4 border-blue-400 rounded-xl flex items-center justify-center text-4xl font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" style={{ transform: 'translateZ(64px)' }}>20</div>
              <div className="face back absolute w-full h-full bg-blue-800 border-4 border-blue-500 rounded-xl flex items-center justify-center text-4xl font-bold text-white opacity-80" style={{ transform: 'rotateY(180deg) translateZ(64px)' }}>1</div>
              <div className="face right absolute w-full h-full bg-blue-700 border-4 border-blue-400 rounded-xl flex items-center justify-center text-4xl font-bold text-white opacity-90" style={{ transform: 'rotateY(90deg) translateZ(64px)' }}>14</div>
              <div className="face left absolute w-full h-full bg-blue-900 border-4 border-blue-500 rounded-xl flex items-center justify-center text-4xl font-bold text-white opacity-90" style={{ transform: 'rotateY(-90deg) translateZ(64px)' }}>7</div>
              <div className="face top absolute w-full h-full bg-blue-600 border-4 border-blue-400 rounded-xl flex items-center justify-center text-4xl font-bold text-white opacity-80" style={{ transform: 'rotateX(90deg) translateZ(64px)' }}>18</div>
              <div className="face bottom absolute w-full h-full bg-blue-800 border-4 border-blue-500 rounded-xl flex items-center justify-center text-4xl font-bold text-white opacity-80" style={{ transform: 'rotateX(-90deg) translateZ(64px)' }}>3</div>
            </div>
          </div>
        ) : (
          <div className={`w-40 h-40 flex items-center justify-center rounded-3xl mb-8 animate-in zoom-in duration-300
            ${isCritical ? 'bg-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.8)] border-4 border-yellow-200' : 
              isFumble ? 'bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.8)] border-4 border-red-300' : 
              'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.6)] border-4 border-blue-300'}`}
          >
            <span className="text-7xl font-black text-white drop-shadow-lg">{value}</span>
          </div>
        )}

        {!isRolling && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className={`text-4xl font-black uppercase tracking-widest drop-shadow-xl
              ${isCritical ? 'text-amber-400' : isFumble ? 'text-red-400' : 'text-blue-200'}`}
            >
              {isCritical ? 'Acerto Crítico!' : isFumble ? 'Falha Crítica!' : 'Rolagem Concluída'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
