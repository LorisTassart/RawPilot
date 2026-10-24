import { useState } from 'react';
import { Session, SessionCategory } from '../types';

interface Props {
  session: Session;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditSessionModal({ session, onClose, onUpdated }: Props) {
  const [date, setDate] = useState(session.date);
  const [sessionNumber, setSessionNumber] = useState<number>(session.sessionNumber);
  const [hasMontage, setHasMontage] = useState(session.hasMontage);
  const [category, setCategory] = useState<SessionCategory | null>(session.category);
  const [clientName, setClientName] = useState(session.clientName || '');
  const [location, setLocation] = useState(session.location || '');
  const [notes, setNotes] = useState(session.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await window.rawpilot.sessions.updateInfo({
        id: session.id,
        date,
        sessionNumber,
        hasMontage,
        category,
        clientName,
        location,
        notes,
      });
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
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto"
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

        <label className="block text-xs text-ink-dim mb-1">Type de session (optionnel)</label>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setCategory(category === 'client' ? null : 'client')}
            className={`flex-1 text-sm rounded-lg px-3 py-2 border transition-colors ${
              category === 'client'
                ? 'bg-accent text-white border-accent'
                : 'bg-base-surface2 border-base-border text-ink-dim hover:text-ink'
            }`}
          >
            👤 Client
          </button>
          <button
            type="button"
            onClick={() => setCategory(category === 'event' ? null : 'event')}
            className={`flex-1 text-sm rounded-lg px-3 py-2 border transition-colors ${
              category === 'event'
                ? 'bg-accent text-white border-accent'
                : 'bg-base-surface2 border-base-border text-ink-dim hover:text-ink'
            }`}
          >
            📅 Événement
          </button>
        </div>

        {category === 'client' && (
          <>
            <label className="block text-xs text-ink-dim mb-1">Nom du client</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-base-surface2 border border-base-border rounded-lg px-3 py-2 mb-4 text-sm"
            />
          </>
        )}

        <label className="block text-xs text-ink-dim mb-1">Lieu (optionnel)</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-base-surface2 border border-base-border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        <label className="block text-xs text-ink-dim mb-1">Notes (optionnel)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-base-surface2 border border-base-border rounded-lg px-3 py-2 mb-4 text-sm resize-none"
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
