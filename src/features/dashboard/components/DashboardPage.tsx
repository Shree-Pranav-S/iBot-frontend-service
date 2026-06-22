import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useAssessments } from '../../../hooks/queries';
import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: assessments, isLoading } = useAssessments();

  const activeCount = assessments?.filter(a => a.status === 'ACTIVE').length ?? 0;
  const totalCount = assessments?.length ?? 0;
  const draftCount = assessments?.filter(a => a.status === 'DRAFT').length ?? 0;

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const stats = [
    {
      label: 'Campaigns',
      value: totalCount,
      icon: Briefcase,
      borderClass: 'border-t-2 border-t-emerald-500/40',
      trend: '+3 this month',
    },
    {
      label: 'Active',
      value: activeCount,
      icon: TrendingUp,
      borderClass: 'border-t-2 border-t-emerald-500',
      trend: '+2 this week',
    },
    {
      label: 'Drafts',
      value: draftCount,
      icon: Clock,
      borderClass: 'border-t-2 border-t-slate-400',
      trend: '0 pending',
    },
  ];

  const quickActions = [
    {
      to: '/assessments',
      icon: Briefcase,
      title: 'New Campaign',
      desc: 'Create a role and publish candidate invites.',
    },
    {
      to: '/candidates',
      icon: FileSpreadsheet,
      title: 'Import Candidates',
      desc: 'Upload CSV or add candidates manually.',
    },
    {
      to: '/candidates',
      icon: Users,
      title: 'Review Results',
      desc: 'Compare evaluations and make decisions.',
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto pr-1 ibot-scrollbar animate-fadeIn select-none">
      {/* ── Greeting + Actions ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0 animate-slideDown">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Hey, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Here's your hiring overview
          </p>
        </div>
        <NavLink
          to="/assessments"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-150"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </NavLink>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-shrink-0">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`ibot-card p-5 animate-slideUp transition-all duration-300 hover:scale-[1.02] hover:border-emerald-300 hover:shadow-md cursor-default ${s.borderClass}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {s.label}
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-500/10 text-emerald-600">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              {isLoading ? (
                <div className="h-8 w-14 rounded-md ibot-shimmer" />
              ) : (
                <div>
                  <p className="font-bold tracking-tight text-slate-900 font-display text-3xl">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {s.trend}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Quick Actions (High Interactivity) ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-shrink-0">
        {quickActions.map((a, i) => {
          const Icon = a.icon;
          return (
            <NavLink
              key={a.title}
              to={a.to}
              className="group ibot-card p-5 flex flex-col justify-between hover:border-emerald-500/30 hover:scale-[1.03] hover:shadow-glow-emerald/5 active:scale-[0.98] transition-all duration-300"
              style={{ animationDelay: `${0.15 + i * 0.06}s` }}
            >
              <div>
                {/* Icon Container: scales and rotates on group hover */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-500/10 text-emerald-600 transition-all group-hover:scale-110 group-hover:rotate-6 duration-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{a.title}</h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">
                  {a.desc}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                Open <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* ── Recent Activity ──────────────────────────────────────────────── */}
      <div className="ibot-card p-5 animate-slideUp stagger-4 flex-shrink-0">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-emerald-500" />
          Recent Activity
        </h3>
        <div className="divide-y divide-slate-100 text-xs font-semibold">
          <div className="py-3 flex items-center justify-between group hover:bg-slate-100/50 hover:pl-2 rounded transition-all duration-200 cursor-default">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-[10px] transition-transform group-hover:scale-110">
                JT
              </div>
              <p className="text-slate-600">
                <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Jeet Thakur</span> completed an interview for <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Senior Node.js Developer</span>
              </p>
            </div>
            <span className="text-[10px] text-slate-400 pr-2 group-hover:text-slate-600">2h ago</span>
          </div>
          <div className="py-3 flex items-center justify-between group hover:bg-slate-100/50 hover:pl-2 rounded transition-all duration-200 cursor-default">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-[10px] transition-transform group-hover:scale-110">
                SC
              </div>
              <p className="text-slate-600">
                <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Sarah Connor</span> completed an interview for <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Security Analyst</span>
              </p>
            </div>
            <span className="text-[10px] text-slate-400 pr-2 group-hover:text-slate-600">5h ago</span>
          </div>
          <div className="py-3 flex items-center justify-between group hover:bg-slate-100/50 hover:pl-2 rounded transition-all duration-200 cursor-default">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-[10px] transition-transform group-hover:scale-110">
                iB
              </div>
              <p className="text-slate-600">
                Campaign <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Senior Node.js Developer</span> was launched
              </p>
            </div>
            <span className="text-[10px] text-slate-400 pr-2 group-hover:text-slate-600">1d ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};
