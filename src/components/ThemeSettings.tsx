import { Config, ThemePref } from '../types';
import { applyTheme } from '../theme';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'dark', label: '🌙 Sombre' },
  { value: 'light', label: '☀️ Clair' },
  { value: 'system', label: '💻 Système' },
];

export default function ThemeSettings({
  config,
  onConfigChanged,
}: {
  config: Config;
  onConfigChanged: (config: Config) => void;
}) {
  const current: ThemePref = config.theme ?? 'dark';

  async function choose(theme: ThemePref) {
    applyTheme(theme); // effet immédiat
    try {
      const updated = await window.rawpilot.config.updateTheme({ theme });
      onConfigChanged(updated);
    } catch (e) {
      /* le thème reste appliqué pour cette session */
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            className={`flex-1 text-sm rounded-lg px-3 py-2 border transition-colors ${
              current === o.value
                ? 'bg-accent text-white border-accent'
                : 'bg-base-surface2 border-base-border text-ink-dim hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-ink-faint mt-2">
        "Système" suit automatiquement le réglage clair/sombre de Windows.
      </p>
    </div>
  );
}
