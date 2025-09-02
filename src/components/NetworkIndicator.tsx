import { useEffect, useState } from 'react';
import { AlertTriangle, Wifi } from 'lucide-react';
import { getNetworkInfo, isSlowConnection } from '@/utils/networkUtils';

export const NetworkIndicator = () => {
  const [networkInfo, setNetworkInfo] = useState(getNetworkInfo());
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const updateNetworkInfo = () => {
      const info = getNetworkInfo();
      setNetworkInfo(info);
      setShowIndicator(isSlowConnection());
    };

    // Initial check
    updateNetworkInfo();

    // Listen for connection changes
    const connection = (navigator as any)?.connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed top-4 right-4 bg-orange-100 dark:bg-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200 z-50">
      <AlertTriangle className="w-4 h-4" />
      <span>
        Медленное соединение ({networkInfo.effectiveType}) - 
        упрощенный режим активен
      </span>
    </div>
  );
};