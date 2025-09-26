"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    invoke: (event) => electron_1.ipcRenderer.invoke('api', event),
    // Event listeners for OAuth callbacks
    on: (channel, callback) => {
        const validChannels = ['oauth-success', 'oauth-result'];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, callback);
        }
    },
    removeListener: (channel, callback) => {
        const validChannels = ['oauth-success', 'oauth-result'];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.removeListener(channel, callback);
        }
    },
    // Platform information
    platform: process.platform,
    // App version (could be useful for UI)
    version: process.env.npm_package_version || '1.0.0'
});
