import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidateEvaluation } from '../../../hooks/queries';
import {
  Loader2,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Users,
  Award,
  AlertTriangle,
  Lightbulb,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';

export const EvaluationReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading, isError } = useCandidateEvaluation(id || null);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Loading report…</p>
      </div>
    );
  }

  if (isError || !evaluation) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center animate-fadeIn">
        <ShieldAlert className="h-10 w-10 text-red-400 mb-3" />
        <p className="font-bold text-slate-800 text-base">Report Not Available</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          The interview may still be in progress or the evaluation hasn't completed yet.
        </p>
        <button
          onClick={() => navigate('/dashboard/candidates')}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
    );
  }

  const getRecommendationStyle = (rec: string) => {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm flex-shrink-0 animate-slideDown">
        <button
          onClick={() => navigate('/dashboard/candidates')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-emerald-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <span className="text-[10px] text-slate-400 font-medium">
          {new Date(evaluation.generated_at).toLocaleString()}
        </span>
      </div>

      <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
      {/* Hero Section */}
      <div className="mb-3 flex flex-col items-start gap-5 overflow-hidden ibot-card p-5 md:flex-row animate-slideUp">
        <div className="flex-1 z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border tracking-wide ${getRecommendationStyle(evaluation.hiring_recommendation)}`}>
              {evaluation.hiring_recommendation.replace('_', ' ')}
            </span>
            {evaluation.recommendation_override_reason && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Override
              </span>
            )}
          </div>
          
          <h1 className="text-xl font-bold text-slate-900 mb-3">
            Evaluation Report
          </h1>
          <p className="text-slate-600 leading-relaxed max-w-2xl text-xs bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
            {evaluation.overall_narrative}
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm mt-4">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Rank</p>
              <p className="text-lg font-bold text-slate-900">
                {evaluation.rank_in_assessment ? `#${evaluation.rank_in_assessment}` : 'N/A'}
                <span className="text-xs font-medium text-slate-400 ml-1">/ {evaluation.total_candidates_evaluated || 1}</span>
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Percentile</p>
              <p className="text-lg font-bold text-slate-900">
                {evaluation.percentile_in_assessment ? `Top ${100 - evaluation.percentile_in_assessment}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Score Dial */}
        <div className="w-full md:w-52 flex flex-col items-center justify-center p-5 bg-white rounded-xl border border-slate-100 shadow-sm z-10">
          <div className="relative w-28 h-28 flex items-center justify-center mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="8"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(evaluation.overall_score / 100) * 251.2} 251.2`}
                className={`transition-all duration-1000 ease-out ${getScoreColor(evaluation.overall_score)}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold tracking-tight ${getScoreColor(evaluation.overall_score)}`}>
                {Math.round(evaluation.overall_score)}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">/ 100</span>
            </div>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Overall</p>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <DimensionCard title="Technical" icon={<BrainCircuit className="h-4 w-4" />} score={evaluation.technical_dimension_score} />
        <DimensionCard title="Problem Solving" icon={<Lightbulb className="h-4 w-4" />} score={evaluation.problem_solving_score} />
        <DimensionCard title="Communication" icon={<MessageSquare className="h-4 w-4" />} score={evaluation.communication_score} />
        <DimensionCard title="Behavioral" icon={<Users className="h-4 w-4" />} score={evaluation.behavioural_score} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-3">
          
          <div className="ibot-card p-4">
            <div className="flex items-center gap-1.5 mb-4">
              <ThumbsUp className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-800">Strengths</h2>
            </div>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/50 animate-slideUp" style={{ animationDelay: `${i * 0.05}s` }}>
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-emerald-800 leading-relaxed">{s}</span>
                </li>
              ))}
              {evaluation.strengths.length === 0 && (
                <p className="text-xs text-slate-400 italic">None identified</p>
              )}
            </ul>
          </div>

          <div className="ibot-card p-4">
            <div className="flex items-center gap-1.5 mb-4">
              <ThumbsDown className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">Areas to Improve</h2>
            </div>
            <ul className="space-y-2">
              {evaluation.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/50 animate-slideUp" style={{ animationDelay: `${i * 0.05}s` }}>
                  <TrendingUp className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-800 leading-relaxed">{c}</span>
                </li>
              ))}
              {evaluation.concerns.length === 0 && (
                <p className="text-xs text-slate-400 italic">None identified</p>
              )}
            </ul>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="ibot-card p-4">
            <div className="flex items-center gap-1.5 mb-4">
              <Award className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-800">Skill Breakdown</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(evaluation.skill_scores).map(([skill, data]) => (
                <div key={skill}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-semibold text-slate-700">{skill}</span>
                    <span className={`text-[10px] font-bold ${getScoreColor(data.weighted_score)}`}>
                      {Math.round(data.weighted_score)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBg(data.weighted_score)} transition-all duration-700`}
                      style={{ width: `${data.weighted_score}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {data.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {evaluation.red_flags.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <h2 className="text-sm font-bold text-red-900">Red Flags</h2>
              </div>
              <ul className="space-y-2">
                {evaluation.red_flags.map((flag, i) => (
                  <li key={i} className="flex flex-col gap-0.5 bg-white/50 p-2.5 rounded-lg border border-red-100">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-600">
                      {flag.severity}
                    </span>
                    <span className="text-xs text-red-800 leading-relaxed">{flag.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Best and Weakest Answers */}
      <div className="grid grid-cols-2 gap-3 pb-1">
        {evaluation.best_answer && (
          <div className="ibot-card p-4 border-emerald-200/50">
             <div className="flex items-center gap-1.5 mb-3">
              <Award className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-800">Best Answer</h2>
            </div>
            <div className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-lg mb-3">
              <p className="text-[10px] font-semibold text-emerald-600 mb-0.5">Turn {evaluation.best_answer.turn_number}</p>
              <p className="text-xs text-emerald-800 leading-relaxed">{evaluation.best_answer.question}</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-700">Why: </span>{evaluation.best_answer.reason}
            </p>
          </div>
        )}

        {evaluation.weakest_answer && (
          <div className="ibot-card p-4 border-red-200/50">
             <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
              <h2 className="text-sm font-bold text-slate-800">Weakest Answer</h2>
            </div>
            <div className="bg-red-50/40 border border-red-100 p-3 rounded-lg mb-3">
              <p className="text-[10px] font-semibold text-red-600 mb-0.5">Turn {evaluation.weakest_answer.turn_number}</p>
              <p className="text-xs text-red-800 leading-relaxed">{evaluation.weakest_answer.question}</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-700">Why: </span>{evaluation.weakest_answer.reason}
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

const DimensionCard: React.FC<{ title: string; icon: React.ReactNode; score: number }> = ({ title, icon, score }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (s >= 60) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (s >= 40) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className={`rounded-xl border p-4 flex flex-col justify-between h-28 transition-all hover:shadow-sm ${getColor(score)}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <h3 className="font-semibold text-xs">{title}</h3>
      </div>
      <div className="flex items-baseline gap-0.5 mt-auto">
        <span className="text-2xl font-bold">{Math.round(score)}</span>
        <span className="text-[10px] font-semibold opacity-40">/100</span>
      </div>
    </div>
  );
};
