import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileCheck2,
  Radio,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useAssessments, useCandidates, useRecruiterEvaluations } from '../../../hooks/queries';
import type {
  CandidateAssessmentListItem,
  RecruiterEvaluationListItem,
} from '../../../types/candidate.types';
import {
  buildAssessmentInstanceNumbers,
  formatAssessmentTitle,
} from '../utils/assessmentDisplay';
import { groupCandidatesByIdentity } from '../utils/candidateDisplay';
import { CenteredDialog } from './EvaluationUI';
import {
  candidateInitials,
  clampScore,
  recommendationMeta,
  scoreTextClass,
} from './evaluationUiUtils';

const DAY_IN_MS = 86_400_000;
const MAX_REVIEW_ITEMS = 3;
const MAX_DEADLINES = 2;

type PipelineStageKey = 'invited' | 'interviewing' | 'awaitingReport' | 'evaluated';

interface PipelineStage {
  key: PipelineStageKey;
  label: string;
  description: string;
  value: number;
  candidates: CandidateAssessmentListItem[];
  accent: string;
  surfaceClass: string;
  countClass: string;
  live?: boolean;
}

const daysUntil = (value: string) => {
  const today = new Date();
  const deadline = new Date(value);
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / DAY_IN_MS);
};

const pluralize = (value: number, singular: string, plural = `${singular}s`) =>
  `${value} ${value === 1 ? singular : plural}`;

const formatShare = (value: number, total: number) =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : '0%';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedStageKey, setSelectedStageKey] = useState<PipelineStageKey | null>(null);
  const {
    data: assessments = [],
    isLoading: assessmentsLoading,
    isFetching: assessmentsFetching,
    isError: assessmentsError,
    refetch: refetchAssessments,
  } = useAssessments();
  const {
    data: candidates = [],
    isLoading: candidatesLoading,
    isFetching: candidatesFetching,
    isError: candidatesError,
    refetch: refetchCandidates,
  } = useCandidates('all');
  const {
    data: evaluations = [],
    isLoading: evaluationsLoading,
    isFetching: evaluationsFetching,
    isError: evaluationsError,
    refetch: refetchEvaluations,
  } = useRecruiterEvaluations();

  const firstName = user?.full_name?.split(' ')[0] || 'Recruiter';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const assessmentInstanceNumbers = useMemo(
    () => buildAssessmentInstanceNumbers(assessments),
    [assessments],
  );

  const dashboard = useMemo(() => {
    const activeAssessments = assessments
      .filter((assessment) => assessment.status === 'ACTIVE')
      .sort(
        (left, right) =>
          new Date(left.window_end).getTime() - new Date(right.window_end).getTime(),
      );

    const invitedCandidates = candidates.filter((candidate) =>
      ['INVITED', 'WAITING_ROOM'].includes(candidate.status),
    );
    const interviewingCandidates = candidates.filter(
      (candidate) => candidate.status === 'IN_PROGRESS',
    );
    const awaitingReportCandidates = candidates.filter(
      (candidate) => candidate.status === 'COMPLETED',
    );
    const evaluatedCandidates = candidates.filter(
      (candidate) => candidate.status === 'EVALUATED',
    );

    const pipelineStages: PipelineStage[] = [
      {
        key: 'invited',
        label: 'Invited',
        description: 'Candidates who have been invited or are in the waiting room.',
        value: invitedCandidates.length,
        candidates: invitedCandidates,
        accent: '#3B82F6',
        surfaceClass: 'border-[#BFDBFE] bg-[#EFF6FF] hover:bg-[#DBEAFE]',
        countClass: 'bg-[#DBEAFE] text-[#1D4ED8]',
      },
      {
        key: 'interviewing',
        label: 'Interviewing',
        description: 'Interviews currently in progress.',
        value: interviewingCandidates.length,
        candidates: interviewingCandidates,
        accent: '#F59E0B',
        surfaceClass: 'border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7]',
        countClass: 'bg-[#FEF3C7] text-[#B45309]',
        live: true,
      },
      {
        key: 'awaitingReport',
        label: 'Awaiting report',
        description: 'Completed interviews whose evaluation report is being prepared.',
        value: awaitingReportCandidates.length,
        candidates: awaitingReportCandidates,
        accent: '#8B5CF6',
        surfaceClass: 'border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE]',
        countClass: 'bg-[#EDE9FE] text-[#6D28D9]',
      },
      {
        key: 'evaluated',
        label: 'Evaluated',
        description: 'Candidates with a completed evaluation report.',
        value: evaluatedCandidates.length,
        candidates: evaluatedCandidates,
        accent: '#10B981',
        surfaceClass: 'border-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#D1FAE5]',
        countClass: 'bg-[#D1FAE5] text-[#047857]',
      },
    ];

    const pipelineTotal = pipelineStages.reduce((total, stage) => total + stage.value, 0);
    const completedInterviews = awaitingReportCandidates.length + evaluatedCandidates.length;
    const completionRate = pipelineTotal
      ? Math.round((completedInterviews / pipelineTotal) * 100)
      : 0;
    const pendingEvaluations = evaluations
      .filter((evaluation) => evaluation.recruiter_decision === 'PENDING')
      .sort((left, right) => {
        const scoreDifference = clampScore(right.overall_score) - clampScore(left.overall_score);
        if (scoreDifference !== 0) return scoreDifference;
        return new Date(right.generated_at).getTime() - new Date(left.generated_at).getTime();
      });
    const closingSoon = activeAssessments.filter((assessment) => {
      const remaining = daysUntil(assessment.window_end);
      return remaining >= 0 && remaining <= 3;
    }).length;
    const overdue = activeAssessments.filter(
      (assessment) => daysUntil(assessment.window_end) < 0,
    ).length;

    return {
      activeAssessments,
      closingSoon,
      completedInterviews,
      completionRate,
      interviewingCount: interviewingCandidates.length,
      overdue,
      pendingEvaluations,
      pipelineStages,
      pipelineTotal,
      uniqueCandidateCount: groupCandidatesByIdentity(candidates).length,
    };
  }, [assessments, candidates, evaluations]);

  const selectedStage = selectedStageKey
    ? dashboard.pipelineStages.find((stage) => stage.key === selectedStageKey) ?? null
    : null;
  const dashboardLoading = assessmentsLoading || candidatesLoading || evaluationsLoading;
  const dataHasError = assessmentsError || candidatesError || evaluationsError;
  const dataRefreshing = assessmentsFetching || candidatesFetching || evaluationsFetching;
  const firstPendingEvaluation = dashboard.pendingEvaluations[0];

  const hero = (() => {
    if (dataHasError) {
      return {
        title: 'Some live recruiting data needs a refresh',
        description: 'Retry to restore the latest campaigns, candidates, and decisions.',
        action: 'Open candidate pipeline',
        to: '/candidates',
        icon: Users,
      };
    }
    if (dashboardLoading) {
      return {
        title: 'Preparing your hiring priorities',
        description: 'Your latest interview outcomes are being organized.',
        action: 'Open candidate pipeline',
        to: '/candidates',
        icon: Users,
      };
    }
    if (dashboard.pendingEvaluations.length > 0) {
      return {
        title: `${pluralize(dashboard.pendingEvaluations.length, 'decision')} ${dashboard.pendingEvaluations.length === 1 ? 'needs' : 'need'} your review`,
        description: 'The strongest undecided reports are surfaced first.',
        action: 'Review next candidate',
        to: firstPendingEvaluation
          ? `/candidates/${firstPendingEvaluation.candidate_assessment_id}/report`
          : '/evaluations',
        icon: UserCheck,
      };
    }
    if (dashboard.activeAssessments.length === 0) {
      return {
        title: 'Your next hiring campaign starts here',
        description: 'Create an assessment and invite your first candidates.',
        action: 'Manage assessments',
        to: '/assessments',
        icon: BriefcaseBusiness,
      };
    }
    if (dashboard.overdue > 0 || dashboard.closingSoon > 0) {
      const attentionCount = dashboard.overdue + dashboard.closingSoon;
      return {
        title: `${pluralize(attentionCount, 'campaign')} ${attentionCount === 1 ? 'needs' : 'need'} attention`,
        description: 'Review the nearest campaign deadlines and keep interviews moving.',
        action: 'Review campaigns',
        to: '/assessments',
        icon: CalendarClock,
      };
    }
    return {
      title: 'Your hiring pipeline is on track',
      description: 'Monitor live interviews and open new reports as they arrive.',
      action: 'Open candidate pipeline',
      to: '/candidates',
      icon: Users,
    };
  })();
  const HeroActionIcon = hero.icon;

  const signals = [
    {
      label: 'Active campaigns',
      value: assessmentsError ? '—' : dashboard.activeAssessments.length,
      loading: assessmentsLoading,
      icon: BriefcaseBusiness,
      to: '/assessments',
    },
    {
      label: 'Candidates',
      value: candidatesError ? '—' : dashboard.uniqueCandidateCount,
      loading: candidatesLoading,
      icon: Users,
      to: '/candidates',
    },
    {
      label: 'Live interviews',
      value: candidatesError ? '—' : dashboard.interviewingCount,
      loading: candidatesLoading,
      icon: Radio,
      to: '/candidates',
      live: dashboard.interviewingCount > 0,
    },
  ];

  const retryDashboard = () => {
    void Promise.all([refetchAssessments(), refetchCandidates(), refetchEvaluations()]);
  };

  return (
    <div className="dashboard-viewport h-full min-h-0">
      <div className="dashboard-layout mx-auto w-full max-w-[1680px]">
        <section className="dashboard-command-deck dashboard-enter relative overflow-hidden" aria-labelledby="dashboard-command-title">
          <div className="dashboard-command-orbit" aria-hidden="true" />
          <div className="dashboard-command-grid relative z-10 h-full">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#E3C18F]">
                <Sparkles className="h-3 w-3" />
                {greeting}, {firstName}
              </p>
              <h2
                id="dashboard-command-title"
                className="mt-1 truncate font-display text-[20px] font-black leading-none tracking-[-0.035em] text-white xl:text-[21px]"
              >
                {hero.title}
              </h2>
              <p className="dashboard-command-description mt-0.5 truncate text-[11px] font-semibold text-[#BFB4A7] xl:text-xs">
                {hero.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <NavLink
                  to={hero.to}
                  className="group inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] bg-white px-3 text-[10px] font-black text-brand-charcoal shadow-[0_12px_30px_-18px_rgba(0,0,0,0.8)] transition-all hover:-translate-y-0.5 hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-charcoal"
                >
                  <HeroActionIcon className="h-3.5 w-3.5 text-brand-hover" />
                  {hero.action}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </NavLink>
                {dataHasError && (
                  <button
                    type="button"
                    onClick={retryDashboard}
                    aria-label="Retry dashboard data"
                    className="inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-[10px] text-[10px] font-black text-rose-200 transition-colors hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 xl:w-auto xl:px-3"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${dataRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden xl:inline">Retry data</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-3 gap-2" aria-label="Recruiting snapshot">
              {signals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <NavLink
                    key={signal.label}
                    to={signal.to}
                    className="dashboard-command-signal group relative flex h-14 min-w-0 items-center gap-2 overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.055] p-2 text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#D9B47B]/50 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    aria-label={signal.loading
                      ? `${signal.label} is loading. Open details.`
                      : `${signal.label}: ${signal.value}. Open details.`}
                  >
                    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-[#E3C18F] transition-transform group-hover:scale-105">
                        <Icon className="h-3.5 w-3.5" />
                        {signal.live && (
                          <span className="dashboard-live-dot absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#E3C18F]" aria-hidden="true" />
                        )}
                      </span>
                    <span className="min-w-0 flex-1">
                      {signal.loading ? (
                        <span className="block h-5 w-9 rounded bg-white/10" />
                      ) : (
                        <span className="block font-display text-lg font-black leading-none tracking-[-0.04em]">
                          {signal.value}
                        </span>
                      )}
                      <span className="mt-0.5 block truncate text-[8px] font-black uppercase tracking-[0.07em] text-[#BFB4A7]">
                        {signal.label}
                      </span>
                    </span>
                    <ArrowRight className="ml-auto hidden h-3 w-3 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-[#E3C18F] sm:block" />
                  </NavLink>
                );
              })}
            </div>
          </div>
        </section>

        <section className="dashboard-operations-grid min-h-0" aria-label="Recruiting operations">
          <article
            className="dashboard-card dashboard-review-panel dashboard-surface-panel flex min-h-0 flex-col overflow-hidden"
            aria-busy={evaluationsLoading}
          >
            <PanelHeader
              eyebrow="Decision inbox"
              title="Candidates to review"
              icon={UserCheck}
              to="/evaluations"
              action="View all"
              badge={evaluationsError || evaluationsLoading ? undefined : `${dashboard.pendingEvaluations.length} waiting`}
            />

            {evaluationsError ? (
              <PanelError
                title="Evaluation reports could not load"
                onRetry={() => void refetchEvaluations()}
              />
            ) : evaluationsLoading ? (
              <div className="dashboard-review-deck flex min-h-0 flex-1 flex-col gap-2 p-2">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="min-h-[88px] max-h-[110px] flex-1 rounded-[15px] ibot-shimmer" />
                ))}
              </div>
            ) : dashboard.pendingEvaluations.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-5 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-xs font-black text-slate-800">Decision queue is clear</p>
                <NavLink
                  to="/evaluations"
                  className="mt-1.5 text-[10px] font-black text-brand-hover transition-colors hover:text-brand-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                >
                  Browse completed reports
                </NavLink>
              </div>
            ) : (
              <div className="dashboard-review-deck flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
                {dashboard.pendingEvaluations.slice(0, MAX_REVIEW_ITEMS).map((evaluation) => (
                  <PriorityEvaluationRow
                    key={evaluation.candidate_assessment_id}
                    evaluation={evaluation}
                  />
                ))}
              </div>
            )}
          </article>

          <div className="dashboard-action-rail min-h-0">
            <article
              className="dashboard-card dashboard-pipeline-panel dashboard-surface-panel flex min-h-0 flex-col overflow-hidden"
              aria-busy={candidatesLoading}
            >
            <PanelHeader
              eyebrow="Pipeline now"
              title="Interview activity"
              icon={BarChart3}
              to="/candidates"
              action="Open pipeline"
              badge={candidatesError || candidatesLoading ? undefined : `${dashboard.pipelineTotal} applications`}
            />

            {candidatesError ? (
              <PanelError
                title="Candidate activity could not load"
                onRetry={() => void refetchCandidates()}
              />
            ) : candidatesLoading ? (
              <div className="flex min-h-0 flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-7 w-36 rounded-lg ibot-shimmer" />
                  <div className="h-3 w-24 rounded ibot-shimmer" />
                </div>
                <div className="mt-3 h-2.5 rounded-full ibot-shimmer" />
                <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="rounded-xl ibot-shimmer" />
                  ))}
                </div>
              </div>
            ) : dashboard.pipelineTotal === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-2 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-hover ring-1 ring-inset ring-[#E3CBA9]">
                  <Users className="h-4 w-4" />
                </span>
                <p className="mt-1.5 text-[11px] font-black text-slate-800">No active candidate activity</p>
                <p className="mt-0.5 max-w-[280px] truncate text-[9px] font-semibold leading-4 text-slate-400">
                  Add a candidate to begin tracking interview progress here.
                </p>
                <NavLink
                  to="/candidates?add=1"
                  className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-brand-charcoal px-3 text-[9px] font-black text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                >
                  Add candidate <ArrowRight className="h-3.5 w-3.5" />
                </NavLink>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-2.5">
                <div className="flex shrink-0 items-end justify-between gap-3">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="font-display text-[25px] font-black leading-none tracking-[-0.045em] text-slate-950">
                      {dashboard.completionRate}%
                    </span>
                    <span className="truncate text-[10px] font-black text-slate-600">interview completion</span>
                  </div>
                  <p className="shrink-0 text-[9px] font-bold text-slate-500">
                    {dashboard.completedInterviews} of {dashboard.pipelineTotal} at report stage
                  </p>
                </div>

                <div
                  className="mt-2 flex h-2.5 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70"
                  role="group"
                  aria-label={dashboard.pipelineStages
                    .map((stage) => `${stage.label}: ${pluralize(stage.value, 'application')}`)
                    .join(', ')}
                >
                  {dashboard.pipelineStages.map((stage, index) => (
                    stage.value > 0 ? (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => setSelectedStageKey(stage.key)}
                        aria-haspopup="dialog"
                        aria-expanded={selectedStageKey === stage.key}
                        aria-label={`Open ${stage.label.toLowerCase()} details: ${pluralize(stage.value, 'application')}`}
                        className="dashboard-pipeline-segment shrink-0 border-r-2 border-white/90 transition-[filter,opacity] last:border-r-0 hover:brightness-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950"
                        style={{
                          width: `${(stage.value / dashboard.pipelineTotal) * 100}%`,
                          backgroundColor: stage.accent,
                          animationDelay: `${120 + index * 70}ms`,
                        }}
                        title={`${stage.label}: ${pluralize(stage.value, 'application')}. Click for details.`}
                      />
                    ) : null
                  ))}
                </div>

                <div className="mt-2.5 grid min-h-0 flex-1 grid-cols-2 gap-2" role="group" aria-label="Open pipeline stage details">
                  {dashboard.pipelineStages.map((stage) => {
                    const share = formatShare(stage.value, dashboard.pipelineTotal);
                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => setSelectedStageKey(stage.key)}
                        aria-haspopup="dialog"
                        aria-expanded={selectedStageKey === stage.key}
                        aria-label={`${stage.label}: ${pluralize(stage.value, 'application')}, ${share} of the visible pipeline. Open details.`}
                        title={`Open ${stage.label.toLowerCase()} details`}
                        className={`dashboard-pipeline-stage group flex min-h-0 items-center gap-1.5 rounded-xl border p-1 text-left transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${stage.surfaceClass}`}
                        style={{ boxShadow: `inset 3px 0 0 ${stage.accent}` }}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-display text-xs font-black ${stage.countClass}`}>
                          {stage.value}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            {stage.live && stage.value > 0 && (
                              <span
                                className="dashboard-live-dot h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: stage.accent }}
                                aria-hidden="true"
                              />
                            )}
                            <span className="truncate text-[10px] font-black text-slate-950">{stage.label}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-[9px] font-bold text-slate-500">{share} of pipeline</span>
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </article>

            <article
              className="dashboard-card dashboard-campaign-panel dashboard-surface-panel flex min-h-0 flex-col overflow-hidden"
              aria-busy={assessmentsLoading}
            >
              <PanelHeader
                eyebrow="Campaign watch"
                title="Deadline watch"
                icon={CalendarClock}
                to="/assessments"
                action="Manage"
                badge={assessmentsError || assessmentsLoading ? undefined : `${dashboard.activeAssessments.length} active`}
              />

              {assessmentsError ? (
                <PanelError
                  title="Campaign deadlines could not load"
                  onRetry={() => void refetchAssessments()}
                />
              ) : assessmentsLoading ? (
                <div className="grid min-h-0 flex-1 grid-rows-3 gap-2 p-4">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="rounded-xl ibot-shimmer" />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 pt-2">
                  {dashboard.activeAssessments.length === 0 ? (
                    <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center">
                      <div>
                        <p className="text-[11px] font-black text-slate-700">No active campaigns</p>
                        <NavLink
                          to="/assessments"
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-brand-hover hover:text-brand-charcoal"
                        >
                          Manage assessments <ArrowRight className="h-3 w-3" />
                        </NavLink>
                      </div>
                    </div>
                  ) : (
                    <div className="grid min-h-0 flex-1 grid-rows-2 gap-1 overflow-hidden">
                      {dashboard.activeAssessments.slice(0, MAX_DEADLINES).map((assessment) => (
                        <DeadlineRow
                          key={assessment.id}
                          title={formatAssessmentTitle(
                            assessment,
                            assessmentInstanceNumbers,
                          )}
                          endDate={assessment.window_end}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          </div>
        </section>
      </div>

      {selectedStage && (
        <PipelineStageDialog
          stage={selectedStage}
          total={dashboard.pipelineTotal}
          onClose={() => setSelectedStageKey(null)}
        />
      )}
    </div>
  );
};

const PanelHeader: React.FC<{
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  action: string;
  badge?: string;
}> = ({ eyebrow, title, icon: Icon, to, action, badge }) => (
  <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-2 sm:px-5">
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand-hover ring-1 ring-inset ring-[#E3CBA9]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
            {eyebrow}
          </p>
          {badge && (
            <span className="shrink-0 rounded-full bg-brand-soft/70 px-2 py-0.5 text-[8px] font-black text-brand-hover ring-1 ring-inset ring-[#E3CBA9]/70">
              {badge}
            </span>
          )}
        </div>
        <h2 className="mt-0.5 truncate font-display text-[14px] font-black tracking-[-0.02em] text-slate-950">
          {title}
        </h2>
      </div>
    </div>
    <NavLink
      to={to}
      className="group inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-black text-slate-700 transition-colors hover:bg-brand-soft hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      {action}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </NavLink>
  </header>
);

const PriorityEvaluationRow: React.FC<{
  evaluation: RecruiterEvaluationListItem;
}> = ({ evaluation }) => {
  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const score = clampScore(evaluation.overall_score);
  const scoreAccent = score >= 7 ? '#10B981' : score >= 4 ? '#F59E0B' : '#F43F5E';
  const integrityLabel = evaluation.validated_violation_count > 0
    ? pluralize(evaluation.validated_violation_count, 'integrity flag')
    : null;

  return (
    <NavLink
      to={`/candidates/${evaluation.candidate_assessment_id}/report`}
      className="dashboard-review-card group relative flex min-h-[88px] max-h-[110px] flex-1 items-center gap-2.5 overflow-hidden rounded-[15px] border border-[#E8DED0] bg-white px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent"
      aria-label={`Review ${evaluation.candidate_name} for ${evaluation.role_name}, score ${score.toFixed(1)} out of 10, AI recommendation ${recommendation.label}${integrityLabel ? `, ${integrityLabel}` : ''}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D7AA6A] to-[#9A6A30] font-display text-[11px] font-black text-white shadow-[0_10px_20px_-13px_rgba(36,33,29,0.75)] ring-[3px] ring-brand-soft transition-transform group-hover:-rotate-2 group-hover:scale-105">
        {candidateInitials(evaluation.candidate_name)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] font-black text-slate-950 transition-colors group-hover:text-brand-hover">
            {evaluation.candidate_name}
          </span>
        </span>

        <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-600">
          {evaluation.role_name}
        </span>

        <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <span className="hidden shrink-0 text-[8px] font-black uppercase tracking-[0.09em] text-slate-400 sm:inline">
            AI signal
          </span>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[8px] font-black ${recommendation.className}`}>
            <span className={`h-1 w-1 rounded-full ${recommendation.dot}`} />
            {recommendation.label}
          </span>
          {integrityLabel && (
            <span
              className="inline-flex min-w-0 items-center gap-1 rounded-md bg-rose-50 px-1.5 py-px text-[8px] font-black text-rose-700 ring-1 ring-inset ring-rose-200"
              title={integrityLabel}
            >
              <ShieldAlert className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{pluralize(evaluation.validated_violation_count, 'flag')}</span>
            </span>
          )}
        </span>

        <span className="mt-2 block h-1 w-full max-w-[260px] overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <span
            className="dashboard-review-score-bar block h-full rounded-full"
            style={{ width: `${score * 10}%`, backgroundColor: scoreAccent }}
          />
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <span className="min-w-[48px] text-right">
          <span className="block text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">Fit score</span>
          <span className={`mt-0.5 block font-display text-[20px] font-black leading-none ${scoreTextClass(evaluation.overall_score)}`}>
            {score.toFixed(1)}
            <span className="ml-0.5 text-[8px] font-black text-slate-400">/10</span>
          </span>
        </span>

        <span
          className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-[#DCCDBA] bg-white px-2.5 text-[9px] font-black text-slate-700 shadow-sm transition-all group-hover:border-brand-charcoal group-hover:bg-brand-charcoal group-hover:text-white max-xl:w-8 max-xl:px-0"
          aria-hidden="true"
        >
          <span className="hidden xl:inline">Review</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </NavLink>
  );
};

const DeadlineRow: React.FC<{ title: string; endDate: string }> = ({ title, endDate }) => {
  const remaining = daysUntil(endDate);
  const overdue = remaining < 0;
  const urgent = remaining >= 0 && remaining <= 1;
  const warning = remaining > 1 && remaining <= 3;
  const label = overdue
    ? `${Math.abs(remaining)}d overdue`
    : remaining === 0
      ? 'Today'
      : remaining === 1
        ? '1 day'
        : `${remaining} days`;

  return (
    <NavLink
      to="/assessments"
      className="group flex min-h-0 items-center gap-2.5 rounded-xl border border-transparent bg-[#FCFAF6] px-2.5 py-1 transition-all hover:border-[#E3CBA9] hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
      aria-label={`${title}, ${label}. Open assessments.`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          overdue || urgent
            ? 'bg-rose-50 text-rose-600'
            : warning
              ? 'bg-amber-50 text-amber-700'
              : 'bg-brand-soft text-brand-hover'
        }`}
      >
        {overdue || urgent ? <CircleAlert className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-black text-slate-950 transition-colors group-hover:text-brand-hover">
        {title}
      </span>
      <span
        className={`shrink-0 rounded-md px-1.5 py-1 text-[8px] font-black ${
          overdue || urgent
            ? 'bg-rose-50 text-rose-700'
            : warning
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-800'
        }`}
      >
        {label}
      </span>
      <ArrowRight className="h-3 w-3 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-hover" />
    </NavLink>
  );
};

const PanelError: React.FC<{ title: string; onRetry: () => void }> = ({ title, onRetry }) => (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-2 text-center">
    <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
      <CircleAlert className="h-4 w-4" />
    </span>
    <p className="mt-1.5 text-[10px] font-black text-slate-700">{title}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-1.5 inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-black text-brand-hover transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <RefreshCw className="h-3 w-3" /> Retry
    </button>
  </div>
);

const PipelineStageDialog: React.FC<{
  stage: PipelineStage;
  total: number;
  onClose: () => void;
}> = ({ stage, total, onClose }) => (
  <CenteredDialog onClose={onClose} labelledBy="dashboard-pipeline-dialog-title" className="max-w-2xl">
    <div className="h-1.5 shrink-0" style={{ backgroundColor: stage.accent }} />
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${stage.accent}18`, color: stage.accent }}
        >
          <BarChart3 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Pipeline stage</p>
          <h2 id="dashboard-pipeline-dialog-title" className="mt-0.5 font-display text-lg font-black tracking-[-0.025em] text-slate-950">
            {stage.label}
          </h2>
          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{stage.description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        autoFocus
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        aria-label="Close pipeline details"
      >
        <X className="h-4 w-4" />
      </button>
    </header>

    <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-slate-200 bg-[#FCFAF6] px-3 py-2.5 text-center">
          <p className="font-display text-lg font-black text-slate-950">{stage.value}</p>
          <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">Applications</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-[#FCFAF6] px-3 py-2.5 text-center">
          <p className="font-display text-lg font-black text-slate-950">{formatShare(stage.value, total)}</p>
          <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">Pipeline share</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2.5 text-xs font-black text-slate-900">Candidates in this stage</p>
        {stage.candidates.length > 0 ? (
          <ul className="space-y-2">
            {stage.candidates.map((candidate) => {
              const reportAvailable = candidate.status === 'EVALUATED';
              return (
                <li key={candidate.id}>
                  <NavLink
                    to={reportAvailable ? `/candidates/${candidate.id}/report` : '/candidates'}
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-brand-accent/60 hover:bg-brand-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D7AA6A] to-[#9A6A30] font-display text-[10px] font-black text-white ring-[3px] ring-brand-soft">
                      {candidateInitials(candidate.full_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-slate-900 group-hover:text-brand-hover">
                        {candidate.full_name}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-400">
                        {candidate.role_name || stage.label}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-brand-hover">
                      {reportAvailable ? <Eye className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                      {reportAvailable ? 'Report' : 'Pipeline'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-hover" />
                  </NavLink>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center">
            <FileCheck2 className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-xs font-black text-slate-700">No candidates in this stage</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-400">This view updates automatically as interviews progress.</p>
          </div>
        )}
      </div>
    </div>

    <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/90 px-5 py-3 sm:px-6">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-black text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
      >
        Close
      </button>
      <NavLink
        to="/candidates"
        onClick={onClose}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-charcoal px-3.5 py-2 text-[10px] font-black text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
      >
        Open candidate pipeline <ArrowRight className="h-3.5 w-3.5" />
      </NavLink>
    </footer>
  </CenteredDialog>
);
