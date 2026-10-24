const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rawpilot', {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    selectRootFolder: () => ipcRenderer.invoke('config:selectRootFolder'),
  },
  sessions: {
    list: () => ipcRenderer.invoke('sessions:list'),
    nextNumber: () => ipcRenderer.invoke('sessions:nextNumber'),
    create: (payload) => ipcRenderer.invoke('sessions:create', payload),
    updateFlag: (payload) => ipcRenderer.invoke('sessions:updateFlag', payload),
    openFolder: (payload) => ipcRenderer.invoke('sessions:openFolder', payload),
    refreshCounts: (payload) => ipcRenderer.invoke('sessions:refreshCounts', payload),
    importNef: (payload) => ipcRenderer.invoke('sessions:importNef', payload),
    search: (payload) => ipcRenderer.invoke('sessions:search', payload),
    scanExisting: () => ipcRenderer.invoke('sessions:scanExisting'),
    onImportProgress: (callback) => {
      const listener = (_evt, data) => callback(data);
      ipcRenderer.on('sessions:importProgress', listener);
      return () => ipcRenderer.removeListener('sessions:importProgress', listener);
    },
  },
});
