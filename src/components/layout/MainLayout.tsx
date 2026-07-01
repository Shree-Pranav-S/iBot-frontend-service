import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  Briefcase,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRecruiterRealtime } from '../../hooks/useRecruiterRealtime';
import { NotificationCenter } from './NotificationCenter';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, helper: 'Overview' },
  { to: '/assessments', label: 'Assessments', icon: Briefcase, helper: 'Campaigns' },
  { to: '/candidates', label: 'Candidates', icon: Users, helper: 'Pipeline' },
  { to: '/evaluations', label: 'Evaluations', icon: ClipboardCheck, helper: 'Decisions' },
];

const pageCopy: Record<string, { title: string; subtitle: string; eyebrow: string }> = {
  '/dashboard': {
    eyebrow: 'Recruiting ops',
    title: 'Recruiter Dashboard',
    subtitle: 'Monitor campaigns, candidate flow, and interview readiness.',
  },
  '/assessments': {
    eyebrow: 'Assessment studio',
    title: 'Assessment Studio',
    subtitle: 'Create roles, tune interview plans, and manage campaign status.',
  },
  '/candidates': {
    eyebrow: 'Pipeline',
    title: 'Candidate Pipeline',
    subtitle: 'Invite candidates, review resumes, and track interview progress.',
  },
  '/evaluations': {
    eyebrow: 'Decisions',
    title: 'Evaluation Review',
    subtitle: 'Compare interview outcomes and finalize decisions.',
  },
};

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  useRecruiterRealtime();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.full_name || 'R')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentCopy = location.pathname.endsWith('/report')
    ? {
        eyebrow: 'Candidate intelligence',
        title: 'Detailed Evaluation Report',
        subtitle: 'Review evidence, scoring, integrity checks, and the final recommendation.',
      }
    : pageCopy[location.pathname] ?? {
        eyebrow: 'Workspace',
        title: 'iBot Workspace',
        subtitle: 'Manage interviews and candidate decisions.',
      };

  return (
    <div className="ibot-recruiter-shell ibot-workspace-bg flex h-screen w-screen overflow-hidden font-body text-primary">
      {/* ── Sidebar – expands via transform overlay so main content never reflows ── */}
      <aside className="group/sidebar relative z-30 hidden h-full w-[88px] shrink-0 sm:block">
        <div className="absolute inset-y-0 left-0 z-30 flex w-[304px] -translate-x-[216px] flex-col overflow-hidden border-r border-emerald-900/30 bg-sidebar text-white shadow-[18px_0_48px_rgba(2,44,34,0.2)] transition-transform duration-300 ease-out will-change-transform group-hover/sidebar:translate-x-0">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-emerald-500/20 via-sidebar-alt/50 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="relative flex h-[76px] items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div className="min-w-[180px]">
            <div className="flex items-center gap-2">
              <p className="font-display text-lg font-bold tracking-tight">iBot</p>
              <span className="rounded-full border border-emerald-300/[0.35] bg-emerald-300/[0.12] px-2 py-0.5 text-[10px] font-black uppercase text-emerald-200">
                Pro
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
              Interview intelligence suite
            </p>
          </div>
        </div>

        {/* Nav items — tabIndex=-1 prevents focus from keeping sidebar open */}
        <nav className="relative flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                tabIndex={-1}
                className={({ isActive }) =>
                  `group/item flex h-[58px] items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors duration-200 ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                      : 'text-slate-400 hover:bg-white/[0.08] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-sidebar-deep text-emerald-300'
                          : 'bg-white/[0.08] text-slate-300 group-hover/item:bg-emerald-500/15 group-hover/item:text-emerald-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-[150px] flex-1">
                      <span className="block truncate">{item.label}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
                        {item.helper}
                      </span>
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-emerald-500' : 'text-slate-500 group-hover/item:text-emerald-200'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: user profile + logout */}
        <div className="relative border-t border-white/10 p-3">
          <div className="mb-2 flex h-[58px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-xs font-black text-slate-950">
              {initials}
            </div>
            <div className="min-w-[170px]">
              <p className="truncate text-xs font-semibold text-white">{user?.full_name || 'Recruiter'}</p>
              <p className="truncate text-[10px] font-semibold text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            tabIndex={-1}
            id="btn-logout"
            title="Sign Out"
            className="flex h-[54px] w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-200"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08]">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="min-w-[160px] text-left">
              Sign Out
            </span>
          </button>
        </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="ibot-page-header-band z-10 flex h-[72px] shrink-0 items-center justify-between px-4 sm:px-6 lg:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                {user?.company_name || currentCopy.eyebrow}
              </p>
              <span className="hidden h-3.5 w-px bg-default sm:block" />
              <p className="hidden truncate text-[10px] font-medium text-secondary sm:block">
                {currentCopy.subtitle}
              </p>
            </div>
            <h1 className="mt-0.5 truncate font-display text-lg font-bold tracking-[-0.025em] text-primary lg:text-xl">
              {currentCopy.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationCenter />
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-default bg-emerald-50 text-[11px] font-black text-emerald-700 shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden p-4 pb-20 sm:p-5 lg:p-5">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-2xl border border-default bg-surface p-1.5 shadow-lg sm:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-12 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-sidebar text-emerald-300'
                    : 'text-secondary hover:bg-elevated hover:text-primary'
                }`
              }
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
