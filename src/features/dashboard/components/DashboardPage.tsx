import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  ListChecks,
  Plus,
  Radio,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useAssessments, useCandidates, useRecruiterEvaluations } from '../../../hooks/queries';
import type { RecruiterEvaluationListItem } from '../../../types/candidate.types';
import {
  clampScore,
  decisionMeta,
  recommendationMeta,
  scoreTextClass,
} from './evaluationUiUtils';

const DAY_IN_MS = 86_400_000;

const daysUntil = (value: string) =>
  Math.ceil((new Date(value).getTime() - Date.now()) / DAY_IN_MS);

const pluralize = (value: number, singular: string, plural = `${singular}s`) =>
  `${value} ${value === 1 ? singular : plural}`;

// Hard caps keep the page within one viewport — re-check the no-scroll
// guarantee on a 1024x700 window before raising these.
const MAX_RECENT_EVALUATIONS = 3;
const MAX_DEADLINES = 2;

const heroClass = 'dashboard-surface-hero';
const kpiClass = 'dashboard-surface-kpi';
const panelClass = 'dashboard-surface-panel';

const kpiIconTones = [
  { well: 'bg-brand-soft text-brand-hover', hover: 'group-hover:bg-[#EAD7BE]' },
  { well: 'bg-brand-soft text-brand-hover', hover: 'group-hover:bg-[#EAD7BE]' },
  { well: 'bg-brand-soft text-brand-hover', hover: 'group-hover:bg-[#EAD7BE]' },
  { well: 'bg-amber-100 text-amber-700', hover: 'group-hover:bg-amber-200' },
] as const;

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: assessments = [], isLoading: assessmentsLoading } = useAssessments();
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates('all');
  const { data: evaluations = [], isLoading: evaluationsLoading } = useRecruiterEvaluations();

  const loading = assessmentsLoading || candidatesLoading || evaluationsLoading;
  const firstName = user?.full_name?.split(' ')[0] || 'Recruiter';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dashboard = useMemo(() => {
    const activeAssessments = assessments
      .filter((assessment) => assessment.status === 'ACTIVE')
      .sort(
        (left, right) =>
          new Date(left.window_end).getTime() - new Date(right.window_end).getTime(),
      );

    const stageCounts = {
      invited: candidates.filter((candidate) =>
        ['INVITED', 'WAITING_ROOM'].includes(candidate.status),
      ).length,
      interviewing: candidates.filter(
        (candidate) => candidate.status === 'IN_PROGRESS',
      ).length,
      awaitingEvaluation: candidates.filter(
        (candidate) => candidate.status === 'COMPLETED',
      ).length,
      evaluated: candidates.filter(
        (candidate) => candidate.status === 'EVALUATED',
      ).length,
    };

    const pendingDecisions = evaluations.filter(
      (evaluation) => evaluation.recruiter_decision === 'PENDING',
    ).length;
    const approvedDecisions = evaluations.filter(
      (evaluation) => evaluation.recruiter_decision === 'APPROVED',
    ).length;
    const rejectedDecisions = evaluations.filter(
      (evaluation) => evaluation.recruiter_decision === 'REJECTED',
    ).length;
    const closingSoon = activeAssessments.filter(
      (assessment) => daysUntil(assessment.window_end) <= 3,
    ).length;
    const completedInterviews = stageCounts.awaitingEvaluation + stageCounts.evaluated;
    const completionRate = candidates.length
      ? Math.round((completedInterviews / candidates.length) * 100)
      : 0;
    const averageScore = evaluations.length
      ? evaluations.reduce((sum, evaluation) => sum + clampScore(evaluation.overall_score), 0) /
        evaluations.length
      : 0;

    const recentEvaluations = [...evaluations]
      .sort(
        (left, right) =>
          new Date(right.generated_at).getTime() - new Date(left.generated_at).getTime(),
      )
      .slice(0, MAX_RECENT_EVALUATIONS);

    const pipelineStages = [
      {
        label: 'Invited',
        description: 'Invitation sent',
        value: stageCounts.invited,
        barClass: 'bg-[#D9B47B]',
      },
      {
        label: 'Interviewing',
        value: stageCounts.interviewing,
        barClass: 'bg-brand-accent',
        live: true,
      },
      {
        label: 'Awaiting report',
        value: stageCounts.awaitingEvaluation,
        barClass: 'bg-brand-hover',
      },
      {
        label: 'Evaluated',
        value: stageCounts.evaluated,
        barClass: 'bg-brand-charcoal',
      },
    ];

    const stats = [
      {
        label: 'Active assessments',
        value: activeAssessments.length,
        icon: BriefcaseBusiness,
        to: '/assessments',
        attention: closingSoon > 0,
      },
      {
        label: 'Candidates',
        value: candidates.length,
        icon: Users,
        to: '/candidates',
      },
      {
        label: 'Interview completion',
        value: `${completionRate}%`,
        icon: TrendingUp,
        to: '/candidates',
      },
      {
        label: 'Pending decisions',
        value: pendingDecisions,
        icon: ListChecks,
        to: '/evaluations',
        attention: pendingDecisions > 0,
      },
    ];

    const priority =
      pendingDecisions > 0
        ? {
            title: `${pluralize(pendingDecisions, 'decision')} ready for review`,
          }
        : closingSoon > 0
          ? {
              title: `${pluralize(closingSoon, 'assessment')} closing soon`,
            }
          : activeAssessments.length > 0
            ? {
                title: 'Your hiring pipeline is on track',
              }
            : {
                title: 'Build your first interview assessment',
              };

    return {
      activeAssessments,
      averageScore,
      approvedDecisions,
      closingSoon,
      completionRate,
      pipelineStages,
      pendingDecisions,
      priority,
      recentEvaluations,
      rejectedDecisions,
      stageCounts,
      stats,
    };
  }, [assessments, candidates, evaluations]);

  const maxPipelineValue = Math.max(
    1,
    ...dashboard.pipelineStages.map((stage) => stage.value),
  );
  const heroTarget = dashboard.pendingDecisions > 0 ? '/evaluations' : '/candidates';
  const priorityTarget = dashboard.pendingDecisions > 0 ? '/evaluations' : '/assessments';

  const openSection =
    (to: string) => (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest('a, button')) return;
      if ('key' in event && event.key !== 'Enter' && event.key !== ' ') return;
      if ('key' in event) event.preventDefault();
      navigate(to);
    };

  return (
    <div className="dashboard-viewport h-full min-h-0 overflow-hidden">
      <div className="mx-auto grid h-full w-full max-w-[1680px] grid-rows-[auto_auto_minmax(0,1fr)] gap-2.5">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section
          className={`dashboard-card dashboard-enter relative cursor-pointer overflow-hidden ${heroClass}`}
          role="link"
          tabIndex={0}
          aria-label={`Open ${dashboard.pendingDecisions > 0 ? 'evaluations' : 'candidates'}`}
          data-dashboard-destination={heroTarget}
          onClick={openSection(heroTarget)}
          onKeyDown={openSection(heroTarget)}
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] bg-[radial-gradient(circle_at_84%_30%,rgba(185,131,63,0.14),transparent_62%)] lg:block" />
          <div className="relative flex flex-col justify-between gap-2.5 px-5 py-2.5 sm:flex-row sm:items-center lg:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <p className="flex items-center gap-2 text-[11px] font-semibold text-brand-hover">
                  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-40" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-hover" />
                  </span>
                  {greeting}, {firstName}
                </p>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h2 className="font-display text-lg font-extrabold tracking-[-0.035em] text-slate-950">
                  {dashboard.priority.title}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <NavLink
                to="/assessments"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-default bg-white px-3.5 text-xs font-semibold text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                <Plus className="h-4 w-4 text-slate-400" />
                New assessment
              </NavLink>
              <NavLink
                to={dashboard.pendingDecisions > 0 ? '/evaluations' : '/candidates'}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-brand-charcoal px-3.5 text-xs font-semibold text-white shadow-[0_8px_18px_-12px_rgba(36,33,29,0.65)] transition-all hover:-translate-y-0.5 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
              >
                {dashboard.pendingDecisions > 0 ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                {dashboard.pendingDecisions > 0 ? 'Review decisions' : 'View candidates'}
                <ArrowRight className="h-3.5 w-3.5" />
              </NavLink>
            </div>
          </div>
        </section>

        {/* ── KPI strip (single segmented card) ────────────────────────── */}
        <section
          className={`dashboard-card grid grid-cols-2 overflow-hidden lg:grid-cols-4 ${kpiClass}`}
          style={{ animationDelay: '80ms' }}
          aria-label="Hiring overview"
        >
          {dashboard.stats.map((stat, index) => {
            const Icon = stat.icon;
            const tone = kpiIconTones[index] ?? kpiIconTones[0];
            return (
              <NavLink
                key={stat.label}
                to={stat.to}
                className={`group relative flex flex-col justify-center px-5 py-2.5 transition-all duration-200 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent xl:px-6 border-slate-200/60 ${
                  index % 2 === 1 ? 'border-l lg:border-l' : ''
                } ${index >= 2 ? 'border-t lg:border-t-0' : ''} ${
                  index > 0 ? 'lg:border-l' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    {stat.label}
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all group-hover:scale-105 ${tone.well} ${tone.hover}`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 transition-colors ${
                        stat.attention ? 'text-amber-600' : ''
                      }`}
                    />
                  </span>
                </div>
                {loading ? (
                  <span className="mt-2 block h-8 w-16 rounded-md ibot-shimmer" />
                ) : (
                  <span className="mt-1 block font-display text-[25px] font-extrabold leading-7 tracking-[-0.035em] text-slate-950">
                    {stat.value}
                  </span>
                )}
              </NavLink>
            );
          })}
        </section>

        {/* ── Panels row (fills remaining height) ──────────────────────── */}
        <section className="grid min-h-0 grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)_minmax(300px,0.82fr)]">
          {/* Candidate flow */}
          <article
            className={`dashboard-card dashboard-panel-candidate flex min-h-0 cursor-pointer flex-col overflow-hidden ${panelClass}`}
            style={{ animationDelay: '170ms' }}
            role="link"
            tabIndex={0}
            aria-label="Open candidate pipeline"
            data-dashboard-destination="/candidates"
            onClick={openSection('/candidates')}
            onKeyDown={openSection('/candidates')}
          >
            <PanelHeader
              title="Candidate flow"
              to="/candidates"
              action="Open pipeline"
              accentClass="dashboard-panel-accent-emerald"
            />

            <div className="grid min-h-0 flex-1 gap-5 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_116px]">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-1 flex-col justify-evenly gap-3">
                  {dashboard.pipelineStages.map((stage, index) => (
                    <div
                      key={stage.label}
                      className="grid grid-cols-[128px_minmax(0,1fr)_36px] items-center gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {stage.live && stage.value > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent dashboard-live-dot" />
                          )}
                          <p className="truncate text-[13px] font-semibold text-black">
                            {stage.label}
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/60">
                        {!loading && (
                          <div
                            className={`dashboard-pipeline-bar h-full rounded-full ${stage.barClass}`}
                            style={{
                              width: `${(stage.value / maxPipelineValue) * 100}%`,
                              animationDelay: `${240 + index * 90}ms`,
                            }}
                          />
                        )}
                      </div>
                      <p className="text-right font-display text-[15px] font-extrabold text-black">
                        {loading ? '—' : stage.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex shrink-0 items-center justify-between rounded-xl bg-white/80 px-4 py-2 ring-1 ring-inset ring-slate-200/80">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Interviews completed
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {dashboard.stageCounts.awaitingEvaluation + dashboard.stageCounts.evaluated}{' '}
                      of {candidates.length} candidates
                    </p>
                  </div>
                  <span className="font-display text-sm font-extrabold text-brand-hover">
                    {dashboard.completionRate}%
                  </span>
                </div>
              </div>

              <div className="hidden items-center justify-center border-l border-slate-100 pl-6 sm:flex">
                <CompletionGauge value={dashboard.completionRate} />
              </div>
            </div>
          </article>

          {/* Evaluation intelligence */}
          <article
            className={`dashboard-card dashboard-panel-evaluation flex min-h-0 cursor-pointer flex-col overflow-hidden ${panelClass}`}
            style={{ animationDelay: '210ms' }}
            role="link"
            tabIndex={0}
            aria-label="Open evaluations"
            data-dashboard-destination="/evaluations"
            onClick={openSection('/evaluations')}
            onKeyDown={openSection('/evaluations')}
          >
            <PanelHeader
              title="Evaluation intelligence"
              to="/evaluations"
              action="View all"
              accentClass="dashboard-panel-accent-indigo"
            />

            <div className="dashboard-score-band shrink-0 border-b border-slate-200/70 px-5 py-2.5">
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-[26px] font-extrabold leading-8 tracking-tight text-slate-950">
                    {evaluationsLoading ? '—' : dashboard.averageScore.toFixed(1)}
                  </p>
                  <p className="text-xs font-semibold text-slate-400">/ 10 average score</p>
                </div>
              </div>
              <DecisionMixBar
                pending={dashboard.pendingDecisions}
                approved={dashboard.approvedDecisions}
                rejected={dashboard.rejectedDecisions}
              />
            </div>

            {evaluationsLoading ? (
              <div className="grid min-h-0 flex-1 grid-rows-3 gap-3 p-5">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="rounded-xl ibot-shimmer" />
                ))}
              </div>
            ) : dashboard.recentEvaluations.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <FileCheck2 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[13px] font-semibold text-slate-700">
                  No evaluation reports yet
                </p>
                <p className="mt-1 max-w-[240px] text-xs leading-5 text-slate-400">
                  Completed interview reports will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-hidden">
                {dashboard.recentEvaluations.map((evaluation) => (
                  <EvaluationRow key={evaluation.candidate_assessment_id} evaluation={evaluation} />
                ))}
              </div>
            )}
          </article>

          {/* Priority queue */}
          <article
            className={`dashboard-card dashboard-panel-priority flex min-h-0 cursor-pointer flex-col overflow-hidden ${panelClass}`}
            style={{ animationDelay: '250ms' }}
            role="link"
            tabIndex={0}
            aria-label="Open priority queue"
            data-dashboard-destination={priorityTarget}
            onClick={openSection(priorityTarget)}
            onKeyDown={openSection(priorityTarget)}
          >
            <PanelHeader
              title="Priority queue"
              accentClass="dashboard-panel-accent-amber"
            />

            <div className="flex min-h-0 flex-1 flex-col px-4 py-2.5">
              <NavLink
                to="/evaluations"
                className={`group flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                  dashboard.pendingDecisions > 0
                    ? 'border-[#D7C2A8] bg-brand-soft/70 hover:bg-brand-soft'
                    : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                    dashboard.pendingDecisions > 0
                      ? 'bg-brand-charcoal text-white shadow-sm'
                      : 'bg-white text-brand-hover ring-1 ring-inset ring-slate-200'
                  }`}
                >
                  {dashboard.pendingDecisions > 0 ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-slate-800">
                    {dashboard.pendingDecisions > 0
                      ? 'Review hiring decisions'
                      : 'Decision queue is clear'}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </NavLink>

              {dashboard.stageCounts.interviewing > 0 && (
                <NavLink
                  to="/candidates"
                  className="mt-2.5 flex shrink-0 items-center gap-3 rounded-xl px-2.5 py-2 text-slate-600 transition-colors hover:bg-brand-soft"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-hover">
                    <Radio className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-semibold">
                    {pluralize(dashboard.stageCounts.interviewing, 'interview')} in progress
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-accent dashboard-live-dot" />
                </NavLink>
              )}

              <div className="mt-3 flex shrink-0 items-center justify-between px-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">
                  Campaign deadlines
                </p>
                {dashboard.closingSoon > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-100">
                    <CircleAlert className="h-3 w-3" />
                    {dashboard.closingSoon} soon
                  </span>
                )}
              </div>

              {assessmentsLoading ? (
                <div className="mt-2.5 grid min-h-0 flex-1 grid-rows-2 gap-2.5">
                  {[0, 1].map((item) => (
                    <div key={item} className="rounded-xl ibot-shimmer" />
                  ))}
                </div>
              ) : dashboard.activeAssessments.length === 0 ? (
                <div className="mt-2.5 flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
                  <CalendarClock className="h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-600">No active campaigns</p>
                  <NavLink
                    to="/assessments"
                    className="mt-1 text-[11px] font-bold text-brand-hover hover:text-brand-charcoal"
                  >
                    Create an assessment
                  </NavLink>
                </div>
              ) : (
                <div className="mt-1.5 flex min-h-0 flex-1 flex-col justify-start gap-1 overflow-hidden">
                  {dashboard.activeAssessments.slice(0, MAX_DEADLINES).map((assessment) => (
                    <DeadlineRow
                      key={assessment.id}
                      title={assessment.title}
                      endDate={assessment.window_end}
                    />
                  ))}
                </div>
              )}

              <NavLink
                to="/assessments"
                className="mt-auto inline-flex shrink-0 items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-hover"
              >
                Manage all assessments
                <ArrowRight className="h-3.5 w-3.5" />
              </NavLink>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

const PanelHeader: React.FC<{
  title: string;
  subtitle?: string;
  to?: string;
  action?: string;
  accentClass?: string;
}> = ({ title, subtitle, to, action, accentClass }) => (
  <header
    className={`flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-2.5 ${accentClass ?? ''}`}
  >
    <div className="min-w-0">
      <h3 className="truncate font-display text-sm font-bold tracking-[-0.01em] text-slate-900">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{subtitle}</p>
      ) : null}
    </div>
    {to && action && (
      <NavLink
        to={to}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-hover transition-colors hover:bg-brand-soft hover:text-brand-charcoal"
      >
        {action}
        <ArrowRight className="h-3.5 w-3.5" />
      </NavLink>
    )}
  </header>
);

const CompletionGauge: React.FC<{ value: number }> = ({ value }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));

  return (
    <div className="text-center">
      <div
        className="relative mx-auto h-[92px] w-[92px]"
        role="img"
        aria-label={`${progress}% interview completion`}
      >
        <svg className="h-full w-full -rotate-90" viewBox="0 0 92 92" aria-hidden="true">
          <circle cx="46" cy="46" r={radius} fill="none" stroke="#F4E8D6" strokeWidth="8" />
          <circle
            className="dashboard-gauge-ring"
            cx="46"
            cy="46"
            r={radius}
            fill="none"
            stroke="#B9833F"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg font-extrabold text-slate-950">{progress}%</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs font-semibold text-slate-700">Completion</p>
    </div>
  );
};

const DecisionMixBar: React.FC<{
  pending: number;
  approved: number;
  rejected: number;
}> = ({ pending, approved, rejected }) => {
  const total = pending + approved + rejected;
  const percent = (value: number) => (total ? (value / total) * 100 : 0);

  return (
    <div className="mt-2">
      <div
        className="flex h-1.5 gap-px overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={`${approved} hired, ${pending} pending, ${rejected} rejected`}
      >
        {total > 0 && (
          <>
            <span className="rounded-full bg-emerald-500" style={{ width: `${percent(approved)}%` }} />
            <span className="rounded-full bg-amber-400" style={{ width: `${percent(pending)}%` }} />
            <span className="rounded-full bg-rose-400" style={{ width: `${percent(rejected)}%` }} />
          </>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Hired {approved}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Pending {pending}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          Rejected {rejected}
        </span>
      </div>
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
      className="group flex items-center gap-3 px-6 py-3 transition-all duration-200 hover:bg-brand-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent"
      aria-label={`Open ${evaluation.candidate_name}'s evaluation report`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-extrabold text-brand-hover ring-1 ring-inset ring-default">
        {initials}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <p className="truncate text-[13px] font-semibold text-slate-900 group-hover:text-brand-hover">
          {evaluation.candidate_name}
        </p>
        <CompactStatus {...recommendation} />
        <span className="hidden 2xl:inline-flex">
          <CompactStatus {...decision} />
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={`font-display text-[15px] font-extrabold ${scoreTextClass(evaluation.overall_score)}`}
        >
          {clampScore(evaluation.overall_score).toFixed(1)}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-hover" />
      </div>
    </NavLink>
  );
};

const CompactStatus: React.FC<{
  label: string;
  className: string;
  dot: string;
}> = ({ label, className, dot }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-semibold ${className}`}
  >
    <span className={`h-1 w-1 rounded-full ${dot}`} />
    {label}
  </span>
);

const DeadlineRow: React.FC<{
  title: string;
  endDate: string;
}> = ({ title, endDate }) => {
  const remaining = daysUntil(endDate);
  const urgent = remaining <= 1;
  const warning = remaining <= 3;
  const deadlineLabel =
    remaining < 0
      ? `${Math.abs(remaining)}d overdue`
      : remaining === 0
        ? 'Today'
        : remaining === 1
          ? '1 day'
          : `${remaining} days`;

  return (
    <NavLink
      to="/assessments"
      className="group flex shrink-0 items-center gap-3 rounded-xl px-2.5 py-1.5 transition-all duration-200 hover:bg-white/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          urgent
            ? 'bg-rose-50 text-rose-600'
            : warning
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-500'
        }`}
      >
        {urgent ? <CircleAlert className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800 group-hover:text-brand-hover">
        {title}
      </span>
      <span
        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
          urgent
            ? 'bg-rose-50 text-rose-700'
            : warning
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-600'
        }`}
      >
        {deadlineLabel}
      </span>
    </NavLink>
  );
};
