import React from 'react';
import { pwaLifecycleManager } from '@/utils/pwaLifecycleManager';

export const PWAStatus: React.FC = () => {
  const [status, setStatus] = React.useState(pwaLifecycleManager.getPWAStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(pwaLifecycleManager.getPWAStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV || !status.isPWA) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
      <div className="text-green-400 font-bold mb-1">PWA Debug</div>
      <div>Mode: {status.isPWA ? 'PWA' : 'Browser'}</div>
      <div>Listeners: {status.listenerCount}</div>
      <div>Frozen: {status.isFrozen ? 'Yes' : 'No'}</div>
      <div>Visibility: {document.visibilityState}</div>
    </div>
  );
};