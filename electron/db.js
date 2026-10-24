const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Catalogue des formats RAW propriétaires les plus courants.
const RAW_CATALOG = [
  { id: 'nef', label: 'Nikon (.NEF)' },
  { id: 'cr2', label: 'Canon (.CR2)' },
  { id: 'cr3', label: 'Canon (.CR3)' },
  { id: 'arw', label: 'Sony (.ARW)' },
  { id: 'raf', label: 'Fujifilm (.RAF)' },
  { id: 'rw2', label: 'Panasonic (.RW2)' },
  { id: 'orf', label: 'Olympus / OM System (.ORF)' },
  { id: 'pef', label: 'Pentax (.PEF)' },
  { id: 'srw', label: 'Samsung (.SRW)' },
  { id: 'dng', label: 'DNG (universel / Adobe)' },
];

const DEFAULT_CHECKLIST_STEPS = [
  { id: 'google_drive', label: 'Importé Google Drive' },
  { id: 'phone', label: 'Importé sur téléphone' },
  { id: 'retouched', label: 'Retouché' },
  { id: 'done', label: 'Terminé' },
];

function defaultConfig() {
  return {
    rootPath: null,
    rawEnabled: false,
    rawFormats: [],
    autoConvert: true,
    diskAlertGb: 20,
    theme: 'dark',
    checklistSteps: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_STEPS)),
  };
}

const DEFAULT_DATA = { config: defaultConfig(), sessions: [] };

let filePath;
let cache;

function migrate(data) {
  data.config = data.config || defaultConfig();
  if (data.config.rawEnabled === undefined) data.config.rawEnabled = false;
  if (!Array.isArray(data.config.rawFormats)) data.config.rawFormats = [];
  if (data.config.autoConvert === undefined) data.config.autoConvert = true;
  if (typeof data.config.diskAlertGb !== 'number') data.config.diskAlertGb = 20;
  if (!['dark', 'light', 'system'].includes(data.config.theme)) data.config.theme = 'dark';
  if (!Array.isArray(data.config.checklistSteps) || data.config.checklistSteps.length === 0) {
    data.config.checklistSteps = JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_STEPS));
  }
  data.sessions = data.sessions || [];

  for (const s of data.sessions) {
    if (!s.checklist) {
      // Migration depuis l'ancien format à 4 cases fixes.
      s.checklist = {
        google_drive: !!s.statusGoogleDrive,
        phone: !!s.statusPhone,
        retouched: !!s.statusRetouched,
        done: !!s.statusDone,
      };
    }
    if (s.category === undefined) s.category = null;
    if (s.clientName === undefined) s.clientName = '';
    if (s.location === undefined) s.location = '';
    if (s.notes === undefined) s.notes = '';
    if (s.completedAt === undefined) s.completedAt = null;
  }
  return data;
}

// En mode "portable" (build electron-builder target "portable"), Electron/Windows
// définit automatiquement cette variable d'environnement au chemin du dossier où se
// trouve le .exe — utile pour que les données de RawPilot voyagent avec lui sur une
// clé USB, plutôt que de rester coincées dans AppData sur le PC où on l'a lancé.
function getDataDir() {
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  if (portableDir) {
    return path.join(portableDir, 'RawPilotData');
  }
  return app.getPath('userData');
}

async function initDb() {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  filePath = path.join(dataDir, 'rawpilot-db.json');

  if (fs.existsSync(filePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  } else {
    cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  cache = migrate(cache);
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

function resetAll() {
  cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
  writeSync();
  return getDb();
}

function replaceAll(newData) {
  const migrated = migrate(JSON.parse(JSON.stringify(newData)));
  cache = migrated;
  writeSync();
  return getDb();
}

module.exports = { initDb, getDb, resetAll, replaceAll, MONTHS_FR, RAW_CATALOG, DEFAULT_CHECKLIST_STEPS };
