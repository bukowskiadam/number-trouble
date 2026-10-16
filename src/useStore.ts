import { useEffect, useState } from 'react';
import { parseStore, STORAGE_KEY, type Store } from './profiles';
import { APP_VERSION } from './releases';

export function useStore() {
  const [initial] = useState(() => {
    try {
      return { store: parseStore(localStorage.getItem(STORAGE_KEY)), failed: false };
    } catch {
      return { store: parseStore(null), failed: true };
    }
  });
  const [store, setStore] = useState<Store>(() => ({
    ...initial.store,
    lastLaunchedVersion: APP_VERSION,
  }));
  const [storageError, setStorageError] = useState(initial.failed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [store]);

  return { store, setStore, storageError, previousVersion: initial.store.lastLaunchedVersion };
}
