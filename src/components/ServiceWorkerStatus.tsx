import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { swManager } from '../utils/serviceWorkerManager';

export function ServiceWorkerStatus() {
  const [swStatus, setSWStatus] = useState<string>('checking');
  const [version, setVersion] = useState<string>('unknown');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check SW status
    const checkStatus = async () => {
      try {
        const registration = await swManager.getRegistration();
        if (registration) {
          setSWStatus(registration.active ? 'active' : 'installing');
          const ver = await swManager.getVersion();
          setVersion(ver);
          setUpdateAvailable(false);
        } else {
          setSWStatus('not-registered');
        }
      } catch (error) {
        console.error('SW Status check failed:', error);
        setSWStatus('error');
      }
    };

    checkStatus();

    // Listen for SW updates
    const handleUpdate = () => {
      setUpdateAvailable(true);
      setIsVisible(true);
    };

    const handleControllerUpdate = () => {
      setIsVisible(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    window.addEventListener('sw-update-available', handleUpdate);
    window.addEventListener('sw-controller-updated', handleControllerUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
      window.removeEventListener('sw-controller-updated', handleControllerUpdate);
    };
  }, []);

  const handleUpdate = async () => {
    try {
      window.location.reload();
    } catch (error) {
      console.error('SW Update failed:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  };

  // Only show if there's an update available or in dev mode
  const shouldShow = updateAvailable || isVisible || import.meta.env.DEV;

  if (!shouldShow) return null;

  const getStatusColor = () => {
    switch (swStatus) {
      case 'active': return 'bg-green-500';
      case 'installing': return 'bg-yellow-500';
      case 'not-registered': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Service Worker</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${getStatusColor()} text-white`}>
              {swStatus}
            </Badge>
            {isVisible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-xs">
          Version: {version}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2">
        {updateAvailable && (
          <div className="p-2 bg-blue-50 rounded border">
            <p className="text-xs text-blue-800 mb-2">Update available!</p>
            <Button onClick={handleUpdate} size="sm" className="w-full">
              Apply Update
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={handleClearCache} 
            variant="outline" 
            size="sm"
            className="flex-1 text-xs"
          >
            Clear Cache
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
            className="flex-1 text-xs"
          >
            Reload
          </Button>
        </div>
        
        {import.meta.env.DEV && (
          <p className="text-xs text-gray-500 mt-2">
            Development mode: Live editing enabled
          </p>
        )}
      </CardContent>
    </Card>
  );
}