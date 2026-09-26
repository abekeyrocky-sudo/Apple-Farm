import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Wallet, Lock } from 'lucide-react';
import { TonConnectUI } from '@tonconnect/ui';
import appleImg from '../../assets/apple.png';
import diamondImg from '../../assets/daimond.png';
import bksImg from '../../assets/bks.png';
import gramImg from '../../assets/gram.png';
import CustomTitleBar from '../components/CustomTitleBar';
import { soundManager } from '../utils/soundManager';

// 💎 Master Wallet Address (ফি রিসিভ করার অ্যাড্রেস)
const MASTER_WALLET_ADDRESS = 'UQC576HcthVEI8QtkfQ80iHPDz1iz8VfEWsZPi3c3ihnrN5c';

// 💎 GRAM (TON) এর ৬টি ফিক্সড প্যাকেজ ও ট্রিকি নেটওয়ার্ক ফি (~20%)
const GRAM_PACKAGES = [
  { id: 1, gram: '0.05', label: '0.05 GRAM', apples: 990, diamonds: 9, feeTon: '0.019', feeNano: '19000000', popular: false },
  { id: 2, gram: '0.25', label: '0.25 GRAM', apples: 4990, diamonds: 39, feeTon: '0.049', feeNano: '49000000', popular: true },
  { id: 3, gram: '0.50', label: '0.50 GRAM', apples: 9990, diamonds: 79, feeTon: '0.099', feeNano: '99000000', popular: false },
  { id: 4, gram: '2.00', label: '2 GRAM', apples: 39990, diamonds: 299, feeTon: '0.39', feeNano: '390000000', popular: false },
  { id: 5, gram: '5.00', label: '5 GRAM', apples: 99990, diamonds: 699, feeTon: '0.99', feeNano: '990000000', popular: false },
  { id: 6, gram: '10.00', label: '10 GRAM', apples: 199990, diamonds: 1299, feeTon: '1.99', feeNano: '1990000000', popular: false },
];

// পেমেন্ট মেথড তালিকা
const PAYMENT_METHODS = [
  {
    id: 'ton',
    name: 'GRAM (TON)',
    fee: 'Instant • Fast & Easy',
    isGram: true,
    iconBg: '',
    icon: (
      <img src={gramImg} alt="GRAM" className="w-full h-full object-cover" />
    ),
  },
  {
    id: 'bkash',
    name: 'bKash',
    fee: 'Instant • Mobile Banking',
    placeholder: 'Enter 11-digit bKash Number (01XXXXXXXXX)',
    isGram: false,
    iconBg: '',
    icon: (
      <img src={bksImg} alt="bKash" className="w-full h-full object-cover" />
    ),
  },
  {
    id: 'upi',
    name: 'UPI',
    fee: 'Instant • Fast Payout',
    placeholder: 'Enter UPI ID (e.g. username@upi / phonepe)',
    isGram: false,
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
    isGram: false,
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
    isGram: false,
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
    isGram: false,
    iconBg: 'bg-gradient-to-tr from-[#4F008C] to-[#6E1BA8]',
    icon: (
      <span className="font-black text-white text-[11px] tracking-tight">
        stc
      </span>
    ),
  },
];

export default function WithdrawPage({ 
  user = { apples: 0, diamonds: 0.0, gramWithdrawStep: 0 }, 
  onBack,
  onWithdrawSubmit 
}) {
  const currentStep = (user?.gramWithdrawStep || 0) % GRAM_PACKAGES.length;

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedGramPkg, setSelectedGramPkg] = useState(GRAM_PACKAGES[currentStep] || GRAM_PACKAGES[0]);
  const [accountInput, setAccountInput] = useState('');
  const [amountInput, setAmountInput] = useState('199999');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [txError, setTxError] = useState('');

  // TON Connect State
  const [tonConnectUI, setTonConnectUI] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [shortAddress, setShortAddress] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  // Auto-sync active sequential package
  useEffect(() => {
    if (selectedMethod?.isGram) {
      setSelectedGramPkg(GRAM_PACKAGES[currentStep] || GRAM_PACKAGES[0]);
    }
  }, [selectedMethod, currentStep]);

  // TON Connect ইনিশিয়ালাইজেশন
  useEffect(() => {
    try {
      const manifest = window.location.origin + '/tonconnect-manifest.json';
      const tc = window.__tonConnectUI || new TonConnectUI({ manifestUrl: manifest });
      window.__tonConnectUI = tc;
      setTonConnectUI(tc);

      if (tc.wallet) {
        setIsWalletConnected(true);
        const addr = tc.wallet.account.address;
        setFullAddress(addr);
        setShortAddress(addr.slice(0, 4) + '...' + addr.slice(-4));
      }

      const unsubscribe = tc.onStatusChange((wallet) => {
        if (wallet) {
          setIsWalletConnected(true);
          const addr = wallet.account.address;
          setFullAddress(addr);
          setShortAddress(addr.slice(0, 4) + '...' + addr.slice(-4));
        } else {
          setIsWalletConnected(false);
          setFullAddress('');
          setShortAddress('');
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (e) {
      console.warn('TonConnectUI init in WithdrawPage:', e);
    }
  }, []);

  // ওয়ালেট কানেক্ট হ্যান্ডলার
  const handleConnectWallet = async () => {
    soundManager.playClickSound();
    try {
      if (tonConnectUI) {
        await tonConnectUI.openModal();
      }
    } catch (e) {
      console.error('Failed to open TON Connect modal:', e);
    }
  };

  // মেথড সিলেক্ট হ্যান্ডলার
  const handleSelectMethod = (method) => {
    soundManager.playClickSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
    setSelectedMethod(method);
    setIsSuccess(false);
    setIsProcessingTx(false);
    setTxError('');
    setAccountInput('');
    setAmountInput('199999');
    if (method.isGram) {
      setSelectedGramPkg(GRAM_PACKAGES[currentStep] || GRAM_PACKAGES[0]);
    }
  };

  // গ্রাম প্যাকেজ সিলেক্ট হ্যান্ডলার
  const handleSelectGramPkg = (pkg, idx) => {
    soundManager.playClickSound();
    if (idx < currentStep) {
      setTxError(`Already claimed in this cycle! Complete all 6 tiers to restart.`);
      return;
    }
    if (idx > currentStep) {
      setTxError(`Tier locked! Complete ${GRAM_PACKAGES[currentStep]?.label} first.`);
      return;
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
    setSelectedGramPkg(pkg);
    setTxError('');
  };

  // উইথড্রয়ালের যোগ্যতা চেক
  const userApples = user?.apples || 0;
  const userDiamonds = user?.diamonds || 0;
  const requestedApples = Number(amountInput || 0);

  const hasEnoughForGram = selectedMethod?.isGram
    ? userApples >= selectedGramPkg.apples && userDiamonds >= selectedGramPkg.diamonds
    : userApples >= requestedApples && requestedApples >= 199999 && userDiamonds >= 199;

  // উইথড্র কনফার্মেশন ও মাস্টার ওয়ালেটে ফি ট্রান্সফার
  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    setTxError('');

    if (selectedMethod.isGram) {
      if (!isWalletConnected) {
        handleConnectWallet();
        return;
      }
      if (!hasEnoughForGram) return;

      setIsProcessingTx(true);

      try {
        // ১. মাস্টার ওয়ালেটে ট্রিকি নেটওয়ার্ক ফি (~20%) পাঠানোর অন-চেইন রিকোয়েস্ট
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: MASTER_WALLET_ADDRESS,
              amount: selectedGramPkg.feeNano,
            },
          ],
        };

        const txResult = await tonConnectUI.sendTransaction(transaction);
        console.log('[Master Wallet Fee Paid Successfully]:', txResult);

        soundManager.playSuccessSound();
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        setIsProcessingTx(false);
        setIsSuccess(true);

        const nextStep = (currentStep + 1) % GRAM_PACKAGES.length;

        if (onWithdrawSubmit) {
          onWithdrawSubmit({
            method: 'GRAM (TON)',
            gramAmount: selectedGramPkg.gram,
            feeTon: selectedGramPkg.feeTon,
            account: fullAddress || shortAddress,
            amount: selectedGramPkg.apples,
            diamonds: selectedGramPkg.diamonds,
            nextGramStep: nextStep,
            boc: txResult?.boc || null,
          });
        }

        setTimeout(() => {
          setIsSuccess(false);
          setSelectedMethod(null);
        }, 2400);
      } catch (err) {
        console.warn('[Fee Transaction Rejected/Error]:', err);
        setIsProcessingTx(false);
        setTxError('Transaction cancelled or insufficient TON in wallet.');
      }
    } else {
      const appleNum = Number(amountInput || 0);
      if (!accountInput.trim()) {
        setTxError('Please enter your account / phone number.');
        return;
      }
      if (appleNum < 199999) {
        setTxError('Minimum withdrawal amount is 199,999 Apples.');
        return;
      }
      if (userApples < appleNum) {
        setTxError(`Insufficient Apples. You have ${userApples.toLocaleString()} Apples.`);
        return;
      }
      if (userDiamonds < 199) {
        setTxError(`Diamond Requirement: 199 Diamonds needed.`);
        return;
      }

      soundManager.playSuccessSound();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      setIsSuccess(true);

      if (onWithdrawSubmit) {
        onWithdrawSubmit({
          method: selectedMethod.name,
          account: accountInput,
          amount: appleNum,
          diamonds: 199,
          usdAmount: (appleNum / 9999).toFixed(2),
        });
      }

      setTimeout(() => {
        setIsSuccess(false);
        setSelectedMethod(null);
      }, 2200);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-[#eaf6ff] via-[#f4f9ff] to-[#e8f5e9] flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      
      {/* ----------------- TOP HEADER AREA ----------------- */}
      <div className="flex-1 space-y-3">
        <CustomTitleBar title="Apple Farm" darkText={true} />
        {/* Navigation Bar */}
        <div className="relative flex items-center justify-between pt-1">
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
                {userApples.toLocaleString()}
              </span>
            </div>

            {/* Diamond Balance */}
            <div className="flex items-center gap-1.5">
              <img src={diamondImg} alt="Diamond" className="w-5 h-5 object-contain filter drop-shadow" />
              <span className="text-base font-black text-[#192f52]">
                {Number(userDiamonds).toFixed(1)}
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
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-b from-[#f8fcff] to-[#edf7ee] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-sky-100 space-y-3.5 animate-slide-up max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full ${selectedMethod.iconBg} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                  {selectedMethod.icon}
                </div>
                <div>
                  <h3 className="font-black text-[#192f52] text-sm">
                    Withdraw to {selectedMethod.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    {selectedMethod.isGram ? 'Fast & Easy • Instant Payout' : 'Instant automated processing'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedMethod(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 text-xs font-bold active:scale-95"
              >
                ✕
              </button>
            </div>

            {isSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-sm">
                  ✓
                </div>
                <h4 className="font-black text-emerald-800 text-base">Withdrawal Submitted!</h4>
                <p className="text-xs font-bold text-slate-500 px-4">
                  {selectedMethod.isGram 
                    ? `${selectedGramPkg.label} payout request placed to ${shortAddress}.`
                    : `${amountInput} Apples payout request placed successfully.`
                  }
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitWithdraw} className="space-y-3">
                
                {/* 🌟 1. GRAM (TON) 6 PACKAGE SELECTION GRID (SEQUENTIAL PROGRESSION) 🌟 */}
                {selectedMethod.isGram && (
                  <div>
                    <div className="flex justify-between items-center mb-2 px-0.5">
                      <label className="text-xs font-black text-[#192f52]">
                        Select GRAM Package:
                      </label>
                      <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                        Step {currentStep + 1} of 6
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {GRAM_PACKAGES.map((pkg, idx) => {
                        const isCompleted = idx < currentStep;
                        const isCurrent = idx === currentStep;
                        const isLocked = idx > currentStep;

                        return (
                          <div
                            key={pkg.id}
                            onClick={() => handleSelectGramPkg(pkg, idx)}
                            className={`relative py-3.5 px-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${
                              isCurrent
                                ? 'border-emerald-500 bg-emerald-50/95 shadow-md ring-2 ring-emerald-200 cursor-pointer active:scale-95'
                                : isCompleted
                                ? 'border-slate-200 bg-slate-50/80 opacity-60 cursor-pointer'
                                : 'border-slate-200/70 bg-slate-100/60 opacity-45 cursor-pointer'
                            }`}
                          >
                            {/* Popular Badge */}
                            {pkg.popular && isCurrent && (
                              <span className="absolute -top-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                                HOT
                              </span>
                            )}

                            {/* Lock Icon for future locked tiers */}
                            {isLocked && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-xs">
                                <Lock className="w-2 h-2" />
                              </div>
                            )}

                            {/* Completed Tag for previous tiers */}
                            {isCompleted && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shadow-xs">
                                <Check className="w-2 h-2 stroke-[3]" />
                              </div>
                            )}

                            {/* Clean Gram Amount Only */}
                            <span className={`text-xs font-black leading-tight text-center ${
                              isCurrent 
                                ? 'text-emerald-700' 
                                : isCompleted 
                                ? 'text-slate-400 line-through' 
                                : 'text-slate-400'
                            }`}>
                              {pkg.label}
                            </span>

                            {/* Check Icon for Current Selected */}
                            {isCurrent && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xs">
                                <Check className="w-2 h-2 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 🌟 2. TON WALLET CONNECT AREA (NO MANUAL TYPING) 🌟 */}
                {selectedMethod.isGram ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      TON Destination Wallet
                    </label>

                    {isWalletConnected ? (
                      <div className="flex items-center justify-between p-3 bg-sky-50/90 border border-sky-200 rounded-2xl shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#0098EA] text-white flex items-center justify-center font-black text-xs shadow-xs">
                            TON
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-[#192f52] font-mono">{shortAddress}</span>
                              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md">
                                Connected
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">Automatic direct payout</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => tonConnectUI?.disconnect()}
                          className="text-[11px] font-bold text-slate-400 hover:text-red-500 active:scale-95 px-2 py-1"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectWallet}
                        className="w-full py-3 bg-gradient-to-r from-[#0098EA] to-[#0077c2] hover:brightness-105 active:scale-95 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-sky-400"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Connect TON Wallet</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Fiat / Non-Gram Account Input */
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Account / Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={selectedMethod.placeholder}
                      value={accountInput}
                      onChange={(e) => setAccountInput(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-xs"
                    />
                  </div>
                )}

                {/* 3. Non-Gram Amount Input (For bKash, UPI, etc.) */}
                {!selectedMethod.isGram && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-500">
                        Apple Amount
                      </label>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Rate: 9999 Apples ≈ $1.00
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="199999"
                        max={userApples}
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="w-full text-sm font-black p-3 pl-8 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                      <img src={appleImg} alt="Apple" className="w-4 h-4 object-contain absolute left-2.5 top-3.5" />
                    </div>
                  </div>
                )}

                {/* 4. Selected Requirements Summary Box */}
                {selectedMethod.isGram ? (
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 px-4 border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs font-black text-[#192f52]">
                      <span className="text-slate-500">Selected Package:</span>
                      <span className="text-emerald-700 font-black text-sm">{selectedGramPkg.label}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                      <span className="text-slate-500 font-bold">Requirement:</span>
                      <div className="flex items-center gap-2 font-black text-xs">
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg">
                          <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                          {selectedGramPkg.apples.toLocaleString()}
                        </span>
                        <span className="text-slate-400">+</span>
                        <span className="flex items-center gap-1 text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-lg">
                          <img src={diamondImg} alt="Diamond" className="w-3 h-3 object-contain" />
                          {selectedGramPkg.diamonds}
                        </span>
                      </div>
                    </div>

                    {!hasEnoughForGram && (
                      <div className="pt-1 text-red-500 font-bold text-[11px] flex items-center gap-1.5 bg-red-50/70 p-2 rounded-xl border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Insufficient balance (Need {selectedGramPkg.apples.toLocaleString()} Apples & {selectedGramPkg.diamonds} Diamonds)</span>
                      </div>
                    )}

                    {txError && (
                      <div className="pt-1 text-rose-600 font-bold text-[11px] flex items-center gap-1.5 bg-rose-50 p-2 rounded-xl border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{txError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Non-GRAM Requirement Box */
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 px-4 border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs font-black text-[#192f52]">
                      <span className="text-slate-500">Minimum Withdraw:</span>
                      <span className="text-emerald-700 font-black text-sm">199,999 Apples</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                      <span className="text-slate-500 font-bold">Requirement:</span>
                      <div className="flex items-center gap-2 font-black text-xs">
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg">
                          <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                          {requestedApples.toLocaleString()}
                        </span>
                        <span className="text-slate-400">+</span>
                        <span className="flex items-center gap-1 text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-lg">
                          <img src={diamondImg} alt="Diamond" className="w-3 h-3 object-contain" />
                          199 💎
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                      <span className="text-slate-500 font-bold">Estimated Payout:</span>
                      <span className="text-emerald-700 font-black text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        ≈ ${(requestedApples / 9999).toFixed(2)} USD
                      </span>
                    </div>

                    {requestedApples < 199999 && (
                      <div className="pt-1 text-rose-500 font-bold text-[11px] flex items-center gap-1.5 bg-rose-50/70 p-2 rounded-xl border border-rose-100">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Minimum withdrawal is 199,999 Apples.</span>
                      </div>
                    )}

                    {userDiamonds < 199 && (
                      <div className="pt-1 text-rose-500 font-bold text-[11px] flex items-center gap-1.5 bg-rose-50/70 p-2 rounded-xl border border-rose-100">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Need 199 Diamonds (You have {userDiamonds.toFixed(1)} 💎)</span>
                      </div>
                    )}

                    {userApples < requestedApples && (
                      <div className="pt-1 text-rose-500 font-bold text-[11px] flex items-center gap-1.5 bg-rose-50/70 p-2 rounded-xl border border-rose-100">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Insufficient Apples (You have {userApples.toLocaleString()})</span>
                      </div>
                    )}

                    {txError && (
                      <div className="pt-1 text-rose-600 font-bold text-[11px] flex items-center gap-1.5 bg-rose-50 p-2 rounded-xl border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{txError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Confirm / Connect Action Button */}
                {selectedMethod.isGram && !isWalletConnected ? (
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    className="w-full py-3.5 bg-gradient-to-r from-[#0098EA] to-[#0077c2] hover:brightness-105 active:scale-95 text-white font-black text-sm rounded-2xl shadow-[0_3px_0_#005b94] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect TON Wallet to Withdraw</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!hasEnoughForGram || isProcessingTx}
                    className={`w-full py-3.5 font-black text-sm rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                      hasEnoughForGram && !isProcessingTx
                        ? 'bg-gradient-to-b from-[#2ecc71] to-[#1e8a4a] text-white shadow-[0_3px_0_#145a32] hover:brightness-105 cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {isProcessingTx ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>
                        {hasEnoughForGram 
                          ? 'Confirm Withdraw' 
                          : (!selectedMethod.isGram && userDiamonds < 199 
                              ? 'Need 199 Diamonds' 
                              : (!selectedMethod.isGram && requestedApples < 199999 
                                  ? 'Min 199,999 Apples' 
                                  : 'Insufficient Balance'))}
                      </span>
                    )}
                  </button>
                )}

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
