import { useEffect, useState } from 'react';
export type OfflineStatus = 'preparing' | 'ready' | 'unavailable';
export function usePwa() {
  const [status, setStatus] = useState<OfflineStatus>('preparing');
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
      setStatus('unavailable');
      return;
    }
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const check = () => {
      if (disposed || !registration) return;
      if (registration.active?.state === 'activated') setStatus('ready');
      if (registration.waiting && navigator.serviceWorker.controller)
        setWaiting(registration.waiting);
    };
    const observe = () => {
      const worker = registration?.installing;
      worker?.addEventListener('statechange', () => {
        check();
        if (worker.state === 'redundant' && !registration?.active && !disposed)
          setStatus('unavailable');
      });
    };
    setStatus('preparing');
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        if (disposed) return;
        registration = reg;
        check();
        observe();
        reg.addEventListener('updatefound', observe);
        void navigator.serviceWorker.ready.then(() => check());
      })
      .catch(() => {
        if (!disposed) setStatus('unavailable');
      });
    navigator.serviceWorker.addEventListener('controllerchange', check);
    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', observe);
      navigator.serviceWorker.removeEventListener('controllerchange', check);
    };
  }, [attempt]);
  function update() {
    if (!waiting) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
      once: true,
    });
    waiting.postMessage('ACTIVATE');
  }
  return { status, waiting, update, retry: () => setAttempt((n) => n + 1) };
}
