import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';

/** Minimal typing for the non-standard beforeinstallprompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'invest-master:install-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Floating, dismissible banner that lets users install the game to their home
 * screen. On Chrome/Android it uses the native install prompt; on iOS Safari
 * (which has no prompt API) it shows the manual "Add to Home Screen" hint.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    // iOS gives no beforeinstallprompt — surface manual instructions instead.
    let iosTimer: number | undefined;
    if (isIos()) {
      iosTimer = window.setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setShow(false);
    setDeferred(null);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="install-banner"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        >
          <div className="install-ic">₹</div>
          <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Install Invest Master</span>
            {iosHint ? (
              <span className="muted" style={{ fontSize: 11.5 }}>
                Tap <Share size={12} style={{ verticalAlign: -2 }} /> then “Add to Home Screen”.
              </span>
            ) : (
              <span className="muted" style={{ fontSize: 11.5 }}>
                Play fullscreen from your home screen — works offline.
              </span>
            )}
          </div>
          {!iosHint && deferred && (
            <button className="install-btn" onClick={install}>
              <Download size={15} /> Install
            </button>
          )}
          <button className="install-close" onClick={dismiss} aria-label="Dismiss">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
