import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    helper: 'Overview',
  },
  {
    to: '/assessments',
    label: 'Assessments',
    icon: Briefcase,
    helper: 'Campaigns',
  },
  {
    to: '/candidates',
    label: 'Candidates',
    icon: Users,
    helper: 'Pipeline',
  },
  {
    to: '/evaluations',
    label: 'Evaluations',
    icon: ClipboardCheck,
    helper: 'Decisions',
  },
];

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Recruiter Dashboard',
    subtitle: 'Monitor campaigns, candidate flow, and interview readiness.',
  },
  '/assessments': {
    title: 'Assessment Studio',
    subtitle: 'Create roles, tune interview plans, and manage campaign status.',
  },
  '/candidates': {
    title: 'Candidate Pipeline',
    subtitle: 'Invite candidates, review resumes, and track interview progress.',
  },
  '/evaluations': {
    title: 'Evaluation Review',
    subtitle: 'Compare interview outcomes and finalize decisions.',
  },
};

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
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

  const currentCopy = pageCopy[location.pathname] ?? {
    title: 'iBot Workspace',
    subtitle: 'Manage interviews and candidate decisions.',
  };

  return (
    <div className="ibot-workspace-bg flex h-screen w-screen overflow-hidden font-sans text-slate-900">
      <aside className="relative z-30 flex w-[82px] shrink-0 flex-col border-r border-white/80 bg-white/80 shadow-[12px_0_36px_rgba(15,23,42,0.06)] backdrop-blur-2xl transition-all duration-300 lg:w-[286px]">
        <div className="flex h-[86px] items-center gap-3 border-b border-slate-200/70 px-4 lg:px-5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <Bot className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div className="hidden min-w-0 lg:block">
            <div className="flex items-center gap-2">
              <p className="font-display text-lg font-black text-slate-950">iBot</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                Pro
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              Interview intelligence suite
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-5 lg:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-500 hover:bg-white hover:text-slate-950 hover:shadow-md hover:shadow-slate-200/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-white/10 text-emerald-300'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="hidden min-w-0 flex-1 lg:block">
                      <span className="block truncate">{item.label}</span>
                      <span
                        className={`mt-0.5 block truncate text-[10px] font-semibold ${
                          isActive ? 'text-white/50' : 'text-slate-400'
                        }`}
                      >
                        {item.helper}
                      </span>
                    </span>
                    <ChevronRight
                      className={`hidden h-4 w-4 transition-all duration-200 lg:block ${
                        isActive
                          ? 'translate-x-0 text-emerald-300 opacity-100'
                          : '-translate-x-1 text-slate-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/75 p-3 lg:p-4">
          <div className="mb-3 hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 lg:block">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-xs font-black text-slate-900">Live workspace</p>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
              Campaign updates and candidate decisions stay synced with the API.
            </p>
          </div>

          <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200/75 bg-white p-2 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-black text-white shadow-md shadow-emerald-500/20">
              {initials}
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="truncate text-xs font-black text-slate-900">
                {user?.full_name || 'Recruiter'}
              </p>
              <p className="truncate text-[10px] font-semibold text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            id="btn-logout"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-bold text-slate-500 transition-all duration-200 hover:border-red-100 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-[86px] shrink-0 items-center justify-between border-b border-white/80 bg-white/75 px-5 backdrop-blur-2xl lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-emerald-700">
              {user?.company_name || 'Workspace'}
            </p>
            <h1 className="mt-1 truncate font-display text-xl font-black text-slate-950 lg:text-2xl">
              {currentCopy.title}
            </h1>
            <p className="mt-0.5 hidden text-sm font-medium text-slate-500 md:block">
              {currentCopy.subtitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 shadow-sm sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Online
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white bg-white text-xs font-black text-emerald-700 shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
