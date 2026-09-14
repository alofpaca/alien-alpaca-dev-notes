export function totalCost({periods, cycle, first, renewal, setup}) {
  for (const [key,value] of Object.entries({periods,cycle,first,renewal,setup})) {
    const min = key === 'periods' || key === 'cycle' ? 1 : 0;
    if (!Number.isSafeInteger(value) || value < min || value > 1000000000) throw new Error('正の整数の期間と、0円以上の整数金額を入力してください。');
  }
  const blocks = Math.ceil(periods / cycle);
  const total = setup + first + (blocks - 1) * renewal;
  if (!Number.isSafeInteger(total)) throw new Error('金額が計算可能範囲を超えています。');
  return {blocks, renewals: blocks - 1, total, unused: blocks * cycle - periods};
}

export function decisionDate(expiry, advance) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || !Number.isInteger(advance) || advance < 0 || advance > 366) throw new Error('有効な満了日と0〜366日の先行日数を入力してください。');
  const date = new Date(expiry + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== expiry) throw new Error('実在する日付を入力してください。');
  date.setUTCDate(date.getUTCDate() - advance);
  return date.toISOString().slice(0,10);
}
