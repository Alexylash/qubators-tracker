// Local backup: pg_dump -> backups/qubators-YYYYMMDD-HHmm.sql + copy public/uploads.
// Run: pnpm backup. Copy the backups/ folder to an external drive weekly.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const outDir = path.join(root, 'backups');
fs.mkdirSync(outDir, { recursive: true });

const pgDump =
  process.env.PG_DUMP ||
  'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';
const dbUrl =
  process.env.DATABASE_URL || 'postgres://alexl@localhost:5433/qubators';

const sqlFile = path.join(outDir, `qubators-${stamp}.sql`);
console.log('Dumping DB to ' + sqlFile);
execFileSync(pgDump, ['--dbname=' + dbUrl, '--file=' + sqlFile], { stdio: 'inherit' });

const uploads = path.join(root, 'public', 'uploads');
if (fs.existsSync(uploads)) {
  const dest = path.join(outDir, `uploads-${stamp}`);
  fs.cpSync(uploads, dest, { recursive: true });
  console.log('Uploads copied to ' + dest);
} else {
  console.log('No uploads dir, skipping file backup.');
}
console.log('BACKUP-DONE ' + sqlFile);
