import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ExternalLink,
  Filter,
  Loader2,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserRoundSearch,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useRecruiterEvaluations } from '../../../hooks/queries';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import type { RecruiterEvaluationListItem } from '../../../types/candidate.types';
import {
  CenteredDialog,
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
  scoreLabel,
  scoreTextClass,
  useEvaluationDecision,
} from './evaluationUiUtils';

type DecisionFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
type SortOption = 'score' | 'recent' | 'rank';

const PAGE_SIZE = 5;

const orderedSkills = (evaluation: RecruiterEvaluationListItem) =>
  Object.entries(evaluation.skill_scores ?? {}).sort(([, left], [, right]) => {
    const priorityDifference = right.priority_score - left.priority_score;
    return priorityDifference || right.score - left.score;
  });

export const EvaluationsPage: React.FC = () => {
  const { data: evaluations = [], isLoading, isError, refetch } = useRecruiterEvaluations();
  const {
    modal,
    requestDecision,
    closeDecision,
    saveDecision,
    isSaving,
  } = useEvaluationDecision();
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all');
  const [sort, setSort] = useState<SortOption>('score');
  const [page, setPage] = useState(0);
  const [selectedEvaluation, setSelectedEvaluation] = useState<RecruiterEvaluationListItem | null>(null);

  const stats = useMemo(() => {
    const total = evaluations.length;
    const approved = evaluations.filter((e) => e.recruiter_decision === 'APPROVED').length;
    const rejected = evaluations.filter((e) => e.recruiter_decision === 'REJECTED').length;
    const pending = total - approved - rejected;
    const average = total ? evaluations.reduce((s, e) => s + e.overall_score, 0) / total : 0;
    return { total, approved, rejected, pending, average };
  }, [evaluations]);

  const sortedEvaluations = useMemo(() => {
    const filtered = evaluations.filter((e) =>
      decisionFilter === 'all' || e.recruiter_decision === decisionFilter,
    );
    return [...filtered].sort((a, b) => {
      if (sort === 'recent') return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
      if (sort === 'rank') return (a.rank_in_assessment ?? 9999) - (b.rank_in_assessment ?? 9999);
      return b.overall_score - a.overall_score;
    });
  }, [decisionFilter, evaluations, sort]);

  const totalPages = Math.ceil(sortedEvaluations.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleEvaluations = sortedEvaluations.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const handleFilterChange = (val: DecisionFilter) => { setDecisionFilter(val); setPage(0); };
  const handleSortChange = (val: SortOption) => { setSort(val); setPage(0); };

  const handleViewFullReport = (caId: string) => {
    window.open(`/candidates/${caId}/report`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) return <EvaluationLoadingState />;

  if (isError) {
    return (
      <div className="flex h-full min-h-[440px] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-100/60">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
          <h2 className="mt-4 text-lg font-black text-slate-950">Evaluations could not be loaded</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            The reporting service may still be starting. Retry to refresh.
          </p>
          <button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800">
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
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-4 overflow-hidden animate-fadeIn">
        {/* Header */}
        <section className="ibot-section-toolbar relative z-20 shrink-0 overflow-visible px-5 py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Decision center</span>
                <span className="text-[11px] font-bold text-slate-500">{stats.pending} awaiting review</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-slate-950">Candidate Intelligence</h2>
              <p className="mt-1 text-sm font-medium text-slate-600">Review evidence, compare outcomes, and finalize hiring decisions.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 z-10" />
                <CustomSelect value={decisionFilter} onChange={(val) => handleFilterChange(val as DecisionFilter)}
                  options={[{ value: 'all', label: 'All decisions' }, { value: 'PENDING', label: 'Pending' }, { value: 'APPROVED', label: 'Hired' }, { value: 'REJECTED', label: 'Rejected' }]}
                  buttonClassName="pl-8 w-36"
                />
              </div>
              <CustomSelect value={sort} onChange={(val) => handleSortChange(val as SortOption)}
                options={[{ value: 'score', label: 'Highest score' }, { value: 'rank', label: 'Best rank' }, { value: 'recent', label: 'Most recent' }]}
                buttonClassName="w-36"
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile label="Evaluated" value={String(stats.total)} helper="completed reports" icon={<Award className="h-4 w-4" />} />
          <MetricTile label="Average score" value={stats.average.toFixed(1)} helper="out of 10" icon={<BarChart3 className="h-4 w-4" />} tone="indigo" />
          <MetricTile label="Pending" value={String(stats.pending)} helper="need a decision" icon={<Users className="h-4 w-4" />} tone="amber" />
          <MetricTile label="Finalized" value={String(stats.approved + stats.rejected)} helper={`${stats.approved} hired · ${stats.rejected} rejected`} icon={<UserCheck className="h-4 w-4" />} tone="emerald" />
        </section>

        {/* Candidate Grid */}
        <section className="ibot-section-surface flex min-h-0 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/75 px-5 py-3.5">
            <div>
              <p className="text-sm font-black text-slate-900">Candidate reports</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {sortedEvaluations.length} shown · click to review
              </p>
            </div>
            <UserRoundSearch className="h-4 w-4 text-slate-400" />
          </header>

          {sortedEvaluations.length === 0 ? (
            <div className="grid min-h-52 place-items-center p-6 text-center">
              <div>
                <Filter className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-xs font-black text-slate-700">No reports match this filter</p>
                <button type="button" onClick={() => { setDecisionFilter('all'); setPage(0); }} className="mt-2 text-[11px] font-black text-emerald-700 hover:text-emerald-800">
                  Show all decisions
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ibot-scrollbar min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[940px] border-collapse text-left">
                <thead className="bg-slate-50/95 border-b border-slate-200">
                  <tr className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3 hidden md:table-cell">Assessment</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3 hidden sm:table-cell">AI Rec.</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Evaluated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleEvaluations.map((evaluation) => {
                    const recommendation = recommendationMeta(evaluation.hiring_recommendation);
                    const decision = decisionMeta(evaluation.recruiter_decision);
                    return (
                      <tr
                        key={evaluation.candidate_assessment_id}
                        className="group h-[64px] cursor-pointer transition-colors hover:bg-emerald-50/50"
                        onClick={() => setSelectedEvaluation(evaluation)}
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 font-black text-xs text-emerald-300 shadow-sm">
                              {candidateInitials(evaluation.candidate_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700">{evaluation.candidate_name}</p>
                              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{evaluation.candidate_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-xs font-bold text-slate-700">{evaluation.assessment_title}</p>
                            <p className="mt-0.5 max-w-[180px] truncate text-[11px] font-medium text-slate-500">{evaluation.role_name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-black ${scoreTextClass(evaluation.overall_score)}`}>
                              {evaluation.overall_score.toFixed(1)}
                            </span>
                            <div className="hidden sm:block w-16">
                              <ScoreBar score={evaluation.overall_score} compact />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell">
                          <StatusPill {...recommendation} />
                        </td>
                        <td className="px-4 py-2">
                          <StatusPill {...decision} />
                        </td>
                        <td className="px-4 py-2 hidden lg:table-cell">
                          <p className="text-[11px] font-medium text-slate-500">{formatDateTime(evaluation.generated_at)}</p>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedEvaluation(evaluation)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-indigo-700"
                              aria-label={`Review ${evaluation.candidate_name}'s evaluation summary`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Review
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'APPROVED')}
                              disabled={evaluation.recruiter_decision === 'APPROVED'}
                              className="h-8 w-8 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 transition-colors"
                              title="Hire"
                              aria-label={`Hire ${evaluation.candidate_name}`}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'REJECTED')}
                              disabled={evaluation.recruiter_decision === 'REJECTED'}
                              className="h-8 w-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                              title="Reject"
                              aria-label={`Reject ${evaluation.candidate_name}`}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewFullReport(evaluation.candidate_assessment_id)}
                              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                              title="Open full report in new tab"
                              aria-label={`Open ${evaluation.candidate_name}'s full report in a new tab`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-500">
                    Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedEvaluations.length)} of {sortedEvaluations.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 0}
                      onClick={() => setPage(currentPage - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="inline-flex h-8 min-w-20 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-600">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setPage(currentPage + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Evaluation Summary Modal */}
      {selectedEvaluation && (
        <EvaluationSummaryModal
          evaluation={selectedEvaluation}
          onClose={() => setSelectedEvaluation(null)}
          onViewReport={() => handleViewFullReport(selectedEvaluation.candidate_assessment_id)}
          onDecision={(decision) => {
            setSelectedEvaluation(null);
            requestDecision(selectedEvaluation.candidate_assessment_id, selectedEvaluation.candidate_name, selectedEvaluation.recruiter_decision, decision);
          }}
        />
      )}

      <DecisionModal
        key={`${modal.candidateId}:${modal.decision}:${modal.open}`}
        open={modal.open}
        candidateName={modal.candidateName}
        currentDecision={modal.currentDecision}
        decision={modal.decision}
        loading={isSaving}
        onClose={closeDecision}
        onConfirm={saveDecision}
      />
    </>
  );
};

/* ── Evaluation Summary Modal ─────────────────────────────────────────── */
const EvaluationSummaryModal: React.FC<{
  evaluation: RecruiterEvaluationListItem;
  onClose: () => void;
  onViewReport: () => void;
  onDecision: (decision: 'APPROVED' | 'REJECTED') => void;
}> = ({ evaluation, onClose, onViewReport, onDecision }) => {
  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const decision = decisionMeta(evaluation.recruiter_decision);
  const skills = orderedSkills(evaluation).slice(0, 4);
  const dimensions = [
    {
      label: 'Technical',
      score: evaluation.overall_technical_skill_score,
      icon: <BrainCircuit className="h-3.5 w-3.5" />,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Behaviour',
      score: evaluation.behavioural_cultural_score,
      icon: <Users className="h-3.5 w-3.5" />,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Communication',
      score: evaluation.communication_score,
      icon: <MessageSquareText className="h-3.5 w-3.5" />,
      tone: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <CenteredDialog
      onClose={onClose}
      labelledBy="evaluation-summary-title"
      className="max-w-6xl"
    >
      <div className="h-1.5 shrink-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500" />

      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-emerald-50/35 to-indigo-50/40 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 font-display text-sm font-black text-emerald-300 shadow-lg shadow-slate-900/10">
            {candidateInitials(evaluation.candidate_name)}
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap gap-1.5">
              <StatusPill {...recommendation} />
              <StatusPill {...decision} />
              {evaluation.validated_violation_count > 0 && (
                <StatusPill
                  label={`${evaluation.validated_violation_count} integrity concern${evaluation.validated_violation_count > 1 ? 's' : ''}`}
                  className="border-rose-200 bg-rose-50 text-rose-800"
                  dot="bg-rose-500"
                />
              )}
            </div>
            <h2 id="evaluation-summary-title" className="truncate font-display text-xl font-black text-slate-950">
              {evaluation.candidate_name}
            </h2>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
              {evaluation.candidate_email} · {evaluation.role_name} · {evaluation.assessment_title}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close evaluation summary"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="grid content-start gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-cyan-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <ScoreRing score={evaluation.overall_score} size={112} />
                <div className="min-w-0 text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                    Overall result
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    {scoreLabel(evaluation.overall_score)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">
                    AI recommendation: {recommendation.label}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'Rank', value: evaluation.rank_in_assessment ? `#${evaluation.rank_in_assessment}` : '—' },
                  { label: 'Percentile', value: evaluation.percentile_in_assessment !== null ? `${evaluation.percentile_in_assessment}%` : '—' },
                  { label: 'Cohort', value: evaluation.total_candidates_evaluated ? String(evaluation.total_candidates_evaluated) : '—' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white bg-white/80 px-2 py-2 text-center shadow-sm">
                    <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{stat.label}</p>
                    <p className="mt-0.5 text-sm font-black text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Core dimensions
              </p>
              <div className="space-y-3">
                {dimensions.map((dimension) => (
                  <div key={dimension.label}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${dimension.tone}`}>
                        {dimension.icon}
                      </span>
                      <span className="text-[11px] font-black text-slate-700">{dimension.label}</span>
                      <span className={`ml-auto text-xs font-black ${scoreTextClass(dimension.score)}`}>
                        {dimension.score.toFixed(1)}
                      </span>
                    </div>
                    <ScoreBar score={dimension.score} compact />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="grid content-start gap-3">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-indigo-950">Recommendation reasoning</p>
                  <p className="mt-1.5 line-clamp-4 text-[11px] font-medium leading-5 text-indigo-950/75">
                    {evaluation.recommendation_reasoning || evaluation.overall_summary}
                  </p>
                </div>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-950">Priority skill performance</p>
                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400">Highest-priority assessed capabilities</p>
                  </div>
                  <BrainCircuit className="h-4 w-4 text-cyan-600" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {skills.map(([skill, details]) => (
                    <div key={skill} className="rounded-xl border border-slate-100 bg-slate-50/75 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-[10px] font-black text-slate-700" title={skill}>{skill}</span>
                        <span className={`text-xs font-black ${scoreTextClass(details.score)}`}>
                          {details.score.toFixed(1)}
                        </span>
                      </div>
                      <ScoreBar score={details.score} compact />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/65 p-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <p className="text-xs font-black text-emerald-900">Key strengths</p>
                </div>
                <ul className="space-y-1.5">
                  {evaluation.strengths.slice(0, 3).map((strength) => (
                    <li key={strength} className="line-clamp-1 text-[10px] font-semibold text-emerald-900/80">• {strength}</li>
                  ))}
                  {evaluation.strengths.length === 0 && <li className="text-[10px] text-emerald-800/60">None identified.</li>}
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/65 p-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-700" />
                  <p className="text-xs font-black text-rose-900">Key concerns</p>
                </div>
                <ul className="space-y-1.5">
                  {evaluation.concerns.slice(0, 3).map((concern) => (
                    <li key={concern} className="line-clamp-1 text-[10px] font-semibold text-rose-900/80">• {concern}</li>
                  ))}
                  {evaluation.concerns.length === 0 && <li className="text-[10px] text-rose-800/60">None identified.</li>}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDecision('APPROVED')}
            disabled={evaluation.recruiter_decision === 'APPROVED'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Hire
          </button>
          <button
            type="button"
            onClick={() => onDecision('REJECTED')}
            disabled={evaluation.recruiter_decision === 'REJECTED'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-black text-rose-700 transition-all hover:bg-rose-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <UserX className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { onClose(); setTimeout(() => window.print(), 100); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onViewReport(); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 py-2 text-xs font-black text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
          >
            Open full report
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </footer>
    </CenteredDialog>
  );
};

/* ── Loading skeleton ─────────────────────────────────────────────────── */
const EvaluationLoadingState = () => (
  <div className="flex h-full min-h-[440px] flex-col gap-3 overflow-hidden">
    <div className="h-24 shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    <div className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ))}
    </div>
    <div className="flex-1 animate-pulse rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-500" />
          <p className="mt-3 text-xs font-bold text-slate-400">Loading candidate intelligence…</p>
        </div>
      </div>
    </div>
  </div>
);
