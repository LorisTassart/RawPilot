import { useState } from 'react';
import { Session } from '../types';

interface Props {
  session: Session;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditSessionModal({ session, onClose, onUpdated }: Props) {
  const [date, setDate] = useState(session.date);
  const [sessionNumber, setSessionNumber] = useState<number>(session.sessionNumber);
  const [hasMontage, setHasMontage] = useState(session.hasMontage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await window.rawpilot.sessions.updateInfo({ id: session.id, date, sessionNumber, hasMontage });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-1">Modifier la session</h2>
        <p className="text-xs text-ink-dim mb-5">
          Si tu changes la date ou le numéro, le dossier sur le disque est renommé et déplacé
          automatiquement pour rester cohérent.
        </p>

        <label className="block text-xs text-ink-dim mb-1">Date du shooting</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full bg-base-surface2 border border-base-border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        <label className="block text-xs text-ink-dim mb-1">Numéro de session</label>
        <input
          type="number"
          min={1}
          value={sessionNumber}
          onChange={(e) => setSessionNumber(parseInt(e.target.value || '1', 10))}
          required
          className="w-full bg-base-surface2 border border-base-border rounded-lg px-3 py-2 mb-4 text-sm frame-counter"
        />

        <label className="flex items-center gap-2 mb-6 text-sm">
          <input
            type="checkbox"
            checked={hasMontage}
            onChange={(e) => setHasMontage(e.target.checked)}
            className="accent-accent h-4 w-4"
          />
          Dossier "Montage Réseaux"
        </label>

        {error && <p className="text-status-todo text-xs mb-4">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-ink-dim hover:text-ink">
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accent-dim transition-colors text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
