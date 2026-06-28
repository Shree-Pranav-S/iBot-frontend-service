import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronRight,
  CircleGauge,
  FileCheck2,
  Loader2,
  Mail,
  MessageSquareText,
  Printer,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Users,
} from 'lucide-react';
import { useCandidateEvaluation, useUpdateCandidateDecision } from '../../../hooks/queries';
import { useToast } from '../../../hooks/useToast';
import type {
  EvaluationSkillBreakdown,
  InterviewEvaluationResponse,
  SectionCommunicationBreakdown,
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

export const EvaluationReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { data: evaluation, isLoading, isError, isFetching, refetch } =
    useCandidateEvaluation(id || null);
  const decisionMutation = useUpdateCandidateDecision();
  const { modal, requestDecision, closeDecision } = useEvaluationDecision();

  const skills = useMemo(() => {
    if (!evaluation) return [];
    return Object.entries(evaluation.skill_scores ?? {}).sort(([, left], [, right]) => {
      const priorityDifference = right.priority_score - left.priority_score;
      return priorityDifference || right.score - left.score;
    });
  }, [evaluation]);

  const saveDecision = async (feedback?: string) => {
    try {
      await decisionMutation.mutateAsync({
        candidateId: modal.candidateId,
        decision: modal.decision,
        feedback,
      });
      success(
        'Decision saved',
        `${modal.candidateName} has been ${modal.decision === 'APPROVED' ? 'approved' : 'rejected'}.`,
      );
      closeDecision();
    } catch (error: unknown) {
      toastError(
        'Unable to save decision',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  if (isLoading) return <ReportLoadingState />;

  if (isError || !evaluation) {
    return (
      <div className="flex h-full min-h-[440px] items-center justify-center">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-9 text-center shadow-xl shadow-slate-200/60">
          <FileCheck2 className="mx-auto h-11 w-11 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-950">Report is not available yet</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            The holistic evaluation may still be processing. You can return to evaluations or retry this report.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/evaluations')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"
            >
              Back to evaluations
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const decision = decisionMeta(evaluation.recruiter_decision);
  const hiringRedFlag = recruiterFacingRedFlag(
    evaluation.recommendation_override_reason,
  );
  const recommendationReasoning = evaluation.recommendation_reasoning
    .replace(/\s*Deterministic override:.*$/i, '')
    .trim();
  const candidateName = evaluation.candidate_name || 'Candidate';

  return (
    <>
      <div className="ibot-scrollbar h-full overflow-y-auto pr-1 animate-fadeIn">
        <div className="mx-auto max-w-[1500px] space-y-4 pb-8 print:max-w-none">
          <header className="print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/evaluations')}
                className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition-colors hover:text-emerald-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Evaluation workspace
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
                  <Printer className="h-3.5 w-3.5" />
                  Print report
                </button>
              </div>
            </div>
          </header>

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
                          label={`${evaluation.violation_summary.validated_violation_count} confirmed integrity concern${evaluation.violation_summary.validated_violation_count === 1 ? '' : 's'}`}
                          className="border-rose-200 bg-rose-50 text-rose-800"
                          dot="bg-rose-500"
                        />
                      )}
                    </div>
                    <h1 className="mt-3 font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      {candidateName}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-400" />
                        {evaluation.role_name || 'Role not available'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-slate-400" />
                        {evaluation.assessment_title || 'Assessment'}
                      </span>
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
                    onClick={() =>
                      requestDecision(
                        evaluation.candidate_assessment_id,
                        candidateName,
                        evaluation.recruiter_decision || 'PENDING',
                        'APPROVED',
                      )
                    }
                    disabled={evaluation.recruiter_decision === 'APPROVED'}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Approve candidate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestDecision(
                        evaluation.candidate_assessment_id,
                        candidateName,
                        evaluation.recruiter_decision || 'PENDING',
                        'REJECTED',
                      )
                    }
                    disabled={evaluation.recruiter_decision === 'REJECTED'}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 transition-all hover:bg-rose-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>

            <nav className="flex gap-1 overflow-x-auto border-t border-slate-200 bg-slate-50/80 px-3 py-2 print:hidden">
              {[
                ['overview', 'Overview'],
                ['skills', 'Technical skills'],
                ['dimensions', 'Interview dimensions'],
                ['integrity', 'Integrity'],
              ].map(([target, label]) => (
                <a
                  key={target}
                  href={`#${target}`}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-black text-slate-500 transition-colors hover:bg-white hover:text-emerald-700"
                >
                  {label}
                </a>
              ))}
            </nav>
          </section>

          <section id="overview" className="scroll-mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
                  title="Executive summary"
                  subtitle="Holistic evidence-based assessment across the complete interview."
                />
                <p className="text-sm font-medium leading-7 text-slate-600">
                  {evaluation.overall_summary}
                </p>
                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <Scale className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div>
                      <p className="text-xs font-black text-indigo-950">Recommendation reasoning</p>
                      <p className="mt-1.5 text-xs font-medium leading-6 text-indigo-900/80">
                        {recommendationReasoning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {hiringRedFlag && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-black text-amber-950">Hiring red flag</p>
                      <p className="mt-1.5 text-xs font-semibold leading-5 text-amber-900/80">
                        {hiringRedFlag}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ScoreMetric label="Technical" score={evaluation.overall_technical_skill_score} icon={<BrainCircuit className="h-4 w-4" />} />
            <ScoreMetric label="Behaviour & culture" score={evaluation.behavioural_cultural_score} icon={<Users className="h-4 w-4" />} />
            <ScoreMetric label="Communication" score={evaluation.communication_score} icon={<MessageSquareText className="h-4 w-4" />} />
            <ScoreMetric label="Self introduction" score={evaluation.intro_section_score} icon={<UserRound className="h-4 w-4" />} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle
              icon={<CircleGauge className="h-4 w-4 text-indigo-600" />}
              title="Score overview"
              subtitle="Interview performance and integrity findings reflected in the final result."
            />
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              <CalculationStep
                label="Performance score"
                value={evaluation.raw_overall_score}
                helper="Combined interview performance"
              />
              <span className="hidden text-xl font-black text-slate-300 md:block">−</span>
              <CalculationStep
                label="Integrity adjustment"
                value={evaluation.violation_penalty}
                helper="Adjustment for confirmed concerns"
                penalty
              />
              <span className="hidden text-xl font-black text-slate-300 md:block">=</span>
              <CalculationStep
                label="Final score"
                value={evaluation.overall_score}
                helper="Overall interview result"
                final
              />
            </div>
          </section>

          <section id="skills" className="scroll-mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={<BarChart3 className="h-4 w-4 text-emerald-600" />}
                title="Technical skill portfolio"
                subtitle="Candidate performance across the technical areas assessed during the interview."
              />
              <SkillPortfolioGraph skills={skills} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SignalPanel
                title="Demonstrated strengths"
                subtitle="Technical skills scoring 7.5 or above."
                items={evaluation.strengths}
                icon={<ThumbsUp className="h-4 w-4" />}
                tone="emerald"
              />
              <SignalPanel
                title="Technical concerns"
                subtitle="Low-scoring or risky high-priority skills."
                items={evaluation.concerns}
                icon={<ShieldAlert className="h-4 w-4" />}
                tone="rose"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={<FileCheck2 className="h-4 w-4 text-cyan-600" />}
                title="Skill evidence ledger"
                subtitle="Expand each skill to review its summary and supporting interview evidence."
              />
              <div className="space-y-3">
                {skills.map(([skill, details], index) => (
                  <SkillEvidenceCard
                    key={skill}
                    skill={skill}
                    details={details}
                    summary={evaluation.skill_summary?.[skill] || 'No summary was generated.'}
                    evidence={evaluation.skill_evidence?.[skill] || []}
                    initiallyOpen={index === 0}
                  />
                ))}
                {skills.length === 0 && <EmptyEvidence label="No technical skills were evaluated." />}
              </div>
            </div>
          </section>

          <section id="dimensions" className="scroll-mt-4 space-y-4">
            <div className="grid gap-4 xl:grid-cols-3">
              <NarrativeCard
                title="Self introduction"
                score={evaluation.intro_section_score}
                summary={evaluation.intro_section_summary}
                evidence={evaluation.intro_section_evidence}
                icon={<UserRound className="h-4 w-4" />}
              />
              <NarrativeCard
                title="Behaviour & culture"
                score={evaluation.behavioural_cultural_score}
                summary={evaluation.behavioural_cultural_summary}
                evidence={evaluation.behavioural_cultural_evidence}
                icon={<Users className="h-4 w-4" />}
              />
              <NarrativeCard
                title="Communication"
                score={evaluation.communication_score}
                summary={evaluation.communication_summary}
                evidence={evaluation.communication_evidence}
                icon={<MessageSquareText className="h-4 w-4" />}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={<MessageSquareText className="h-4 w-4 text-indigo-600" />}
                title="Communication by interview section"
                subtitle="Clarity, structure, tone, and engagement assessed independently across each phase."
              />
              <div className="grid gap-3 lg:grid-cols-3">
                {Object.entries(evaluation.section_communication_scores ?? {}).map(([section, details]) => (
                  <SectionCommunicationCard key={section} section={section} details={details} />
                ))}
              </div>
            </div>
          </section>

          <section id="integrity" className="scroll-mt-4">
            <IntegrityPanel evaluation={evaluation} />
          </section>

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
                  onClick={() =>
                    requestDecision(
                      evaluation.candidate_assessment_id,
                      candidateName,
                      evaluation.recruiter_decision || 'PENDING',
                      'APPROVED',
                    )
                  }
                  disabled={evaluation.recruiter_decision === 'APPROVED'}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestDecision(
                      evaluation.candidate_assessment_id,
                      candidateName,
                      evaluation.recruiter_decision || 'PENDING',
                      'REJECTED',
                    )
                  }
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

      <DecisionModal
        key={`${modal.candidateId}:${modal.decision}:${modal.open}`}
        open={modal.open}
        candidateName={modal.candidateName}
        currentDecision={modal.currentDecision}
        decision={modal.decision}
        loading={decisionMutation.isPending}
        onClose={closeDecision}
        onConfirm={saveDecision}
      />
    </>
  );
};

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-black text-slate-950">{title}</h2>
    </div>
    <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-400">{subtitle}</p>
  </div>
);

const recruiterFacingRedFlag = (reason: string | null): string => {
  const value = reason?.trim();
  if (!value) return '';
  return value
    .replace(/^Recommendation gates? applied:\s*/i, '')
    .replace(/^Hard gate:\s*/i, '')
    .replace(
      /Deterministic score thresholds changed the model recommendation/i,
      'The overall interview result did not meet the hiring threshold',
    );
};

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 text-center">
    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
  </div>
);

const ScoreMetric: React.FC<{ label: string; score: number; icon: React.ReactNode }> = ({
  label,
  score,
  icon,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p>
        <p className={`mt-1.5 font-display text-2xl font-black ${scoreTextClass(score)}`}>
          {score.toFixed(1)}
          <span className="ml-1 text-[10px] text-slate-400">/10</span>
        </p>
        <p className="mt-1 text-[10px] font-bold text-slate-500">{scoreLabel(score)}</p>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ${scoreTextClass(score)}`}>
        {icon}
      </div>
    </div>
    <div className="mt-3"><ScoreBar score={score} compact /></div>
  </div>
);

const CalculationStep: React.FC<{
  label: string;
  value: number;
  helper: string;
  penalty?: boolean;
  final?: boolean;
}> = ({ label, value, helper, penalty = false, final = false }) => (
  <div
    className={`rounded-xl border p-4 ${
      final
        ? 'border-emerald-200 bg-emerald-50/70'
        : penalty && value > 0
          ? 'border-rose-200 bg-rose-50/70'
          : 'border-slate-200 bg-slate-50/70'
    }`}
  >
    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p>
    <p className={`mt-1.5 font-display text-2xl font-black ${penalty && value > 0 ? 'text-rose-700' : final ? 'text-emerald-700' : 'text-slate-900'}`}>
      {value.toFixed(2)}
    </p>
    <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{helper}</p>
  </div>
);

const SkillPortfolioGraph: React.FC<{
  skills: Array<[string, EvaluationSkillBreakdown]>;
}> = ({ skills }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-[minmax(120px,0.65fr)_minmax(0,1.35fr)_68px] gap-3 text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
      <span>Skill</span>
      <span className="flex justify-between px-1"><span>0</span><span>2.5</span><span>5</span><span>7.5</span><span>10</span></span>
      <span className="text-right">Score</span>
    </div>
    {skills.map(([skill, details]) => (
      <div key={skill} className="grid grid-cols-[minmax(120px,0.65fr)_minmax(0,1.35fr)_68px] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-800" title={skill}>{skill}</p>
          <p className="mt-0.5 text-[9px] font-bold text-slate-400">
            Role importance {details.priority_score.toFixed(1)}
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex justify-between px-[25%]">
            <span className="border-l border-white/80" />
            <span className="border-l border-white/80" />
            <span className="border-l border-white/80" />
          </div>
          <ScoreBar score={details.score} />
        </div>
        <div className="text-right">
          <p className={`text-sm font-black ${scoreTextClass(details.score)}`}>{details.score.toFixed(1)}</p>
          <p className="text-[8px] font-bold text-slate-400">{Math.round(details.confidence * 100)}% conf.</p>
        </div>
      </div>
    ))}
    {skills.length === 0 && <EmptyEvidence label="No technical skill scores were generated." />}
  </div>
);

const SignalPanel: React.FC<{
  title: string;
  subtitle: string;
  items: string[];
  icon: React.ReactNode;
  tone: 'emerald' | 'rose';
}> = ({ title, subtitle, items, icon, tone }) => {
  const style =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
      : 'border-rose-200 bg-rose-50/60 text-rose-800';
  return (
    <div className={`rounded-2xl border p-5 ${style}`}>
      <div className="flex items-center gap-2">{icon}<p className="text-sm font-black">{title}</p></div>
      <p className="mt-1 text-[10px] font-semibold opacity-70">{subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-current/10 bg-white/75 px-3 py-1.5 text-[10px] font-black">
            {item}
          </span>
        ))}
        {items.length === 0 && <p className="text-xs font-semibold opacity-65">None identified.</p>}
      </div>
    </div>
  );
};

const SkillEvidenceCard: React.FC<{
  skill: string;
  details: EvaluationSkillBreakdown;
  summary: string;
  evidence: string[];
  initiallyOpen: boolean;
}> = ({ skill, details, summary, evidence, initiallyOpen }) => (
  <details className="group overflow-hidden rounded-xl border border-slate-200 bg-white" open={initiallyOpen}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:content-none hover:bg-slate-50/70">
      <div className="flex min-w-0 items-center gap-3">
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">{skill}</p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.11em] text-slate-400">
            Role importance {details.priority_score.toFixed(1)} · {details.questions_evaluated} question{details.questions_evaluated === 1 ? '' : 's'} · {Math.round(details.confidence * 100)}% confidence
          </p>
        </div>
      </div>
      <span className={`shrink-0 text-base font-black ${scoreTextClass(details.score)}`}>
        {details.score.toFixed(1)}
        <span className="text-[9px] text-slate-400">/10</span>
      </span>
    </summary>
    <div className="border-t border-slate-100 bg-slate-50/40 p-4">
      <ScoreBar score={details.score} compact />
      <p className="mt-4 text-xs font-medium leading-6 text-slate-600">{summary}</p>
      <EvidenceList evidence={evidence} empty="No direct evidence was recorded for this skill." />
    </div>
  </details>
);

const NarrativeCard: React.FC<{
  title: string;
  score: number;
  summary: string;
  evidence: string[];
  icon: React.ReactNode;
}> = ({ title, score, summary, evidence, icon }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 ${scoreTextClass(score)}`}>{icon}</span>
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
      </div>
      <span className={`text-lg font-black ${scoreTextClass(score)}`}>{score.toFixed(1)}</span>
    </div>
    <div className="mt-3"><ScoreBar score={score} compact /></div>
    <p className="mt-4 text-xs font-medium leading-6 text-slate-600">{summary}</p>
    <EvidenceList evidence={evidence} empty="No direct evidence was recorded." />
  </article>
);

const SectionCommunicationCard: React.FC<{
  section: string;
  details: SectionCommunicationBreakdown;
}> = ({ section, details }) => (
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

const EvidenceList: React.FC<{
  evidence: string[];
  empty: string;
  compact?: boolean;
}> = ({ evidence, empty, compact = false }) => (
  <div className={compact ? 'mt-3' : 'mt-4'}>
    <p className="mb-2 text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Evidence</p>
    <ul className="space-y-2">
      {evidence.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="border-l-2 border-emerald-300 bg-white px-3 py-2 text-[10px] font-medium leading-5 text-slate-600 shadow-sm"
        >
          {item}
        </li>
      ))}
      {evidence.length === 0 && <li className="text-[10px] font-semibold text-slate-400">{empty}</li>}
    </ul>
  </div>
);

const IntegrityPanel: React.FC<{ evaluation: InterviewEvaluationResponse }> = ({ evaluation }) => {
  const summary = evaluation.violation_summary;
  if (!summary) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
          title="Integrity and conduct"
          subtitle="Interview integrity summary."
        />
        <p className="text-xs font-semibold text-slate-500">No violation summary was generated.</p>
      </div>
    );
  }

  const hasCritical = summary.severity_counts.critical > 0;
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${summary.has_violation ? 'border-amber-200 bg-amber-50/35' : 'border-emerald-200 bg-emerald-50/30'}`}>
      <SectionTitle
        icon={summary.has_violation ? <AlertOctagon className="h-4 w-4 text-amber-600" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
        title="Integrity and conduct"
        subtitle="Interview integrity concerns and the evidence supporting them."
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

      <EvidenceList
        evidence={evaluation.violation_evidence ?? []}
        empty="No supporting integrity evidence was recorded."
      />
    </div>
  );
};

const SeverityTile: React.FC<{
  label: string;
  value: number;
  tone: 'slate' | 'emerald' | 'amber' | 'rose';
}> = ({ label, value, tone }) => {
  const styles = {
    slate: 'border-slate-200 bg-white text-slate-800',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${styles[tone]}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.12em] opacity-60">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
};

const EmptyEvidence: React.FC<{ label: string }> = ({ label }) => (
  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-[10px] font-semibold text-slate-400">
    {label}
  </p>
);

const ReportLoadingState = () => (
  <div className="ibot-scrollbar h-full overflow-y-auto pr-1">
    <div className="mx-auto max-w-[1500px] space-y-4">
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
