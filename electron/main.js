const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { initDb, getDb, MONTHS_FR } = require('./db');

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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function sessionFolderName(sessionNumber, dateStr) {
  // dateStr = "YYYY-MM-DD" -> "Session 49 - 01-08-2026"
  const [y, m, d] = dateStr.split('-');
  return `Session ${sessionNumber} - ${d}-${m}-${y}`;
}

function computeStatus(session) {
  if (session.statusDone) return 'done';
  if (session.retouchedCount > 0 || session.statusRetouched) return 'progress';
  if (session.nefCount > 0) return 'progress';
  return 'todo';
}

// ---------- IPC: config ----------

ipcMain.handle('config:get', async () => {
  const db = getDb();
  return db.data.config;
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

// ---------- IPC: sessions ----------

ipcMain.handle('sessions:list', async () => {
  const db = getDb();
  return db.data.sessions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((s) => ({ ...s, status: computeStatus(s) }));
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

  const subfolders = ['.NEF', '.JPEG', '.JPEG Retouché'];
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
    statusPhone: false,
    statusRetouched: false,
    statusDone: false,
    createdAt: new Date().toISOString(),
  };

  db.data.sessions.push(session);
  await db.write();
  return { ...session, status: computeStatus(session) };
});

ipcMain.handle('sessions:updateFlag', async (_evt, { id, field, value }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');
  const allowed = ['statusPhone', 'statusRetouched', 'statusDone'];
  if (!allowed.includes(field)) throw new Error('Champ non autorisé');
  session[field] = value;
  await db.write();
  return { ...session, status: computeStatus(session) };
});

ipcMain.handle('sessions:openFolder', async (_evt, { id, sub }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');
  const target = sub ? path.join(session.folderPath, sub) : session.folderPath;
  const result = await shell.openPath(target);
  if (result) throw new Error(result);
  return true;
});

ipcMain.handle('sessions:refreshCounts', async (_evt, { id }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');
  session.nefCount = countFiles(path.join(session.folderPath, '.NEF'), ['.nef']);
  session.jpegCount = countFiles(path.join(session.folderPath, '.JPEG'), ['.jpg', '.jpeg']);
  session.retouchedCount = countFiles(path.join(session.folderPath, '.JPEG Retouché'), ['.jpg', '.jpeg']);
  await db.write();
  return { ...session, status: computeStatus(session) };
});

function countFiles(dirPath, extensions) {
  if (!fs.existsSync(dirPath)) return 0;
  return fs.readdirSync(dirPath).filter((f) => extensions.includes(path.extname(f).toLowerCase())).length;
}

// ---------- IPC: import NEF ----------

ipcMain.handle('sessions:importNef', async (_evt, { id }) => {
  const db = getDb();
  const session = db.data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Session introuvable');

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Fichiers NEF', extensions: ['nef', 'NEF'] }],
    title: 'Sélectionne les fichiers NEF à importer',
  });
  if (result.canceled || result.filePaths.length === 0) return { imported: 0, converted: 0 };

  const nefDir = path.join(session.folderPath, '.NEF');
  const jpegDir = path.join(session.folderPath, '.JPEG');
  if (!fs.existsSync(nefDir)) fs.mkdirSync(nefDir, { recursive: true });
  if (!fs.existsSync(jpegDir)) fs.mkdirSync(jpegDir, { recursive: true });

  const et = await getExiftool();
  let imported = 0;
  let converted = 0;
  const errors = [];

  for (const srcPath of result.filePaths) {
    const baseName = path.basename(srcPath, path.extname(srcPath));
    const destNef = path.join(nefDir, path.basename(srcPath));
    try {
      fs.copyFileSync(srcPath, destNef);
      imported += 1;
    } catch (e) {
      errors.push(`${baseName}: échec copie NEF (${e.message})`);
      continue;
    }

    const destJpeg = path.join(jpegDir, `${baseName}.jpg`);
    try {
      await et.extractJpgFromRaw(destNef, destJpeg);
      converted += 1;
    } catch (e1) {
      try {
        await et.extractPreview(destNef, destJpeg);
        converted += 1;
      } catch (e2) {
        errors.push(`${baseName}: aucun JPEG intégré trouvé`);
      }
    }

    mainWindow.webContents.send('sessions:importProgress', {
      id,
      done: imported,
      total: result.filePaths.length,
    });
  }

  session.nefCount = countFiles(nefDir, ['.nef']);
  session.jpegCount = countFiles(jpegDir, ['.jpg', '.jpeg']);
  await db.write();

  return { imported, converted, errors, session: { ...session, status: computeStatus(session) } };
});

// ---------- IPC: search ----------

ipcMain.handle('sessions:search', async (_evt, { query }) => {
  const db = getDb();
  const q = (query || '').trim().toLowerCase();
  if (!q) return db.data.sessions.map((s) => ({ ...s, status: computeStatus(s) }));
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
    .map((s) => ({ ...s, status: computeStatus(s) }));
});
