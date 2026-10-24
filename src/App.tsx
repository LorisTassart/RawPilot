import { useEffect, useState } from 'react';
import { Config, Session } from './types';
import WelcomeSetup from './components/WelcomeSetup';
import Sidebar from './components/Sidebar';
import SessionDetail from './components/SessionDetail';
import NewSessionModal from './components/NewSessionModal';

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const c = await window.rawpilot.config.get();
      setConfig(c);
      if (c.rootPath) await loadSessions();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  async function loadSessions(query?: string) {
    const q = query ?? search;
    const list = q ? await window.rawpilot.sessions.search({ query: q }) : await window.rawpilot.sessions.list();
    setSessions(list);
    return list;
  }

  async function handleChooseRoot() {
    const c = await window.rawpilot.config.selectRootFolder();
    if (c) {
      setConfig(c);
      await loadSessions();
    }
  }

  async function handleSearchChange(v: string) {
    setSearch(v);
    await loadSessions(v);
  }

  async function handleCreateSession(payload: { date: string; sessionNumber: number; hasMontage: boolean }) {
    const session = await window.rawpilot.sessions.create(payload);
    const list = await loadSessions();
    setSelectedId(session.id);
    setShowModal(false);
    void list;
  }

  async function handleUpdateFlag(field: string, value: boolean) {
    if (!selectedId) return;
    await window.rawpilot.sessions.updateFlag({ id: selectedId, field, value });
    await loadSessions();
  }

  async function handleOpenFolder(sub?: string) {
    if (!selectedId) return;
    try {
      await window.rawpilot.sessions.openFolder({ id: selectedId, sub });
    } catch (e: any) {
      setNotice(e?.message ?? "Impossible d'ouvrir ce dossier.");
    }
  }

  async function handleImportNef() {
    if (!selectedId) return;
    const result = await window.rawpilot.sessions.importNef({ id: selectedId });
    if (result.errors && result.errors.length > 0) {
      setNotice(`${result.converted}/${result.imported} converties. ${result.errors.length} avertissement(s).`);
    } else if (result.imported > 0) {
      setNotice(`${result.imported} photo(s) importée(s) et converties.`);
    }
    await loadSessions();
  }

  async function handleRefreshCounts() {
    if (!selectedId) return;
    await window.rawpilot.sessions.refreshCounts({ id: selectedId });
    await loadSessions();
  }

  if (loading) {
    return <div className="h-screen w-screen bg-base-bg" />;
  }

  if (!config?.rootPath) {
    return (
      <div className="h-screen w-screen bg-base-bg text-ink">
        <WelcomeSetup onChoose={handleChooseRoot} />
      </div>
    );
  }

  const selected = sessions.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="h-screen w-screen bg-base-bg text-ink flex overflow-hidden">
      <Sidebar
        sessions={sessions}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewSession={() => setShowModal(true)}
        search={search}
        onSearchChange={handleSearchChange}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {notice && (
          <div className="absolute top-4 right-4 z-40 bg-base-surface2 border border-base-border rounded-lg px-4 py-2 text-sm shadow-lg max-w-sm">
            {notice}
          </div>
        )}

        {selected ? (
          <SessionDetail
            session={selected}
            onUpdateFlag={handleUpdateFlag}
            onOpenFolder={handleOpenFolder}
            onImportNef={handleImportNef}
            onRefreshCounts={handleRefreshCounts}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <p className="text-ink-dim text-sm mb-4">Sélectionne une session à gauche, ou crée ton premier shooting.</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-accent hover:bg-accent-dim transition-colors text-white text-sm font-medium rounded-xl px-4 py-2"
              >
                + Nouveau shooting
              </button>
            </div>
          </div>
        )}
      </main>

      {showModal && <NewSessionModal onClose={() => setShowModal(false)} onCreate={handleCreateSession} />}
    </div>
  );
}
