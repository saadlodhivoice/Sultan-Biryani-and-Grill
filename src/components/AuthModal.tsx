import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { ShieldCheck, X } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase.ts';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GoogleLogoSvg({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in window was closed before completing.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Please allow popups in your browser to sign in with Google.');
      } else {
        setErrorMsg('Could not sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden bg-[#fff9f9] dark:bg-[#190608] border border-red-200 dark:border-red-900/70 shadow-2xl"
          >
            <div className="h-20 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#991b1b] relative flex items-center justify-center">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sign in dialog"
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/25 hover:bg-black/45 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="translate-y-7 w-18 h-18 rounded-full p-1 bg-white dark:bg-[#190608] shadow-xl">
                <img
                  src="/assets/aistudio/Sultan_Biryani_and_Grill_3fdb02a0.png"
                  alt="Sultan Biryani and Grill"
                  className="w-full h-full rounded-full object-cover bg-black"
                />
              </div>
            </div>

            <div className="pt-11 pb-7 px-6 text-center">
              <h2 className="font-display text-2xl font-extrabold text-[#220709] dark:text-white">
                Customer Sign In
              </h2>
              <p className="mt-1.5 text-sm text-[#6d373b] dark:text-red-200/80">
                Access your order history, live delivery tracking, and saved Multan addresses.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="mt-6 w-full h-12 px-5 rounded-xl bg-white dark:bg-[#260b0e] hover:bg-red-50 dark:hover:bg-[#320f13] text-[#1f1f1f] dark:text-white border border-red-200 dark:border-red-800/80 shadow-md flex items-center justify-center gap-3 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                <GoogleLogoSvg className="w-5 h-5 shrink-0" />
                <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {errorMsg && (
                <p className="mt-3 text-xs font-medium text-red-700 dark:text-amber-300">
                  {errorMsg}
                </p>
              )}

              <div className="mt-5 pt-4 border-t border-red-100 dark:border-red-950/80 flex items-center justify-center gap-2 text-xs text-[#794346] dark:text-red-200/65">
                <ShieldCheck className="w-4 h-4 text-red-700 dark:text-amber-400 shrink-0" />
                <span>Secured by Google Authentication</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
