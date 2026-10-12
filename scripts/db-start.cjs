// One-command Postgres restart for the local qubators cluster (port 5433).
// Run: pnpm db:start
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const bin = 'C:\\Program Files\\PostgreSQL\\16\\bin';
const data = path.join(os.homedir(), 'pgdata');
const log = path.join(os.homedir(), 'pgdata.log');

function sh(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return (e.stdout || '') + (e.stderr || e.message);
  }
}

const ready = sh(path.join(bin, 'pg_isready.exe'), ['-h', 'localhost', '-p', '5433']);
if (ready.includes('accepting connections')) {
  console.log('DB already up: ' + ready);
  process.exit(0);
}
// Clear stale lock from a dead postmaster, then start detached.
try {
  fs.rmSync(path.join(data, 'postmaster.pid'), { force: true });
} catch {}
console.log(sh(path.join(bin, 'pg_ctl.exe'), ['-D', data, '-l', log, '-o', '-p 5433', 'start']));
console.log(sh(path.join(bin, 'pg_isready.exe'), ['-h', 'localhost', '-p', '5433']));
