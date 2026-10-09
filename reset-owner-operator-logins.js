try { require('dotenv').config(); } catch { /* optional until npm install is run */ }
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = process.env.DATA_FILE || path.join(DATA_DIR, 'routepilot.json');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, key) => {
      if (err) return reject(err);
      resolve(`pbkdf2$100000$${salt.toString('hex')}$${key.toString('hex')}`);
    });
  });
}

(async () => {
  let raw;
  try {
    raw = await fs.readFile(DATA_FILE, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`No saved RoutePilot data found at: ${DATA_FILE}`);
      console.error('Run npm start once to create the data file, then stop the server and run this script again.');
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  const doc = JSON.parse(raw);
  const state = doc.state || doc;
  const acc = state.acc || state.accounts;
  if (!acc || !acc.owner || !Array.isArray(acc.ops)) {
    console.error('Could not find the Owner and Operator accounts in the saved data. No changes were made.');
    process.exitCode = 1;
    return;
  }

  const backupPath = `${DATA_FILE}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await fs.copyFile(DATA_FILE, backupPath);

  acc.owner.pwh = await hashPassword('owner123');
  for (const operator of acc.ops) operator.pwh = await hashPassword('operator123');

  const output = doc.state ? JSON.stringify(doc, null, 2) : JSON.stringify(state, null, 2);
  const tempPath = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempPath, output, 'utf8');
  await fs.rename(tempPath, DATA_FILE);

  console.log('Owner and Operator passwords reset successfully.');
  console.log('Owner: owner / owner123');
  console.log('Operators: OP-01 and OP-02 / operator123');
  console.log(`Backup saved to: ${backupPath}`);
  console.log('Now restart the RoutePilot server to clear temporary login lockouts.');
})().catch(err => {
  console.error('Could not reset login credentials:', err.message);
  process.exitCode = 1;
});
