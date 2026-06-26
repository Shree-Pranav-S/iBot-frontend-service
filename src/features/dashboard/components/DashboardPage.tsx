import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Plus,
  Radio,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useAssessments } from '../../../hooks/queries';
import type { AssessmentSummaryResponse } from '../../../types/assessment.types';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const statusClasses = (status: AssessmentSummaryResponse['status']) => {
  if (status === 'ACTIVE') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (status === 'DRAFT') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: assessments = [], isLoading } = useAssessments();

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const activeCount = assessments.filter((a) => a.status === 'ACTIVE').length;
  const totalCount = assessments.length;
  const draftCount = assessments.filter((a) => a.status === 'DRAFT').length;
  const closedCount = assessments.filter((a) => a.status === 'CLOSED').length;
  const closingSoon = assessments.filter(
    (a) => a.status === 'ACTIVE' && daysUntil(a.window_end) <= 3,
  ).length;
  const avgDuration = totalCount
    ? Math.round(
        assessments.reduce((sum, a) => sum + a.interview_duration_mins, 0) /
          totalCount,
      )
    : 0;

  const recentAssessments = [...assessments]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  const activeAssessments = assessments
    .filter((a) => a.status === 'ACTIVE')
    .sort(
      (a, b) =>
        new Date(a.window_end).getTime() - new Date(b.window_end).getTime(),
    )
    .slice(0, 4);

  const stats = [
    {
      label: 'Total Campaigns',
      value: totalCount,
      helper: `${closedCount} closed`,
      icon: Briefcase,
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Live Now',
      value: activeCount,
      helper: closingSoon ? `${closingSoon} closing soon` : 'No urgent deadlines',
      icon: Radio,
      accent: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Drafts',
      value: draftCount,
      helper: 'Ready to tune',
      icon: Clock3,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Avg Duration',
      value: avgDuration,
      suffix: 'm',
      helper: 'Interview length',
      icon: Activity,
      accent: 'from-indigo-500 to-violet-500',
    },
  ];

  const quickActions = [
    {
      to: '/assessments',
      icon: Sparkles,
      title: 'Launch Campaign',
      desc: 'Create a role, upload a JD, and generate an interview plan.',
      cta: 'Build assessment',
      tone: 'emerald',
    },
    {
      to: '/candidates',
      icon: FileSpreadsheet,
      title: 'Import Candidates',
      desc: 'Invite from CSV or add candidates one at a time.',
      cta: 'Open pipeline',
      tone: 'cyan',
    },
    {
      to: '/evaluations',
      icon: Target,
      title: 'Review Decisions',
      desc: 'Compare scores, narratives, strengths, and concerns.',
      cta: 'Review outcomes',
      tone: 'indigo',
    },
  ];

  return (
    <div className="ibot-scrollbar flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1 animate-fadeIn">
      <section className="ibot-command-panel grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Command center
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
              {activeCount} active / {totalCount} total
            </span>
          </div>
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
            Good to see you, {firstName}.
          </h2>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            A compact view of interview campaigns, upcoming deadlines, and the
            actions recruiters repeat most.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <NavLink
            to="/candidates"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
          >
            <Users className="h-4 w-4" />
            Candidates
          </NavLink>
          <NavLink
            to="/assessments"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-700/20 active:translate-y-0 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </NavLink>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="ibot-metric-card animate-slideUp"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    {stat.label}
                  </p>
                  {isLoading ? (
                    <div className="mt-3 h-9 w-20 rounded-lg ibot-shimmer" />
                  ) : (
                    <p className="mt-2 font-display text-4xl font-black text-slate-950">
                      {stat.value}
                      {stat.suffix && (
                        <span className="text-base text-slate-400">
                          {stat.suffix}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-xs font-bold text-slate-500">{stat.helper}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <NavLink
              key={action.title}
              to={action.to}
              className={`group ibot-action-card ibot-action-${action.tone} animate-slideUp`}
              style={{ animationDelay: `${0.1 + index * 0.04}s` }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:rotate-3">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-black text-slate-950">{action.title}</h2>
              <p className="mt-2 min-h-[42px] text-sm font-semibold leading-relaxed text-slate-500">
                {action.desc}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-black text-slate-800">
                  {action.cta}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-800 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </NavLink>
          );
        })}
      </section>

      <section className="grid min-h-[350px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <div className="ibot-panel flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-slate-950">
                Active Campaigns
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Upcoming windows sorted by closest deadline.
              </p>
            </div>
            <NavLink
              to="/assessments"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              View all
            </NavLink>
          </div>

          <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-24 rounded-xl ibot-shimmer" />
                ))}
              </div>
            ) : activeAssessments.length === 0 ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                <Briefcase className="mb-3 h-9 w-9 text-slate-300" />
                <p className="text-sm font-black text-slate-800">
                  No active campaigns yet
                </p>
                <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
                  Launch a campaign when you are ready to start inviting candidates.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {activeAssessments.map((assessment) => {
                  const remaining = daysUntil(assessment.window_end);
                  return (
                    <NavLink
                      key={assessment.id}
                      to="/assessments"
                      className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 group-hover:text-emerald-700">
                            {assessment.title}
                          </p>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {assessment.role_name}
                          </p>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                          Live
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="font-black text-slate-400">Duration</p>
                          <p className="mt-1 font-black text-slate-800">
                            {assessment.interview_duration_mins}m
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="font-black text-slate-400">Closes</p>
                          <p className="mt-1 font-black text-slate-800">
                            {formatDate(assessment.window_end)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="font-black text-slate-400">Window</p>
                          <p
                            className={`mt-1 font-black ${
                              remaining <= 1 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {remaining <= 0 ? 'Today' : `${remaining}d`}
                          </p>
                        </div>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="ibot-panel flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-slate-200/70 px-5 py-4">
            <h2 className="text-sm font-black text-slate-950">
              Recent Campaign Activity
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Latest assessment records and status movement.
            </p>
          </div>
          <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-16 rounded-xl ibot-shimmer" />
                ))}
              </div>
            ) : recentAssessments.length === 0 ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                <CalendarDays className="mb-3 h-9 w-9 text-slate-300" />
                <p className="text-sm font-black text-slate-800">
                  Nothing to show yet
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  New campaigns will appear here as they are created.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-emerald-300 transition-all duration-200 group-hover:bg-emerald-600 group-hover:text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-black text-slate-900">
                          {assessment.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${statusClasses(
                            assessment.status,
                          )}`}
                        >
                          {assessment.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                        {assessment.role_name} - closes{' '}
                        {formatDate(assessment.window_end)}
                      </p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-slate-300 transition-all group-hover:text-emerald-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
