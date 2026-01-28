import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Page } from '@/types/page';

interface NoteDB extends DBSchema {
  pages: {
    key: string;
    value: Page;
    indexes: { 'by-updated': number };
  };
  assets: {
    key: string;
    value: { id: string; data: Blob; type: string };
  };
}

let db: IDBPDatabase<NoteDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<NoteDB>> {
  if (db) return db;

  db = await openDB<NoteDB>('note-app', 1, {
    upgrade(db) {
      const pageStore = db.createObjectStore('pages', {
        keyPath: 'id',
      });
      pageStore.createIndex('by-updated', 'updatedAt');

      db.createObjectStore('assets', {
        keyPath: 'id',
      });
    },
  });

  return db;
}

export async function savePage(page: Page): Promise<void> {
  const database = await initDB();
  await database.put('pages', page);
}

export async function getPage(id: string): Promise<Page | undefined> {
  const database = await initDB();
  return database.get('pages', id);
}

export async function getAllPages(): Promise<Page[]> {
  const database = await initDB();
  return database.getAll('pages');
}

export async function deletePage(id: string): Promise<void> {
  const database = await initDB();
  await database.delete('pages', id);
}

export async function saveAsset(
  id: string,
  data: Blob,
  type: string
): Promise<void> {
  const database = await initDB();
  await database.put('assets', { id, data, type });
}

export async function getAsset(id: string): Promise<Blob | undefined> {
  const database = await initDB();
  const asset = await database.get('assets', id);
  return asset?.data;
}

