export function nairaToKobo(input: string | number): number {
  if (typeof input === 'number') return Math.round(input * 100);
  const cleaned = String(input).replace(/[₦,\s]/g, '');
  if (cleaned === '') throw new Error('Invalid amount');
  const naira = Number(cleaned);
  if (!Number.isFinite(naira) || naira < 0) throw new Error('Invalid amount');
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number | null | undefined): string {
  const v = (kobo ?? 0) / 100;
  return '₦' + v.toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

export function koboBalance(total: number, paid: number): number {
  return total - paid;
}
