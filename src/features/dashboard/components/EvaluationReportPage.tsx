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
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm text-gray-500 font-medium">Analyzing interview report...</p>
      </div>
    );
  }

  if (isError || !evaluation) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center">
        <ShieldAlert className="h-12 w-12 text-red-400 mb-3" />
        <p className="font-bold text-gray-800 text-lg">Evaluation Not Found</p>
        <p className="text-sm text-gray-500 mt-1 max-w-md">
          This candidate may not have completed their interview or the AI evaluation is still processing.
        </p>
        <button
          onClick={() => navigate('/dashboard/candidates')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
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
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/dashboard/candidates')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </button>
        <span className="text-xs text-gray-400 font-medium">
          Generated at: {new Date(evaluation.generated_at).toLocaleString()}
        </span>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-50 rounded-full blur-[100px] -mr-16 -mt-16 opacity-50 pointer-events-none" />
        
        <div className="flex-1 z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border tracking-wide ${getRecommendationStyle(evaluation.hiring_recommendation)}`}>
              {evaluation.hiring_recommendation.replace('_', ' ')}
            </span>
            {evaluation.recommendation_override_reason && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <AlertTriangle className="h-3.5 w-3.5" />
                Manually Overridden
              </span>
            )}
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
            Comprehensive Evaluation Report
          </h1>
          <p className="text-gray-600 leading-relaxed max-w-2xl text-sm mb-6 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
            {evaluation.overall_narrative}
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Rank</p>
              <p className="text-xl font-black text-gray-900">
                {evaluation.rank_in_assessment ? `#${evaluation.rank_in_assessment}` : 'N/A'}
                <span className="text-sm font-medium text-gray-400 ml-1">/ {evaluation.total_candidates_evaluated || 1}</span>
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Percentile</p>
              <p className="text-xl font-black text-gray-900">
                {evaluation.percentile_in_assessment ? `Top ${100 - evaluation.percentile_in_assessment}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Score Dial */}
        <div className="w-full md:w-64 flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] z-10">
          <div className="relative w-32 h-32 flex items-center justify-center mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="8"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(evaluation.overall_score / 100) * 251.2} 251.2`}
                className={`transition-all duration-1000 ease-out ${getScoreColor(evaluation.overall_score)}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-black tracking-tighter ${getScoreColor(evaluation.overall_score)}`}>
                {Math.round(evaluation.overall_score)}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">/ 100</span>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overall Score</p>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <DimensionCard
          title="Technical"
          icon={<BrainCircuit className="h-5 w-5" />}
          score={evaluation.technical_dimension_score}
        />
        <DimensionCard
          title="Problem Solving"
          icon={<Lightbulb className="h-5 w-5" />}
          score={evaluation.problem_solving_score}
        />
        <DimensionCard
          title="Communication"
          icon={<MessageSquare className="h-5 w-5" />}
          score={evaluation.communication_score}
        />
        <DimensionCard
          title="Behavioral"
          icon={<Users className="h-5 w-5" />}
          score={evaluation.behavioural_score}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Strengths & Concerns */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ThumbsUp className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">Key Strengths</h2>
            </div>
            <ul className="space-y-3">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-emerald-900 leading-relaxed font-medium">{s}</span>
                </li>
              ))}
              {evaluation.strengths.length === 0 && (
                <p className="text-sm text-gray-400 italic">No notable strengths identified.</p>
              )}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ThumbsDown className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Areas for Improvement</h2>
            </div>
            <ul className="space-y-3">
              {evaluation.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                  <TrendingUp className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-900 leading-relaxed font-medium">{c}</span>
                </li>
              ))}
              {evaluation.concerns.length === 0 && (
                <p className="text-sm text-gray-400 italic">No significant concerns identified.</p>
              )}
            </ul>
          </div>

        </div>

        {/* Right Column - Skill Breakdown */}
        <div className="space-y-8">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900">Skill Breakdown</h2>
            </div>
            <div className="space-y-5">
              {Object.entries(evaluation.skill_scores).map(([skill, data]) => (
                <div key={skill}>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-sm font-bold text-gray-800">{skill}</span>
                    <span className={`text-xs font-black ${getScoreColor(data.weighted_score)}`}>
                      {Math.round(data.weighted_score)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBg(data.weighted_score)}`}
                      style={{ width: `${data.weighted_score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-relaxed">
                    {data.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {evaluation.red_flags.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-bold text-red-900">Red Flags</h2>
              </div>
              <ul className="space-y-3">
                {evaluation.red_flags.map((flag, i) => (
                  <li key={i} className="flex flex-col gap-1 bg-white/50 p-3 rounded-xl border border-red-100">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                        {flag.severity}
                      </span>
                    </div>
                    <span className="text-sm text-red-900 leading-relaxed">{flag.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Best and Weakest Answers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {evaluation.best_answer && (
          <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(16,185,129,0.1)]">
             <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-emerald-500" />
              <h2 className="text-base font-bold text-gray-900">Highlight Answer</h2>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl mb-4">
              <p className="text-xs font-bold text-emerald-700 mb-1">Question (Turn {evaluation.best_answer.turn_number})</p>
              <p className="text-sm text-emerald-900 font-medium leading-relaxed">{evaluation.best_answer.question}</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-bold text-gray-800">Why it stood out:</span> {evaluation.best_answer.reason}
            </p>
          </div>
        )}

        {evaluation.weakest_answer && (
          <div className="bg-white border border-red-200 rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(239,68,68,0.1)]">
             <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-red-500 transform rotate-180" />
              <h2 className="text-base font-bold text-gray-900">Weakest Answer</h2>
            </div>
            <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl mb-4">
              <p className="text-xs font-bold text-red-700 mb-1">Question (Turn {evaluation.weakest_answer.turn_number})</p>
              <p className="text-sm text-red-900 font-medium leading-relaxed">{evaluation.weakest_answer.question}</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-bold text-gray-800">Why it struggled:</span> {evaluation.weakest_answer.reason}
            </p>
          </div>
        )}
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
    <div className={`rounded-3xl border p-5 flex flex-col justify-between h-32 ${getColor(score)}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-sm tracking-wide">{title}</h3>
      </div>
      <div className="flex items-baseline gap-1 mt-auto">
        <span className="text-3xl font-black">{Math.round(score)}</span>
        <span className="text-xs font-bold opacity-50">/100</span>
      </div>
    </div>
  );
};
