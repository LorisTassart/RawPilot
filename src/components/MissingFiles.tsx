import { useEffect, useState } from 'react';
import { Session } from '../types';

export default function MissingFiles({ session }: { session: Session }) {
  const [data, setData] = useState<{ rawCount: number; missingJpeg: string[] } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.rawpilot.sessions
      .getMissing({ id: session.id })
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session.id, session.nefCount, session.jpegCount]);

  if (!data || data.rawCount === 0) return null;

  if (data.missingJpeg.length === 0) {
    return <p className="text-xs text-status-done mb-6">✓ Chaque RAW a bien son JPEG ({data.rawCount} / {data.rawCount}).</p>;
  }

  return (
    <div className="bg-status-progress/10 border border-status-progress/40 rounded-xl px-4 py-3 mb-6">
      <p className="text-sm text-status-progress">
        🟠 {data.missingJpeg.length} RAW sur {data.rawCount} n'ont pas de JPEG correspondant.
      </p>
      <button onClick={() => setOpen((v) => !v)} className="text-xs text-ink-dim hover:text-ink mt-1 underline underline-offset-2">
        {open ? 'Masquer la liste' : 'Voir les fichiers concernés'}
      </button>
      {open && (
        <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-ink-dim font-mono space-y-0.5">
          {data.missingJpeg.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
