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
import { syncUserWithFirebase, harvestAppleInDB } from './firebase';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  const [user, setUser] = useState({
    id: 40281,
    name: 'Rocky',
    apples: 1250,
    diamonds: 549.0,
    level: 3,
  });

  useEffect(() => {
    // টেলিগ্রাম ইনিশিয়ালাইজেশন
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        syncUserWithFirebase(tgUser).then((data) => {
          if (data) setUser(data);
        });
      }
    }
  }, []);

  const handleHarvestAction = () => {
    setUser((prev) => ({ ...prev, apples: prev.apples + 1 }));
    harvestAppleInDB(user.id);
  };

  const handleBonusWin = (amount) => {
    setUser((prev) => ({ ...prev, apples: prev.apples + amount }));
  };

  const handleRewardClaim = (task) => {
    if (task.rewardAmount) {
      handleBonusWin(task.rewardAmount);
    }
  };

  const handleGameReward = (item) => {
    const value = parseFloat(item.label) || 0;
    if (item.type === 'diamond') {
      setUser((prev) => ({ ...prev, diamonds: prev.diamonds + value }));
    } else {
      setUser((prev) => ({ ...prev, apples: prev.apples + value }));
    }
  };

  const handleWithdrawDeduct = (data) => {
    if (data.amount) {
      setUser((prev) => ({
        ...prev,
        apples: Math.max(0, prev.apples - data.amount)
      }));
    }
  };

  const handleNavigate = (tab) => {
    setCurrentTab(tab);
  };

  // 1. Initial Cartoon Splash / Loading Screen
  if (isLoading) {
    return <SplashScreen onLoaded={() => setIsLoading(false)} />;
  }

  // 2. Home / Main Page
  if (currentTab === 'home') {
    return (
      <HomePage 
        onNavigate={handleNavigate}
        onWithdraw={() => setCurrentTab('withdraw')}
        onOpenProfile={() => setCurrentTab('profile')}
      />
    );
  }

  // 3. Mine / Click to Collect Orchard Screen
  if (currentTab === 'mine') {
    return (
      <MinePage 
        user={user}
        onHarvest={handleHarvestAction}
        onWithdraw={() => setCurrentTab('withdraw')}
        onNavigate={handleNavigate}
        onOpenProfile={() => setCurrentTab('profile')}
      />
    );
  }

  // 4. Tasks & Rewards Page
  if (currentTab === 'task') {
    return (
      <TaskPage 
        onBack={() => setCurrentTab('home')}
        onNavigate={handleNavigate}
        onRewardClaim={handleRewardClaim}
      />
    );
  }

  // 5. Game / Spin & Win Wheel Page
  if (currentTab === 'game') {
    return (
      <GamePage 
        onNavigate={handleNavigate}
        onWinReward={handleGameReward}
      />
    );
  }

  // 6. Wallet Page
  if (currentTab === 'wallet') {
    return (
      <WalletPage 
        user={user}
        onBack={() => setCurrentTab('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  // 7. Profile & Settings Page
  if (currentTab === 'profile') {
    return (
      <ProfilePage 
        user={user}
        onBack={() => setCurrentTab('home')}
        onNavigate={handleNavigate}
        onLogout={() => setCurrentTab('home')}
        onRedeemBonus={(amount) => handleBonusWin(amount)}
      />
    );
  }

  // 8. Watch Ads Page
  if (currentTab === 'ads') {
    return (
      <WatchAdsPage 
        onBack={() => setCurrentTab('home')}
        onRewardEarned={(amount) => handleBonusWin(amount)}
      />
    );
  }

  // 9. Invite Friends Page
  if (currentTab === 'invite') {
    return (
      <InviteFriendsPage 
        user={user}
        onBack={() => setCurrentTab('home')}
      />
    );
  }

  // 10. Withdraw Page
  if (currentTab === 'withdraw') {
    return (
      <WithdrawPage 
        user={user}
        onBack={() => setCurrentTab('home')}
        onWithdrawSubmit={handleWithdrawDeduct}
      />
    );
  }

  return null;
}

