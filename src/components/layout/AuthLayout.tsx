import React from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Scale, BarChart3, Brain, Bot } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

const features = [
  {
    icon: Brain,
    title: 'Structured interviews',
    desc: 'Consistent, role-specific conversations.',
  },
  {
    icon: BarChart3,
    title: 'Comparable reports',
    desc: 'Clear evaluation trail per interview.',
  },
  {
    icon: Zap,
    title: 'High throughput',
    desc: 'Invite once, interview at scale.',
  },
  {
    icon: Scale,
    title: 'Unbiased evaluation',
    desc: 'Fair, consistent scoring for all candidates.',
  },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* ── Background Drifting Blobs ────────────────────────────────────── */}
      <div className="blob-drift-1 pointer-events-none absolute left-[-5%] top-[10%] z-0 h-[350px] w-[350px] rounded-full bg-emerald-300/30 blur-[100px]" />
      <div className="blob-drift-2 pointer-events-none absolute bottom-[10%] right-[10%] z-0 h-[350px] w-[350px] rounded-full bg-cyan-200/40 blur-[100px]" />

      {/* ── Left panel: Brand (Desktop Only) ──────────────────────────────── */}
      <div className="z-10 hidden min-h-0 flex-1 flex-col justify-between overflow-hidden border-r border-slate-200 bg-gradient-to-br from-white via-emerald-50/60 to-cyan-50/70 p-12 lg:flex">
        {/* Logo Lockup */}
        <div className="flex items-center gap-2.5 cursor-pointer self-start" onClick={() => navigate('/')}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #0f766e)' }}
          >
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-950">iBot</span>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              Recruiter
            </span>
          </div>
        </div>

        {/* Hero Headline and Subtext */}
        <div className="w-full max-w-xl animate-slideUp stagger-1 my-auto">
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-950">
            Hire smarter with<br />
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              AI-powered interviews
            </span>
          </h1>
          <p className="mt-4 max-w-[480px] text-base leading-relaxed text-slate-600">
            Run structured interviews, monitor progress, and review candidate reports — all from one console.
          </p>
        </div>

        {/* Features 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-card border border-slate-200 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/70"
                style={{ animationDelay: `${0.2 + i * 0.06}s` }}
              >
                {/* 1px top border highlight on hover */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon Container */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-transform duration-200 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel: Form + Minimal Footer ────────────────────────────── */}
      <div className="z-10 flex min-h-0 w-full items-center justify-center bg-slate-50/80 p-6 lg:w-[460px] xl:w-[500px]">
        <div className="ibot-scrollbar max-h-full w-full max-w-[400px] overflow-y-auto py-6">
          {/* Logo Lockup for Mobile View */}
          <div className="mb-8 flex items-center justify-center gap-2.5 cursor-pointer lg:hidden" onClick={() => navigate('/')}>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #0f766e)' }}
            >
              <Bot className="h-4.5 w-4.5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-950">iBot</span>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              Recruiter
            </span>
          </div>

          {children}

          {/* Minimal Footer */}
          <footer className="mt-12 text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div
                className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500/20 text-emerald-400"
              >
                <Bot className="h-2 w-2" />
              </div>
              <span>© 2026 IBot</span>
            </div>
            <div className="flex justify-center gap-4 text-[11px] text-slate-500">
              <a href="#" className="transition-colors hover:text-emerald-700">Privacy</a>
              <a href="#" className="transition-colors hover:text-emerald-700">Terms</a>
              <a href="#" className="transition-colors hover:text-emerald-700">Contact</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
