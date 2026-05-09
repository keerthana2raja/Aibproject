import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, listDirectoryUsers } from '../api/user';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const [profileExtra, setProfileExtra] = useState(null);

  const [accessUsers, setAccessUsers] = useState(null);
  const [accessLoadState, setAccessLoadState] = useState('idle');

  useEffect(() => {
    getUserProfile()
      .then((res) => setProfileExtra(res.data.data))
      .catch(() => setProfileExtra(null));
  }, []);

  useEffect(() => {
    if (activeTab !== 'access') return;
    setAccessLoadState('loading');
    listDirectoryUsers()
      .then((res) => {
        setAccessUsers(res.data.data || []);
        setAccessLoadState('done');
      })
      .catch(() => {
        setAccessUsers(null);
        setAccessLoadState('error');
      });
  }, [activeTab]);

  const displayName = user?.name || 'Operator';
  const displayEmail = user?.email || profileExtra?.email || '—';
  const displayRole = user?.role || profileExtra?.role || 'Member';

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '—';

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'access', icon: Shield, label: 'Directory' },
  ];

  const activeLabel = tabs.find((t) => t.id === activeTab)?.label || 'Settings';

  return (
    <div className="page-wrap">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight inline-flex items-center gap-2">
            <span className="icon-wrap !w-9 !h-9 !rounded-xl border-brand-100 bg-brand-50 text-brand-600">
              <SettingsIcon className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </span>
            Settings
          </h2>
          <p className="text-[13px] text-text-muted mt-1 ml-11 max-w-xl">
            Profile uses your session and{' '}
            <code className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-muted border border-border font-mono">
              GET /v1/users/me
            </code>
            . Directory uses{' '}
            <code className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-muted border border-border font-mono">
              GET /v1/users
            </code>
            .
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
        <nav className="card card-hover p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible shadow-card">
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 text-left shrink-0 lg:w-full ${
                  on
                    ? 'bg-brand-50 text-brand-800 border border-brand-200 shadow-inner'
                    : 'text-text-secondary hover:bg-surface-muted border border-transparent hover:border-border/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <section className="card card-hover min-h-[360px] flex flex-col shadow-card">
          <header className="card-header">
            <span className="card-header-title !tracking-normal !normal-case font-semibold text-[15px] text-text-primary">
              {activeLabel}
            </span>
          </header>

          <div className="p-6 flex-1">
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-border bg-gradient-to-r from-surface-muted/90 to-surface shadow-inner">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center text-lg font-bold shadow-lg ring-4 ring-brand-100/80 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-bold text-text-primary tracking-tight">{displayName}</div>
                    <div className="text-[13px] text-text-muted mt-0.5 capitalize">{displayRole}</div>
                    {profileExtra?.pendingCount != null && (
                      <div className="text-[12px] text-brand-700 font-medium mt-1.5">
                        <span className="tabular-nums">{profileExtra.pendingCount}</span> open in pipeline
                      </div>
                    )}
                    <p className="text-[11px] text-text-muted mt-2">
                      Identity is read-only — managed by your sign-in provider and the API.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">
                    Account fields
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Display name
                      </label>
                      <input
                        readOnly
                        value={displayName}
                        className="inp text-[13px] bg-surface-muted/50 cursor-default"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Work email
                      </label>
                      <input
                        readOnly
                        value={displayEmail}
                        className="inp text-[13px] bg-surface-muted/50 cursor-default"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Account id
                      </label>
                      <input
                        readOnly
                        value={user?.id || profileExtra?.id || '—'}
                        className="inp text-[13px] font-mono bg-surface-muted/50 cursor-default"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'access' && (
              <div className="flex flex-col gap-4">
                <p className="text-[13px] text-text-muted leading-relaxed">
                  Organisation members returned by the backend directory endpoint.
                </p>

                <div className="rounded-xl border border-border bg-surface-muted/30 shadow-inner overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px] min-w-[480px]">
                      <thead>
                        <tr className="bg-surface-muted/90 text-[11px] font-bold uppercase tracking-wide text-text-muted border-b border-border">
                          <th className="text-left px-4 py-3.5">Member</th>
                          <th className="text-left px-4 py-3.5 w-[120px]">Role</th>
                          <th className="text-right px-4 py-3.5 w-[88px]"> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessLoadState === 'loading' && (
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center text-text-muted animate-pulse">
                              Loading directory…
                            </td>
                          </tr>
                        )}
                        {accessLoadState === 'error' && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-[13px] text-text-muted">
                              Could not load directory. Confirm the API is running and seeded.
                            </td>
                          </tr>
                        )}
                        {accessLoadState === 'done' &&
                          accessUsers &&
                          accessUsers.map((row, idx) => {
                            const mail = row.email || '—';
                            const nm = row.name || mail;
                            const roleLabel = row.role || 'member';
                            const rowKey = mail !== '—' ? mail : `user-${idx}-${String(row._id ?? '')}`;
                            const rowInitials = String(nm)
                              .split(/\s+/)
                              .filter(Boolean)
                              .map((x) => x[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || '—';
                            return (
                              <tr
                                key={rowKey}
                                className="border-b border-border last:border-b-0 hover:bg-surface-muted/50 transition-colors"
                              >
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-[11px] font-bold shadow-md ring-1 ring-black/10 shrink-0">
                                      {rowInitials}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-text-primary truncate">{nm}</div>
                                      {mail !== '—' && mail !== nm && (
                                        <div className="text-[12px] text-text-muted truncate">{mail}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="pill font-semibold capitalize">{roleLabel}</span>
                                </td>
                                <td className="px-4 py-3.5 text-right text-[12px] text-text-muted font-medium">
                                  —
                                </td>
                              </tr>
                            );
                          })}
                        {accessLoadState === 'done' && accessUsers && accessUsers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-[13px] text-text-muted">
                              No directory users returned. Seed SQLite or Mongo users in the backend.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
