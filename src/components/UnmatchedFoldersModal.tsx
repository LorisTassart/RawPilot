import { useState } from 'react';
import { UnmatchedFolder } from '../types';

interface Props {
  folders: UnmatchedFolder[];
  onClose: () => void;
  onImported: (folderPath: string) => void;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function UnmatchedFoldersModal({ folders, onClose, onImported }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="p-6 pb-3">
          <h2 className="text-lg font-semibold mb-1">Dossiers non reconnus</h2>
          <p className="text-xs text-ink-dim">
            Ces dossiers contiennent des photos mais leur nom ne suit pas le format attendu. Donne-leur une date et un
            numéro pour les rattacher au suivi — rien n'est renommé sur ton disque.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-2">
          {folders.map((f) => (
            <FolderRow key={f.folderPath} folder={f} onImported={onImported} />
          ))}
        </div>
        <div className="p-4 flex justify-end border-t border-base-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-ink-dim hover:text-ink">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function FolderRow({ folder, onImported }: { folder: UnmatchedFolder; onImported: (folderPath: string) => void }) {
  const [date, setDate] = useState(todayStr());
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleImport() {
    setBusy(true);
    setError(null);
    try {
      await window.rawpilot.sessions.importManual({
        folderPath: folder.folderPath,
        folderName: folder.folderName,
        date,
        sessionNumber,
      });
      setDone(true);
      onImported(folder.folderPath);
    } catch (e: any) {
      setError(e?.message ?? 'Échec de l\u2019import.');
    } finally {
      setBusy(false);
    }
  }

  if (done) return null;

  return (
    <div className="bg-base-surface2 border border-base-border rounded-lg p-3">
      <p className="text-sm mb-2 truncate" title={folder.folderPath}>
        📁 {folder.folderName}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-base-surface border border-base-border rounded-md px-2 py-1 text-xs"
        />
        <input
          type="number"
          min={1}
          value={sessionNumber}
          onChange={(e) => setSessionNumber(parseInt(e.target.value || '1', 10))}
          className="w-16 bg-base-surface border border-base-border rounded-md px-2 py-1 text-xs frame-counter"
        />
        <button
          onClick={handleImport}
          disabled={busy}
          className="ml-auto bg-accent hover:bg-accent-dim transition-colors text-white text-xs font-medium rounded-md px-3 py-1.5 disabled:opacity-60"
        >
          {busy ? '…' : 'Importer'}
        </button>
      </div>
      {error && <p className="text-status-todo text-xs mt-1">{error}</p>}
    </div>
  );
}
