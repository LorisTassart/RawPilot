import { SessionStatus } from '../types';

const LABELS: Record<SessionStatus, string> = {
  todo: 'À faire',
  progress: 'En cours',
  done: 'Terminée',
};

const COLORS: Record<SessionStatus, string> = {
  todo: 'bg-status-todo',
  progress: 'bg-status-progress',
  done: 'bg-status-done',
};

export default function StatusDot({ status, showLabel = false }: { status: SessionStatus; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={LABELS[status]}>
      <span className={`h-2 w-2 rounded-full ${COLORS[status]}`} />
      {showLabel && <span className="text-xs text-ink-dim">{LABELS[status]}</span>}
    </span>
  );
}
