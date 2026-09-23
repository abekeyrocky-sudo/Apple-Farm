import React, { useState } from 'react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import CustomTitleBar from '../components/CustomTitleBar';

export default function WatchAdsPage({ onBack, onRewardEarned }) {
  const [adsWatched, setAdsWatched] = useState(0);
  const maxDailyAds = 20;
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // প্রোগ্রেস পারসেন্টেজ
  const progressPercent = Math.min(100, Math.round((adsWatched / maxDailyAds) * 100));

  // অ্যাড দেখার সিমুলেশন (টেলিগ্রাম এডসগ্রাম বা ইউনিটি অ্যাডের জন্য প্রস্তুত)
  const handleWatchAd = () => {
    if (adsWatched >= maxDailyAds || isWatching) return;

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    setIsWatching(true);
    let timer = 3;
    setCountdown(timer);

    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer <= 0) {
        clearInterval(interval);
        setIsWatching(false);
        setAdsWatched((prev) => prev + 1);
        if (onRewardEarned) {
          onRewardEarned(10); // প্রতি অ্যাডে আপেল রিওয়ার্ড
        }
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      }
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER ----------------- */}
      <div>
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="relative flex items-center justify-between pt-1 mb-3">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm">
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-black text-[#192f52] tracking-tight">
            Watch Ads
          </h1>

          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <div className="flex-1 space-y-3.5">
        
        {/* 1. TOP PROGRESS CARD */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.06)] flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between px-2 mb-3">
            {/* 3D Diamond Graphic */}
            <div className="relative w-16 h-16 flex items-center justify-center filter drop-shadow-[0_6px_10px_rgba(0,163,255,0.35)]">
              <img src={diamondImg} alt="Diamond" className="w-14 h-14 object-contain" />
            </div>

            {/* Counter Section */}
            <div className="text-right">
              <span className="text-xs font-bold text-[#567396]">Available Today</span>
              <div className="text-3xl font-black text-[#192f52] tracking-tight">
                {adsWatched} <span className="text-xl text-[#7895b6]">/ {maxDailyAds}</span>
              </div>
            </div>
          </div>

          {/* Green Rounded Progress Bar */}
          <div className="w-full h-5 bg-[#e2ecf5] rounded-full p-1 shadow-inner overflow-hidden mb-2.5">
            <div 
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-[#2ecc71] via-[#27ae60] to-[#1abc9c] rounded-full transition-all duration-500 shadow-[0_1px_4px_rgba(46,204,113,0.5)]"
            />
          </div>

          <p className="text-xs font-bold text-[#32527b]">
            Watch 20 Ads = Up to 50 Apples
          </p>
        </div>

        {/* 2. REWARD CARD: 449 Ads */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 px-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Diamond Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-50 border border-sky-200 flex items-center justify-center filter drop-shadow-sm p-2">
              <img src={diamondImg} alt="Diamond" className="w-full h-full object-contain" />
            </div>

            <div>
              <h3 className="text-base font-black text-[#192f52]">449 Ads</h3>
              <p className="text-xs font-bold text-[#567396]">
                Up to 250 Apples
              </p>
            </div>
          </div>

          {/* 3D Purple Gift Box */}
          <button className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#9333EA] to-[#C084FC] border-2 border-white shadow-md flex items-center justify-center text-xl active:scale-90 transition-transform">
            🎁
          </button>
        </div>

        {/* 3. REWARD CARD: Jackpot Mission */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 px-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Golden Crown Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-200 flex items-center justify-center filter drop-shadow-sm">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                <path d="M3 18H21L19 7L14.5 12L12 4L9.5 12L5 7L3 18Z" fill="#F59E0B" />
                <path d="M3 18H21V20H3V18Z" fill="#D97706" />
                <circle cx="12" cy="4" r="1.5" fill="#EF4444" />
                <circle cx="5" cy="7" r="1.5" fill="#3B82F6" />
                <circle cx="19" cy="7" r="1.5" fill="#3B82F6" />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-black text-[#192f52]">Jackpot Mission</h3>
              <p className="text-xs font-bold text-[#567396]">
                549 Apples
              </p>
            </div>
          </div>

          {/* 3D Purple Gift Box */}
          <button className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#9333EA] to-[#C084FC] border-2 border-white shadow-md flex items-center justify-center text-xl active:scale-90 transition-transform">
            🎁
          </button>
        </div>

      </div>

      {/* ----------------- BOTTOM ACTION SECTION ----------------- */}
      <div className="space-y-3 pb-4">
        
        {/* Green "Watch Ad" Button */}
        <button 
          onClick={handleWatchAd}
          disabled={isWatching || adsWatched >= maxDailyAds}
          className={`w-full py-3.5 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_0_#145a32] border-t border-emerald-300 active:scale-95 active:shadow-[0_1px_0_#145a32] ${
            isWatching || adsWatched >= maxDailyAds
              ? 'bg-gray-400 cursor-not-allowed shadow-[0_4px_0_#6b7280]'
              : 'bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105'
          }`}
        >
          {/* Video Play Icon */}
          <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/40 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 fill-white ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span>{isWatching ? `Watching Ad... (${countdown}s)` : 'Watch Ad'}</span>
        </button>

        {/* Coming Soon Notice Pill */}
        <div className="bg-[#e4f3ff] border border-sky-200/80 rounded-2xl py-2.5 px-4 flex items-center justify-center gap-2 shadow-sm">
          <span className="text-sm">⭐</span>
          <span className="text-xs font-extrabold text-[#237cd7]">
            More apple earn task coming soon
          </span>
        </div>

      </div>

    </div>
  );
}
