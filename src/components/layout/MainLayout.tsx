import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
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
import { IbotMark } from '../ui/IbotMark';

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
  const isReportPage = location.pathname.endsWith('/report');

  return (
    <div className="ibot-recruiter-shell ibot-workspace-bg flex h-screen w-screen overflow-hidden font-body text-primary">
      {/* ── Sidebar – expands as a width overlay so main content never reflows ── */}
      <aside className="group/sidebar relative z-30 hidden h-full w-[88px] shrink-0 sm:block">
        <div className="absolute inset-y-0 left-0 z-30 flex w-[88px] flex-col overflow-hidden border-r border-white/10 bg-sidebar text-white shadow-[18px_0_52px_rgba(36,33,29,0.2)] transition-[width] duration-300 ease-out will-change-[width] group-hover/sidebar:w-[304px]">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-brand-accent/25 via-sidebar-alt/50 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="relative flex h-[68px] w-[304px] items-center gap-3 border-b border-white/10 px-6 transition-[padding] duration-300 ease-out group-hover/sidebar:px-4">
          <span className="shrink-0 transition-transform duration-300 group-hover/sidebar:-rotate-3 group-hover/sidebar:scale-105">
            <IbotMark />
          </span>
          <div className="min-w-[180px] opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
            <div className="flex items-center gap-2">
              <p className="font-display text-lg font-extrabold tracking-[-0.035em]">iBot</p>
              <span className="rounded-full border border-brand-accent/40 bg-brand-accent/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#F4E8D6]">
                Pro
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[#B8AA9A]">
              Interview intelligence suite
            </p>
          </div>
        </div>

        {/* Nav items — tabIndex=-1 prevents focus from keeping sidebar open */}
        <nav className="relative w-[304px] flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                tabIndex={-1}
                className={({ isActive }) =>
                  `group/item flex h-[56px] w-16 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-[width,background-color,color,transform] duration-300 group-hover/sidebar:w-[280px] ${
                    isActive
                      ? 'bg-[#FCFAF6] text-brand-charcoal shadow-[0_10px_24px_-14px_rgba(0,0,0,0.7)] ring-1 ring-white/70'
                      : 'text-[#B8AA9A] hover:translate-x-0.5 hover:bg-white/[0.08] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-sidebar-deep text-brand-accent'
                          : 'bg-white/[0.08] text-[#D8CCBD] group-hover/item:bg-brand-accent/15 group-hover/item:text-[#F4E8D6]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-[150px] flex-1 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
                      <span className="block truncate">{item.label}</span>
                      <span className={`mt-0.5 block truncate text-[10px] font-semibold ${
                        isActive ? 'text-[#706A61]' : 'text-[#8A8175]'
                      }`}>
                        {item.helper}
                      </span>
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 ${
                        isActive ? 'text-brand-accent' : 'text-[#8A8175] group-hover/item:text-[#F4E8D6]'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: user profile + logout */}
        <div className="relative w-[304px] border-t border-white/10 p-3">
          <div className="mb-2 flex h-[56px] w-16 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 transition-[width,background-color] duration-300 group-hover/sidebar:w-[280px] group-hover/sidebar:bg-white/[0.08]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-hover text-xs font-black text-white">
              {initials}
            </div>
            <div className="min-w-[170px] opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              <p className="truncate text-xs font-semibold text-white">{user?.full_name || 'Recruiter'}</p>
              <p className="truncate text-[10px] font-semibold text-[#B8AA9A]">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            tabIndex={-1}
            id="btn-logout"
            title="Sign Out"
            className="flex h-[52px] w-16 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#B8AA9A] transition-[width,background-color,color] duration-300 hover:bg-rose-500/10 hover:text-rose-200 group-hover/sidebar:w-[280px]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08]">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="min-w-[160px] text-left opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              Sign Out
            </span>
          </button>
        </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={`ibot-page-header-band z-10 flex shrink-0 items-center justify-between px-4 sm:px-6 lg:px-7 ${
            isReportPage ? 'h-[60px]' : 'h-[68px]'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-hover">
                {user?.company_name || currentCopy.eyebrow}
              </p>
              <span className="hidden h-3.5 w-px bg-default sm:block" />
              <p className="hidden truncate text-xs font-medium text-secondary sm:block">
                {currentCopy.subtitle}
              </p>
            </div>
            <h1 className="mt-0.5 truncate font-display text-lg font-extrabold tracking-[-0.035em] text-primary lg:text-xl">
              {currentCopy.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationCenter />
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8C9B5] bg-brand-soft text-[11px] font-black text-brand-hover shadow-[0_8px_18px_-14px_rgba(36,33,29,0.55)]">
              {initials}
            </div>
          </div>
        </header>

        <main
          className={`relative min-h-0 flex-1 overflow-hidden pb-20 sm:pb-5 ${
            isReportPage ? 'p-3 sm:p-4' : 'p-4 sm:p-5'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-2xl border border-default bg-white/95 p-1.5 shadow-[0_18px_44px_-18px_rgba(36,33,29,0.38)] backdrop-blur-xl sm:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-12 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-sidebar text-brand-accent'
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
