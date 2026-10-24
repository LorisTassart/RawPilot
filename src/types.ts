export type SessionStatus = 'todo' | 'progress' | 'done';

export interface ChecklistStep {
  id: string;
  label: string;
}

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
  createdAt: string;
  status: SessionStatus;
}

export interface Config {
  rootPath: string | null;
  rawEnabled: boolean;
  rawFormats: string[];
  autoConvert: boolean;
  checklistSteps: ChecklistStep[];
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
        create: (payload: { date: string; sessionNumber: number; hasMontage: boolean }) => Promise<Session>;
        updateChecklist: (payload: { id: string; stepId: string; value: boolean }) => Promise<Session>;
        updateInfo: (payload: {
          id: string;
          date: string;
          sessionNumber: number;
          hasMontage: boolean;
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
      };
      app: {
        isDev: () => Promise<boolean>;
        exportProfile: () => Promise<string | null>;
        importProfile: () => Promise<Config | null>;
        resetAll: () => Promise<Config>;
      };
    };
  }
}
