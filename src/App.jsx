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
import { syncUserWithFirebase, harvestAppleInDB, updateUserInDB } from './firebase';
import { calculateLevel } from './utils/levelSystem';

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

  useEffect(() => {
    // টেলিগ্রাম ইনিশিয়ালাইজেশন ও অটো ইউজার প্রোফাইল ট্র্যাকিং
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
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

  const handleBonusWin = (amount) => {
    setUser((prev) => {
      const newApples = prev.apples + amount;
      const newLevel = calculateLevel(newApples);
      return { 
        ...prev, 
        apples: newApples,
        level: newLevel
      };
    });
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

  const handleUpdateUserBalance = (delta) => {
    setUser((prev) => ({
      ...prev,
      apples: Math.max(0, prev.apples + (delta.apples || 0)),
      diamonds: Math.max(0, prev.diamonds + (delta.diamonds || 0))
    }));
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
        user={user}
        onHarvest={handleHarvestAction}
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

  // 6. Airdrop Hub Page
  if (currentTab === 'airdrop') {
    return (
      <AirdropPage 
        user={user}
        onBack={() => setCurrentTab('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  // 7. Wallet Page
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
        onUpdateAvatar={handleUpdateAvatar}
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

  // 11. Leaderboard / Global Ranking Page
  if (currentTab === 'leaderboard') {
    return (
      <LeaderboardPage 
        user={user}
        onBack={() => setCurrentTab('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  // 12. Staking Center Page
  if (currentTab === 'staking') {
    return (
      <StakingPage 
        user={user}
        onBack={() => setCurrentTab('wallet')}
        onNavigate={handleNavigate}
        onUpdateUserBalance={handleUpdateUserBalance}
      />
    );
  }

  // 13. Apple Market Page
  if (currentTab === 'market') {
    return (
      <MarketPage 
        user={user}
        onBack={() => setCurrentTab('home')}
        onNavigate={handleNavigate}
        onUpdateUserBalance={handleUpdateUserBalance}
      />
    );
  }

  return null;
}

