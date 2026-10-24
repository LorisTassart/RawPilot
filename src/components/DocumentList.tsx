import { useEffect, useState } from 'react';
import { DocumentFile } from '../types';

interface Props {
  scope: 'global' | 'session';
  sessionId?: string;
  title?: string;
  description?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentList({ scope, sessionId, title, description }: Props) {
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const list = await window.rawpilot.documents.list({ scope, sessionId });
      setDocs(list);
    } catch (e: any) {
      setError(e?.message ?? 'Impossible de charger les documents.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, sessionId]);

  async function handleAdd() {
    setAdding(true);
    setError(null);
    try {
      const list = await window.rawpilot.documents.add({ scope, sessionId });
      setDocs(list);
    } catch (e: any) {
      setError(e?.message ?? "Échec de l'ajout.");
    } finally {
      setAdding(false);
    }
  }

  async function handleOpen(fileName: string) {
    try {
      await window.rawpilot.documents.open({ scope, sessionId, fileName });
    } catch (e: any) {
      setError(e?.message ?? "Impossible d'ouvrir ce document.");
    }
  }

  async function handleReveal(fileName: string) {
    try {
      await window.rawpilot.documents.reveal({ scope, sessionId, fileName });
    } catch (e: any) {
      setError(e?.message ?? "Impossible d'ouvrir l'explorateur.");
    }
  }

  async function handleRemove(fileName: string) {
    const ok = window.confirm(
      `Supprimer "${fileName}" ? Cette copie sera définitivement supprimée de RawPilot (un original gardé ailleurs sur ton disque n'est pas touché).`
    );
    if (!ok) return;
    try {
      const list = await window.rawpilot.documents.remove({ scope, sessionId, fileName });
      setDocs(list);
    } catch (e: any) {
      setError(e?.message ?? 'Échec de la suppression.');
    }
  }

  function startRename(fileName: string) {
    setRenamingFile(fileName);
    setRenameValue(fileName);
    setError(null);
  }

  async function confirmRename() {
    if (!renamingFile) return;
    try {
      const list = await window.rawpilot.documents.rename({
        scope,
        sessionId,
        fileName: renamingFile,
        newName: renameValue.trim(),
      });
      setDocs(list);
      setRenamingFile(null);
    } catch (e: any) {
      setError(e?.message ?? 'Échec du renommage.');
    }
  }

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-ink-dim mb-1">{title}</h3>}
      {description && <p className="text-xs text-ink-faint mb-3">{description}</p>}

      <button
        onClick={handleAdd}
        disabled={adding}
        className="bg-accent hover:bg-accent-dim transition-colors text-white text-xs font-medium rounded-lg px-3 py-1.5 disabled:opacity-60"
      >
        {adding ? 'Ajout…' : '+ Ajouter un document'}
      </button>

      {error && <p className="text-xs text-status-todo mt-2">{error}</p>}

      {loading ? (
        <p className="text-xs text-ink-faint mt-3">Chargement…</p>
      ) : docs.length === 0 ? (
        <p className="text-xs text-ink-faint mt-3">Aucun document pour l'instant.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {docs.map((d) => (
            <li key={d.fileName} className="bg-base-surface2 border border-base-border rounded-lg px-3 py-2">
              {renamingFile === d.fileName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 bg-base-surface border border-base-border rounded-md px-2 py-1 text-xs"
                    autoFocus
                  />
                  <button
                    onClick={confirmRename}
                    className="bg-accent hover:bg-accent-dim transition-colors text-white text-xs rounded-md px-2 py-1"
                  >
                    OK
                  </button>
                  <button onClick={() => setRenamingFile(null)} className="text-ink-faint hover:text-ink text-xs px-2 py-1">
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{d.fileName}</p>
                    <p className="text-[11px] text-ink-faint">{formatSize(d.size)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleOpen(d.fileName)}
                      title="Ouvrir avec l'application par défaut"
                      className="text-xs text-ink-dim hover:text-ink bg-base-surface hover:bg-base-border rounded-md px-2 py-1"
                    >
                      Ouvrir
                    </button>
                    <button
                      onClick={() => handleReveal(d.fileName)}
                      title="Ouvrir dans l'Explorateur de fichiers"
                      className="text-xs text-ink-dim hover:text-ink bg-base-surface hover:bg-base-border rounded-md px-2 py-1"
                    >
                      📁
                    </button>
                    <button
                      onClick={() => startRename(d.fileName)}
                      title="Renommer"
                      className="text-xs text-ink-dim hover:text-ink bg-base-surface hover:bg-base-border rounded-md px-2 py-1"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleRemove(d.fileName)}
                      title="Supprimer"
                      className="text-xs text-status-todo hover:bg-status-todo/10 rounded-md px-2 py-1"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
