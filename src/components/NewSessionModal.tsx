import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
  onCreate: (payload: { date: string; sessionNumber: number; hasMontage: boolean }) => Promise<void>;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function NewSessionModal({ onClose, onCreate }: Props) {
  const [date, setDate] = useState(todayStr());
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [hasMontage, setHasMontage] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.rawpilot.sessions.nextNumber().then(setSessionNumber);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await onCreate({ date, sessionNumber, hasMontage });
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-1">Nouveau shooting</h2>
        <p className="text-xs text-ink-dim mb-5">RawPilot crée automatiquement toute l'arborescence.</p>

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
          className="w-full bg-base-surface2 border border-base-border rounded-lg px-3 py-2 mb-1 text-sm frame-counter"
        />
        <p className="text-[11px] text-ink-faint mb-4">Proposé automatiquement d'après ta dernière session. Modifiable.</p>

        <label className="flex items-center gap-2 mb-6 text-sm">
          <input
            type="checkbox"
            checked={hasMontage}
            onChange={(e) => setHasMontage(e.target.checked)}
            className="accent-accent h-4 w-4"
          />
          Créer le dossier "Montage Réseaux"
        </label>

        {error && <p className="text-status-todo text-xs mb-4">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-ink-dim hover:text-ink">
            Annuler
          </button>
          <button
            type="submit"
            disabled={creating}
            className="bg-accent hover:bg-accent-dim transition-colors text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-60"
          >
            {creating ? 'Création…' : 'Créer le shooting'}
          </button>
        </div>
      </form>
    </div>
  );
}
