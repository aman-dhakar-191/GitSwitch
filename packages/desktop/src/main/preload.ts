import { contextBridge, ipcRenderer } from 'electron';
import { IPCEvent, IPCResponse } from '@gitswitch/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (event: IPCEvent): Promise<IPCResponse> => ipcRenderer.invoke('api', event),
  
  // Platform information
  platform: process.platform,
  
  // App version (could be useful for UI)
  version: process.env.npm_package_version || '1.0.0'
});