// চক্রবৃদ্ধি হারে লেভেল গণনা সিস্টেম
// Lv 1: 0 - 99 Apples
// Lv 2: 100 - 199 Apples
// Lv 3: 200 - 399 Apples
// Lv 4: 400 - 799 Apples
// Lv 5: 800 - 1,599 Apples
// Lv 6: 1,600 - 3,199 Apples
// Lv 7: 3,200 - 6,399 Apples
// Lv 8: 6,400 - 12,799 Apples
// Lv 9: 12,800 - 25,599 Apples
// Lv 10: 25,600+ Apples

export const calculateLevel = (apples = 0) => {
  const count = Number(apples) || 0;
  if (count < 100) return 1;
  const lvl = Math.floor(Math.log2(count / 100)) + 2;
  return Math.max(1, lvl);
};

export const getLevelProgress = (apples = 0) => {
  const count = Number(apples) || 0;
  const currentLevel = calculateLevel(count);

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
];
