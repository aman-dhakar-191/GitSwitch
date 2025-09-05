import { IPCEvent, IPCResponse } from '@gitswitch/types';

declare global {
  interface Window {
    electronAPI: {
      invoke: (event: IPCEvent) => Promise<IPCResponse>;
      platform: string;
      version: string;
    };
  }
}

export {};