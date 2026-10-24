import { useState } from 'react';
import { Config } from '../types';

export default function DiskSettings({
  config,
  onConfigChanged,
}: {
  config: Config;
  onConfigChanged: (config: Config) => void;
}) {
  const [value, setValue] = useState(String(config.diskAlertGb ?? 20));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await window.rawpilot.config.updateDiskSettings({ diskAlertGb: Number(value) });
      onConfigChanged(updated);
      setMessage('Seuil enregistré.');
    } catch (e: any) {
      setMessage(e?.message ?? 'Échec de l\u2019enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-ink-faint mb-3">
        RawPilot surveille l'espace libre du disque où sont tes archives et te prévient (barre latérale et tableau
        de bord) quand il passe sous ce seuil. Mets 0 pour désactiver l'alerte.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 bg-base-surface2 border border-base-border rounded-lg px-3 py-1.5 text-sm"
        />
        <span className="text-sm text-ink-dim">Go libres minimum</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto bg-accent hover:bg-accent-dim transition-colors text-white text-sm font-medium rounded-lg px-3 py-1.5 disabled:opacity-60"
        >
          {saving ? '…' : 'Enregistrer'}
        </button>
      </div>
      {message && <p className="text-[11px] text-ink-dim mt-2">{message}</p>}
    </div>
  );
}
