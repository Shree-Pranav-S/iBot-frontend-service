import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Plus,
  Radio,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  useAssessments,
  useCandidates,
  useRecruiterEvaluations,
} from '../../../hooks/queries';
import type { RecruiterEvaluationListItem } from '../../../types/candidate.types';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const decisionLabel = (
  decision: RecruiterEvaluationListItem['recruiter_decision'],
) => {
  if (decision === 'APPROVED') return 'Approved';
  if (decision === 'REJECTED') return 'Rejected';
  return 'Decision pending';
};

const decisionClasses = (
  decision: RecruiterEvaluationListItem['recruiter_decision'],
) => {
  if (decision === 'APPROVED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (decision === 'REJECTED') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  return 'border-amber-200 bg-amber-50 text-amber-700';
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: assessments = [], isLoading: assessmentsLoading } =
    useAssessments();
  const { data: candidates = [], isLoading: candidatesLoading } =
    useCandidates('all');
  const { data: evaluations = [], isLoading: evaluationsLoading } =
    useRecruiterEvaluations();

  const firstName = user?.full_name?.split(' ')[0] || 'Recruiter';
  const activeAssessments = assessments
    .filter((assessment) => assessment.status === 'ACTIVE')
    .sort(
      (a, b) =>
        new Date(a.window_end).getTime() - new Date(b.window_end).getTime(),
    );

  const inProgressCount = candidates.filter(
    (candidate) => candidate.status === 'IN_PROGRESS',
  ).length;
  const invitedCount = candidates.filter((candidate) =>
    ['INVITED', 'WAITING_ROOM'].includes(candidate.status),
  ).length;
  const completedCount = candidates.filter(
    (candidate) => candidate.status === 'COMPLETED',
  ).length;
  const evaluatedCandidateCount = candidates.filter(
    (candidate) => candidate.status === 'EVALUATED',
  ).length;
  const pendingDecisionCount = evaluations.filter(
    (evaluation) => evaluation.recruiter_decision === 'PENDING',
  ).length;
  const approvedCount = evaluations.filter(
    (evaluation) => evaluation.recruiter_decision === 'APPROVED',
  ).length;
  const closingSoonCount = activeAssessments.filter(
    (assessment) => daysUntil(assessment.window_end) <= 3,
  ).length;
  const recentEvaluations = [...evaluations]
    .sort(
      (a, b) =>
        new Date(b.generated_at).getTime() -
        new Date(a.generated_at).getTime(),
    )
    .slice(0, 3);

  const stats = [
    {
      label: 'Active campaigns',
      value: activeAssessments.length,
      helper: `${assessments.length} total campaigns`,
      icon: BriefcaseBusiness,
      tone: 'emerald',
    },
    {
      label: 'Candidates',
      value: candidates.length,
      helper: `${inProgressCount} interviewing now`,
      icon: Users,
      tone: 'cyan',
    },
    {
      label: 'Evaluated reports',
      value: evaluations.length,
      helper: `${approvedCount} approved`,
      icon: FileCheck2,
      tone: 'indigo',
    },
    {
      label: 'Decisions pending',
      value: pendingDecisionCount,
      helper:
        pendingDecisionCount > 0 ? 'Recruiter review required' : 'All caught up',
      icon: ClipboardCheck,
      tone: 'amber',
    },
  ] as const;

  const pipelineStages = [
    {
      label: 'Invited',
      value: invitedCount,
      color: 'bg-slate-400',
    },
    {
      label: 'Interviewing',
      value: inProgressCount,
      color: 'bg-cyan-500',
    },
    {
      label: 'Awaiting evaluation',
      value: completedCount,
      color: 'bg-indigo-500',
    },
    {
      label: 'Evaluated',
      value: evaluatedCandidateCount,
      color: 'bg-emerald-500',
    },
  ];

  const loading =
    assessmentsLoading || candidatesLoading || evaluationsLoading;

  return (
    <div className="ibot-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-y-auto pb-1 animate-fadeIn xl:overflow-hidden xl:pb-0">
      <section className="ibot-dashboard-hero shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
        <div className="relative z-10 flex h-full flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Welcome back, {firstName}
            </div>
            <h2 className="mt-1.5 text-xl font-bold tracking-[-0.025em] text-slate-950 lg:text-2xl">
              Your hiring pipeline, at a glance
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Review campaign activity, completed reports, and decisions that
              need attention.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {closingSoonCount > 0 && (
              <div className="mr-1 hidden items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800 lg:flex">
                <CalendarClock className="h-4 w-4" />
                {pluralize(closingSoonCount, 'campaign')} closing soon
              </div>
            )}
            <NavLink
              to="/candidates"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.98]"
            >
              <Users className="h-4 w-4" />
              View candidates
            </NavLink>
            <NavLink
              to="/assessments"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3.5 text-xs font-semibold text-white shadow-md shadow-slate-900/15 transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New assessment
            </NavLink>
          </div>
        </div>
      </section>

      <section className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className={`ibot-dashboard-metric ibot-dashboard-metric-${stat.tone} animate-slideUp`}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`ibot-dashboard-metric-icon ibot-dashboard-metric-icon-${stat.tone}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">
                    {stat.label}
                  </p>
                  {loading ? (
                    <div className="mt-2 h-7 w-14 rounded-md ibot-shimmer" />
                  ) : (
                    <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950">
                      {stat.value}
                    </p>
                  )}
                  <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                    {stat.helper}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid min-h-[600px] flex-1 gap-3 xl:min-h-0 xl:grid-cols-[minmax(0,1.18fr)_minmax(330px,0.82fr)]">
        <article className="ibot-panel flex min-h-0 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Candidate pipeline
              </h3>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                Current distribution and latest completed evaluations
              </p>
            </div>
            <NavLink
              to="/candidates"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Open pipeline
              <ArrowRight className="h-3.5 w-3.5" />
            </NavLink>
          </header>

          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 p-3.5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {pipelineStages.map((stage) => {
                const percentage =
                  candidates.length > 0
                    ? Math.max(4, (stage.value / candidates.length) * 100)
                    : 0;
                return (
                  <div
                    key={stage.label}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[9px] font-semibold text-slate-500">
                        {stage.label}
                      </p>
                      <span className="text-sm font-bold text-slate-900">
                        {loading ? '-' : stage.value}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className={`h-full rounded-full ${stage.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="min-h-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Recent evaluations
                </p>
                <NavLink
                  to="/evaluations"
                  className="text-[10px] font-semibold text-slate-500 transition-colors hover:text-emerald-700"
                >
                  View all
                </NavLink>
              </div>

              {evaluationsLoading ? (
                <div className="grid gap-2 p-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-12 rounded-lg ibot-shimmer" />
                  ))}
                </div>
              ) : recentEvaluations.length === 0 ? (
                <div className="flex h-[150px] flex-col items-center justify-center px-5 text-center">
                  <FileCheck2 className="h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    No evaluation reports yet
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Completed interview reports will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentEvaluations.map((evaluation) => (
                    <NavLink
                      key={evaluation.candidate_assessment_id}
                      to={`/candidates/${evaluation.candidate_assessment_id}/report`}
                      className="group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-emerald-800">
                          {evaluation.candidate_name}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-slate-400">
                          {evaluation.role_name} ·{' '}
                          {formatDateTime(evaluation.generated_at)}
                        </p>
                      </div>
                      <span
                        className={`hidden rounded-full border px-2 py-1 text-[9px] font-semibold sm:inline-flex ${decisionClasses(
                          evaluation.recruiter_decision,
                        )}`}
                      >
                        {decisionLabel(evaluation.recruiter_decision)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {evaluation.overall_score.toFixed(1)}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                      </div>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="ibot-panel flex min-h-0 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Upcoming deadlines
              </h3>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                Active interview windows closing first
              </p>
            </div>
            <CalendarClock className="h-4 w-4 text-slate-400" />
          </header>

          <div className="flex min-h-0 flex-1 flex-col p-3.5">
            {assessmentsLoading ? (
              <div className="grid gap-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-14 rounded-xl ibot-shimmer" />
                ))}
              </div>
            ) : activeAssessments.length === 0 ? (
              <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <BriefcaseBusiness className="h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  No active campaigns
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Activate an assessment to begin receiving candidates.
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 divide-y divide-slate-100 overflow-y-auto pr-2">
                {activeAssessments.slice(0, 4).map((assessment) => {
                  const remaining = daysUntil(assessment.window_end);
                  const urgent = remaining <= 1;
                  return (
                    <NavLink
                      key={assessment.id}
                      to="/assessments"
                      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-1.5 last:pb-1.5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                        <Radio className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-emerald-800">
                          {assessment.title}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-slate-400">
                          {assessment.role_name} · closes{' '}
                          {formatDate(assessment.window_end)}
                        </p>
                      </div>
                      <span
                        className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${
                          urgent
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {remaining <= 0
                          ? 'Today'
                          : pluralize(remaining, 'day')}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            )}

            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <NavLink
                to="/evaluations"
                className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold text-slate-800">
                    Review decisions
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-400">
                    {pendingDecisionCount} pending
                  </p>
                </div>
              </NavLink>
              <NavLink
                to="/assessments"
                className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold text-slate-800">
                    Manage campaigns
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-400">
                    {activeAssessments.length} active
                  </p>
                </div>
              </NavLink>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};
