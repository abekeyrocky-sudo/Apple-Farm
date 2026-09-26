import React, { useState, useEffect } from 'react';
import splashImg from '../../assets/splash.svg';
import homeBgImg from '../../assets/home-page-background.png';
import spinBgImg from '../../assets/spin-screen-background.png';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import gramImg from '../../assets/gram.png';
import bksImg from '../../assets/bks.png';
import inviteBannerImg from '../../assets/invite-banner.png';

export default function SplashScreen({ onLoaded }) {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 🚀 Background Preload critical game assets
    const preloadAssets = [
      homeBgImg,
      spinBgImg,
      appleImg,
      diamondImg,
      gramImg,
      bksImg,
      inviteBannerImg,
    ];

    preloadAssets.forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });

    const startTime = Date.now();
    const DURATION = 5000; // ⏱️ Exactly 5.0 Seconds Loading

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.floor((elapsed / DURATION) * 100));
      setProgress(currentPct);

      if (currentPct >= 100) {
        clearInterval(timer);
        setIsReady(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      }
    }, 40);

    return () => clearInterval(timer);
  }, []);

  const handleStart = () => {
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.expand?.();
        window.Telegram.WebApp.requestFullscreen?.();
      } catch (e) {
        // ignore
      }
    }
    if (onLoaded) onLoaded();
  };

  return (
    <div 
      className="relative w-full max-w-md mx-auto min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-end items-center pb-10 px-6 select-none font-sans overflow-hidden"
      style={{ backgroundImage: `url(${splashImg})` }}
    >
      {/* ----------------- BOTTOM INTERACTION / LOADING CONTAINER ----------------- */}
      <div className="w-full flex flex-col items-center justify-center min-h-[56px] z-20">
        
        {!isReady ? (
          <>
            {/* Compact Elegant Dark Capsule Track */}
            <div className="w-[56%] max-w-[200px] h-[18px] rounded-full bg-[#122e16]/90 border-[1.5px] border-[#FFEAA0] p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.4)] relative flex items-center overflow-hidden">
              
              {/* Inner Glossy Green Progress Fill */}
              <div 
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-[#16a34a] via-[#4ade80] to-[#86efac] rounded-full transition-all duration-200 shadow-[0_0_8px_rgba(74,222,128,0.7)] relative overflow-hidden flex items-center"
              >
                {/* Top Glossy Highlight Reflection */}
                <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/75 to-transparent rounded-full pointer-events-none" />
              </div>

            </div>

            {/* Loading Percentage Text Centered Below Bar */}
            <p className="text-[11px] font-black text-[#321a04] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] tracking-wider mt-1">
              Loading... {progress}%
            </p>
          </>
        ) : (
          /* Ready Button to Open the App - Clean Borderless Glossy 3D Design */
          <button
            onClick={handleStart}
            className="w-[64%] max-w-[230px] py-3 px-6 rounded-full bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_5px_0_#14532d,0_8px_20px_rgba(0,0,0,0.35)] hover:brightness-110 active:translate-y-1 active:shadow-[0_1px_0_#14532d] transition-transform duration-100 flex items-center justify-center relative overflow-hidden cursor-pointer"
          >
            {/* Top Gloss Highlight */}
            <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/35 to-transparent rounded-full pointer-events-none" />
            <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">START NOW</span>
          </button>
        )}

      </div>

    </div>
  );
}

