import React, { useState } from 'react';
import appleImg from '../../assets/apple.png';

export default function TaskPage({ onBack, onNavigate, onRewardClaim }) {
  const [activeTab, setActiveTab] = useState('All');

  // রেফারেন্স ইমেজের হুবহু টাস্ক ডাটা
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Watch 5 Ads',
      reward: '+50 Apples',
      rewardAmount: 50,
      type: 'Daily',
      status: 'Go', // 'Go' | 'Claim' | 'Claimed'
      iconBg: 'bg-blue-50 border-blue-200',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-inner">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm6 2.5v7l6-3.5-6-3.5z"/>
          </svg>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Complete Profile',
      reward: '+100 Apples',
      rewardAmount: 100,
      type: 'Special',
      status: 'Go',
      iconBg: 'bg-sky-50 border-sky-100',
      icon: (
        <div className="w-10 h-10 rounded-full border-2 border-amber-300 bg-amber-100 flex items-center justify-center text-xl overflow-hidden shadow-sm">
          🧑🏻
        </div>
      ),
    },
    {
      id: 3,
      title: 'Invite 1 Friend',
      reward: '+10% Commission',
      rewardAmount: 0,
      type: 'Special',
      status: 'Go',
      iconBg: 'bg-indigo-50 border-indigo-100',
      icon: (
        <div className="w-10 h-10 rounded-full border-2 border-sky-300 bg-sky-100 flex items-center justify-center text-xl overflow-hidden shadow-sm">
          👦🏻
        </div>
      ),
    },
    {
      id: 4,
      title: 'Redeem Code',
      reward: '+500 Apples',
      rewardAmount: 500,
      type: 'Special',
      status: 'Go',
      iconBg: 'bg-amber-50 border-amber-100',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-xl shadow-inner border border-amber-200">
          🎁
        </div>
      ),
    },
    {
      id: 5,
      title: 'Play Mini Game',
      reward: '+200 Apples',
      rewardAmount: 200,
      type: 'Daily',
      status: 'Go',
      iconBg: 'bg-emerald-50 border-emerald-100',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-green-500 flex items-center justify-center text-white shadow-sm">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <path d="M6 12h4m-2-2v4m8-2h.01m3-2h.01" />
          </svg>
        </div>
      ),
    },
    {
      id: 6,
      title: 'Daily Login',
      reward: '+50 Apples',
      rewardAmount: 50,
      type: 'Daily',
      status: 'Claimed', // অলরেডি ক্লেইম করা
      iconBg: 'bg-orange-50 border-orange-100',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm border border-amber-300">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
      ),
    },
  ]);

  // টাস্ক ক্লিক হ্যান্ডলার
  const handleTaskAction = (task) => {
    if (task.status === 'Claimed') return;

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (task.status === 'Go') {
      // টাস্কে গেলে ক্লেইম অবস্থায় নেওয়া
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Claim' } : t));
    } else if (task.status === 'Claim') {
      // ক্লেইম করলে রিওয়ার্ড যোগ হবে
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Claimed' } : t));
      if (onRewardClaim) onRewardClaim(task);
    }
  };

  const filteredTasks = activeTab === 'All' 
    ? tasks 
    : tasks.filter(t => t.type === activeTab);

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f3f9ff] to-[#e8f5e9] flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP BAR ----------------- */}
      <div className="pt-3 px-4 pb-2 z-20">
        <div className="flex items-center justify-between relative mb-4">
          {/* Back Button */}
          <button 
            onClick={onBack || (() => onNavigate?.('home'))}
            className="w-9 h-9 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shadow-sm">
            <svg className="w-5 h-5 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-black text-[#192f52] tracking-tight">
            Tasks & Rewards
          </h1>

          <div className="w-9" /> {/* Spacer to center the title */}
        </div>

        {/* ----------------- TABS (All / Daily / Special) ----------------- */}
        <div className="flex items-center justify-between gap-2.5 px-2 mb-2">
          {['All', 'Daily', 'Special'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-full font-black text-sm transition-all duration-200 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-b from-[#2ecc71] to-[#20a058] text-white shadow-[#20a058]/30 shadow-md'
                    : 'bg-white/90 text-[#4c678a] hover:bg-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- TASK LIST ----------------- */}
      <div className="flex-1 px-4 py-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-175px)]">
        {filteredTasks.map((task) => (
          <div 
            key={task.id}
            className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-3.5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between"
          >
            {/* Left: Icon & Info */}
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded-2xl border ${task.iconBg}`}>
                {task.icon}
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-[#192f52] leading-snug">
                  {task.title}
                </h3>
                <p className="text-xs font-bold text-[#4c739e]">
                  {task.reward}
                </p>
              </div>
            </div>

            {/* Right: Action Button */}
            <div>
              {task.status === 'Claimed' ? (
                <button 
                  disabled
                  className="bg-[#b3c7d6] text-white text-xs font-extrabold px-5 py-2 rounded-2xl cursor-not-allowed shadow-inner">
                  Claimed
                </button>
              ) : task.status === 'Claim' ? (
                <button 
                  onClick={() => handleTaskAction(task)}
                  className="bg-gradient-to-b from-amber-400 to-amber-500 hover:brightness-105 active:scale-95 text-white font-black text-xs px-5 py-2 rounded-2xl shadow-[0_3px_0_#b45309] transition-all">
                  Claim
                </button>
              ) : (
                <button 
                  onClick={() => handleTaskAction(task)}
                  className="bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] hover:brightness-105 active:scale-95 text-white font-black text-xs px-6 py-2 rounded-2xl shadow-[0_3px_0_#145a32] border-t border-emerald-300 transition-all">
                  Go
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-6 py-2.5 flex justify-between items-center z-30 border-t border-gray-100">
        
        {/* Home */}
        <button 
          onClick={() => onNavigate?.('home')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[11px] font-bold">Home</span>
        </button>

        {/* Task (Active) */}
        <button 
          onClick={() => onNavigate?.('task')} 
          className="flex flex-col items-center gap-0.5 text-[#2ecc71] transition-transform active:scale-90">
          <div className="w-6 h-6 bg-[#2ecc71] rounded-lg flex items-center justify-center text-white">
            <svg className="w-4 h-4 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[11px] font-black">Task</span>
        </button>

        {/* Game */}
        <button 
          onClick={() => onNavigate?.('game')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <path d="M6 12h4m-2-2v4m8-2h.01m3-2h.01" />
          </svg>
          <span className="text-[11px] font-bold">Game</span>
        </button>

        {/* Wallet */}
        <button 
          onClick={() => onNavigate?.('wallet')} 
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition-transform active:scale-90">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M3 10h18M7 15h1m4 0h1m-9 4h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[11px] font-bold">Wallet</span>
        </button>

      </div>

    </div>
  );
}
