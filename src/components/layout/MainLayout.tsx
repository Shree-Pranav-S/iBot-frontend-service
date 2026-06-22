import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardCheck,
  LogOut,
  Bot,
  ChevronRight,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/assessments', label: 'Assessments', icon: Briefcase },
    { to: '/candidates', label: 'Candidates', icon: Users },
    { to: '/evaluations', label: 'Evaluations', icon: ClipboardCheck },
  ];

  const initials = (user?.full_name || 'R')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-page font-sans text-slate-900 relative">
      {/* Spacer to reserve space for collapsed sidebar */}
      <div className="w-16 flex-shrink-0" />

      {/* Sidebar */}
      <aside className="group absolute left-0 top-0 bottom-0 z-30 flex w-16 hover:w-[232px] flex-shrink-0 flex-col justify-between border-r border-slate-800 bg-slate-900 transition-all duration-300 ease-in-out overflow-hidden">
        {/* Logo */}
        <div>
          <div className="flex h-[76px] items-center px-3 border-b border-slate-800/60">
            <div className="flex items-center gap-3 w-full">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white animate-fadeIn"
                style={{ background: 'linear-gradient(135deg, #10b981, #0f766e)' }}
              >
                <Bot className="h-5 w-5" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-white font-display opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                iBot
              </span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Pro
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-4 space-y-1.5 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group/item relative flex items-center rounded-lg py-1.5 transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active gradient left accent bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-gradient-to-b from-emerald-400 to-emerald-600 animate-fadeIn" />
                      )}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-slate-500 group-hover/item:text-slate-300'
                      }`}>
                        <Icon className="h-4.5 w-4.5 group-hover/item:scale-105 transition-transform" />
                      </div>
                      <span className="ml-3 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        {item.label}
                      </span>
                      {isActive && (
                        <ChevronRight className="mr-3 h-3.5 w-3.5 text-emerald-400 opacity-0 group-hover:opacity-60 transition-all group-hover:translate-x-0.5" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User footer */}
        <div className="border-t border-slate-800 p-3 bg-slate-900/50">
          <div className="mb-2 flex items-center rounded-lg py-1.5 hover:bg-slate-800/40 transition-colors duration-200 group/user cursor-pointer">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white border border-emerald-500/20 transition-transform group-hover/user:scale-110 duration-200"
              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
            >
              {initials}
            </div>
            <div className="ml-3 min-w-0 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <p className="truncate text-xs font-bold text-slate-200">{user?.full_name || 'Recruiter'}</p>
              <p className="truncate text-[10px] text-slate-500 font-medium">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            id="btn-logout"
            className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 py-1.5 text-xs font-semibold text-slate-400 transition-all duration-250 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 w-full"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
        {/* Top bar - minimal */}
        <header className="z-10 flex h-[76px] flex-shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-4 flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none">
              {user?.company_name || 'Workspace'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/60 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden p-6 bg-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


