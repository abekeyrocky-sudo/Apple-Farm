import React, { useState, useEffect } from 'react';
import { Gift, Users, CheckCircle2, Sparkles, UserPlus } from 'lucide-react';
import confetti from 'canvas-confetti';
import inviteBannerImg from '../../assets/invite-banner.png';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import CustomTitleBar from '../components/CustomTitleBar';
import { soundManager } from '../utils/soundManager';
import { getAvatarSrc } from '../utils/avatars';

// 🎁 রেফারেল মিশন ডেটা
const REFER_MISSIONS = [
  { id: 1, target: 1, title: 'Invite 1 Friend', apples: 300, diamonds: 0 },
  { id: 2, target: 3, title: 'Invite 3 Friends', apples: 1000, diamonds: 1 },
  { id: 3, target: 5, title: 'Invite 5 Friends', apples: 2500, diamonds: 3 },
  { id: 4, target: 10, title: 'Invite 10 Friends', apples: 6000, diamonds: 8 },
  { id: 5, target: 25, title: 'Invite 25 Friends', apples: 20000, diamonds: 25 },
];

export default function InviteFriendsPage({ 
  user = { username: 'Farmer', id: null, invitedFriends: [], claimedReferMissions: {} }, 
  onBack,
  onClaimReward
}) {
  const [copied, setCopied] = useState(false);
  const [claimedMissions, setClaimedMissions] = useState(user?.claimedReferMissions || {});
  
  useEffect(() => {
    if (user?.claimedReferMissions) {
      setClaimedMissions(user.claimedReferMissions);
    }
  }, [user?.claimedReferMissions]);

  const botUsername = 'AppleFarmOfficialBot';
  const appShortName = 'App';
  const refCode = user?.id || user?.username || '40281';
  const referralLink = `t.me/${botUsername}/${appShortName}?startapp=${refCode}`;

  // রিয়েল ইনভাইট সংখ্যা (কোনো ডামি ডিফল্ট ডাটা নেই)
  const invitedFriendsList = Array.isArray(user?.invitedFriends) ? user.invitedFriends : [];
  const invitedCount = invitedFriendsList.length || user?.referralsCount || 0;

  // লিংক কপি করার ফাংশন
  const handleCopyLink = () => {
    soundManager.playClickSound();
    navigator.clipboard.writeText(`https://${referralLink}`);
    setCopied(true);

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setTimeout(() => setCopied(false), 2000);
  };

  // সরাসরি টেলিগ্রামে বন্ধুদের শেয়ার করার ফাংশন
  const handleShareNow = () => {
    soundManager.playClickSound();
    const shareText = encodeURIComponent('🍎 Join Apple Farm with me! Grow apples and harvest real rewards together!');
    const fullShareUrl = `https://t.me/share/url?url=https://${referralLink}&text=${shareText}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(fullShareUrl);
    } else {
      window.open(fullShareUrl, '_blank');
    }
  };

  // মিশন রিওয়ার্ড ক্লেইম ফাংশন
  const handleClaimMission = (mission) => {
    if (claimedMissions[mission.id]) return;
    if (invitedCount < mission.target) return;

    soundManager.playSuccessSound();

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setClaimedMissions(prev => ({ ...prev, [mission.id]: true }));

    if (onClaimReward) {
      onClaimReward(mission);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER ----------------- */}
      <div className="flex-shrink-0">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="relative flex items-center justify-between pt-1 mb-2">
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

      {/* ----------------- SCROLLABLE MAIN CONTENT ----------------- */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 max-h-[calc(100vh-170px)] pb-3">
        
        {/* 1. TOP ILLUSTRATION BANNER */}
        <div className="w-full h-44 rounded-3xl overflow-hidden border-2 border-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] bg-sky-100 relative flex items-center justify-center flex-shrink-0">
          <img 
            src={inviteBannerImg} 
            alt="Invite Friends Banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. HEADLINE & COMMISSION TEXT */}
        <div className="text-center space-y-0.5 pt-0.5">
          <h2 className="text-xl font-black text-[#192f52] tracking-tight leading-tight">
            Invite Your Friends
          </h2>
          <p className="text-xs font-extrabold text-[#38587f]">
            Get +500 Apples Instant Bonus
          </p>
        </div>

        {/* 3. REFERRAL LINK BOX */}
        <div className="w-full">
          <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-2.5 pl-4 pr-2.5 border border-sky-100 shadow-[0_2px_12px_rgba(0,140,255,0.06)] flex items-center justify-between gap-2">
            
            <span className="text-xs font-bold text-[#1e4878] truncate select-all flex-1">
              {referralLink}
            </span>

            {/* Integrated Clean Copy Button */}
            <button 
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all shadow-sm active:scale-95 flex-shrink-0 ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-emerald-200' 
                  : 'bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] text-white hover:brightness-105'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 stroke-white stroke-[2.5] fill-none" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Copied Toast Alert */}
        {copied && (
          <div className="text-center text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-sm animate-fade-in mx-auto w-fit">
            ✓ Referral Link Copied to Clipboard!
          </div>
        )}

        {/* 4. 🎁 REAL REFER MISSIONS & MILESTONES */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#192f52] tracking-tight flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>Referral Missions</span>
            </h3>
            <span className="text-[11px] font-black text-[#38587f] bg-sky-100/70 px-2.5 py-0.5 rounded-full">
              {invitedCount} Invited
            </span>
          </div>

          <div className="space-y-2">
            {REFER_MISSIONS.map((mission) => {
              const isClaimed = !!claimedMissions[mission.id];
              const isReady = !isClaimed && invitedCount >= mission.target;
              const progressRatio = Math.min(1, invitedCount / mission.target);
              const progressPercent = Math.round(progressRatio * 100);

              return (
                <div
                  key={mission.id}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-3.5 border border-slate-100 shadow-xs flex flex-col gap-2 transition-all hover:border-sky-200"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Icon & Mission Info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                        isClaimed 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : isReady 
                          ? 'bg-amber-100 text-amber-600 animate-bounce' 
                          : 'bg-sky-50 text-sky-600'
                      }`}>
                        <Users className="w-4 h-4 stroke-[2.5]" />
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-[#192f52] leading-tight">
                          {mission.title}
                        </h4>
                        
                        {/* Reward Badges */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-red-600">
                            <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                            +{mission.apples.toLocaleString()}
                          </span>
                          {mission.diamonds > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-extrabold text-sky-600">
                              <img src={diamondImg} alt="Diamond" className="w-3 h-3 object-contain" />
                              +{mission.diamonds}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action / Status Button */}
                    <div>
                      {isClaimed ? (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[11px] font-black px-2.5 py-1 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Claimed</span>
                        </div>
                      ) : isReady ? (
                        <button
                          onClick={() => handleClaimMission(mission)}
                          className="bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-105 active:scale-95 text-white text-[11px] font-black px-3 py-1 rounded-xl shadow-md flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 fill-white" />
                          <span>Claim</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {invitedCount}/{mission.target}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Line */}
                  {!isClaimed && (
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. 👥 REAL INVITED FRIENDS LIST */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#192f52] tracking-tight flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-sky-600" />
              <span>Your Friends List</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {invitedCount} {invitedCount === 1 ? 'Friend' : 'Friends'}
            </span>
          </div>

          {invitedFriendsList.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-100 py-5">
              <p className="text-xs font-bold text-slate-500">No friends joined yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Share your referral link with friends to earn instant rewards!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {invitedFriendsList.map((friend, idx) => (
                <div 
                  key={friend.id || idx}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-3 border border-slate-100 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img src={getAvatarSrc(friend.avatar || 'avatar-1')} alt={friend.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#192f52] leading-tight">
                        {friend.name || 'Friend'}
                      </h4>
                      <p className="text-[10px] font-medium text-slate-400">
                        Joined {friend.date || 'Recently'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <img src={appleImg} alt="Apple" className="w-3 h-3 object-contain" />
                    +100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ----------------- BOTTOM ACTION (SHARE NOW) ----------------- */}
      <div className="pt-2 flex-shrink-0">
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
