import React from 'react';
import verifyBadgeImg from '../../assets/verify-badge.png';

export default function CustomTitleBar({ title = "Apple Farm", darkText = false }) {
  return (
    <div className="w-full flex items-center justify-center pt-2 pb-1 mb-2 z-30 select-none">
      <div className="flex items-center justify-center gap-1.5">
        <h1 className={`text-xl sm:text-2xl font-black tracking-wide font-sans ${
          darkText 
            ? 'text-[#1a2e4c] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]' 
            : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]'
        }`}>
          {title}
        </h1>
        <img 
          src={verifyBadgeImg} 
          alt="Verified" 
          className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] flex-shrink-0"
        />
      </div>
    </div>
  );
}


