import { useEffect, useState } from 'react';

export default function EventPoster({ sessionId }: { sessionId: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const url = await window.rawpilot.sessions.getPoster({ id: sessionId });
      setDataUrl(url);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger l'affiche.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleSet() {
    setBusy(true);
    setError(null);
    try {
      const url = await window.rawpilot.sessions.setPoster({ id: sessionId });
      if (url) setDataUrl(url);
    } catch (e: any) {
      setError(e?.message ?? "Échec de l'ajout de l'affiche.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    const ok = window.confirm("Retirer l'affiche de cet événement ? (le fichier copié dans RawPilot sera supprimé)");
    if (!ok) return;
    try {
      await window.rawpilot.sessions.removePoster({ id: sessionId });
      setDataUrl(null);
    } catch (e: any) {
      setError(e?.message ?? 'Échec de la suppression.');
    }
  }

  if (loading) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-ink-dim mb-2">Affiche de l'événement</h3>
      {dataUrl ? (
        <div>
          <img
            src={dataUrl}
            alt="Affiche de l'événement"
            className="max-h-64 rounded-xl border border-base-border object-contain"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSet}
              disabled={busy}
              className="bg-base-surface2 hover:bg-base-border transition-colors text-xs rounded-lg px-3 py-1.5 disabled:opacity-60"
            >
              {busy ? '…' : "Changer l'affiche"}
            </button>
            <button
              onClick={handleRemove}
              className="text-status-todo text-xs rounded-lg px-3 py-1.5 hover:bg-status-todo/10"
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSet}
          disabled={busy}
          className="bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2 disabled:opacity-60"
        >
          {busy ? 'Ajout…' : '+ Ajouter une affiche'}
        </button>
      )}
      {error && <p className="text-xs text-status-todo mt-2">{error}</p>}
    </div>
  );
}
