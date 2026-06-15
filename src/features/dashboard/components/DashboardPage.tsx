import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useAssessments } from '../../../hooks/queries';
import { NavLink } from 'react-router-dom';
import {
  Building,
  Mail,
  Briefcase,
  Users,
  TrendingUp,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  BarChart3,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: assessments, isLoading } = useAssessments();

  const activeCount = assessments?.filter(a => a.status === 'ACTIVE').length ?? 0;
  const totalCount = assessments?.length ?? 0;
  const draftCount = assessments?.filter(a => a.status === 'DRAFT').length ?? 0;

  const initials = (user?.full_name || 'R')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const stats = [
    {
      label: 'Total Campaigns',
      value: totalCount,
      icon: Briefcase,
      color: 'from-indigo-500 to-indigo-600',
      ring: 'ring-indigo-500/20',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      sub: 'All time',
    },
    {
      label: 'Active Now',
      value: activeCount,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      ring: 'ring-emerald-500/20',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      sub: 'Accepting interviews',
    },
    {
      label: 'Drafts',
      value: draftCount,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      ring: 'ring-amber-500/20',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      sub: 'Ready to launch',
    },
  ];

  const quickActions = [
    {
      to: '/assessments',
      icon: Briefcase,
      title: 'Launch a Campaign',
      desc: 'Define the role, set the window, and let iBot handle every interview — no scheduling, no coordination.',
      accent: 'from-indigo-500 to-violet-500',
      ringColor: 'ring-indigo-500/30',
      hoverBg: 'hover:bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      to: '/candidates',
      icon: FileSpreadsheet,
      title: 'Invite Candidates',
      desc: 'Add your candidate list and iBot reaches out instantly — they interview on their own time, stress-free.',
      accent: 'from-emerald-500 to-teal-500',
      ringColor: 'ring-emerald-500/30',
      hoverBg: 'hover:bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      to: '/candidates',
      icon: Users,
      title: 'Make Better Hires',
      desc: 'Every candidate is scored against the same standard. No gut feel — just clear, comparable insights.',
      accent: 'from-violet-500 to-purple-500',
      ringColor: 'ring-violet-500/30',
      hoverBg: 'hover:bg-violet-50',
      textColor: 'text-violet-600',
    },
  ];

  const howItWorks = [
    { step: '01', icon: BarChart3, title: 'Set Up Your Role', body: 'Tell iBot what you need. Define the position, interview window, and key focus areas — it takes minutes, not hours.' },
    { step: '02', icon: FileSpreadsheet, title: 'Candidates Get Invited', body: 'Your shortlist receives personalized invites and can interview any time — no back-and-forth scheduling, no drop-offs.' },
    { step: '03', icon: Zap, title: 'AI Handles 100s at Once', body: 'iBot runs voice-led, adaptive interviews simultaneously across your entire candidate pool — 24/7, at any scale.' },
    { step: '04', icon: CheckCircle2, title: 'You Decide with Confidence', body: 'Each candidate gets a detailed, unbiased evaluation report. Compare fairly and make faster, smarter hiring decisions.' },
  ];

  return (
    <div className="space-y-8 max-w-6xl pb-8">

      {/* Hero Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 md:p-10 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', transform: 'translate(40%, -40%)' }} />
          <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)', transform: 'translateY(40%)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 border border-indigo-400/30 bg-indigo-500/10 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Recruiter Session Active
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Recruiter'} 👋
            </h1>
            <p className="text-indigo-200/80 text-sm md:text-base max-w-xl leading-relaxed">
              Run hundreds of interviews simultaneously, get unbiased AI evaluations for every candidate, and cut your time-to-hire by up to 4×  — all without adding headcount.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <NavLink
                to="/assessments"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Briefcase className="h-3.5 w-3.5" />
                New Campaign
              </NavLink>
              <NavLink
                to="/candidates"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-100 border border-indigo-400/30 bg-indigo-500/15 hover:bg-indigo-500/25 transition-all"
              >
                <Users className="h-3.5 w-3.5" />
                Manage Candidates
              </NavLink>
            </div>
          </div>

          {/* Profile card */}
          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-sm min-w-[220px]" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-white font-extrabold text-base shadow-lg"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
              >
                {initials}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user?.full_name || 'Recruiter'}</p>
                <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-widest">Recruiter</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-indigo-200/80">
              <div className="flex items-center gap-2 truncate">
                <Building className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{user?.company_name || 'No company set'}</span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 shadow-sm group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-5 translate-x-8 -translate-y-8" style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} ${s.text}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              {isLoading ? (
                <div className="h-8 w-14 bg-gray-200 animate-pulse rounded-lg" />
              ) : (
                <p className="text-3xl font-black text-gray-900">{s.value}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map(a => {
            const Icon = a.icon;
            return (
              <NavLink
                key={a.title}
                to={a.to}
                className={`group flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${a.hoverBg}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm bg-gradient-to-br ${a.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-gray-700">{a.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{a.desc}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${a.textColor} mt-auto`}>
                  Get started <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">How iBot Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {howItWorks.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === howItWorks.length - 1;
            return (
              <div key={step.step} className="relative flex flex-col gap-3">
                {/* Connector line */}
                {!isLast && (
                  <div className="hidden lg:block absolute top-5 left-[calc(100%_-_0px)] w-full h-px bg-gray-200 z-0" style={{ width: 'calc(100% - 2.5rem)', left: '2.5rem' }} />
                )}
                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-gray-100 select-none">{step.step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
