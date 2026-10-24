import { DiskInfo } from '../types';

const GB = 1024 ** 3;

export function formatBytes(bytes: number) {
  const gb = bytes / GB;
  if (gb >= 1000) return `${(gb / 1024).toFixed(1)} To`;
  if (gb >= 10) return `${Math.round(gb)} Go`;
  return `${gb.toFixed(1)} Go`;
}

export function diskLevel(info: DiskInfo, alertGb: number): 'ok' | 'warn' | 'low' {
  const freeGb = info.freeBytes / GB;
  if (alertGb > 0 && freeGb < alertGb) return 'low';
  if (alertGb > 0 && freeGb < alertGb * 2) return 'warn';
  return 'ok';
}

const TEXT = { ok: 'text-status-done', warn: 'text-status-progress', low: 'text-status-todo' } as const;
const BAR = { ok: 'bg-status-done', warn: 'bg-status-progress', low: 'bg-status-todo' } as const;

function usedPercent(info: DiskInfo) {
  if (!info.totalBytes) return 0;
  return Math.min(100, Math.max(0, Math.round((1 - info.freeBytes / info.totalBytes) * 100)));
}

// Petit indicateur discret en bas de la barre latérale.
export default function DiskIndicator({ info, alertGb }: { info: DiskInfo | null; alertGb: number }) {
  if (!info) return null;
  const level = diskLevel(info, alertGb);
  return (
    <div
      className="px-4 py-3 border-t border-base-border"
      title={`${formatBytes(info.freeBytes)} libres sur ${formatBytes(info.totalBytes)} (disque des archives)`}
    >
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-ink-dim">💾 Espace disque</span>
        <span className={TEXT[level]}>{formatBytes(info.freeBytes)} libres</span>
      </div>
      <div className="h-1 bg-base-surface2 rounded-full overflow-hidden mt-1.5">
        <div className={`h-full ${BAR[level]}`} style={{ width: `${usedPercent(info)}%` }} />
      </div>
      {level === 'low' && (
        <p className="text-[11px] text-status-todo mt-1.5">
          ⚠ Moins de {alertGb} Go libres — pense à libérer de la place.
        </p>
      )}
    </div>
  );
}

// Version large pour le tableau de bord.
export function DiskCard({ info, alertGb }: { info: DiskInfo | null; alertGb: number }) {
  if (!info) return null;
  const level = diskLevel(info, alertGb);
  return (
    <div className="bg-base-surface border border-base-border rounded-xl p-4 mb-6">
      <p className="text-xs text-ink-dim mb-1">Espace disque des archives</p>
      <p className={`text-xl font-semibold ${TEXT[level]}`}>{formatBytes(info.freeBytes)} libres</p>
      <div className="h-1.5 bg-base-surface2 rounded-full overflow-hidden mt-2">
        <div className={`h-full ${BAR[level]}`} style={{ width: `${usedPercent(info)}%` }} />
      </div>
      <p className="text-[11px] text-ink-faint mt-1">
        {usedPercent(info)} % utilisés sur {formatBytes(info.totalBytes)} · alerte sous {alertGb} Go
      </p>
      {level === 'low' && (
        <p className="text-xs text-status-todo mt-2">
          ⚠ L'espace libre est passé sous ton seuil d'alerte. Pense à archiver ou libérer de la place avant ton
          prochain import.
        </p>
      )}
    </div>
  );
}
