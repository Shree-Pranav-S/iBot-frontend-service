import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidateEvaluation } from '../../../hooks/queries';
import {
  Loader2,
  ArrowLeft,
  ShieldAlert,
  TrendingUp,
  BrainCircuit,
  Users,
  Award,
  AlertTriangle,
  ThumbsDown,
  ThumbsUp,
  HeartHandshake,
  ListChecks,
} from 'lucide-react';
import type { HighlightAnswer, ViolationSummary } from '../../../types/candidate.types';

const recommendationLabel = (value: string) => value.replace(/_/g, ' ');

const scoreValue = (score: number | null | undefined) => (typeof score === 'number' && Number.isFinite(score) ? score : null);

const scoreColor = (score: number | null | undefined) => {
  const value = scoreValue(score);
  if (value === null) return 'text-slate-400';
  if (value >= 80) return 'text-emerald-600';
  if (value >= 60) return 'text-blue-600';
  if (value >= 40) return 'text-amber-600';
  return 'text-red-600';
};

const scoreBg = (score: number | null | undefined) => {
  const value = scoreValue(score) ?? 0;
  if (value >= 80) return 'bg-emerald-500';
  if (value >= 60) return 'bg-blue-500';
  if (value >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

const recommendationStyle = (rec: string) => {
  switch (rec) {
    case 'STRONG_HIRE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'HIRE':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'CONSIDER':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'WEAK':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'NO_HIRE':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const EvaluationReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading, isError, refetch, isFetching } = useCandidateEvaluation(id || null);

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
          The interview has to finish and the holistic evaluation must be saved before the full report appears.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/candidates')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dimensionRows = [
    {
      title: 'Technical',
      icon: <BrainCircuit className="h-4 w-4" />,
      score: evaluation.technical_dimension_score,
      summary: evaluation.score_summary,
      evidence: evaluation.score_evidence,
    },
    {
      title: 'Behavioural',
      icon: <Users className="h-4 w-4" />,
      score: evaluation.behavioural_score,
      summary: evaluation.behavioural_summary,
      evidence: evaluation.behavioural_evidence,
    },
    {
      title: 'Culture Fit',
      icon: <HeartHandshake className="h-4 w-4" />,
      score: evaluation.cultural_fit_score,
      summary: evaluation.cultural_fit_summary,
      evidence: evaluation.cultural_fit_evidence,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden animate-fadeIn">
      <div className="mb-3 flex shrink-0 items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm animate-slideDown">
        <button
          onClick={() => navigate('/dashboard/candidates')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-emerald-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <span className="text-[10px] font-semibold text-slate-400">
          Generated {new Date(evaluation.generated_at).toLocaleString()}
        </span>
      </div>

      <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
          <section className="ibot-card overflow-hidden p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-wide ${recommendationStyle(evaluation.hiring_recommendation)}`}>
                {recommendationLabel(evaluation.hiring_recommendation)}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-950">Holistic Evaluation Report</h1>
            <p className="mt-3 max-w-4xl rounded-lg border border-emerald-100 bg-emerald-50/45 p-3 text-sm font-medium leading-relaxed text-slate-700">
              {evaluation.overall_narrative}
            </p>
            <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500">
              <span className="font-black text-slate-700">Recommendation reasoning: </span>
              {evaluation.recommendation_reasoning}
            </p>
          </section>

          <section className="ibot-card flex flex-col items-center justify-center p-5">
            <ScoreDial score={evaluation.overall_score} />
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overall Score</p>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
              <MiniMetric label="Rank" value={evaluation.rank_in_assessment ? `#${evaluation.rank_in_assessment}` : 'N/A'} />
              <MiniMetric label="Percentile" value={evaluation.percentile_in_assessment !== null ? `${evaluation.percentile_in_assessment}%` : 'N/A'} />
            </div>
          </section>
        </div>

        <div className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {dimensionRows.map((item) => (
            <DimensionCard key={item.title} title={item.title} icon={item.icon} score={item.score} />
          ))}
        </div>

        <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-3">
            <section className="ibot-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-black text-slate-900">Dimension Evidence</h2>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {dimensionRows.map((item) => (
                  <EvidencePanel
                    key={item.title}
                    title={item.title}
                    score={item.score}
                    summary={item.summary}
                    evidence={item.evidence}
                  />
                ))}
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <SignalList title="Strengths" icon={<ThumbsUp className="h-4 w-4 text-emerald-500" />} items={evaluation.strengths} tone="emerald" />
              <SignalList title="Concerns" icon={<ThumbsDown className="h-4 w-4 text-amber-500" />} items={evaluation.concerns} tone="amber" />
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <AnswerHighlight title="Best Answer" answer={evaluation.best_answer} tone="emerald" />
              <AnswerHighlight title="Weakest Answer" answer={evaluation.weakest_answer} tone="red" />
            </section>
          </div>

          <div className="space-y-3">
            <section className="ibot-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-black text-slate-900">Skill Breakdown</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(evaluation.skill_scores ?? {}).map(([skill, data]) => {
                  const raw = scoreValue(data.raw_score) ?? 0;
                  const weighted = scoreValue(data.weighted_score) ?? 0;
                  return (
                    <div key={skill}>
                      <div className="mb-1 flex items-end justify-between gap-3">
                        <span className="truncate text-xs font-black capitalize text-slate-800">{skill.replace(/_/g, ' ')}</span>
                        <span className={`text-xs font-black ${scoreColor(raw * 10)}`}>{raw.toFixed(1)}/10</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${scoreBg(raw * 10)}`} style={{ width: `${Math.min(100, Math.max(0, raw * 10))}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500">
                        Weighted {weighted.toFixed(1)} | Priority {data.priority_score ?? 'N/A'}
                      </p>
                      <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500">{data.summary}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="ibot-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-black text-slate-900">Section Summaries</h2>
              </div>
              <div className="space-y-3">
                {Object.entries(evaluation.section_summaries ?? {}).map(([section, summary]) => (
                  <div key={section} className="rounded-lg border border-slate-200 bg-slate-50/55 p-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-xs font-black capitalize text-slate-800">{section.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] font-black text-slate-500">{summary.avg_score.toFixed(1)}/10</p>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed text-slate-500">{summary.summary}</p>
                  </div>
                ))}
              </div>
            </section>
            {evaluation.violation_summary && <Violations summary={evaluation.violation_summary} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreDial: React.FC<{ score: number }> = ({ score }) => (
  <div className="relative flex h-32 w-32 items-center justify-center">
    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(Math.min(100, Math.max(0, score)) / 100) * 251.2} 251.2`}
        className={scoreColor(score)}
      />
    </svg>
    <div className="absolute text-center">
      <p className={`text-4xl font-black tracking-tight ${scoreColor(score)}`}>{Math.round(score)}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">/ 100</p>
    </div>
  </div>
);

const MiniMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-black text-slate-900">{value}</p>
  </div>
);

const DimensionCard: React.FC<{ title: string; icon: React.ReactNode; score: number | null | undefined }> = ({ title, icon, score }) => {
  const value = scoreValue(score);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100 ${scoreColor(value)}`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`mt-1 text-2xl font-black ${scoreColor(value)}`}>
        {value === null ? 'N/A' : Math.round(value)}
        {value !== null && <span className="text-xs font-bold text-slate-400">/100</span>}
      </p>
    </div>
  );
};

const EvidencePanel: React.FC<{
  title: string;
  score: number | null | undefined;
  summary?: string | null;
  evidence: string[];
}> = ({ title, score, summary, evidence }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-xs font-black text-slate-900">{title}</h3>
      <span className={`text-xs font-black ${scoreColor(score)}`}>{scoreValue(score) === null ? 'N/A' : `${Math.round(scoreValue(score)!)}%`}</span>
    </div>
    {summary && <p className="mb-2 text-[11px] font-medium leading-relaxed text-slate-600">{summary}</p>}
    <ul className="space-y-1.5">
      {(evidence ?? []).slice(0, 4).map((item, index) => (
        <li key={`${title}-${index}`} className="rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] font-medium leading-relaxed text-slate-500">
          {item}
        </li>
      ))}
      {(!evidence || evidence.length === 0) && <li className="text-[10px] font-medium text-slate-400">No evidence recorded.</li>}
    </ul>
  </div>
);

const SignalList: React.FC<{ title: string; icon: React.ReactNode; items: string[]; tone: 'emerald' | 'amber' }> = ({ title, icon, items, tone }) => {
  const classes = tone === 'emerald' ? 'border-emerald-100 bg-emerald-50/45 text-emerald-800' : 'border-amber-100 bg-amber-50/55 text-amber-800';
  return (
    <div className="ibot-card p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-black text-slate-900">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className={`rounded-lg border p-2.5 text-xs font-medium leading-relaxed ${classes}`}>{item}</li>
        ))}
        {items.length === 0 && <li className="text-xs font-medium text-slate-400">None recorded.</li>}
      </ul>
    </div>
  );
};

const AnswerHighlight: React.FC<{ title: string; answer: HighlightAnswer | null; tone: 'emerald' | 'red' }> = ({ title, answer, tone }) => {
  const box = tone === 'emerald' ? 'border-emerald-100 bg-emerald-50/45 text-emerald-800' : 'border-red-100 bg-red-50/45 text-red-800';
  return (
    <div className="ibot-card p-4">
      <div className="mb-3 flex items-center gap-2">
        {tone === 'emerald' ? <Award className="h-4 w-4 text-emerald-500" /> : <TrendingUp className="h-4 w-4 text-red-500" />}
        <h2 className="text-sm font-black text-slate-900">{title}</h2>
      </div>
      {answer ? (
        <div>
          <div className={`mb-3 rounded-lg border p-3 ${box}`}>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider">Turn {answer.turn_number} | {answer.section}</p>
            <p className="text-xs font-medium leading-relaxed">{answer.question}</p>
          </div>
          <p className="text-xs font-medium leading-relaxed text-slate-600"><span className="font-black text-slate-800">Why: </span>{answer.reason}</p>
        </div>
      ) : (
        <p className="text-xs font-medium text-slate-400">No answer highlight recorded.</p>
      )}
    </div>
  );
};

const Violations: React.FC<{ summary: ViolationSummary }> = ({ summary }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <h2 className="text-sm font-black text-slate-900">Violation Summary</h2>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <MiniMetric label="Irrelevant" value={String(summary.total_irrelevant)} />
      <MiniMetric label="Silences" value={String(summary.total_silences)} />
      <MiniMetric label="Early End" value={summary.terminated_early ? 'Yes' : 'No'} />
    </div>
    {summary.entries.length > 0 && (
      <ul className="mt-3 space-y-2">
        {summary.entries.slice(0, 5).map((entry, index) => (
          <li key={index} className="rounded-lg bg-slate-50 p-2.5 text-[10px] font-medium leading-relaxed text-slate-500">
            {entry.violation_type ?? 'violation'} on turn {entry.turn_number ?? 'N/A'}
          </li>
        ))}
      </ul>
    )}
  </section>
);