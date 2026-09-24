import React, { useState, useEffect } from 'react';
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import MinePage from './pages/MinePage';
import TaskPage from './pages/TaskPage';
import WatchAdsPage from './pages/WatchAdsPage';
import InviteFriendsPage from './pages/InviteFriendsPage';
import WalletPage from './pages/WalletPage';
import ProfilePage from './pages/ProfilePage';
import GamePage from './pages/GamePage';
import WithdrawPage from './pages/WithdrawPage';
import AirdropPage from './pages/AirdropPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StakingPage from './pages/StakingPage';
import MarketPage from './pages/MarketPage';
import CustomPopupModal from './components/CustomPopupModal';
import { syncUserWithFirebase, harvestAppleInDB, updateUserInDB } from './firebase';
import { calculateLevel } from './utils/levelSystem';
import { soundManager } from './utils/soundManager';
import { addTransaction } from './utils/transactionHistory';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  const [user, setUser] = useState({
    id: null,
    name: 'Farmer',
    avatar: 'avatar-1',
    apples: 0,
    diamonds: 0.0,
    level: 1,
    energy: 100,
    maxEnergy: 100,
  });

  // গ্লোবাল কাস্টম পপআপ মডাল স্টেট
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'warn' | 'reward' | 'error' | 'info'
    title: '',
    message: '',
    rewardAmount: null,
    rewardType: 'apple',
    confirmText: 'Awesome',
    cancelText: null,
    onConfirm: null,
  });

  const showPopupModal = (opts) => {
    setModalConfig({
      isOpen: true,
      type: opts.type || 'success',
      title: opts.title || '',
      message: opts.message || '',
      rewardAmount: opts.rewardAmount !== undefined ? opts.rewardAmount : null,
      rewardType: opts.rewardType || 'apple',
      confirmText: opts.confirmText || 'Awesome',
      cancelText: opts.cancelText || null,
      onConfirm: opts.onConfirm || null,
    });
  };

  const closePopupModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    // 🎵 Sound & Background Music Listener
    soundManager.initUserGestureListeners();

    // টেলিগ্রাম ইনিশিয়ালাইজেশন ও ফুলস্ক্রিন এক্সপান্ড
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Request Fullscreen for Telegram WebApp Bot API 7.7+ & 8.0+
      try {
        if (typeof tg.requestFullscreen === 'function') {
          tg.requestFullscreen();
        }
      } catch (err) {
        console.warn('Telegram requestFullscreen not supported or blocked:', err);
      }

      // Disable vertical swipes to prevent accidental closing on touch drag
      try {
        if (typeof tg.disableVerticalSwipes === 'function') {
          tg.disableVerticalSwipes();
        }
      } catch (err) {
        console.warn('disableVerticalSwipes error:', err);
      }

      // Enable closing confirmation to prevent accidental exit
      try {
        if (typeof tg.enableClosingConfirmation === 'function') {
          tg.enableClosingConfirmation();
        }
      } catch (err) {
        console.warn('enableClosingConfirmation error:', err);
      }

      // Set header color & background color to blend smoothly
      try {
        if (typeof tg.setHeaderColor === 'function') {
          tg.setHeaderColor('#5ec228');
        }
        if (typeof tg.setBackgroundColor === 'function') {
          tg.setBackgroundColor('#5ec228');
        }
      } catch (err) {
        console.warn('Theme color setup error:', err);
      }
      
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Farmer';
        
        setUser((prev) => ({
          ...prev,
          id: tgUser.id,
          name: fullName,
          username: tgUser.username || '',
        }));

        syncUserWithFirebase(tgUser).then((data) => {
          if (data) {
            const calculatedLvl = calculateLevel(data.apples || 0);
            setUser((prev) => ({
              ...prev,
              ...data,
              level: calculatedLvl,
              name: fullName,
              avatar: data.avatar || prev.avatar || 'avatar-1',
            }));
          }
        });
      }
    }
  }, []);

  const handleUpdateAvatar = (newAvatarId) => {
    setUser((prev) => ({ ...prev, avatar: newAvatarId }));
    if (user.id) {
      updateUserInDB(user.id, { avatar: newAvatarId });
    }
    showPopupModal({
      type: 'success',
      title: 'Avatar Updated!',
      message: 'Your farmer character has been changed successfully.',
      confirmText: 'Great'
    });
  };

  const handleHarvestAction = () => {
    setUser((prev) => {
      const newApples = prev.apples + 1;
      const newLevel = calculateLevel(newApples);
      return { 
        ...prev, 
        apples: newApples,
        level: newLevel
      };
    });
    if (user.id) {
      harvestAppleInDB(user.id);
    }
  };

  const handleBonusWin = (amount, title = 'Bonus Claimed!') => {
    setUser((prev) => {
      const newApples = prev.apples + amount;
      const newLevel = calculateLevel(newApples);
      return { 
        ...prev, 
        apples: newApples,
        level: newLevel
      };
    });
    addTransaction({
      userId: user.id,
      title: title,
      subtitle: 'Apple Farm Reward',
      amount: `+${amount}`,
      currency: 'apple',
      type: 'earn',
      category: 'task',
      status: 'Completed'
    });
    showPopupModal({
      type: 'reward',
      title: title,
      message: `Congratulations! You received +${amount} Apples into your balance.`,
      rewardAmount: amount,
      rewardType: 'apple'
    });
  };

  const handleRewardClaim = (task) => {
    if (task.rewardAmount) {
      handleBonusWin(task.rewardAmount, task.title || 'Task Completed!');
    }
  };

  const handleGameReward = (item) => {
    const value = parseFloat(item.label) || 0;
    if (item.type === 'diamond') {
      setUser((prev) => ({ ...prev, diamonds: prev.diamonds + value }));
      addTransaction({
        userId: user.id,
        title: 'Lucky Wheel Spin',
        subtitle: 'Wheel Jackpot Prize',
        amount: `+${value}`,
        currency: 'diamond',
        type: 'earn',
        category: 'spin',
        status: 'Completed'
      });
      showPopupModal({
        type: 'reward',
        title: 'Lucky Spin Winner!',
        message: `Jackpot! You won ${value} Diamonds on the wheel!`,
        rewardAmount: value,
        rewardType: 'diamond'
      });
    } else {
      setUser((prev) => {
        const newApples = prev.apples + value;
        return { ...prev, apples: newApples, level: calculateLevel(newApples) };
      });
      addTransaction({
        userId: user.id,
        title: 'Lucky Wheel Spin',
        subtitle: 'Wheel Prize',
        amount: `+${value}`,
        currency: 'apple',
        type: 'earn',
        category: 'spin',
        status: 'Completed'
      });
      showPopupModal({
        type: 'reward',
        title: 'Lucky Spin Winner!',
        message: `Jackpot! You won ${value} Apples on the wheel!`,
        rewardAmount: value,
        rewardType: 'apple'
      });
    }
  };

  const handleWithdrawDeduct = (data) => {
    if (data.amount) {
      setUser((prev) => ({
        ...prev,
        apples: Math.max(0, prev.apples - data.amount)
      }));
      addTransaction({
        userId: user.id,
        title: 'Withdrawal Request',
        subtitle: data.address ? `To: ${data.address.slice(0, 6)}...` : 'TON Payout',
        amount: `-${data.amount}`,
        currency: 'apple',
        type: 'spend',
        category: 'withdraw',
        status: 'Processing'
      });
      showPopupModal({
        type: 'success',
        title: 'Withdrawal Submitted!',
        message: `Your withdrawal request of ${data.amount} Apples has been placed successfully.`,
        confirmText: 'Done'
      });
    }
  };

  const handleUpdateUserBalance = (delta) => {
    setUser((prev) => {
      const newApples = Math.max(0, prev.apples + (delta.apples || 0));
      return {
        ...prev,
        apples: newApples,
        diamonds: Math.max(0, prev.diamonds + (delta.diamonds || 0)),
        level: calculateLevel(newApples)
      };
    });
  };

  const handleNavigate = (tab) => {
    setCurrentTab(tab);
  };

  // 1. Initial Cartoon Splash / Loading Screen
  if (isLoading) {
    return <SplashScreen onLoaded={() => setIsLoading(false)} />;
  }

  // Active Screen Rendering
  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomePage 
            user={user}
            onHarvest={handleHarvestAction}
            onNavigate={handleNavigate}
            onWithdraw={() => setCurrentTab('withdraw')}
            onOpenProfile={() => setCurrentTab('profile')}
            onShowPopup={showPopupModal}
          />
        );
      case 'mine':
        return (
          <MinePage 
            user={user}
            onHarvest={handleHarvestAction}
            onWithdraw={() => setCurrentTab('withdraw')}
            onNavigate={handleNavigate}
            onOpenProfile={() => setCurrentTab('profile')}
            onShowPopup={showPopupModal}
          />
        );
      case 'task':
        return (
          <TaskPage 
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onRewardClaim={handleRewardClaim}
            onShowPopup={showPopupModal}
          />
        );
      case 'game':
        return (
          <GamePage 
            onNavigate={handleNavigate}
            onWinReward={handleGameReward}
            onShowPopup={showPopupModal}
          />
        );
      case 'airdrop':
        return (
          <AirdropPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onShowPopup={showPopupModal}
          />
        );
      case 'wallet':
        return (
          <WalletPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onShowPopup={showPopupModal}
          />
        );
      case 'profile':
        return (
          <ProfilePage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onLogout={() => setCurrentTab('home')}
            onRedeemBonus={(amount) => handleBonusWin(amount, 'Code Redeemed!')}
            onUpdateAvatar={handleUpdateAvatar}
            onShowPopup={showPopupModal}
          />
        );
      case 'ads':
        return (
          <WatchAdsPage 
            onBack={() => setCurrentTab('home')}
            onRewardEarned={(amount) => handleBonusWin(amount, 'Ad Reward Claimed!')}
            onShowPopup={showPopupModal}
          />
        );
      case 'invite':
        return (
          <InviteFriendsPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onShowPopup={showPopupModal}
          />
        );
      case 'withdraw':
        return (
          <WithdrawPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onWithdrawSubmit={handleWithdrawDeduct}
            onShowPopup={showPopupModal}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onShowPopup={showPopupModal}
          />
        );
      case 'staking':
        return (
          <StakingPage 
            user={user}
            onBack={() => setCurrentTab('wallet')}
            onNavigate={handleNavigate}
            onUpdateUserBalance={handleUpdateUserBalance}
            onShowPopup={showPopupModal}
          />
        );
      case 'market':
        return (
          <MarketPage 
            user={user}
            onBack={() => setCurrentTab('home')}
            onNavigate={handleNavigate}
            onUpdateUserBalance={handleUpdateUserBalance}
            onShowPopup={showPopupModal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderCurrentPage()}
      
      {/* গ্লোবাল কাস্টম ভেক্টর পপআপ মডাল */}
      <CustomPopupModal 
        {...modalConfig} 
        onClose={closePopupModal} 
      />
    </>
  );
}

