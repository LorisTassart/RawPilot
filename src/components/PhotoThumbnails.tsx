import { useCallback, useEffect, useState } from 'react';
import { Session } from '../types';

type Folder = 'jpeg' | 'retouche';
interface Thumb {
  name: string;
  dataUrl: string | null;
}

const PAGE = 24;

export default function PhotoThumbnails({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<Folder>('jpeg');
  const [items, setItems] = useState<Thumb[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (offset: number) => {
      setLoading(true);
      setError(null);
      try {
        const r = await window.rawpilot.sessions.getThumbnails({ id: session.id, folder, offset, limit: PAGE });
        setTotal(r.total);
        setItems((prev) => (offset === 0 ? r.items : [...prev, ...r.items]));
      } catch (e: any) {
        setError(e?.message ?? 'Impossible de charger les aperçus.');
      } finally {
        setLoading(false);
      }
    },
    [session.id, folder]
  );

  // (Re)charge quand on ouvre la section, qu'on change d'onglet ou que le contenu du dossier change.
  useEffect(() => {
    if (!open) return;
    setItems([]);
    load(0);
  }, [open, folder, session.jpegCount, session.retouchedCount, load]);

  async function openPhoto(name: string) {
    try {
      await window.rawpilot.sessions.openPhoto({ id: session.id, folder, name });
    } catch (e: any) {
      setError(e?.message ?? "Impossible d'ouvrir cette photo.");
    }
  }

  const tab = (f: Folder, label: string, count: number) => (
    <button
      onClick={() => setFolder(f)}
      className={`text-xs rounded-md px-2.5 py-1 transition-colors ${
        folder === f ? 'bg-base-surface2 text-ink' : 'text-ink-faint hover:text-ink'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="mb-8 bg-base-surface border border-base-border rounded-xl p-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
        <span className="text-sm font-semibold text-ink-dim">🖼 Aperçu des photos</span>
        <span className="text-xs text-ink-faint">{open ? 'Masquer' : 'Afficher'}</span>
      </button>

      {open && (
        <div className="mt-3">
          <div className="flex gap-1 mb-3">
            {tab('jpeg', 'JPEG', session.jpegCount)}
            {tab('retouche', 'Retouchées', session.retouchedCount)}
          </div>

          {error && <p className="text-xs text-status-todo mb-2">{error}</p>}

          {items.length === 0 && !loading && !error && (
            <p className="text-xs text-ink-faint">Aucune photo dans ce dossier pour l'instant.</p>
          )}

          <div className="grid grid-cols-4 gap-2">
            {items.map((it) => (
              <button
                key={it.name}
                onClick={() => openPhoto(it.name)}
                title={`${it.name} — cliquer pour ouvrir`}
                className="aspect-square rounded-lg overflow-hidden bg-base-surface2 border border-base-border hover:border-accent transition-colors"
              >
                {it.dataUrl ? (
                  <img src={it.dataUrl} alt={it.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-[10px] text-ink-faint p-1 break-all">{it.name}</span>
                )}
              </button>
            ))}
          </div>

          {loading && <p className="text-xs text-ink-faint mt-3">Chargement…</p>}

          {!loading && items.length < total && (
            <button
              onClick={() => load(items.length)}
              className="mt-3 text-xs bg-base-surface2 hover:bg-base-border transition-colors rounded-lg px-3 py-1.5"
            >
              Voir plus ({total - items.length} restantes)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
