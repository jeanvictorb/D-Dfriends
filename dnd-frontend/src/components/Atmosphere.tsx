import React, { useMemo } from 'react';

interface AtmosphereProps {
  variant?: 'neutral' | 'fire' | 'arcane' | 'nature';
}

const Atmosphere: React.FC<AtmosphereProps> = ({ variant = 'neutral' }) => {
  // Generate static particles once
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${Math.random() * 30 + 20}s`,
      delay: `${Math.random() * 20}s`,
    }));
  }, []);

  const sparks = useMemo(() => {
    if (variant !== 'fire') return [];
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 20}%`,
      duration: `${Math.random() * 2 + 1}s`,
      delay: `${Math.random() * 5}s`,
      x: `${(Math.random() - 0.5) * 100}px`, // Movement on X axis
    }));
  }, [variant]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Mist Overlay */}
      <div className="mist-overlay" />

      {/* Floating Particles */}
      <div className="particles-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              '--duration': p.duration,
              animationDelay: p.delay,
            } as React.CSSProperties}
          />
        ))}
        
        {/* Fire Sparks */}
        {sparks.map((s) => (
          <div
            key={s.id}
            className="spark"
            style={{
              left: s.left,
              bottom: s.bottom,
              '--duration': s.duration,
              '--x': s.x,
              animationDelay: s.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* Ambient Glow based on variant */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-t from-transparent to-transparent ${
        variant === 'fire' ? 'from-orange-900/40' : 
        variant === 'arcane' ? 'from-blue-900/40' :
        variant === 'nature' ? 'from-emerald-900/40' : ''
      }`} />
    </div>
  );
};

export default Atmosphere;
