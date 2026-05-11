import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

/**
 * Ends the session server-side locally, then confirms sign-out (route is public so we can navigate here while still authenticated).
 */
const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('signing-out');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await logout();
      } finally {
        if (!cancelled) setPhase('done');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  useEffect(() => {
    if (phase !== 'done') return;
    const id = window.setTimeout(() => navigate('/login', { replace: true }), 900);
    return () => window.clearTimeout(id);
  }, [phase, navigate]);

  return (
    <div className="min-h-screen flex bg-canvas">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[44%] bg-gradient-to-br from-shell-sidebar via-brand-muted/35 to-surface border-r border-shell-sidebar-border flex-col justify-center px-10 xl:px-14 shadow-enterprise-md">
        <div className="max-w-md">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-3">
            Secure session end
          </div>
          <h1 className="text-[22px] font-semibold text-shell-nav leading-tight tracking-tight">
            Signed out
          </h1>
          <p className="text-[13px] text-shell-nav-muted mt-3 leading-relaxed">
            Your local session tokens have been cleared. Sign in again to continue viewing the accelerator
            catalog and pipeline.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px] bg-surface border border-border rounded-enterprise-lg shadow-enterprise-md p-6 sm:p-8 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-enterprise-lg border border-brand-muted-border bg-brand-muted text-brand shadow-enterprise">
            <LogOut className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </div>

          {phase === 'signing-out' ? (
            <>
              <h2 className="text-[15px] font-semibold text-text-primary">Signing you out…</h2>
              <p className="text-[12px] text-text-muted mt-2 mb-6">Ending your session securely.</p>
              <div className="flex justify-center">
                <Spinner size="lg" color="blue" />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[15px] font-semibold text-text-primary">You are signed out</h2>
              <p className="text-[12px] text-text-muted mt-2 mb-6">
                Thanks for using AIMPLIFY. You will be redirected to sign in, or tap below.
              </p>
              <Link
                to="/login"
                replace
                className="btn-primary inline-flex w-full justify-center text-[12px]"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logout;
