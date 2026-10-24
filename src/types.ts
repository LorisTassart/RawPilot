export type SessionStatus = 'todo' | 'progress' | 'done';

export interface ChecklistStep {
  id: string;
  label: string;
}

export type SessionCategory = 'client' | 'event';

export interface Session {
  id: string;
  year: number;
  month: number;
  monthName: string;
  sessionNumber: number;
  date: string; // YYYY-MM-DD
  folderName: string;
  folderPath: string;
  hasMontage: boolean;
  nefCount: number;
  jpegCount: number;
  retouchedCount: number;
  checklist: Record<string, boolean>;
  category: SessionCategory | null;
  clientName: string;
  location: string;
  notes: string;
  completedAt: string | null;
  createdAt: string;
  status: SessionStatus;
}

export type ThemePref = 'dark' | 'light' | 'system';

export interface DiskInfo {
  freeBytes: number;
  totalBytes: number;
}

export interface Config {
  rootPath: string | null;
  rawEnabled: boolean;
  rawFormats: string[];
  autoConvert: boolean;
  checklistSteps: ChecklistStep[];
  diskAlertGb: number;
  theme: ThemePref;
  isDev: boolean;
}

export interface RawFormatOption {
  id: string;
  label: string;
}

export interface ImportResult {
  imported: number;
  converted: number;
  errors: string[];
  session: Session;
}

export interface DocumentFile {
  fileName: string;
  size: number;
  modifiedAt: string;
}

export interface UnmatchedFolder {
  folderPath: string;
  folderName: string;
}

declare global {
  interface Window {
    rawpilot: {
      config: {
        get: () => Promise<Config>;
        selectRootFolder: () => Promise<Config | null>;
        resetToWelcome: () => Promise<Config>;
        rawCatalog: () => Promise<RawFormatOption[]>;
        updateDiskSettings: (payload: { diskAlertGb: number }) => Promise<Config>;
        updateTheme: (payload: { theme: ThemePref }) => Promise<Config>;
        updateRawSettings: (payload: {
          rawEnabled: boolean;
          rawFormats: string[];
          autoConvert: boolean;
        }) => Promise<Config>;
        updateChecklistSteps: (payload: { steps: ChecklistStep[] }) => Promise<Config>;
      };
      sessions: {
        list: () => Promise<Session[]>;
        nextNumber: () => Promise<number>;
        create: (payload: {
          date: string;
          sessionNumber: number;
          hasMontage: boolean;
          category: SessionCategory | null;
          clientName: string;
          location: string;
          notes: string;
        }) => Promise<Session>;
        updateChecklist: (payload: { id: string; stepId: string; value: boolean }) => Promise<Session>;
        updateInfo: (payload: {
          id: string;
          date: string;
          sessionNumber: number;
          hasMontage: boolean;
          category: SessionCategory | null;
          clientName: string;
          location: string;
          notes: string;
        }) => Promise<Session>;
        openFolder: (payload: { id: string; sub?: string }) => Promise<boolean>;
        refreshCounts: (payload: { id: string }) => Promise<Session>;
        importPhotos: (payload: { id: string }) => Promise<ImportResult>;
        search: (payload: { query: string }) => Promise<Session[]>;
        scanExisting: () => Promise<{ added: number; unmatched: UnmatchedFolder[] }>;
        importManual: (payload: {
          folderPath: string;
          folderName: string;
          date: string;
          sessionNumber: number;
        }) => Promise<Session>;
        remove: (payload: { id: string }) => Promise<boolean>;
        checkMissing: () => Promise<Session[]>;
        relocate: (payload: { id: string }) => Promise<Session | null>;
        onImportProgress: (callback: (data: { id: string; done: number; total: number }) => void) => () => void;
        getPoster: (payload: { id: string }) => Promise<string | null>;
        setPoster: (payload: { id: string }) => Promise<string | null>;
        removePoster: (payload: { id: string }) => Promise<boolean>;
        getMissing: (payload: { id: string }) => Promise<{ rawCount: number; missingJpeg: string[] }>;
        getThumbnails: (payload: {
          id: string;
          folder: 'jpeg' | 'retouche';
          offset: number;
          limit: number;
        }) => Promise<{ total: number; items: { name: string; dataUrl: string | null }[] }>;
        openPhoto: (payload: { id: string; folder: 'jpeg' | 'retouche'; name: string }) => Promise<boolean>;
      };
      disk: {
        getInfo: () => Promise<DiskInfo | null>;
      };
      app: {
        isDev: () => Promise<boolean>;
        applyTheme: (payload: { resolved: 'dark' | 'light' }) => Promise<boolean>;
        exportProfile: () => Promise<string | null>;
        importProfile: () => Promise<Config | null>;
        resetAll: () => Promise<Config>;
      };
      documents: {
        list: (payload: { scope: 'global' | 'session'; sessionId?: string }) => Promise<DocumentFile[]>;
        add: (payload: { scope: 'global' | 'session'; sessionId?: string }) => Promise<DocumentFile[]>;
        open: (payload: { scope: 'global' | 'session'; sessionId?: string; fileName: string }) => Promise<boolean>;
        reveal: (payload: { scope: 'global' | 'session'; sessionId?: string; fileName: string }) => Promise<boolean>;
        remove: (payload: { scope: 'global' | 'session'; sessionId?: string; fileName: string }) => Promise<DocumentFile[]>;
        rename: (payload: {
          scope: 'global' | 'session';
          sessionId?: string;
          fileName: string;
          newName: string;
        }) => Promise<DocumentFile[]>;
      };
    };
  }
}
