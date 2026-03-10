import { useEffect } from 'react';
import { useUIStore } from '@stores/uiStore';

export function useOnlineStatus(): boolean {
  const isOnline = useUIStore(s => s.isOnline);
  const setOnline = useUIStore(s => s.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return isOnline;
}
