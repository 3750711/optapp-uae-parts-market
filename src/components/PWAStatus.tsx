import React from 'react';
import { pwaLifecycleManager } from '@/utils/pwaLifecycleManager';
import { logBfcacheStatus } from '@/utils/bfcacheUtils';

export const PWAStatus: React.FC = () => {
  const [status, setStatus] = React.useState(pwaLifecycleManager.getPWAStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(pwaLifecycleManager.getPWAStatus());
    }, 1000);

    // Log bfcache status on mount for debugging
    logBfcacheStatus();

    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV || !status.isPWA) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg font-mono z-50 min-w-[200px]">
      <div className="text-green-400 font-bold mb-2 border-b border-gray-600 pb-1">PWA Debug</div>
      <div className="space-y-1">
        <div>Mode: <span className={status.isPWA ? 'text-green-400' : 'text-yellow-400'}>{status.isPWA ? 'PWA' : 'Browser'}</span></div>
        <div>Listeners: <span className="text-blue-400">{status.listenerCount}</span></div>
        <div>Frozen: <span className={status.isFrozen ? 'text-red-400' : 'text-green-400'}>{status.isFrozen ? 'Yes' : 'No'}</span></div>
        <div>Fast Switch: <span className={status.isFastSwitching ? 'text-orange-400' : 'text-green-400'}>{status.isFastSwitching ? 'Yes' : 'No'}</span></div>
        <div>Rapid Count: <span className="text-purple-400">{status.rapidChangeCount || 0}</span></div>
        <div>Visibility: <span className={document.visibilityState === 'visible' ? 'text-green-400' : 'text-red-400'}>{document.visibilityState}</span></div>
        <div>SW: <span className={navigator.serviceWorker?.controller ? 'text-green-400' : 'text-red-400'}>{navigator.serviceWorker?.controller ? 'Active' : 'None'}</span></div>
      </div>
    </div>
  );
};