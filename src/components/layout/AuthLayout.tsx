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
    <div className="theme-dark flex h-screen w-screen overflow-hidden bg-mesh-dark text-primary font-sans relative">
      {/* ── Background Drifting Blobs ────────────────────────────────────── */}
      <div className="absolute top-[10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none blob-drift-1 z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none blob-drift-2 z-0" />

      {/* ── Left panel: Brand (Desktop Only) ──────────────────────────────── */}
      <div className="hidden min-h-0 flex-1 flex-col justify-between overflow-hidden p-12 z-10 lg:flex">
        {/* Logo Lockup */}
        <div className="flex items-center gap-2.5 cursor-pointer self-start" onClick={() => navigate('/')}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #0f766e)' }}
          >
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">iBot</span>
            <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
              Recruiter
            </span>
          </div>
        </div>

        {/* Hero Headline and Subtext */}
        <div className="w-full max-w-xl animate-slideUp stagger-1 my-auto">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white font-display">
            Hire smarter with<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              AI-powered interviews
            </span>
          </h1>
          <p className="mt-4 max-w-[480px] text-base leading-relaxed text-secondary">
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
                className="ibot-card border border-subtle bg-elevated/40 p-6 flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:bg-elevated/60 hover:border-emphasis hover:-translate-y-1 group relative rounded-card"
                style={{ animationDelay: `${0.2 + i * 0.06}s` }}
              >
                {/* 1px top border highlight on hover */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon Container */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 transition-transform group-hover:scale-105 duration-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  <p className="mt-1 text-xs text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel: Form + Minimal Footer ────────────────────────────── */}
      <div className="flex min-h-0 w-full items-center justify-center p-6 z-10 lg:w-[460px] xl:w-[500px]">
        <div className="ibot-scrollbar max-h-full w-full max-w-[400px] overflow-y-auto py-6">
          {/* Logo Lockup for Mobile View */}
          <div className="mb-8 flex items-center justify-center gap-2.5 cursor-pointer lg:hidden" onClick={() => navigate('/')}>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #0f766e)' }}
            >
              <Bot className="h-4.5 w-4.5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">iBot</span>
            <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
              Recruiter
            </span>
          </div>

          {children}

          {/* Minimal Footer */}
          <footer className="mt-12 text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <div
                className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500/20 text-emerald-400"
              >
                <Bot className="h-2 w-2" />
              </div>
              <span>© 2026 IBot</span>
            </div>
            <div className="flex gap-4 text-[11px] text-muted justify-center">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
