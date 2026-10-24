export type SessionStatus = 'todo' | 'progress' | 'done';

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
  statusPhone: boolean;
  statusRetouched: boolean;
  statusDone: boolean;
  createdAt: string;
  status: SessionStatus;
}

export interface Config {
  rootPath: string | null;
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
      };
      sessions: {
        list: () => Promise<Session[]>;
        nextNumber: () => Promise<number>;
        create: (payload: { date: string; sessionNumber: number; hasMontage: boolean }) => Promise<Session>;
        updateFlag: (payload: { id: string; field: string; value: boolean }) => Promise<Session>;
        openFolder: (payload: { id: string; sub?: string }) => Promise<boolean>;
        refreshCounts: (payload: { id: string }) => Promise<Session>;
        importNef: (payload: { id: string }) => Promise<ImportResult>;
        search: (payload: { query: string }) => Promise<Session[]>;
        scanExisting: () => Promise<{ added: number; unmatched: UnmatchedFolder[] }>;
        importManual: (payload: {
          folderPath: string;
          folderName: string;
          date: string;
          sessionNumber: number;
        }) => Promise<Session>;
        onImportProgress: (callback: (data: { id: string; done: number; total: number }) => void) => () => void;
      };
    };
  }
}
