import fs from 'fs';
import path from 'path';

export interface SyncState {
  needsSync: boolean;
  lastSyncedAt: string | null;
  lastChangeAt: string | null;
  recordCount?: {
    warga: number;
    kk: number;
  };
}

const syncStateFilePath = path.join(process.cwd(), 'data', 'sync-state.json');

export function getSyncState(): SyncState {
  try {
    if (fs.existsSync(syncStateFilePath)) {
      const data = fs.readFileSync(syncStateFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading sync state:', e);
  }
  return {
    needsSync: false,
    lastSyncedAt: new Date().toISOString(),
    lastChangeAt: null,
  };
}

export function markNeedsSync(): void {
  try {
    const dir = path.dirname(syncStateFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = getSyncState();
    const updated: SyncState = {
      ...current,
      needsSync: true,
      lastChangeAt: new Date().toISOString(),
    };
    fs.writeFileSync(syncStateFilePath, JSON.stringify(updated, null, 2), 'utf8');
  } catch (e) {
    console.error('Error updating sync state:', e);
  }
}

export function markSynced(recordCount?: { warga: number; kk: number }): void {
  try {
    const dir = path.dirname(syncStateFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const updated: SyncState = {
      needsSync: false,
      lastSyncedAt: new Date().toISOString(),
      lastChangeAt: new Date().toISOString(),
      recordCount,
    };
    fs.writeFileSync(syncStateFilePath, JSON.stringify(updated, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing sync state:', e);
  }
}
