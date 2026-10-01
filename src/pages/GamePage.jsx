import React, { useState, useEffect } from 'react';
import { Sparkles, UserPlus, Gift, AlertCircle, Ticket, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';
import spinBgImg from '../../assets/spin-screen-background.png';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';
import FallingLeaves from '../components/FallingLeaves';
import { soundManager } from '../utils/soundManager';
import { getStoredJson, setStoredJson } from '../utils/userStorage';

// রেফারেন্স ইমেজের হুবহু স্লাইস ডাটা
const SLICES = [
  { id: 1, type: 'diamond', label: '500', color: '#00A3FF' },
  { id: 2, type: 'apple', label: '100', color: '#FF5E87' },
  { id: 3, type: 'apple', label: '500', color: '#FFCA28' },
  { id: 4, type: 'apple', label: '1000', color: '#A855F7' },
  { id: 5, type: 'box', label: 'Box', color: '#00D2D3' },
  { id: 6, type: 'apple', label: '300', color: '#EF4444' },
  { id: 7, type: 'apple', label: '10K', value: 10000, color: '#FBBF24' },
];

const BASE_SPIN_KEY = 'apple_farm_spin_state_v3';

export default function GamePage({ user, onNavigate, onWinReward, onUpdateUser, onShowPopup }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winMessage, setWinMessage] = useState(null);

  // স্পিন স্টেট লোড
  const [spinData, setSpinData] = useState(() => {
    return getStoredJson(BASE_SPIN_KEY, user?.id, {
      lastFreeSpinDate: null,
      usedInviteSpins: 0,
    });
  });

  // ইউজার পরিবর্তন হলে স্পিন ডাটা সিঙ্ক
  useEffect(() => {
    if (!user?.id) return;
    const data = getStoredJson(BASE_SPIN_KEY, user.id, {
      lastFreeSpinDate: null,
      usedInviteSpins: 0,
    });
    setSpinData(data);
  }, [user?.id]);

  const today = new Date().toDateString();
  const isFreeAvailable = spinData.lastFreeSpinDate !== today;

  // ভাউচার স্পিন (মার্কেট থেকে কেনা)
  const voucherSpins = Number(user?.spinVouchers || 0);

  // মোট রেফারেল সংখ্যা
  const totalInvited = Array.isArray(user?.invitedFriends) 
    ? user.invitedFriends.length 
    : (user?.referralsCount || user?.invitedCount || 0);

  // অতিরিক্ত রেফারেল স্পিন
  const availableInviteSpins = Math.max(0, totalInvited - (spinData.usedInviteSpins || 0));
  
  // স্পিন অবশিষ্ট আছে কি না
  const hasSpins = isFreeAvailable || voucherSpins > 0 || availableInviteSpins > 0;

  // স্পিন লজিক ও অ্যানিমেশন
  const handleSpin = () => {
    if (spinning) return;

    // কোনো স্পিন না থাকলে প্রম্পট
    if (!hasSpins) {
      soundManager.playClickSound();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }

      if (onShowPopup) {
        onShowPopup({
          type: 'info',
          title: 'No Spins Left',
          message: 'Get 50 extra spins voucher from Market or invite friends to get +1 spin per referral!',
          confirmText: 'Get 50x Voucher',
          cancelText: 'Invite Friends',
          onConfirm: () => onNavigate?.('market', { marketTab: 'Items' }),
          onCancel: () => onNavigate?.('invite')
        });
      } else {
        onNavigate?.('market', { marketTab: 'Items' });
      }
      return;
    }

    setSpinning(true);
    setWinMessage(null);

    // Initial click sound
    soundManager.playClickSound();

    // Telegram Haptic Feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // স্পিন স্টেট কনজিউম করা (Free -> Voucher -> Invite)
    let nextState = { ...spinData };
    if (isFreeAvailable) {
      nextState.lastFreeSpinDate = today;
    } else if (voucherSpins > 0) {
      const nextVouchers = Math.max(0, voucherSpins - 1);
      if (onUpdateUser) {
        onUpdateUser({ spinVouchers: nextVouchers });
      }
    } else {
      nextState.usedInviteSpins = (spinData.usedInviteSpins || 0) + 1;
    }

    setSpinData(nextState);
    setStoredJson(BASE_SPIN_KEY, user?.id, nextState);

    // Spin Tick Sounds
    let ticks = 0;
    const tickInterval = setInterval(() => {
      ticks++;
      soundManager.playSpinTick();
      if (ticks > 24) {
        clearInterval(tickInterval);
      }
    }, 140);

    // 🎯 Probabilities:
    // Index 6 (10K Apples): exactly 5%
    // Index 4 (Mystery Box: 100-1000 Apples + 0.1-3 Diamonds): 15%
    // Index 3 (1000 Apples): 20%
    // Index 5 (300 Apples): 15%
    // Index 2 (500 Apples): 5%
    // Index 1 (100 Apples): 40%
    // Index 0 (500 Diamonds): 0%
    const rand = Math.random() * 100;
    let targetIndex;
    if (rand < 5) {
      targetIndex = 6; // 10K Apples (5% chance)
    } else if (rand < 20) {
      targetIndex = 4; // Mystery Box (15%)
    } else if (rand < 40) {
      targetIndex = 3; // 1000 Apples (20%)
    } else if (rand < 55) {
      targetIndex = 5; // 300 Apples (15%)
    } else if (rand < 60) {
      targetIndex = 2; // 500 Apples (5%)
    } else {
      targetIndex = 1; // 100 Apples (40%)
    }

    // হুইল অ্যাঙ্গেল ক্যালকুলেশন (৭টি স্লাইসের টপ পয়েন্টারে ল্যান্ড করার জন্য)
    const sliceSize = 360 / SLICES.length;
    const sliceCenterAngle = (targetIndex * sliceSize) + (sliceSize / 2);
    const jitter = (Math.random() - 0.5) * (sliceSize * 0.35); // স্লাইসের নিরাপদ মাঝখানে
    const targetPointerAngle = (sliceCenterAngle + jitter + 360) % 360;
    const stopDeg = (360 - targetPointerAngle + 360) % 360;
    const extraRounds = (5 + Math.floor(Math.random() * 2)) * 360;
    const currentMod = rotation % 360;
    const totalRotation = rotation + (360 - currentMod) + extraRounds + stopDeg;

    setRotation(totalRotation);

    // ৪ সেকেন্ড পর রেজাল্ট
    setTimeout(() => {
      clearInterval(tickInterval);
      setSpinning(false);

      // বিজয়ী সাউন্ড
      soundManager.playSuccessSound();

      // বিজয়ী আইটেম
      let wonItem = { ...SLICES[targetIndex] };
      if (wonItem.type === 'box') {
        // Random 100 to 1000 Apples
        const possibleApples = [100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000];
        const randomApples = possibleApples[Math.floor(Math.random() * possibleApples.length)];
        
        // Random 0.1 to 3 Diamonds
        const possibleDiamonds = [0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0];
        const randomDiamonds = possibleDiamonds[Math.floor(Math.random() * possibleDiamonds.length)];

        wonItem.boxApples = randomApples;
        wonItem.boxDiamonds = randomDiamonds;
      }

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
      {/* 🍃 Farm Falling Leaves Animation (Background Layer - under the wheel) */}
      <FallingLeaves count={8} zIndex="z-0" />
      
      {/* ----------------- TOP TITLE ----------------- */}
      <div className="pt-2 px-4 z-20 text-center relative">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <h1 className="text-xl font-black text-[#192f52] tracking-tight drop-shadow-sm mt-1">
          Spin & Win
        </h1>
        
        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full bg-white/90 backdrop-blur-md shadow-xs border border-amber-200">
          {isFreeAvailable ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
              <span className="text-xs font-black text-emerald-700">1 Daily Free Spin Available</span>
            </>
          ) : voucherSpins > 0 ? (
            <>
              <Ticket className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span className="text-xs font-black text-amber-700">{voucherSpins} Voucher Spin{voucherSpins > 1 ? 's' : ''} Left</span>
            </>
          ) : availableInviteSpins > 0 ? (
            <>
              <UserPlus className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-black text-blue-700">{availableInviteSpins} Invite Spin{availableInviteSpins > 1 ? 's' : ''} Left</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-black text-amber-800">50x Voucher</span>
            </>
          )}
        </div>
      </div>

      {/* ----------------- LUCKY WHEEL SECTION (z-20 sits on top of falling background) ----------------- */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 z-20">
        
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
                    {slice.type === 'box' ? (
                      <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border border-amber-700 shadow-sm flex items-center justify-center filter drop-shadow">
                        <Gift className="w-3.5 h-3.5 text-amber-950 stroke-[2.8]" />
                      </div>
                    ) : (
                      <img 
                        src={slice.type === 'diamond' ? diamondImg : appleImg} 
                        alt={slice.type} 
                        className="w-5 h-5 object-contain filter drop-shadow" 
                      />
                    )}
                    <span className="text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
                      {slice.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Center Hub Button (Still) */}
            <button
              onClick={handleSpin}
              disabled={spinning}
              className={`absolute z-20 w-16 h-16 rounded-full border-4 border-amber-300 shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center text-white font-black text-xs active:scale-95 transition-transform ${
                isFreeAvailable
                  ? 'bg-gradient-to-tr from-[#10b981] to-[#34d399]'
                  : voucherSpins > 0
                  ? 'bg-gradient-to-tr from-[#f59e0b] via-[#ea580c] to-[#e11d48]'
                  : hasSpins
                  ? 'bg-gradient-to-tr from-[#2563EB] to-[#60A5FA]'
                  : 'bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24]'
              }`}
            >
              {spinning ? '...' : isFreeAvailable ? 'FREE' : hasSpins ? 'SPIN' : 'GET SPINS'}
            </button>

          </div>
        </div>

        {/* Win Alert Badge */}
        {winMessage && (
          <div className="absolute top-2 bg-white/95 border-2 border-emerald-400 text-emerald-800 text-xs font-black px-4 py-1.5 rounded-full shadow-lg animate-bounce flex items-center gap-1.5 z-30">
            {winMessage.type === 'box' ? (
              <>
                <span>🎁 Mystery Box:</span>
                <span className="text-emerald-700 font-extrabold">+{winMessage.boxApples} 🍎</span>
                <span className="text-sky-600 font-extrabold">& +{winMessage.boxDiamonds} 💎</span>
              </>
            ) : (
              <>
                <span>You Won {winMessage.label}</span>
                <img 
                  src={winMessage.type === 'diamond' ? diamondImg : appleImg} 
                  alt={winMessage.type} 
                  className="w-4 h-4 object-contain inline" 
                />
                <span>{winMessage.type === 'apple' ? 'Apples!' : 'Diamonds!'}</span>
              </>
            )}
          </div>
        )}

        {/* Large Action Button Below Wheel */}
        <button
          onClick={handleSpin}
          disabled={spinning}
          className={`mt-6 px-12 py-3.5 rounded-2xl font-black text-sm text-white shadow-[0_4px_0_rgba(0,0,0,0.25)] border-t border-white/40 transition-all flex items-center justify-center cursor-pointer ${
            spinning
              ? 'bg-gray-400 cursor-not-allowed'
              : isFreeAvailable
              ? 'bg-gradient-to-b from-[#2ecc71] via-[#27ae60] to-[#1e8a4a] hover:brightness-105 active:scale-95 shadow-[0_4px_0_#145a32]'
              : voucherSpins > 0
              ? 'bg-gradient-to-b from-[#f59e0b] via-[#ea580c] to-[#c2410c] hover:brightness-105 active:scale-95 shadow-[0_4px_0_#9a3412]'
              : hasSpins
              ? 'bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] hover:brightness-105 active:scale-95 shadow-[0_4px_0_#1e3a8a]'
              : 'bg-gradient-to-b from-[#0098EA] to-[#0077c2] hover:brightness-105 active:scale-95 shadow-[0_4px_0_#005b94]'
          }`}
        >
          {spinning ? (
            'SPINNING...'
          ) : isFreeAvailable ? (
            'FREE SPIN'
          ) : voucherSpins > 0 ? (
            `SPIN (${voucherSpins} Voucher${voucherSpins > 1 ? 's' : ''} Left)`
          ) : hasSpins ? (
            `SPIN (${availableInviteSpins} Left)`
          ) : (
            'Get 50x Spin Voucher'
          )}
        </button>

        {/* ----------------- 50x VOUCHER & INVITE BANNER ----------------- */}
        <div 
          onClick={() => voucherSpins === 0 ? onNavigate?.('market', { marketTab: 'Items' }) : onNavigate?.('invite')}
          className="w-full bg-[#FFFDF0]/95 backdrop-blur-md rounded-3xl p-3 px-4 border border-amber-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-between mt-4 cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-200 to-yellow-100 border border-amber-300 flex items-center justify-center text-amber-700 filter drop-shadow-sm flex-shrink-0">
              {voucherSpins > 0 ? <Ticket className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-[#192f52] leading-tight flex items-center gap-1.5">
                {voucherSpins > 0 ? (
                  <>
                    <span>{voucherSpins} Vouchers Available</span>
                    <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full">Active</span>
                  </>
                ) : (
                  <>
                    <span>50x Spin Voucher</span>
                    <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full">Best Deal</span>
                  </>
                )}
              </h3>
              <p className="text-xs font-bold text-[#567396] mt-0.5">
                {voucherSpins > 0 
                  ? 'Keep spinning to win huge Diamonds and Apples!' 
                  : 'Get 50 spins instantly or invite friends for free spins!'}
              </p>
            </div>
          </div>

          <div className="text-[#10b981] flex-shrink-0">
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
