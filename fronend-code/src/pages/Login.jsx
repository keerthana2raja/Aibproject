import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-slate-50 via-canvas to-brand-50/35 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-24 right-[10%] h-72 w-72 rounded-full bg-sky-200/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-12 left-[5%] h-56 w-56 rounded-full bg-indigo-200/20 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-[420px] rounded-2xl border border-border bg-surface shadow-[0_20px_55px_-15px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04] p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center shadow-md ring-4 ring-brand-500/15">
            <Layers className="w-6 h-6 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary tracking-tight">AIMPLIFY</div>
            <div className="text-[11px] text-text-muted uppercase tracking-[0.14em] font-semibold mt-0.5">
              by Infovision
            </div>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-text-primary">Sign in</h1>
        <p className="text-[13px] text-text-muted mt-1 mb-6 leading-relaxed">
          Use your corporate identity to access the catalogue.
        </p>

        {error && (
          <div
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 mb-5"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <span className="text-[13px] text-red-900/90 leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="text-[10px] font-bold uppercase tracking-[0.55px] text-text-secondary mb-1.5 block"
            >
              Work email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@infovision.com"
              autoComplete="email"
              className="w-full rounded-xl border border-border-strong bg-surface-muted/50 px-4 py-3 text-[15px] text-text-primary placeholder:text-text-muted/70 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-shadow"
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="text-[10px] font-bold uppercase tracking-[0.55px] text-text-secondary mb-1.5 block"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                strokeWidth={1.75}
              />
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-border-strong bg-surface-muted/50 pl-11 pr-11 py-3 text-[15px] text-text-primary placeholder:text-text-muted/70 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary p-1 rounded-lg transition-colors"
                tabIndex={-1}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white font-semibold py-3.5 text-[15px] shadow-md shadow-brand-600/25 hover:bg-brand-hover active:bg-brand-active transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-65 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                Continue to app <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          disabled
          title="Not available in this deployment"
          className="w-full rounded-xl border border-dashed border-border-mid bg-surface-muted/40 py-3.5 text-[14px] font-semibold text-text-muted opacity-65 cursor-not-allowed"
        >
          Continue with Infovision SSO
        </button>

        <p className="text-[11px] text-text-muted text-center mt-6 leading-relaxed">
          Access issues?{' '}
          <a
            href="mailto:it@infovision.com"
            className="font-semibold text-brand-700 hover:underline underline-offset-2"
          >
            Contact IT
          </a>
        </p>
      </div>

      <p className="relative mt-8 text-[12px] text-text-muted text-center max-w-md px-4 leading-relaxed">
        Infovision IT Help ·{' '}
        <a href="#" className="text-text-secondary hover:text-brand-700 underline-offset-2 hover:underline">
          Privacy
        </a>{' '}
        ·{' '}
        <a href="#" className="text-text-secondary hover:text-brand-700 underline-offset-2 hover:underline">
          Terms
        </a>
      </p>
    </div>
  );
};

export default Login;
