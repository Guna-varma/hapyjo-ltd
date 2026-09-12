/**
 * Offline queue persistence.
 *
 * The mobile app queued trip and expense inserts to a file when a write could not
 * reach Supabase, flushing them on the next refetch. The web port keeps the same
 * API and item shapes, backed by localStorage — these tests pin that contract,
 * including the guarded behaviour when storage is unavailable.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadOfflineQueue,
  saveOfflineQueue,
  appendToOfflineQueue,
  removeFromOfflineQueueAtIndex,
  type QueuedItem,
} from '../offlineQueue';

const KEY = 'hapyjo_offline_queue';

const expenseItem: QueuedItem = {
  type: 'expense',
  payload: { site_id: 'site_a', amount_rwf: 5000, description: 'Fuel' },
};
const tripItem: QueuedItem = {
  type: 'trip',
  payload: { vehicle_id: 'veh_1', driver_id: 'drv_1', site_id: 'site_a' },
};

describe('offlineQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts empty', async () => {
    expect(await loadOfflineQueue()).toEqual([]);
  });

  it('round-trips queued items', async () => {
    await saveOfflineQueue([expenseItem, tripItem]);
    expect(await loadOfflineQueue()).toEqual([expenseItem, tripItem]);
  });

  it('appends preserving order', async () => {
    await appendToOfflineQueue(expenseItem);
    await appendToOfflineQueue(tripItem);
    const queue = await loadOfflineQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('expense');
    expect(queue[1].type).toBe('trip');
  });

  it('removes by index', async () => {
    await saveOfflineQueue([expenseItem, tripItem]);
    await removeFromOfflineQueueAtIndex(0);
    const queue = await loadOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('trip');
  });

  it('ignores out-of-range removals rather than corrupting the queue', async () => {
    await saveOfflineQueue([expenseItem]);
    await removeFromOfflineQueueAtIndex(-1);
    await removeFromOfflineQueueAtIndex(5);
    expect(await loadOfflineQueue()).toHaveLength(1);
  });

  it('drops entries that are not valid queue items', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([expenseItem, { type: 'bogus', payload: {} }, null, 42, { payload: {} }]),
    );
    const queue = await loadOfflineQueue();
    expect(queue).toEqual([expenseItem]);
  });

  it('returns empty for malformed JSON instead of throwing', async () => {
    localStorage.setItem(KEY, '{not json');
    expect(await loadOfflineQueue()).toEqual([]);
  });

  it('returns empty when the stored value is not an array', async () => {
    localStorage.setItem(KEY, JSON.stringify({ type: 'expense' }));
    expect(await loadOfflineQueue()).toEqual([]);
  });

  it('survives storage being blocked on read', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage is disabled');
    });
    await expect(loadOfflineQueue()).resolves.toEqual([]);
  });

  it('survives storage being blocked on write', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    await expect(saveOfflineQueue([expenseItem])).resolves.toBeUndefined();
  });

  it('preserves payload contents verbatim, so DB writes replay unchanged', async () => {
    const payload = { site_id: 's1', amount_rwf: 12345, litres: 40.5, note: 'ünïcode ✓' };
    await appendToOfflineQueue({ type: 'expense', payload });
    const [item] = await loadOfflineQueue();
    expect(item.payload).toEqual(payload);
  });
});
