import React, { useMemo } from 'react';

export default function FallingLeaves({ count = 10 }) {
  // Generate random positioning and timing for each leaf
  const leaves = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const left = Math.random() * 95; // 0% to 95% across screen
      const duration = 6 + Math.random() * 6; // 6s to 12s fall time
      const delay = Math.random() * 8; // 0s to 8s start delay
      const size = 16 + Math.random() * 12; // 16px to 28px size
      const opacity = 0.55 + Math.random() * 0.35; // 0.55 to 0.9 opacity
      const swayDuration = 2.5 + Math.random() * 2;
      const rotationStart = Math.floor(Math.random() * 360);

      return {
        id: i,
        left: `${left}%`,
        duration: `${duration.toFixed(2)}s`,
        delay: `${delay.toFixed(2)}s`,
        size,
        opacity,
        swayDuration: `${swayDuration.toFixed(2)}s`,
        rotationStart,
      };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 select-none">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute -top-8 animate-leaf-fall"
          style={{
            left: leaf.left,
            animationDuration: leaf.duration,
            animationDelay: leaf.delay,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
          }}
        >
          {/* Inner swaying wrapper for realistic drift */}
          <div
            className="animate-leaf-sway"
            style={{
              animationDuration: leaf.swayDuration,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }}
          >
            <svg
              width={leaf.size}
              height={leaf.size}
              viewBox="0 0 24 24"
              fill="none"
              style={{
                opacity: leaf.opacity,
                transform: `rotate(${leaf.rotationStart}deg)`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
              }}
            >
              {/* Natural Curved Green Leaf Vector */}
              <path
                d="M17 3C17 3 13.5 4.5 10 9C6.5 13.5 5 18 5 18C5 18 9.5 17.5 14 14C18.5 10.5 20 7 20 7C20 7 19 6 17 3Z"
                fill="url(#leafGrad)"
                stroke="#15803d"
                strokeWidth="0.75"
              />
              <path
                d="M5 18C8 14 12 10 17 7"
                stroke="#86efac"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="leafGrad" x1="5" y1="18" x2="20" y2="3" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22c55e" />
                  <stop offset="0.5" stopColor="#4ade80" />
                  <stop offset="1" stopColor="#a3e635" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
