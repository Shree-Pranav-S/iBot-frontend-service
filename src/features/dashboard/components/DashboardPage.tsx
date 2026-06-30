import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Plus,
  Radio,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useAssessments, useCandidates, useRecruiterEvaluations } from '../../../hooks/queries';
import type { RecruiterEvaluationListItem } from '../../../types/candidate.types';
import { decisionMeta, recommendationMeta, scoreTextClass } from './evaluationUiUtils';
import { StatusPill } from './EvaluationUI';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
const pluralize = (n: number, s: string, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: assessments = [], isLoading: assessmentsLoading } = useAssessments();
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates('all');
  const { data: evaluations = [], isLoading: evaluationsLoading } = useRecruiterEvaluations();

  const firstName = user?.full_name?.split(' ')[0] || 'Recruiter';
  const loading = assessmentsLoading || candidatesLoading || evaluationsLoading;

  const activeAssessments = assessments
    .filter((a) => a.status === 'ACTIVE')
    .sort((a, b) => new Date(a.window_end).getTime() - new Date(b.window_end).getTime());

  const inProgressCount = candidates.filter((c) => c.status === 'IN_PROGRESS').length;
  const invitedCount = candidates.filter((c) => ['INVITED', 'WAITING_ROOM'].includes(c.status)).length;
  const completedCount = candidates.filter((c) => c.status === 'COMPLETED').length;
  const evaluatedCount = candidates.filter((c) => c.status === 'EVALUATED').length;
  const pendingDecisionCount = evaluations.filter((e) => e.recruiter_decision === 'PENDING').length;
  const approvedCount = evaluations.filter((e) => e.recruiter_decision === 'APPROVED').length;
  const closingSoonCount = activeAssessments.filter((a) => daysUntil(a.window_end) <= 3).length;

  const recentEvaluations = [...evaluations]
    .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())
    .slice(0, 5);

  const totalCandidates = candidates.length;
  const pipelineStages = [
    { label: 'Invited', value: invitedCount, color: 'bg-slate-400', pct: totalCandidates ? (invitedCount / totalCandidates) * 100 : 0 },
    { label: 'Interviewing', value: inProgressCount, color: 'bg-cyan-500', pct: totalCandidates ? (inProgressCount / totalCandidates) * 100 : 0 },
    { label: 'Awaiting eval.', value: completedCount, color: 'bg-indigo-500', pct: totalCandidates ? (completedCount / totalCandidates) * 100 : 0 },
    { label: 'Evaluated', value: evaluatedCount, color: 'bg-emerald-500', pct: totalCandidates ? (evaluatedCount / totalCandidates) * 100 : 0 },
  ];

  const stats = [
    { label: 'Active campaigns', value: activeAssessments.length, helper: `${assessments.length} total`, icon: BriefcaseBusiness, tone: 'emerald', to: '/assessments' },
    { label: 'Candidates', value: totalCandidates, helper: `${inProgressCount} interviewing now`, icon: Users, tone: 'cyan', to: '/candidates' },
    { label: 'Evaluated reports', value: evaluations.length, helper: `${approvedCount} approved`, icon: FileCheck2, tone: 'indigo', to: '/evaluations' },
    { label: 'Pending decisions', value: pendingDecisionCount, helper: pendingDecisionCount > 0 ? 'Review required' : 'All caught up', icon: ClipboardCheck, tone: 'amber', to: '/evaluations' },
  ] as const;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="ibot-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-y-auto pb-6 animate-fadeIn">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 shadow-xl shadow-slate-900/20">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-20 h-48 w-48 rounded-full bg-cyan-500/8 blur-2xl" />

        <div className="relative z-10 px-6 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {greeting}, {firstName}
              </div>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-white lg:text-3xl">
                Your hiring pipeline
              </h2>
              <p className="mt-1.5 text-sm font-medium text-slate-400 max-w-xl">
                {activeAssessments.length > 0
                  ? `${activeAssessments.length} active campaign${activeAssessments.length > 1 ? 's' : ''} running · ${inProgressCount > 0 ? `${inProgressCount} candidate${inProgressCount > 1 ? 's' : ''} interviewing right now` : 'waiting for interviews to start'}.`
                  : 'Create your first assessment to start receiving candidates.'}
              </p>

              {closingSoonCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {pluralize(closingSoonCount, 'campaign')} closing within 3 days
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <NavLink
                to="/candidates"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
              >
                <Users className="h-4 w-4" />
                Candidates
              </NavLink>
              <NavLink
                to="/assessments"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                New assessment
              </NavLink>
            </div>
          </div>

          {/* Mini stats in hero */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Active', value: activeAssessments.length, icon: Radio, color: 'text-emerald-400' },
              { label: 'Interviewing', value: inProgressCount, icon: Zap, color: 'text-cyan-400' },
              { label: 'Reports ready', value: evaluations.length, icon: TrendingUp, color: 'text-indigo-400' },
              { label: 'Need decision', value: pendingDecisionCount, icon: ClipboardCheck, color: 'text-amber-400' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                  </div>
                  {loading ? (
                    <div className="mt-1.5 h-6 w-10 animate-pulse rounded bg-white/10" />
                  ) : (
                    <p className="mt-1 font-display text-xl font-black text-white">{item.value}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <section className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <NavLink
              key={stat.label}
              to={stat.to}
              className={`ibot-dashboard-metric ibot-dashboard-metric-${stat.tone} animate-slideUp group`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={`ibot-dashboard-metric-icon ibot-dashboard-metric-icon-${stat.tone}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">{stat.label}</p>
                  {loading ? (
                    <div className="mt-2 h-7 w-14 rounded-md ibot-shimmer" />
                  ) : (
                    <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950">{stat.value}</p>
                  )}
                  <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">{stat.helper}</p>
                </div>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
            </NavLink>
          );
        })}
      </section>

      {/* ── Main content row ────────────────────────────────────────────── */}
      <section className="grid shrink-0 gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">

        {/* Pipeline + recent evaluations */}
        <article className="ibot-panel flex flex-col">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">Candidate pipeline</h3>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">Status distribution and recent evaluation reports</p>
            </div>
            <NavLink to="/candidates" className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800">
              Open pipeline <ArrowRight className="h-3.5 w-3.5" />
            </NavLink>
          </header>

          <div className="grid gap-3 p-3.5">
            {/* Pipeline stages */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {pipelineStages.map((stage) => (
                <div key={stage.label} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 transition-all hover:border-slate-300 hover:bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[9px] font-semibold text-slate-500">{stage.label}</p>
                    <span className="text-sm font-bold text-slate-900">{loading ? '-' : stage.value}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                    <div className={`h-full rounded-full transition-all duration-700 ${stage.color}`} style={{ width: `${Math.max(stage.pct, stage.value > 0 ? 4 : 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent evaluations */}
            <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Recent evaluations</p>
                <NavLink to="/evaluations" className="text-[10px] font-semibold text-slate-500 transition-colors hover:text-emerald-700">
                  View all
                </NavLink>
              </div>

              {evaluationsLoading ? (
                <div className="grid gap-2 p-3">
                  {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg ibot-shimmer" />)}
                </div>
              ) : recentEvaluations.length === 0 ? (
                <div className="flex h-[150px] flex-col items-center justify-center px-5 text-center">
                  <FileCheck2 className="h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-700">No evaluation reports yet</p>
                  <p className="mt-1 text-[10px] text-slate-400">Completed interview reports will appear here.</p>
                </div>
              ) : (
                <div className="ibot-scrollbar max-h-[min(320px,40vh)] divide-y divide-slate-100 overflow-y-auto">
                  {recentEvaluations.map((evaluation) => (
                    <EvaluationRow key={evaluation.candidate_assessment_id} evaluation={evaluation} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Deadlines + quick actions */}
        <article className="ibot-panel flex flex-col">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">Upcoming deadlines</h3>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">Active windows closing soonest</p>
            </div>
            <CalendarClock className="h-4 w-4 text-slate-400" />
          </header>

          <div className="flex flex-col p-3.5">
            {assessmentsLoading ? (
              <div className="grid gap-2">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl ibot-shimmer" />)}
              </div>
            ) : activeAssessments.length === 0 ? (
              <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <BriefcaseBusiness className="h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-700">No active campaigns</p>
                <p className="mt-1 text-[10px] text-slate-400">Activate an assessment to begin.</p>
              </div>
            ) : (
              <div className="ibot-scrollbar max-h-[min(280px,36vh)] divide-y divide-slate-100 overflow-y-auto">
                {activeAssessments.slice(0, 6).map((assessment) => {
                  const remaining = daysUntil(assessment.window_end);
                  const urgent = remaining <= 1;
                  const warn = remaining <= 3;
                  return (
                    <NavLink
                      key={assessment.id}
                      to="/assessments"
                      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-1.5 last:pb-1.5 hover:bg-slate-50/80 px-1 rounded-lg transition-colors"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${urgent ? 'border-rose-200 bg-rose-50 text-rose-600' : warn ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                        <Radio className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-emerald-800">{assessment.title}</p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-slate-400">{assessment.role_name} · closes {formatDate(assessment.window_end)}</p>
                      </div>
                      <span className={`rounded-lg px-2 py-1 text-[9px] font-bold ${urgent ? 'bg-rose-50 text-rose-700' : warn ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {remaining <= 0 ? 'Today' : pluralize(remaining, 'day')}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            )}

            {/* Quick actions */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {[
                { to: '/evaluations', icon: UserCheck, label: 'Review decisions', sub: `${pendingDecisionCount} pending` },
                { to: '/assessments', icon: CheckCircle2, label: 'Manage campaigns', sub: `${activeAssessments.length} active` },
                { to: '/candidates', icon: Users, label: 'View candidates', sub: `${totalCandidates} total` },
                { to: '/evaluations', icon: Sparkles, label: 'Intelligence center', sub: `${evaluations.length} reports` },
              ].map(({ to, icon: Icon, label, sub }) => (
                <NavLink
                  key={label}
                  to={to}
                  className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold text-slate-800">{label}</p>
                    <p className="mt-0.5 text-[9px] text-slate-400">{sub}</p>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

/* ── Evaluation Row ──────────────────────────────────────────────────────── */
const EvaluationRow: React.FC<{ evaluation: RecruiterEvaluationListItem }> = ({ evaluation }) => {
  const recommendation = recommendationMeta(evaluation.hiring_recommendation);
  const decision = decisionMeta(evaluation.recruiter_decision);

  return (
    <div className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-slate-50">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 font-black text-[10px] text-emerald-300">
          {evaluation.candidate_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-emerald-800">{evaluation.candidate_name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="truncate text-[9px] font-medium text-slate-400">{evaluation.role_name}</span>
            <span className="hidden sm:inline-flex"><StatusPill {...recommendation} /></span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-black ${scoreTextClass(evaluation.overall_score)}`}>{evaluation.overall_score.toFixed(1)}</span>
        <span className="hidden sm:inline-flex"><StatusPill {...decision} /></span>
        <button
          type="button"
          onClick={() => window.open(`/candidates/${evaluation.candidate_assessment_id}/report`, '_blank', 'noopener,noreferrer')}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
          title="Open report in new tab"
        >
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
