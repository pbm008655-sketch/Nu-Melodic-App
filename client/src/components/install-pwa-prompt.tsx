import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-dismissed');
      if (!hasSeenPrompt) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-dismissed', 'true');
  };

  if (isStandalone || (!showPrompt && !isIOS)) {
    return null;
  }

  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-20 left-0 right-0 mx-4 z-50 md:left-auto md:right-4 md:max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-xl">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <Download className="h-5 w-5 text-primary mr-2" />
              <h3 className="font-semibold">Install NU MELODIC</h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-white"
              data-testid="button-dismiss-install"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            Install this app on your iPhone: tap{' '}
            <span className="inline-block">
              <svg className="inline h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
            </span>{' '}
            then "Add to Home Screen"
          </p>
        </div>
      </div>
    );
  }

  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-0 right-0 mx-4 z-50 md:left-auto md:right-4 md:max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-xl">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <Download className="h-5 w-5 text-primary mr-2" />
              <h3 className="font-semibold">Install NU MELODIC</h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-white"
              data-testid="button-dismiss-install"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            Install the app for a better experience with offline access and faster loading.
          </p>
          <Button
            onClick={handleInstallClick}
            className="w-full"
            data-testid="button-install-pwa"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
