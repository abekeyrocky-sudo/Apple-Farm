import React, { useState } from 'react';
import { Crown, User, Award, Medal, Shield, Sparkles } from 'lucide-react';
import appleImg from '../../assets/apple.png';
import homeBgImg from '../../assets/home-page-background.png';
import { getAvatarSrc } from '../utils/avatars';
import CustomTitleBar from '../components/CustomTitleBar';

export default function LeaderboardPage({ 
  user = { name: 'Rocky', apples: 0, level: 1, id: null, avatar: 'avatar-1' }, 
  onBack, 
  onNavigate 
}) {
  const [filter, setFilter] = useState('All'); // 'All' | 'Weekly'
  const userAvatarImg = getAvatarSrc(user.avatar);

  // Top 3 Podium Winners
  const topPodium = {
    first: {
      rank: '1st',
      name: 'FarmerKing',
      level: 'Lv. 99',
      apples: '1,250',
      icon: <Crown className="w-8 h-8 text-amber-500 fill-amber-300" />,
      avatarBg: 'bg-amber-100 border-amber-300'
    },
    second: {
      rank: '2nd',
      name: 'AppleHero',
      level: 'Lv. 84',
      apples: '650',
      icon: <Medal className="w-7 h-7 text-slate-500 fill-slate-300" />,
      avatarBg: 'bg-slate-100 border-slate-300'
    },
    third: {
      rank: '3rd',
      name: 'DaisyFarm',
      level: 'Lv. 76',
      apples: '920',
      icon: <Award className="w-7 h-7 text-amber-700 fill-amber-400" />,
      avatarBg: 'bg-orange-100 border-orange-300'
    }
  };

  // Rank 4 to 15 Leaderboard list matching screenshot
  const rankings = [
    { rank: 4, name: 'FarmerJo', level: 'Lv. 4525', apples: '549.0', icon: <User className="w-5 h-5 text-emerald-600" /> },
    { rank: 5, name: 'AppleWiz', level: 'Lv. 4029', apples: '549.0', icon: <Sparkles className="w-5 h-5 text-sky-600" /> },
    { rank: 6, name: 'AppleWiz', level: 'Lv. 3837', apples: '549.0', icon: <Shield className="w-5 h-5 text-indigo-600" /> },
    { rank: 7, name: 'FarmerJo', level: 'Lv. 4023', apples: '549.0', icon: <User className="w-5 h-5 text-teal-600" /> },
    { rank: 8, name: 'GreenThumb', level: 'Lv. 3512', apples: '545.0', icon: <Sparkles className="w-5 h-5 text-green-600" /> },
    { rank: 9, name: 'FarmerJo', level: 'Lv. 3029', apples: '540.0', icon: <User className="w-5 h-5 text-amber-600" /> },
    { rank: 10, name: 'FarmerJo', level: 'Lv. 559', apples: '549.0', icon: <Shield className="w-5 h-5 text-blue-600" /> },
    { rank: 11, name: 'HarvestQueen', level: 'Lv. 510', apples: '532.0', icon: <Award className="w-5 h-5 text-purple-600" /> },
    { rank: 12, name: 'CryptoFarmer', level: 'Lv. 490', apples: '520.0', icon: <User className="w-5 h-5 text-rose-600" /> },
  ];

  return (
    <div 
      style={{ backgroundImage: `url(${homeBgImg})` }}
      className="relative w-full max-w-md mx-auto min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-between select-none overflow-hidden font-sans"
    >
      {/* Background Overlay for Soft Top Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB]/60 via-[#A8E6CF]/40 to-[#56ab2f]/70 pointer-events-none" />

      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div className="relative pt-2 px-4 pb-1 z-20">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        <div className="flex items-center justify-between mt-1">
          {/* Back Button */}
          <button
            onClick={onBack || (() => onNavigate?.('home'))}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md border border-white/60 flex items-center justify-center text-[#1c324f] active:scale-90 transition-transform"
          >
            <svg className="w-6 h-6 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-xl font-black text-[#1c355e] tracking-tight text-center flex-1 pr-10 drop-shadow-sm">
            Global Ranking
          </h1>
        </div>
      </div>

      {/* ----------------- TOP 3 PODIUM SECTION ----------------- */}
      <div className="relative z-10 px-4 pt-3 pb-2 flex justify-center items-end">
        <div className="grid grid-cols-3 gap-2 items-end w-full max-w-xs">
          
          {/* 2nd Place Podium (Left) */}
          <div className="flex flex-col items-center">
            {/* 2nd Place Character */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-white shadow-lg flex items-center justify-center mb-1 transform hover:scale-105 transition-transform">
              {topPodium.second.icon}
            </div>
            <p className="text-[11px] font-black text-[#1c324f] truncate max-w-[80px] drop-shadow-xs">
              {topPodium.second.name}
            </p>
            {/* Podium Block 2nd */}
            <div className="w-full h-24 bg-gradient-to-b from-[#D5D8DC] to-[#A6ACAF] rounded-t-2xl shadow-md border-t-2 border-l border-r border-white flex flex-col items-center justify-start pt-2">
              <span className="text-base font-black text-white drop-shadow">2nd</span>
              <div className="mt-2 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full">
                <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                <span className="text-[11px] font-black text-white">{topPodium.second.apples}</span>
              </div>
            </div>
          </div>

          {/* 1st Place Podium (Center & Tallest) */}
          <div className="flex flex-col items-center -mt-6">
            {/* Vector Crown */}
            <Crown className="w-7 h-7 text-amber-500 fill-amber-400 stroke-amber-600 animate-bounce -mb-1 drop-shadow" />
            {/* 1st Place Character */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-100 border-3 border-amber-300 shadow-xl flex items-center justify-center mb-1 transform hover:scale-105 transition-transform ring-4 ring-yellow-400/40">
              {topPodium.first.icon}
            </div>
            <p className="text-xs font-black text-[#1c324f] truncate max-w-[90px] drop-shadow-xs">
              {topPodium.first.name}
            </p>
            {/* Podium Block 1st */}
            <div className="w-full h-32 bg-gradient-to-b from-[#F4D03F] to-[#E67E22] rounded-t-2xl shadow-xl border-t-2 border-l border-r border-yellow-200 flex flex-col items-center justify-start pt-2">
              <span className="text-xl font-black text-white drop-shadow-md">1st</span>
              <div className="mt-3 flex items-center gap-1 bg-black/25 px-2.5 py-0.5 rounded-full shadow-inner">
                <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                <span className="text-xs font-black text-white">{topPodium.first.apples}</span>
              </div>
            </div>
          </div>

          {/* 3rd Place Podium (Right) */}
          <div className="flex flex-col items-center">
            {/* 3rd Place Character */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-700/20 to-amber-100 border-2 border-white shadow-lg flex items-center justify-center mb-1 transform hover:scale-105 transition-transform">
              {topPodium.third.icon}
            </div>
            <p className="text-[11px] font-black text-[#1c324f] truncate max-w-[80px] drop-shadow-xs">
              {topPodium.third.name}
            </p>
            {/* Podium Block 3rd */}
            <div className="w-full h-20 bg-gradient-to-b from-[#E59866] to-[#BA4A00] rounded-t-2xl shadow-md border-t-2 border-l border-r border-amber-200 flex flex-col items-center justify-start pt-2">
              <span className="text-base font-black text-white drop-shadow">3rd</span>
              <div className="mt-1.5 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full">
                <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                <span className="text-[11px] font-black text-white">{topPodium.third.apples}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ----------------- WHITE LEADERBOARD LIST CONTAINER ----------------- */}
      <div className="relative z-20 flex-1 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden">
        
        {/* Scrollable Rank Rows */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-gray-100">
          {rankings.map((item) => (
            <div 
              key={item.rank}
              className="flex items-center justify-between py-2.5 hover:bg-gray-50/80 rounded-xl px-2 transition-colors"
            >
              {/* Rank & User Details */}
              <div className="flex items-center gap-3.5">
                {/* Rank Number */}
                <span className="w-6 text-center text-sm font-black text-gray-500">
                  {item.rank}
                </span>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-50 to-amber-50 border border-emerald-100 flex items-center justify-center shadow-xs">
                  {item.icon}
                </div>

                {/* Name & Level */}
                <div>
                  <h3 className="text-sm font-extrabold text-[#1a2f4c] leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-[11px] font-bold text-gray-400">
                    {item.level}
                  </p>
                </div>
              </div>

              {/* Apple Score */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-xl border border-gray-100 shadow-xs">
                <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                <span className="text-sm font-black text-[#1c324f]">{item.apples}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ----------------- STICKY BOTTOM CARD ("YOUR RANK") ----------------- */}
        <div className="p-3 bg-gradient-to-r from-[#FFF9E6] to-[#FFF4D4] border-t-2 border-[#FFE8A3] shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-sky-100 flex items-center justify-center flex-shrink-0">
              <img src={userAvatarImg} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#8C6B1F] leading-tight">
                Your Rank:
              </p>
              <h2 className="text-lg font-black text-[#1c324f] tracking-tight">
                #14,203
              </h2>
            </div>
          </div>

          {/* User's Total Apples */}
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-amber-200">
            <img src={appleImg} alt="Apple" className="w-5 h-5 object-contain filter drop-shadow-sm" />
            <span className="text-base font-black text-[#12284c]">
              {(user.apples || 1250).toLocaleString()}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
