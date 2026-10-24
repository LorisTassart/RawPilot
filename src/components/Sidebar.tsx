import { useMemo, useState } from 'react';
import { Session, SessionCategory } from '../types';
import StatusDot from './StatusDot';
import SearchBar from './SearchBar';
import logo from '../assets/logo.png';

interface Props {
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewSession: () => void;
  onRescan: () => void;
  unmatchedCount: number;
  onShowUnmatched: () => void;
  onOpenSettings: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  showDashboard: boolean;
  onToggleDashboard: () => void;
  showDocuments: boolean;
  onToggleDocuments: () => void;
  filterStatus: 'all' | 'todo' | 'progress' | 'done';
  onFilterStatusChange: (v: 'all' | 'todo' | 'progress' | 'done') => void;
  filterCategory: 'all' | SessionCategory;
  onFilterCategoryChange: (v: 'all' | SessionCategory) => void;
  filterYear: 'all' | number;
  onFilterYearChange: (v: 'all' | number) => void;
  availableYears: number[];
}

export default function Sidebar({
  sessions,
  selectedId,
  onSelect,
  onNewSession,
  onRescan,
  unmatchedCount,
  onShowUnmatched,
  onOpenSettings,
  search,
  onSearchChange,
  showDashboard,
  onToggleDashboard,
  showDocuments,
  onToggleDocuments,
  filterStatus,
  onFilterStatusChange,
  filterCategory,
  onFilterCategoryChange,
  filterYear,
  onFilterYearChange,
  availableYears,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(() => {
    const byYear = new Map<number, Map<string, Session[]>>();
    for (const s of sessions) {
      if (!byYear.has(s.year)) byYear.set(s.year, new Map());
      const months = byYear.get(s.year)!;
      if (!months.has(s.monthName)) months.set(s.monthName, []);
      months.get(s.monthName)!.push(s);
    }
    const years = Array.from(byYear.keys()).sort((a, b) => b - a);
    return years.map((year) => {
      const monthsMap = byYear.get(year)!;
      const monthEntries = Array.from(monthsMap.entries()).sort((a, b) => {
        const ma = a[1][0]?.month ?? 0;
        const mb = b[1][0]?.month ?? 0;
        return ma - mb;
      });
      return {
        year,
        months: monthEntries.map(([monthName, list]) => ({
          monthName,
          sessions: list.slice().sort((a, b) => a.sessionNumber - b.sessionNumber),
        })),
      };
    });
  }, [sessions]);

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const selectClass =
    'bg-base-surface2 border border-base-border rounded-md px-1 py-1 text-[11px] text-ink-dim flex-1 min-w-0 w-0';

  return (
    <aside className="w-72 shrink-0 bg-base-surface border-r border-base-border flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="RawPilot" className="h-7 w-7 rounded-md object-cover" />
          <h1 className="text-sm font-semibold tracking-wide text-ink">RawPilot</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleDashboard}
            title="Tableau de bord"
            className={`text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-base-surface2 ${
              showDashboard ? 'text-accent bg-base-surface2' : 'text-ink-faint hover:text-ink'
            }`}
          >
            📊
          </button>
          <button
            onClick={onToggleDocuments}
            title="Documents"
            className={`text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-base-surface2 ${
              showDocuments ? 'text-accent bg-base-surface2' : 'text-ink-faint hover:text-ink'
            }`}
          >
            📄
          </button>
          <button
            onClick={onOpenSettings}
            title="Paramètres"
            className="text-ink-faint hover:text-ink text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-base-surface2"
          >
            ⚙
          </button>
        </div>
      </div>
      <div className="px-3">
        <button
          onClick={onNewSession}
          className="w-full bg-accent hover:bg-accent-dim transition-colors text-white text-sm font-medium rounded-xl py-2"
        >
          + Nouveau shooting
        </button>
      </div>
      <SearchBar value={search} onChange={onSearchChange} />

      <div className="px-3 pb-2 flex gap-1.5">
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as any)}
          className={selectClass}
        >
          <option value="all">Tout statut</option>
          <option value="todo">🔴 À faire</option>
          <option value="progress">🟡 En cours</option>
          <option value="done">🟢 Terminé</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => onFilterCategoryChange(e.target.value as any)}
          className={selectClass}
        >
          <option value="all">Tout type</option>
          <option value="client">👤 Client</option>
          <option value="event">📅 Événement</option>
        </select>
        <select
          value={filterYear}
          onChange={(e) => onFilterYearChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
          className={selectClass}
        >
          <option value="all">Toute année</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="px-3 pb-2 -mt-1 flex flex-col gap-1">
        <button
          onClick={onRescan}
          title="Retrouver des sessions ajoutées manuellement sur le disque"
          className="text-[11px] text-ink-faint hover:text-ink-dim text-left"
        >
          ⟳ Scanner les dossiers existants
        </button>
        {unmatchedCount > 0 && (
          <button onClick={onShowUnmatched} className="text-[11px] text-status-progress hover:brightness-110 text-left">
            🟠 {unmatchedCount} dossier(s) non reconnu(s) — à valider
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {tree.length === 0 && (
          <p className="text-xs text-ink-faint px-2 py-6 text-center">Aucune session ne correspond.</p>
        )}
        {tree.map(({ year, months }) => (
          <div key={year} className="mb-2">
            <div className="px-2 py-1 text-xs font-semibold text-ink-dim">{year}</div>
            {months.map(({ monthName, sessions: monthSessions }) => {
              const key = `${year}-${monthName}`;
              const isCollapsed = collapsed.has(key);
              return (
                <div key={key} className="mb-1">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-ink-dim hover:text-ink rounded-lg"
                  >
                    <span className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>▾</span>
                    {monthName}
                  </button>
                  {!isCollapsed &&
                    monthSessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onSelect(s.id)}
                        className={`w-full flex items-center gap-2 pl-7 pr-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
                          !showDashboard && !showDocuments && selectedId === s.id
                            ? 'bg-base-surface2 text-ink'
                            : 'text-ink-dim hover:bg-base-surface2/60'
                        }`}
                      >
                        <StatusDot status={s.status} />
                        <span className="truncate">
                          Session {s.sessionNumber}
                          {s.category === 'client' && s.clientName ? ` · ${s.clientName}` : ''}
                        </span>
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
