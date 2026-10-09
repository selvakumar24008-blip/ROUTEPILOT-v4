try { require('dotenv').config(); } catch { /* dotenv is installed by npm install */ }
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = process.env.DATA_FILE || path.join(DATA_DIR, 'routepilot.json');
const PASSWORDS = {
  owner: 'owner123',
  operator: 'operator123',
  driver: 'driver123',
  customer: 'customer123'
};

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
      console.error('Run npm start once to create the data file, stop the server, then run this command again.');
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  const doc = JSON.parse(raw);
  const state = doc.state || doc;
  const acc = state.acc || state.accounts;
  if (!acc || !acc.owner || !Array.isArray(acc.ops) || !Array.isArray(state.veh)) {
    console.error('Could not find expected Owner, Operator, and vehicle records. No changes were made.');
    process.exitCode = 1;
    return;
  }
  if (!Array.isArray(acc.cu)) {
    console.error('Could not find customer records. No changes were made.');
    process.exitCode = 1;
    return;
  }

  const backupPath = `${DATA_FILE}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await fs.copyFile(DATA_FILE, backupPath);

  acc.owner.pwh = await hashPassword(PASSWORDS.owner);
  for (const operator of acc.ops) operator.pwh = await hashPassword(PASSWORDS.operator);
  for (const driver of state.veh) driver.pwh = await hashPassword(PASSWORDS.driver);
  for (const customer of acc.cu) customer.pwh = await hashPassword(PASSWORDS.customer);

  const output = JSON.stringify(doc.state ? doc : state, null, 2);
  const tempPath = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempPath, output, 'utf8');
  await fs.rename(tempPath, DATA_FILE);

  console.log('All existing RoutePilot account passwords were reset successfully.');
  console.log(`Owner: owner / ${PASSWORDS.owner}`);
  console.log(`Operators: existing operator IDs / ${PASSWORDS.operator}`);
  console.log(`Drivers: existing truck IDs (T-01 etc.) / ${PASSWORDS.driver}`);
  console.log(`Customers: existing customer IDs (C-01 etc.) / ${PASSWORDS.customer}`);
  console.log(`Backup saved to: ${backupPath}`);
  console.log('Restart the server to clear temporary server-side login lockouts.');
})().catch(err => {
  console.error('Could not reset all credentials:', err.message);
  process.exitCode = 1;
});
