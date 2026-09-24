import React, { useState, useEffect } from 'react';
import { Crown, User, Award, Medal, Shield, Sparkles } from 'lucide-react';
import appleImg from '../../assets/apple.png';
import homeBgImg from '../../assets/home-page-background.png';
import { getAvatarSrc } from '../utils/avatars';
import CustomTitleBar from '../components/CustomTitleBar';
import { getLeaderboardFromDB } from '../firebase';

export default function LeaderboardPage({ 
  user = { name: 'Farmer', apples: 0, level: 1, id: null, avatar: 'avatar-1' }, 
  onBack, 
  onNavigate 
}) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getLeaderboardFromDB().then((data) => {
      if (isMounted) {
        if (Array.isArray(data) && data.length > 0) {
          setLeaderboard(data);
        } else {
          // If no users in DB yet, show the current active user as top farmer
          setLeaderboard([
            {
              id: user.id || 'me',
              rank: 1,
              name: user.name || 'Farmer',
              avatar: user.avatar || 'avatar-1',
              apples: user.apples || 0,
              level: user.level || 1,
            }
          ]);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const userAvatarImg = getAvatarSrc(user.avatar);

  // Top 3 Real Winners from DB
  const firstPlace = leaderboard[0] || null;
  const secondPlace = leaderboard[1] || null;
  const thirdPlace = leaderboard[2] || null;

  // Rank 4 to 50
  const otherRankings = leaderboard.slice(3);

  // Calculate current user's real rank in DB
  const myIndex = leaderboard.findIndex(
    (u) => (user.id && u.id?.toString() === user.id?.toString()) || u.name === user.name
  );
  const myRank = myIndex !== -1 ? `#${myIndex + 1}` : `#${leaderboard.length > 0 ? leaderboard.length + 1 : 1}`;

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
      <div className="relative z-10 px-4 pt-2 pb-0 flex justify-center items-end -mb-[1px]">
        <div className="grid grid-cols-3 gap-2 items-end w-full max-w-xs">
          
          {/* 2nd Place Podium (Left) */}
          <div className="flex flex-col items-center">
            {secondPlace ? (
              <>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-white shadow-lg overflow-hidden flex items-center justify-center mb-1 transform hover:scale-105 transition-transform">
                  <img src={getAvatarSrc(secondPlace.avatar)} alt="2nd" className="w-full h-full object-cover" />
                </div>
                <p className="text-[11px] font-black text-[#1c324f] truncate max-w-[80px] drop-shadow-xs">
                  {secondPlace.name}
                </p>
                <div className="w-full h-24 bg-gradient-to-b from-[#D5D8DC] to-[#A6ACAF] rounded-t-2xl shadow-md border-t-2 border-l border-r border-white flex flex-col items-center justify-start pt-2">
                  <span className="text-base font-black text-white drop-shadow">2nd</span>
                  <div className="mt-2 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full">
                    <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                    <span className="text-[11px] font-black text-white">{(secondPlace.apples || 0).toLocaleString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-24 bg-white/30 backdrop-blur-sm rounded-t-2xl border border-white/50 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold">
                2nd
              </div>
            )}
          </div>

          {/* 1st Place Podium (Center & Tallest) */}
          <div className="flex flex-col items-center -mt-6">
            <Crown className="w-7 h-7 text-amber-500 fill-amber-400 stroke-amber-600 animate-bounce -mb-1 drop-shadow" />
            {firstPlace ? (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-100 border-3 border-amber-300 shadow-xl overflow-hidden flex items-center justify-center mb-1 transform hover:scale-105 transition-transform ring-4 ring-yellow-400/40">
                  <img src={getAvatarSrc(firstPlace.avatar)} alt="1st" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-black text-[#1c324f] truncate max-w-[90px] drop-shadow-xs">
                  {firstPlace.name}
                </p>
                <div className="w-full h-32 bg-gradient-to-b from-[#F4D03F] to-[#E67E22] rounded-t-2xl shadow-xl border-t-2 border-l border-r border-yellow-200 flex flex-col items-center justify-start pt-2">
                  <span className="text-xl font-black text-white drop-shadow-md">1st</span>
                  <div className="mt-3 flex items-center gap-1 bg-black/25 px-2.5 py-0.5 rounded-full shadow-inner">
                    <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-black text-white">{(firstPlace.apples || 0).toLocaleString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-32 bg-white/40 backdrop-blur-sm rounded-t-2xl border border-white/60 flex flex-col items-center justify-center text-amber-800 text-xs font-bold">
                1st
              </div>
            )}
          </div>

          {/* 3rd Place Podium (Right) */}
          <div className="flex flex-col items-center">
            {thirdPlace ? (
              <>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-700/20 to-amber-100 border-2 border-white shadow-lg overflow-hidden flex items-center justify-center mb-1 transform hover:scale-105 transition-transform">
                  <img src={getAvatarSrc(thirdPlace.avatar)} alt="3rd" className="w-full h-full object-cover" />
                </div>
                <p className="text-[11px] font-black text-[#1c324f] truncate max-w-[80px] drop-shadow-xs">
                  {thirdPlace.name}
                </p>
                <div className="w-full h-20 bg-gradient-to-b from-[#E59866] to-[#BA4A00] rounded-t-2xl shadow-md border-t-2 border-l border-r border-amber-200 flex flex-col items-center justify-start pt-2">
                  <span className="text-base font-black text-white drop-shadow">3rd</span>
                  <div className="mt-1.5 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full">
                    <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                    <span className="text-[11px] font-black text-white">{(thirdPlace.apples || 0).toLocaleString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-20 bg-white/30 backdrop-blur-sm rounded-t-2xl border border-white/50 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold">
                3rd
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ----------------- WHITE LEADERBOARD LIST CONTAINER ----------------- */}
      <div className="relative z-20 flex-1 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden">
        
        {/* Scrollable Rank Rows */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-gray-100">
          {loading ? (
            <div className="h-36 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-bold text-slate-500">Loading Real Rankings...</p>
            </div>
          ) : otherRankings.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <p className="text-xs font-bold text-slate-500">All Top Farmers Displayed Above</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Harvest apples to claim higher rankings</p>
            </div>
          ) : (
            otherRankings.map((item) => (
              <div 
                key={item.id || item.rank}
                className="flex items-center justify-between py-2.5 hover:bg-gray-50/80 rounded-xl px-2 transition-colors"
              >
                {/* Rank & User Details */}
                <div className="flex items-center gap-3.5">
                  {/* Rank Number */}
                  <span className="w-6 text-center text-sm font-black text-gray-500">
                    {item.rank}
                  </span>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-50 to-amber-50 border border-emerald-100 overflow-hidden flex items-center justify-center shadow-xs">
                    <img src={getAvatarSrc(item.avatar)} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Name & Level */}
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1a2f4c] leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400">
                      Lv. {item.level || 1}
                    </p>
                  </div>
                </div>

                {/* Apple Score */}
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-xl border border-gray-100 shadow-xs">
                  <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain" />
                  <span className="text-sm font-black text-[#1c324f]">{(item.apples || 0).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
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
                {myRank}
              </h2>
            </div>
          </div>

          {/* User's Total Apples */}
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-amber-200">
            <img src={appleImg} alt="Apple" className="w-5 h-5 object-contain filter drop-shadow-sm" />
            <span className="text-base font-black text-[#12284c]">
              {(user.apples || 0).toLocaleString()}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
