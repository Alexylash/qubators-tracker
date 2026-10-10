// Beta demo seed: creates demo@qubators.local + realistic week of trade.
// Isolated per-seller account — never touches real sellers. Run: node scripts/seed-demo.cjs
const BASE = process.env.QUBATORS_URL || 'http://localhost:3000';
let jar = [];
function cookies(res) {
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of set) jar.push(c.split(';')[0]);
}
async function req(method, p, body) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: BASE, ...(jar.length ? { Cookie: jar.join('; ') } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual'
  });
  cookies(res);
  const t = await res.text();
  let j = null;
  try { j = JSON.parse(t); } catch {}
  return { status: res.status, json: j };
}
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const now = Date.now();

(async () => {
  const su = await req('POST', '/api/auth/sign-up/email', { name: 'Demo Seller', email: 'demo@qubators.local', password: 'password123' });
  if (su.status !== 200) {
    const li = await req('POST', '/api/auth/sign-in/email', { email: 'demo@qubators.local', password: 'password123' });
    console.log('DEMO-LOGIN:', li.status);
  } else console.log('DEMO-SIGNUP: 200');

  const seed = [
    { customerName: 'Ada', phone: '08031234567', productName: '2 handbags', totalAmount: '45000', qty: 2, deliveryInfo: 'Ikeja', followUpDate: iso(now + DAY), followUpReason: 'Balance payment', patch: { amountPaid: '20000', orderStatus: 'processing' } },
    { customerName: 'Sarah', phone: '08039876543', productName: 'Classic Black T-Shirt', totalAmount: '15000', variation: 'M', patch: { amountPaid: '15000', paymentStatus: 'paid', orderStatus: 'delivered' } },
    { customerName: 'Musa', phone: '08055551111', productName: 'Perfume - Oud', totalAmount: '25000' },
    { customerName: 'Ada', phone: '08031234567', productName: 'Ankara fabric 6 yards', totalAmount: '30000', patch: { amountPaid: '30000', paymentStatus: 'paid', orderStatus: 'confirmed' } },
    { customerName: 'Chiamaka', productName: 'Skincare set', totalAmount: '18500', followUpDate: iso(now - DAY), followUpReason: 'Payment pending' },
    { customerName: 'Tunde', phone: '08077778888', productName: 'Sneakers', totalAmount: '40000', variation: '43', deliveryInfo: 'Lekki', patch: { orderStatus: 'confirmed' } }
  ];
  for (const s of seed) {
    const { patch, ...input } = s;
    const c = await req('POST', '/api/orders', input);
    if (c.status !== 201) { console.log('SEED-FAIL:', c.status, JSON.stringify(c.json)); process.exit(1); }
    if (patch) {
      const p = await req('PATCH', '/api/orders/' + c.json.order.id, patch);
      if (p.status !== 200) { console.log('PATCH-FAIL:', p.status); process.exit(1); }
    }
    console.log('SEED-OK:', input.customerName, '-', input.productName);
  }
  console.log('SEED-DONE login as demo@qubators.local / password123');
  process.exit(0);
})();
