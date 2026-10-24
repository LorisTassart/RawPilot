export default function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="px-3 pt-3 pb-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher : 49, Août, 2026…"
        className="w-full bg-base-surface2 border border-base-border rounded-xl px-3 py-2 text-sm placeholder:text-ink-faint focus:border-accent transition-colors"
      />
    </div>
  );
}
