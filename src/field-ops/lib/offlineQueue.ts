/**
 * Offline queue for inserts made without a connection.
 * Web port of the mobile offlineQueue: identical public API and item shapes,
 * persisted to localStorage instead of the app document directory.
 * Flushed when refetch runs (network available), same as on mobile.
 *
 * Besides the mobile app's expenses and trips, the web app also queues surveys
 * and issues without photos — both are plain rows. Anything carrying a photo
 * cannot be queued (the file would not survive a reload), so those flows keep
 * the form open and ask the user to retry once online.
 */

const QUEUE_STORAGE_KEY = 'hapyjo_offline_queue';

export type QueuedExpense = { type: 'expense'; payload: Record<string, unknown> };
export type QueuedTrip = { type: 'trip'; payload: Record<string, unknown> };
export type QueuedSurvey = { type: 'survey'; payload: Record<string, unknown>; siteName?: string };
export type QueuedIssue = { type: 'issue'; payload: Record<string, unknown>; siteName?: string };
export type QueuedItem = QueuedExpense | QueuedTrip | QueuedSurvey | QueuedIssue;

const QUEUED_TYPES: ReadonlySet<string> = new Set(['expense', 'trip', 'survey', 'issue']);

/** localStorage throws in private-mode / blocked-storage contexts; treat as "no queue". */
function readRaw(): string | null {
  try {
    return localStorage.getItem(QUEUE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function loadOfflineQueue(): Promise<QueuedItem[]> {
  try {
    const raw = readRaw();
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is QueuedItem =>
        x != null &&
        typeof x === 'object' &&
        'type' in x &&
        'payload' in x &&
        QUEUED_TYPES.has((x as QueuedItem).type)
    );
  } catch {
    return [];
  }
}

export async function saveOfflineQueue(items: QueuedItem[]): Promise<void> {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore (quota exceeded or storage blocked)
  }
}

export async function appendToOfflineQueue(item: QueuedItem): Promise<void> {
  const items = await loadOfflineQueue();
  items.push(item);
  await saveOfflineQueue(items);
}

export async function removeFromOfflineQueueAtIndex(index: number): Promise<void> {
  const items = await loadOfflineQueue();
  if (index < 0 || index >= items.length) return;
  items.splice(index, 1);
  await saveOfflineQueue(items);
}
