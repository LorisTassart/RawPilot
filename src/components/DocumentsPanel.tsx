import DocumentList from './DocumentList';

export default function DocumentsPanel() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-semibold mb-1">📄 Documents</h2>
        <p className="text-ink-dim text-sm mb-6">
          Tes modèles vierges (contrats, décharges de droit à l'image, etc.), rangés dans un dossier
          "_Documents RawPilot" à la racine de tes archives. Pour un document rempli propre à un shooting précis,
          ajoute-le plutôt directement dans la session concernée.
        </p>
        <div className="bg-base-surface border border-base-border rounded-xl p-4">
          <DocumentList scope="global" />
        </div>
      </div>
    </div>
  );
}
