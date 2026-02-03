import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstall {
  canInstall: boolean;
  isInstalled: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

const isAndroidDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('android');
};

const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+
};

const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
};

const wasDismissed = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  
  const dismissedDate = new Date(dismissed);
  const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
};

export const usePWAInstall = (): UsePWAInstall => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS] = useState(isIOSDevice);
  const [isAndroid] = useState(isAndroidDevice);

  useEffect(() => {
    // Check initial state
    setIsInstalled(isStandalone());
    setDismissed(wasDismissed());

    // Listen for the beforeinstallprompt event (Android/Chrome only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    // For Android with beforeinstallprompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error prompting PWA install:', error);
      }
    }
    // For iOS, we just dismiss the prompt (user follows manual instructions)
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setDismissed(true);
  }, []);

  // Can install on Android with prompt OR on iOS (manual instructions)
  const canInstall = !isInstalled && !dismissed && (Boolean(deferredPrompt) || isIOS);

  return {
    canInstall,
    isInstalled,
    isAndroid,
    isIOS,
    promptInstall,
    dismissPrompt,
  };
};
