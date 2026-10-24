import logo from '../assets/logo.png';

export default function WelcomeSetup({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-md text-center px-8">
        <img src={logo} alt="RawPilot" className="h-20 w-20 rounded-2xl object-cover mx-auto mb-6" />
        <h1 className="text-2xl font-semibold mb-3">Bienvenue dans RawPilot</h1>
        <p className="text-ink-dim mb-8 leading-relaxed">
          Choisis le dossier racine où vivent déjà (ou vivront) tes archives par année.
          RawPilot y créera automatiquement l'arborescence Année / Mois / Session, et
          scannera aussi tout de suite ce dossier pour retrouver tes sessions déjà
          existantes (rien n'est déplacé ni modifié sur ton disque).
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
