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
  ExternalLink,
  Filter,
  Loader2,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
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
  scoreLabel,
  scoreTextClass,
  useEvaluationDecision,
} from './evaluationUiUtils';

type DecisionFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
type SortOption = 'score' | 'recent' | 'rank';

const PAGE_SIZE = 10;

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
  const visibleEvaluations = sortedEvaluations.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
      <div className="ibot-scrollbar flex h-full min-h-0 flex-col gap-4 overflow-y-auto animate-fadeIn">
        {/* Header */}
        <section className="ibot-command-panel relative z-20 shrink-0 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">Decision center</span>
                <span className="text-[10px] font-bold text-slate-400">{stats.pending} awaiting review</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-slate-950">Candidate Intelligence</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Click any candidate to review their evaluation summary. Open full report in a new tab for detailed analysis.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 z-10" />
                <CustomSelect value={decisionFilter} onChange={(val) => handleFilterChange(val as DecisionFilter)}
                  options={[{ value: 'all', label: 'All decisions' }, { value: 'PENDING', label: 'Pending' }, { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' }]}
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
        <section className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricTile label="Evaluated" value={String(stats.total)} helper="completed reports" icon={<Award className="h-4 w-4" />} />
          <MetricTile label="Average score" value={stats.average.toFixed(1)} helper="out of 10" icon={<BarChart3 className="h-4 w-4" />} tone="indigo" />
          <MetricTile label="Pending" value={String(stats.pending)} helper="need a decision" icon={<Users className="h-4 w-4" />} tone="amber" />
          <MetricTile label="Approved" value={String(stats.approved)} helper="moving forward" icon={<UserCheck className="h-4 w-4" />} tone="emerald" />
          <div className="hidden lg:block">
            <MetricTile label="Rejected" value={String(stats.rejected)} helper="not progressing" icon={<UserX className="h-4 w-4" />} tone="rose" />
          </div>
        </section>

        {/* Candidate Grid */}
        <section className="ibot-panel shrink-0 overflow-hidden">
          <header className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
            <div>
              <p className="text-xs font-black text-slate-900">Candidate reports</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
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
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/95 border-b border-slate-200">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                  {visibleEvaluations.map((evaluation, i) => {
                    const recommendation = recommendationMeta(evaluation.hiring_recommendation);
                    const decision = decisionMeta(evaluation.recruiter_decision);
                    return (
                      <tr
                        key={evaluation.candidate_assessment_id}
                        className="group h-[60px] hover:bg-emerald-50/40 transition-colors animate-slideUp cursor-pointer"
                        style={{ animationDelay: `${i * 0.02}s` }}
                        onClick={() => setSelectedEvaluation(evaluation)}
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 font-black text-[11px] text-emerald-300">
                              {candidateInitials(evaluation.candidate_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-700 transition-colors">{evaluation.candidate_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">{evaluation.candidate_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{evaluation.assessment_title}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">{evaluation.role_name}</p>
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
                          <p className="text-[10px] text-slate-400 font-medium">{formatDateTime(evaluation.generated_at)}</p>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'APPROVED')}
                              disabled={evaluation.recruiter_decision === 'APPROVED'}
                              className="h-8 w-8 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 transition-colors"
                              title="Approve"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'REJECTED')}
                              disabled={evaluation.recruiter_decision === 'REJECTED'}
                              className="h-8 w-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 disabled:opacity-30 transition-colors"
                              title="Reject"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewFullReport(evaluation.candidate_assessment_id)}
                              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                              title="Open full report in new tab"
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

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3">
                  <p className="text-[10px] font-semibold text-slate-500">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sortedEvaluations.length)} of {sortedEvaluations.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPage(i)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${i === page ? 'bg-slate-950 text-emerald-300' : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
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

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)' }}
      onMouseDown={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/25 w-full max-w-2xl max-h-[88vh] flex flex-col animate-scaleIn overflow-hidden my-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 shrink-0" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 font-display text-sm font-black text-emerald-300">
                {candidateInitials(evaluation.candidate_name)}
              </div>
              <div>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <StatusPill {...recommendation} />
                  <StatusPill {...decision} />
                  {evaluation.validated_violation_count > 0 && (
                    <StatusPill label={`${evaluation.validated_violation_count} violation${evaluation.validated_violation_count > 1 ? 's' : ''}`} className="border-rose-200 bg-rose-50 text-rose-800" dot="bg-rose-500" />
                  )}
                </div>
                <h2 className="font-display text-xl font-black text-slate-950">{evaluation.candidate_name}</h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{evaluation.candidate_email} · {evaluation.role_name}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="ibot-scrollbar flex-1 overflow-y-auto p-6 space-y-5">
          {/* Score + radar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-center">
              <ScoreRing score={evaluation.overall_score} size={130} />
              <p className="mt-2 text-xs font-black text-slate-700">{scoreLabel(evaluation.overall_score)} performance</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1 mb-1">Competency shape</p>
              <CompetencyRadar points={[
                { label: 'Technical', score: evaluation.overall_technical_skill_score },
                { label: 'Behaviour', score: evaluation.behavioural_cultural_score },
                { label: 'Communication', score: evaluation.communication_score },
              ]} />
            </div>
          </div>

          {/* Core dimensions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Technical', score: evaluation.overall_technical_skill_score, icon: <BrainCircuit className="h-3.5 w-3.5" /> },
              { label: 'Behaviour', score: evaluation.behavioural_cultural_score, icon: <Users className="h-3.5 w-3.5" /> },
              { label: 'Communication', score: evaluation.communication_score, icon: <MessageSquareText className="h-3.5 w-3.5" /> },
            ].map((dim) => (
              <div key={dim.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ${scoreTextClass(dim.score)}`}>{dim.icon}</div>
                <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">{dim.label}</p>
                <p className={`mt-1 font-display text-xl font-black ${scoreTextClass(dim.score)}`}>{dim.score.toFixed(1)}<span className="text-[10px] text-slate-400">/10</span></p>
              </div>
            ))}
          </div>

          {/* Top skills */}
          {skills.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black text-slate-900 mb-3">Priority skill performance</p>
              <div className="space-y-3">
                {skills.map(([skill, details]) => (
                  <ScoreBar key={skill} score={details.score} label={skill} />
                ))}
              </div>
            </div>
          )}

          {/* Strengths / Concerns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                <p className="text-xs font-black text-emerald-800">Strengths</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.strengths.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-full bg-white/80 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{s}</span>
                ))}
                {evaluation.strengths.length === 0 && <p className="text-[10px] text-emerald-700/60">None identified.</p>}
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-700" />
                <p className="text-xs font-black text-rose-800">Concerns</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.concerns.slice(0, 3).map((c) => (
                  <span key={c} className="rounded-full bg-white/80 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">{c}</span>
                ))}
                {evaluation.concerns.length === 0 && <p className="text-[10px] text-rose-700/60">None identified.</p>}
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rank', value: evaluation.rank_in_assessment ? `#${evaluation.rank_in_assessment}` : '—' },
              { label: 'Percentile', value: evaluation.percentile_in_assessment !== null ? `${evaluation.percentile_in_assessment}%` : '—' },
              { label: 'Cohort', value: evaluation.total_candidates_evaluated ? String(evaluation.total_candidates_evaluated) : '—' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 text-center px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{stat.label}</p>
                <p className="mt-1 text-sm font-black text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Summary snippet */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <p className="text-xs font-black text-indigo-900 mb-1.5">Recommendation reasoning</p>
            <p className="text-xs font-medium leading-6 text-indigo-900/80 line-clamp-3">{evaluation.recommendation_reasoning}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDecision('APPROVED')}
              disabled={evaluation.recruiter_decision === 'APPROVED'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => onDecision('REJECTED')}
              disabled={evaluation.recruiter_decision === 'REJECTED'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-black text-rose-700 transition-all hover:bg-rose-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
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
              Download
            </button>
            <button
              type="button"
              onClick={onViewReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 py-2 text-xs font-black text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              Full report
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Loading skeleton ─────────────────────────────────────────────────── */
const EvaluationLoadingState = () => (
  <div className="flex h-full min-h-[440px] flex-col gap-4">
    <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
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

