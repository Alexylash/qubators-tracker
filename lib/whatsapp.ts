// Nigerian WhatsApp normalization: wa.me needs full international digits, no '+'.
// 0803... -> 234803..., +234... -> 234..., 234... unchanged, other -> digits only.
export function toWaNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = '234' + d.slice(1);
  return d;
}

export function waLink(phone: string | null | undefined, text: string): string | null {
  const n = toWaNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
