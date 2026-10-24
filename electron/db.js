const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DEFAULT_DATA = { config: { rootPath: null }, sessions: [] };

let filePath;
let cache;

async function initDb() {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
  filePath = path.join(userDataPath, 'rawpilot-db.json');

  if (fs.existsSync(filePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  } else {
    cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  cache.config = cache.config || { rootPath: null };
  cache.sessions = cache.sessions || [];
  writeSync();
  return getDb();
}

function writeSync() {
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), 'utf-8');
}

function getDb() {
  if (!cache) throw new Error('DB non initialisée');
  return {
    data: cache,
    write: async () => writeSync(),
  };
}

module.exports = { initDb, getDb, MONTHS_FR };
