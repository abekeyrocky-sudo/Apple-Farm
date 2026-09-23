import React, { useState } from 'react';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import bksImg from '../../assets/bks.png';
import gramImg from '../../assets/gram.png';

// রেফারেন্স ইমেজের হুবহু পেমেন্ট গেটওয়ে ডাটা ও লোগো
const PAYMENT_METHODS = [
  {
    id: 'ton',
    name: 'GRAM (TON)',
    fee: 'Instant • Low Fee',
    placeholder: 'Enter TON Wallet Address (e.g. EQD...)',
    iconBg: '',
    icon: (
      <img src={gramImg} alt="GRAM" className="w-full h-full object-cover" />
    ),
  },
  {
    id: 'bkash',
    name: 'bKash',
    fee: 'Instant • Low Fee',
    placeholder: 'Enter 11-digit bKash Number (01XXXXXXXXX)',
    iconBg: '',
    icon: (
      <img src={bksImg} alt="bKash" className="w-full h-full object-cover" />
    ),
  },
  {
    id: 'upi',
    name: 'UPI',
    fee: 'Instant • Low Fee',
    placeholder: 'Enter UPI ID (e.g. username@upi / phonepe)',
    iconBg: 'bg-gradient-to-tr from-[#f4f7f6] to-[#e6ecea] border border-slate-200',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M4 4l8 8-8 8V4z" fill="#097939" />
        <path d="M11 4l8 8-8 8V4z" fill="#ED752E" />
      </svg>
    ),
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    fee: 'Instant • Low Fee',
    placeholder: 'Enter JazzCash Mobile Number',
    iconBg: 'bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C]',
    icon: (
      <span className="font-black text-amber-300 text-xl tracking-tighter">
        Ji
      </span>
    ),
  },
  {
    id: 'esewa',
    name: 'eSewa',
    fee: 'Instant • Low Fee',
    placeholder: 'Enter eSewa ID / Mobile Number',
    iconBg: 'bg-gradient-to-tr from-[#60BB46] to-[#43A047]',
    icon: (
      <span className="font-black text-white text-xl lowercase">
        e
      </span>
    ),
  },
  {
    id: 'stcpay',
    name: 'STC Pay',
    fee: 'Instant • Low Fee',
    placeholder: 'Enter STC Pay Mobile Number',
    iconBg: 'bg-gradient-to-tr from-[#4F008C] to-[#6E1BA8]',
    icon: (
      <span className="font-black text-white text-[11px] tracking-tight">
        stc
      </span>
    ),
  },
];

export default function WithdrawPage({ 
  user = { apples: 0, diamonds: 0.0 }, 
  onBack,
  onWithdrawSubmit 
}) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [accountInput, setAccountInput] = useState('');
  const [amountInput, setAmountInput] = useState('1000');
  const [isSuccess, setIsSuccess] = useState(false);

  // মেথড সিলেক্ট হ্যান্ডলার
  const handleSelectMethod = (method) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
    setSelectedMethod(method);
    setIsSuccess(false);
    setAccountInput('');
  };

  // উইথড্র কনফার্মেশন
  const handleSubmitWithdraw = (e) => {
    e.preventDefault();
    if (!accountInput) return;

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setIsSuccess(true);

    if (onWithdrawSubmit) {
      onWithdrawSubmit({
        method: selectedMethod.name,
        account: accountInput,
        amount: Number(amountInput),
      });
    }

    setTimeout(() => {
      setIsSuccess(false);
      setSelectedMethod(null);
    }, 2200);
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div className="flex-1 space-y-4">
        
        {/* Navigation Bar */}
        <div className="relative flex items-center justify-between pt-2">
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
            Withdraw
          </h1>

          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* 1. YOUR BALANCE CARD */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 px-5 border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.05)]">
          <span className="text-xs font-bold text-[#6782a2]">Your Balance:</span>
          
          <div className="flex items-center justify-between mt-1">
            {/* Apple Balance */}
            <div className="flex items-center gap-2.5">
              <img src={appleImg} alt="Apple" className="w-8 h-8 object-contain filter drop-shadow" />
              <span className="text-2xl font-black text-[#192f52] tracking-tight">
                {(user.apples || 0).toLocaleString()}
              </span>
            </div>

            {/* Diamond Balance */}
            <div className="flex items-center gap-1.5">
              <img src={diamondImg} alt="Diamond" className="w-5 h-5 object-contain filter drop-shadow" />
              <span className="text-base font-black text-[#192f52]">
                {Number(user.diamonds || 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. SECTION TITLE */}
        <h2 className="text-base font-black text-[#192f52] tracking-tight pt-1">
          Choose Payment Method
        </h2>

        {/* 3. PAYMENT METHODS LIST */}
        <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-230px)] pb-6">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.id}
              onClick={() => handleSelectMethod(method)}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-between cursor-pointer hover:border-emerald-300 active:scale-[0.99] transition-all"
            >
              {/* Left: Method Logo & Name */}
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-full ${method.iconBg} flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0`}>
                  {method.icon}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#192f52] leading-tight">
                    {method.name}
                  </h3>
                  <p className="text-[11px] font-bold text-[#6483a7]">
                    {method.fee}
                  </p>
                </div>
              </div>

              {/* Right: Green Accent Chevron */}
              <div className="text-emerald-500">
                <svg className="w-5 h-5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ----------------- WITHDRAWAL MODAL / BOTTOM SHEET ----------------- */}
      {selectedMethod && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-sky-100 space-y-4 animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full ${selectedMethod.iconBg} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                  {selectedMethod.icon}
                </div>
                <h3 className="font-black text-[#192f52] text-sm">
                  Withdraw to {selectedMethod.name}
                </h3>
              </div>
              
              <button 
                onClick={() => setSelectedMethod(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {isSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                  ✓
                </div>
                <h4 className="font-black text-emerald-800 text-base">Withdrawal Submitted!</h4>
                <p className="text-xs font-bold text-slate-500">
                  {amountInput} Apples will be processed to your {selectedMethod.name} account shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitWithdraw} className="space-y-3.5">
                {/* Account / Address Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Account / Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={selectedMethod.placeholder}
                    value={accountInput}
                    onChange={(e) => setAccountInput(e.target.value)}
                    className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-farm-light-green"
                  />
                </div>

                {/* Amount to Withdraw */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-500">
                      Apple Amount
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600">
                      Rate: 1000 Apples ≈ $1.00
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="500"
                      max={user.apples}
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full text-sm font-black p-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-farm-light-green"
                    />
                    <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain absolute left-2.5 top-3.5" />
                  </div>
                </div>

                {/* Confirm Action Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] text-white font-black text-sm rounded-2xl shadow-[0_3px_0_#145a32] active:scale-95 transition-all mt-2"
                >
                  Confirm Withdraw
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
