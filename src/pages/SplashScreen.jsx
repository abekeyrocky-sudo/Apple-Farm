import React, { useState, useEffect } from 'react';
import appleImg from '../../assets/apple.png';

export default function SplashScreen({ onLoaded }) {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onLoaded) onLoaded();
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onLoaded]);

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#7fe0fb] via-[#c6f3ff] to-[#5ec228] flex flex-col justify-between items-center p-6 select-none font-sans overflow-hidden">
      
      {/* Top Leaves Decoration */}
      <div className="absolute top-0 left-0 text-5xl opacity-90 transform -rotate-12 pointer-events-none">
        🌿
      </div>
      <div className="absolute top-0 right-0 text-5xl opacity-90 transform rotate-12 pointer-events-none">
        🌿
      </div>

      {/* Floating Sparkles & Clouds */}
      <div className="absolute top-12 left-8 w-16 h-7 bg-white/70 rounded-full blur-[1px] animate-pulse" />
      <div className="absolute top-20 right-8 w-20 h-8 bg-white/80 rounded-full blur-[1px]" />

      {/* ----------------- TITLE AREA ----------------- */}
      <div className="pt-10 flex flex-col items-center z-10">
        
        {/* Stylized Bubble Logo "Apple Farm" */}
        <div className="relative flex flex-col items-center">
          <div className="text-5xl sm:text-6xl font-black text-[#FFE600] tracking-wider drop-shadow-[0_4px_0_#D97706] stroke-text filter drop-shadow-[0_8px_16px_rgba(217,119,6,0.5)] transform -rotate-1">
            Apple
          </div>
          <div className="text-4xl sm:text-5xl font-black text-[#4ADE80] tracking-wider drop-shadow-[0_4px_0_#15803D] -mt-2 transform rotate-1">
            Farm
          </div>
        </div>

        {/* Subtitle Pill */}
        <div className="mt-2 bg-[#1b4332]/40 backdrop-blur-sm border border-white/30 text-white font-extrabold text-xs px-4 py-1 rounded-full tracking-widest uppercase shadow-sm">
          GROW • HARVEST • EARN
        </div>

      </div>

      {/* ----------------- 3D GLOSSY HERO APPLE ----------------- */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        
        {/* Sunburst background glow */}
        <div className="absolute w-64 h-64 rounded-full bg-gradient-radial from-amber-200/60 to-transparent animate-spin-slow pointer-events-none" />

        {/* Big Juicy 3D Apple (Actual PNG Image) */}
        <div className="relative z-10 transform hover:scale-105 active:scale-95 transition-transform cursor-pointer animate-bounce-gentle">
          <img 
            src={appleImg} 
            alt="Hero Apple"
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain filter drop-shadow-[0_15px_25px_rgba(185,28,28,0.45)]"
          />
        </div>

        {/* Floating Orchard Leaves */}
        <div className="absolute -left-6 top-8 text-2xl animate-float">🍃</div>
        <div className="absolute -right-6 top-12 text-2xl animate-float delay-300">🍃</div>

        {/* Farm Wooden Fence Silhouette at bottom */}
        <div className="w-full flex justify-center gap-6 mt-4 opacity-75">
          <div className="text-3xl">🏡</div>
          <div className="text-3xl">🌳</div>
          <div className="text-3xl">🌻</div>
        </div>

      </div>

      {/* ----------------- LOADING PROGRESS BAR ----------------- */}
      <div className="w-full pb-8 z-10 flex flex-col items-center">
        
        {/* Yellow/Golden Frame Progress Bar */}
        <div className="w-4/5 h-8 rounded-full bg-[#FFF9D2] border-4 border-[#FBBF24] p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] relative overflow-hidden flex items-center">
          
          {/* Green Gradient Fill */}
          <div 
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#16a34a] rounded-full transition-all duration-200 shadow-inner flex items-center justify-end pr-2"
          />

          {/* Centered Loading Text */}
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#1b4332] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">
            Loading... {progress}%
          </span>

        </div>

      </div>

    </div>
  );
}
