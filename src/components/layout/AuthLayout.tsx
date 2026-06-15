import React from 'react';
import type { ReactNode } from 'react';
import { Zap, ShieldCheck, BarChart3, Brain } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

const features = [
  {
    icon: Brain,
    title: 'Cut Hiring Time by 4×',
    desc: 'Run hundreds of voice interviews simultaneously. No scheduling, no waiting — decisions in days, not weeks.',
    color: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
  },
  {
    icon: BarChart3,
    title: 'Unbiased by Design',
    desc: 'Every candidate faces the same interview, scored on the same criteria. Fair, consistent, and defensible.',
    color: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
  },
  {
    icon: Zap,
    title: 'Interviews at Any Scale',
    desc: 'From 10 candidates to 10,000 — iBot handles them all at once, without any extra effort on your part.',
    color: 'bg-sky-500/10 text-sky-400 ring-sky-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Comfortable for Candidates',
    desc: 'Candidates interview on their own schedule, at their own pace — no pressure, no panel anxiety.',
    color: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden flex" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 40%, #24243e 100%)' }}>

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: '600px', height: '600px',
            top: '-200px', left: '-150px',
            background: 'radial-gradient(circle, #6366f1, transparent 70%)',
            animation: 'pulse 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full opacity-15"
          style={{
            width: '500px', height: '500px',
            bottom: '-150px', right: '-100px',
            background: 'radial-gradient(circle, #8b5cf6, transparent 70%)',
            animation: 'pulse 10s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: '300px', height: '300px',
            top: '40%', left: '35%',
            background: 'radial-gradient(circle, #06b6d4, transparent 70%)',
            animation: 'pulse 12s ease-in-out infinite 4s',
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 xl:p-16 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            iBot <span className="text-xs font-semibold text-indigo-300 border border-indigo-500/40 rounded px-1.5 py-0.5 ml-1 bg-indigo-500/10">Recruiter</span>
          </span>
        </div>

        {/* Main headline */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-300 border border-indigo-500/30 bg-indigo-500/10">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              The Future of Hiring is Here
            </div>
            <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Hire the Best,<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Without the Bias
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed">
              iBot conducts voice interviews for you — at any scale, any time. Get detailed, consistent candidate evaluations without spending hours in interview rooms.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 mb-3 ${f.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Social proof footer */}
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            {['T','A','R','M','S'].map((l, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-800 text-xs font-bold text-white"
                style={{ background: `hsl(${i * 60 + 220}, 70%, 55%)` }}
              >
                {l}
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-white">Trusted by 2,000+ recruiters</p>
            <p className="text-[10px] text-slate-400">saving weeks of interview time, every month</p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full lg:w-1/2 xl:w-[45%] items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">iBot Recruiter</span>
          </div>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.25; }
        }
      `}</style>
    </div>
  );
};
