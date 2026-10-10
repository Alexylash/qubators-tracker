// Generates placeholder PWA icons (solid brand purple) - no dependencies.
// TODO(design): replace with real mark. They satisfy installability checks.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const table = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  table[n] = c;
}
function crc(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const cs = Buffer.alloc(4);
  cs.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, cs]);
}
// Solid #5B00FF with white rounded-square "Q" plate in the middle (crisp blocks, no gradients)
function png(size) {
  const [R, G, B] = [0x5b, 0x00, 0xff];
  const rows = [];
  const m = Math.floor(size / 4); // plate bounds
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const inPlate = x >= m && x < size - m && y >= m && y < size - m;
      // Chunky "Q": white plate with purple inner block + tail pixel cluster
      const inner = x >= m + m / 3 && x < size - m - m / 3 && y >= m + m / 3 && y < size - m - m / 3;
      const tail = x >= size - m - m / 4 && y >= size - m - m / 2;
      const white = inPlate && (!inner || tail);
      const o = 1 + x * 4;
      row[o] = white ? 255 : R;
      row[o + 1] = white ? 255 : G;
      row[o + 2] = white ? 255 : B;
      row[o + 3] = 255;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const out = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0))
  ]);
  return out;
}
const dir = path.join(__dirname, '..', 'public');
for (const s of [192, 512]) {
  const f = path.join(dir, `icon-${s}.png`);
  fs.writeFileSync(f, png(s));
  console.log('WROTE ' + f + ' ' + fs.statSync(f).size + 'b');
}
