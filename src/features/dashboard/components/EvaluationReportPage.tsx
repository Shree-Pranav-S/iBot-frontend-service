import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Download,
  FileCheck2,
  Loader2,
  Mail,
  MessageSquareText,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  User,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useCandidateEvaluation, useInterviewTranscript } from '../../../hooks/queries';
import type {
  EvaluationSkillBreakdown,
  InterviewEvaluationResponse,
  SectionCommunicationBreakdown,
  TranscriptTurn,
} from '../../../types/candidate.types';
import {
  CompetencyRadar,
  DecisionModal,
  ScoreBar,
  ScoreRing,
  StatusPill,
} from './EvaluationUI';
import {
  candidateInitials,
  decisionMeta,
  formatDateTime,
  formatLabel,
  recommendationMeta,
  scoreLabel,
  scoreTextClass,
  useEvaluationDecision,
} from './evaluationUiUtils';

type ReportTab = 'overview' | 'skills' | 'dimensions' | 'integrity' | 'transcript';

const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'skills', label: 'Technical Skills', icon: <BrainCircuit className="h-3.5 w-3.5" /> },
  { id: 'dimensions', label: 'Dimensions', icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'integrity', label: 'Integrity', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: 'transcript', label: 'Transcript', icon: <MessageSquareText className="h-3.5 w-3.5" /> },
];

const TURNS_PER_PAGE = 12;

export const EvaluationReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading, isError, isFetching, refetch } = useCandidateEvaluation(id || null);
  const { data: transcript } = useInterviewTranscript(id || null);
  const {
    modal,
    requestDecision,
    closeDecision,
    saveDecision,
    isSaving,
  } = useEvaluationDecision();
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [transcriptPage, setTranscriptPage] = useState(0);
  const [detailModal, setDetailModal] = useState<{ title: string; content: React.ReactNode } | null>(null);

  const skills = useMemo(() => {
    if (!evaluation) return [];
    return Object.entries(evaluation.skill_scores ?? {}).sort(([, a], [, b]) => {
      const pd = b.priority_score - a.priority_score;
      return pd || b.score - a.score;
    });
  }, [evaluation]);

  const transcriptPages = useMemo(() => {
    if (!transcript) return [];
    const turns = transcript.turns;
    const pages: TranscriptTurn[][] = [];
    for (let i = 0; i < turns.length; i += TURNS_PER_PAGE) {
      pages.push(turns.slice(i, i + TURNS_PER_PAGE));
    }
    return pages;
  }, [transcript]);

  if (isLoading) return <ReportLoadingState />;

  if (isError || !evaluation) {
    return (
      <div className="flex h-full min-h-[440px] items-center justify-center">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-9 text-center shadow-xl shadow-slate-200/60">
          <FileCheck2 className="mx-auto h-11 w-11 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-950">Report not available yet</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            The holistic evaluation may still be processing. Return to evaluations or retry.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={() => navigate('/evaluations')} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50">
              Back to evaluations
            </button>
            <button type="button" onClick={() => refetch()} className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const decision = decisionMeta(evaluation.recruiter_decision);
  const candidateName = evaluation.candidate_name || 'Candidate';
  const hiringRedFlag = recruiterFacingRedFlag(evaluation.recommendation_override_reason);
  const recommendationReasoning = evaluation.recommendation_reasoning.replace(/\s*Deterministic override:.*$/i, '').trim();

  return (
    <>
      <div className="ibot-scrollbar h-full overflow-y-auto pr-1 animate-fadeIn">
        <div className="mx-auto max-w-[1400px] space-y-4 pb-8 print:max-w-none">

          {/* ── Top Nav Bar ─────────────────────────────────────────── */}
          <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <button type="button" onClick={() => navigate('/evaluations')} className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition-colors hover:text-emerald-700">
              <ArrowLeft className="h-4 w-4" />
              Back to Evaluations
            </button>
            <div className="flex items-center gap-2">
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
              <span className="hidden text-[10px] font-bold text-slate-400 sm:inline">
                Generated {formatDateTime(evaluation.generated_at)}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
            </div>
          </header>

          {/* ── Candidate Hero Card ─────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none">
            <div className="h-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500" />
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 font-display text-lg font-black text-emerald-300 shadow-lg shadow-slate-900/15">
                    {candidateInitials(candidateName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill {...recommendation} />
                      <StatusPill {...decision} />
                      {evaluation.violation_summary?.has_violation && (
                        <StatusPill
                          label={`${evaluation.violation_summary.validated_violation_count} integrity concern${evaluation.violation_summary.validated_violation_count === 1 ? '' : 's'}`}
                          className="border-rose-200 bg-rose-50 text-rose-800"
                          dot="bg-rose-500"
                        />
                      )}
                    </div>
                    <h1 className="mt-3 font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{candidateName}</h1>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      {evaluation.role_name && (
                        <span className="inline-flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-slate-400" />
                          {evaluation.role_name}
                        </span>
                      )}
                      {evaluation.assessment_title && (
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                          {evaluation.assessment_title}
                        </span>
                      )}
                      {evaluation.candidate_email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {evaluation.candidate_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => requestDecision(evaluation.candidate_assessment_id, candidateName, evaluation.recruiter_decision || 'PENDING', 'APPROVED')}
                    disabled={evaluation.recruiter_decision === 'APPROVED'}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDecision(evaluation.candidate_assessment_id, candidateName, evaluation.recruiter_decision || 'PENDING', 'REJECTED')}
                    disabled={evaluation.recruiter_decision === 'REJECTED'}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 transition-all hover:bg-rose-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <nav className="flex gap-0.5 overflow-x-auto border-t border-slate-200 bg-slate-50/80 px-3 py-2 print:hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-[10px] font-black transition-all ${
                    activeTab === tab.id
                      ? 'bg-slate-950 text-emerald-300 shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-emerald-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </section>

          {/* ── Tab Content ─────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <OverviewTab
              evaluation={evaluation}
              hiringRedFlag={hiringRedFlag}
              recommendationReasoning={recommendationReasoning}
              recommendation={recommendation}
              onDetailModal={setDetailModal}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsTab evaluation={evaluation} skills={skills} onDetailModal={setDetailModal} />
          )}
          {activeTab === 'dimensions' && (
            <DimensionsTab evaluation={evaluation} />
          )}
          {activeTab === 'integrity' && (
            <IntegrityTab evaluation={evaluation} />
          )}
          {activeTab === 'transcript' && (
            <TranscriptTab
              transcript={transcriptPages}
              currentPage={transcriptPage}
              totalTurns={transcript?.turns.length ?? 0}
              totalElapsed={transcript?.total_elapsed_secs ?? 0}
              onPage={setTranscriptPage}
            />
          )}

          {/* ── Decision Banner ─────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10 print:border-slate-300 print:bg-white print:text-slate-950">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-300 print:bg-emerald-50 print:text-emerald-700">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black">Recruiter decision</p>
                  <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-slate-400 print:text-slate-600">
                    AI provides an evidence-based recommendation. The accountable hiring decision remains with the recruiter.
                  </p>
                  {evaluation.recruiter_feedback && (
                    <p className="mt-2 text-xs font-semibold text-slate-300 print:text-slate-700">
                      Saved feedback: {evaluation.recruiter_feedback}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">
                <StatusPill {...decision} />
                <button
                  type="button"
                  onClick={() => requestDecision(evaluation.candidate_assessment_id, candidateName, evaluation.recruiter_decision || 'PENDING', 'APPROVED')}
                  disabled={evaluation.recruiter_decision === 'APPROVED'}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => requestDecision(evaluation.candidate_assessment_id, candidateName, evaluation.recruiter_decision || 'PENDING', 'REJECTED')}
                  disabled={evaluation.recruiter_decision === 'REJECTED'}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      {detailModal && (
        <div className="ibot-overlay" onMouseDown={() => setDetailModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-lg max-h-[85vh] flex flex-col animate-scaleIn overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-950">{detailModal.title}</h2>
              <button onClick={() => setDetailModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="ibot-scrollbar flex-1 overflow-y-auto p-5">
              {detailModal.content}
            </div>
          </div>
        </div>
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

/* ── Overview Tab ──────────────────────────────────────────────────────── */
const OverviewTab: React.FC<{
  evaluation: InterviewEvaluationResponse;
  hiringRedFlag: string;
  recommendationReasoning: string;
  recommendation: ReturnType<typeof recommendationMeta>;
  onDetailModal: (m: { title: string; content: React.ReactNode }) => void;
}> = ({ evaluation, hiringRedFlag, recommendationReasoning, recommendation, onDetailModal }) => (
  <div className="space-y-4 animate-fadeIn">
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      <div className="space-y-4">
        <ClickableCard
          title="Executive summary"
          subtitle="Holistic evidence-based assessment"
          icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
          preview={evaluation.overall_summary}
          onClick={() =>
            onDetailModal({
              title: 'Executive Summary',
              content: (
                <div className="space-y-4">
                  <p className="text-sm font-medium leading-7 text-slate-600">{evaluation.overall_summary}</p>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <div className="flex items-start gap-3">
                      <Scale className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <div>
                        <p className="text-xs font-black text-indigo-950">Recommendation reasoning</p>
                        <p className="mt-1.5 text-xs font-medium leading-6 text-indigo-900/80">{recommendationReasoning}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            })
          }
        />
        {hiringRedFlag && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-black text-amber-950">Hiring red flag</p>
                <p className="mt-1.5 text-xs font-semibold leading-5 text-amber-900/80">{hiringRedFlag}</p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={<CircleGauge className="h-4 w-4 text-indigo-600" />} title="Score overview" subtitle="Interview performance and integrity findings." />
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            <CalculationStep label="Performance score" value={evaluation.raw_overall_score} helper="Combined interview performance" />
            <span className="hidden text-xl font-black text-slate-300 md:block">−</span>
            <CalculationStep label="Integrity adjustment" value={evaluation.violation_penalty} helper="Adjustment for confirmed concerns" penalty />
            <span className="hidden text-xl font-black text-slate-300 md:block">=</span>
            <CalculationStep label="Final score" value={evaluation.overall_score} helper="Overall interview result" final />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid place-items-center">
            <ScoreRing score={evaluation.overall_score} size={164} />
            <p className="mt-2 text-xs font-black text-slate-900">{recommendation.label} recommendation</p>
            <p className="mt-1 text-center text-[10px] font-semibold text-slate-400">
              {scoreLabel(evaluation.overall_score)} overall performance
            </p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniStat label="Rank" value={evaluation.rank_in_assessment ? `#${evaluation.rank_in_assessment}` : '—'} />
            <MiniStat label="Percentile" value={evaluation.percentile_in_assessment === null ? '—' : `${evaluation.percentile_in_assessment}%`} />
            <MiniStat label="Cohort" value={evaluation.total_candidates_evaluated ? String(evaluation.total_candidates_evaluated) : '—'} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="px-1">
            <p className="text-xs font-black text-slate-900">Competency radar</p>
            <p className="mt-1 text-[10px] font-semibold text-slate-400">Balance across scoring dimensions</p>
          </div>
          <CompetencyRadar
            points={[
              { label: 'Technical', score: evaluation.overall_technical_skill_score },
              { label: 'Behaviour', score: evaluation.behavioural_cultural_score },
              { label: 'Communication', score: evaluation.communication_score },
              { label: 'Introduction', score: evaluation.intro_section_score },
            ]}
          />
        </div>
      </div>
    </div>

    {/* Score metrics */}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Technical', score: evaluation.overall_technical_skill_score, icon: <BrainCircuit className="h-4 w-4" /> },
        { label: 'Behaviour & culture', score: evaluation.behavioural_cultural_score, icon: <Users className="h-4 w-4" /> },
        { label: 'Communication', score: evaluation.communication_score, icon: <MessageSquareText className="h-4 w-4" /> },
        { label: 'Self introduction', score: evaluation.intro_section_score, icon: <UserRound className="h-4 w-4" /> },
      ].map((m) => (
        <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{m.label}</p>
              <p className={`mt-1.5 font-display text-2xl font-black ${scoreTextClass(m.score)}`}>
                {m.score.toFixed(1)}<span className="ml-1 text-[10px] text-slate-400">/10</span>
              </p>
              <p className="mt-1 text-[10px] font-bold text-slate-500">{scoreLabel(m.score)}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ${scoreTextClass(m.score)}`}>{m.icon}</div>
          </div>
          <div className="mt-3"><ScoreBar score={m.score} compact /></div>
        </div>
      ))}
    </div>
  </div>
);

/* ── Skills Tab ─────────────────────────────────────────────────────────── */
const SkillsTab: React.FC<{
  evaluation: InterviewEvaluationResponse;
  skills: Array<[string, EvaluationSkillBreakdown]>;
  onDetailModal: (m: { title: string; content: React.ReactNode }) => void;
}> = ({ evaluation, skills, onDetailModal }) => (
  <div className="space-y-4 animate-fadeIn">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle icon={<BarChart3 className="h-4 w-4 text-emerald-600" />} title="Technical skill portfolio" subtitle="Performance across assessed technical areas." />
      <div className="space-y-4">
        <div className="grid grid-cols-[minmax(120px,0.65fr)_minmax(0,1.35fr)_68px] gap-3 text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
          <span>Skill</span>
          <span className="flex justify-between px-1"><span>0</span><span>2.5</span><span>5</span><span>7.5</span><span>10</span></span>
          <span className="text-right">Score</span>
        </div>
        {skills.map(([skill, details]) => (
          <button
            key={skill}
            type="button"
            className="grid w-full grid-cols-[minmax(120px,0.65fr)_minmax(0,1.35fr)_68px] items-center gap-3 text-left hover:bg-slate-50/80 rounded-lg px-2 py-1 transition-colors group"
            onClick={() =>
              onDetailModal({
                title: skill,
                content: (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Score</p>
                        <p className={`mt-1 text-2xl font-black ${scoreTextClass(details.score)}`}>{details.score.toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Priority</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">{details.priority_score.toFixed(1)}</p>
                      </div>
                    </div>
                    <ScoreBar score={details.score} />
                    <p className="text-xs font-medium leading-6 text-slate-600">{evaluation.skill_summary?.[skill] || 'No summary generated.'}</p>
                    <div>
                      <p className="mb-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Evidence</p>
                      <ul className="space-y-2">
                        {(evaluation.skill_evidence?.[skill] || []).map((item, i) => (
                          <li key={i} className="border-l-2 border-emerald-300 bg-slate-50 px-3 py-2 text-[10px] font-medium leading-5 text-slate-600">{item}</li>
                        ))}
                        {(evaluation.skill_evidence?.[skill] || []).length === 0 && (
                          <li className="text-[10px] font-semibold text-slate-400">No evidence recorded.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ),
              })
            }
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-slate-800 group-hover:text-emerald-700 transition-colors" title={skill}>{skill}</p>
              <p className="mt-0.5 text-[9px] font-bold text-slate-400">Priority {details.priority_score.toFixed(1)} · {details.questions_evaluated}q · {Math.round(details.confidence * 100)}% conf.</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex justify-between px-[25%]">
                <span className="border-l border-white/80" /><span className="border-l border-white/80" /><span className="border-l border-white/80" />
              </div>
              <ScoreBar score={details.score} />
            </div>
            <div className="text-right">
              <p className={`text-sm font-black ${scoreTextClass(details.score)}`}>{details.score.toFixed(1)}</p>
              <p className="text-[8px] font-bold text-slate-400">{Math.round(details.confidence * 100)}%</p>
            </div>
          </button>
        ))}
        {skills.length === 0 && <p className="text-[10px] font-semibold text-slate-400">No technical skill scores generated.</p>}
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <SignalPanel title="Demonstrated strengths" subtitle="Technical skills scoring 7.5 or above." items={evaluation.strengths} icon={<ThumbsUp className="h-4 w-4" />} tone="emerald" />
      <SignalPanel title="Technical concerns" subtitle="Low-scoring or high-priority risk skills." items={evaluation.concerns} icon={<ShieldAlert className="h-4 w-4" />} tone="rose" />
    </div>
  </div>
);

/* ── Dimensions Tab ─────────────────────────────────────────────────────── */
const DimensionsTab: React.FC<{ evaluation: InterviewEvaluationResponse }> = ({ evaluation }) => (
  <div className="space-y-4 animate-fadeIn">
    <div className="grid gap-4 xl:grid-cols-3">
      {[
        { title: 'Self introduction', score: evaluation.intro_section_score, summary: evaluation.intro_section_summary, evidence: evaluation.intro_section_evidence, icon: <UserRound className="h-4 w-4" /> },
        { title: 'Behaviour & culture', score: evaluation.behavioural_cultural_score, summary: evaluation.behavioural_cultural_summary, evidence: evaluation.behavioural_cultural_evidence, icon: <Users className="h-4 w-4" /> },
        { title: 'Communication', score: evaluation.communication_score, summary: evaluation.communication_summary, evidence: evaluation.communication_evidence, icon: <MessageSquareText className="h-4 w-4" /> },
      ].map((dim) => (
        <article key={dim.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 ${scoreTextClass(dim.score)}`}>{dim.icon}</span>
              <h3 className="text-sm font-black text-slate-950">{dim.title}</h3>
            </div>
            <span className={`text-lg font-black ${scoreTextClass(dim.score)}`}>{dim.score.toFixed(1)}</span>
          </div>
          <div className="mt-3"><ScoreBar score={dim.score} compact /></div>
          <p className="mt-4 text-xs font-medium leading-6 text-slate-600">{dim.summary}</p>
          <EvidenceList evidence={dim.evidence} empty="No direct evidence was recorded." />
        </article>
      ))}
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle icon={<MessageSquareText className="h-4 w-4 text-indigo-600" />} title="Communication by interview section" subtitle="Clarity, structure, tone, and engagement assessed across each phase." />
      <div className="grid gap-3 lg:grid-cols-3">
        {Object.entries(evaluation.section_communication_scores ?? {}).map(([section, details]) => (
          <SectionCommunicationCard key={section} section={section} details={details} />
        ))}
      </div>
    </div>
  </div>
);

/* ── Integrity Tab ──────────────────────────────────────────────────────── */
const IntegrityTab: React.FC<{ evaluation: InterviewEvaluationResponse }> = ({ evaluation }) => {
  const summary = evaluation.violation_summary;
  if (!summary) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-fadeIn">
        <SectionTitle icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} title="Integrity and conduct" subtitle="Interview integrity summary." />
        <p className="text-xs font-semibold text-slate-500">No violation summary was generated.</p>
      </div>
    );
  }

  const hasCritical = summary.severity_counts.critical > 0;
  return (
    <div className={`animate-fadeIn rounded-2xl border p-5 shadow-sm ${summary.has_violation ? 'border-amber-200 bg-amber-50/35' : 'border-emerald-200 bg-emerald-50/30'}`}>
      <SectionTitle
        icon={summary.has_violation ? <AlertOctagon className="h-4 w-4 text-amber-600" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
        title="Integrity and conduct"
        subtitle="Interview integrity concerns and supporting evidence."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SeverityTile label="Confirmed" value={summary.validated_violation_count} tone={summary.has_violation ? 'amber' : 'emerald'} />
        <SeverityTile label="Low" value={summary.severity_counts.low} tone="slate" />
        <SeverityTile label="Medium" value={summary.severity_counts.medium} tone="amber" />
        <SeverityTile label="High" value={summary.severity_counts.high} tone="rose" />
        <SeverityTile label="Critical" value={summary.severity_counts.critical} tone={hasCritical ? 'rose' : 'slate'} />
      </div>
      <p className="mt-4 text-xs font-medium leading-6 text-slate-600">{summary.summary}</p>
      {summary.hard_gate_reasons.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <p className="text-xs font-black text-rose-900">Hiring red flags</p>
          </div>
          <ul className="mt-2 space-y-1.5">
            {summary.hard_gate_reasons.map((reason) => (
              <li key={reason} className="text-[11px] font-semibold leading-5 text-rose-800">• {reason}</li>
            ))}
          </ul>
        </div>
      )}
      <EvidenceList evidence={evaluation.violation_evidence ?? []} empty="No supporting integrity evidence was recorded." />
    </div>
  );
};

/* ── Transcript Tab ─────────────────────────────────────────────────────── */
const TranscriptTab: React.FC<{
  transcript: TranscriptTurn[][];
  currentPage: number;
  totalTurns: number;
  totalElapsed: number;
  onPage: (page: number) => void;
}> = ({ transcript, currentPage, totalTurns, totalElapsed, onPage }) => {
  if (transcript.length === 0) {
    return (
      <div className="animate-fadeIn rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center shadow-sm">
        <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-sm font-black text-slate-700">No transcript available</h3>
        <p className="mt-1 text-xs font-medium text-slate-400">
          The interview transcript will appear here once the session is completed.
        </p>
      </div>
    );
  }

  const page = transcript[currentPage] ?? [];
  const totalPages = transcript.length;
  const elapsedMins = Math.round(totalElapsed / 60);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="ibot-panel overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <p className="text-xs font-black text-slate-900">Interview transcript</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
              {totalTurns} turns · {elapsedMins > 0 ? `${elapsedMins} min` : 'duration unavailable'} · Page {currentPage + 1} of {totalPages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => onPage(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPage(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="space-y-3 p-5">
          {page.map((turn) => {
            const isBot = turn.speaker === 'bot' || turn.speaker === 'interviewer';
            return (
              <div
                key={turn.turn_number}
                className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isBot ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-600 text-white'}`}>
                  {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
                <div className={`max-w-[80%] ${isBot ? '' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm font-medium leading-6 ${isBot ? 'bg-slate-100 text-slate-700 rounded-tl-sm' : 'bg-emerald-600 text-white rounded-tr-sm'}`}>
                    {turn.text}
                  </div>
                  <p className={`mt-1 text-[9px] font-bold text-slate-400 ${isBot ? 'text-left' : 'text-right'}`}>
                    {isBot ? 'Interviewer' : 'Candidate'} · Turn {turn.turn_number}
                    {turn.tone && ` · ${turn.tone}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Page indicators */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-5 py-3">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPage(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentPage ? 'w-5 bg-emerald-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Shared subcomponents ───────────────────────────────────────────────── */
const ClickableCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  preview: string;
  onClick: () => void;
}> = ({ title, subtitle, icon, preview, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left hover:border-emerald-300 hover:shadow-md transition-all group"
  >
    <SectionTitle icon={icon} title={title} subtitle={subtitle} />
    <p className="text-sm font-medium leading-7 text-slate-600 line-clamp-3">{preview}</p>
    <p className="mt-3 text-[10px] font-black text-emerald-700 group-hover:text-emerald-800">Click to read full summary →</p>
  </button>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-black text-slate-950">{title}</h2>
    </div>
    <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-400">{subtitle}</p>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 text-center">
    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
  </div>
);

const CalculationStep: React.FC<{ label: string; value: number; helper: string; penalty?: boolean; final?: boolean }> = ({ label, value, helper, penalty = false, final = false }) => (
  <div className={`rounded-xl border p-4 ${final ? 'border-emerald-200 bg-emerald-50/70' : penalty && value > 0 ? 'border-rose-200 bg-rose-50/70' : 'border-slate-200 bg-slate-50/70'}`}>
    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p>
    <p className={`mt-1.5 font-display text-2xl font-black ${penalty && value > 0 ? 'text-rose-700' : final ? 'text-emerald-700' : 'text-slate-900'}`}>{value.toFixed(2)}</p>
    <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{helper}</p>
  </div>
);

const SignalPanel: React.FC<{ title: string; subtitle: string; items: string[]; icon: React.ReactNode; tone: 'emerald' | 'rose' }> = ({ title, subtitle, items, icon, tone }) => {
  const style = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-rose-200 bg-rose-50/60 text-rose-800';
  return (
    <div className={`rounded-2xl border p-5 ${style}`}>
      <div className="flex items-center gap-2">{icon}<p className="text-sm font-black">{title}</p></div>
      <p className="mt-1 text-[10px] font-semibold opacity-70">{subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-current/10 bg-white/75 px-3 py-1.5 text-[10px] font-black">{item}</span>
        ))}
        {items.length === 0 && <p className="text-xs font-semibold opacity-65">None identified.</p>}
      </div>
    </div>
  );
};

const SectionCommunicationCard: React.FC<{ section: string; details: SectionCommunicationBreakdown }> = ({ section, details }) => (
  <article className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-xs font-black text-slate-900">{formatLabel(section)}</h3>
      <span className={`text-sm font-black ${scoreTextClass(details.score)}`}>{details.score.toFixed(1)}</span>
    </div>
    <div className="mt-2"><ScoreBar score={details.score} compact /></div>
    <p className="mt-3 text-[11px] font-medium leading-5 text-slate-600">{details.summary}</p>
    <EvidenceList evidence={details.evidence} empty="No section evidence recorded." compact />
  </article>
);

const EvidenceList: React.FC<{ evidence: string[]; empty: string; compact?: boolean }> = ({ evidence, empty, compact = false }) => (
  <div className={compact ? 'mt-3' : 'mt-4'}>
    <p className="mb-2 text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Evidence</p>
    <ul className="space-y-2">
      {evidence.map((item, i) => (
        <li key={i} className="border-l-2 border-emerald-300 bg-white px-3 py-2 text-[10px] font-medium leading-5 text-slate-600 shadow-sm">{item}</li>
      ))}
      {evidence.length === 0 && <li className="text-[10px] font-semibold text-slate-400">{empty}</li>}
    </ul>
  </div>
);

const SeverityTile: React.FC<{ label: string; value: number; tone: 'slate' | 'emerald' | 'amber' | 'rose' }> = ({ label, value, tone }) => {
  const styles = { slate: 'border-slate-200 bg-white text-slate-800', emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800', amber: 'border-amber-200 bg-amber-50 text-amber-800', rose: 'border-rose-200 bg-rose-50 text-rose-800' };
  return (
    <div className={`rounded-xl border p-3 text-center ${styles[tone]}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.12em] opacity-60">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
};

const recruiterFacingRedFlag = (reason: string | null): string => {
  const value = reason?.trim();
  if (!value) return '';
  return value
    .replace(/^Recommendation gates? applied:\s*/i, '')
    .replace(/^Hard gate:\s*/i, '')
    .replace(/Deterministic score thresholds changed the model recommendation/i, 'The overall interview result did not meet the hiring threshold');
};

const ReportLoadingState = () => (
  <div className="ibot-scrollbar h-full overflow-y-auto pr-1">
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="grid h-80 place-items-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-500" />
            <p className="mt-3 text-xs font-bold text-slate-400">Building detailed report…</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
