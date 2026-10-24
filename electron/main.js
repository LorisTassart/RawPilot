const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const {
  initDb,
  getDb,
  resetAll,
  replaceAll,
  MONTHS_FR,
  RAW_CATALOG,
  DEFAULT_CHECKLIST_STEPS,
} = require('./db');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let exiftoolInstance = null;

async function getExiftool() {
  if (!exiftoolInstance) {
    const { exiftool } = require('exiftool-vendored');
    exiftoolInstance = exiftool;
  }
  return exiftoolInstance;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0e1013',
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  await initDb();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  if (exiftoolInstance) {
    try { await exiftoolInstance.end(); } catch (e) { /* ignore */ }
  }
  if (process.platform !== 'darwin') app.quit();
});

// ---------- Helpers ----------

function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .toLowerCase()
    .replace(/^\./, '')
    .trim();
}

// Cherche un sous-dossier existant qui "ressemble" à l'un des noms cibles
// (insensible aux accents, à la casse, et au point préfixé "." ou non).
function resolveSubfolder(basePath, targets) {
  if (!fs.existsSync(basePath)) return null;
  let entries;
  try {
    entries = fs.readdirSync(basePath, { withFileTypes: true });
  } catch (e) {
    return null;
  }
  const normalizedTargets = targets.map(normalizeName);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (normalizedTargets.includes(normalizeName(entry.name))) {
      return path.join(basePath, entry.name);
    }
  }
  return null;
}

function countFiles(dirPath, extensions) {
  if (!fs.existsSync(dirPath)) return 0;
  return fs.readdirSync(dirPath).filter((f) => extensions.includes(path.extname(f).toLowerCase())).length;
}

function countInSubfolder(sessionPath, targets, extensions) {
  const resolved = resolveSubfolder(sessionPath, targets);
  return resolved ? countFiles(resolved, extensions) : 0;
}

// Noms de dossier acceptés pour repérer le dossier RAW, quelle que soit la marque,
// et quel que soit le nom historique utilisé ("NEF" du tout premier prototype inclus).
const RAW_NAMES = ['RAW', ...RAW_CATALOG.map((f) => f.id)];
// Extensions comptées comme "RAW" peu importe le réglage actuel de l'utilisateur,
// pour que les compteurs restent corrects même si la config change plus tard.
const RAW_COUNT_EXTENSIONS = RAW_CATALOG.map((f) => `.${f.id}`);
const JPEG_NAMES = ['.JPEG', 'JPEG', 'JPG'];
const RETOUCHE_NAMES = ['.JPEG Retouché', 'JPEG Retouché', 'JPEG Retouche', 'Retouché', 'Retouche'];
const MONTAGE_NAMES = ['Montage Réseaux', 'Montage Reseaux'];
const GENERIC_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.heic'];

function sessionFolderName(sessionNumber, dateStr) {
  // dateStr = "YYYY-MM-DD" -> "Session 49 - 01-08-2026"
  const [y, m, d] = dateStr.split('-');
  return `Session ${sessionNumber} - ${d}-${m}-${y}`;
}

function computeStatus(session) {
  const db = getDb();
  const steps = (db.data.config.checklistSteps || []).map((s) => s.id);
  const checklist = session.checklist || {};
  const allChecked = steps.length > 0 && steps.every((id) => checklist[id]);
  const anyChecked =
    steps.some((id) => checklist[id]) || session.nefCount > 0 || session.retouchedCount > 0;
  if (allChecked) return 'done';
  if (anyChecked) return 'progress';
  return 'todo';
}

function withStatus(session) {
  return { ...session, status: computeStatus(session) };
}

function isDevMode() {
  return isDev || !app.isPackaged;
}

// ---------- IPC: config ----------

ipcMain.handle('config:get', async () => {
  const db = getDb();
  return { ...db.data.config, isDev: isDevMode() };
});

ipcMain.handle('config:rawCatalog', async () => {
  return RAW_CATALOG;
});

ipcMain.handle('config:selectRootFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choisis le dossier racine de tes archives photo',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const db = getDb();
  db.data.config.rootPath = result.filePaths[0];
  await db.write();
  return db.data.config;
});

ipcMain.handle('config:resetToWelcome', async () => {
  const db = getDb();
  db.data.config.rootPath = null;
  await db.write();
  return db.data.config;
});

ipcMain.handle('config:updateRawSettings', async (_evt, { rawEnabled, rawFormats, autoConvert }) => {
  const db = getDb();
  db.data.config.rawEnabled = !!rawEnabled;
  db.data.config.rawFormats = Array.isArray(rawFormats) ? rawFormats : [];
  db.data.config.autoConvert = !!autoConvert;
  await db.write();
  return db.data.config;
});

ipcMain.handle('config:updateChecklistSteps', async (_evt, { steps }) => {
  const db = getDb();
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('Il faut au moins une étape dans la liste de suivi.');
  }
  db.data.config.checklistSteps = steps.map((s) => ({ id: s.id, label: s.label }));
  await db.write();
  return db.data.config;
});

// ---------- IPC: mode développeur (masqué en version publiée) ----------

ipcMain.handle('app:isDev', async () => isDevMode());

ipcMain.handle('app:exportProfile', async () => {
  if (!isDevMode()) throw new Error('Fonction réservée au mode développeur.');
  const db = getDb();
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Exporter ta configuration RawPilot',
    defaultPath: 'rawpilot-profil.json',
    filters: [{ name: 'Profil RawPilot', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, JSON.stringify(db.data, null, 2), 'utf-8');
  return result.filePath;
});

ipcMain.handle('app:importProfile', async () => {
  if (!isDevMode()) throw new Error('Fonction réservée au mode développeur.');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Importer un profil RawPilot',
    properties: ['openFile'],
    filters: [{ name: 'Profil RawPilot', extensions: ['json'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error('Ce fichier ne semble pas être un profil RawPilot valide.');
  }
  const db = replaceAll(parsed);
  return db.data.config;
});

ipcMain.handle('app:resetAll', async () => {
  if (!isDevMode()) throw new Error('Fonction réservée au mode développeur.');
  const db = resetAll();
  return db.data.config;
});

// ---------- Scan des sessions déjà existantes sur le disque ----------

// Plusieurs formats acceptés, du plus proche au plus permissif :
// "Session 49 - 01-08-2026", "Session49_01.08.2026", "49 - 01-08-2026"
const SESSION_FOLDER_PATTERNS = [
  /^Session\s*(\d+)\s*-\s*(\d{2})[-_.](\d{2})[-_.](\d{4})$/i,
  /^(\d+)\s*-\s*(\d{2})[-_.](\d{2})[-_.](\d{4})$/,
];

function matchSessionFolder(name) {
  for (const re of SESSION_FOLDER_PATTERNS) {
    const m = name.match(re);
    if (m) {
      const [, sessionNumberStr, d, mo, y] = m;
      return { sessionNumber: parseInt(sessionNumberStr, 10), date: `${y}-${mo}-${d}` };
    }
  }
  return null;
}

function looksLikeSessionFolder(fullPath) {
  // Un dossier qui contient un sous-dossier ressemblant à des photos RAW ou JPEG
  // est probablement une session, même si son nom ne suit pas le format attendu.
  return resolveSubfolder(fullPath, RAW_NAMES) !== null || resolveSubfolder(fullPath, JPEG_NAMES) !== null;
}

function findSessionFolders(dirPath, depth, sessionFolders, candidateFolders) {
  if (depth > 5) return;
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dirPath, entry.name);
    const match = matchSessionFolder(entry.name);
    if (match) {
      sessionFolders.push({ folderPath: fullPath, folderName: entry.name, ...match });
    } else if (looksLikeSessionFolder(fullPath)) {
      candidateFolders.push({ folderPath: fullPath, folderName: entry.name });
    } else {
      findSessionFolders(fullPath, depth + 1, sessionFolders, candidateFolders);
    }
  }
}

async function scanExistingSessions() {
  const db = getDb();
  const rootPath = db.data.config.rootPath;
  if (!rootPath || !fs.existsSync(rootPath)) return { added: 0, unmatched: [] };

  const sessionFolders = [];
  const candidateFolders = [];
  findSessionFolders(rootPath, 0, sessionFolders, candidateFolders);

  const existingPaths = new Set(db.data.sessions.map((s) => s.folderPath));
  let added = 0;

  for (const f of sessionFolders) {
    if (existingPaths.has(f.folderPath)) continue;
    addSessionFromFolder(db, f.folderPath, f.folderName, f.sessionNumber, f.date);
    existingPaths.add(f.folderPath);
    added += 1;
  }

  if (added > 0) await db.write();

  const unmatched = candidateFolders.filter((f) => !existingPaths.has(f.folderPath));
  return { added, unmatched };
}

function addSessionFromFolder(db, folderPath, folderName, sessionNumber, date) {
  const [yearStr, monthStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = MONTHS_FR[monthIndex] || monthStr;
  const hasMontage = resolveSubfolder(folderPath, MONTAGE_NAMES) !== null;

  const session = {
    id: uuidv4(),
    year,
    month: monthIndex + 1,
    monthName,
    sessionNumber,
    date,
    folderName,
    folderPath,
    hasMontage,
    nefCount: countInSubfolder(folderPath, RAW_NAMES, RAW_COUNT_EXTENSIONS),
    jpegCount: countInSubfolder(folderPath, JPEG_NAMES, ['.jpg', '.jpeg']),
    retouchedCount: countInSubfolder(folderPath, RETOUCHE_NAMES, ['.jpg', '.jpeg']),
    // Ce suivi ne peut pas être déduit du disque : on laisse tout décoché.
    checklist: {},
    createdAt: new Date().toISOString(),
  };
  db.data.sessions.push(session);
  return session;
}

ipcMain.handle('sessions:scanExisting', async () => {
  return scanExistingSessions();
});

ipcMain.handle('sessions:importManual', async (_evt, { folderPath, folderName, date, sessionNumber }) => {
  const db = getDb();
  if (db.data.sessions.some((s) => s.folderPath === folderPath)) {
    throw new Error('Ce dossier est déjà importé.');
  }
  const session = addSessionFromFolder(db, folderPath, folderName, sessionNumber, date);
  await db.write();
  return withStatus(session);
});

// ---------- IPC: sessions ----------

ipcMain.handle('sessions:list', async () => {
  const db = getDb();
  return db.data.sessions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(withStatus);
});

ipcMain.handle('sessions:nextNumber', async () => {
  const db = getDb();
  const max = db.data.sessions.reduce((m, s) => Math.max(m, s.sessionNumber || 0), 0);
  return max + 1;
});

ipcMain.handle('sessions:create', async (_evt, { date, sessionNumber, hasMontage }) => {
  const db = getDb();
  const rootPath = db.data.config.rootPath;
  if (!rootPath) throw new Error('Aucun dossier racine configuré.');

  const [yearStr, monthStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = MONTHS_FR[monthIndex];

  const yearPath = path.join(rootPath, String(year));
  const monthPath = path.join(yearPath, monthName);
  const folderName = sessionFolderName(sessionNumber, date);
  const sessionPath = path.join(monthPath, folderName);

  for (const p of [yearPath, monthPath, sessionPath]) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }

  const subfolders = [];
  if (db.data.config.rawEnabled) subfolders.push('.RAW');
  subfolders.push('.JPEG', '.JPEG Retouché');
  if (hasMontage) subfolders.push('Montage Réseaux');
  for (const sub of subfolders) {
    const subPath = path.join(sessionPath, sub);
    if (!fs.existsSync(subPath)) fs.mkdirSync(subPath, { recursive: true });
  }

  const session = {
    id: uuidv4(),
    year,
    month: monthIndex + 1,
    monthName,
    sessionNumber,
    date,
    folderName,
    folderPath: sessionPath,
    hasMontage: !!hasMontage,
    nefCount: 0,
    jpegCount: 0,
    retouchedCount: 0,
    checklist: {},
    createdAt: new Date().toISOString(),
  };

  db.data.sessions.push(session);
  await db.write();
  return withStatus(session);
});

ipcMain.handle('sessions:updateChecklist', async (_evt, { id, stepId, value }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');
  const validIds = (db.data.config.checklistSteps || []).map((s) => s.id);
  if (!validIds.includes(stepId)) throw new Error('Étape inconnue');
  session.checklist = session.checklist || {};
  session.checklist[stepId] = value;
  await db.write();
  return withStatus(session);
});

ipcMain.handle('sessions:remove', async (_evt, { id }) => {
  const db = getDb();
  const before = db.data.sessions.length;
  db.data.sessions = db.data.sessions.filter((s) => s.id !== id);
  if (db.data.sessions.length === before) throw new Error('Session introuvable');
  await db.write();
  // Important : on ne touche jamais aux fichiers sur le disque ici.
  return true;
});

ipcMain.handle('sessions:checkMissing', async () => {
  const db = getDb();
  const missing = db.data.sessions.filter((s) => !fs.existsSync(s.folderPath));
  return missing.map(withStatus);
});

ipcMain.handle('sessions:relocate', async (_evt, { id }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: `Retrouve le nouveau chemin de : ${session.folderName}`,
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const newPath = result.filePaths[0];
  session.folderPath = newPath;
  session.folderName = path.basename(newPath);
  session.hasMontage = resolveSubfolder(newPath, MONTAGE_NAMES) !== null;
  session.nefCount = countInSubfolder(newPath, RAW_NAMES, RAW_COUNT_EXTENSIONS);
  session.jpegCount = countInSubfolder(newPath, JPEG_NAMES, ['.jpg', '.jpeg']);
  session.retouchedCount = countInSubfolder(newPath, RETOUCHE_NAMES, ['.jpg', '.jpeg']);
  await db.write();
  return withStatus(session);
});

ipcMain.handle('sessions:updateInfo', async (_evt, { id, date, sessionNumber, hasMontage }) => {
  const db = getDb();
  const rootPath = db.data.config.rootPath;
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');
  if (!rootPath) throw new Error('Aucun dossier racine configuré.');

  const [yearStr, monthStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = MONTHS_FR[monthIndex] || monthStr;

  const newFolderName = sessionFolderName(sessionNumber, date);
  const newParentPath = path.join(rootPath, String(year), monthName);
  const newFolderPath = path.join(newParentPath, newFolderName);

  if (newFolderPath !== session.folderPath) {
    if (fs.existsSync(newFolderPath)) {
      throw new Error('Un dossier avec cette date et ce numéro existe déjà à cet emplacement.');
    }
    if (fs.existsSync(session.folderPath)) {
      if (!fs.existsSync(newParentPath)) fs.mkdirSync(newParentPath, { recursive: true });
      fs.renameSync(session.folderPath, newFolderPath);
    }
    session.folderPath = newFolderPath;
    session.folderName = newFolderName;
  }

  session.date = date;
  session.sessionNumber = sessionNumber;
  session.year = year;
  session.month = monthIndex + 1;
  session.monthName = monthName;

  if (hasMontage && resolveSubfolder(session.folderPath, MONTAGE_NAMES) === null) {
    fs.mkdirSync(path.join(session.folderPath, 'Montage Réseaux'), { recursive: true });
  }
  session.hasMontage = !!hasMontage;

  session.nefCount = countInSubfolder(session.folderPath, RAW_NAMES, RAW_COUNT_EXTENSIONS);
  session.jpegCount = countInSubfolder(session.folderPath, JPEG_NAMES, ['.jpg', '.jpeg']);
  session.retouchedCount = countInSubfolder(session.folderPath, RETOUCHE_NAMES, ['.jpg', '.jpeg']);

  await db.write();
  return withStatus(session);
});

ipcMain.handle('sessions:openFolder', async (_evt, { id, sub }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');
  let target = session.folderPath;
  if (sub) {
    const variantsByLabel = {
      '.JPEG Retouché': RETOUCHE_NAMES,
      'Montage Réseaux': MONTAGE_NAMES,
      '.RAW': RAW_NAMES,
    };
    const variants = variantsByLabel[sub] || [sub];
    target = resolveSubfolder(session.folderPath, variants) || path.join(session.folderPath, sub);
  }
  const result = await shell.openPath(target);
  if (result) throw new Error(result);
  return true;
});

ipcMain.handle('sessions:refreshCounts', async (_evt, { id }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');
  session.nefCount = countInSubfolder(session.folderPath, RAW_NAMES, RAW_COUNT_EXTENSIONS);
  session.jpegCount = countInSubfolder(session.folderPath, JPEG_NAMES, ['.jpg', '.jpeg']);
  session.retouchedCount = countInSubfolder(session.folderPath, RETOUCHE_NAMES, ['.jpg', '.jpeg']);
  await db.write();
  return withStatus(session);
});

// ---------- IPC: import des photos (RAW et/ou JPEG selon la config) ----------

ipcMain.handle('sessions:importPhotos', async (_evt, { id }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');

  const config = db.data.config;
  const rawEnabled = !!config.rawEnabled;
  const autoConvert = config.autoConvert !== false;
  const activeFormats = Array.isArray(config.rawFormats) && config.rawFormats.length > 0
    ? config.rawFormats
    : RAW_CATALOG.map((f) => f.id);

  const filters = rawEnabled
    ? [{ name: 'Fichiers RAW', extensions: activeFormats }]
    : [{ name: 'Photos', extensions: ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'heic'] }];

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters,
    title: rawEnabled ? 'Sélectionne les fichiers RAW à importer' : 'Sélectionne les photos à importer',
  });
  if (result.canceled || result.filePaths.length === 0) return { imported: 0, converted: 0, errors: [] };

  const jpegDir = resolveSubfolder(session.folderPath, JPEG_NAMES) || path.join(session.folderPath, '.JPEG');
  if (!fs.existsSync(jpegDir)) fs.mkdirSync(jpegDir, { recursive: true });

  let imported = 0;
  let converted = 0;
  const errors = [];

  if (!rawEnabled) {
    // Pas de RAW : on copie directement les photos dans le dossier JPEG.
    for (const srcPath of result.filePaths) {
      const destPath = path.join(jpegDir, path.basename(srcPath));
      try {
        fs.copyFileSync(srcPath, destPath);
        imported += 1;
        converted += 1;
      } catch (e) {
        errors.push(`${path.basename(srcPath)}: échec de la copie (${e.message})`);
      }
      mainWindow.webContents.send('sessions:importProgress', { id, done: imported, total: result.filePaths.length });
    }
  } else {
    const rawDir = resolveSubfolder(session.folderPath, RAW_NAMES) || path.join(session.folderPath, '.RAW');
    if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

    const et = autoConvert ? await getExiftool() : null;

    for (const srcPath of result.filePaths) {
      const baseName = path.basename(srcPath, path.extname(srcPath));
      const destRaw = path.join(rawDir, path.basename(srcPath));
      try {
        fs.copyFileSync(srcPath, destRaw);
        imported += 1;
      } catch (e) {
        errors.push(`${baseName}: échec copie RAW (${e.message})`);
        continue;
      }

      if (autoConvert) {
        const destJpeg = path.join(jpegDir, `${baseName}.jpg`);
        try {
          await et.extractJpgFromRaw(destRaw, destJpeg);
          converted += 1;
        } catch (e1) {
          try {
            await et.extractPreview(destRaw, destJpeg);
            converted += 1;
          } catch (e2) {
            errors.push(`${baseName}: aucun JPEG intégré trouvé`);
          }
        }
      }

      mainWindow.webContents.send('sessions:importProgress', { id, done: imported, total: result.filePaths.length });
    }
  }

  session.nefCount = countInSubfolder(session.folderPath, RAW_NAMES, RAW_COUNT_EXTENSIONS);
  session.jpegCount = countInSubfolder(session.folderPath, JPEG_NAMES, ['.jpg', '.jpeg']);
  await db.write();

  return { imported, converted, errors, session: withStatus(session) };
});

// ---------- IPC: search ----------

ipcMain.handle('sessions:search', async (_evt, { query }) => {
  const db = getDb();
  const q = (query || '').trim().toLowerCase();
  if (!q) return db.data.sessions.map(withStatus);
  return db.data.sessions
    .filter((s) => {
      return (
        String(s.sessionNumber).includes(q) ||
        String(s.year).includes(q) ||
        s.monthName.toLowerCase().includes(q) ||
        s.date.includes(q) ||
        s.folderName.toLowerCase().includes(q)
      );
    })
    .map(withStatus);
});
