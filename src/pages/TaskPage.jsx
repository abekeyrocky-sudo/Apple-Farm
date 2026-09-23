import React, { useState } from 'react';
import { UserCheck, UserPlus, Gift, Play, CalendarCheck, Gamepad2 } from 'lucide-react';
import appleImg from '../../assets/apple.png';
import BottomNav from '../components/BottomNav';
import CustomTitleBar from '../components/CustomTitleBar';

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
          <Play className="w-5 h-5 fill-white stroke-none" />
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
        <div className="w-10 h-10 rounded-full border-2 border-amber-300 bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm">
          <UserCheck className="w-5 h-5 stroke-amber-700 stroke-[2.3]" />
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
        <div className="w-10 h-10 rounded-full border-2 border-sky-300 bg-sky-100 flex items-center justify-center text-sky-700 shadow-sm">
          <UserPlus className="w-5 h-5 stroke-sky-700 stroke-[2.3]" />
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
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-inner border border-amber-200">
          <Gift className="w-5 h-5 stroke-white stroke-[2.3]" />
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
      status: 'Go',
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
      <div className="pt-2 px-4 pb-2 z-20">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="flex items-center justify-between relative mb-3 mt-1">
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
      <BottomNav currentTab="task" onNavigate={onNavigate} />

    </div>
  );
}
