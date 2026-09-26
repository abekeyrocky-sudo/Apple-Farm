// চক্রবৃদ্ধি হারে লেভেল গণনা সিস্টেম (Level 1 to Level 20)
// Lv 1: 0 - 99 Apples
// Lv 2: 100 - 199 Apples
// Lv 3: 200 - 399 Apples
// Lv 4: 400 - 799 Apples
// Lv 5: 800 - 1,599 Apples
// Lv 6: 1,600 - 3,199 Apples
// Lv 7: 3,200 - 6,399 Apples
// Lv 8: 6,400 - 12,799 Apples
// Lv 9: 12,800 - 25,599 Apples
// Lv 10: 25,600 - 51,199 Apples
// Lv 11: 51,200 - 102,399 Apples
// Lv 12: 102,400 - 204,799 Apples
// Lv 13: 204,800 - 409,599 Apples
// Lv 14: 409,600 - 819,199 Apples
// Lv 15: 819,200 - 1,638,399 Apples
// Lv 16: 1,638,400 - 3,276,799 Apples
// Lv 17: 3,276,800 - 6,553,599 Apples
// Lv 18: 6,553,600 - 13,107,199 Apples
// Lv 19: 13,107,200 - 26,214,399 Apples
// Lv 20: 26,214,400+ Apples

export const calculateLevel = (apples = 0) => {
  const count = Number(apples) || 0;
  if (count < 100) return 1;
  const lvl = Math.floor(Math.log2(count / 100)) + 2;
  return Math.min(20, Math.max(1, lvl));
};

export const getLevelProgress = (apples = 0) => {
  const count = Number(apples) || 0;
  const currentLevel = calculateLevel(count);

  if (currentLevel >= 20) {
    const min = 100 * Math.pow(2, 18); // 26,214,400
    return {
      level: 20,
      nextLevel: 20,
      minApples: min,
      maxApples: min,
      currentApples: count,
      percent: 100,
      applesNeeded: 0,
      title: LEVEL_TIERS[19].name,
    };
  }

  if (currentLevel === 1) {
    const min = 0;
    const max = 100;
    const percent = Math.min(Math.round((count / max) * 100), 100);
    return {
      level: 1,
      nextLevel: 2,
      minApples: min,
      maxApples: max,
      currentApples: count,
      percent,
      applesNeeded: Math.max(0, max - count),
      title: LEVEL_TIERS[0].name,
    };
  }

  const min = 100 * Math.pow(2, currentLevel - 2);
  const max = 100 * Math.pow(2, currentLevel - 1);
  const percent = Math.min(
    Math.max(0, Math.round(((count - min) / (max - min)) * 100)),
    100
  );

  return {
    level: currentLevel,
    nextLevel: currentLevel + 1,
    minApples: min,
    maxApples: max,
    currentApples: count,
    percent,
    applesNeeded: Math.max(0, max - count),
    title: LEVEL_TIERS[currentLevel - 1]?.name || 'Farmer',
  };
};

export const LEVEL_TIERS = [
  { level: 1, name: 'Novice Farmer', required: 0 },
  { level: 2, name: 'Apprentice', required: 100 },
  { level: 3, name: 'Harvester', required: 200 },
  { level: 4, name: 'Orchard Keeper', required: 400 },
  { level: 5, name: 'Farm Master', required: 800 },
  { level: 6, name: 'Harvest Baron', required: 1600 },
  { level: 7, name: 'Grand Farmer', required: 3200 },
  { level: 8, name: 'Apple Tycoon', required: 6400 },
  { level: 9, name: 'Farm Emperor', required: 12800 },
  { level: 10, name: 'Legendary Master', required: 25600 },
  { level: 11, name: 'Mythic Planter', required: 51200 },
  { level: 12, name: 'Celestial Harvester', required: 102400 },
  { level: 13, name: 'Supreme Cultivator', required: 204800 },
  { level: 14, name: 'Orchard Overlord', required: 409600 },
  { level: 15, name: 'Golden Apple Sage', required: 819200 },
  { level: 16, name: 'Farm Monarch', required: 1638400 },
  { level: 17, name: 'Cosmic Grower', required: 3276800 },
  { level: 18, name: 'Harvest Sovereign', required: 6553600 },
  { level: 19, name: 'Divine Agro Titan', required: 13107200 },
  { level: 20, name: 'Apple Immortal God', required: 26214400 },
];
