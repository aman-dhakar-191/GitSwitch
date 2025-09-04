"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    invoke: (event) => electron_1.ipcRenderer.invoke('api', event),
    // Platform information
    platform: process.platform,
    // App version (could be useful for UI)
    version: process.env.npm_package_version || '1.0.0'
});
