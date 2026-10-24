const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rawpilot', {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    selectRootFolder: () => ipcRenderer.invoke('config:selectRootFolder'),
    resetToWelcome: () => ipcRenderer.invoke('config:resetToWelcome'),
    updateDiskSettings: (payload) => ipcRenderer.invoke('config:updateDiskSettings', payload),
    updateTheme: (payload) => ipcRenderer.invoke('config:updateTheme', payload),
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
    getPoster: (payload) => ipcRenderer.invoke('sessions:getPoster', payload),
    setPoster: (payload) => ipcRenderer.invoke('sessions:setPoster', payload),
    removePoster: (payload) => ipcRenderer.invoke('sessions:removePoster', payload),
    getMissing: (payload) => ipcRenderer.invoke('sessions:getMissing', payload),
    getThumbnails: (payload) => ipcRenderer.invoke('sessions:getThumbnails', payload),
    openPhoto: (payload) => ipcRenderer.invoke('sessions:openPhoto', payload),
  },
  disk: {
    getInfo: () => ipcRenderer.invoke('disk:getInfo'),
  },
  app: {
    isDev: () => ipcRenderer.invoke('app:isDev'),
    applyTheme: (payload) => ipcRenderer.invoke('app:applyTheme', payload),
    exportProfile: () => ipcRenderer.invoke('app:exportProfile'),
    importProfile: () => ipcRenderer.invoke('app:importProfile'),
    resetAll: () => ipcRenderer.invoke('app:resetAll'),
  },
  documents: {
    list: (payload) => ipcRenderer.invoke('documents:list', payload),
    add: (payload) => ipcRenderer.invoke('documents:add', payload),
    open: (payload) => ipcRenderer.invoke('documents:open', payload),
    reveal: (payload) => ipcRenderer.invoke('documents:reveal', payload),
    remove: (payload) => ipcRenderer.invoke('documents:remove', payload),
    rename: (payload) => ipcRenderer.invoke('documents:rename', payload),
  },
});
