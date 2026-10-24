export default function WelcomeSetup({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-md text-center px-8">
        <div className="frame-counter inline-block text-sm mb-6">N° 001</div>
        <h1 className="text-2xl font-semibold mb-3">Bienvenue dans RawPilot</h1>
        <p className="text-ink-dim mb-8 leading-relaxed">
          Choisis le dossier racine où vivent déjà (ou vivront) tes archives par année.
          RawPilot y créera automatiquement l'arborescence Année / Mois / Session.
        </p>
        <button
          onClick={onChoose}
          className="bg-accent hover:bg-accent-dim transition-colors text-white px-5 py-2.5 rounded-xl font-medium"
        >
          Choisir le dossier racine
        </button>
      </div>
    </div>
  );
}
