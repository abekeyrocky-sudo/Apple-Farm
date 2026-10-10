import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  RotateCcw, 
  HelpCircle,
  Trophy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import appleImg from '../../assets/apple.png';
import { soundManager } from '../utils/soundManager';
import { formatApples } from '../utils/formatNumber';
import { addTransaction } from '../utils/transactionHistory';

// 🪜 10-Step Tree Ladder Multipliers (Up to 100X)
export const TREE_STEPS = [
  { step: 1, multiplier: 1.25, label: '1.25x' },
  { step: 2, multiplier: 1.60, label: '1.60x' },
  { step: 3, multiplier: 2.10, label: '2.10x' },
  { step: 4, multiplier: 3.00, label: '3.00x' },
  { step: 5, multiplier: 4.50, label: '4.50x' },
  { step: 6, multiplier: 7.50, label: '7.50x' },
  { step: 7, multiplier: 14.00, label: '14.0x' },
  { step: 8, multiplier: 28.00, label: '28.0x' },
  { step: 9, multiplier: 55.00, label: '55.0x' },
  { step: 10, multiplier: 100.00, label: '100X' },
];

const BET_OPTIONS = [10000, 50000, 100000];

export default function AppleTreeClimberView({
  user = { apples: 0, id: null },
  onUpdateUser,
  onBackToSpin,
}) {
  const [selectedBet, setSelectedBet] = useState(10000);
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE' | 'PLAYING' | 'CASHED_OUT' | 'BUSTED' | 'JACKPOT'
  const [currentStep, setCurrentStep] = useState(0); // 0 = ground, 1..10 = completed step
  
  // History of picks for each step: { [stepIndex]: { chosenIdx, rottenIdx, isSafe } }
  const [stepPicks, setStepPicks] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const ladderContainerRef = useRef(null);

  // Auto-scroll ladder to current step so user always sees the active row
  useEffect(() => {
    if (gameState === 'PLAYING' && ladderContainerRef.current) {
      const activeElement = ladderContainerRef.current.querySelector('[data-active-row="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, gameState]);

  const userApples = Number(user?.apples || 0);
  const currentMultiplier = currentStep > 0 ? TREE_STEPS[currentStep - 1].multiplier : 1;
  const currentWinAmount = Math.floor(selectedBet * currentMultiplier);

  // 🚀 1. START GAME (Deduct Bet)
  const handleStartGame = () => {
    setErrorMessage(null);
    if (userApples < selectedBet) {
      setErrorMessage(`Insufficient Apples! You have ${formatApples(userApples)} Apples.`);
      soundManager.playClickSound();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
      return;
    }

    // Deduct bet amount
    const remainingApples = userApples - selectedBet;
    onUpdateUser?.({ apples: remainingApples });

    // Add transaction
    if (user?.id) {
      addTransaction(user.id, {
        type: 'game_entry',
        amount: -selectedBet,
        currency: 'apple',
        title: 'Tree Climber Entry',
        subtitle: `100X Game Entry (${formatApples(selectedBet)} 🍎)`,
        timestamp: Date.now(),
        status: 'completed',
      });
    }

    soundManager.playHarvestSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    setGameState('PLAYING');
    setCurrentStep(0);
    setStepPicks({});
  };

  // 🍏 2. PICK AN APPLE AT NEXT STEP
  const handlePickApple = (pickedIdx) => {
    if (gameState !== 'PLAYING') return;

    const targetStep = currentStep + 1; // 1 to 10
    if (targetStep > 10) return;

    // Randomly place the rotten worm apple in 1 of the 3 baskets (0, 1, or 2)
    // 2 out of 3 are Safe Golden Apples!
    const rottenIdx = Math.floor(Math.random() * 3);
    const isSafe = pickedIdx !== rottenIdx;

    setStepPicks((prev) => ({
      ...prev,
      [targetStep]: { chosenIdx: pickedIdx, rottenIdx, isSafe },
    }));

    if (isSafe) {
      // Safe!
      const newStep = targetStep;
      setCurrentStep(newStep);

      soundManager.playHarvestSound();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      // Check if Step 10 reached (100X Jackpot!)
      if (newStep === 10) {
        const jackpotWin = Math.floor(selectedBet * 100);
        setGameState('JACKPOT');

        // Add payout to user
        const newTotal = userApples + jackpotWin;
        onUpdateUser?.({ apples: newTotal });

        if (user?.id) {
          addTransaction(user.id, {
            type: 'game_win',
            amount: jackpotWin,
            currency: 'apple',
            title: '100X JACKPOT CONQUERED! 🏆',
            subtitle: `Completed Tree Climber (+${formatApples(jackpotWin)} 🍎)`,
            timestamp: Date.now(),
            status: 'completed',
          });
        }

        soundManager.playSuccessSound();
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#2ECC71', '#E74C3C', '#3498DB'],
        });
      }
    } else {
      // Busted! Rotten Apple Hit
      setGameState('BUSTED');
      soundManager.playBustSound();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  // 💰 3. CASH OUT ACTION
  const handleCashOut = () => {
    if (gameState !== 'PLAYING' || currentStep === 0) return;

    const payout = currentWinAmount;
    setGameState('CASHED_OUT');

    // Add payout to user
    const newTotal = userApples + payout;
    onUpdateUser?.({ apples: newTotal });

    if (user?.id) {
      addTransaction(user.id, {
        type: 'game_win',
        amount: payout,
        currency: 'apple',
        title: `Tree Climber Cash Out (${currentMultiplier}x)`,
        subtitle: `Harvested +${formatApples(payout)} Apples!`,
        timestamp: Date.now(),
        status: 'completed',
      });
    }

    soundManager.playSuccessSound();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#2ECC71', '#FFD700', '#FFA500', '#FFFFFF'],
    });
  };

  // Handle Back Click
  const handleBack = () => {
    if (gameState === 'PLAYING' && currentStep > 0) {
      if (!window.confirm('You have active winnings! Are you sure you want to exit? Cash Out first to save your apples!')) {
        return;
      }
    }
    soundManager.playClickSound();
    onBackToSpin();
  };

  return (
    <div className="relative flex-1 flex flex-col justify-between px-3.5 pb-20 pt-1 w-full max-w-md mx-auto z-20">
      
      {/* ----------------- TOP SUBHEADER (Light Theme) ----------------- */}
      <div className="flex items-center justify-between mb-2 bg-white/90 backdrop-blur-md rounded-2xl p-2 px-3 border border-sky-100 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Back to Spin Wheel Button */}
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-[#192f52] flex items-center justify-center transition-all cursor-pointer"
            title="Back to Spin Wheel"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-[#192f52] leading-tight">Tree Climber</h2>
              <span className="text-[9px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-white px-1.5 py-0.2 rounded-full shadow-xs">
                100X
              </span>
            </div>
            <p className="text-[10px] font-bold text-[#6782a2] leading-none">Climb & Cash Out</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* User Apple Balance */}
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-xs font-black text-red-700 shadow-xs">
            <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
            <span>{formatApples(userApples)}</span>
          </div>

          {/* Help Button */}
          <button
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="w-7 h-7 rounded-full bg-slate-100 text-[#506e8c] hover:text-[#192f52] flex items-center justify-center cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* How to Play Accordion (Light Theme) */}
      {showHowToPlay && (
        <div className="bg-white/95 border border-amber-200 p-3.5 rounded-2xl shadow-lg text-xs space-y-1.5 mb-2 backdrop-blur-md animate-in fade-in flex-shrink-0">
          <div className="flex items-center justify-between font-black text-amber-900">
            <span className="flex items-center gap-1">📖 How to Play 100X Climber</span>
            <button onClick={() => setShowHowToPlay(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
          <ul className="space-y-1 text-[#334e68] text-[11px] leading-relaxed">
            <li>1. 🎯 <b>Select your Entry</b> (10K, 50K, or 100K Apples) and tap <b>Start Climb</b>.</li>
            <li>2. 🌳 Climb up the 10 branches of the tree towards the 100X crown!</li>
            <li>3. 🍏 On each branch, <b>2 apples are Golden (Safe)</b> and <b>1 is Rotten (Worm)</b>.</li>
            <li>4. 💰 Tap <b>Cash Out</b> at any safe step to pocket your profits immediately!</li>
            <li>5. 👑 Step 10 grants the glorious <b>100X Grand Jackpot</b>!</li>
          </ul>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="mb-2 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold p-2 px-3 rounded-xl flex items-center gap-2 animate-shake flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ----------------- 10-STEP TREE LADDER (LIGHT THEME) ----------------- */}
      <div 
        ref={ladderContainerRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[380px] scrollbar-thin scrollbar-thumb-amber-300 py-1"
      >
        {/* Render steps from 10 (top) down to 1 (bottom) */}
        {[...TREE_STEPS].reverse().map((stepObj) => {
          const stepNum = stepObj.step;
          const isCompleted = currentStep >= stepNum;
          const isActive = gameState === 'PLAYING' && currentStep + 1 === stepNum;
          const isLocked = currentStep + 1 < stepNum;
          const pickData = stepPicks[stepNum];

          return (
            <div
              key={stepNum}
              data-active-row={isActive ? 'true' : 'false'}
              className={`rounded-2xl p-2 px-3 transition-all duration-300 border flex items-center justify-between ${
                isActive
                  ? 'bg-gradient-to-r from-[#FFFDF0] via-[#FEF3C7] to-[#FFFDF0] border-amber-400 shadow-[0_4px_14px_rgba(245,158,11,0.25)] ring-2 ring-amber-300/70 scale-[1.01]'
                  : isCompleted
                  ? 'bg-emerald-50/90 border-emerald-300/80 shadow-xs'
                  : stepNum === 10
                  ? 'bg-gradient-to-r from-amber-50/90 via-yellow-50/90 to-amber-50/90 border-amber-300/80'
                  : 'bg-white/80 border-slate-200/70 opacity-70'
              }`}
            >
              {/* Left: Step Number & Multiplier */}
              <div className="flex items-center gap-2.5 min-w-[95px]">
                <div
                  className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black animate-pulse shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : stepNum === 10
                      ? 'bg-gradient-to-tr from-amber-400 to-rose-500 text-white shadow-xs'
                      : 'bg-slate-100 text-[#506e8c]'
                  }`}
                >
                  {stepNum === 10 ? '👑' : stepNum}
                </div>

                <div>
                  <span
                    className={`text-xs font-black tracking-tight ${
                      stepNum === 10
                        ? 'text-amber-700 text-sm drop-shadow-xs font-black'
                        : isActive
                        ? 'text-amber-800'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-[#192f52]'
                    }`}
                  >
                    {stepObj.label}
                  </span>
                </div>
              </div>

              {/* Right: 3 Interactive Apple Baskets on this Step */}
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((basketIdx) => {
                  const wasChosen = pickData && pickData.chosenIdx === basketIdx;
                  const isRotten = pickData && pickData.rottenIdx === basketIdx;

                  if (pickData) {
                    // Already picked row
                    return (
                      <div
                        key={basketIdx}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border text-sm transition-all ${
                          wasChosen && pickData.isSafe
                            ? 'bg-emerald-100 border-emerald-400 shadow-xs'
                            : wasChosen && !pickData.isSafe
                            ? 'bg-rose-100 border-rose-400 animate-shake'
                            : isRotten
                            ? 'bg-slate-100 border-slate-200 opacity-50'
                            : 'bg-white border-slate-200 opacity-40'
                        }`}
                      >
                        {isRotten ? (
                          <span className="text-base" title="Rotten Apple / Worm">🐛</span>
                        ) : (
                          <img src={appleImg} alt="Golden Apple" className="w-5 h-5 object-contain filter drop-shadow-xs" />
                        )}
                      </div>
                    );
                  }

                  if (isActive) {
                    // ACTIVE STEP - TAPPABLE APPLES!
                    return (
                      <button
                        key={basketIdx}
                        onClick={() => handlePickApple(basketIdx)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-b from-amber-300 via-orange-400 to-amber-500 border-2 border-yellow-200 shadow-[0_3px_8px_rgba(234,88,12,0.4)] flex items-center justify-center active:scale-90 hover:brightness-105 transition-transform cursor-pointer animate-bounce"
                        style={{ animationDelay: `${basketIdx * 0.15}s` }}
                        title="Tap to Harvest!"
                      >
                        <img src={appleImg} alt="Harvest" className="w-6 h-6 object-contain filter drop-shadow-xs" />
                      </button>
                    );
                  }

                  // Locked / Future row
                  return (
                    <div
                      key={basketIdx}
                      className="w-10 h-10 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-center opacity-50"
                    >
                      <span className="text-xs opacity-50">🍃</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ----------------- GAME OVER STATE NOTICES (Light Theme) ----------------- */}
      {gameState === 'BUSTED' && (
        <div className="my-1.5 bg-rose-50 border-2 border-rose-300 p-2.5 px-3 rounded-2xl shadow-sm flex items-center justify-between animate-shake flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐛</span>
            <div>
              <h4 className="text-xs font-black text-rose-900 leading-tight">Busted! Rotten Apple Hit</h4>
              <p className="text-[10px] font-bold text-rose-700">
                Lost {formatApples(selectedBet)} Apples. Try again!
              </p>
            </div>
          </div>
          <button
            onClick={handleStartGame}
            className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {gameState === 'CASHED_OUT' && (
        <div className="my-1.5 bg-emerald-50 border-2 border-emerald-300 p-2.5 px-3 rounded-2xl shadow-sm flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <h4 className="text-xs font-black text-emerald-900 leading-tight">Harvest Successful!</h4>
              <p className="text-[10px] font-bold text-emerald-700">
                Won +{formatApples(currentWinAmount)} Apples ({currentMultiplier}x)!
              </p>
            </div>
          </div>
          <button
            onClick={handleStartGame}
            className="bg-[#2ecc71] hover:bg-[#20a058] text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Climb Again</span>
          </button>
        </div>
      )}

      {gameState === 'JACKPOT' && (
        <div className="my-1.5 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border-2 border-amber-400 p-3 rounded-2xl shadow-md flex items-center justify-between animate-bounce flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👑</span>
            <div>
              <h4 className="text-xs font-black text-amber-950 leading-tight">100X GRAND JACKPOT!</h4>
              <p className="text-[10px] font-bold text-amber-800">
                Won +{formatApples(Math.floor(selectedBet * 100))} Apples!
              </p>
            </div>
          </div>
          <button
            onClick={handleStartGame}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs active:scale-95 cursor-pointer"
          >
            Play Again
          </button>
        </div>
      )}

      {/* ----------------- BOTTOM CONTROLS DOCK (Light Theme) ----------------- */}
      <div className="mt-2 bg-white/95 backdrop-blur-md rounded-3xl p-3 px-4 border border-sky-100 shadow-[0_4px_16px_rgba(0,140,255,0.06)] flex-shrink-0">
        {gameState === 'PLAYING' ? (
          /* Playing Controls */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#6782a2]">
              <span>Step <b className="text-amber-600 font-black">{currentStep}</b> of 10</span>
              <span>Current Profit: <b className="text-emerald-600 font-black">+{formatApples(currentWinAmount)} 🍎</b> ({currentMultiplier}x)</span>
            </div>

            {/* CASH OUT BUTTON */}
            <button
              onClick={handleCashOut}
              disabled={currentStep === 0}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                currentStep > 0
                  ? 'bg-gradient-to-b from-[#2ecc71] via-[#27ae60] to-[#1e8a4a] text-white hover:brightness-105 shadow-[0_4px_0_#145a32] border-t border-emerald-300'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <span>💰 CASH OUT</span>
              <span className="text-amber-200 font-extrabold">
                {currentStep > 0 ? `+${formatApples(currentWinAmount)} Apples` : '(Pick Step 1 first)'}
              </span>
            </button>
          </div>
        ) : (
          /* Bet Selector Controls */
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-[#6782a2]">
                <span>Select Entry:</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {BET_OPTIONS.map((amt) => {
                  const isSelected = selectedBet === amt;
                  return (
                    <button
                      key={amt}
                      onClick={() => {
                        soundManager.playClickSound();
                        setSelectedBet(amt);
                      }}
                      className={`py-2 rounded-xl font-black text-xs border transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#2ecc71] to-[#20a058] text-white border-emerald-400 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-[#192f52] border-slate-200'
                      }`}
                    >
                      <img src={appleImg} alt="Apple" className="w-3.5 h-3.5 object-contain" />
                      <span>{formatApples(amt)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Climb Button */}
            <button
              onClick={handleStartGame}
              disabled={userApples < selectedBet}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer ${
                userApples >= selectedBet
                  ? 'bg-gradient-to-b from-[#f59e0b] via-[#ea580c] to-[#c2410c] text-white hover:brightness-105 shadow-[0_4px_0_#9a3412] border-t border-amber-200'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <span>START CLIMB</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
