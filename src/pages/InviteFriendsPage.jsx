import React, { useState } from 'react';
import inviteBannerImg from '../../assets/invite-banner.png';
import CustomTitleBar from '../components/CustomTitleBar';

export default function InviteFriendsPage({ user = { username: 'rocky' }, onBack }) {
  const [copied, setCopied] = useState(false);
  const botUsername = 'AppleFarmOfficialBot';
  const referralLink = `t.me/${botUsername}?start=${user.username || 'rocky'}`;

  // লিংক কপি করার ফাংশন
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${referralLink}`);
    setCopied(true);

    // Telegram Haptic Feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setTimeout(() => setCopied(false), 2000);
  };

  // সরাসরি টেলিগ্রামে বন্ধুদের শেয়ার করার ফাংশন
  const handleShareNow = () => {
    const shareText = encodeURIComponent('🍎 Join Apple Farm with me! Grow apples and harvest real rewards together!');
    const fullShareUrl = `https://t.me/share/url?url=https://${referralLink}&text=${shareText}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(fullShareUrl);
    } else {
      window.open(fullShareUrl, '_blank');
    }
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
            Invite Friends
          </h1>

          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <div className="flex-1 flex flex-col items-center space-y-4">
        
        {/* 1. TOP ILLUSTRATION BANNER (ACTUAL PNG IMAGE) */}
        <div className="w-full h-52 rounded-3xl overflow-hidden border-2 border-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] bg-sky-100 relative flex items-center justify-center">
          <img 
            src={inviteBannerImg} 
            alt="Invite Friends Banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. HEADLINE & COMMISSION TEXT */}
        <div className="text-center space-y-1 pt-1">
          <h2 className="text-2xl font-black text-[#192f52] tracking-tight">
            Invite Your Friends
          </h2>
          <p className="text-sm font-extrabold text-[#38587f]">
            Get 10% Apple Commission
          </p>
        </div>

        {/* 3. REFERRAL LINK BOX */}
        <div className="w-full relative mt-2">
          <div 
            onClick={handleCopyLink}
            className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-3.5 pl-4 pr-12 border border-sky-100 shadow-[0_2px_12px_rgba(0,140,255,0.06)] flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform">
            
            <span className="text-sm font-bold text-[#1e4878] truncate select-all">
              {referralLink}
            </span>

            {/* Right indicator icons */}
            <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
              <svg className="w-5 h-5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          {/* Floating Copy Button Badge (Bottom Right) */}
          <button 
            onClick={handleCopyLink}
            className={`absolute -bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-md border-2 border-white transition-all ${
              copied ? 'bg-emerald-600 text-white' : 'bg-[#10b981] text-white hover:bg-emerald-600'
            }`}>
            {copied ? (
              <svg className="w-4 h-4 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 stroke-white stroke-2 fill-none" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        </div>

        {/* Copied Toast Alert */}
        {copied && (
          <div className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-sm animate-fade-in">
            ✓ Referral Link Copied to Clipboard!
          </div>
        )}

      </div>

      {/* ----------------- BOTTOM ACTION (SHARE NOW) ----------------- */}
      <div className="pb-4 pt-2">
        <button 
          onClick={handleShareNow}
          className="w-full py-3.5 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_0_#145a32] border-t border-emerald-300"
        >
          {/* Share/Send Paper Airplane Icon */}
          <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/40 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
          <span>Share Now</span>
        </button>
      </div>

    </div>
  );
}
