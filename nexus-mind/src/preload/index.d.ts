import type { NexusBridge } from '../shared/ipc';

declare global {
  interface Window {
    /** Typed bridge to the main process; see src/preload/index.ts. */
    nexus?: NexusBridge;
  }
}

export {};
