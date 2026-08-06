// Utility for Offline Resilience & Queue Synchronization (Local Storage + Auto-Sync)

const PASS_CACHE_KEY = 'hostel_approved_passes_cache';
const CHECKIN_QUEUE_KEY = 'hostel_offline_checkin_queue';

/**
 * Cache approved pass details in localStorage
 */
export const cacheApprovedPass = (passData) => {
  try {
    const existing = getCachedApprovedPasses();
    const code = passData.request?.pass_code || passData.pass_code;
    if (!code) return;
    
    const updated = [passData, ...existing.filter(p => (p.request?.pass_code || p.pass_code) !== code)].slice(0, 100);
    localStorage.setItem(PASS_CACHE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to cache pass:', err);
  }
};

/**
 * Get all cached approved passes
 */
export const getCachedApprovedPasses = () => {
  try {
    const data = localStorage.getItem(PASS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

/**
 * Lookup a pass in local cache
 */
export const lookupCachedPass = (passCode) => {
  const clean = passCode.trim().toUpperCase();
  const cachedList = getCachedApprovedPasses();
  return cachedList.find(p => (p.request?.pass_code || p.pass_code) === clean) || null;
};

/**
 * Queue a check-in payload locally when offline
 */
export const queueOfflineCheckin = (checkinPayload) => {
  try {
    const queue = getOfflineCheckinQueue();
    const newItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      payload: checkinPayload
    };
    queue.push(newItem);
    localStorage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(queue));
    return newItem;
  } catch (err) {
    console.error('Failed to queue offline checkin:', err);
    return null;
  }
};

/**
 * Get all queued offline check-ins
 */
export const getOfflineCheckinQueue = () => {
  try {
    const data = localStorage.getItem(CHECKIN_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

/**
 * Clear or remove item from offline queue
 */
export const removeQueuedCheckin = (itemId) => {
  try {
    const queue = getOfflineCheckinQueue().filter(i => i.id !== itemId);
    localStorage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to remove queued checkin:', err);
  }
};

/**
 * Process and synchronize all queued offline check-ins with backend API client
 */
export const syncOfflineCheckinQueue = async (apiClient) => {
  const queue = getOfflineCheckinQueue();
  if (!queue.length) return { syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      await apiClient.post('/security/checkin', item.payload);
      removeQueuedCheckin(item.id);
      syncedCount++;
    } catch (err) {
      console.error('Error syncing checkin item:', item, err);
      // If conflict (409) or invalid (404/400), remove from queue to avoid block
      if (err.response?.status === 409 || err.response?.status === 400) {
        removeQueuedCheckin(item.id);
      }
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
};

/**
 * Setup online event listener to auto-sync when network is restored
 */
export const initAutoSyncOnOnline = (apiClient, onSyncComplete) => {
  const handleOnline = async () => {
    console.log('[OfflineSync] Network restored. Syncing queued check-ins...');
    const res = await syncOfflineCheckinQueue(apiClient);
    if (onSyncComplete && (res.syncedCount > 0 || res.failedCount > 0)) {
      onSyncComplete(res);
    }
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
};
