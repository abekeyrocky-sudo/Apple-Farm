// Functions local copy of levelSystem.js
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
