import type { UmamiRequest } from './umami';

export const QUEUE_LIMIT = 1000;
export const QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export type QueueEntry = { id?: number; queuedAt: number; request: UmamiRequest };

export interface EventQueue {
  add(request: UmamiRequest): Promise<void>;
  first(): Promise<QueueEntry | undefined>;
  remove(id: number): Promise<void>;
}

// Separate database per destination: changing Website ID cannot send old data to a new site.
export class IndexedEventQueue implements EventQueue {
  private database: Promise<IDBDatabase> | undefined;
  private memory: QueueEntry[] = [];
  private memoryId = 0;
  private memoryOnly = false;

  constructor(private readonly databaseName: string) {}

  private open() {
    this.database ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);
      let abandoned = false;
      const timer = setTimeout(() => {
        abandoned = true;
        reject(new Error('Analytics storage timeout'));
      }, 2000);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      };
      request.onsuccess = () => {
        clearTimeout(timer);
        const db = request.result;
        if (abandoned) {
          db.close();
          return;
        }
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => {
        clearTimeout(timer);
        reject(request.error);
      };
      request.onblocked = () => {
        abandoned = true;
        clearTimeout(timer);
        reject(new Error('Analytics storage blocked'));
      };
    });
    return this.database;
  }

  private async access<T>(
    action: (store: IDBObjectStore, done: (value: T) => void) => void,
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('events', 'readwrite');
      let result: T;
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
      action(transaction.objectStore('events'), (value) => {
        result = value;
      });
    });
  }

  private pruneMemory() {
    this.memory = this.memory
      .filter((entry) => entry.queuedAt > Date.now() - QUEUE_TTL_MS)
      .slice(-QUEUE_LIMIT);
  }

  async add(request: UmamiRequest) {
    const entry: QueueEntry = { queuedAt: Date.now(), request };
    if (!this.memoryOnly) {
      try {
        await this.access<void>((store, done) => {
          const read = store.getAll();
          read.onsuccess = () => {
            const entries = read.result as QueueEntry[];
            const alive = entries.filter((item) => item.queuedAt > Date.now() - QUEUE_TTL_MS);
            const keep = new Set(alive.slice(-(QUEUE_LIMIT - 1)).map((item) => item.id));
            for (const item of entries) if (!keep.has(item.id)) store.delete(item.id!);
            store.add(entry);
            done();
          };
        });
        return;
      } catch {
        this.memoryOnly = true;
      }
    }
    this.memory.push({ ...entry, id: ++this.memoryId });
    this.pruneMemory();
  }

  async first(): Promise<QueueEntry | undefined> {
    if (!this.memoryOnly) {
      try {
        return await this.access<QueueEntry | undefined>((store, done) => {
          const read = store.getAll();
          read.onsuccess = () => {
            const entries = read.result as QueueEntry[];
            for (const entry of entries) {
              if (entry.queuedAt <= Date.now() - QUEUE_TTL_MS) store.delete(entry.id!);
            }
            done(entries.find((entry) => entry.queuedAt > Date.now() - QUEUE_TTL_MS));
          };
        });
      } catch {
        this.memoryOnly = true;
      }
    }
    this.pruneMemory();
    return this.memory[0];
  }

  async remove(id: number) {
    if (!this.memoryOnly) {
      // Keep failed deletions as failures: the sender must stop before retrying this entry.
      await this.access<void>((store, done) => {
        store.delete(id);
        done();
      });
    } else {
      this.memory = this.memory.filter((entry) => entry.id !== id);
    }
  }
}
