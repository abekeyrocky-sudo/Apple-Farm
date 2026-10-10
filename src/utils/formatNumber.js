/**
 * Smart formatting for Apples / Currency in Apple Farm
 * Under 1,000,000: Shows standard comma-separated format (e.g. 936,007, 754,461, 999,999)
 * 1,000,000 and above: Formats compactly with 'M' (e.g. 1M, 1.05M, 2.73M)
 * 1,000,000,000 and above: Formats with 'B' (e.g. 1B, 2.5B)
 */
export const formatApples = (num) => {
  const n = Number(num) || 0;
  if (n >= 1000000000) {
    const val = (n / 1000000000).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
    return `${val}B`;
  }
  if (n >= 1000000) {
    const val = (n / 1000000).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
    return `${val}M`;
  }
  return n.toLocaleString();
};

export default formatApples;
