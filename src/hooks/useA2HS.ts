import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UseA2HSReturn {
  installable: boolean;
  isInstalled: boolean;
  install: () => Promise<boolean>;
  canPrompt: boolean;
}

export const useA2HS = (): UseA2HSReturn => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if app is already installed
  const checkIfInstalled = useCallback(() => {
    // Check for standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Check for iOS Safari standalone
    const isIOSStandalone = (navigator as any).standalone === true;
    // Check for Android TWA or other PWA indicators
    const isPWA = window.navigator.userAgent.includes('wv') || 
                  document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone || isIOSStandalone || isPWA);
  }, []);

  useEffect(() => {
    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      console.log('📱 PWA: Install prompt available');
      
      // Prevent the default mini-infobar from appearing
      event.preventDefault();
      
      // Save the event for later use
      setPromptEvent(event);
      setInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('📱 PWA: App was installed');
      setPromptEvent(null);
      setInstallable(false);
      setIsInstalled(true);
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      checkIfInstalled();
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, [checkIfInstalled]);

  const install = useCallback(async (): Promise<boolean> => {
    if (!promptEvent) {
      console.log('📱 PWA: No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      await promptEvent.prompt();
      
      // Wait for user choice
      const { outcome } = await promptEvent.userChoice;
      
      console.log('📱 PWA: Install prompt result:', outcome);
      
      // Clean up
      setPromptEvent(null);
      setInstallable(false);
      
      if (outcome === 'accepted') {
        // The app will be installed, appinstalled event will fire
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('📱 PWA: Install prompt failed:', error);
      return false;
    }
  }, [promptEvent]);

  return {
    installable: installable && !isInstalled,
    isInstalled,
    install,
    canPrompt: !!promptEvent
  };
};