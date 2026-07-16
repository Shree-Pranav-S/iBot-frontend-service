import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Bot,
  BrainCircuit,
  ChevronDown,
  CircleGauge,
  FileDown,
  FileCheck2,
  ListChecks,
  Loader2,
  Mail,
  MessageSquareText,
  Printer,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  UserCheck,
  UserRound,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useCandidateEvaluation, useInterviewTranscript } from '../../../hooks/queries';
import type {
  EvaluationSkillBreakdown,
  InterviewEvaluationResponse,
  QuestionEvaluationBreakdown,
  SectionCommunicationBreakdown,
  TranscriptTurn,
} from '../../../types/candidate.types';
import {
  CenteredDialog,
  CompetencyRadar,
  DecisionModal,
  RecruiterNarrativeContent,
  ScoreBar,
  ScoreRing,
  StatusPill,
} from './EvaluationUI';
import {
  candidateInitials,
  cleanRecruiterNarrative,
  decisionMeta,
  formatDateTime,
  formatLabel,
  recommendationMeta,
  scoreLabel,
  scoreTextClass,
  isDecisionFinalized,
  useEvaluationDecision,
} from './evaluationUiUtils';
import { EvaluationPrintReport } from './EvaluationPrintReport';
import {
  buildTranscriptText,
  downloadTextFile,
  isInterviewerTurn,
  transcriptFileName,
  transcriptTurnTime,
} from './evaluationReportUtils';

type ReportTab = 'overview' | 'skills' | 'questions' | 'dimensions' | 'integrity' | 'transcript';

const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'skills', label: 'Technical Skills', icon: <BrainCircuit className="h-3.5 w-3.5" /> },
  { id: 'questions', label: 'Q&A Review', icon: <ListChecks className="h-3.5 w-3.5" /> },
  { id: 'dimensions', label: 'Dimensions', icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'integrity', label: 'Integrity', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: 'transcript', label: 'Transcript', icon: <MessageSquareText className="h-3.5 w-3.5" /> },
];

const reportTabCount = (
  tab: ReportTab,
  evaluation: InterviewEvaluationResponse,
  transcript: { turns: TranscriptTurn[] } | null | undefined,
) => {
  if (tab === 'skills') return Object.keys(evaluation.skill_scores ?? {}).length;
  if (tab === 'questions') return evaluation.question_evaluations?.length ?? 0;
  if (tab === 'integrity') {
    return evaluation.violation_summary?.validated_violation_count ?? 0;
  }
  if (tab === 'transcript') return transcript?.turns.length ?? 0;
  return null;
};

const skillElementId = (skill: string) =>
  `evaluation-skill-${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export const EvaluationReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldAutoPrint = searchParams.get('print') === '1';
  const { data: evaluation, isLoading, isError, isFetching, refetch } = useCandidateEvaluation(id || null);
  const {
    data: transcript,
    isLoading: isTranscriptLoading,
    isError: isTranscriptError,
  } = useInterviewTranscript(id || null);
  const {
    modal,
    requestDecision,
    closeDecision,
    saveDecision,
    generateFeedback,
    isSaving,
    isGeneratingFeedback,
  } = useEvaluationDecision();
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [detailModal, setDetailModal] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const hasAutoPrinted = useRef(false);

  const skills = useMemo(() => {
    if (!evaluation) return [];
    return Object.entries(evaluation.skill_scores ?? {}).sort(([, a], [, b]) => {
      const pd = b.priority_score - a.priority_score;
      return pd || b.score - a.score;
    });
  }, [evaluation]);

  useEffect(() => {
    if (!shouldAutoPrint || !evaluation || isTranscriptLoading || hasAutoPrinted.current) return;

    hasAutoPrinted.current = true;
    setDetailModal(null);
    setTranscriptModalOpen(false);
    closeDecision();

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('print');
    setSearchParams(nextParams, { replace: true });

    window.setTimeout(() => window.print(), 150);
  }, [
    shouldAutoPrint,
    evaluation,
    isTranscriptLoading,
    closeDecision,
    searchParams,
    setSearchParams,
  ]);

  if (isLoading) return <ReportLoadingState />;

  if (isError || !evaluation) {
    return (
      <div className="flex h-full min-h-[440px] items-center justify-center">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-9 text-center shadow-xl shadow-slate-200/60">
          <FileCheck2 className="mx-auto h-11 w-11 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-950">Report not available yet</h2>
          <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-500">
            The holistic evaluation may still be processing. Return to evaluations or retry.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={() => navigate('/evaluations')} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black text-slate-600 hover:bg-slate-50">
              Back to evaluations
            </button>
            <button type="button" onClick={() => refetch()} className="rounded-lg bg-brand-charcoal px-4 py-2.5 text-[11px] font-black text-white hover:bg-brand-hover">
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
  const executiveSummary = cleanRecruiterNarrative(evaluation.overall_summary);
  const recommendationReasoning = cleanRecruiterNarrative(evaluation.recommendation_reasoning);

  const navigateToTab = (tab: ReportTab) => {
    if (tab === 'transcript') {
      setTranscriptModalOpen(true);
      return;
    }

    setActiveTab(tab);
    window.requestAnimationFrame(() => {
      document.getElementById('evaluation-tab-content')?.focus({ preventScroll: true });
    });
  };

  const handleDownloadTranscript = () => {
    if (!transcript?.turns.length) return;
    downloadTextFile(
      buildTranscriptText(transcript),
      transcriptFileName(candidateName),
    );
  };

  const handlePrintReport = () => {
    if (isTranscriptLoading) return;
    setDetailModal(null);
    setTranscriptModalOpen(false);
    closeDecision();
    window.requestAnimationFrame(() => window.print());
  };

  return (
    <>
      <div className="ibot-scrollbar h-full min-h-0 overflow-y-auto overflow-x-hidden animate-fadeIn print:hidden lg:overflow-hidden">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col gap-3">

          {/* ── Top Nav Bar ─────────────────────────────────────────── */}
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => navigate('/evaluations')} className="inline-flex items-center gap-2 text-xs font-black text-slate-600 transition-colors hover:text-brand-hover">
              <ArrowLeft className="h-4 w-4" />
              Back to Evaluations
            </button>
            <div className="flex min-w-0 items-center gap-2">
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />}
              <span className="hidden text-[11px] font-bold text-slate-500 sm:inline">
                Generated {formatDateTime(evaluation.generated_at)}
              </span>
              <button
                type="button"
                onClick={handlePrintReport}
                disabled={isTranscriptLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-charcoal px-3.5 py-2.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-55"
                title={
                  isTranscriptLoading
                    ? 'Preparing the complete report'
                    : 'Print or save the complete evaluation report as PDF'
                }
              >
                <Printer className="h-3.5 w-3.5" />
                Print report
              </button>
            </div>
          </header>

          {/* ── Candidate Hero Card ─────────────────────────────────── */}
          <section className="ibot-section-surface shrink-0 overflow-hidden print:shadow-none">
            <div className="h-2 bg-gradient-to-r from-brand-charcoal via-brand-accent to-brand-hover" />
            <div className="p-4 sm:px-5 sm:py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-accent to-brand-hover font-display text-[16px] font-black text-white shadow-lg shadow-black/15">
                    {candidateInitials(candidateName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigateToTab('overview')}
                        className="rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                        title="Open recommendation overview"
                      >
                        <StatusPill {...recommendation} />
                      </button>
                      <StatusPill {...decision} />
                      {evaluation.violation_summary?.has_violation && (
                        <button
                          type="button"
                          onClick={() => navigateToTab('integrity')}
                          className="rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                          title="Open integrity findings"
                        >
                          <StatusPill
                            label={`${evaluation.violation_summary.validated_violation_count} integrity concern${evaluation.violation_summary.validated_violation_count === 1 ? '' : 's'}`}
                            className="border-rose-200 bg-rose-50 text-rose-800"
                            dot="bg-rose-500"
                          />
                        </button>
                      )}
                    </div>
                    <h1 className="mt-2 font-display text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{candidateName}</h1>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500">
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
                        <a
                          href={`mailto:${evaluation.candidate_email}`}
                          className="inline-flex min-w-0 items-center gap-1.5 break-all transition-colors hover:text-brand-hover"
                        >
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {evaluation.candidate_email}
                        </a>
                      )}
                    </div>
                    {evaluation.recruiter_feedback && (
                      <p className="mt-1.5 line-clamp-1 text-[10px] font-semibold text-brand-hover">
                        Recruiter note: {evaluation.recruiter_feedback}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex w-full shrink-0 flex-wrap gap-2 print:hidden xl:w-auto">
                  <button
                    type="button"
                    onClick={() => requestDecision(evaluation.candidate_assessment_id, candidateName, evaluation.recruiter_decision || 'PENDING', 'APPROVED')}
                    disabled={isDecisionFinalized(evaluation.recruiter_decision)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
                  >
                    <UserCheck className="h-4 w-4" />
                    Hire
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDecision(evaluation.candidate_assessment_id, candidateName, evaluation.recruiter_decision || 'PENDING', 'REJECTED')}
                    disabled={isDecisionFinalized(evaluation.recruiter_decision)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 transition-all hover:bg-rose-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
                  >
                    <UserX className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <nav
              className="grid grid-cols-2 gap-1 border-t border-slate-200 bg-slate-50/80 px-3 py-2 sm:grid-cols-3 md:grid-cols-6"
              role="tablist"
              aria-label="Evaluation report sections"
            >
              {TABS.map((tab) => {
                const selected =
                  tab.id === 'transcript'
                    ? transcriptModalOpen
                    : activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="evaluation-tab-content"
                    onClick={() => navigateToTab(tab.id)}
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 truncate rounded-lg px-2.5 py-2 text-[11px] font-black transition-all ${
                      selected
                        ? 'bg-brand-charcoal text-white shadow-sm'
                        : 'text-slate-500 hover:bg-white hover:text-brand-hover'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                    {reportTabCount(tab.id, evaluation, transcript) !== null && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          selected
                            ? 'bg-white/10 text-white'
                            : 'bg-slate-200/80 text-slate-500'
                        }`}
                      >
                        {reportTabCount(tab.id, evaluation, transcript)}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </section>

          {/* ── Tab Content ─────────────────────────────────────────── */}
          <div
            id="evaluation-tab-content"
            role="tabpanel"
            tabIndex={-1}
            className="ibot-scrollbar min-h-[320px] flex-1 overflow-y-auto pb-3 pr-1 outline-none lg:min-h-0"
          >
          {activeTab === 'overview' && (
            <OverviewTab
              evaluation={evaluation}
              executiveSummary={executiveSummary}
              hiringRedFlag={hiringRedFlag}
              recommendationReasoning={recommendationReasoning}
              recommendation={recommendation}
              onDetailModal={setDetailModal}
              onNavigate={navigateToTab}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsTab
              evaluation={evaluation}
              skills={skills}
              onDetailModal={setDetailModal}
              onNavigate={navigateToTab}
            />
          )}
          {activeTab === 'questions' && (
            <QuestionsTab questions={evaluation.question_evaluations ?? []} />
          )}
          {activeTab === 'dimensions' && (
            <DimensionsTab evaluation={evaluation} onDetailModal={setDetailModal} />
          )}
          {activeTab === 'integrity' && (
            <IntegrityTab evaluation={evaluation} onNavigate={navigateToTab} />
          )}
          {/* ── Decision Banner ─────────────────────────────────────── */}
          </div>
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      <div className="hidden print:block">
        <EvaluationPrintReport
          evaluation={evaluation}
          transcript={transcript}
          executiveSummary={executiveSummary}
          recommendationReasoning={recommendationReasoning}
          hiringRedFlag={hiringRedFlag}
        />
      </div>

      {detailModal && (
        <CenteredDialog
          onClose={() => setDetailModal(null)}
          labelledBy="evaluation-detail-title"
          className="max-w-3xl"
        >
          <div className="h-1.5 shrink-0 bg-gradient-to-r from-brand-charcoal via-brand-accent to-brand-hover" />
          <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white to-brand-soft/60 px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-hover">
                Evaluation detail
              </p>
              <h2 id="evaluation-detail-title" className="mt-0.5 text-[16px] font-black text-slate-950">
                {detailModal.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setDetailModal(null)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close evaluation detail"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {detailModal.content}
          </div>
        </CenteredDialog>
      )}

      {transcriptModalOpen && (
        <CenteredDialog
          onClose={() => setTranscriptModalOpen(false)}
          labelledBy="evaluation-transcript-title"
          className="h-[calc(100dvh-2rem)] max-w-6xl"
        >
          <TranscriptTab
            transcript={transcript?.turns ?? []}
            totalElapsed={transcript?.total_elapsed_secs ?? 0}
            isLoading={isTranscriptLoading}
            isError={isTranscriptError}
            onDownload={handleDownloadTranscript}
            onClose={() => setTranscriptModalOpen(false)}
            titleId="evaluation-transcript-title"
          />
        </CenteredDialog>
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

/* ── Overview Tab ──────────────────────────────────────────────────────── */
const OverviewTab: React.FC<{
  evaluation: InterviewEvaluationResponse;
  executiveSummary: string;
  hiringRedFlag: string;
  recommendationReasoning: string;
  recommendation: ReturnType<typeof recommendationMeta>;
  onDetailModal: (m: { title: string; content: React.ReactNode }) => void;
  onNavigate: (tab: ReportTab) => void;
}> = ({
  evaluation,
  executiveSummary,
  hiringRedFlag,
  recommendationReasoning,
  recommendation,
  onDetailModal,
  onNavigate,
}) => (
  <div className="space-y-4 animate-fadeIn">
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      <div className="space-y-4">
        <ClickableCard
          title="Executive summary"
          subtitle="Holistic evidence-based assessment"
          icon={<Sparkles className="h-4 w-4 text-brand-hover" />}
          preview={executiveSummary}
          onClick={() =>
            onDetailModal({
              title: 'Executive Summary',
              content: (
                <div className="space-y-4">
                  <RecruiterNarrativeContent text={executiveSummary} />
                  <div className="rounded-xl border border-default bg-brand-soft/70 p-4">
                    <div className="flex items-start gap-3">
                      <Scale className="mt-0.5 h-4 w-4 shrink-0 text-brand-hover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-brand-charcoal">Recommendation reasoning</p>
                        <div className="mt-2">
                          <RecruiterNarrativeContent
                            text={recommendationReasoning}
                            paragraphClassName="text-[12px] font-medium leading-6 text-secondary"
                            bulletClassName="text-[12px] font-medium leading-6 text-secondary"
                          />
                        </div>
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
                <p className="text-[11px] font-black text-amber-950">Hiring red flag</p>
                <p className="mt-1.5 text-[11px] font-semibold leading-5 text-amber-900/80">{hiringRedFlag}</p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={<CircleGauge className="h-4 w-4 text-brand-hover" />} title="Score overview" subtitle="Interview performance and integrity findings." />
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            <CalculationStep
              label="Performance score"
              value={evaluation.raw_overall_score}
              helper="Combined interview performance"
              onClick={() => onNavigate('questions')}
            />
            <span className="hidden text-xl font-black text-slate-300 md:block">−</span>
            <CalculationStep
              label="Integrity adjustment"
              value={evaluation.violation_penalty}
              helper="Adjustment for confirmed concerns"
              penalty
              onClick={() => onNavigate('integrity')}
            />
            <span className="hidden text-xl font-black text-slate-300 md:block">=</span>
            <CalculationStep
              label="Final score"
              value={evaluation.overall_score}
              helper="Overall interview result"
              final
              onClick={() => onNavigate('questions')}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigate('questions')}
          className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md"
        >
          <div className="grid place-items-center">
            <ScoreRing score={evaluation.overall_score} size={164} />
            <p className="mt-2 text-[11px] font-black text-slate-900">{recommendation.label} recommendation</p>
            <p className="mt-1 text-center text-[10px] font-semibold text-slate-400">
              {scoreLabel(evaluation.overall_score)} overall performance
            </p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniStat label="Rank" value={evaluation.rank_in_assessment ? `#${evaluation.rank_in_assessment}` : '—'} />
            <MiniStat label="Percentile" value={evaluation.percentile_in_assessment === null ? '—' : `${evaluation.percentile_in_assessment}%`} />
            <MiniStat label="Cohort" value={evaluation.total_candidates_evaluated ? String(evaluation.total_candidates_evaluated) : '—'} />
          </div>
          <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-brand-hover">
            Review scoring evidence
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('dimensions')}
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md"
        >
          <div className="px-1">
            <p className="text-[11px] font-black text-slate-900">Competency radar</p>
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
          <p className="mt-1 inline-flex items-center gap-1 px-1 text-[10px] font-black text-brand-hover">
            Explore dimensions
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </button>
      </div>
    </div>

    {/* Score metrics */}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Technical', score: evaluation.overall_technical_skill_score, icon: <BrainCircuit className="h-4 w-4" />, tab: 'skills' as const },
        { label: 'Behaviour & culture', score: evaluation.behavioural_cultural_score, icon: <Users className="h-4 w-4" />, tab: 'dimensions' as const },
        { label: 'Communication', score: evaluation.communication_score, icon: <MessageSquareText className="h-4 w-4" />, tab: 'dimensions' as const },
        { label: 'Self introduction', score: evaluation.intro_section_score, icon: <UserRound className="h-4 w-4" />, tab: 'dimensions' as const },
      ].map((m) => (
        <button
          key={m.label}
          type="button"
          onClick={() => onNavigate(m.tab)}
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">{m.label}</p>
              <p className={`mt-1.5 font-display text-2xl font-black ${scoreTextClass(m.score)}`}>
                {m.score.toFixed(1)}<span className="ml-1 text-[10px] text-slate-400">/10</span>
              </p>
              <p className="mt-1 text-[10px] font-bold text-slate-500">{scoreLabel(m.score)}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ${scoreTextClass(m.score)}`}>{m.icon}</div>
          </div>
          <div className="mt-3"><ScoreBar score={m.score} compact /></div>
          <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-brand-hover">
            Open section
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </button>
      ))}
    </div>
  </div>
);

/* ── Skills Tab ─────────────────────────────────────────────────────────── */
const SkillsTab: React.FC<{
  evaluation: InterviewEvaluationResponse;
  skills: Array<[string, EvaluationSkillBreakdown]>;
  onDetailModal: (m: { title: string; content: React.ReactNode }) => void;
  onNavigate: (tab: ReportTab) => void;
}> = ({ evaluation, skills, onDetailModal, onNavigate }) => (
  <div className="space-y-4 animate-fadeIn">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle icon={<BarChart3 className="h-4 w-4 text-brand-hover" />} title="Technical skill portfolio" subtitle="Performance across assessed technical areas." />
        <button
          type="button"
          onClick={() => onNavigate('questions')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-default bg-brand-soft px-3 py-2 text-[10px] font-black text-brand-hover transition-colors hover:bg-[#EAD7BE]"
        >
          Review all answers <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-[minmax(120px,0.65fr)_minmax(0,1.35fr)_68px] gap-3 text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
          <span>Skill</span>
          <span className="flex justify-between px-1"><span>0</span><span>2.5</span><span>5</span><span>7.5</span><span>10</span></span>
          <span className="text-right">Score</span>
        </div>
        {skills.map(([skill, details]) => (
          <button
            key={skill}
            id={skillElementId(skill)}
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
                    <p className="text-[11px] font-medium leading-6 text-slate-600">{evaluation.skill_summary?.[skill] || 'No summary generated.'}</p>
                    <div>
                      <p className="mb-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Evidence</p>
                      <ul className="space-y-2">
                        {(evaluation.skill_evidence?.[skill] || []).map((item, i) => (
                          <li key={i} className="border-l-2 border-brand-accent bg-slate-50 px-3 py-2 text-[10px] font-medium leading-5 text-slate-600">{item}</li>
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
              <p className="truncate text-[11px] font-black text-slate-800 group-hover:text-brand-hover transition-colors" title={skill}>{skill}</p>
              <p className="mt-0.5 text-[10px] font-bold text-slate-400">Priority {details.priority_score.toFixed(1)}</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex justify-between px-[25%]">
                <span className="border-l border-white/80" /><span className="border-l border-white/80" /><span className="border-l border-white/80" />
              </div>
              <ScoreBar score={details.score} />
            </div>
            <div className="text-right">
              <p className={`text-[13px] font-black ${scoreTextClass(details.score)}`}>{details.score.toFixed(1)}</p>
            </div>
          </button>
        ))}
        {skills.length === 0 && <p className="text-[10px] font-semibold text-slate-400">No technical skill scores generated.</p>}
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <SignalPanel
        title="Demonstrated strengths"
        subtitle="Technical skills scoring 7.5 or above."
        items={evaluation.strengths}
        icon={<ShieldCheck className="h-4 w-4" />}
        tone="emerald"
        onSelect={(skill) =>
          document.getElementById(skillElementId(skill))?.click()
        }
      />
      <SignalPanel
        title="Technical concerns"
        subtitle="Low-scoring or high-priority risk skills."
        items={evaluation.concerns}
        icon={<ShieldAlert className="h-4 w-4" />}
        tone="rose"
        onSelect={(skill) =>
          document.getElementById(skillElementId(skill))?.click()
        }
      />
    </div>
  </div>
);

/* ── Dimensions Tab ─────────────────────────────────────────────────────── */
const QuestionsTab: React.FC<{
  questions: QuestionEvaluationBreakdown[];
}> = ({ questions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    questions[0]?.question_id ?? null,
  );
  const answeredCount = questions.filter((item) => item.answered).length;
  const averageScore = questions.length
    ? questions.reduce((total, item) => total + item.score, 0) / questions.length
    : 0;
  const sections = useMemo(
    () =>
      Array.from(
        new Set(
          questions.map((question) => question.skill || formatLabel(question.section)),
        ),
      ),
    [questions],
  );
  const filteredQuestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return questions.filter((question) => {
      const section = question.skill || formatLabel(question.section);
      const matchesSection = sectionFilter === 'all' || section === sectionFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          question.question_text,
          question.answer_summary,
          question.skill,
          question.section,
          question.difficulty,
          ...question.evidence,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesSection && matchesQuery;
    });
  }, [questions, searchQuery, sectionFilter]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle
          icon={<ListChecks className="h-4 w-4 text-brand-hover" />}
          title="Question-by-question review"
          subtitle="Every answer with its score, relevance, confidence, and supporting evidence."
        />
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <QuestionMetric label="Questions assessed" value={String(questions.length)} />
          <QuestionMetric
            label="Substantive answers"
            value={`${answeredCount}/${questions.length}`}
          />
          <QuestionMetric
            label="Average question score"
            value={questions.length ? `${averageScore.toFixed(1)}/10` : '—'}
          />
        </div>

        {questions.length > 0 && (
          <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search questions, answers, skills, or evidence"
                aria-label="Search question evaluations"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[11px] font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-accent focus:ring-4 focus:ring-brand-soft"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear question search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Filter questions by skill">
              {['all', ...sections].map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setSectionFilter(section)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-black transition-colors ${
                    sectionFilter === section
                      ? 'border-brand-charcoal bg-brand-charcoal text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-brand-accent hover:text-brand-hover'
                  }`}
                >
                  {section === 'all' ? 'All sections' : section}
                </button>
              ))}
            </div>
          </div>
        )}

        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <ListChecks className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-[11px] font-black text-slate-600">
              No structured question evaluations are available.
            </p>
            <p className="mt-1 text-[10px] font-semibold text-slate-400">
              Older reports will show question detail after re-evaluation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400">
              Showing {filteredQuestions.length} of {questions.length} questions
            </p>
            {filteredQuestions.map((question) => (
              <QuestionEvaluationCard
                key={question.question_id}
                question={question}
                index={questions.findIndex(
                  (item) => item.question_id === question.question_id,
                )}
                expanded={expandedQuestionId === question.question_id}
                onToggle={() =>
                  setExpandedQuestionId((current) =>
                    current === question.question_id ? null : question.question_id,
                  )
                }
              />
            ))}
            {filteredQuestions.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Search className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-[11px] font-black text-slate-600">
                  No questions match these filters
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSectionFilter('all');
                  }}
                  className="mt-3 text-[10px] font-black text-brand-hover hover:text-brand-charcoal"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const QuestionMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
    <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
      {label}
    </p>
    <p className="mt-1 font-display text-lg font-black text-slate-900">{value}</p>
  </div>
);

const QuestionEvaluationCard: React.FC<{
  question: QuestionEvaluationBreakdown;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}> = ({ question, index, expanded, onToggle }) => (
  <article
    className={`overflow-hidden rounded-xl border bg-white transition-all ${
      expanded ? 'border-[#D7C2A8] shadow-sm' : 'border-slate-200 hover:border-brand-accent'
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full flex-col gap-4 p-4 text-left lg:flex-row lg:items-start"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-brand-charcoal px-1.5 text-[10px] font-black text-white">
            Q{index + 1}
          </span>
          <span className="rounded-md bg-brand-soft px-2 py-1 text-[8px] font-black uppercase tracking-wide text-brand-hover">
            {question.skill || formatLabel(question.section)}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-slate-500">
            {formatLabel(question.difficulty)}
          </span>
          <span
            className={`rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-wide ${
              question.answered
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {question.answered ? 'Answered' : 'No answer'}
          </span>
        </div>
        <h3 className="mt-3 text-[13px] font-black leading-6 text-slate-950">
          {question.question_text}
        </h3>
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3.5 py-3">
          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
            Answer assessment
          </p>
          <p className="mt-1.5 text-[11px] font-medium leading-5 text-slate-600">
            {question.answer_summary}
          </p>
        </div>
      </div>

      <div className="relative w-full shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:w-44">
        <ChevronDown
          className={`absolute right-2 top-2 h-3.5 w-3.5 text-slate-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
        <div className="flex items-end justify-between">
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
            Score
          </span>
          <span className={`font-display text-xl font-black ${scoreTextClass(question.score)}`}>
            {question.score.toFixed(1)}
            <span className="ml-0.5 text-[10px] text-slate-400">/10</span>
          </span>
        </div>
        <div className="mt-2">
          <ScoreBar score={question.score} compact />
        </div>
        <dl className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-[10px]">
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-slate-400">Relevance</dt>
            <dd className="text-right font-black text-slate-600">
              {formatLabel(question.relevance_class)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-slate-400">Confidence</dt>
            <dd className="font-black text-slate-600">
              {Math.round(question.confidence * 100)}%
            </dd>
          </div>
        </dl>
      </div>
    </button>

    {expanded && <div className="border-t border-slate-100 bg-slate-50/45 px-4 py-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
        Evidence
      </p>
      <ul className="mt-2 grid gap-2 lg:grid-cols-2">
        {question.evidence.map((item, evidenceIndex) => (
          <li
            key={`${question.question_id}-${evidenceIndex}`}
            className="border-l-2 border-brand-accent pl-2.5 text-[10px] font-medium leading-5 text-slate-600"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>}
  </article>
);

const DimensionsTab: React.FC<{
  evaluation: InterviewEvaluationResponse;
  onDetailModal: (m: { title: string; content: React.ReactNode }) => void;
}> = ({ evaluation, onDetailModal }) => (
  <div className="space-y-3 animate-fadeIn">
    <div className="grid items-start gap-3 xl:grid-cols-3">
      {[
        { title: 'Self introduction', score: evaluation.intro_section_score, summary: evaluation.intro_section_summary, evidence: evaluation.intro_section_evidence, icon: <UserRound className="h-4 w-4" /> },
        { title: 'Behaviour & culture', score: evaluation.behavioural_cultural_score, summary: evaluation.behavioural_cultural_summary, evidence: evaluation.behavioural_cultural_evidence, icon: <Users className="h-4 w-4" /> },
        { title: 'Communication', score: evaluation.communication_score, summary: evaluation.communication_summary, evidence: evaluation.communication_evidence, icon: <MessageSquareText className="h-4 w-4" /> },
      ].map((dim) => (
        <button
          key={dim.title}
          type="button"
          onClick={() =>
            onDetailModal({
              title: dim.title,
              content: (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black text-slate-700">Section score</p>
                    <p className={`text-2xl font-black ${scoreTextClass(dim.score)}`}>
                      {dim.score.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="mt-3"><ScoreBar score={dim.score} /></div>
                  <p className="mt-5 text-[13px] font-medium leading-7 text-slate-600">
                    {dim.summary}
                  </p>
                  <EvidenceList
                    evidence={dim.evidence}
                    empty="No direct evidence was recorded."
                  />
                </div>
              ),
            })
          }
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 ${scoreTextClass(dim.score)}`}>{dim.icon}</span>
              <h3 className="text-[13px] font-black text-slate-950">{dim.title}</h3>
            </div>
            <span className={`text-lg font-black ${scoreTextClass(dim.score)}`}>{dim.score.toFixed(1)}</span>
          </div>
          <div className="mt-2"><ScoreBar score={dim.score} compact /></div>
          <p className="mt-2.5 text-[11px] font-medium leading-5 text-slate-600 line-clamp-4">{dim.summary}</p>
          <EvidenceList evidence={dim.evidence} empty="No direct evidence was recorded." compact maxItems={2} />
          <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-brand-hover">
            Open full evidence
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </button>
      ))}
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle icon={<MessageSquareText className="h-4 w-4 text-brand-hover" />} title="Communication by interview section" subtitle="Clarity, structure, tone, and engagement assessed across each phase." />
      <div className="mt-3 grid gap-2.5 lg:grid-cols-3">
        {Object.entries(evaluation.section_communication_scores ?? {}).map(([section, details]) => (
          <SectionCommunicationCard key={section} section={section} details={details} />
        ))}
      </div>
    </div>
  </div>
);

/* ── Integrity Tab ──────────────────────────────────────────────────────── */
const IntegrityTab: React.FC<{
  evaluation: InterviewEvaluationResponse;
  onNavigate: (tab: ReportTab) => void;
}> = ({ evaluation, onNavigate }) => {
  const summary = evaluation.violation_summary;
  if (!summary) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-fadeIn">
        <SectionTitle icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} title="Integrity and conduct" subtitle="Interview integrity summary." />
        <p className="text-[11px] font-semibold text-slate-500">No violation summary was generated.</p>
      </div>
    );
  }

  const hasCritical = summary.severity_counts.critical > 0;
  return (
    <div className={`animate-fadeIn rounded-2xl border p-5 shadow-sm ${summary.has_violation ? 'border-amber-200 bg-amber-50/35' : 'border-emerald-200 bg-emerald-50/30'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          icon={summary.has_violation ? <AlertOctagon className="h-4 w-4 text-amber-600" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
          title="Integrity and conduct"
          subtitle="Interview integrity concerns and supporting evidence."
        />
        <button
          type="button"
          onClick={() => onNavigate('transcript')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 shadow-sm transition-colors hover:border-brand-accent hover:text-brand-hover"
        >
          Review transcript context <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SeverityTile label="Confirmed" value={summary.validated_violation_count} tone={summary.has_violation ? 'amber' : 'emerald'} />
        <SeverityTile label="Low" value={summary.severity_counts.low} tone="slate" />
        <SeverityTile label="Medium" value={summary.severity_counts.medium} tone="amber" />
        <SeverityTile label="High" value={summary.severity_counts.high} tone="rose" />
        <SeverityTile label="Critical" value={summary.severity_counts.critical} tone={hasCritical ? 'rose' : 'slate'} />
      </div>
      <p className="mt-4 text-[11px] font-medium leading-6 text-slate-600">{summary.summary}</p>
      {summary.hard_gate_reasons.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <p className="text-[11px] font-black text-rose-900">Hiring red flags</p>
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
  transcript: TranscriptTurn[];
  totalElapsed: number;
  isLoading: boolean;
  isError: boolean;
  onDownload: () => void;
  onClose?: () => void;
  titleId?: string;
}> = ({ transcript, totalElapsed, isLoading, isError, onDownload, onClose, titleId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState<
    'all' | 'interviewer' | 'candidate'
  >('all');
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTranscript = useMemo(
    () =>
      transcript.filter((turn) => {
        const interviewer = isInterviewerTurn(turn);
        const matchesSpeaker =
          speakerFilter === 'all' ||
          (speakerFilter === 'interviewer' && interviewer) ||
          (speakerFilter === 'candidate' && !interviewer);
        const matchesQuery =
          !normalizedQuery ||
          [
            turn.text,
            turn.section,
            turn.skill,
            turn.difficulty,
            turn.question_type,
            turn.response_type,
            turn.tone,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
        return matchesSpeaker && matchesQuery;
      }),
    [normalizedQuery, speakerFilter, transcript],
  );
  const transcriptSections = useMemo(() => {
    const firstTurnBySection = new Map<string, number>();
    transcript.forEach((turn) => {
      if (turn.section && !firstTurnBySection.has(turn.section)) {
        firstTurnBySection.set(turn.section, turn.turn_number);
      }
    });
    return Array.from(firstTurnBySection.entries());
  }, [transcript]);
  const floatingCloseButton = onClose ? (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700"
      aria-label="Close transcript"
    >
      <X className="h-4 w-4" />
    </button>
  ) : null;

  if (isLoading) {
    return (
      <div className="relative grid h-full min-h-[360px] place-items-center rounded-2xl border border-slate-200 bg-white">
        {floatingCloseButton}
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-accent" />
          <p className="mt-3 text-[11px] font-bold text-slate-500">Loading full transcript…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="relative grid h-full min-h-[360px] place-items-center rounded-2xl border border-rose-200 bg-rose-50/40">
        {floatingCloseButton}
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
          <h3 className="mt-3 text-[13px] font-black text-rose-900">Transcript could not be loaded</h3>
          <p className="mt-1 text-[11px] font-medium text-rose-700/70">
            Refresh the report to retry the transcript request.
          </p>
        </div>
      </div>
    );
  }

  if (transcript.length === 0) {
    return (
      <div className="relative flex h-full min-h-[360px] flex-col items-center justify-center animate-fadeIn rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center shadow-sm">
        {floatingCloseButton}
        <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-[13px] font-black text-slate-700">No transcript available</h3>
        <p className="mt-1 text-[11px] font-medium text-slate-400">
          The interview transcript will appear here once the session is completed.
        </p>
      </div>
    );
  }

  const elapsedMins = Math.round(totalElapsed / 60);

  return (
    <div className="h-full min-h-0 animate-fadeIn">
      <div className="ibot-panel flex h-full min-h-0 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white via-white to-brand-soft/70 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-default bg-brand-soft text-brand-hover">
              <MessageSquareText className="h-4.5 w-4.5" />
            </div>
            <div>
              <p id={titleId} className="text-[16px] font-black text-slate-950">Interview transcript</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                {transcript.length} turns · {elapsedMins > 0 ? `${elapsedMins} min` : 'duration unavailable'} · continuous transcript
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition-colors hover:border-brand-accent hover:text-brand-hover"
            >
              <FileDown className="h-3.5 w-3.5" />
              Download
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close transcript"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        <div className="shrink-0 space-y-2 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search the full transcript"
                aria-label="Search interview transcript"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-xs font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-accent focus:ring-4 focus:ring-brand-soft"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear transcript search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              {(['all', 'interviewer', 'candidate'] as const).map((speaker) => (
                <button
                  key={speaker}
                  type="button"
                  onClick={() => setSpeakerFilter(speaker)}
                  className={`rounded-md px-3 py-2 text-[11px] font-black transition-colors ${
                    speakerFilter === speaker
                      ? 'bg-brand-charcoal text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {formatLabel(speaker)}
                </button>
              ))}
            </div>
          </div>
          {transcriptSections.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Jump to
              </span>
              {transcriptSections.map(([section, turnNumber]) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSpeakerFilter('all');
                    window.requestAnimationFrame(() =>
                      document
                        .getElementById(`transcript-turn-${turnNumber}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                    );
                  }}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 transition-colors hover:border-brand-accent hover:text-brand-hover"
                >
                  {formatLabel(section)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ibot-transcript-scroll min-h-0 flex-1 overflow-y-auto bg-slate-50/45 px-4 py-3 sm:px-5">
          <div className="mx-auto w-full max-w-5xl space-y-2.5">
          <p className="text-[10px] font-bold text-slate-500">
            Showing {filteredTranscript.length} of {transcript.length} turns
          </p>
          {filteredTranscript.map((turn) => {
            const isBot = isInterviewerTurn(turn);
            const time = transcriptTurnTime(turn);
            return (
              <div
                id={`transcript-turn-${turn.turn_number}`}
                key={turn.turn_id || turn.turn_number}
                className={`scroll-mt-20 flex gap-3 rounded-xl border border-l-4 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
                  isBot
                    ? 'border-slate-200 border-l-slate-500 sm:mr-8'
                    : 'border-[#D7C2A8] border-l-brand-accent sm:ml-8'
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-sm ${isBot ? 'bg-brand-charcoal text-white' : 'bg-brand-accent text-white'}`}>
                  {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-xs font-black text-slate-700">
                      {isBot ? 'Interviewer' : 'Candidate'}
                      {time && <span className="ml-2 font-semibold text-slate-500">{time}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {turn.skill && (
                        <span className="rounded-md bg-brand-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-brand-hover">
                          {turn.skill}
                        </span>
                      )}
                      {turn.difficulty && (
                        <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                          {formatLabel(turn.difficulty)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-normal leading-6 text-slate-800">
                    {turn.text || '[No transcribed text]'}
                  </p>
                  <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] font-bold text-slate-500">
                    {[
                      `Turn ${turn.turn_number}`,
                      turn.section ? formatLabel(turn.section) : null,
                      turn.question_type
                        ? `Question: ${formatLabel(turn.question_type)}`
                        : null,
                      turn.response_type
                        ? `Response: ${formatLabel(turn.response_type)}`
                        : null,
                      turn.tone ? `Tone: ${formatLabel(turn.tone)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
            );
          })}
          {filteredTranscript.length === 0 && (
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <div className="text-center">
                <Search className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-[11px] font-black text-slate-600">
                  No transcript turns match
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSpeakerFilter('all');
                  }}
                  className="mt-2 text-[10px] font-black text-brand-hover"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
          <div className="h-12" aria-hidden="true" />
          </div>
        </div>
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
    className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left hover:border-brand-accent hover:shadow-md transition-all group"
  >
    <SectionTitle icon={icon} title={title} subtitle={subtitle} />
    <p className="text-[13px] font-medium leading-7 text-slate-600 line-clamp-3">{preview}</p>
    <p className="mt-3 text-[10px] font-black text-brand-hover group-hover:text-brand-charcoal">Click to read full summary →</p>
  </button>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-[13px] font-black text-slate-950">{title}</h2>
    </div>
    <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-400">{subtitle}</p>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 text-center">
    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <p className="mt-1 text-[13px] font-black text-slate-900">{value}</p>
  </div>
);

const CalculationStep: React.FC<{
  label: string;
  value: number;
  helper: string;
  penalty?: boolean;
  final?: boolean;
  onClick: () => void;
}> = ({ label, value, helper, penalty = false, final = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${final ? 'border-emerald-200 bg-emerald-50/70' : penalty && value > 0 ? 'border-rose-200 bg-rose-50/70' : 'border-slate-200 bg-slate-50/70'}`}
  >
    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p>
    <p className={`mt-1.5 font-display text-2xl font-black ${penalty && value > 0 ? 'text-rose-700' : final ? 'text-emerald-700' : 'text-slate-900'}`}>{value.toFixed(2)}</p>
    <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{helper}</p>
    <p className="mt-2 inline-flex items-center gap-1 text-[8px] font-black text-slate-500">
      Open details <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
    </p>
  </button>
);

const SignalPanel: React.FC<{
  title: string;
  subtitle: string;
  items: string[];
  icon: React.ReactNode;
  tone: 'emerald' | 'rose';
  onSelect?: (item: string) => void;
}> = ({ title, subtitle, items, icon, tone, onSelect }) => {
  const style = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-rose-200 bg-rose-50/60 text-rose-800';
  return (
    <div className={`rounded-2xl border p-5 ${style}`}>
      <div className="flex items-center gap-2">{icon}<p className="text-[13px] font-black">{title}</p></div>
      <p className="mt-1 text-[10px] font-semibold opacity-70">{subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          onSelect ? (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className="rounded-full border border-current/10 bg-white/75 px-3 py-1.5 text-[10px] font-black transition-transform hover:-translate-y-0.5 hover:bg-white"
              title={`Open ${item} details`}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="rounded-full border border-current/10 bg-white/75 px-3 py-1.5 text-[10px] font-black">{item}</span>
          )
        ))}
        {items.length === 0 && <p className="text-[11px] font-semibold opacity-65">None identified.</p>}
      </div>
    </div>
  );
};

const SectionCommunicationCard: React.FC<{ section: string; details: SectionCommunicationBreakdown }> = ({ section, details }) => (
  <details className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 open:bg-white open:shadow-sm">
    <summary className="cursor-pointer list-none">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-black text-slate-900">{formatLabel(section)}</h3>
        <span className="flex items-center gap-2">
          <span className={`text-[13px] font-black ${scoreTextClass(details.score)}`}>{details.score.toFixed(1)}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-180" />
        </span>
      </div>
      <div className="mt-2"><ScoreBar score={details.score} compact /></div>
      <p className="mt-2 text-[8px] font-black text-brand-hover">Click to review evidence</p>
    </summary>
    <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] font-medium leading-5 text-slate-600">{details.summary}</p>
    <EvidenceList evidence={details.evidence} empty="No section evidence recorded." compact />
  </details>
);

const EvidenceList: React.FC<{ evidence: string[]; empty: string; compact?: boolean; maxItems?: number }> = ({ evidence, empty, compact = false, maxItems }) => {
  const visibleEvidence = maxItems ? evidence.slice(0, maxItems) : evidence;
  const hiddenCount = maxItems ? Math.max(evidence.length - maxItems, 0) : 0;

  return (
  <div className={compact ? 'mt-2' : 'mt-3'}>
    <p className="mb-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Evidence</p>
    <ul className="space-y-1.5">
      {visibleEvidence.map((item, i) => (
        <li key={i} className="border-l-2 border-brand-accent bg-white px-2.5 py-1.5 text-[10px] font-medium leading-5 text-slate-600 shadow-sm">{item}</li>
      ))}
      {hiddenCount > 0 && (
        <li className="text-[10px] font-semibold text-slate-400">+{hiddenCount} more in full view</li>
      )}
      {evidence.length === 0 && <li className="text-[10px] font-semibold text-slate-400">{empty}</li>}
    </ul>
  </div>
  );
};

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
  <div className="h-full min-h-0 overflow-hidden">
    <div className="mx-auto flex h-full min-h-0 max-w-[1400px] flex-col gap-3">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-40 shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-accent" />
            <p className="mt-3 text-[11px] font-bold text-slate-400">Building detailed report…</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
