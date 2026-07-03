import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
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
  Search,
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

const PAGE_SIZE = 4;
const CANDIDATE_AVATAR_TONES = [
  'from-emerald-500 to-green-600 shadow-emerald-600/15 ring-emerald-50',
  'from-indigo-500 to-violet-600 shadow-indigo-600/15 ring-indigo-50',
  'from-amber-400 to-orange-500 shadow-amber-500/15 ring-amber-50',
  'from-sky-500 to-blue-600 shadow-sky-600/15 ring-sky-50',
  'from-violet-500 to-fuchsia-600 shadow-violet-600/15 ring-violet-50',
];

const candidateAvatarTone = (name: string) => {
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return CANDIDATE_AVATAR_TONES[hash % CANDIDATE_AVATAR_TONES.length];
};

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
    generateFeedback,
    isSaving,
    isGeneratingFeedback,
  } = useEvaluationDecision();
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all');
  const [assessmentFilter, setAssessmentFilter] = useState('all');
  const [sort, setSort] = useState<SortOption>('score');
  const [searchQuery, setSearchQuery] = useState('');
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

  const assessmentOptions = useMemo(() => {
    const options = new Map<string, string>();
    evaluations.forEach((evaluation) => {
      options.set(
        evaluation.assessment_id,
        `${evaluation.assessment_title} · ${evaluation.role_name}`,
      );
    });
    return [...options.entries()]
      .sort(([, left], [, right]) => left.localeCompare(right))
      .map(([value, label]) => ({ value, label }));
  }, [evaluations]);

  const contextualEvaluations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return evaluations.filter((e) => {
      const matchesAssessment =
        assessmentFilter === 'all' || e.assessment_id === assessmentFilter;
      const matchesSearch =
        !query ||
        [
          e.candidate_name,
          e.candidate_email,
          e.assessment_title,
          e.role_name,
        ].some((value) => value?.toLowerCase().includes(query));
      return matchesAssessment && matchesSearch;
    });
  }, [assessmentFilter, evaluations, searchQuery]);

  const contextualCounts = useMemo(() => {
    const approved = contextualEvaluations.filter(
      (evaluation) => evaluation.recruiter_decision === 'APPROVED',
    ).length;
    const rejected = contextualEvaluations.filter(
      (evaluation) => evaluation.recruiter_decision === 'REJECTED',
    ).length;
    return {
      total: contextualEvaluations.length,
      approved,
      rejected,
      pending: contextualEvaluations.length - approved - rejected,
    };
  }, [contextualEvaluations]);

  const sortedEvaluations = useMemo(() => {
    const filtered = contextualEvaluations.filter(
      (evaluation) =>
        decisionFilter === 'all' ||
        evaluation.recruiter_decision === decisionFilter,
    );
    return [...filtered].sort((a, b) => {
      if (sort === 'recent') return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
      if (sort === 'rank') return (a.rank_in_assessment ?? 9999) - (b.rank_in_assessment ?? 9999);
      return b.overall_score - a.overall_score;
    });
  }, [contextualEvaluations, decisionFilter, sort]);

  const totalPages = Math.ceil(sortedEvaluations.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleEvaluations = sortedEvaluations.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const handleFilterChange = (val: DecisionFilter) => { setDecisionFilter(val); setPage(0); };
  const handleAssessmentChange = (value: string) => { setAssessmentFilter(value); setPage(0); };
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
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden animate-fadeIn">
        {/* Compact command strip */}
        <section className="relative z-20 flex shrink-0 items-center justify-between gap-5 overflow-visible rounded-2xl border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/45 to-white px-5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_30px_rgba(5,150,105,0.1)]">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition-transform duration-200 hover:rotate-3 hover:scale-105">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-black tracking-tight text-slate-950">
                  Candidate evaluation queue
                </h2>
                {stats.pending > 0 && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                    {stats.pending} pending
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Evidence-led reports, ranked for recruiter review.
              </p>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-4 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80">
            {[
              { label: 'Reports', value: String(stats.total), tone: 'text-slate-900' },
              { label: 'Average', value: stats.average.toFixed(1), tone: 'text-indigo-700' },
              { label: 'Hired', value: String(stats.approved), tone: 'text-emerald-700' },
              { label: 'Rejected', value: String(stats.rejected), tone: 'text-rose-700' },
            ].map((item) => (
              <div key={item.label} className="min-w-20 px-3.5 py-2 text-center">
                <p className={`font-display text-base font-black ${item.tone}`}>{item.value}</p>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Candidate Grid */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <header className="shrink-0 border-b border-slate-200 bg-slate-50/55 px-5 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 transition-transform duration-200 hover:rotate-3 hover:scale-105">
                  <UserRoundSearch className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">Candidate reports</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {sortedEvaluations.length} matching · {PAGE_SIZE} reports per page
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative block w-60">
                  <span className="sr-only">Search candidate reports</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPage(0);
                    }}
                    placeholder="Search candidate, role, or assessment"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-emerald-300 hover:shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <CustomSelect
                  value={assessmentFilter}
                  onChange={handleAssessmentChange}
                  options={[
                    { value: 'all', label: 'All assessments' },
                    ...assessmentOptions,
                  ]}
                  buttonClassName="h-10 w-52"
                />
                <CustomSelect
                  value={sort}
                  onChange={(val) => handleSortChange(val as SortOption)}
                  options={[
                    { value: 'score', label: 'Highest score' },
                    { value: 'rank', label: 'Best rank' },
                    { value: 'recent', label: 'Most recent' },
                  ]}
                  buttonClassName="h-10 w-40"
                />
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              {([
                { value: 'all', label: 'All reports', count: contextualCounts.total },
                { value: 'PENDING', label: 'Pending', count: contextualCounts.pending },
                { value: 'APPROVED', label: 'Hired', count: contextualCounts.approved },
                { value: 'REJECTED', label: 'Rejected', count: contextualCounts.rejected },
              ] as const).map((filter) => {
                const active = decisionFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleFilterChange(filter.value)}
                    aria-pressed={active}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-extrabold transition-all ${
                      active
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-sm'
                    }`}
                  >
                    {filter.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </header>

          {sortedEvaluations.length === 0 ? (
            <div className="grid min-h-52 place-items-center p-6 text-center">
              <div>
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Filter className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-black text-slate-700">No reports match this filter</p>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionFilter('all');
                    setSearchQuery('');
                    setPage(0);
                  }}
                  className="mt-2 text-[11px] font-black text-indigo-700 hover:text-indigo-800"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden">
              <table className="w-full table-fixed border-collapse text-left">
                <thead className="border-b border-slate-200 bg-slate-50/95">
                  <tr className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    <th className="w-[20%] px-4 py-3">Candidate</th>
                    <th className="w-[17%] px-3 py-3">Assessment</th>
                    <th className="w-[10%] px-3 py-3">Score</th>
                    <th className="w-[10%] px-3 py-3">AI signal</th>
                    <th className="w-[12%] px-3 py-3">Decision</th>
                    <th className="w-[12%] px-3 py-3">Evaluated</th>
                    <th className="w-[19%] px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visibleEvaluations.map((evaluation) => {
                    const recommendation = recommendationMeta(evaluation.hiring_recommendation);
                    const decision = decisionMeta(evaluation.recruiter_decision);
                    return (
                      <tr
                        key={evaluation.candidate_assessment_id}
                        className="group h-[64px] cursor-pointer transition-all hover:bg-emerald-50/55 focus-visible:bg-emerald-50 focus-visible:outline-none"
                        onClick={() => setSelectedEvaluation(evaluation)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedEvaluation(evaluation);
                          }
                        }}
                        tabIndex={0}
                        aria-label={`Review ${evaluation.candidate_name}'s evaluation summary`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-xs font-black text-white shadow-md ring-4 transition-all duration-200 group-hover:-rotate-2 group-hover:scale-105 ${candidateAvatarTone(evaluation.candidate_name)}`}>
                              {candidateInitials(evaluation.candidate_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-slate-900 transition-colors group-hover:text-emerald-700">{evaluation.candidate_name}</p>
                              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{evaluation.candidate_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="max-w-[190px] truncate text-xs font-bold text-slate-800">{evaluation.assessment_title}</p>
                            <p className="mt-0.5 max-w-[180px] truncate text-[11px] font-medium text-slate-500">{evaluation.role_name}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className={`font-display text-lg font-black ${scoreTextClass(evaluation.overall_score)}`}>
                              {evaluation.overall_score.toFixed(1)}
                            </span>
                            <div className="hidden w-20 sm:block">
                              <ScoreBar score={evaluation.overall_score} compact />
                              <p className="mt-1 text-[9px] font-bold text-slate-400">out of 10</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill {...recommendation} />
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill {...decision} />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-[11px] font-medium text-slate-500">{formatDateTime(evaluation.generated_at)}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedEvaluation(evaluation)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-black text-white shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
                              aria-label={`Review ${evaluation.candidate_name}'s evaluation summary`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Review
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'APPROVED')}
                              disabled={evaluation.recruiter_decision === 'APPROVED'}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Hire"
                              aria-label={`Hire ${evaluation.candidate_name}`}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'REJECTED')}
                              disabled={evaluation.recruiter_decision === 'REJECTED'}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Reject"
                              aria-label={`Reject ${evaluation.candidate_name}`}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewFullReport(evaluation.candidate_assessment_id)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
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
              <div className="mt-auto flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-5 py-2.5">
                <p className="text-[11px] font-semibold text-slate-500">
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedEvaluations.length)} of {sortedEvaluations.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous report page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="inline-flex h-8 min-w-24 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600">
                    Page {currentPage + 1} of {Math.max(totalPages, 1)}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setPage(currentPage + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next report page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
        generatingFeedback={isGeneratingFeedback}
        onClose={closeDecision}
        onConfirm={saveDecision}
        onGenerateFeedback={generateFeedback}
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
      tone: 'bg-blue-50 text-blue-700',
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
      <div className="h-1.5 shrink-0 bg-gradient-to-r from-emerald-500 via-sky-400 to-indigo-500" />

      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 font-display text-sm font-black text-white shadow-lg shadow-emerald-600/20 ring-4 ring-emerald-50">
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
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-4 shadow-sm">
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

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 p-4 shadow-sm">
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
                  <BrainCircuit className="h-4 w-4 text-indigo-600" />
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
                    <li key={strength} className="line-clamp-2 text-[10px] font-semibold leading-relaxed text-emerald-900/80">• {strength}</li>
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
                    <li key={concern} className="line-clamp-2 text-[10px] font-semibold leading-relaxed text-rose-900/80">• {concern}</li>
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
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
