export const copyArray = (arr) => {
  return arr.map((row) => [...row]);
};

export const getDayOfTheYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return day;
};

export const getDayKey = () => {
  const d = new Date();
  const year = d.getFullYear()
  return `day-${getDayOfTheYear()}-${year}`
}