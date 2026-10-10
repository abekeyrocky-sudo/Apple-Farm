import React, { useState } from 'react';
import { Bot, Sparkles, Check, Clock, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import appleImg from '../../assets/apple.png';
import { soundManager } from '../utils/soundManager';
import { formatApples } from '../utils/formatNumber';

export default function AutoBotClaimModal({ 
  isOpen, 
  onClose, 
  offlineHarvest = { pendingApples: 0, offlineMinutes: 0 },
  onClaim 
}) {
  const [isClaiming, setIsClaiming] = useState(false);

  if (!isOpen || !offlineHarvest.pendingApples) return null;

  const handleClaim = () => {
    if (isClaiming) return;
    setIsClaiming(true);

    soundManager.playSuccessSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });

    if (onClaim) {
      onClaim(offlineHarvest.pendingApples);
    }

    setTimeout(() => {
      setIsClaiming(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
      <div 
        className="relative w-full max-w-[340px] bg-gradient-to-b from-[#fdfefe] via-[#f4f9ff] to-[#eaf4fd] rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,100,200,0.22)] border border-sky-100 overflow-hidden transform transition-all animate-scale-up text-center text-[#192f52]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Background Ring */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Robot Avatar Icon with Animated Sparkles */}
        <div className="relative mx-auto w-20 h-20 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-emerald-400 rounded-3xl rotate-6 blur-sm opacity-50 animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-b from-sky-400 to-blue-600 rounded-2xl border-2 border-white shadow-md flex items-center justify-center">
            <Bot className="w-11 h-11 text-white stroke-[2.2] animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-md">
            <Sparkles className="w-4 h-4 fill-amber-200" />
          </div>
        </div>

        {/* Title & Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-200 rounded-full text-sky-700 text-xs font-black mb-2 shadow-xs">
          <Zap className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
          <span>Auto-Farmer Bot Online</span>
        </div>

        <h3 className="text-xl font-black text-[#192f52] tracking-tight">
          Welcome Back, Farmer!
        </h3>
        <p className="text-xs font-bold text-[#567396] mt-1 mb-4">
          Your Auto-Harvest Bot was hard at work while you were away.
        </p>

        {/* Harvest Summary Card */}
        <div className="bg-white/95 border border-sky-100 rounded-2xl p-3.5 mb-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#567396] border-b border-sky-100 pb-2 mb-2 font-bold">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>Offline Time:</span>
            </span>
            <span className="font-black text-[#192f52]">
              {offlineHarvest.offlineMinutes < 60 
                ? `${offlineHarvest.offlineMinutes} minutes` 
                : `${(offlineHarvest.offlineMinutes / 60).toFixed(1)} hours`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#567396] font-black">Total Apples Collected:</span>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shadow-xs">
              <img src={appleImg} alt="Apples" className="w-5 h-5 object-contain filter drop-shadow-xs" />
              <span className="text-base font-black text-emerald-600">
                +{formatApples(offlineHarvest.pendingApples)}
              </span>
            </div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={isClaiming}
          className="w-full py-3.5 bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-black text-sm rounded-2xl shadow-[0_4px_0_#145a32] border-t border-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isClaiming ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Claim to Balance</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
