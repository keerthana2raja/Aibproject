import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex w-full min-h-screen bg-canvas overflow-hidden">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-40 lg:hidden border-0 p-0 cursor-pointer"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <div
        className={`fixed lg:sticky top-0 z-50 h-screen transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
