import React, { useState } from 'react';
import confetti from 'canvas-confetti';

const PRIZES = [100, 500, 200, 300, 500, 200, 500, 100];

export default function SpinGame({ onWinBonus }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);

    const randomDegrees = 1800 + Math.floor(Math.random() * 360);
    const finalRotation = rotation + randomDegrees;
    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      onWinBonus(300); // বোনাস যোগ
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center space-y-4 py-2">
      <h2 className="text-xl font-black text-amber-900 tracking-wide">SPIN & WIN</h2>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute -top-2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-600 drop-shadow-md" />

        {/* The Wheel */}
        <div 
          style={{ 
            transform: `rotate(${rotation}deg)`, 
            transition: 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' 
          }}
          className="w-full h-full rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-300 via-rose-300 to-amber-200 shadow-xl overflow-hidden relative flex items-center justify-center"
        >
          {PRIZES.map((prize, idx) => (
            <div 
              key={idx} 
              style={{ transform: `rotate(${idx * 45}deg) translateY(-85px)` }}
              className="absolute font-black text-xs text-rose-800"
            >
              {prize} 🍎
            </div>
          ))}
        </div>

        {/* Center Spin Button */}
        <button 
          onClick={spinWheel}
          disabled={spinning}
          className="absolute z-10 w-16 h-16 rounded-full bg-gradient-to-b from-farm-light-green to-farm-green text-white font-black text-xs shadow-lg border-2 border-white active:scale-95 disabled:opacity-70 flex items-center justify-center"
        >
          {spinning ? '...' : 'SPIN'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl w-full text-center">
        <span className="text-xs font-bold text-amber-800">🎁 New Miner Bonus Available!</span>
      </div>
    </div>
  );
}
