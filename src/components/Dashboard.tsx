import { DiskInfo, Session } from '../types';
import { DiskCard } from './DiskIndicator';

function daysBetween(a: string, b: string) {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export default function Dashboard({
  sessions,
  disk,
  diskAlertGb,
}: {
  sessions: Session[];
  disk?: DiskInfo | null;
  diskAlertGb?: number;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const sessionsThisMonth = sessions.filter((s) => s.year === currentYear && s.month === currentMonth).length;
  const sessionsThisYear = sessions.filter((s) => s.year === currentYear).length;
  const totalSessions = sessions.length;
  const totalPhotos = sessions.reduce((sum, s) => sum + (s.jpegCount || 0), 0);

  const completedDelays = sessions
    .filter((s) => s.completedAt)
    .map((s) => daysBetween(s.date, s.completedAt as string))
    .filter((d) => d >= 0);
  const avgDays =
    completedDelays.length > 0 ? Math.round(completedDelays.reduce((a, b) => a + b, 0) / completedDelays.length) : null;

  const clientCount = sessions.filter((s) => s.category === 'client').length;
  const eventCount = sessions.filter((s) => s.category === 'event').length;
  const unspecifiedCount = totalSessions - clientCount - eventCount;

  const todoCount = sessions.filter((s) => s.status === 'todo').length;
  const progressCount = sessions.filter((s) => s.status === 'progress').length;
  const doneCount = sessions.filter((s) => s.status === 'done').length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-semibold mb-6">📊 Tableau de bord</h2>

        <DiskCard info={disk ?? null} alertGb={diskAlertGb ?? 20} />

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Sessions ce mois-ci" value={sessionsThisMonth} />
          <StatCard label="Sessions cette année" value={sessionsThisYear} />
          <StatCard label="Sessions au total" value={totalSessions} />
          <StatCard label="Photos livrées (JPEG)" value={totalPhotos} />
        </div>

        <div className="bg-base-surface border border-base-border rounded-xl p-4 mb-6">
          <p className="text-xs text-ink-dim mb-1">Délai moyen shooting → terminé</p>
          <p className="text-xl font-semibold frame-counter inline-block">
            {avgDays !== null ? `${avgDays} jour${avgDays > 1 ? 's' : ''}` : '—'}
          </p>
          {avgDays === null && (
            <p className="text-[11px] text-ink-faint mt-1">
              Aucune session terminée pour l'instant (ou terminées avant cette mise à jour).
            </p>
          )}
        </div>

        <div className="bg-base-surface border border-base-border rounded-xl p-4 mb-6">
          <p className="text-xs text-ink-dim mb-3">Répartition par statut</p>
          <div className="flex gap-4 text-sm">
            <span>🔴 {todoCount} à faire</span>
            <span>🟡 {progressCount} en cours</span>
            <span>🟢 {doneCount} terminées</span>
          </div>
        </div>

        <div className="bg-base-surface border border-base-border rounded-xl p-4">
          <p className="text-xs text-ink-dim mb-3">Répartition par type</p>
          <div className="flex gap-4 text-sm">
            <span>👤 {clientCount} client(s)</span>
            <span>📅 {eventCount} événement(s)</span>
            {unspecifiedCount > 0 && <span className="text-ink-faint">— {unspecifiedCount} non précisé(s)</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-base-surface border border-base-border rounded-xl p-4">
      <p className="text-xs text-ink-dim mb-1">{label}</p>
      <p className="text-xl font-semibold frame-counter inline-block">{value}</p>
    </div>
  );
}
