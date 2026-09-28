/**
 * $APPLE Airdrop & Jetton Engine
 * Handles real TON On-chain Jetton contract references, STON.fi DEX links,
 * Roadmap phases, live allocation calculation, and claim state management.
 */

export const AIRDROP_CONFIG = {
  tokenName: 'Apple Farm',
  tokenSymbol: '$APPLE',
  contractAddress: 'EQDz-8DoxesPcoqzU9FJmOEdYf4ri9rDwaVTtDVEB_rZ4GHC',
  decimals: 9,
  totalSupply: 100000000, // 100 Million $APPLE
  communityAirdropPool: 70000000, // 70% Community Pool (70 Million)
  liquidityPool: 15000000, // 15% STON.fi DEX & CEX Liquidity
  stakingRewardsPool: 10000000, // 10% Staking & Farm Rewards
  ecosystemPool: 5000000, // 5% Ecosystem & Dev
  
  // DEX & Explorer URLs
  stonfiSwapUrl: 'https://app.ston.fi/swap?ft=GRAM&tt=EQDz-8DoxesPcoqzU9FJmOEdYf4ri9rDwaVTtDVEB_rZ4GHC',
  stonfiPoolUrl: 'https://app.ston.fi/pools/EQB2OPxkWaWgwwao0urob2n8T08DLXZhdLRsFkKusg4fuXYg',
  tonviewerUrl: 'https://tonviewer.com/EQDz-8DoxesPcoqzU9FJmOEdYf4ri9rDwaVTtDVEB_rZ4GHC',
  tonscanUrl: 'https://tonscan.org/token/EQDz-8DoxesPcoqzU9FJmOEdYf4ri9rDwaVTtDVEB_rZ4GHC#events',
  
  // Master Verification Address for 0.19 TON Anti-Bot Wallet Verification
  masterWalletAddress: 'UQC576HcthVEI8QtkfQ80iHPDz1iz8VfEWsZPi3c3ihnrN5c',
  walletVerifyFeeNano: '190000000', // 0.19 TON in nanotons
};

export const AIRDROP_ROADMAP = [
  {
    phase: 1,
    id: 'phase_farming',
    title: 'Mining & Eligibility',
    date: 'Live Now',
    subtitle: 'Harvest apples, complete verification tasks & build farming tier.',
    status: 'active',
    badge: 'LIVE NOW',
    badgeColor: 'bg-emerald-500 text-white',
    icon: 'Apple',
  },
  {
    phase: 2,
    id: 'phase_snapshot',
    title: 'Official Snapshot',
    date: '14 Oct',
    subtitle: 'Database freeze, anti-sybil filtering & final points audit.',
    status: 'upcoming',
    badge: '14 OCT',
    badgeColor: 'bg-blue-500 text-white',
    icon: 'Camera',
  },
  {
    phase: 3,
    id: 'phase_tge',
    title: 'Token Allocation',
    date: '16 Oct',
    subtitle: 'Final $APPLE allocation calculated for all verified farmers.',
    status: 'upcoming',
    badge: '16 OCT',
    badgeColor: 'bg-indigo-500 text-white',
    icon: 'Sparkles',
  },
  {
    phase: 4,
    id: 'phase_claim',
    title: 'Non-Custodial Claim',
    date: '18 Oct',
    subtitle: '1-Click direct claiming of $APPLE tokens to your TON Wallet.',
    status: 'upcoming',
    badge: '18 OCT',
    badgeColor: 'bg-purple-500 text-white',
    icon: 'Wallet',
  },
  {
    phase: 5,
    id: 'phase_trading',
    title: 'DEX Live & CEX Listing',
    date: '20 Oct (CEX)',
    subtitle: 'Currently live on STON.fi DEX. Major Tier-1 CEX listing on 20 Oct.',
    status: 'active',
    badge: 'DEX LIVE • CEX 20 OCT',
    badgeColor: 'bg-amber-500 text-white',
    icon: 'TrendingUp',
  },
];

/**
 * Calculates user's estimated $APPLE allocation based on current farming progress
 */
export const calculateEstimatedAirdrop = (user) => {
  if (!user) return { totalEstimated: 0, breakdown: {} };

  const apples = Number(user.apples || 0);
  const diamonds = Number(user.diamonds || 0);
  const level = Number(user.level || 1);
  const referrals = Array.isArray(user.invitedFriends) 
    ? user.invitedFriends.length 
    : (user.referrals?.length || user.referralCount || 0);
  const isWalletVerified = !!user.airdropTasks?.walletVerified;

  // Conversion rates based on total 70M Airdrop Pool
  const applePoints = Math.floor(apples * 0.02); // 1,000 Apples = 20 $APPLE
  const diamondPoints = Math.floor(diamonds * 3.5); // 1 Diamond = 3.5 $APPLE
  const levelPoints = Math.floor(level * 25); // Level bonus
  const referralPoints = Math.floor(referrals * 100); // 100 $APPLE per referral
  const walletBonus = isWalletVerified ? 500 : 0; // 500 $APPLE early verified bonus

  const totalEstimated = Math.max(0, applePoints + diamondPoints + levelPoints + referralPoints + walletBonus);

  return {
    totalEstimated,
    breakdown: {
      fromApples: applePoints,
      fromDiamonds: diamondPoints,
      fromLevel: levelPoints,
      fromReferrals: referralPoints,
      fromWalletBonus: walletBonus,
      isWalletVerified,
    }
  };
};

/**
 * Formats large token numbers with commas (e.g. 100,000,000)
 */
export const formatTokenNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-US');
};
