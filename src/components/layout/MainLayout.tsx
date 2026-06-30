import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  Briefcase,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Sparkles,
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
    <div className="ibot-recruiter-shell ibot-workspace-bg flex h-screen w-screen overflow-hidden font-body text-slate-950">
      {/* ── Sidebar – only expands on hover, never on focus ── */}
      <aside className="group/sidebar relative z-30 hidden h-full w-[88px] shrink-0 flex-col overflow-hidden border-r border-white/70 bg-slate-950 text-white shadow-[18px_0_48px_rgba(15,23,42,0.16)] transition-[width] duration-300 ease-out hover:w-[304px] sm:flex">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-emerald-500/[0.18] via-cyan-500/10 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="relative flex h-[76px] items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div className="min-w-[180px] opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
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
                  `group/item flex h-[58px] items-center gap-3 rounded-xl px-3 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
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
                          ? 'bg-slate-950 text-emerald-300'
                          : 'bg-white/[0.08] text-slate-300 group-hover/item:bg-emerald-300/[0.12] group-hover/item:text-emerald-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-[150px] flex-1 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
                      <span className="block truncate">{item.label}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
                        {item.helper}
                      </span>
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 opacity-0 transition-all duration-200 group-hover/sidebar:opacity-100 ${
                        isActive ? 'text-emerald-500' : 'text-slate-500 group-hover/item:text-emerald-200'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: realtime sync card + user profile + logout */}
        <div className="relative border-t border-white/10 p-3">
          <div className="mb-3 hidden min-w-[248px] rounded-xl border border-emerald-300/[0.15] bg-white/[0.06] p-3 shadow-sm group-hover/sidebar:block">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-300/[0.12] text-emerald-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-white">Real-Time Sync</p>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-400">
              Campaign details, candidate statuses, and AI evaluations are automatically kept up to date.
            </p>
          </div>

          <div className="mb-2 flex h-[58px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-xs font-black text-slate-950">
              {initials}
            </div>
            <div className="min-w-[170px] opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              <p className="truncate text-xs font-semibold text-white">{user?.full_name || 'Recruiter'}</p>
              <p className="truncate text-[10px] font-semibold text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            tabIndex={-1}
            id="btn-logout"
            title="Sign Out"
            className="flex h-[54px] w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-200 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08]">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="min-w-[160px] text-left opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-white/70 bg-white/[0.97] px-4 shadow-sm shadow-slate-200/40 backdrop-blur-sm sm:px-6 lg:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                {user?.company_name || currentCopy.eyebrow}
              </p>
              <span className="hidden h-3.5 w-px bg-slate-200 sm:block" />
              <p className="hidden truncate text-[10px] font-medium text-slate-400 sm:block">
                {currentCopy.subtitle}
              </p>
            </div>
            <h1 className="mt-0.5 truncate font-display text-lg font-bold tracking-[-0.025em] text-slate-950 lg:text-xl">
              {currentCopy.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationCenter />
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-cyan-50 text-[11px] font-black text-emerald-700 shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden p-4 pb-20 sm:p-5 lg:p-5">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white/[0.92] p-1.5 shadow-2xl shadow-slate-900/[0.15] backdrop-blur-xl sm:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-12 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-slate-950 text-emerald-300'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
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
