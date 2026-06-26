import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCandidateEvaluation, useUpdateCandidateDecision } from '../../../hooks/queries';
import { useToast } from '../../../hooks/useToast';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  ClipboardCheck,
  HeartHandshake,
  ListChecks,
  Loader2,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  EvaluationSectionSummary,
  EvaluationSkillBreakdown,
  HighlightAnswer,
  TranscriptEvidence,
  ViolationSummary,
} from '../../../types/candidate.types';

const recommendationLabel = (value: string) => value.replace(/_/g, ' ');

const displayLabel = (value: string | null | undefined) =>
  String(value || 'General').replace(/_/g, ' ');

const scoreValue = (score: number | null | undefined) =>
  typeof score === 'number' && Number.isFinite(score) ? score : null;

const scorePercent = (score: number | null | undefined, scale = 100) => {
  const value = scoreValue(score);
  return value === null ? null : Math.max(0, Math.min(100, (value / scale) * 100));
};

const scoreColor = (score: number | null | undefined) => {
  const value = scoreValue(score);
  if (value === null) return 'text-slate-400';
  if (value >= 80) return 'text-emerald-600';
  if (value >= 60) return 'text-cyan-700';
  if (value >= 40) return 'text-amber-600';
  return 'text-red-600';
};

const scoreBg = (score: number | null | undefined) => {
  const value = scoreValue(score) ?? 0;
  if (value >= 80) return 'bg-emerald-500';
  if (value >= 60) return 'bg-cyan-500';
  if (value >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

const recommendationStyle = (rec: string) => {
  switch (rec) {
    case 'STRONG_HIRE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'HIRE':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'CONSIDER':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700';
    case 'WEAK':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'NO_HIRE':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const decisionStyle = (decision: string) => {
  if (decision === 'APPROVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (decision === 'REJECTED') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
};

export const EvaluationReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { data: evaluation, isLoading, isError, refetch, isFetching } = useCandidateEvaluation(id || null);
  const decisionMutation = useUpdateCandidateDecision();

  const skillRows = useMemo(() => {
    if (!evaluation) return [];
    return Object.entries(evaluation.skill_scores ?? {})
      .map(([skill, data]) => ({
        skill,
        data,
        score: data.raw_score === null ? null : scorePercent(data.raw_score, 10),
      }))
      .sort((left, right) => (right.score ?? -1) - (left.score ?? -1));
  }, [evaluation]);

  const sectionRows = useMemo(() => {
    if (!evaluation) return [];
    return Object.entries(evaluation.section_summaries ?? {})
      .map(([section, data]) => ({
        section,
        data,
        score: data.avg_score === null ? null : scorePercent(data.avg_score, 10),
      }))
      .sort((left, right) => (right.score ?? -1) - (left.score ?? -1));
  }, [evaluation]);

  const updateDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!id) return;
    try {
      await decisionMutation.mutateAsync({ candidateId: id, decision });
      success('Decision Saved', `Candidate marked as ${decision.toLowerCase()} and notification queued.`);
      await refetch();
    } catch (err: unknown) {
      toastError('Decision Failed', err instanceof Error ? err.message : 'Failed to save decision.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm font-semibold text-slate-500">Loading report...</p>
      </div>
    );
  }

  if (isError || !evaluation) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center animate-fadeIn">
        <ShieldAlert className="mb-3 h-10 w-10 text-amber-500" />
        <p className="text-base font-black text-slate-900">Report is still being prepared</p>
        <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
          The report appears after the section and skill evaluations have been synthesized.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button onClick={() => navigate('/evaluations')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dimensions = [
    { title: 'Technical', icon: <BrainCircuit className="h-4 w-4" />, score: evaluation.technical_dimension_score, summary: evaluation.score_summary, evidence: evaluation.score_evidence },
    { title: 'Behavioural', icon: <Users className="h-4 w-4" />, score: evaluation.behavioural_score, summary: evaluation.behavioural_summary, evidence: evaluation.behavioural_evidence },
    { title: 'Culture Fit', icon: <HeartHandshake className="h-4 w-4" />, score: evaluation.cultural_fit_score, summary: evaluation.cultural_fit_summary, evidence: evaluation.cultural_fit_evidence },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden animate-fadeIn">
      <div className="ibot-command-panel mb-3 flex shrink-0 items-center justify-between px-4 py-3 animate-slideDown">
        <button onClick={() => navigate('/evaluations')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-emerald-600">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <span className="text-[10px] font-semibold text-slate-400">Generated {new Date(evaluation.generated_at).toLocaleString()}</span>
      </div>

      <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-4 pb-5">
          <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="ibot-panel p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-wide ${recommendationStyle(evaluation.hiring_recommendation)}`}>
                    {recommendationLabel(evaluation.hiring_recommendation)}
                  </span>
                  {evaluation.recruiter_decision && (
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-wide ${decisionStyle(evaluation.recruiter_decision)}`}>
                      {evaluation.recruiter_decision}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateDecision('APPROVED')} disabled={evaluation.recruiter_decision === 'APPROVED' || decisionMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Hire
                  </button>
                  <button onClick={() => updateDecision('REJECTED')} disabled={evaluation.recruiter_decision === 'REJECTED' || decisionMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-black text-red-600 shadow-sm hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-45">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
              <h1 className="text-2xl font-black text-slate-950">{evaluation.candidate_name || 'Candidate'} Evaluation Report</h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {evaluation.role_name || 'Role'} - {evaluation.assessment_title || 'Assessment'}
                {evaluation.candidate_email ? ` - ${evaluation.candidate_email}` : ''}
              </p>
              <p className="mt-3 max-w-4xl border-l-4 border-emerald-400 bg-emerald-50/[0.6] px-4 py-3 text-sm font-medium leading-relaxed text-slate-700">
                {evaluation.overall_narrative}
              </p>
              <p className="mt-3 text-xs font-medium leading-relaxed text-slate-600"><span className="font-black text-slate-800">Recommendation reasoning: </span>{evaluation.recommendation_reasoning}</p>
            </div>

            <section className="ibot-panel flex flex-col items-center justify-center p-5">
              <ScoreDial score={evaluation.overall_score} />
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overall Score</p>
              <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
                <MiniMetric label="Rank" value={evaluation.rank_in_assessment ? `#${evaluation.rank_in_assessment}` : 'N/A'} />
                <MiniMetric label="Percentile" value={evaluation.percentile_in_assessment !== null ? `${evaluation.percentile_in_assessment}%` : 'N/A'} />
              </div>
            </section>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            {dimensions.map((dimension) => <DimensionCard key={dimension.title} {...dimension} />)}
          </section>

          <section className="ibot-panel p-4">
            <SectionHeading icon={<BarChart3 className="h-4 w-4 text-cyan-600" />} title="Technical Skill Performance" subtitle="Each bar uses the detailed individual skill evaluation score." />
            <PerformanceGraph rows={skillRows.map(({ skill, score, data }) => ({ label: skill, score, detail: data.assessed === false ? 'Not directly assessed' : `${data.questions_asked ?? 0} answer${data.questions_asked === 1 ? '' : 's'}` }))} />
          </section>

          <section className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="space-y-3">
              <div className="ibot-panel p-4">
                <SectionHeading icon={<ClipboardCheck className="h-4 w-4 text-emerald-600" />} title="Skill Evidence Ledger" subtitle="Open a skill to review the score, coverage, supporting excerpts, and unresolved gaps." />
                <div className="space-y-3">
                  {skillRows.map(({ skill, data, score }, index) => <SkillBreakdown key={skill} skill={skill} data={data} score={score} open={index === 0} />)}
                  {skillRows.length === 0 && <EmptyState label="No technical skill scores were generated." />}
                </div>
              </div>

              <section className="grid gap-3 md:grid-cols-2">
                <SignalList title="Strengths" icon={<ThumbsUp className="h-4 w-4 text-emerald-500" />} items={evaluation.strengths} tone="emerald" />
                <SignalList title="Concerns" icon={<ThumbsDown className="h-4 w-4 text-amber-500" />} items={evaluation.concerns} tone="amber" />
              </section>
            </div>

            <div className="space-y-3">
              <section className="ibot-panel p-4">
                <SectionHeading icon={<ListChecks className="h-4 w-4 text-blue-600" />} title="Section Performance" subtitle="Section scores are reported on the same 0-100 scale for comparison." />
                <PerformanceGraph rows={sectionRows.map(({ section, score, data }) => ({ label: section, score, detail: data.questions_asked ? `${data.questions_asked} answer${data.questions_asked === 1 ? '' : 's'}` : 'No recorded answer' }))} compact />
              </section>

              <section className="ibot-panel p-4">
                <SectionHeading icon={<ListChecks className="h-4 w-4 text-blue-600" />} title="Section Evidence" subtitle="Coverage and evidence collected for every interview section." />
                <div className="space-y-3">
                  {sectionRows.map(({ section, data, score }, index) => <SectionEvidence key={section} section={section} data={data} score={score} open={index === 0} />)}
                  {sectionRows.length === 0 && <EmptyState label="No section summaries were generated." />}
                </div>
              </section>
            </div>
          </section>

          <section className="ibot-panel p-4">
            <SectionHeading icon={<BrainCircuit className="h-4 w-4 text-emerald-600" />} title="Dimension Evidence" subtitle="The final synthesis keeps technical, behavioural, and culture-fit evidence separate." />
            <div className="grid gap-3 xl:grid-cols-3">
              {dimensions.map((dimension) => <DimensionEvidence key={dimension.title} {...dimension} />)}
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <AnswerHighlight title="Best Answer" answer={evaluation.best_answer} tone="emerald" />
            <AnswerHighlight title="Weakest Answer" answer={evaluation.weakest_answer} tone="red" />
          </section>

          {evaluation.violation_summary && <Violations summary={evaluation.violation_summary} />}
        </div>
      </div>
    </div>
  );
};

const SectionHeading: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-black text-slate-900">{title}</h2>
    </div>
    <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500">{subtitle}</p>
  </div>
);

const ScoreDial: React.FC<{ score: number }> = ({ score }) => {
  const bounded = Math.min(100, Math.max(0, score));
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-label={`Overall score ${Math.round(bounded)} out of 100`} role="img">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(bounded / 100) * 251.2} 251.2`} className={scoreColor(bounded)} />
      </svg>
      <div className="absolute text-center">
        <p className={`text-4xl font-black ${scoreColor(bounded)}`}>{Math.round(bounded)}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">/ 100</p>
      </div>
    </div>
  );
};

const MiniMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border border-slate-100 bg-slate-50 p-2">
    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-black text-slate-900">{value}</p>
  </div>
);

const DimensionCard: React.FC<{ title: string; icon: React.ReactNode; score: number | null | undefined }> = ({ title, icon, score }) => {
  const value = scoreValue(score);
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center bg-slate-50 ring-1 ring-slate-100 ${scoreColor(value)}`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`mt-1 text-2xl font-black ${scoreColor(value)}`}>{value === null ? 'N/A' : Math.round(value)}{value !== null && <span className="text-xs font-bold text-slate-400">/100</span>}</p>
    </div>
  );
};

const PerformanceGraph: React.FC<{ rows: Array<{ label: string; score: number | null; detail: string }>; compact?: boolean }> = ({ rows, compact = false }) => (
  <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
    <div className="grid grid-cols-[minmax(88px,0.7fr)_minmax(0,1.3fr)_42px] gap-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
      <span>Area</span>
      <span className="flex justify-between"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></span>
      <span className="text-right">Score</span>
    </div>
    {rows.map((row) => {
      const width = row.score ?? 0;
      return (
        <div key={row.label} className="grid grid-cols-[minmax(88px,0.7fr)_minmax(0,1.3fr)_42px] items-center gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black text-slate-800" title={displayLabel(row.label)}>{displayLabel(row.label)}</p>
            {!compact && <p className="truncate text-[9px] font-medium text-slate-400" title={row.detail}>{row.detail}</p>}
          </div>
          <div className="relative h-3 overflow-hidden bg-slate-100" role="progressbar" aria-label={`${displayLabel(row.label)} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.score ?? undefined}>
            <div className="absolute inset-y-0 left-1/4 border-l border-white/70" />
            <div className="absolute inset-y-0 left-1/2 border-l border-white/70" />
            <div className="absolute inset-y-0 left-3/4 border-l border-white/70" />
            {row.score !== null && <div className={`relative h-full ${scoreBg(row.score)}`} style={{ width: `${width}%` }} />}
          </div>
          <p className={`text-right text-[11px] font-black ${scoreColor(row.score)}`}>{row.score === null ? 'N/A' : Math.round(row.score)}</p>
        </div>
      );
    })}
    {rows.length === 0 && <EmptyState label="No scored areas were available." />}
  </div>
);

const SkillBreakdown: React.FC<{ skill: string; data: EvaluationSkillBreakdown; score: number | null; open: boolean }> = ({ skill, data, score, open }) => (
  <details className="group border border-slate-200 bg-white" open={open}>
    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-3 marker:content-none">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
          <p className="truncate text-sm font-black text-slate-900">{displayLabel(skill)}</p>
        </div>
        <p className="mt-1 pl-6 text-[9px] font-black uppercase tracking-wider text-slate-400">
          Priority {data.priority_score ?? 'N/A'}
          {data.depth_required ? ` - ${data.depth_required}` : ''}
          {typeof data.weight_share === 'number' ? ` - Weight ${data.weight_share.toFixed(1)}%` : ''}
          {data.assessed === false ? ' - Not directly assessed' : ` - ${data.questions_asked ?? 0} answer${data.questions_asked === 1 ? '' : 's'}`}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-black ${scoreColor(score)}`}>{data.raw_score === null ? 'N/A' : `${data.raw_score.toFixed(1)}/10`}</span>
    </summary>
    <div className="border-t border-slate-100 p-3">
      <div className="mb-3 h-2 overflow-hidden bg-slate-100"><div className={`h-full ${scoreBg(score)}`} style={{ width: `${score ?? 0}%` }} /></div>
      <p className="text-xs font-medium leading-relaxed text-slate-600">{data.summary}</p>
      {data.similar_skill_credit && <p className="mt-3 border-l-2 border-cyan-400 bg-cyan-50 px-3 py-2 text-[10px] font-semibold leading-relaxed text-cyan-900">Similar-skill credit: {(data.similar_skills_considered ?? []).join(', ') || 'Transferable adjacent experience was considered.'}</p>}
      <EvidenceList title="Evidence" evidence={data.transcript_evidence ?? []} emptyLabel="No direct transcript evidence was recorded for this skill." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SignalChips title="Demonstrated" items={data.signals_demonstrated ?? []} tone="emerald" />
        <SignalChips title="Missing or unclear" items={data.signals_missing ?? []} tone="amber" />
      </div>
    </div>
  </details>
);

const SectionEvidence: React.FC<{ section: string; data: EvaluationSectionSummary; score: number | null; open: boolean }> = ({ section, data, score, open }) => (
  <details className="group border border-slate-200 bg-white" open={open}>
    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-3 marker:content-none">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
          <p className="truncate text-xs font-black text-slate-900">{displayLabel(section)}</p>
        </div>
        <p className="mt-1 pl-6 text-[9px] font-black uppercase tracking-wider text-slate-400">{data.questions_asked ?? 0} answer{data.questions_asked === 1 ? '' : 's'}{data.difficulty_reached ? ` - ${data.difficulty_reached}` : ''}</p>
      </div>
      <span className={`shrink-0 text-xs font-black ${scoreColor(score)}`}>{score === null ? 'N/A' : `${Math.round(score)}%`}</span>
    </summary>
    <div className="border-t border-slate-100 p-3">
      <p className="text-[11px] font-medium leading-relaxed text-slate-600">{data.summary}</p>
      {data.score_basis && <p className="mt-2 border-l-2 border-slate-300 bg-slate-50 px-3 py-2 text-[10px] font-medium leading-relaxed text-slate-500">{data.score_basis}</p>}
      <EvidenceList title="Section evidence" evidence={data.evidence ?? []} emptyLabel="No direct transcript evidence was recorded for this section." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SignalChips title="Observed" items={data.signals_demonstrated ?? []} tone="emerald" />
        <SignalChips title="Missing" items={data.signals_missing ?? []} tone="amber" />
      </div>
    </div>
  </details>
);

const DimensionEvidence: React.FC<{ title: string; score: number | null | undefined; summary: string; evidence: string[] }> = ({ title, score, summary, evidence }) => (
  <div className="border border-slate-200 bg-white p-3">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-xs font-black text-slate-900">{title}</h3>
      <span className={`text-xs font-black ${scoreColor(score)}`}>{scoreValue(score) === null ? 'N/A' : `${Math.round(scoreValue(score)!)}%`}</span>
    </div>
    <p className="text-[11px] font-medium leading-relaxed text-slate-600">{summary}</p>
    <ul className="mt-3 space-y-1.5">
      {(evidence ?? []).map((item, index) => <li key={`${title}-${index}`} className="border-l-2 border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-medium leading-relaxed text-slate-600">{item}</li>)}
      {(!evidence || evidence.length === 0) && <li className="text-[10px] font-medium text-slate-400">No evidence recorded.</li>}
    </ul>
  </div>
);

const EvidenceList: React.FC<{ title: string; evidence: TranscriptEvidence[]; emptyLabel: string }> = ({ title, evidence, emptyLabel }) => (
  <div className="mt-4">
    <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-slate-400">{title}</p>
    <div className="space-y-2">
      {evidence.map((item, index) => <EvidenceQuote key={`${item.turn_number ?? 'na'}-${index}`} item={item} />)}
      {evidence.length === 0 && <EmptyState label={emptyLabel} />}
    </div>
  </div>
);

const EvidenceQuote: React.FC<{ item: TranscriptEvidence }> = ({ item }) => (
  <div className="border border-slate-200 bg-slate-50/[0.45] px-3 py-2.5">
    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Turn {item.turn_number ?? 'N/A'}{item.section ? ` - ${displayLabel(item.section)}` : ''}{item.skill ? ` - ${item.skill}` : ''}</p>
    {item.question && <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-600"><span className="font-black text-slate-700">Question: </span>{item.question}</p>}
    <p className="mt-2 text-[11px] font-semibold leading-relaxed text-slate-800">"{item.quote}"</p>
    <p className="mt-2 text-[10px] font-medium leading-relaxed text-slate-600">{item.interpretation}</p>
  </div>
);

const SignalChips: React.FC<{ title: string; items: string[]; tone: 'emerald' | 'amber' }> = ({ title, items, tone }) => {
  const itemClass = tone === 'emerald' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-amber-100 bg-amber-50 text-amber-800';
  return (
    <div>
      <p className="mb-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, index) => <span key={`${title}-${index}`} className={`border px-2 py-1 text-[9px] font-bold ${itemClass}`}>{item}</span>)}
        {items.length === 0 && <span className="text-[10px] font-medium text-slate-400">None recorded</span>}
      </div>
    </div>
  );
};

const SignalList: React.FC<{ title: string; icon: React.ReactNode; items: string[]; tone: 'emerald' | 'amber' }> = ({ title, icon, items, tone }) => {
  const classes = tone === 'emerald' ? 'border-emerald-100 bg-emerald-50/[0.55] text-emerald-800' : 'border-amber-100 bg-amber-50/[0.6] text-amber-800';
  return (
    <section className="ibot-panel p-4">
      <div className="mb-3 flex items-center gap-2">{icon}<h2 className="text-sm font-black text-slate-900">{title}</h2></div>
      <ul className="space-y-2">
        {items.map((item, index) => <li key={`${title}-${index}`} className={`border-l-2 p-2.5 text-xs font-medium leading-relaxed ${classes}`}>{item}</li>)}
        {items.length === 0 && <li className="text-xs font-medium text-slate-400">None recorded.</li>}
      </ul>
    </section>
  );
};

const AnswerHighlight: React.FC<{ title: string; answer: HighlightAnswer | null; tone: 'emerald' | 'red' }> = ({ title, answer, tone }) => {
  const box = tone === 'emerald' ? 'border-emerald-100 bg-emerald-50/[0.55] text-emerald-800' : 'border-red-100 bg-red-50/[0.55] text-red-800';
  return (
    <section className="ibot-panel p-4">
      <div className="mb-3 flex items-center gap-2">{tone === 'emerald' ? <Award className="h-4 w-4 text-emerald-500" /> : <TrendingUp className="h-4 w-4 text-red-500" />}<h2 className="text-sm font-black text-slate-900">{title}</h2></div>
      {answer ? <div><div className={`mb-3 border-l-2 p-3 ${box}`}><p className="mb-1 text-[10px] font-black uppercase tracking-wider">Turn {answer.turn_number} - {displayLabel(answer.section)}</p><p className="text-xs font-medium leading-relaxed">{answer.question}</p></div><p className="text-xs font-medium leading-relaxed text-slate-600"><span className="font-black text-slate-800">Why: </span>{answer.reason}</p></div> : <p className="text-xs font-medium text-slate-400">No answer highlight recorded.</p>}
    </section>
  );
};

const Violations: React.FC<{ summary: ViolationSummary }> = ({ summary }) => (
  <section className="border border-amber-200 bg-amber-50/[0.45] p-4">
    <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><h2 className="text-sm font-black text-slate-900">Violation Summary</h2></div>
    <div className="grid grid-cols-3 gap-2 text-center"><MiniMetric label="Irrelevant" value={String(summary.total_irrelevant)} /><MiniMetric label="Silences" value={String(summary.total_silences)} /><MiniMetric label="Early End" value={summary.terminated_early ? 'Yes' : 'No'} /></div>
    {summary.entries.length > 0 && <ul className="mt-3 space-y-2">{summary.entries.map((entry, index) => <li key={index} className="border-l-2 border-amber-300 bg-white/[0.75] p-2.5 text-[10px] font-medium leading-relaxed text-slate-600">{entry.violation_type ?? 'Violation'} on turn {entry.turn_number ?? 'N/A'}</li>)}</ul>}
  </section>
);

const EmptyState: React.FC<{ label: string }> = ({ label }) => <p className="border border-dashed border-slate-200 px-3 py-2 text-[10px] font-medium text-slate-400">{label}</p>;
