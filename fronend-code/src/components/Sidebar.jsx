import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderSearch,
  FolderPlus,
  GitPullRequest,
  BarChart3,
  Settings,
  LifeBuoy,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, badge, exact, onClick, collapsed }) => (
  <NavLink
    to={to}
    end={exact}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `group flex items-center gap-3 rounded-lg mx-2 px-3 py-2 text-[13px] font-medium transition-all duration-150 relative border-l-2
       ${
        isActive
          ? 'bg-brand-50 text-brand-900 border-l-brand-600 shadow-sm'
          : 'border-l-transparent text-shell-nav-muted hover:bg-shell-sidebar-hover hover:text-shell-nav'
       }
       ${collapsed ? 'justify-center mx-1.5 px-0 w-10 py-2.5' : ''}
      `
    }
  >
    {({ isActive }) => (
      <>
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors border
            ${
              isActive
                ? 'bg-brand-100 border-brand-300/60 text-brand-700'
                : 'bg-surface-muted border-border text-shell-nav-muted group-hover:text-shell-nav group-hover:border-border-strong'
            }`}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </span>
        {!collapsed && <span className="truncate flex-1">{label}</span>}
        {!collapsed && badge != null && badge !== '' && (
          <span className="ml-auto text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            {badge}
          </span>
        )}
        {collapsed && badge != null && badge !== '' && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-brand-600 text-[9px] font-bold text-white flex items-center justify-center shadow-sm ring-2 ring-shell-sidebar">
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const SectionLabel = ({ label, collapsed }) =>
  collapsed ? (
    <div className="mx-3 my-2 h-px bg-shell-sidebar-border rounded-full" aria-hidden />
  ) : (
    <div className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-shell-nav-muted select-none">
      {label}
    </div>
  );

const Sidebar = ({ onClose, pendingCount = 0 }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_c') === 'true');

  useEffect(() => {
    localStorage.setItem('sidebar_c', collapsed);
  }, [collapsed]);

  useEffect(() => {
    const check = () => {
      if (window.innerWidth >= 1024 && window.innerWidth < 1280) setCollapsed(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const pipelineBadge =
    pendingCount > 0 ? (pendingCount > 99 ? '99+' : String(pendingCount)) : null;

  return (
    <aside
      className={`
        bg-shell-sidebar border-r border-shell-sidebar-border flex flex-col h-screen flex-shrink-0 relative shadow-shell
        transition-[width] duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-[244px]'}
      `}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-border text-text-muted hover:text-brand-600 hover:border-brand-300 absolute top-7 -right-3.5 z-50 shadow-card transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div
        className={`flex items-center border-b border-shell-sidebar-border min-h-[64px] px-3 ${collapsed ? 'justify-center px-2' : 'gap-3'}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center flex-shrink-0 shadow-md ring-1 ring-black/5">
          <Layers className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 pr-1">
              <div className="text-[15px] font-bold text-text-primary tracking-tight leading-tight truncate">AIMPLIFY</div>
              <div className="text-[10px] text-shell-nav-muted uppercase tracking-widest mt-0.5 truncate">by Infovision</div>
            </div>
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-shell-nav-muted hover:text-text-primary hover:bg-shell-sidebar-hover"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-0.5 pb-4">
        <SectionLabel label="Main" collapsed={collapsed} />
        <NavItem
          to="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          exact
          onClick={(e) => {
            if (location.pathname === '/dashboard') {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('aimplify:dashboard-refresh'));
            }
            onClose?.();
          }}
          collapsed={collapsed}
        />
        <NavItem to="/catalog" icon={FolderSearch} label="Catalog" onClick={onClose} collapsed={collapsed} />

        <SectionLabel label="Manage" collapsed={collapsed} />
        <NavItem to="/submit" icon={FolderPlus} label="Submit Asset" onClick={onClose} collapsed={collapsed} />
        <NavItem
          to="/pipeline"
          icon={GitPullRequest}
          label="Pipeline"
          badge={pipelineBadge}
          onClick={onClose}
          collapsed={collapsed}
        />
        <NavItem to="/analytics" icon={BarChart3} label="Analytics" onClick={onClose} collapsed={collapsed} />

        <SectionLabel label="System" collapsed={collapsed} />
        {/* <NavItem to="/settings" icon={Settings} label="Settings" onClick={onClose} collapsed={collapsed} /> */}
        <NavItem to="/help" icon={LifeBuoy} label="Help" onClick={onClose} collapsed={collapsed} />
      </nav>
    </aside>
  );
};

export default Sidebar;
