"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './sidebar';
import { useAuth } from '@/contexts/auth-context';
import { SessionScopeHeader, SessionScopeMobile } from './session-scope-header';

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    setIsUserMenuOpen(false);
  };

  const displayName = user
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`.trim()
    : 'User';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden bg-background lg:ml-0">
        <header className="h-auto min-h-[4rem] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 py-2">
          <div className="flex items-center flex-1 gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <SessionScopeHeader />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Link
              href="/notifications"
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.roleName?.replaceAll('_', ' ') || 'User'}
                  </p>
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                    <div className="px-4 py-3 border-b border-slate-100 space-y-1">
                      <p className="text-sm font-medium text-slate-900">{displayName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <p className="text-xs text-slate-400">{user?.roleName?.replaceAll('_', ' ')}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <SessionScopeMobile />

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
