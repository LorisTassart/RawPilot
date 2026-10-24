import { useState } from 'react';
import { Session } from '../types';

interface Props {
  sessions: Session[];
  onClose: () => void;
  onRelocated: (id: string) => void;
  onRemoved: (id: string) => void;
}

export default function MissingFoldersModal({ sessions, onClose, onRelocated, onRemoved }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="p-6 pb-3">
          <h2 className="text-lg font-semibold mb-1">Dossiers introuvables</h2>
          <p className="text-xs text-ink-dim">
            Ces sessions étaient suivies mais leur dossier n'existe plus à l'endroit attendu — probablement déplacé ou
            renommé. Indique son nouvel emplacement, ou retire la session du suivi si le dossier a vraiment été
            supprimé.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-2">
          {sessions.length === 0 && <p className="text-xs text-ink-faint py-4 text-center">Tout est en ordre 👍</p>}
          {sessions.map((s) => (
            <Row key={s.id} session={s} onRelocated={onRelocated} onRemoved={onRemoved} />
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

function Row({
  session,
  onRelocated,
  onRemoved,
}: {
  session: Session;
  onRelocated: (id: string) => void;
  onRemoved: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  async function handleRelocate() {
    setBusy(true);
    try {
      const updated = await window.rawpilot.sessions.relocate({ id: session.id });
      if (updated) {
        onRelocated(session.id);
        setGone(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    const ok = window.confirm(
      `Retirer "Session ${session.sessionNumber}" du suivi ? Cette action ne supprime aucun fichier — elle enlève juste la session de la liste de RawPilot.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      await window.rawpilot.sessions.remove({ id: session.id });
      onRemoved(session.id);
      setGone(true);
    } finally {
      setBusy(false);
    }
  }

  if (gone) return null;

  return (
    <div className="bg-base-surface2 border border-base-border rounded-lg p-3">
      <p className="text-sm mb-1">
        Session {session.sessionNumber} — {session.date}
      </p>
      <p className="text-xs text-ink-faint truncate mb-2" title={session.folderPath}>
        {session.folderPath}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleRelocate}
          disabled={busy}
          className="bg-accent hover:bg-accent-dim transition-colors text-white text-xs font-medium rounded-md px-3 py-1.5 disabled:opacity-60"
        >
          Localiser...
        </button>
        <button
          onClick={handleRemove}
          disabled={busy}
          className="text-status-todo text-xs font-medium rounded-md px-3 py-1.5 hover:bg-status-todo/10 disabled:opacity-60"
        >
          Retirer du suivi
        </button>
      </div>
    </div>
  );
}
