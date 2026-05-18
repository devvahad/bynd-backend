const CHARS = {
  num: '0123456789',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  alphaNum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
};

const RandomCodeUtility = (digits = 6, type = 'num') => {
  const charset = CHARS[type] ?? CHARS.num;
  let result = Array.from(
    { length: digits },
    () => charset[Math.floor(Math.random() * charset.length)],
  ).join('');

  if (type === 'num') {
    let num = parseInt(result, 10);
    const missing = digits - num.toString().length;
    if (missing) num *= 10 ** missing;
    return num;
  }

  return result;
};

export default RandomCodeUtility;