import { useEffect, useState } from 'react';
import { Session, ChecklistStep, Config } from '../types';
import StatusDot from './StatusDot';
import EditSessionModal from './EditSessionModal';
import DocumentList from './DocumentList';
import EventPoster from './EventPoster';
import MissingFiles from './MissingFiles';
import PhotoThumbnails from './PhotoThumbnails';

interface Props {
  session: Session;
  config: Config;
  onUpdateChecklist: (stepId: string, value: boolean) => void;
  onOpenFolder: (sub?: string) => void;
  onImportPhotos: () => Promise<void>;
  onRefreshCounts: () => void;
  onRemove: () => void;
  onInfoUpdated: () => void;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function SessionDetail({
  session,
  config,
  onUpdateChecklist,
  onOpenFolder,
  onImportPhotos,
  onRefreshCounts,
  onRemove,
  onInfoUpdated,
}: Props) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const steps: ChecklistStep[] = config.checklistSteps;
  const rawEnabled = config.rawEnabled;

  useEffect(() => {
    const unsubscribe = window.rawpilot.sessions.onImportProgress((data) => {
      if (data.id === session.id) setProgress({ done: data.done, total: data.total });
    });
    return unsubscribe;
  }, [session.id]);

  const mismatch = rawEnabled && session.nefCount > 0 && session.nefCount !== session.jpegCount;

  async function handleImport() {
    setImporting(true);
    setProgress(null);
    try {
      await onImportPhotos();
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  function handleCheck(stepId: string, value: boolean) {
    if (value) {
      const idx = steps.findIndex((s) => s.id === stepId);
      const checklist = session.checklist || {};
      const missingPrior = steps.slice(0, idx).find((s) => !checklist[s.id]);
      if (missingPrior) {
        const currentLabel = steps[idx]?.label ?? stepId;
        const ok = window.confirm(
          `L'étape "${missingPrior.label}" n'est pas encore cochée. Cocher quand même "${currentLabel}" ?`
        );
        if (!ok) return;
      }
    }
    onUpdateChecklist(stepId, value);
  }

  function handleRemove() {
    const ok = window.confirm(
      `Retirer "Session ${session.sessionNumber}" du suivi RawPilot ?\n\nAucun fichier ne sera supprimé — la session disparaîtra juste de la liste de l'application.`
    );
    if (ok) onRemove();
  }

  const checklist = session.checklist || {};
  const hasSkippedStep = steps.some(
    (s, i) => checklist[s.id] && steps.slice(0, i).some((prior) => !checklist[prior.id])
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="frame-counter text-sm">N° {session.sessionNumber}</span>
              <StatusDot status={session.status} showLabel />
            </div>
            <h2 className="text-2xl font-semibold">Session {session.sessionNumber}</h2>
            <p className="text-ink-dim text-sm">{formatDate(session.date)}</p>
            {(session.category || session.location) && (
              <p className="text-xs text-ink-faint mt-1">
                {session.category === 'client' && `👤 Client${session.clientName ? ` — ${session.clientName}` : ''}`}
                {session.category === 'event' && '📅 Événement'}
                {session.location && ` · ${session.location}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEdit(true)}
              title="Modifier la date, le numéro..."
              className="text-ink-faint hover:text-ink text-sm px-2 py-1"
            >
              ✎ modifier
            </button>
            <button
              onClick={onRefreshCounts}
              title="Recompter les fichiers sur le disque"
              className="text-ink-faint hover:text-ink text-sm px-2 py-1"
            >
              ⟳ actualiser
            </button>
          </div>
        </div>

        {session.category === 'event' && <EventPoster sessionId={session.id} />}

        {/* Compteurs */}
        <div className={`grid gap-3 my-6 ${rawEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {rawEnabled && (
            <div className="bg-base-surface border border-base-border rounded-xl p-4">
              <p className="text-xs text-ink-dim mb-1">RAW</p>
              <p className="text-xl font-semibold frame-counter inline-block">{session.nefCount}</p>
            </div>
          )}
          <div className="bg-base-surface border border-base-border rounded-xl p-4">
            <p className="text-xs text-ink-dim mb-1">JPEG</p>
            <p className="text-xl font-semibold frame-counter inline-block">{session.jpegCount}</p>
          </div>
          <div className="bg-base-surface border border-base-border rounded-xl p-4">
            <p className="text-xs text-ink-dim mb-1">JPEG retouchés</p>
            <p className="text-xl font-semibold frame-counter inline-block">{session.retouchedCount}</p>
          </div>
        </div>

        {rawEnabled && session.nefCount > 0 && <MissingFiles session={session} />}

        <PhotoThumbnails key={session.id} session={session} />

        {session.notes && (
          <div className="bg-base-surface border border-base-border rounded-xl px-4 py-3 mb-6 text-sm text-ink-dim whitespace-pre-wrap">
            {session.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => onOpenFolder()}
            className="bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2"
          >
            Ouvrir le dossier
          </button>
          <button
            onClick={() => onOpenFolder('.JPEG Retouché')}
            className="bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2"
          >
            Ouvrir "JPEG Retouché"
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            className="bg-accent hover:bg-accent-dim transition-colors text-white text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-60"
          >
            {importing ? 'Import en cours…' : rawEnabled ? 'Importer les RAW' : 'Importer des photos'}
          </button>
        </div>

        {importing && progress && (
          <div className="mb-8">
            <div className="h-1.5 bg-base-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-ink-dim mt-1">
              {progress.done} / {progress.total} photos traitées
            </p>
          </div>
        )}

        {/* Checklist */}
        <div className="bg-base-surface border border-base-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-ink-dim mb-3">Progression</h3>

          <div className="space-y-2 mb-4">
            <ChecklistRow label="Dossiers créés" checked disabled />
            {rawEnabled && <ChecklistRow label="RAW importés" checked={session.nefCount > 0} disabled />}
            <ChecklistRow label="JPEG créés" checked={session.jpegCount > 0} disabled />
          </div>

          <div className="h-px bg-base-border my-4" />

          <div className="space-y-2">
            {steps.map((step) => (
              <ChecklistRow
                key={step.id}
                label={step.label}
                checked={!!checklist[step.id]}
                onChange={(v) => handleCheck(step.id, v)}
              />
            ))}
          </div>

          {hasSkippedStep && (
            <p className="text-xs text-status-progress mt-3">
              🟡 Une étape précédente n'est pas cochée — enchaînement inhabituel.
            </p>
          )}
        </div>

        {session.hasMontage && (
          <button
            onClick={() => onOpenFolder('Montage Réseaux')}
            className="mt-4 text-xs text-ink-dim hover:text-ink underline underline-offset-2"
          >
            Ouvrir "Montage Réseaux"
          </button>
        )}

        <div className="mt-8 bg-base-surface border border-base-border rounded-xl p-4">
          <DocumentList
            scope="session"
            sessionId={session.id}
            title="📄 Documents de cette session"
            description="Contrat rempli, décharge de droit à l'image signée, etc. propres à ce shooting."
          />
        </div>

        <div className="mt-8 pt-4 border-t border-base-border">
          <button onClick={handleRemove} className="text-xs text-ink-faint hover:text-status-todo transition-colors">
            Retirer cette session du suivi (les fichiers ne sont pas supprimés)
          </button>
        </div>
      </div>

      {showEdit && <EditSessionModal session={session} onClose={() => setShowEdit(false)} onUpdated={onInfoUpdated} />}
    </div>
  );
}

function ChecklistRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2.5 text-sm ${disabled ? 'text-ink-dim' : 'text-ink cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="accent-accent h-4 w-4 disabled:opacity-50"
      />
      {label}
    </label>
  );
}
