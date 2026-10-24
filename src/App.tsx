import { useEffect, useState } from 'react';
import { Config, Session, UnmatchedFolder } from './types';
import WelcomeSetup from './components/WelcomeSetup';
import Sidebar from './components/Sidebar';
import SessionDetail from './components/SessionDetail';
import NewSessionModal from './components/NewSessionModal';
import UnmatchedFoldersModal from './components/UnmatchedFoldersModal';
import SettingsModal from './components/SettingsModal';
import MissingFoldersModal from './components/MissingFoldersModal';

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unmatched, setUnmatched] = useState<UnmatchedFolder[]>([]);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [missing, setMissing] = useState<Session[]>([]);
  const [showMissing, setShowMissing] = useState(false);

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
      const { added, unmatched: um } = await window.rawpilot.sessions.scanExisting();
      await loadSessions();
      setUnmatched(um);
      if (added > 0) {
        setNotice(`${added} session(s) existante(s) retrouvée(s) et ajoutée(s) au suivi.`);
      }
      if (um.length > 0) {
        setShowUnmatched(true);
      }
    }
  }

  async function handleRescan() {
    const { added, unmatched: um } = await window.rawpilot.sessions.scanExisting();
    await loadSessions();
    setUnmatched(um);
    setNotice(added > 0 ? `${added} nouvelle(s) session(s) trouvée(s).` : 'Aucune nouvelle session trouvée.');
    if (um.length > 0) setShowUnmatched(true);
  }

  async function handleFolderImported(folderPath: string) {
    setUnmatched((prev) => prev.filter((f) => f.folderPath !== folderPath));
    await loadSessions();
  }

  async function handleResetWelcome() {
    const c = await window.rawpilot.config.resetToWelcome();
    setConfig(c);
    setShowSettings(false);
    setSelectedId(null);
  }

  async function handleCheckMissing() {
    setShowSettings(false);
    const list = await window.rawpilot.sessions.checkMissing();
    setMissing(list);
    setShowMissing(true);
  }

  function handleMissingRelocated(id: string) {
    setMissing((prev) => prev.filter((s) => s.id !== id));
    void loadSessions();
  }

  function handleMissingRemoved(id: string) {
    setMissing((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    void loadSessions();
  }

  async function handleRemoveSession() {
    if (!selectedId) return;
    await window.rawpilot.sessions.remove({ id: selectedId });
    setSelectedId(null);
    await loadSessions();
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
        onRescan={handleRescan}
        unmatchedCount={unmatched.length}
        onShowUnmatched={() => setShowUnmatched(true)}
        onOpenSettings={() => setShowSettings(true)}
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
            onRemove={handleRemoveSession}
            onInfoUpdated={() => loadSessions()}
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
      {showUnmatched && (
        <UnmatchedFoldersModal
          folders={unmatched}
          onClose={() => setShowUnmatched(false)}
          onImported={handleFolderImported}
        />
      )}
      {showSettings && (
        <SettingsModal
          rootPath={config?.rootPath ?? ''}
          onClose={() => setShowSettings(false)}
          onChangeRoot={() => {
            setShowSettings(false);
            handleChooseRoot();
          }}
          onResetWelcome={handleResetWelcome}
          onCheckMissing={handleCheckMissing}
        />
      )}
      {showMissing && (
        <MissingFoldersModal
          sessions={missing}
          onClose={() => setShowMissing(false)}
          onRelocated={handleMissingRelocated}
          onRemoved={handleMissingRemoved}
        />
      )}
    </div>
  );
}
