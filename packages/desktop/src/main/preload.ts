import { contextBridge, ipcRenderer } from 'electron';
import { IPCEvent, IPCResponse } from '@gitswitch/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (event: IPCEvent): Promise<IPCResponse> => ipcRenderer.invoke('api', event),
  
  // Event listeners for OAuth callbacks
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = ['oauth-success', 'oauth-result'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
  
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = ['oauth-success', 'oauth-result'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
  
  // Platform information
  platform: process.platform,
  
  // App version (could be useful for UI)
  version: process.env.npm_package_version || '1.0.0'
});