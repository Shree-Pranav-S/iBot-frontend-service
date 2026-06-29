import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Filter,
  Loader2,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  UserRoundSearch,
  UserX,
  Users,
} from 'lucide-react';
import { useRecruiterEvaluations, useUpdateCandidateDecision } from '../../../hooks/queries';
import { useToast } from '../../../hooks/useToast';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import type { RecruiterEvaluationListItem } from '../../../types/candidate.types';
import {
  CompetencyRadar,
  DecisionModal,
  MetricTile,
  ScoreBar,
  ScoreRing,
  StatusPill,
} from './EvaluationUI';
import {
  candidateInitials,
  decisionMeta,
  formatDateTime,
  recommendationMeta,
  scoreTextClass,
  useEvaluationDecision,
} from './evaluationUiUtils';

type DecisionFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
type SortOption = 'score' | 'recent' | 'rank';

const orderedSkills = (evaluation: RecruiterEvaluationListItem) =>
  Object.entries(evaluation.skill_scores ?? {}).sort(([, left], [, right]) => {
    const priorityDifference = right.priority_score - left.priority_score;
    return priorityDifference || right.score - left.score;
  });

export const EvaluationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { data: evaluations = [], isLoading, isError, refetch } = useRecruiterEvaluations();
  const decisionMutation = useUpdateCandidateDecision();
  const { modal, requestDecision, closeDecision } = useEvaluationDecision();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all');
  const [sort, setSort] = useState<SortOption>('score');

  const stats = useMemo(() => {
    const total = evaluations.length;
    const approved = evaluations.filter((item) => item.recruiter_decision === 'APPROVED').length;
    const rejected = evaluations.filter((item) => item.recruiter_decision === 'REJECTED').length;
    const pending = total - approved - rejected;
    const average = total
      ? evaluations.reduce((sum, item) => sum + item.overall_score, 0) / total
      : 0;
    return { total, approved, rejected, pending, average };
  }, [evaluations]);

  const visibleEvaluations = useMemo(() => {
    const filtered = evaluations.filter((evaluation) => {
      const matchesDecision =
        decisionFilter === 'all' || evaluation.recruiter_decision === decisionFilter;
      return matchesDecision;
    });

    return [...filtered].sort((left, right) => {
      if (sort === 'recent') {
        return new Date(right.generated_at).getTime() - new Date(left.generated_at).getTime();
      }
      if (sort === 'rank') {
        return (left.rank_in_assessment ?? Number.MAX_SAFE_INTEGER) -
          (right.rank_in_assessment ?? Number.MAX_SAFE_INTEGER);
      }
      return right.overall_score - left.overall_score;
    });
  }, [decisionFilter, evaluations, search, sort]);

  const selected = useMemo(
    () =>
      visibleEvaluations.find((item) => item.candidate_assessment_id === selectedId) ??
      visibleEvaluations[0] ??
      null,
    [selectedId, visibleEvaluations],
  );

  const saveDecision = async (feedback?: string) => {
    try {
      await decisionMutation.mutateAsync({
        candidateId: modal.candidateId,
        decision: modal.decision,
        feedback,
      });
      success(
        'Decision saved',
        `${modal.candidateName} has been ${modal.decision === 'APPROVED' ? 'approved' : 'rejected'}.`,
      );
      closeDecision();
    } catch (error: unknown) {
      toastError(
        'Unable to save decision',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  if (isLoading) return <EvaluationLoadingState />;

  if (isError) {
    return (
      <div className="flex h-full min-h-[440px] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-100/60">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
          <h2 className="mt-4 text-lg font-black text-slate-950">Evaluations could not be loaded</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            The reporting service may still be starting. Retry to refresh this workspace.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="flex h-full min-h-[440px] items-center justify-center">
        <div className="max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-950">Evaluation workspace is ready</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            Completed interviews will appear here as soon as holistic evaluation finishes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ibot-scrollbar flex h-full min-h-0 flex-col gap-4 overflow-y-auto animate-fadeIn xl:overflow-hidden">
        <section className="ibot-command-panel relative z-20 shrink-0 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                  Decision center
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {stats.pending} awaiting review
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-slate-950">
                Candidate intelligence
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Compare evidence-backed reports and make confident hiring decisions.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 z-10" />
                <CustomSelect
                  value={decisionFilter}
                  onChange={(val) => setDecisionFilter(val as DecisionFilter)}
                  options={[
                    { value: 'all', label: 'All decisions' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'APPROVED', label: 'Approved' },
                    { value: 'REJECTED', label: 'Rejected' },
                  ]}
                  buttonClassName="pl-8 w-36"
                />
              </div>
              <CustomSelect
                value={sort}
                onChange={(val) => setSort(val as SortOption)}
                options={[
                  { value: 'score', label: 'Highest score' },
                  { value: 'rank', label: 'Best rank' },
                  { value: 'recent', label: 'Most recent' },
                ]}
                buttonClassName="w-36"
              />
            </div>
          </div>
        </section>

        <section className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricTile label="Evaluated" value={String(stats.total)} helper="completed reports" icon={<Award className="h-4 w-4" />} />
          <MetricTile label="Average score" value={stats.average.toFixed(1)} helper="out of 10" icon={<BarChart3 className="h-4 w-4" />} tone="indigo" />
          <MetricTile label="Pending" value={String(stats.pending)} helper="need a decision" icon={<Users className="h-4 w-4" />} tone="amber" />
          <MetricTile label="Approved" value={String(stats.approved)} helper="moving forward" icon={<UserCheck className="h-4 w-4" />} tone="emerald" />
          <div className="hidden lg:block">
            <MetricTile label="Rejected" value={String(stats.rejected)} helper="not progressing" icon={<UserX className="h-4 w-4" />} tone="rose" />
          </div>
        </section>

        <section className="grid shrink-0 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="ibot-panel flex h-[430px] min-h-[260px] flex-col overflow-hidden xl:h-full">
            <header className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
              <div>
                <p className="text-xs font-black text-slate-900">Candidate reports</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                  {visibleEvaluations.length} shown
                </p>
              </div>
              <UserRoundSearch className="h-4 w-4 text-slate-400" />
            </header>

            <div className="ibot-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
              {visibleEvaluations.map((evaluation) => (
                <CandidateReportListItem
                  key={evaluation.candidate_assessment_id}
                  evaluation={evaluation}
                  active={evaluation.candidate_assessment_id === selected?.candidate_assessment_id}
                  onClick={() => setSelectedId(evaluation.candidate_assessment_id)}
                />
              ))}
              {visibleEvaluations.length === 0 && (
                <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <div>
                    <Search className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-xs font-black text-slate-700">No matching reports</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setDecisionFilter('all');
                      }}
                      className="mt-2 text-[11px] font-black text-emerald-700 hover:text-emerald-800"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {selected && (
            <main className="ibot-scrollbar min-h-0 overflow-visible rounded-2xl xl:overflow-y-auto xl:pr-1">
              <CandidateSummary
                evaluation={selected}
                onViewReport={() =>
                  navigate(`/candidates/${selected.candidate_assessment_id}/report`)
                }
                onDecision={(decision) =>
                  requestDecision(
                    selected.candidate_assessment_id,
                    selected.candidate_name,
                    selected.recruiter_decision,
                    decision,
                  )
                }
              />
            </main>
          )}
        </section>
      </div>

      <DecisionModal
        key={`${modal.candidateId}:${modal.decision}:${modal.open}`}
        open={modal.open}
        candidateName={modal.candidateName}
        currentDecision={modal.currentDecision}
        decision={modal.decision}
        loading={decisionMutation.isPending}
        onClose={closeDecision}
        onConfirm={saveDecision}
      />
    </>
  );
};

const CandidateReportListItem: React.FC<{
  evaluation: RecruiterEvaluationListItem;
  active: boolean;
  onClick: () => void;
}> = ({ evaluation, active, onClick }) => {
  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const decision = decisionMeta(evaluation.recruiter_decision);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-xl border p-3 text-left transition-all ${
        active
          ? 'border-emerald-300 bg-white shadow-md shadow-emerald-900/[0.07]'
          : 'border-slate-200 bg-white/75 hover:border-slate-300 hover:bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
            active ? 'bg-slate-950 text-emerald-300' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {candidateInitials(evaluation.candidate_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{evaluation.candidate_name}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                {evaluation.role_name}
              </p>
            </div>
            <span className={`shrink-0 font-display text-lg font-black ${scoreTextClass(evaluation.overall_score)}`}>
              {evaluation.overall_score.toFixed(1)}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <StatusPill {...recommendation} />
            <StatusPill {...decision} />
            {evaluation.validated_violation_count > 0 && (
              <StatusPill
                label={`${evaluation.validated_violation_count} violation${evaluation.validated_violation_count === 1 ? '' : 's'}`}
                className="border-rose-200 bg-rose-50 text-rose-800"
                dot="bg-rose-500"
              />
            )}
          </div>
          <div className="mt-3">
            <ScoreBar score={evaluation.overall_score} compact />
          </div>
        </div>
      </div>
    </button>
  );
};

const CandidateSummary: React.FC<{
  evaluation: RecruiterEvaluationListItem;
  onViewReport: () => void;
  onDecision: (decision: 'APPROVED' | 'REJECTED') => void;
}> = ({ evaluation, onViewReport, onDecision }) => {
  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const decision = decisionMeta(evaluation.recruiter_decision);
  const skills = orderedSkills(evaluation);
  const topSkills = skills.slice(0, 5);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500" />
        <div className="p-5">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <StatusPill {...recommendation} />
                <StatusPill {...decision} />
                {evaluation.rank_in_assessment && (
                  <StatusPill
                    label={`Rank #${evaluation.rank_in_assessment}`}
                    className="border-slate-200 bg-slate-50 text-slate-700"
                    dot="bg-slate-400"
                  />
                )}
              </div>
              <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-slate-950">
                {evaluation.candidate_name}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {evaluation.candidate_email} · {evaluation.role_name} · {evaluation.assessment_title}
              </p>
              <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
                {evaluation.overall_summary}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onDecision('APPROVED')}
                disabled={evaluation.recruiter_decision === 'APPROVED'}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ThumbsUp className="h-4 w-4" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => onDecision('REJECTED')}
                disabled={evaluation.recruiter_decision === 'REJECTED'}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-black text-rose-700 transition-all hover:bg-rose-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ThumbsDown className="h-4 w-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={onViewReport}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                Full report
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="grid gap-4 md:grid-cols-[210px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid place-items-center">
              <ScoreRing score={evaluation.overall_score} size={154} />
              <p className="mt-2 text-xs font-black text-slate-800">
                AI recommendation: {recommendation.label}
              </p>
              <p className="mt-1 text-center text-[10px] font-semibold text-slate-400">
                Generated {formatDateTime(evaluation.generated_at)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-900">Core dimensions</p>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">Evidence-calibrated scores</p>
              </div>
              <Target className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <DimensionMiniCard
                label="Technical"
                score={evaluation.overall_technical_skill_score}
                icon={<BrainCircuit className="h-4 w-4" />}
              />
              <DimensionMiniCard
                label="Behaviour"
                score={evaluation.behavioural_cultural_score}
                icon={<Users className="h-4 w-4" />}
              />
              <DimensionMiniCard
                label="Communication"
                score={evaluation.communication_score}
                icon={<MessageSquareText className="h-4 w-4" />}
              />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <CompactStat
                label="Percentile"
                value={evaluation.percentile_in_assessment === null ? '—' : `${evaluation.percentile_in_assessment}%`}
              />
              <CompactStat
                label="Rank"
                value={evaluation.rank_in_assessment === null ? '—' : `#${evaluation.rank_in_assessment}`}
              />
              <CompactStat
                label="Violations"
                value={String(evaluation.validated_violation_count)}
                alert={evaluation.validated_violation_count > 0}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-black text-slate-900">Competency shape</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">At-a-glance balance</p>
            </div>
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </div>
          <CompetencyRadar
            points={[
              { label: 'Technical', score: evaluation.overall_technical_skill_score },
              { label: 'Behaviour', score: evaluation.behavioural_cultural_score },
              { label: 'Communication', score: evaluation.communication_score },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black text-slate-900">Priority skill performance</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                Highest-priority planned skills first
              </p>
            </div>
            <BrainCircuit className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-5 space-y-4">
            {topSkills.map(([skill, details]) => (
              <div key={skill}>
                <ScoreBar score={details.score} label={skill} />
                <div className="mt-1.5 flex items-center gap-3 text-[9px] font-bold text-slate-400">
                  <span>Priority {details.priority_score.toFixed(1)}</span>
                  <span>{details.questions_evaluated} question{details.questions_evaluated === 1 ? '' : 's'}</span>
                  <span>{Math.round(details.confidence * 100)}% confidence</span>
                </div>
              </div>
            ))}
            {topSkills.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-xs font-semibold text-slate-400">
                No technical skill data is available.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <SignalCard
            title="Technical strengths"
            items={evaluation.strengths}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="emerald"
          />
          <SignalCard
            title="Areas of concern"
            items={evaluation.concerns}
            icon={<ShieldAlert className="h-4 w-4" />}
            tone="rose"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">Recommendation reasoning</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {evaluation.recommendation_reasoning}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const DimensionMiniCard: React.FC<{
  label: string;
  score: number;
  icon: React.ReactNode;
}> = ({ label, score, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
    <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ${scoreTextClass(score)}`}>
      {icon}
    </div>
    <p className="mt-3 truncate text-[9px] font-black uppercase tracking-[0.12em] text-slate-400" title={label}>{label}</p>
    <p className={`mt-1 font-display text-xl font-black ${scoreTextClass(score)}`}>
      {score.toFixed(1)}
      <span className="ml-0.5 text-[10px] text-slate-400">/10</span>
    </p>
  </div>
);

const CompactStat: React.FC<{ label: string; value: string; alert?: boolean }> = ({
  label,
  value,
  alert = false,
}) => (
  <div className={`rounded-lg border px-3 py-2 ${alert ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className={`mt-1 text-sm font-black ${alert ? 'text-rose-700' : 'text-slate-800'}`}>{value}</p>
  </div>
);

const SignalCard: React.FC<{
  title: string;
  items: string[];
  icon: React.ReactNode;
  tone: 'emerald' | 'rose';
}> = ({ title, items, icon, tone }) => {
  const styles =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
      : 'border-rose-200 bg-rose-50/60 text-rose-800';
  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-black">{title}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-current/10 bg-white/70 px-2.5 py-1 text-[10px] font-black">
            {item}
          </span>
        ))}
        {items.length === 0 && <p className="text-[11px] font-semibold opacity-70">None identified.</p>}
      </div>
    </div>
  );
};

const EvaluationLoadingState = () => (
  <div className="flex h-full min-h-[440px] flex-col gap-4">
    <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ))}
    </div>
    <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[370px_minmax(0,1fr)]">
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-500" />
          <p className="mt-3 text-xs font-bold text-slate-400">Loading candidate intelligence…</p>
        </div>
      </div>
    </div>
  </div>
);
