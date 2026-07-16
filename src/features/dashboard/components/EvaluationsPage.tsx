import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
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
  formatDateTime,
  isDecisionFinalized,
  recommendationMeta,
  scoreLabel,
  scoreTextClass,
  useEvaluationDecision,
} from './evaluationUiUtils';

type DecisionFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
type SortOption = 'score' | 'recent' | 'rank';

const PAGE_SIZE = 4;
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
      <div className="ibot-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-y-auto overflow-x-hidden animate-fadeIn print:hidden lg:overflow-hidden">
        {/* Compact command strip */}
        <section className="ibot-section-toolbar relative z-20 flex shrink-0 flex-col gap-4 overflow-visible px-4 py-3 transition-shadow hover:shadow-[0_12px_30px_rgba(185,131,63,0.12)] xl:flex-row xl:items-center xl:justify-between xl:gap-5">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-charcoal text-white shadow-lg shadow-black/15 transition-transform duration-200 hover:rotate-3 hover:scale-105">
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
          <div className="grid w-full shrink-0 grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 sm:grid-cols-4 sm:divide-x sm:divide-slate-200 xl:w-auto">
            {[
              { label: 'Reports', value: String(stats.total), tone: 'text-slate-900' },
              { label: 'Average', value: stats.average.toFixed(1), tone: 'text-brand-hover' },
              { label: 'Hired', value: String(stats.approved), tone: 'text-emerald-700' },
              { label: 'Rejected', value: String(stats.rejected), tone: 'text-rose-700' },
            ].map((item) => (
              <div key={item.label} className="min-w-0 border-b border-slate-200 px-3.5 py-2 text-center odd:border-r sm:border-b-0 sm:odd:border-r-0">
                <p className={`font-display text-[16px] font-black ${item.tone}`}>{item.value}</p>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Candidate Grid */}
        <section className="ibot-section-surface flex min-h-0 shrink-0 flex-col overflow-hidden lg:flex-1">
          <header className="shrink-0 border-b border-slate-200 bg-[#FCFAF6]/70 px-3 py-3 sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-hover ring-1 ring-default transition-transform duration-200 hover:rotate-3 hover:scale-105">
                  <UserRoundSearch className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">Candidate reports</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {sortedEvaluations.length} matching · {PAGE_SIZE} reports per page
                  </p>
                </div>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:items-center">
                <label className="relative block w-full sm:col-span-2 xl:w-60">
                  <span className="sr-only">Search candidate reports</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPage(0);
                    }}
                    placeholder="Search candidate, role, or assessment"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-brand-accent hover:shadow-sm focus:border-brand-accent focus:ring-4 focus:ring-brand-soft"
                  />
                </label>
                <CustomSelect
                  value={assessmentFilter}
                  onChange={handleAssessmentChange}
                  options={[
                    { value: 'all', label: 'All assessments' },
                    ...assessmentOptions,
                  ]}
                  buttonClassName="h-10 w-full xl:w-52"
                  className="w-full xl:w-auto"
                />
                <CustomSelect
                  value={sort}
                  onChange={(val) => handleSortChange(val as SortOption)}
                  options={[
                    { value: 'score', label: 'Highest score' },
                    { value: 'rank', label: 'Best rank' },
                    { value: 'recent', label: 'Most recent' },
                  ]}
                  buttonClassName="h-10 w-full xl:w-40"
                  className="w-full xl:w-auto"
                />
              </div>
            </div>
            <div className="ibot-scrollbar mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
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
                        ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-sm shadow-black/15'
                        : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-soft hover:text-brand-hover hover:shadow-sm'
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
                  className="mt-2 text-[11px] font-black text-brand-hover hover:text-brand-charcoal"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ibot-scrollbar grid gap-3 overflow-y-auto p-3 lg:hidden">
                {visibleEvaluations.map((evaluation) => {
                  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
                  const decision = decisionMeta(evaluation.recruiter_decision);
                  return (
                    <article
                      key={evaluation.candidate_assessment_id}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-accent hover:bg-brand-soft/30"
                      onClick={() => setSelectedEvaluation(evaluation)}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-xs font-black text-white shadow-md ring-4 ${candidateAvatarTone(evaluation.candidate_name)}`}>
                          {candidateInitials(evaluation.candidate_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-slate-900">{evaluation.candidate_name}</p>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{evaluation.candidate_email}</p>
                          <p className="mt-2 truncate text-xs font-bold text-slate-800">{evaluation.assessment_title}</p>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{evaluation.role_name}</p>
                        </div>
                        <span className={`font-display text-xl font-black ${scoreTextClass(evaluation.overall_score)}`}>
                          {evaluation.overall_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusPill {...recommendation} />
                        <StatusPill {...decision} />
                        <span className="text-[10px] font-semibold text-slate-400">{formatDateTime(evaluation.generated_at)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3" onClick={(event) => event.stopPropagation()}>
                        <button type="button" onClick={() => setSelectedEvaluation(evaluation)} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-charcoal px-3 text-[11px] font-black text-white">
                          <Eye className="h-3.5 w-3.5" /> Review
                        </button>
                        <button type="button" onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'APPROVED')} disabled={isDecisionFinalized(evaluation.recruiter_decision)} className="flex h-9 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 disabled:opacity-30" aria-label={`Hire ${evaluation.candidate_name}`}>
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'REJECTED')} disabled={isDecisionFinalized(evaluation.recruiter_decision)} className="flex h-9 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 disabled:opacity-30" aria-label={`Reject ${evaluation.candidate_name}`}>
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleViewFullReport(evaluation.candidate_assessment_id)} className="flex h-9 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500" aria-label={`Open ${evaluation.candidate_name}'s full report`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="ibot-scrollbar hidden min-h-0 flex-1 overflow-auto lg:block">
              <table className="min-w-[980px] w-full table-fixed border-collapse text-left">
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
                        className="group h-[64px] cursor-pointer transition-all hover:bg-brand-soft/60 focus-visible:bg-brand-soft focus-visible:outline-none"
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
                              <p className="truncate text-sm font-extrabold text-slate-900 transition-colors group-hover:text-brand-hover">{evaluation.candidate_name}</p>
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
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-charcoal px-3 text-[11px] font-black text-white shadow-sm shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md"
                              aria-label={`Review ${evaluation.candidate_name}'s evaluation summary`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Review
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'APPROVED')}
                              disabled={isDecisionFinalized(evaluation.recruiter_decision)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Hire"
                              aria-label={`Hire ${evaluation.candidate_name}`}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDecision(evaluation.candidate_assessment_id, evaluation.candidate_name, evaluation.recruiter_decision, 'REJECTED')}
                              disabled={isDecisionFinalized(evaluation.recruiter_decision)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Reject"
                              aria-label={`Reject ${evaluation.candidate_name}`}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewFullReport(evaluation.candidate_assessment_id)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-soft hover:text-brand-hover hover:shadow-sm"
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
              <div className="mt-auto flex flex-col gap-2 border-t border-slate-200 bg-slate-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-[11px] font-semibold text-slate-500">
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedEvaluations.length)} of {sortedEvaluations.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:text-brand-hover hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:text-brand-hover hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
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
