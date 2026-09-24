import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import spinBgImg from '../../assets/spin-screen-background.png';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';
import FallingLeaves from '../components/FallingLeaves';
import { soundManager } from '../utils/soundManager';

// রেফারেন্স ইমেজের হুবহু স্লাইস ডাটা
const SLICES = [
  { id: 1, type: 'diamond', label: '500', color: '#00A3FF' },
  { id: 2, type: 'apple', label: '100', color: '#FF5E87' },
  { id: 3, type: 'apple', label: '500', color: '#FFCA28' },
  { id: 4, type: 'apple', label: '200', color: '#A855F7' },
  { id: 5, type: 'apple', label: '200', color: '#00D2D3' },
  { id: 6, type: 'apple', label: '300', color: '#EF4444' },
  { id: 7, type: 'apple', label: '500', color: '#FBBF24' },
];

export default function GamePage({ onNavigate, onWinReward }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winMessage, setWinMessage] = useState(null);

  // স্পিন লজিক ও অ্যানিমেশন
  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setWinMessage(null);

    // Initial click sound
    soundManager.playClickSound();

    // Telegram Haptic Feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // Spin Tick Sounds
    let ticks = 0;
    const tickInterval = setInterval(() => {
      ticks++;
      soundManager.playSpinTick();
      if (ticks > 24) {
        clearInterval(tickInterval);
      }
    }, 140);

    // র্যান্ডম রোটেশন (কমপক্ষে ৫ চক্কর + র্যান্ডম অ্যাঙ্গেল)
    const extraRounds = 5 * 360;
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = rotation + extraRounds + randomAngle;

    setRotation(totalRotation);

    // ৪ সেকেন্ড পর রেজাল্ট
    setTimeout(() => {
      clearInterval(tickInterval);
      setSpinning(false);

      // বিজয়ী সাউন্ড
      soundManager.playSuccessSound();

      // বিজয়ী স্লাইস ক্যালকুলেশন
      const actualDeg = (totalRotation % 360);
      const sliceSize = 360 / SLICES.length;
      // টপ পয়েন্টারের সাপেক্ষে ইনডেক্স
      const winningIndex = Math.floor(((360 - actualDeg + (sliceSize / 2)) % 360) / sliceSize);
      const wonItem = SLICES[winningIndex] || SLICES[0];

      // কনফেটি ফায়ার
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      setWinMessage(wonItem);
      if (onWinReward) {
        onWinReward(wonItem);
      }
    }, 4000);
  };

  return (
    <div 
      style={{ backgroundImage: `url(${spinBgImg})` }}
      className="relative w-full max-w-md mx-auto min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-between select-none font-sans overflow-hidden"
    >
      {/* 🍃 Farm Falling Leaves Animation */}
      <FallingLeaves count={8} />
      
      {/* ----------------- TOP TITLE ----------------- */}
      <div className="pt-2 px-4 z-20 text-center relative">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <h1 className="text-xl font-black text-[#192f52] tracking-tight drop-shadow-sm mt-1">
          Spin & Win
        </h1>
      </div>

      {/* ----------------- LUCKY WHEEL SECTION ----------------- */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4">
        
        {/* The Wheel Container */}
        <div className="relative w-72 h-72 flex items-center justify-center">
          
          {/* Top Pointer (Arrow Indicator) */}
          <div className="absolute -top-3 z-30 flex flex-col items-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-2 border-amber-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-red-600" />
            </div>
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-amber-500 -mt-1" />
          </div>

          {/* Outer Golden Rim with Rivets/Screws */}
          <div className="absolute inset-0 rounded-full border-8 border-[#F59E0B] shadow-[0_8px_25px_rgba(0,0,0,0.25)] bg-gradient-to-tr from-[#D97706] via-[#FBBF24] to-[#B45309] flex items-center justify-center p-1">
            
            {/* 8 Rivets around border */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div
                key={deg}
                style={{ transform: `rotate(${deg}deg) translateY(-138px)` }}
                className="absolute w-2 h-2 rounded-full bg-white/90 border border-amber-800 shadow-sm"
              />
            ))}

            {/* Rotating Wheel Body */}
            <div
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
              }}
              className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center shadow-inner"
            >
              {/* SVG Slices */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {SLICES.map((slice, index) => {
                  const angle = 360 / SLICES.length;
                  const startAngle = index * angle;
                  const endAngle = (index + 1) * angle;

                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  return (
                    <path
                      key={slice.id}
                      d={pathData}
                      fill={slice.color}
                      stroke="#FFFFFF"
                      strokeWidth="0.8"
                    />
                  );
                })}
              </svg>

              {/* Slices Content (Apples, Diamonds & Numbers) */}
              {SLICES.map((slice, index) => {
                const angle = 360 / SLICES.length;
                const midAngle = index * angle + angle / 2;

                return (
                  <div
                    key={slice.id}
                    style={{
                      transform: `rotate(${midAngle}deg) translateY(-85px)`,
                    }}
                    className="absolute flex flex-col items-center justify-center pointer-events-none"
                  >
                    <img 
                      src={slice.type === 'diamond' ? diamondImg : appleImg} 
                      alt={slice.type} 
                      className="w-5 h-5 object-contain filter drop-shadow" 
                    />
                    <span className="text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
                      {slice.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Center "SPIN" Hub Button */}
            <button
              onClick={handleSpin}
              disabled={spinning}
              className="absolute z-20 w-16 h-16 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] border-4 border-amber-300 shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center text-white font-black text-xs active:scale-95 transition-transform"
            >
              SPIN
            </button>

          </div>
        </div>

        {/* Win Alert Badge */}
        {winMessage && (
          <div className="absolute top-2 bg-white/95 border-2 border-emerald-400 text-emerald-800 text-xs font-black px-4 py-1.5 rounded-full shadow-lg animate-bounce flex items-center gap-1.5">
            <span>🎉 You Won {winMessage.label}</span>
            <img 
              src={winMessage.type === 'diamond' ? diamondImg : appleImg} 
              alt={winMessage.type} 
              className="w-4 h-4 object-contain inline" 
            />
            <span>{winMessage.type === 'apple' ? 'Apples!' : 'Diamonds!'}</span>
          </div>
        )}

        {/* Large Green "SPIN" Button Below Wheel */}
        <button
          onClick={handleSpin}
          disabled={spinning}
          className={`mt-6 px-14 py-3 rounded-2xl font-black text-lg text-white shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all ${
            spinning
              ? 'bg-gray-400 cursor-not-allowed shadow-[0_4px_0_#6b7280]'
              : 'bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 active:shadow-[0_1px_0_#145a32]'
          }`}
        >
          {spinning ? 'SPINNING...' : 'SPIN'}
        </button>

        {/* ----------------- NEW MINER BONUS CARD ----------------- */}
        <div 
          onClick={handleSpin}
          className="w-full bg-[#FFFDF0]/95 backdrop-blur-md rounded-3xl p-3 px-4 border border-amber-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-between mt-5 cursor-pointer active:scale-[0.99] transition-transform">
          
          <div className="flex items-center gap-3">
            {/* 3D Chest Graphic */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-200 to-yellow-100 border border-amber-300 flex items-center justify-center text-3xl filter drop-shadow-sm">
              🎁
            </div>
            <div>
              <h3 className="text-sm font-black text-[#192f52] leading-tight">
                New Miner Bonus
              </h3>
              <p className="text-xs font-bold text-[#567396]">
                Spin & get big rewards!
              </p>
            </div>
          </div>

          {/* Right Chevron */}
          <div className="text-[#10b981]">
            <svg className="w-5 h-5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <BottomNav currentTab="game" onNavigate={onNavigate} />

    </div>
  );
}
