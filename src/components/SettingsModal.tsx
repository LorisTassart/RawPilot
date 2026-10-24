interface Props {
  onClose: () => void;
  onChangeRoot: () => void;
  onResetWelcome: () => void;
  onCheckMissing: () => void;
  rootPath: string;
}

export default function SettingsModal({ onClose, onChangeRoot, onResetWelcome, onCheckMissing, rootPath }: Props) {
  function handleResetWelcome() {
    const ok = window.confirm(
      "Revenir à l'écran de démarrage ? Tes sessions suivies ne seront pas supprimées, mais tu devras re-choisir (ou reconfirmer) ton dossier racine."
    );
    if (ok) onResetWelcome();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-sm p-6"
      >
        <h2 className="text-lg font-semibold mb-1">Paramètres</h2>
        <p className="text-xs text-ink-dim mb-1">Dossier racine actuel :</p>
        <p className="text-xs text-ink-faint mb-5 break-all bg-base-surface2 rounded-lg px-3 py-2">{rootPath}</p>

        <div className="space-y-2">
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
              Retrouve les sessions dont le dossier a bougé, pour les relocaliser une par une.
            </span>
          </button>

          <button
            onClick={handleResetWelcome}
            className="w-full text-left bg-base-surface2 hover:bg-base-border transition-colors text-sm rounded-lg px-3 py-2.5"
          >
            ⟲ Revenir à l'écran de premier démarrage
            <span className="block text-[11px] text-ink-faint mt-0.5">
              Tes sessions restent en mémoire, rien n'est supprimé.
            </span>
          </button>
        </div>

        <button onClick={onClose} className="w-full mt-5 text-sm text-ink-dim hover:text-ink py-1">
          Fermer
        </button>
      </div>
    </div>
  );
}
