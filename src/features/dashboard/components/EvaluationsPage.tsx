import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquare,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useRecruiterEvaluations, useUpdateCandidateDecision } from '../../../hooks/queries';
import { useToast } from '../../../hooks/useToast';
import type { RecruiterEvaluationListItem } from '../../../types/candidate.types';

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-indigo-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
};

const scoreBg = (score: number) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-indigo-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

const recommendationClass = (recommendation: string) => {
  switch (recommendation) {
    case 'STRONG_HIRE':
    case 'HIRE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'CONSIDER':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'WEAK':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'NO_HIRE':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const decisionClass = (decision: string) => {
  if (decision === 'APPROVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (decision === 'REJECTED') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
};

const formatRecommendation = (recommendation: string) => recommendation.replace(/_/g, ' ');

const topSkills = (evaluation: RecruiterEvaluationListItem) =>
  Object.entries(evaluation.skill_scores ?? {})
    .sort(([, a], [, b]) => {
      const priorityDelta = (b.priority_score ?? 0) - (a.priority_score ?? 0);
      if (priorityDelta !== 0) return priorityDelta;
      return (b.weighted_score ?? 0) - (a.weighted_score ?? 0);
    })
    .slice(0, 4);

export const EvaluationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { data: evaluations = [], isLoading, isError } = useRecruiterEvaluations();
  const decisionMutation = useUpdateCandidateDecision();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (evaluations.length === 0) return null;
    return evaluations.find((item) => item.candidate_assessment_id === selectedId) ?? evaluations[0];
  }, [evaluations, selectedId]);

  const stats = useMemo(() => {
    const total = evaluations.length;
    const approved = evaluations.filter((item) => item.recruiter_decision === 'APPROVED').length;
    const rejected = evaluations.filter((item) => item.recruiter_decision === 'REJECTED').length;
    const pending = evaluations.filter((item) => item.recruiter_decision === 'PENDING').length;
    const avgScore = total
      ? Math.round(evaluations.reduce((sum, item) => sum + item.overall_score, 0) / total)
      : 0;
    return { total, approved, rejected, pending, avgScore };
  }, [evaluations]);

  const updateDecision = async (evaluation: RecruiterEvaluationListItem, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await decisionMutation.mutateAsync({
        candidateId: evaluation.candidate_assessment_id,
        decision,
      });
      success('Decision Saved', `${evaluation.candidate_name} marked as ${decision.toLowerCase()} and notification queued.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save decision.';
      toastError('Decision Failed', message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm font-semibold text-slate-500">Loading evaluations...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-3 h-9 w-9 text-red-500" />
        <p className="text-base font-bold text-slate-900">Unable to load evaluations</p>
        <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
          Please try again after confirming the API service is running.
        </p>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
        <Award className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-base font-bold text-slate-900">No evaluated interviews yet</p>
        <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
          Completed interviews will appear here once the evaluation is generated.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden animate-fadeIn select-none">
      <div className="flex flex-col gap-3 animate-slideDown md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950">Evaluations</h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            Review completed interviews and make hiring decisions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MetricCard label="Evaluated" value={stats.total} icon={<Award className="h-4 w-4" />} />
        <MetricCard label="Avg Score" value={stats.avgScore} suffix="/100" icon={<BarChart3 className="h-4 w-4" />} />
        <MetricCard label="Pending" value={stats.pending} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Approved" value={stats.approved} icon={<UserCheck className="h-4 w-4" />} />
        <MetricCard label="Rejected" value={stats.rejected} icon={<UserX className="h-4 w-4" />} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[390px_minmax(0,1fr)]">
        <div className="ibot-card flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Completed Interviews</p>
          </div>
          <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
            {evaluations.map((evaluation) => {
              const active = evaluation.candidate_assessment_id === selected.candidate_assessment_id;
              return (
                <button
                  key={evaluation.candidate_assessment_id}
                  onClick={() => setSelectedId(evaluation.candidate_assessment_id)}
                  className={`mb-2 w-full rounded-xl border p-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/35 ${
                    active ? 'border-emerald-300 bg-emerald-50/70 shadow-sm' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{evaluation.candidate_name}</p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">{evaluation.candidate_email}</p>
                    </div>
                    <span className={`shrink-0 text-lg font-black ${scoreColor(evaluation.overall_score)}`}>
                      {Math.round(evaluation.overall_score)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${recommendationClass(evaluation.hiring_recommendation)}`}>
                      {formatRecommendation(evaluation.hiring_recommendation)}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${decisionClass(evaluation.recruiter_decision)}`}>
                      {evaluation.recruiter_decision}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${scoreBg(evaluation.overall_score)}`}
                      style={{ width: `${Math.min(100, Math.max(0, evaluation.overall_score))}%` }}
                    />
                  </div>
                  <p className="mt-2 truncate text-[10px] font-semibold text-slate-500">
                    {evaluation.role_name} - {evaluation.assessment_title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="ibot-scrollbar min-h-0 overflow-y-auto pr-1">
          <div className="ibot-card overflow-hidden">
            <div className="border-b border-slate-100 bg-white p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${recommendationClass(selected.hiring_recommendation)}`}>
                      {formatRecommendation(selected.hiring_recommendation)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${decisionClass(selected.recruiter_decision)}`}>
                      {selected.recruiter_decision}
                    </span>
                    {selected.red_flags_count > 0 && (
                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black text-red-700">
                        {selected.red_flags_count} red flag{selected.red_flags_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-950">{selected.candidate_name}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selected.role_name} - {selected.assessment_title}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-600">
                    {selected.overall_narrative}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => updateDecision(selected, 'APPROVED')}
                    disabled={selected.recruiter_decision === 'APPROVED' || decisionMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[11px] font-black text-white shadow-sm transition-all hover:bg-emerald-700 hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => updateDecision(selected, 'REJECTED')}
                    disabled={selected.recruiter_decision === 'REJECTED' || decisionMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-[11px] font-black text-red-600 shadow-sm transition-all hover:bg-red-500 hover:text-white hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => navigate(`/candidates/${selected.candidate_assessment_id}/report`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-black text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-emerald-700 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Full Report
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50/40 p-5">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                <ScoreCard label="Overall" score={selected.overall_score} icon={<Award className="h-4 w-4" />} />
                <ScoreCard label="Technical" score={selected.technical_dimension_score} icon={<BrainCircuit className="h-4 w-4" />} />
                <ScoreCard label="Behavioural" score={selected.behavioural_score} icon={<Users className="h-4 w-4" />} />
                <ScoreCard label="Culture" score={selected.cultural_fit_score} icon={<ShieldCheck className="h-4 w-4" />} />
                <ScoreCard label="Tone" score={selected.tone_classification_score} icon={<MessageSquare className="h-4 w-4" />} />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-slate-900">Top Skill Metrics</h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      {selected.rank_in_assessment ? `Rank #${selected.rank_in_assessment}` : 'Rank N/A'}
                      {selected.total_candidates_evaluated ? ` of ${selected.total_candidates_evaluated}` : ''}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {topSkills(selected).map(([skill, data]) => (
                      <div key={skill}>
                        <div className="mb-1 flex items-end justify-between gap-3">
                          <span className="truncate text-xs font-black capitalize text-slate-800">{skill.replace(/_/g, ' ')}</span>
                          <span className={`text-xs font-black ${scoreColor(data.weighted_score)}`}>{Math.round(data.weighted_score)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${scoreBg(data.weighted_score)}`}
                            style={{ width: `${Math.min(100, Math.max(0, data.weighted_score))}%` }}
                          />
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-relaxed text-slate-500">{data.summary}</p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Priority {data.priority_score ?? 'N/A'}
                          {typeof data.weight_share === 'number' ? ` - Weight ${data.weight_share.toFixed(1)}%` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-black text-slate-900">Recommendation Reasoning</h3>
                  <p className="text-xs font-medium leading-relaxed text-slate-600">{selected.recommendation_reasoning}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Percentile</p>
                      <p className="mt-1 text-lg font-black text-slate-900">
                        {selected.percentile_in_assessment !== null ? `${selected.percentile_in_assessment}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Generated</p>
                      <p className="mt-1 text-xs font-bold text-slate-700">{new Date(selected.generated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <SignalList
                  title="Strengths"
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  items={selected.strengths}
                  tone="emerald"
                />
                <SignalList
                  title="Concerns"
                  icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                  items={selected.concerns}
                  tone="amber"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number; suffix?: string; icon: React.ReactNode }> = ({
  label,
  value,
  suffix = '',
  icon,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
      {icon}
    </div>
    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-950">
      {value}<span className="text-xs font-bold text-slate-400">{suffix}</span>
    </p>
  </div>
);

const ScoreCard: React.FC<{ label: string; score: number | null; icon: React.ReactNode }> = ({ label, score, icon }) => {
  const displayScore = score ?? 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${scoreColor(displayScore)} bg-slate-50 ring-1 ring-slate-100`}>
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${score === null ? 'text-slate-400' : scoreColor(displayScore)}`}>
        {score === null ? 'N/A' : Math.round(score)}
        {score !== null && <span className="text-xs font-bold text-slate-400">/100</span>}
      </p>
    </div>
  );
};

const SignalList: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: string[];
  tone: 'emerald' | 'amber';
}> = ({ title, icon, items, tone }) => {
  const classes = tone === 'emerald'
    ? 'border-emerald-100 bg-emerald-50/45 text-emerald-800'
    : 'border-amber-100 bg-amber-50/55 text-amber-800';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs font-medium text-slate-400">None recorded.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item, index) => (
            <li key={`${title}-${index}`} className={`rounded-lg border p-2.5 text-xs font-medium leading-relaxed ${classes}`}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
