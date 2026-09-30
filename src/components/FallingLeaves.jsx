import React, { useMemo } from 'react';

// 🍃 Natural Apple Tree Leaf (Glossy green gradient, realistic curved silhouette, stem & veins)
function GreenLeaf({ id, size }) {
  const gradId = `gLeaf_${id}`;
  return (
    <svg 
      width={size} 
      height={size * 1.3} 
      viewBox="0 0 32 42" 
      fill="none" 
      className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
    >
      <defs>
        <linearGradient id={gradId} x1="6" y1="40" x2="26" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="40%" stopColor="#22c55e" />
          <stop offset="85%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
      </defs>
      {/* Stem */}
      <path d="M16 40C15 36 15 32 16 28" stroke="#14532d" strokeWidth="1.6" strokeLinecap="round" />
      {/* Blade */}
      <path 
        d="M16 29C10 28 6 20 8 11C10 3 19 3 24 9C28 16 23 28 16 29Z" 
        fill={`url(#${gradId})`} 
        stroke="#166534" 
        strokeWidth="0.75" 
      />
      {/* Central Main Vein */}
      <path d="M16 28C16 21 15 13 14 6" stroke="#bbf7d0" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
      {/* Side Veins */}
      <path d="M15.8 21C18.5 20 21 21 22 20" stroke="#bbf7d0" strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
      <path d="M15.5 16C12.5 15 11 16 9.5 14.5" stroke="#bbf7d0" strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// 🍂 Golden Sunlit Leaf
function GoldenLeaf({ id, size }) {
  const gradId = `goldLeaf_${id}`;
  return (
    <svg 
      width={size} 
      height={size * 1.3} 
      viewBox="0 0 32 42" 
      fill="none" 
      className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="38" x2="24" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
      </defs>
      <path d="M16 40C15 36 15 32 16 28" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" />
      <path 
        d="M16 29C10 28 6 20 8 11C10 3 19 3 24 9C28 16 23 28 16 29Z" 
        fill={`url(#${gradId})`} 
        stroke="#a16207" 
        strokeWidth="0.75" 
      />
      <path d="M16 28C16 21 15 13 14 6" stroke="#fef9c3" strokeWidth="1.1" strokeLinecap="round" opacity="0.9" />
      <path d="M15.8 21C18.5 20 21 21 22 20" stroke="#fef9c3" strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
      <path d="M15.5 16C12.5 15 11 16 9.5 14.5" stroke="#fef9c3" strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// 🌸 Apple Blossom Petal
function Petal({ id, size }) {
  const gradId = `petal_${id}`;
  return (
    <svg 
      width={size} 
      height={size * 1.2} 
      viewBox="0 0 24 28" 
      fill="none" 
      className="filter drop-shadow-[0_2px_4px_rgba(244,114,182,0.15)]"
    >
      <defs>
        <linearGradient id={gradId} x1="12" y1="26" x2="12" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="55%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <path 
        d="M12 2C8 2 4 7 4 13C4 19 9 25 12 26C15 25 20 19 20 13C20 7 16 2 12 2Z" 
        fill={`url(#${gradId})`} 
        opacity="0.95" 
        stroke="#f472b6" 
        strokeWidth="0.5" 
      />
    </svg>
  );
}

// ✨ Golden Sun Pollen / Sparkle
function Sparkle({ size }) {
  return (
    <div 
      className="rounded-full bg-gradient-to-tr from-amber-300 via-yellow-200 to-white shadow-[0_0_8px_rgba(253,224,71,0.9)]"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}

export default function FallingLeaves({ count = 12, zIndex = 'z-0' }) {
  const particles = useMemo(() => {
    const types = ['green', 'green', 'golden', 'petal', 'sparkle'];
    const animTypes = ['animate-leaf-fall-1', 'animate-leaf-fall-2', 'animate-leaf-fall-3'];

    return Array.from({ length: count }, (_, i) => {
      const type = types[i % types.length];
      const left = 3 + Math.random() * 92; // 3% to 95%
      const duration = (type === 'sparkle' ? 7 : 9) + Math.random() * 8; // 9s to 17s gentle glide
      const delay = Math.random() * 12; // staggered launch
      const size = type === 'sparkle' 
        ? Math.floor(4 + Math.random() * 5) 
        : type === 'petal'
          ? Math.floor(13 + Math.random() * 6)
          : Math.floor(16 + Math.random() * 10);
      
      const animClass = type === 'sparkle' 
        ? 'animate-sparkle-fall' 
        : animTypes[i % animTypes.length];

      return {
        id: i,
        type,
        left: `${left}%`,
        duration: `${duration.toFixed(2)}s`,
        delay: `${delay.toFixed(2)}s`,
        size,
        animClass,
      };
    });
  }, [count]);

  return (
    <div 
      className={`absolute inset-0 pointer-events-none overflow-hidden ${zIndex} select-none`}
      style={{ perspective: '1000px' }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute -top-10 ${p.animClass}`}
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            transformStyle: 'preserve-3d',
          }}
        >
          {p.type === 'green' && <GreenLeaf id={p.id} size={p.size} />}
          {p.type === 'golden' && <GoldenLeaf id={p.id} size={p.size} />}
          {p.type === 'petal' && <Petal id={p.id} size={p.size} />}
          {p.type === 'sparkle' && <Sparkle size={p.size} />}
        </div>
      ))}
    </div>
  );
}
