import React, { useState } from 'react';
import { User, Trophy, Camera, Check, Store, Volume2, VolumeX, Music, Smartphone, ShieldCheck, ChevronRight, Award } from 'lucide-react';
import appleImg from '../../assets/apple.png';
import { calculateLevel, getLevelProgress, LEVEL_TIERS } from '../utils/levelSystem';
import { AVATARS, getAvatarSrc } from '../utils/avatars';
import CustomTitleBar from '../components/CustomTitleBar';
import { soundManager } from '../utils/soundManager';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import { addTransaction } from '../utils/transactionHistory';

export default function ProfilePage({ 
  user = { name: 'Farmer', id: null, level: 1, apples: 0, avatar: 'avatar-1' }, 
  onBack, 
  onNavigate, 
  onLogout, 
  onRedeemBonus, 
  onUpdateAvatar
}) {
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  // সাউন্ড ও হ্যাপটিক সেটিংস স্টেট
  const [isSoundMuted, setIsSoundMuted] = useState(soundManager.isMuted);
  const [isHapticEnabled, setIsHapticEnabled] = useState(
    localStorage.getItem('apple_farm_haptic') !== 'false'
  );

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsSoundMuted(muted);
    if (!muted) {
      soundManager.playHarvestSound();
    }
  };

  const toggleHaptic = () => {
    const next = !isHapticEnabled;
    setIsHapticEnabled(next);
    localStorage.setItem('apple_farm_haptic', next ? 'true' : 'false');
    if (next && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  // চক্রবৃদ্ধি লেভেল হিসাব
  const progress = getLevelProgress(user.apples || 0);
  const telegramId = user.id || window.Telegram?.WebApp?.initDataUnsafe?.user?.id || '40281';
  const currentAvatarSrc = getAvatarSrc(user.avatar);

  // মেনু আইটেমের তালিকা
  const menuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'market',
      label: 'Apple Market',
      badge: 'Shop',
      icon: (
        <Store className="w-5 h-5 text-emerald-600 stroke-[2.2]" />
      ),
    },
    {
      id: 'leaderboard',
      label: 'Global Ranking',
      badge: 'Top',
      icon: (
        <Trophy className="w-5 h-5 text-amber-500 fill-amber-300 stroke-amber-600" />
      ),
    },
    {
      id: 'transactions',
      label: 'Transaction History',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      id: 'redeem',
      label: 'Redeem Code',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M20 12v10H4V12" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 22V7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      ),
    },
    {
      id: 'support',
      label: 'Help & Support',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
    {
      id: 'about',
      label: 'About Us',
      icon: (
        <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
        </svg>
      ),
    },
  ];

  // মেনু ক্লিক অ্যাকশন
  const handleItemClick = (id) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    if (id === 'profile') {
      setShowAvatarModal(true);
    } else if (id === 'market') {
      onNavigate?.('market');
    } else if (id === 'redeem') {
      setShowRedeemModal(true);
    } else if (id === 'leaderboard') {
      onNavigate?.('leaderboard');
    } else if (id === 'transactions') {
      setShowHistoryModal(true);
    } else if (id === 'settings') {
      setShowSettingsModal(true);
    } else if (id === 'about') {
      setShowAboutModal(true);
    } else if (id === 'support') {
      setShowSupportModal(true);
    }
  };

  const handleRedeemSubmit = (e) => {
    e.preventDefault();
    if (!redeemInput) return;
    setRedeemSuccess(true);
    addTransaction({
      userId: user?.id,
      title: 'Redeem Promo Code',
      subtitle: `Code: ${redeemInput.toUpperCase()}`,
      amount: '+500',
      currency: 'apple',
      type: 'earn',
      category: 'redeem',
      status: 'Completed'
    });
    if (onRedeemBonus) {
      onRedeemBonus(500);
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setTimeout(() => {
      setRedeemSuccess(false);
      setShowRedeemModal(false);
      setRedeemInput('');
    }, 1500);
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div>
        <CustomTitleBar title="Apple Farm" darkText={true} />
        {/* Back Button */}
        <div className="pt-1 mb-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm">
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* User Info Section */}
        <div className="flex items-center gap-4 px-2 mb-5">
          {/* Avatar Container with Edit Camera Badge */}
          <div 
            onClick={() => setShowAvatarModal(true)}
            className="relative w-20 h-20 flex-shrink-0 cursor-pointer active:scale-95 transition-transform group"
          >
            <div className="w-full h-full rounded-full overflow-hidden shadow-md">
              <img 
                src={currentAvatarSrc} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md">
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-1 overflow-hidden flex-1">
            <h1 className="text-2xl font-black text-[#192f52] tracking-tight truncate">
              {user.name || 'Farmer'}
            </h1>
            <p className="text-xs font-bold text-[#567396] flex items-center gap-1">
              <span>ID:</span>
              <span className="font-mono text-[#192f52] font-extrabold">{telegramId}</span>
            </p>
            <div className="pt-0.5">
              <span className="inline-block bg-gradient-to-r from-[#2ecc71] to-[#20a058] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                Lv.{progress.level}
              </span>
            </div>
          </div>
        </div>

        {/* ----------------- DEDICATED LEVEL PROGRESS CARD ----------------- */}
        <div 
          onClick={() => {
            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
            setShowLevelModal(true);
          }}
          className="mb-4 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.05)] cursor-pointer hover:border-emerald-300 active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                Lv.{progress.level}
              </div>
              <div>
                <h3 className="text-xs font-black text-[#192f52] leading-none">
                  {progress.title || 'Novice Farmer'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  {progress.level >= 20 
                    ? 'Maximum Level Reached' 
                    : `Next: ${progress.maxApples.toLocaleString()} Apples`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="text-xs font-black">{progress.percent}%</span>
              <svg className="w-4 h-4 stroke-current stroke-[2.5] fill-none text-slate-400 group-hover:text-emerald-500 transition-colors" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }}
            />
          </div>
        </div>

        {/* ----------------- SETTINGS MENU CARD ----------------- */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.05)] overflow-hidden divide-y divide-slate-100">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="flex items-center justify-between p-3.5 px-4 cursor-pointer hover:bg-slate-50/80 active:bg-slate-100 transition-colors"
            >
              {/* Left: Icon & Label */}
              <div className="flex items-center gap-3.5 text-[#192f52]">
                <div className="w-6 h-6 flex items-center justify-center text-[#2b4c7e]">
                  {item.icon}
                </div>
                <span className="text-sm font-extrabold tracking-tight">
                  {item.label}
                </span>
              </div>

              {/* Right: Badge & Chevron Arrow */}
              <div className="flex items-center gap-2 text-[#192f52]">
                {item.badge && (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    {item.badge}
                  </span>
                )}
                <svg className="w-4 h-4 stroke-current stroke-[2.5] fill-none" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ----------------- LOG OUT BUTTON ----------------- */}
      <div className="pb-5 pt-4">
        <button 
          onClick={onLogout || onBack}
          className="w-full py-3 rounded-2xl bg-[#fee2e2]/70 hover:bg-[#fee2e2] border border-red-200/80 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {/* Power/Logout Icon */}
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white">
            <svg className="w-3 h-3 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </div>
          <span className="text-sm font-black text-red-500">Log Out</span>
        </button>
      </div>

      {/* ----------------- REDEEM CODE MODAL ----------------- */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl space-y-4 border border-sky-100">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-[#192f52] text-base">Redeem Promo Code</h3>
              <button onClick={() => setShowRedeemModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            {redeemSuccess ? (
              <div className="py-4 text-center text-emerald-600 font-black text-sm flex flex-col items-center gap-1">
                <span className="text-2xl">🎉</span>
                <span>Code Redeemed! +500 Apples</span>
              </div>
            ) : (
              <form onSubmit={handleRedeemSubmit} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Enter your code (e.g. APPLE2026)"
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value)}
                  required
                  className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-farm-light-green uppercase tracking-wider"
                />
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all">
                  Claim 500 Apples
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ----------------- AVATAR SELECTION MODAL ----------------- */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-sky-100 animate-slide-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-[#192f52] text-base">Choose Your Avatar</h3>
                <p className="text-[11px] font-bold text-slate-400">Select a character for your farm profile</p>
              </div>
              <button 
                onClick={() => setShowAvatarModal(false)} 
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3.5 py-2 max-h-[60vh] overflow-y-auto">
              {AVATARS.map((item) => {
                const isSelected = (user.avatar || 'avatar-1') === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (onUpdateAvatar) onUpdateAvatar(item.id);
                      if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                      }
                      setShowAvatarModal(false);
                    }}
                    className={`relative p-2 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-1.5 active:scale-95 ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-200' 
                        : 'border-slate-100 hover:border-sky-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-sky-100">
                      <img src={item.src} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-extrabold text-[#192f52] text-center leading-tight">
                      {item.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SETTINGS MODAL ----------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-sky-100 animate-slide-up">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-[#192f52] text-lg">App Settings</h3>
                <p className="text-[11px] font-bold text-slate-400">Manage audio & experience preferences</p>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Settings Options List */}
            <div className="space-y-3 py-1">
              
              {/* 1. Master Sound Effects & Ambient Music */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!isSoundMuted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                    {!isSoundMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#192f52]">Sound & Music</h4>
                    <p className="text-[10px] font-bold text-slate-400">Harvest taps & farm background music</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={toggleSound}
                  className={`w-13 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    !isSoundMuted ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300" />
                </button>
              </div>

              {/* 2. Haptic Feedback Vibration */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHapticEnabled ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#192f52]">Haptic Vibration</h4>
                    <p className="text-[10px] font-bold text-slate-400">Telegram touch feedback vibration</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={toggleHaptic}
                  className={`w-13 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    isHapticEnabled ? 'bg-sky-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300" />
                </button>
              </div>

              {/* App Info / Version */}
              <div className="pt-2 text-center">
                <span className="text-[11px] font-bold text-slate-400">
                  Apple Farm Mini App • v1.0.4
                </span>
              </div>

            </div>

            {/* Done / Close Button */}
            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] text-white font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ----------------- ABOUT US MODAL ----------------- */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-b from-[#f8fcff] to-[#edf7ee] w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-sky-100 animate-slide-up max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-sm">
                  <img src={appleImg} alt="Apple" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-[#192f52] text-base">About Apple Farm</h3>
                  <p className="text-[10px] font-bold text-emerald-600">Web3 Farming Mini App on TON</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAboutModal(false)} 
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Overview Box */}
            <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
              <h4 className="text-xs font-black text-[#192f52]">🌾 What is Apple Farm?</h4>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                Apple Farm is an interactive Web3 Play-to-Earn farm ecosystem on Telegram, powered by the <strong className="text-sky-600 font-bold">TON Blockchain</strong>. Plant, harvest, mine diamonds, and convert your hard work into real crypto payouts.
              </p>
            </div>

            {/* Features Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#192f52] px-1">✨ Core Features & Guides</h4>

              <div className="grid grid-cols-1 gap-2 text-[11px]">
                {/* 1. Harvest & Level */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                  </div>
                  <div>
                    <h5 className="font-black text-[#192f52]">Harvest & Level Up</h5>
                    <p className="text-slate-500 text-[10px]">Tap to harvest fresh apples. Increasing levels multiplies your yield per tap.</p>
                  </div>
                </div>

                {/* 2. Diamonds & Wheel */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">💎</span>
                  </div>
                  <div>
                    <h5 className="font-black text-[#192f52]">Diamonds & Lucky Spin</h5>
                    <p className="text-slate-500 text-[10px]">Win rare diamonds from daily wheel spins, needed for high-tier GRAM payouts.</p>
                  </div>
                </div>

                {/* 3. Staking */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">🏦</span>
                  </div>
                  <div>
                    <h5 className="font-black text-[#192f52]">Staking Vault (APY)</h5>
                    <p className="text-slate-500 text-[10px]">Lock your apples in high-yield vaults to earn compound interest automatically.</p>
                  </div>
                </div>

                {/* 4. Automated Payouts */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">⚡</span>
                  </div>
                  <div>
                    <h5 className="font-black text-[#192f52]">Instant TON Withdrawals</h5>
                    <p className="text-slate-500 text-[10px]">Fast on-chain automated payouts directly to your connected Tonkeeper / Telegram wallet.</p>
                  </div>
                </div>

                {/* 5. Airdrop */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">🪂</span>
                  </div>
                  <div>
                    <h5 className="font-black text-[#192f52]">$APPLE Airdrop Hub</h5>
                    <p className="text-slate-500 text-[10px]">Complete the 5 milestone tasks and reserve your exclusive token allocation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Version & Security */}
            <div className="pt-2 text-center border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400">
                Apple Farm Mini App • v1.0.4 • Secured on TON
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e8a4a] text-white font-black text-xs rounded-xl shadow-md active:scale-95"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* ----------------- HELP & SUPPORT MODAL ----------------- */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-sky-100 animate-slide-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-[#192f52] text-base">Help & Support</h3>
                <p className="text-[11px] font-bold text-slate-400">Contact community support & FAQ</p>
              </div>
              <button 
                onClick={() => setShowSupportModal(false)} 
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 active:scale-95"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 space-y-1">
                <h4 className="font-black text-sky-900">💬 Official Telegram Support</h4>
                <p className="text-[11px] text-sky-700">Join our 24/7 community group for quick help, announcements, and guides.</p>
                <button
                  onClick={() => window.open('https://t.me/AppleFarmCommunity', '_blank')}
                  className="mt-2 w-full py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>Open Telegram Support Group</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ----------------- LEVEL SYSTEM TIERS MODAL ----------------- */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-sky-100 animate-slide-up max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-black text-[#192f52] text-base">Farm Level System</h3>
                <p className="text-[11px] font-bold text-emerald-600">
                  Current: Lv.{progress.level} • {progress.title}
                </p>
              </div>
              <button 
                onClick={() => setShowLevelModal(false)} 
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Current Level Summary Card */}
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl text-white shadow-sm flex-shrink-0">
              <div className="flex items-center justify-between text-xs font-black">
                <span>Lv.{progress.level} {progress.title}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }} 
                />
              </div>
              <p className="text-[10px] font-bold opacity-90 mt-1">
                {progress.level >= 20 
                  ? 'You have achieved the ultimate Immortal God rank!' 
                  : `${progress.applesNeeded.toLocaleString()} more Apples needed for Lv.${progress.level + 1}`}
              </p>
            </div>

            {/* 20 Level Tiers List */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1 py-1">
              {LEVEL_TIERS.map((tier) => {
                const isCurrent = progress.level === tier.level;
                const isPassed = progress.level > tier.level;

                return (
                  <div
                    key={tier.level}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/90 shadow-xs ring-1 ring-emerald-300'
                        : isPassed
                        ? 'border-slate-100 bg-slate-50/60 opacity-85'
                        : 'border-slate-100 bg-white opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                        isCurrent
                          ? 'bg-emerald-500 text-white'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {tier.level}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-[#192f52] leading-tight">
                            {tier.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[9px] font-extrabold bg-emerald-500 text-white px-1.5 py-0.2 rounded-md">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">
                          {tier.required.toLocaleString()} Apples Required
                        </p>
                      </div>
                    </div>

                    <div className="text-xs">
                      {isPassed ? (
                        <span className="text-emerald-500 font-bold">✓</span>
                      ) : isCurrent ? (
                        <span className="text-xs font-black text-emerald-600">🎯</span>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-bold">🔒</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowLevelModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl active:scale-95 flex-shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ----------------- TRANSACTION HISTORY MODAL ----------------- */}
      <TransactionHistoryModal
        isOpen={showHistoryModal}
        userId={user?.id}
        onClose={() => setShowHistoryModal(false)}
      />

    </div>
  );
}
