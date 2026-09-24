import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';
import appleImg from '../../assets/apple.png';

export default function AirdropPage({ user, onBack, onNavigate }) {
  // Live ticking countdown: 08:09:17 style
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 9,
    seconds: 17
  });

  const currentApples = user?.apples || 0;
  const is50kReached = currentApples >= 50000;
  const invitedCount = user?.invitedFriends?.length || 2; // Default 2/5 or real data

  // Task completion states
  const [tasks, setTasks] = useState({
    wallet: true,       // 1. Verify Wallet
    followX: false,     // 2. Follow on X
    joinTg: false,      // 3. Join Community
    reach50kApples: is50kReached, // 4. Reach 50,000 APPLE
    inviteFriends: invitedCount,  // 5. Invite 5 Friends
  });

  const [claimed, setClaimed] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleTaskClick = (key) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (key === 'followX') {
      window.open('https://x.com', '_blank');
      setTimeout(() => {
        setTasks(prev => ({ ...prev, followX: true }));
        showToast('Follow on X verified!');
      }, 1200);
    } else if (key === 'joinTg') {
      window.open('https://t.me/AppleFarmCommunity', '_blank');
      setTimeout(() => {
        setTasks(prev => ({ ...prev, joinTg: true }));
        showToast('Joined Community verified!');
      }, 1200);
    } else if (key === 'invite') {
      onNavigate?.('invite');
    } else if (key === 'harvest') {
      onNavigate?.('home');
    }
  };

  // Calculate completed count
  const appleScore = is50kReached ? 1 : Math.min(1, currentApples / 50000);
  const inviteScore = tasks.inviteFriends >= 5 ? 1 : tasks.inviteFriends / 5;
  const completedCount = 
    (tasks.wallet ? 1 : 0) +
    (tasks.followX ? 1 : 0) +
    (tasks.joinTg ? 1 : 0) +
    appleScore +
    inviteScore;

  const progressPercent = Math.min(100, Math.round((completedCount / 5) * 100));

  const handleClaim = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    setClaimed(true);
    showToast('🎉 $APPLE Airdrop slot reserved successfully!');
  };

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#87e88b] via-[#a8f0ad] to-[#e4fbe7] flex flex-col justify-between select-none overflow-hidden font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1c324f] text-white text-xs font-black px-4 py-2.5 rounded-full shadow-2xl border border-white/20 animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div className="pt-2 px-4 pb-2 z-20">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="flex items-center justify-between relative mt-1">
          {/* Back Button */}
          <button
            onClick={onBack || (() => onNavigate?.('home'))}
            className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md shadow-sm border border-emerald-100 flex items-center justify-center text-[#1c324f] active:scale-90 transition-transform"
          >
            <svg className="w-6 h-6 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-extrabold text-[#1c355e] tracking-tight text-center flex-1 pr-10">
            Airdrop Hub
          </h1>
        </div>

        {/* Decorative Top Apples Floating */}
        <div className="flex justify-center -mb-7 mt-1 relative z-20">
          <div className="relative flex items-center justify-center">
            <img 
              src={appleImg} 
              alt="Apple Left" 
              className="w-14 h-14 object-contain filter drop-shadow-lg -rotate-12 translate-x-2"
            />
            <img 
              src={appleImg} 
              alt="Apple Right" 
              className="w-16 h-16 object-contain filter drop-shadow-xl rotate-12 -translate-x-2"
            />
          </div>
        </div>
      </div>

      {/* ----------------- MAIN WHITE AIRDROP CARD ----------------- */}
      <div className="flex-1 w-full pt-4 flex flex-col z-10 overflow-y-auto">
        <div className="bg-white rounded-t-[32px] sm:rounded-t-[36px] p-5 shadow-[0_-8px_30px_rgba(30,130,76,0.08)] border-t border-emerald-100 flex flex-col flex-1 w-full pb-6">
          
          {/* Header & Subtitle */}
          <div className="text-center pt-2 pb-3">
            <h2 className="text-2xl font-black text-[#132c4a] tracking-tight">
              $APPLE Airdrop
            </h2>
          </div>

          {/* Green Progress Bar */}
          <div className="w-full bg-[#E5F7E8] rounded-full h-3.5 p-0.5 mb-2 shadow-inner">
            <div 
              className="bg-gradient-to-r from-[#2ecc71] to-[#27ae60] h-full rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Progress Labels */}
          <div className="text-center mb-4">
            <p className="text-xs font-bold text-gray-500">Progress for Eligibility</p>
            <p className="text-sm font-black text-[#1c324f] mt-0.5">
              Completed Eligibility ({progressPercent}%)
            </p>
          </div>

          {/* Checklist Items (Pixel-perfect icon spacing and alignment) */}
          <div className="flex flex-col gap-2.5 flex-1">
            
            {/* 1. Verify Wallet */}
            <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                  <svg className="w-5 h-5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1a2f4c] leading-tight">Verify Wallet</h3>
                  <p className="text-xs font-bold text-emerald-600">Connected</p>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-600 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-200">
                Connected
              </span>
            </div>

            {/* 2. Follow on X */}
            <div 
              onClick={() => handleTaskClick('followX')}
              className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white shadow-xs flex-shrink-0">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1a2f4c] leading-tight">Follow on X</h3>
                  <p className={`text-xs font-bold ${tasks.followX ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {tasks.followX ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
              {tasks.followX ? (
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg className="w-4 h-4 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <span className="bg-amber-50 text-amber-700 text-xs font-black px-3 py-1.5 rounded-xl border border-amber-200">
                  Pending
                </span>
              )}
            </div>

            {/* 3. Join Community */}
            <div 
              onClick={() => handleTaskClick('joinTg')}
              className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#229ED9] flex items-center justify-center text-white shadow-xs flex-shrink-0">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1a2f4c] leading-tight">Join Community</h3>
                  <p className={`text-xs font-bold ${tasks.joinTg ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {tasks.joinTg ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
              {tasks.joinTg ? (
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg className="w-4 h-4 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <span className="bg-amber-50 text-amber-700 text-xs font-black px-3 py-1.5 rounded-xl border border-amber-200">
                  Pending
                </span>
              )}
            </div>

            {/* 4. Reach 50,000 APPLE */}
            <div 
              onClick={() => handleTaskClick('harvest')}
              className="p-3.5 px-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <img src={appleImg} alt="Apple" className="w-9 h-9 object-contain filter drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1a2f4c] leading-tight">Reach 50,000 APPLE</h3>
                    <p className={`text-xs font-bold ${is50kReached ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {is50kReached ? 'Completed' : `${currentApples.toLocaleString()} / 50,000`}
                    </p>
                  </div>
                </div>
                {is50kReached ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <svg className="w-4 h-4 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <span className="text-xs font-black text-slate-700 flex-shrink-0">
                    {Math.min(100, Math.round((currentApples / 50000) * 100))}%
                  </span>
                )}
              </div>
              {/* Mini progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 p-0.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentApples / 50000) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* 5. Invite 5 Friends */}
            <div 
              onClick={() => handleTaskClick('invite')}
              className="p-3.5 px-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                    <Users className="w-5 h-5 stroke-white stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1a2f4c] leading-tight">Invite 5 Friends</h3>
                    <p className={`text-xs font-bold ${tasks.inviteFriends >= 5 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {tasks.inviteFriends >= 5 ? 'Completed' : `${tasks.inviteFriends}/5 Friends`}
                    </p>
                  </div>
                </div>
                {tasks.inviteFriends >= 5 ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <svg className="w-4 h-4 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <span className="text-sm font-black text-slate-700 flex-shrink-0">
                    {tasks.inviteFriends}/5
                  </span>
                )}
              </div>
              {/* Mini progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 p-0.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (tasks.inviteFriends / 5) * 100)}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* ----------------- COUNTDOWN TIMER ----------------- */}
          <div className="mt-4 pt-2 text-center">
            <p className="text-sm font-black text-[#1a2f4c] tracking-wide">
              Countdown: <span className="text-[#e74c3c] font-black text-base tracking-wider">{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
            </p>

            {/* Claim / Pre-register Airdrop Button */}
            <button
              onClick={handleClaim}
              disabled={claimed}
              className={`mt-3 w-full py-3 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                claimed
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-b from-[#2ecc71] to-[#1e824c] hover:brightness-105 text-white shadow-[0_4px_0_#145a32]'
              }`}
            >
              {claimed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-gray-500" />
                  <span>Airdrop Slot Reserved</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 stroke-white" />
                  <span>Reserve $APPLE Airdrop</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <BottomNav currentTab="airdrop" onNavigate={onNavigate} />

    </div>
  );
}
