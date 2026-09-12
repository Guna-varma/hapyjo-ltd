/**
 * Offline queue for trip and expense inserts.
 * Web port of the mobile offlineQueue: identical public API and item shapes,
 * persisted to localStorage instead of the app document directory.
 * Flushed when refetch runs (network available), same as on mobile.
 */

const QUEUE_STORAGE_KEY = 'hapyjo_offline_queue';

export type QueuedExpense = { type: 'expense'; payload: Record<string, unknown> };
export type QueuedTrip = { type: 'trip'; payload: Record<string, unknown> };
export type QueuedItem = QueuedExpense | QueuedTrip;

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
        ((x as QueuedItem).type === 'expense' || (x as QueuedItem).type === 'trip')
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
