import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useAssessments, useCandidates, useRecruiterEvaluations } from '../../../hooks/queries';
import type { RecruiterEvaluationListItem } from '../../../types/candidate.types';
import { decisionMeta, recommendationMeta, scoreTextClass } from './evaluationUiUtils';
import { StatusPill } from './EvaluationUI';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const daysUntil = (value: string) =>
  Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);

const pluralize = (value: number, singular: string, plural = `${singular}s`) =>
  `${value} ${value === 1 ? singular : plural}`;

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: assessments = [], isLoading: assessmentsLoading } = useAssessments();
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates('all');
  const { data: evaluations = [], isLoading: evaluationsLoading } = useRecruiterEvaluations();

  const loading = assessmentsLoading || candidatesLoading || evaluationsLoading;
  const firstName = user?.full_name?.split(' ')[0] || 'Recruiter';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const {
    activeAssessments,
    totalCandidates,
    pendingDecisionCount,
    closingSoonCount,
    recentEvaluations,
    pipelineStages,
    stats,
    priorityTitle,
    priorityCopy,
  } = useMemo(() => {
    const active = assessments
      .filter((assessment) => assessment.status === 'ACTIVE')
      .sort(
        (left, right) =>
          new Date(left.window_end).getTime() - new Date(right.window_end).getTime(),
      );

    const total = candidates.length;
    const inProgress = candidates.filter(
      (candidate) => candidate.status === 'IN_PROGRESS',
    ).length;
    const invited = candidates.filter((candidate) =>
      ['INVITED', 'WAITING_ROOM'].includes(candidate.status),
    ).length;
    const completed = candidates.filter(
      (candidate) => candidate.status === 'COMPLETED',
    ).length;
    const evaluated = candidates.filter(
      (candidate) => candidate.status === 'EVALUATED',
    ).length;
    const pending = evaluations.filter(
      (evaluation) => evaluation.recruiter_decision === 'PENDING',
    ).length;
    const hired = evaluations.filter(
      (evaluation) => evaluation.recruiter_decision === 'APPROVED',
    ).length;
    const closingSoon = active.filter(
      (assessment) => daysUntil(assessment.window_end) <= 3,
    ).length;

    const recent = [...evaluations]
      .sort(
        (left, right) =>
          new Date(right.generated_at).getTime() - new Date(left.generated_at).getTime(),
      )
      .slice(0, 3);

    const stages = [
      {
        label: 'Invited',
        value: invited,
        color: 'bg-slate-500',
        card: 'border-slate-200 bg-slate-50/80',
        text: 'text-slate-700',
      },
      {
        label: 'Interviewing',
        value: inProgress,
        color: 'bg-cyan-500',
        card: 'border-cyan-100 bg-cyan-50/75',
        text: 'text-cyan-700',
      },
      {
        label: 'Awaiting evaluation',
        value: completed,
        color: 'bg-indigo-500',
        card: 'border-indigo-100 bg-indigo-50/75',
        text: 'text-indigo-700',
      },
      {
        label: 'Evaluated',
        value: evaluated,
        color: 'bg-emerald-500',
        card: 'border-emerald-100 bg-emerald-50/75',
        text: 'text-emerald-700',
      },
    ];

    const dashboardStats = [
      {
        label: 'Active campaigns',
        value: active.length,
        helper: `${assessments.length} total campaigns`,
        icon: BriefcaseBusiness,
        to: '/assessments',
        card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
        iconClass: 'bg-emerald-600 text-white shadow-emerald-200',
        valueClass: 'text-emerald-800',
      },
      {
        label: 'Candidates',
        value: total,
        helper: `${inProgress} interviewing now`,
        icon: Users,
        to: '/candidates',
        card: 'border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-sky-50',
        iconClass: 'bg-cyan-600 text-white shadow-cyan-200',
        valueClass: 'text-cyan-800',
      },
      {
        label: 'Evaluation reports',
        value: evaluations.length,
        helper: `${hired} hired`,
        icon: FileCheck2,
        to: '/evaluations',
        card: 'border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50',
        iconClass: 'bg-indigo-600 text-white shadow-indigo-200',
        valueClass: 'text-indigo-800',
      },
      {
        label: 'Pending decisions',
        value: pending,
        helper: pending > 0 ? 'Recruiter review required' : 'All caught up',
        icon: ClipboardCheck,
        to: '/evaluations',
        card: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50',
        iconClass: 'bg-amber-500 text-white shadow-amber-200',
        valueClass: 'text-amber-800',
      },
    ];

    const title =
      pending > 0
        ? `${pluralize(pending, 'hiring decision')} ready for review`
        : active.length > 0
          ? 'Your hiring workspace is on track'
          : 'Launch your first hiring campaign';

    const copy =
      pending > 0
        ? 'Review completed evaluations while interview evidence is fresh and move the strongest candidates forward.'
        : active.length > 0
          ? 'Monitor campaign deadlines and candidate movement from one focused workspace.'
          : 'Create an assessment to begin inviting and evaluating candidates.';

    return {
      activeAssessments: active,
      totalCandidates: total,
      inProgressCount: inProgress,
      invitedCount: invited,
      completedCount: completed,
      evaluatedCount: evaluated,
      pendingDecisionCount: pending,
      hiredCount: hired,
      closingSoonCount: closingSoon,
      recentEvaluations: recent,
      pipelineStages: stages,
      stats: dashboardStats,
      priorityTitle: title,
      priorityCopy: copy,
    };
  }, [assessments, candidates, evaluations]);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/20 bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-900 shadow-xl shadow-slate-900/15">
        <div className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:30px_30px]" />

        <div className="relative flex min-h-[96px] items-center justify-between gap-6 px-5 py-3.5 lg:px-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              {greeting}, {firstName}
            </p>
            <h2 className="mt-1.5 truncate font-display text-xl font-black tracking-tight text-white lg:text-2xl">
              {priorityTitle}
            </h2>
            <p className="mt-1 max-w-2xl truncate text-[11px] font-medium text-slate-300 lg:text-xs">
              {priorityCopy}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NavLink
              to="/assessments"
              className="hidden h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 text-[10px] font-black text-white transition-colors hover:bg-white/15 sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" />
              New assessment
            </NavLink>
            <NavLink
              to={pendingDecisionCount > 0 ? '/evaluations' : '/candidates'}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 text-[10px] font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition-colors hover:bg-emerald-300"
            >
              {pendingDecisionCount > 0 ? <UserCheck className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
              {pendingDecisionCount > 0 ? 'Review decisions' : 'Open candidates'}
              <ArrowRight className="h-3 w-3" />
            </NavLink>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <NavLink
              key={stat.label}
              to={stat.to}
              className={`group flex min-h-[82px] items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-sm transition-colors hover:border-emerald-200 hover:shadow-md ${stat.card}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg ${stat.iconClass}`}>
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                  {stat.label}
                </p>
                {loading ? (
                  <div className="mt-1.5 h-6 w-12 rounded ibot-shimmer" />
                ) : (
                  <p className={`mt-0.5 font-display text-2xl font-black ${stat.valueClass}`}>
                    {stat.value}
                  </p>
                )}
                <p className="truncate text-[9px] font-semibold text-slate-500">{stat.helper}</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </NavLink>
          );
        })}
      </section>

      <section className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <article className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-white via-sky-50/35 to-indigo-50/45 shadow-sm">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-cyan-100 bg-gradient-to-r from-cyan-50/90 via-white to-indigo-50/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-200">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-950">Candidate pipeline</h3>
                <p className="mt-0.5 text-[10px] font-semibold text-cyan-700">Movement and recently completed intelligence</p>
              </div>
            </div>
            <NavLink
              to="/candidates"
              className="inline-flex items-center gap-1 text-[9px] font-black text-cyan-700 transition-colors hover:text-cyan-900"
            >
              Open pipeline <ArrowRight className="h-3 w-3" />
            </NavLink>
          </header>

          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2.5 p-3">
            <div className="grid grid-cols-4 gap-2">
              {pipelineStages.map((stage) => {
                const percentage = totalCandidates
                  ? Math.max((stage.value / totalCandidates) * 100, stage.value > 0 ? 5 : 0)
                  : 0;
                return (
                  <div key={stage.label} className={`min-w-0 rounded-xl border px-3 py-2.5 ${stage.card}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[9px] font-black text-slate-500">{stage.label}</p>
                      <span className={`text-base font-black ${stage.text}`}>{loading ? '–' : stage.value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-700 ${stage.color}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
              <div className="flex shrink-0 items-center justify-between border-b border-indigo-100 bg-indigo-50/50 px-3.5 py-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-800">Recent evaluations</p>
                </div>
                <NavLink to="/evaluations" className="text-[9px] font-black text-indigo-600 hover:text-indigo-800">
                  View all
                </NavLink>
              </div>

              {evaluationsLoading ? (
                <div className="grid min-h-0 flex-1 grid-rows-3 gap-2 p-2.5">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="rounded-lg ibot-shimmer" />
                  ))}
                </div>
              ) : recentEvaluations.length === 0 ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
                  <FileCheck2 className="h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-[10px] font-black text-slate-700">No evaluation reports yet</p>
                  <p className="mt-1 text-[9px] text-slate-400">Completed interview reports will appear here.</p>
                </div>
              ) : (
                <div
                  className="grid min-h-0 flex-1 divide-y divide-slate-100"
                  style={{
                    gridTemplateRows: `repeat(${recentEvaluations.length}, minmax(0, 1fr))`,
                  }}
                >
                  {recentEvaluations.map((evaluation) => (
                    <EvaluationRow key={evaluation.candidate_assessment_id} evaluation={evaluation} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/30 to-rose-50/35 shadow-sm md:flex">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50/90 via-white to-rose-50/70 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200">
                <CalendarClock className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-950">Campaign deadlines</h3>
                <p className="mt-0.5 text-[10px] font-semibold text-amber-700">Windows requiring attention soonest</p>
              </div>
            </div>
            {closingSoonCount > 0 && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[8px] font-black text-rose-700">
                {closingSoonCount} urgent
              </span>
            )}
          </header>

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-2.5 p-3">
            {assessmentsLoading ? (
              <div className="grid min-h-0 grid-rows-3 gap-2">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="rounded-xl ibot-shimmer" />
                ))}
              </div>
            ) : activeAssessments.length === 0 ? (
              <div className="flex min-h-0 flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-white/70 p-4 text-center">
                <BriefcaseBusiness className="h-7 w-7 text-slate-300" />
                <p className="mt-2 text-[10px] font-black text-slate-700">No active campaigns</p>
                <p className="mt-1 text-[9px] text-slate-400">Activate an assessment to begin.</p>
              </div>
            ) : (
              <div
                className="grid min-h-0 gap-1.5"
                style={{
                  gridTemplateRows: `repeat(${Math.min(activeAssessments.length, 3)}, minmax(0, 1fr))`,
                }}
              >
                {activeAssessments.slice(0, 3).map((assessment) => (
                  <DeadlineRow
                    key={assessment.id}
                    title={assessment.title}
                    role={assessment.role_name}
                    endDate={assessment.window_end}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 border-t border-amber-100 pt-2.5">
              {[
                {
                  to: '/evaluations',
                  icon: UserCheck,
                  label: 'Review decisions',
                  sub: `${pendingDecisionCount} pending`,
                  classes: 'border-rose-100 bg-rose-50/80 text-rose-700 hover:border-rose-200',
                },
                {
                  to: '/assessments',
                  icon: CheckCircle2,
                  label: 'Manage campaigns',
                  sub: `${activeAssessments.length} active`,
                  classes: 'border-emerald-100 bg-emerald-50/80 text-emerald-700 hover:border-emerald-200',
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <NavLink
                    key={action.label}
                    to={action.to}
                    className={`group flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${action.classes}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-black text-slate-800">{action.label}</span>
                      <span className="mt-0.5 block truncate text-[9px] font-semibold opacity-70">{action.sub}</span>
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

const EvaluationRow: React.FC<{ evaluation: RecruiterEvaluationListItem }> = ({ evaluation }) => {
  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const decision = decisionMeta(evaluation.recruiter_decision);
  const initials =
    evaluation.candidate_name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'C';

  return (
    <NavLink
      to={`/candidates/${evaluation.candidate_assessment_id}/report`}
      className="group grid min-h-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 transition-colors hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
      aria-label={`Open ${evaluation.candidate_name}'s evaluation report`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[10px] font-black text-emerald-300">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black text-slate-900 group-hover:text-indigo-800">
            {evaluation.candidate_name}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[9px] font-semibold text-slate-500">{evaluation.role_name}</span>
            <span className="hidden lg:inline-flex"><StatusPill {...recommendation} /></span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`text-sm font-black ${scoreTextClass(evaluation.overall_score)}`}>
          {evaluation.overall_score.toFixed(1)}
        </span>
        <span className="hidden xl:inline-flex"><StatusPill {...decision} /></span>
        <span className="flex h-7 items-center gap-1 rounded-lg px-2 text-[9px] font-black text-indigo-600 transition-colors group-hover:bg-indigo-50">
          Open
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </NavLink>
  );
};

const DeadlineRow: React.FC<{
  title: string;
  role: string;
  endDate: string;
}> = ({ title, role, endDate }) => {
  const remaining = daysUntil(endDate);
  const urgent = remaining <= 1;
  const warning = remaining <= 3;

  return (
    <NavLink
      to="/assessments"
      className={`group grid min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-white px-3 py-2 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
        urgent
          ? 'border-rose-200'
          : warning
            ? 'border-amber-200'
            : 'border-slate-200'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        urgent
          ? 'bg-rose-50 text-rose-600'
          : warning
            ? 'bg-amber-50 text-amber-600'
            : 'bg-emerald-50 text-emerald-700'
      }`}>
        {urgent ? <AlertTriangle className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-black text-slate-900 group-hover:text-emerald-800">{title}</span>
        <span className="mt-0.5 block truncate text-[9px] font-semibold text-slate-500">
          {role} · closes {formatDate(endDate)}
        </span>
      </span>
      <span className={`rounded-lg px-2 py-1 text-[9px] font-black ${
        urgent
          ? 'bg-rose-50 text-rose-700'
          : warning
            ? 'bg-amber-50 text-amber-700'
            : 'bg-slate-100 text-slate-600'
      }`}>
        {remaining <= 0 ? 'Today' : pluralize(remaining, 'day')}
      </span>
    </NavLink>
  );
};
