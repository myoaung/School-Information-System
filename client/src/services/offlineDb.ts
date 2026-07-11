import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'schoolhub-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Cached API responses
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
      // Offline mutation queue
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

// ─── Cache Operations ──────────────────────────────────────────

interface CacheEntry {
  key: string;
  data: unknown;
  timestamp: number;
  ttl: number; // time to live in ms
}

export async function cacheGet(key: string): Promise<unknown | null> {
  const db = await getDB();
  const entry = await db.get('cache', key) as CacheEntry | undefined;
  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    await db.delete('cache', key);
    return null;
  }

  return entry.data;
}

export async function cacheSet(key: string, data: unknown, ttlMs: number = 5 * 60 * 1000): Promise<void> {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

export async function cacheDelete(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('cache', key);
}

export async function cacheClear(): Promise<void> {
  const db = await getDB();
  await db.clear('cache');
}

// ─── Sync Queue Operations ─────────────────────────────────────

export interface SyncRequest {
  id?: number;
  url: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
  timestamp: number;
}

export async function queueSync(request: Omit<SyncRequest, 'timestamp'>): Promise<void> {
  const db = await getDB();
  await db.add('syncQueue', {
    ...request,
    timestamp: Date.now(),
  });
}

export async function getSyncQueue(): Promise<SyncRequest[]> {
  const db = await getDB();
  return await db.getAll('syncQueue') as SyncRequest[];
}

export async function removeSyncItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('syncQueue');
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB();
  return await db.count('syncQueue');
}

// ─── Process Sync Queue ────────────────────────────────────────

export async function processSyncQueue(
  fetchFn: (url: string, options: RequestInit) => Promise<Response>
): Promise<{ success: number; failed: number }> {
  const queue = await getSyncQueue();
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetchFn(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.method !== 'GET' && item.body ? JSON.stringify(item.body) : undefined,
      });

      if (response.ok) {
        await removeSyncItem(item.id!);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { success, failed };
}
