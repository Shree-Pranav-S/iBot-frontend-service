import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  Filter,
  Loader2,
  MessageSquareText,
  Printer,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
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
  cleanRecruiterNarrative,
  decisionMeta,
  isDecisionFinalized,
  recommendationMeta,
  scoreLabel,
  scoreTextClass,
  useEvaluationDecision,
} from './evaluationUiUtils';

type DecisionFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
type SortOption = 'priority' | 'score' | 'recent' | 'rank';
type ScoreBandKey = 'below4' | 'fourToSix' | 'sixToEight' | 'eightToTen';
type ChartSelection =
  | { kind: 'decision'; filter: DecisionFilter }
  | { kind: 'score'; band: ScoreBandKey };

const SCORE_BANDS: ReadonlyArray<{
  key: ScoreBandKey;
  label: string;
  shortLabel: string;
  description: string;
  tone: string;
  fillClass: string;
  matches: (score: number) => boolean;
}> = [
  {
    key: 'below4',
    label: 'Below 4.0',
    shortLabel: '<4',
    description: 'Candidates who need the closest evidence review.',
    tone: '#FB7185',
    fillClass: 'bg-rose-400',
    matches: (score) => score < 4,
  },
  {
    key: 'fourToSix',
    label: '4.0–5.9',
    shortLabel: '4–5.9',
    description: 'Candidates with a developing or mixed overall fit.',
    tone: '#FBBF24',
    fillClass: 'bg-amber-400',
    matches: (score) => score >= 4 && score < 6,
  },
  {
    key: 'sixToEight',
    label: '6.0–7.9',
    shortLabel: '6–7.9',
    description: 'Candidates showing a strong overall fit.',
    tone: '#B9833F',
    fillClass: 'bg-brand-accent',
    matches: (score) => score >= 6 && score < 8,
  },
  {
    key: 'eightToTen',
    label: '8.0–10',
    shortLabel: '8–10',
    description: 'Top-scoring candidates with the strongest overall fit.',
    tone: '#10B981',
    fillClass: 'bg-emerald-500',
    matches: (score) => score >= 8,
  },
];

const DECISION_CHART_META: Record<DecisionFilter, {
  label: string;
  shortLabel: string;
  description: string;
  stroke: string;
  dotClass: string;
}> = {
  all: {
    label: 'All evaluated candidates',
    shortLabel: 'Evaluated',
    description: 'Every completed candidate evaluation in this workspace.',
    stroke: '#24211D',
    dotClass: 'bg-brand-charcoal',
  },
  PENDING: {
    label: 'Needs review',
    shortLabel: 'Review',
    description: 'Candidates still waiting for a recruiter decision.',
    stroke: '#B9833F',
    dotClass: 'bg-brand-accent',
  },
  APPROVED: {
    label: 'Hired',
    shortLabel: 'Hired',
    description: 'Candidates finalized with a hire decision.',
    stroke: '#059669',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    shortLabel: 'Rejected',
    description: 'Candidates finalized with a reject decision.',
    stroke: '#E11D48',
    dotClass: 'bg-rose-600',
  },
};

const PAGE_SIZE = 3;
const CANDIDATE_AVATAR_TONES = [
  'from-brand-accent to-brand-hover shadow-[rgba(185,131,63,0.18)] ring-brand-soft',
  'from-[#8A6A45] to-brand-hover shadow-[rgba(138,106,69,0.18)] ring-brand-soft',
  'from-amber-400 to-orange-500 shadow-amber-500/15 ring-amber-50',
  'from-brand-charcoal to-[#4A4035] shadow-[rgba(36,33,29,0.18)] ring-brand-soft',
  'from-[#C59A5D] to-brand-accent shadow-[rgba(197,154,93,0.18)] ring-brand-soft',
];

const candidateAvatarTone = (name: string) => {
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return CANDIDATE_AVATAR_TONES[hash % CANDIDATE_AVATAR_TONES.length];
};

const formatShare = (count: number, total: number) => {
  if (!total) return '0%';
  const percentage = (count / total) * 100;
  return `${Number.isInteger(percentage) ? percentage.toFixed(0) : percentage.toFixed(1)}%`;
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
  const [sort, setSort] = useState<SortOption>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedEvaluation, setSelectedEvaluation] = useState<RecruiterEvaluationListItem | null>(null);
  const [chartSelection, setChartSelection] = useState<ChartSelection | null>(null);
  const chartTriggerRef = useRef<(Element & { focus: () => void }) | null>(null);

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
      if (sort === 'priority') {
        const decisionPriority = Number(a.recruiter_decision !== 'PENDING') - Number(b.recruiter_decision !== 'PENDING');
        return decisionPriority || b.overall_score - a.overall_score;
      }
      return b.overall_score - a.overall_score;
    });
  }, [contextualEvaluations, decisionFilter, sort]);

  const nextEvaluation = useMemo(
    () =>
      [...evaluations]
        .filter((evaluation) => evaluation.recruiter_decision === 'PENDING')
        .sort((left, right) => right.overall_score - left.overall_score)[0] ?? null,
    [evaluations],
  );

  const totalPages = Math.ceil(sortedEvaluations.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleEvaluations = sortedEvaluations.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const handleFilterChange = (val: DecisionFilter) => { setDecisionFilter(val); setPage(0); };
  const handleGlobalFilterChange = (val: DecisionFilter) => {
    setAssessmentFilter('all');
    setSearchQuery('');
    handleFilterChange(val);
  };
  const handleAssessmentChange = (value: string) => { setAssessmentFilter(value); setPage(0); };
  const handleSortChange = (val: SortOption) => { setSort(val); setPage(0); };
  const openChartDetail = (selection: ChartSelection) => {
    const activeElement = document.activeElement;
    chartTriggerRef.current = activeElement && 'focus' in activeElement
      ? activeElement as Element & { focus: () => void }
      : null;
    setChartSelection(selection);
  };
  const closeChartDetail = () => {
    setChartSelection(null);
    window.requestAnimationFrame(() => chartTriggerRef.current?.focus());
  };

  const handleViewFullReport = (caId: string) => {
    window.open(`/candidates/${caId}/report`, '_blank', 'noopener,noreferrer');
  };

  const handlePrintReport = (caId: string) => {
    window.open(`/candidates/${caId}/report?print=1`, '_blank', 'noopener,noreferrer');
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
          <button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-brand-charcoal px-4 py-2.5 text-xs font-black text-white hover:bg-brand-hover">
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-hover">
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
      <div className="evaluation-viewport ibot-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-x-hidden animate-fadeIn print:hidden">
        <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:h-[172px] xl:grid-cols-[minmax(0,1.18fr)_minmax(260px,0.82fr)_minmax(290px,1fr)]">
          <article className="relative isolate flex min-h-[172px] overflow-hidden rounded-[18px] border border-brand-accent/30 bg-brand-charcoal px-5 py-4 text-white shadow-[0_18px_42px_-28px_rgba(36,33,29,0.9)] md:col-span-2 xl:col-span-1">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_12%,rgba(185,131,63,0.42),transparent_31%),linear-gradient(130deg,#24211D_0%,#302A23_58%,#4A3825_100%)]" />
            <div className="pointer-events-none absolute -right-10 -top-16 -z-10 h-44 w-44 rounded-full border border-white/10" />
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#E8C794]">
                  <Target className="h-3.5 w-3.5" />
                  Decision command center
                </div>
                <div className="mt-2.5 flex items-end gap-3">
                  <span className="font-display text-[42px] font-black leading-none tracking-[-0.06em] text-white">
                    {stats.pending}
                  </span>
                  <div className="pb-0.5">
                    <h2 className="font-display text-base font-black leading-tight text-white">
                      {stats.pending === 1 ? 'candidate needs review' : 'candidates need review'}
                    </h2>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#CFC3B5]">
                      Highest-fit undecided candidates are surfaced first.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (nextEvaluation) setSelectedEvaluation(nextEvaluation);
                    else handleFilterChange('all');
                  }}
                  className="group inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 text-[11px] font-black text-brand-charcoal shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#F4E8D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C794]"
                >
                  {nextEvaluation ? 'Review next candidate' : 'View all candidates'}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between text-[9px] font-bold text-[#B8AA9A]">
                    <span>Decision progress</span>
                    <span>{Math.round(((stats.approved + stats.rejected) / stats.total) * 100)}%</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-label="Recruiter decision progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(((stats.approved + stats.rejected) / stats.total) * 100)}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#B9833F] to-[#E8C794] transition-[width] duration-500"
                      style={{ width: `${((stats.approved + stats.rejected) / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>

          <DecisionMixChart
            total={stats.total}
            pending={stats.pending}
            approved={stats.approved}
            rejected={stats.rejected}
            activeFilter={decisionFilter}
            onFilter={handleGlobalFilterChange}
            onOpenDetail={(filter) => openChartDetail({ kind: 'decision', filter })}
          />

          <ScoreDistributionChart
            evaluations={evaluations}
            average={stats.average}
            total={stats.total}
            scoreSortActive={sort === 'score'}
            allActive={decisionFilter === 'all'}
            onShowAll={() => handleGlobalFilterChange('all')}
            onSortScore={() => handleSortChange('score')}
            onOpenDetail={(band) => openChartDetail({ kind: 'score', band })}
          />
        </section>

        {/* Candidate Grid */}
        <section className="evaluation-board ibot-section-surface flex min-h-0 shrink-0 flex-col overflow-hidden">
          <header className="relative z-20 shrink-0 border-b border-default bg-gradient-to-r from-[#FCFAF6] via-white to-[#FCFAF6] px-3.5 py-3 sm:px-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-hover ring-1 ring-brand-accent/20">
                   <UserRoundSearch className="h-[18px] w-[18px]" />
                 </div>
                 <div className="min-w-0">
                   <h2 className="truncate font-display text-base font-black tracking-[-0.02em] text-slate-950">
                     Candidate review board
                   </h2>
                 </div>
               </div>
              <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:items-center">
                <label className="relative block w-full sm:col-span-2 xl:w-64">
                  <span className="sr-only">Search candidate reports</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPage(0);
                    }}
                    placeholder="Search candidates or roles"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-brand-accent hover:shadow-sm focus:border-brand-accent focus:ring-4 focus:ring-brand-soft"
                  />
                </label>
                <CustomSelect
                  value={assessmentFilter}
                  onChange={handleAssessmentChange}
                  ariaLabel="Filter candidates by assessment"
                  options={[
                    { value: 'all', label: 'All assessments' },
                    ...assessmentOptions,
                  ]}
                  buttonClassName="h-10 w-full xl:w-48"
                  className="w-full xl:w-auto"
                />
                <CustomSelect
                  value={sort}
                  onChange={(val) => handleSortChange(val as SortOption)}
                  ariaLabel="Sort candidates"
                  options={[
                    { value: 'priority', label: 'Needs review first' },
                    { value: 'score', label: 'Highest score' },
                    { value: 'rank', label: 'Best rank' },
                    { value: 'recent', label: 'Most recent' },
                  ]}
                  buttonClassName="h-10 w-full xl:w-44"
                  className="w-full xl:w-auto"
                />
              </div>
            </div>
            <div className="ibot-scrollbar mt-2 flex items-center gap-2 overflow-x-auto pb-0.5">
              {([
                { value: 'all', label: 'All candidates', count: contextualCounts.total },
                { value: 'PENDING', label: 'Needs review', count: contextualCounts.pending },
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
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-extrabold transition-all ${
                      active
                        ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-sm shadow-black/15'
                        : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-soft hover:text-brand-hover'
                    }`}
                  >
                    {filter.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                        active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'
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
            <div className="grid min-h-64 flex-1 place-items-center p-6 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Filter className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-black text-slate-800">No candidates match this view</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">Try a different status, assessment, or search term.</p>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionFilter('all');
                    setAssessmentFilter('all');
                    setSearchQuery('');
                    setPage(0);
                  }}
                  className="mt-3 rounded-lg bg-brand-charcoal px-3.5 py-2 text-[11px] font-black text-white hover:bg-brand-hover"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ibot-scrollbar grid min-h-0 flex-none items-start gap-3 overflow-visible p-3 sm:p-4 lg:flex-1 lg:grid-cols-3 lg:overflow-y-auto">
                {visibleEvaluations.map((evaluation) => (
                  <CandidateReviewCard
                     key={evaluation.candidate_assessment_id}
                     evaluation={evaluation}
                     onReview={() => setSelectedEvaluation(evaluation)}
                     onDecision={(decision) =>
                      requestDecision(
                        evaluation.candidate_assessment_id,
                        evaluation.candidate_name,
                        evaluation.recruiter_decision,
                        decision,
                      )
                    }
                  />
                ))}
              </div>
              <footer className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-default bg-[#FCFAF6]/90 px-3.5 py-2 sm:px-4">
                <p className="min-w-0 truncate text-[10px] font-semibold text-slate-500">
                  Showing <span className="font-black text-slate-700">{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedEvaluations.length)}</span> of {sortedEvaluations.length} {sortedEvaluations.length === 1 ? 'candidate' : 'candidates'}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous candidate page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="inline-flex h-8 min-w-[88px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-black text-slate-600">
                    {currentPage + 1} / {Math.max(totalPages, 1)}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setPage(currentPage + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next candidate page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>

      {chartSelection && (
        <ChartDetailModal
          selection={chartSelection}
          evaluations={evaluations}
          onClose={closeChartDetail}
          onReview={(evaluation) => {
            setChartSelection(null);
            setSelectedEvaluation(evaluation);
          }}
          onShowDecisionFilter={(filter) => {
            handleGlobalFilterChange(filter);
            closeChartDetail();
          }}
          onSortByScore={() => {
            handleSortChange('score');
            closeChartDetail();
          }}
        />
      )}

      {/* Evaluation Summary Modal */}
      {selectedEvaluation && (
        <EvaluationSummaryModal
          evaluation={selectedEvaluation}
          onClose={() => setSelectedEvaluation(null)}
          onViewReport={() => handleViewFullReport(selectedEvaluation.candidate_assessment_id)}
          onPrintReport={() => handlePrintReport(selectedEvaluation.candidate_assessment_id)}
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

const DecisionMixChart: React.FC<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  activeFilter: DecisionFilter;
  onFilter: (filter: DecisionFilter) => void;
  onOpenDetail: (filter: DecisionFilter) => void;
}> = ({ total, pending, approved, rejected, activeFilter, onFilter, onOpenDetail }) => {
  const [hoveredFilter, setHoveredFilter] = useState<DecisionFilter | null>(null);
  let cumulativePercentage = 0;
  const items = ([
    { count: pending, filter: 'PENDING' as const },
    { count: approved, filter: 'APPROVED' as const },
    { count: rejected, filter: 'REJECTED' as const },
  ]).map((item) => {
    const percentage = total ? (item.count / total) * 100 : 0;
    const start = cumulativePercentage;
    cumulativePercentage += percentage;
    return { ...item, ...DECISION_CHART_META[item.filter], percentage, start };
  });
  const hoveredItem = items.find((item) => item.filter === hoveredFilter) ?? null;
  const centerCount = hoveredItem?.count ?? total;
  const centerLabel = hoveredItem?.shortLabel ?? DECISION_CHART_META.all.shortLabel;

  return (
    <article className="flex min-h-[172px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-default bg-white p-4 shadow-[0_14px_34px_-28px_rgba(36,33,29,0.55)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-display text-sm font-black text-slate-950">Decision mix</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Recruiter outcomes</p>
        </div>
        <button
          type="button"
          onClick={() => onFilter('all')}
          aria-pressed={activeFilter === 'all'}
          className={`rounded-lg px-2 py-1 text-[10px] font-black transition-colors ${activeFilter === 'all' ? 'bg-brand-soft text-brand-hover' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
        >
          View all
        </button>
      </div>

      <div className="mt-2 flex min-h-0 flex-1 items-center gap-3">
        <div className="relative grid h-[92px] w-[104px] shrink-0 place-items-center">
          <svg
            viewBox="0 0 100 100"
            className="h-[92px] w-[92px] overflow-visible"
            role="group"
            aria-label={`${total} evaluated candidates by recruiter decision`}
          >
            <circle cx="50" cy="50" r="37" fill="none" stroke="#F1EDE7" strokeWidth="13" />
            {items.map((item) => {
              if (item.count === 0) return null;
              const visibleArc = Math.max(item.percentage - 1.2, 0.5);
              const highlighted = hoveredFilter === item.filter;
              return (
                <circle
                  key={item.filter}
                  cx="50"
                  cy="50"
                  r="37"
                  fill="none"
                  stroke={item.stroke}
                  strokeWidth={highlighted ? 16 : 13}
                  pathLength="100"
                  strokeDasharray={`${visibleArc} ${100 - visibleArc}`}
                  strokeDashoffset={-item.start}
                  transform="rotate(-90 50 50)"
                  role="button"
                  tabIndex={0}
                  aria-haspopup="dialog"
                  aria-label={`${item.label}: ${item.count} ${item.count === 1 ? 'candidate' : 'candidates'}, ${formatShare(item.count, total)}. Open details.`}
                  onMouseEnter={() => setHoveredFilter(item.filter)}
                  onMouseLeave={() => setHoveredFilter(null)}
                  onFocus={() => setHoveredFilter(item.filter)}
                  onBlur={() => setHoveredFilter(null)}
                  onClick={() => onOpenDetail(item.filter)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOpenDetail(item.filter);
                    }
                  }}
                  className="cursor-pointer outline-none transition-[stroke-width,filter,opacity] duration-200 focus-visible:opacity-80"
                  style={{ filter: highlighted ? `drop-shadow(0 3px 4px ${item.stroke}55)` : undefined }}
                />
              );
            })}
          </svg>
          <button
            type="button"
            onClick={() => onOpenDetail('all')}
            aria-haspopup="dialog"
            aria-label={`Open details for all ${total} evaluated candidates`}
            className="absolute grid h-[62px] w-[62px] place-items-center rounded-full border border-white bg-[#FCFAF6] text-center shadow-inner transition-all hover:scale-105 hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <strong className="block font-display text-xl font-black leading-none text-slate-950">{centerCount}</strong>
              <span className="mx-auto mt-1 block max-w-[52px] text-[0.5rem] font-black uppercase leading-[1.05] tracking-[0.03em] text-slate-500">
                {centerLabel}
              </span>
            </span>
          </button>
          {hoveredItem && (
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[0.52rem] font-bold text-white shadow-lg"
            >
              {hoveredItem.label} · {hoveredItem.count} · {formatShare(hoveredItem.count, total)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          {items.map((item) => (
            <button
              key={item.filter}
              type="button"
              onClick={() => onOpenDetail(item.filter)}
              onMouseEnter={() => setHoveredFilter(item.filter)}
              onMouseLeave={() => setHoveredFilter(null)}
              onFocus={() => setHoveredFilter(item.filter)}
              onBlur={() => setHoveredFilter(null)}
              aria-haspopup="dialog"
              aria-label={`Open ${item.label.toLowerCase()} details`}
              className={`flex w-full items-center rounded-lg border px-2 py-1.5 text-left transition-all ${
                activeFilter === item.filter
                  ? 'border-brand-accent/30 bg-brand-soft/70'
                  : hoveredFilter === item.filter
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className={`mr-2 h-2 w-2 shrink-0 rounded-full ${item.dotClass}`} />
              <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-500">{item.label}</span>
              <span className="font-display text-xs font-black text-slate-900">{item.count}</span>
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};

const ScoreDistributionChart: React.FC<{
  evaluations: RecruiterEvaluationListItem[];
  average: number;
  total: number;
  scoreSortActive: boolean;
  allActive: boolean;
  onShowAll: () => void;
  onSortScore: () => void;
  onOpenDetail: (band: ScoreBandKey) => void;
}> = ({ evaluations, average, total, scoreSortActive, allActive, onShowAll, onSortScore, onOpenDetail }) => {
  const [hoveredBand, setHoveredBand] = useState<ScoreBandKey | null>(null);
  const bands = SCORE_BANDS.map((band) => ({
    ...band,
    count: evaluations.filter((item) => band.matches(item.overall_score)).length,
  }));
  const maxCount = Math.max(...bands.map((band) => band.count), 1);
  const activeBand = bands.find((band) => band.key === hoveredBand) ?? null;

  return (
    <article className="flex min-h-[172px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-default bg-white p-4 shadow-[0_14px_34px_-28px_rgba(36,33,29,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-hover" />
            <p className="font-display text-sm font-black text-slate-950">Score distribution</p>
          </div>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Candidate quality spread</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onShowAll}
            aria-pressed={allActive}
            title="Show all evaluated candidates"
            className={`rounded-lg border px-2 py-1 text-center transition-colors ${allActive ? 'border-brand-accent/30 bg-brand-soft' : 'border-slate-200 bg-slate-50 hover:border-brand-accent'}`}
          >
            <span className="block font-display text-xs font-black text-slate-900">{total}</span>
            <span className="block whitespace-nowrap text-[0.5rem] font-black uppercase tracking-[0.04em] text-slate-400">Evaluated</span>
          </button>
          <button
            type="button"
            onClick={onSortScore}
            aria-pressed={scoreSortActive}
            title="Sort candidates by score"
            className={`rounded-lg border px-2 py-1 text-center transition-colors ${scoreSortActive ? 'border-brand-accent/30 bg-brand-soft' : 'border-slate-200 bg-slate-50 hover:border-brand-accent'}`}
          >
            <span className="block font-display text-xs font-black text-brand-hover">{average.toFixed(1)}</span>
            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Average</span>
          </button>
        </div>
      </div>

      <div className="mt-1.5 flex h-5 items-center" aria-live="polite">
        {activeBand ? (
          <span role="tooltip" className="truncate rounded-md bg-slate-950 px-2 py-1 text-[0.52rem] font-bold text-white shadow-sm">
            {activeBand.label} · {activeBand.count} {activeBand.count === 1 ? 'candidate' : 'candidates'} · {formatShare(activeBand.count, total)}
          </span>
        ) : (
          <span className="text-[0.52rem] font-bold text-slate-400">Hover or select a bar for details</span>
        )}
      </div>

      <div className="mt-1 grid min-h-0 flex-1 grid-cols-4 items-end gap-2" role="group" aria-label="Interactive candidate score distribution">
        {bands.map((band) => (
          <button
            key={band.key}
            type="button"
            onClick={() => onOpenDetail(band.key)}
            onMouseEnter={() => setHoveredBand(band.key)}
            onMouseLeave={() => setHoveredBand(null)}
            onFocus={() => setHoveredBand(band.key)}
            onBlur={() => setHoveredBand(null)}
            aria-haspopup="dialog"
            aria-label={`${band.label}: ${band.count} ${band.count === 1 ? 'candidate' : 'candidates'}, ${formatShare(band.count, total)}. Open details.`}
            className={`group flex h-full min-w-0 flex-col items-center justify-end rounded-lg px-1 transition-all hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${hoveredBand === band.key ? 'bg-slate-50' : ''}`}
          >
            <span className="mb-1 text-[10px] font-black text-slate-600">{band.count}</span>
            <div className="flex h-[38px] w-full max-w-[44px] items-end overflow-hidden rounded-t-lg bg-slate-100">
              <div
                className={`evaluation-chart-bar w-full rounded-t-lg transition-[filter,opacity] group-hover:brightness-95 group-focus-visible:brightness-95 ${band.fillClass}`}
                style={{ height: `${band.count === 0 ? 3 : Math.max(14, (band.count / maxCount) * 38)}px` }}
              />
            </div>
            <span className="mt-1 truncate text-[10px] font-black text-slate-400">{band.shortLabel}</span>
          </button>
        ))}
      </div>
    </article>
  );
};

const ChartDetailModal: React.FC<{
  selection: ChartSelection;
  evaluations: RecruiterEvaluationListItem[];
  onClose: () => void;
  onReview: (evaluation: RecruiterEvaluationListItem) => void;
  onShowDecisionFilter: (filter: DecisionFilter) => void;
  onSortByScore: () => void;
}> = ({ selection, evaluations, onClose, onReview, onShowDecisionFilter, onSortByScore }) => {
  const scoreBand = selection.kind === 'score'
    ? SCORE_BANDS.find((band) => band.key === selection.band) ?? null
    : null;
  const decisionMetaForSelection = selection.kind === 'decision'
    ? DECISION_CHART_META[selection.filter]
    : null;
  const matchingCandidates = evaluations.filter((evaluation) => {
    if (selection.kind === 'score') return scoreBand?.matches(evaluation.overall_score) ?? false;
    return selection.filter === 'all' || evaluation.recruiter_decision === selection.filter;
  });
  const candidates = [...matchingCandidates].sort((left, right) => right.overall_score - left.overall_score);
  const title = scoreBand ? `Score range ${scoreBand.label}` : decisionMetaForSelection?.label ?? 'Chart details';
  const description = scoreBand?.description ?? decisionMetaForSelection?.description ?? '';
  const accent = scoreBand?.tone ?? decisionMetaForSelection?.stroke ?? '#B9833F';
  const averageScore = candidates.length
    ? candidates.reduce((total, candidate) => total + candidate.overall_score, 0) / candidates.length
    : null;

  return (
    <CenteredDialog onClose={onClose} labelledBy="evaluation-chart-detail-title" className="max-w-3xl">
      <div className="h-1.5 shrink-0" style={{ backgroundColor: accent }} />
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            {selection.kind === 'score' ? <BarChart3 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-400">Chart details</p>
            <h2 id="evaluation-chart-detail-title" className="mt-0.5 font-display text-lg font-black tracking-[-0.02em] text-slate-950">
              {title}
            </h2>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          aria-label="Close chart details"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Candidates', value: String(candidates.length) },
            { label: 'Share', value: formatShare(candidates.length, evaluations.length) },
            { label: 'Average score', value: averageScore === null ? '—' : averageScore.toFixed(1) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-[#FCFAF6] px-3 py-2.5 text-center">
              <p className="font-display text-lg font-black text-slate-950">{stat.value}</p>
              <p className="mt-0.5 text-[0.52rem] font-black uppercase tracking-[0.08em] text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="text-xs font-black text-slate-900">Candidates in this segment</p>
            <p className="text-[10px] font-semibold text-slate-400">Highest score first</p>
          </div>
          {candidates.length > 0 ? (
            <ul className="space-y-2">
              {candidates.map((candidate) => (
                <li
                  key={candidate.candidate_assessment_id}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-brand-accent/50 hover:bg-brand-soft/25 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-[10px] font-black text-white ring-[3px] ${candidateAvatarTone(candidate.candidate_name)}`}>
                      {candidateInitials(candidate.candidate_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-950">{candidate.candidate_name}</p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{candidate.role_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <StatusPill {...decisionMeta(candidate.recruiter_decision)} />
                    <span className={`min-w-10 text-right font-display text-lg font-black ${scoreTextClass(candidate.overall_score)}`}>
                      {candidate.overall_score.toFixed(1)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReview(candidate)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-charcoal px-3 text-[10px] font-black text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                  >
                    <Eye className="h-3.5 w-3.5" /> Review
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center">
              <BarChart3 className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-2 text-xs font-black text-slate-700">No candidates in this segment</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">The range remains selectable as evaluation results change.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/90 px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-black text-slate-600 transition-colors hover:bg-slate-100"
        >
          Close
        </button>
        {selection.kind === 'decision' ? (
          <button
            type="button"
            onClick={() => onShowDecisionFilter(selection.filter)}
            className="rounded-lg bg-brand-charcoal px-3.5 py-2 text-[11px] font-black text-white transition-colors hover:bg-brand-hover"
          >
            Show on review board
          </button>
        ) : (
          <button
            type="button"
            onClick={onSortByScore}
            className="rounded-lg bg-brand-charcoal px-3.5 py-2 text-[11px] font-black text-white transition-colors hover:bg-brand-hover"
          >
            Sort board by score
          </button>
        )}
      </footer>
    </CenteredDialog>
  );
};

const CandidateReviewCard: React.FC<{
  evaluation: RecruiterEvaluationListItem;
  onReview: () => void;
  onDecision: (decision: 'APPROVED' | 'REJECTED') => void;
}> = ({ evaluation, onReview, onDecision }) => {
  const decision = {
    ...decisionMeta(evaluation.recruiter_decision),
    ...(evaluation.recruiter_decision === 'PENDING' ? { label: 'Needs review' } : {}),
  };
  const finalized = isDecisionFinalized(evaluation.recruiter_decision);

  return (
    <article className="evaluation-candidate-card group relative flex min-h-[188px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_12px_30px_-26px_rgba(36,33,29,0.55)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${evaluation.recruiter_decision === 'PENDING' ? 'bg-gradient-to-r from-brand-accent via-[#D7AA6A] to-brand-hover' : evaluation.recruiter_decision === 'APPROVED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <header className="flex min-w-0 items-center gap-3 pt-1">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-xs font-black text-white shadow-md ring-[3px] transition-transform duration-200 group-hover:-rotate-2 group-hover:scale-105 ${candidateAvatarTone(evaluation.candidate_name)}`}>
          {candidateInitials(evaluation.candidate_name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] font-black tracking-[-0.02em] text-slate-950 transition-colors group-hover:text-brand-hover">
            {evaluation.candidate_name}
          </h3>
          <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500">{evaluation.role_name}</p>
        </div>
        <StatusPill {...decision} />
      </header>

      <div className="mt-3 flex min-h-[68px] items-center justify-between gap-3 rounded-xl border border-default bg-gradient-to-br from-[#FCFAF6] to-brand-soft/55 px-3.5 py-2.5">
        <div>
          <p className="text-[0.56rem] font-black uppercase tracking-[0.12em] text-slate-400">Overall score</p>
          <div className="mt-1 flex items-end gap-1.5">
            <span className={`font-display text-[28px] font-black leading-none tracking-[-0.05em] ${scoreTextClass(evaluation.overall_score)}`}>
              {evaluation.overall_score.toFixed(1)}
            </span>
            <span className="pb-0.5 text-[10px] font-black text-slate-400">/ 10</span>
          </div>
        </div>
        {evaluation.validated_violation_count > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-black text-rose-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            {evaluation.validated_violation_count} integrity {evaluation.validated_violation_count === 1 ? 'alert' : 'alerts'}
          </span>
        )}
      </div>

      <footer className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5">
        <button
          type="button"
          onClick={onReview}
          className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-brand-charcoal px-3 text-[11px] font-black text-white shadow-sm shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
        >
          <Eye className="h-3.5 w-3.5" /> Review
        </button>
        <button
          type="button"
          onClick={() => onDecision('APPROVED')}
          disabled={finalized}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 text-[10px] font-black text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"
          title="Hire candidate"
          aria-label={`Hire ${evaluation.candidate_name}`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Hire
        </button>
        <button
          type="button"
          onClick={() => onDecision('REJECTED')}
          disabled={finalized}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-2.5 text-[10px] font-black text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35"
          title="Reject candidate"
          aria-label={`Reject ${evaluation.candidate_name}`}
        >
          <UserX className="h-3.5 w-3.5" />
          Reject
        </button>
      </footer>
    </article>
  );
};

/* ── Evaluation Summary Modal ─────────────────────────────────────────── */
const EvaluationSummaryModal: React.FC<{
  evaluation: RecruiterEvaluationListItem;
  onClose: () => void;
  onViewReport: () => void;
  onPrintReport: () => void;
  onDecision: (decision: 'APPROVED' | 'REJECTED') => void;
}> = ({ evaluation, onClose, onViewReport, onPrintReport, onDecision }) => {
  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const decision = decisionMeta(evaluation.recruiter_decision);
  const skills = orderedSkills(evaluation).slice(0, 4);
  const recommendationReasoning = cleanRecruiterNarrative(
    evaluation.recommendation_reasoning || evaluation.overall_summary,
  );
  const dimensions = [
    {
      label: 'Technical',
      score: evaluation.overall_technical_skill_score,
      icon: <BrainCircuit className="h-3.5 w-3.5" />,
      tone: 'bg-brand-charcoal text-white',
    },
    {
      label: 'Behaviour',
      score: evaluation.behavioural_cultural_score,
      icon: <Users className="h-3.5 w-3.5" />,
      tone: 'bg-brand-soft text-brand-hover',
    },
    {
      label: 'Communication',
      score: evaluation.communication_score,
      icon: <MessageSquareText className="h-3.5 w-3.5" />,
      tone: 'bg-[#E8D3B2] text-brand-hover',
    },
  ];

  return (
    <CenteredDialog
      onClose={onClose}
      labelledBy="evaluation-summary-title"
      className="max-w-6xl"
    >
      <div className="h-1.5 shrink-0 bg-gradient-to-r from-brand-charcoal via-brand-accent to-brand-hover" />

      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-accent to-brand-hover font-display text-sm font-black text-white shadow-lg shadow-black/15 ring-4 ring-brand-soft">
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
              {evaluation.role_name} · {evaluation.assessment_title}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close evaluation summary"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="grid content-start gap-3">
            <div className="rounded-2xl border border-default bg-gradient-to-br from-brand-soft/70 via-white to-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <ScoreRing score={evaluation.overall_score} size={112} />
                <div className="min-w-0 text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-hover">
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
            <div className="rounded-2xl border border-default bg-gradient-to-br from-brand-soft/80 via-white to-slate-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-charcoal text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-brand-charcoal">Recommendation reasoning</p>
                  <p className="mt-1.5 line-clamp-4 text-[11px] font-medium leading-5 text-secondary">
                    {recommendationReasoning}
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
                  <BrainCircuit className="h-4 w-4 text-brand-hover" />
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
            disabled={isDecisionFinalized(evaluation.recruiter_decision)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Hire
          </button>
          <button
            type="button"
            onClick={() => onDecision('REJECTED')}
            disabled={isDecisionFinalized(evaluation.recruiter_decision)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-black text-rose-700 transition-all hover:bg-rose-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <UserX className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onPrintReport();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-600 transition-all hover:border-brand-accent hover:bg-brand-soft hover:text-brand-hover active:scale-[0.98]"
            title="Print or save the complete evaluation report as PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            Print report
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onViewReport(); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-charcoal px-3.5 py-2 text-xs font-black text-white shadow-sm shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md active:translate-y-0 active:scale-[0.98]"
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
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-accent" />
          <p className="mt-3 text-xs font-bold text-slate-400">Loading candidate intelligence…</p>
        </div>
      </div>
    </div>
  </div>
);
