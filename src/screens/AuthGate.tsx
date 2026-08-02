import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

type Mode = 'login' | 'signup';

/**
 * Email + password gate shown when no user is signed in. Handles both
 * creating a new account and signing into an existing one. Each account keeps
 * its own saved game progress.
 */
export function AuthGate() {
  const signIn = useGameStore((s) => s.signIn);
  const signUp = useGameStore((s) => s.signUp);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setBusy(true);
    const res = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (!res.ok) setErr(res.message);
    // On success the store flips `initialized` true and the app swaps to the game.
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErr(null);
  };

  return (
    <div className="auth-wrap">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-logo">₹</div>
        <h1 className="auth-title">Invest Master</h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Sign in to continue your journey'
            : 'Create an account to start investing'}
        </p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <Mail size={17} className="faint" />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <Lock size={17} className="faint" />
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </label>

          {err && <div className="trade-err">{err}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? (
              'Please wait…'
            ) : mode === 'login' ? (
              <>
                <LogIn size={17} /> Log In
              </>
            ) : (
              <>
                <UserPlus size={17} /> Create Account
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button type="button" onClick={() => switchMode('signup')}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Log in
              </button>
            </>
          )}
        </p>

        <div className="auth-note">🛡️ Simulation only · No real money involved</div>
      </motion.div>
    </div>
  );
}
