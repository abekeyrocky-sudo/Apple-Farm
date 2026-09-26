import React, { useState, useEffect } from 'react';
import { X, Check, Lock, Sparkles, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import { soundManager } from '../utils/soundManager';

export const DAILY_REWARDS = [
  { day: 1, type: 'apple', amount: 500, label: '500 Apples' },
  { day: 2, type: 'apple', amount: 1000, label: '1,000 Apples' },
  { day: 3, type: 'diamond', amount: 1, label: '1 Diamond' },
  { day: 4, type: 'apple', amount: 2000, label: '2,000 Apples' },
  { day: 5, type: 'diamond', amount: 3, label: '3 Diamonds' },
  { day: 6, type: 'apple', amount: 3500, label: '3,500 Apples' },
  { day: 7, type: 'diamond', amount: 5, label: '5 Diamonds', isSpecial: true },
];

const STORAGE_KEY = 'apple_farm_daily_reward_state_v1';

export const getDailyRewardStatus = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();

    if (!raw) {
      return {
        currentDay: 1,
        lastClaimDate: null,
        canClaimToday: true,
        streakMissed: false
      };
    }

    const data = JSON.parse(raw);
    const lastDateStr = data.lastClaimDate;

    if (!lastDateStr) {
      return {
        currentDay: 1,
        lastClaimDate: null,
        canClaimToday: true,
        streakMissed: false
      };
    }

    const todayDate = new Date(today);
    const lastDate = new Date(lastDateStr);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already claimed today
      return {
        currentDay: data.currentDay || 1,
        lastClaimDate: lastDateStr,
        canClaimToday: false,
        streakMissed: false
      };
    } else if (diffDays === 1) {
      // Consecutive next day
      const nextDay = (data.currentDay >= 7) ? 1 : (data.currentDay + 1);
      return {
        currentDay: nextDay,
        lastClaimDate: lastDateStr,
        canClaimToday: true,
        streakMissed: false
      };
    } else {
      // Missed 1 or more days -> Reset to Day 1
      return {
        currentDay: 1,
        lastClaimDate: lastDateStr,
        canClaimToday: true,
        streakMissed: true
      };
    }
  } catch (e) {
    return {
      currentDay: 1,
      lastClaimDate: null,
      canClaimToday: true,
      streakMissed: false
    };
  }
};

export default function DailyRewardModal({ isOpen, onClose, onClaimReward }) {
  const [status, setStatus] = useState(getDailyRewardStatus);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus(getDailyRewardStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDay = status.currentDay;
  const canClaim = status.canClaimToday;
  const activeReward = DAILY_REWARDS.find(r => r.day === currentDay) || DAILY_REWARDS[0];

  const handleClaim = () => {
    if (!canClaim || isClaiming) return;
    setIsClaiming(true);

    soundManager.playSuccessSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const today = new Date().toDateString();
    const nextState = {
      currentDay: currentDay,
      lastClaimDate: today
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (e) {}

    setStatus({
      currentDay: currentDay,
      lastClaimDate: today,
      canClaimToday: false,
      streakMissed: false
    });

    if (onClaimReward) {
      onClaimReward(activeReward);
    }

    setTimeout(() => {
      setIsClaiming(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in select-none">
      <div 
        className="relative w-full max-w-[340px] bg-gradient-to-b from-[#f0fbf2] via-white to-[#e6f7ec] rounded-3xl p-4 shadow-[0_16px_50px_rgba(0,0,0,0.35)] border-2 border-white/90 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decorative glows */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-300/25 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors active:scale-90 z-10"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Header Title & Subtitle */}
        <div className="text-center pt-1 pb-1.5">
          <h2 className="text-xl font-black text-[#152e4d] tracking-tight leading-tight">
            Daily Check-in
          </h2>
          <p className="text-[11px] font-bold text-slate-500 mt-0.5 leading-tight">
            Claim your daily bonus! Don't miss a day or streak resets.
          </p>

          {status.streakMissed && (
            <div className="mt-1.5 inline-block px-2.5 py-0.5 bg-rose-50 border border-rose-200 rounded-full text-[10px] font-bold text-rose-600 animate-pulse">
              ⚠️ Missed a day! Reset to Day 1
            </div>
          )}
        </div>

        {/* 7-Days Reward Cards Grid */}
        <div className="grid grid-cols-3 gap-2 my-1.5">
          {DAILY_REWARDS.slice(0, 6).map((item) => {
            const isClaimed = item.day < currentDay || (item.day === currentDay && !canClaim);
            const isToday = item.day === currentDay && canClaim;
            const isLocked = item.day > currentDay;

            return (
              <div
                key={item.day}
                className={`relative rounded-xl p-1.5 py-2 flex flex-col items-center justify-between border transition-all ${
                  isToday
                    ? 'bg-gradient-to-b from-amber-50 to-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-400/40 scale-[1.02]'
                    : isClaimed
                    ? 'bg-slate-50/80 border-slate-200 opacity-65'
                    : 'bg-white/90 border-slate-200/80'
                }`}
              >
                {/* Day Badge */}
                <span className={`text-[9px] font-black tracking-wide uppercase px-1.5 py-0.2 rounded-full ${
                  isToday 
                    ? 'bg-emerald-500 text-white shadow-xs' 
                    : isClaimed 
                    ? 'bg-slate-200 text-slate-600' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  Day {item.day}
                </span>

                {/* Reward Image */}
                <div className="my-1 relative flex items-center justify-center">
                  <img 
                    src={item.type === 'diamond' ? diamondImg : appleImg} 
                    alt={item.type}
                    className={`w-7 h-7 object-contain filter drop-shadow-xs ${
                      isToday ? 'scale-105' : ''
                    } ${isLocked ? 'grayscale-[0.2]' : ''}`}
                  />
                  {isClaimed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </div>
                  )}
                  {isLocked && (
                    <div className="absolute -top-1 -right-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Amount Label */}
                <span className={`text-[11px] font-black leading-tight ${
                  isToday ? 'text-emerald-700 font-black' : isClaimed ? 'text-slate-400' : 'text-[#1c355e]'
                }`}>
                  {item.type === 'diamond' ? `+${item.amount} 💎` : `+${item.amount.toLocaleString()}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Day 7 Special Jackpot Card (Full Width Slim) */}
        {(() => {
          const day7 = DAILY_REWARDS[6];
          const isClaimed7 = 7 < currentDay || (7 === currentDay && !canClaim);
          const isToday7 = 7 === currentDay && canClaim;
          const isLocked7 = 7 > currentDay;

          return (
            <div 
              className={`relative rounded-xl p-2 px-3 flex items-center justify-between border transition-all mt-1.5 ${
                isToday7
                  ? 'bg-gradient-to-r from-amber-100 via-amber-50 to-emerald-100 border-amber-400 shadow-md ring-2 ring-amber-400/50 scale-[1.01]'
                  : isClaimed7
                  ? 'bg-slate-50 border-slate-200 opacity-65'
                  : 'bg-gradient-to-r from-amber-50/80 to-yellow-50/80 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-amber-300 via-orange-400 to-amber-500 flex items-center justify-center shadow-xs flex-shrink-0">
                  <img 
                    src={diamondImg} 
                    alt="Day 7 Diamond" 
                    className="w-6 h-6 object-contain filter drop-shadow-xs"
                  />
                  {isClaimed7 && (
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-full">
                      Day 7 Jackpot
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-600 fill-amber-400" />
                  </div>
                  <h4 className="text-xs font-black text-[#183153] mt-0.5 leading-none">
                    +5 Diamonds
                  </h4>
                </div>
              </div>

              <div>
                {isClaimed7 ? (
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-200 px-2 py-0.8 rounded-lg">Claimed</span>
                ) : isToday7 ? (
                  <span className="text-[11px] font-black text-white bg-amber-500 px-2 py-0.8 rounded-lg shadow-xs">Ready!</span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </div>
          );
        })()}

        {/* Claim Action Button (Slim & Just "Claim") */}
        <div className="mt-3">
          {canClaim ? (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2ecc71] via-[#27ae60] to-[#1e824c] hover:brightness-105 active:scale-95 text-white font-black text-sm shadow-[0_3px_0_#145a32] border-t border-emerald-300 transition-all flex items-center justify-center gap-1.5"
            >
              <Gift className="w-4 h-4 text-white" />
              <span>Claim</span>
            </button>
          ) : (
            <button
              disabled={true}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-extrabold text-xs border border-slate-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <span>Claimed</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
