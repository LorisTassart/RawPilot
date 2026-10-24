const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rawpilot', {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    selectRootFolder: () => ipcRenderer.invoke('config:selectRootFolder'),
    resetToWelcome: () => ipcRenderer.invoke('config:resetToWelcome'),
    rawCatalog: () => ipcRenderer.invoke('config:rawCatalog'),
    updateRawSettings: (payload) => ipcRenderer.invoke('config:updateRawSettings', payload),
    updateChecklistSteps: (payload) => ipcRenderer.invoke('config:updateChecklistSteps', payload),
  },
  sessions: {
    list: () => ipcRenderer.invoke('sessions:list'),
    nextNumber: () => ipcRenderer.invoke('sessions:nextNumber'),
    create: (payload) => ipcRenderer.invoke('sessions:create', payload),
    updateChecklist: (payload) => ipcRenderer.invoke('sessions:updateChecklist', payload),
    updateInfo: (payload) => ipcRenderer.invoke('sessions:updateInfo', payload),
    openFolder: (payload) => ipcRenderer.invoke('sessions:openFolder', payload),
    refreshCounts: (payload) => ipcRenderer.invoke('sessions:refreshCounts', payload),
    importPhotos: (payload) => ipcRenderer.invoke('sessions:importPhotos', payload),
    search: (payload) => ipcRenderer.invoke('sessions:search', payload),
    scanExisting: () => ipcRenderer.invoke('sessions:scanExisting'),
    importManual: (payload) => ipcRenderer.invoke('sessions:importManual', payload),
    remove: (payload) => ipcRenderer.invoke('sessions:remove', payload),
    checkMissing: () => ipcRenderer.invoke('sessions:checkMissing'),
    relocate: (payload) => ipcRenderer.invoke('sessions:relocate', payload),
    onImportProgress: (callback) => {
      const listener = (_evt, data) => callback(data);
      ipcRenderer.on('sessions:importProgress', listener);
      return () => ipcRenderer.removeListener('sessions:importProgress', listener);
    },
  },
  app: {
    isDev: () => ipcRenderer.invoke('app:isDev'),
    exportProfile: () => ipcRenderer.invoke('app:exportProfile'),
    importProfile: () => ipcRenderer.invoke('app:importProfile'),
    resetAll: () => ipcRenderer.invoke('app:resetAll'),
  },
});
