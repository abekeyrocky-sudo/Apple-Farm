import React, { useState } from 'react';
import ThreeApple from '../components/ThreeApple';

export default function Mine({ user, onHarvestAction }) {
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [energy, setEnergy] = useState(100);

  const handleHarvest = (e) => {
    if (energy <= 0) return;
    
    // হ্যাপ্তিক ফিডব্যাক (Telegram Mini App Haptic API)
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    onHarvestAction();
    setEnergy((prev) => Math.max(0, prev - 1));

    // Floating +1 অ্যানিমেশন
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : 150;
    const y = e.clientY ? e.clientY - rect.top : 100;
    const id = Date.now() + Math.random();

    setFloatingTexts((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 800);
  };

  return (
    <div className="flex flex-col items-center relative select-none">
      <div className="text-center mt-2">
        <h2 className="text-lg font-black text-emerald-900">TAP TO HARVEST</h2>
        <p className="text-xs text-emerald-600 font-medium">Click the 3D Apple to collect</p>
      </div>

      {/* Three.js 3D Apple Scene */}
      <div className="relative w-full">
        <ThreeApple onHarvest={handleHarvest} />
        {floatingTexts.map((f) => (
          <span 
            key={f.id}
            style={{ left: `${f.x}px`, top: `${f.y}px` }}
            className="absolute pointer-events-none font-black text-xl text-red-600 drop-shadow-md animate-float-fade -translate-x-1/2 -translate-y-1/2 z-20"
          >
            +1 APPLE
          </span>
        ))}
      </div>

      {/* Energy / Progress bar */}
      <div className="w-full bg-white/90 p-3 rounded-2xl border border-emerald-100 shadow-sm mt-4">
        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span className="text-emerald-800">Keep Tapping...</span>
          <span className="text-emerald-600">{energy} / 100</span>
        </div>
        <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-emerald-200">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-farm-light-green rounded-full transition-all duration-150"
            style={{ width: `${energy}%` }}
          />
        </div>
      </div>
    </div>
  );
}
