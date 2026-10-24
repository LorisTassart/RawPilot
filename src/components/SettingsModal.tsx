import { useEffect, useState } from 'react';
import { ChecklistStep, Config, RawFormatOption } from '../types';
import ThemeSettings from './ThemeSettings';
import DiskSettings from './DiskSettings';

interface Props {
  config: Config;
  onClose: () => void;
  onChangeRoot: () => void;
  onResetWelcome: () => void;
  onCheckMissing: () => void;
  onConfigChanged: (config: Config) => void;
}

function slugify(label: string, existing: string[]): string {
  let base = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!base) base = 'etape';
  let id = base;
  let i = 2;
  while (existing.includes(id)) {
    id = `${base}_${i}`;
    i += 1;
  }
  return id;
}

export default function SettingsModal({
  config,
  onClose,
  onChangeRoot,
  onResetWelcome,
  onCheckMissing,
  onConfigChanged,
}: Props) {
  const [catalog, setCatalog] = useState<RawFormatOption[]>([]);
  const [rawEnabled, setRawEnabled] = useState(config.rawEnabled);
  const [rawFormats, setRawFormats] = useState<string[]>(config.rawFormats);
  const [autoConvert, setAutoConvert] = useState(config.autoConvert);
  const [savingRaw, setSavingRaw] = useState(false);

  const [steps, setSteps] = useState<ChecklistStep[]>(config.checklistSteps);
  const [newStepLabel, setNewStepLabel] = useState('');
  const [savingSteps, setSavingSteps] = useState(false);

  const [devBusy, setDevBusy] = useState(false);
  const [devMessage, setDevMessage] = useState<string | null>(null);

  useEffect(() => {
    window.rawpilot.config.rawCatalog().then(setCatalog);
  }, []);

  function toggleFormat(id: string) {
    setRawFormats((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  async function handleSaveRaw() {
    setSavingRaw(true);
    try {
      const updated = await window.rawpilot.config.updateRawSettings({ rawEnabled, rawFormats, autoConvert });
      onConfigChanged(updated);
    } finally {
      setSavingRaw(false);
    }
  }

  function moveStep(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const next = steps.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  }

  function renameStep(index: number, label: string) {
    const next = steps.slice();
    next[index] = { ...next[index], label };
    setSteps(next);
  }

  function removeStep(index: number) {
    if (steps.length <= 1) {
      window.alert('Il faut garder au moins une étape dans le suivi.');
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  }

  function addStep() {
    const label = newStepLabel.trim();
    if (!label) return;
    const id = slugify(
      label,
      steps.map((s) => s.id)
    );
    setSteps([...steps, { id, label }]);
    setNewStepLabel('');
  }

  async function handleSaveSteps() {
    setSavingSteps(true);
    try {
      const updated = await window.rawpilot.config.updateChecklistSteps({ steps });
      onConfigChanged(updated);
    } finally {
      setSavingSteps(false);
    }
  }

  function handleResetWelcome() {
    const ok = window.confirm(
      "Revenir à l'écran de démarrage ? Tes sessions suivies ne seront pas supprimées, mais tu devras re-choisir (ou reconfirmer) ton dossier racine."
    );
    if (ok) onResetWelcome();
  }

  async function handleExportProfile() {
    setDevBusy(true);
    setDevMessage(null);
    try {
      const filePath = await window.rawpilot.app.exportProfile();
      setDevMessage(filePath ? `Profil exporté : ${filePath}` : null);
    } catch (e: any) {
      setDevMessage(e?.message ?? "Échec de l'export.");
    } finally {
      setDevBusy(false);
    }
  }

  async function handleImportProfile() {
    setDevBusy(true);
    setDevMessage(null);
    try {
      const updated = await window.rawpilot.app.importProfile();
      if (updated) {
        onConfigChanged(updated);
        setDevMessage('Profil importé avec succès.');
      }
    } catch (e: any) {
      setDevMessage(e?.message ?? "Échec de l'import.");
    } finally {
      setDevBusy(false);
    }
  }

  async function handleResetAll() {
    const ok = window.confirm(
      "Réinitialiser complètement RawPilot ? Toutes les sessions suivies et tous les réglages seront effacés (aucun fichier sur le disque n'est touché). Cette action est destinée au développeur pour repartir de zéro."
    );
    if (!ok) return;
    setDevBusy(true);
    setDevMessage(null);
    try {
      const updated = await window.rawpilot.app.resetAll();
      onConfigChanged(updated);
      setDevMessage('RawPilot a été réinitialisé.');
    } finally {
      setDevBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Paramètres</h2>
            <button onClick={onClose} className="text-sm text-ink-dim hover:text-ink">
              Fermer
            </button>
          </div>

          {/* Dossier racine */}
          <section>
            <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Dossier racine</h3>
            <p className="text-xs text-ink-faint break-all bg-base-surface2 rounded-lg px-3 py-2 mb-2">
              {config.rootPath}
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={onChangeRoot}
                className="w-full text-left bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2.5"
              >
                📁 Changer le dossier racine
                <span className="block text-[11px] text-ink-faint mt-0.5">
                  Si tu as déplacé ou renommé ton dossier d'archives.
                </span>
              </button>
              <button
                onClick={onCheckMissing}
                className="w-full text-left bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2.5"
              >
                🔎 Vérifier les dossiers manquants
                <span className="block text-[11px] text-ink-faint mt-0.5">
                  Retrouve les sessions dont le dossier a bougé.
                </span>
              </button>
              <button
                onClick={handleResetWelcome}
                className="w-full text-left bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2.5"
              >
                ⟲ Revenir à l'écran de premier démarrage
                <span className="block text-[11px] text-ink-faint mt-0.5">Tes sessions restent en mémoire.</span>
              </button>
            </div>
          </section>

          {/* Format RAW */}
          <section>
            <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Format RAW</h3>
            <label className="flex items-center gap-2 text-sm mb-3">
              <input
                type="checkbox"
                checked={rawEnabled}
                onChange={(e) => setRawEnabled(e.target.checked)}
                className="accent-accent h-4 w-4"
              />
              J'utilise un format RAW propriétaire (photos issues d'un appareil photo)
            </label>

            {rawEnabled && (
              <>
                <p className="text-xs text-ink-dim mb-2">Formats à reconnaître (plusieurs possibles) :</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {catalog.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-xs bg-base-surface2 rounded-lg px-2.5 py-2">
                      <input
                        type="checkbox"
                        checked={rawFormats.includes(f.id)}
                        onChange={() => toggleFormat(f.id)}
                        className="accent-accent h-3.5 w-3.5"
                      />
                      {f.label}
                    </label>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm mb-1">
                  <input
                    type="checkbox"
                    checked={autoConvert}
                    onChange={(e) => setAutoConvert(e.target.checked)}
                    className="accent-accent h-4 w-4"
                  />
                  RawPilot convertit automatiquement le RAW en JPEG à l'import
                </label>
                <p className="text-[11px] text-ink-faint mb-3">
                  Si décoché, RawPilot range juste les fichiers RAW — à toi de faire l'export JPEG toi-même (Lightroom,
                  etc.).
                </p>
              </>
            )}

            <button
              onClick={handleSaveRaw}
              disabled={savingRaw || (rawEnabled && rawFormats.length === 0)}
              className="bg-accent hover:bg-accent-dim transition-colors text-white text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-60"
            >
              {savingRaw ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {rawEnabled && rawFormats.length === 0 && (
              <p className="text-[11px] text-status-todo mt-1">Sélectionne au moins un format.</p>
            )}
          </section>

          {/* Étapes de suivi */}
          <section>
            <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Étapes de suivi</h3>
            <div className="space-y-1.5 mb-3">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1.5 bg-base-surface2 rounded-lg px-2 py-1.5">
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveStep(i, -1)}
                      disabled={i === 0}
                      className="text-ink-faint hover:text-ink disabled:opacity-20 text-[10px] leading-none"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveStep(i, 1)}
                      disabled={i === steps.length - 1}
                      className="text-ink-faint hover:text-ink disabled:opacity-20 text-[10px] leading-none"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    value={step.label}
                    onChange={(e) => renameStep(i, e.target.value)}
                    className="flex-1 bg-transparent text-sm px-1 py-1 outline-none focus:bg-base-surface rounded"
                  />
                  <button
                    onClick={() => removeStep(i)}
                    className="text-ink-faint hover:text-status-todo text-xs px-1.5"
                    title="Supprimer cette étape"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mb-3">
              <input
                value={newStepLabel}
                onChange={(e) => setNewStepLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStep();
                  }
                }}
                placeholder="Nouvelle étape…"
                className="flex-1 bg-base-surface2 border border-base-border rounded-lg px-3 py-1.5 text-sm"
              />
              <button
                onClick={addStep}
                className="bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-1.5"
              >
                + Ajouter
              </button>
            </div>
            <button
              onClick={handleSaveSteps}
              disabled={savingSteps}
              className="bg-accent hover:bg-accent-dim transition-colors text-white text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-60"
            >
              {savingSteps ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Apparence</h3>
            <ThemeSettings config={config} onConfigChanged={onConfigChanged} />
          </section>

          <section>
            <h3 className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2">Espace disque</h3>
            <DiskSettings config={config} onConfigChanged={onConfigChanged} />
          </section>

          {/* Mode développeur — jamais visible en dehors de "npm run dev" */}
          {config.isDev && (
            <section className="border border-status-progress/40 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-status-progress uppercase tracking-wide mb-2">
                Mode développeur
              </h3>
              <p className="text-[11px] text-ink-faint mb-3">
                Cette section n'apparaît jamais dans la version publiée de l'app — seulement ici, en développement.
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleExportProfile}
                  disabled={devBusy}
                  className="w-full text-left bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2 disabled:opacity-60"
                >
                  ⬇ Exporter ma configuration (fichier .json)
                </button>
                <button
                  onClick={handleImportProfile}
                  disabled={devBusy}
                  className="w-full text-left bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2 disabled:opacity-60"
                >
                  ⬆ Importer une configuration (fichier .json)
                </button>
                <button
                  onClick={handleResetAll}
                  disabled={devBusy}
                  className="w-full text-left bg-status-todo/10 hover:bg-status-todo/20 text-status-todo transition-colors text-sm rounded-lg px-3 py-2 disabled:opacity-60"
                >
                  ⚠ Réinitialiser complètement (tout effacer)
                </button>
              </div>
              {devMessage && <p className="text-[11px] text-ink-dim mt-2">{devMessage}</p>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
