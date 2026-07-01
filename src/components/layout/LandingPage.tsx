import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Brain, BarChart3, Zap, Scale, Bot, ArrowRight, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Structured interviews',
    desc: 'Consistent, role-specific conversations conducted by advanced AI, tailored to your job description.',
  },
  {
    icon: BarChart3,
    title: 'Comparable reports',
    desc: 'Clear evaluation trail per interview with breakdown of skills, prioritization, and natural transcripts.',
  },
  {
    icon: Zap,
    title: 'High throughput',
    desc: 'Invite once, interview at scale. Automatically invite, parse, and screen dozens of candidates simultaneously.',
  },
  {
    icon: Scale,
    title: 'Unbiased evaluation',
    desc: 'Fair, consistent scoring for all candidates based strictly on skill criteria rather than subjective indicators.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { warning } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Dynamic body styling overrides to allow manual scrolling on the landing page
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origHtmlHeight = document.documentElement.style.height;
    const origBodyOverflow = document.body.style.overflow;
    const origBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    const rootEl = document.getElementById('root');
    let origRootOverflow = '';
    let origRootHeight = '';
    if (rootEl) {
      origRootOverflow = rootEl.style.overflow;
      origRootHeight = rootEl.style.height;
      rootEl.style.overflow = 'auto';
      rootEl.style.height = 'auto';
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      // Restore styles when leaving the landing page
      document.documentElement.style.overflow = origHtmlOverflow;
      document.documentElement.style.height = origHtmlHeight;
      document.body.style.overflow = origBodyOverflow;
      document.body.style.height = origBodyHeight;
      if (rootEl) {
        rootEl.style.overflow = origRootOverflow;
        rootEl.style.height = origRootHeight;
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleProtectedNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate(path);
    } else {
      warning('Access Denied', 'Please log in to view this dashboard page.');
      navigate('/login');
    }
  };

  const handleScrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white font-sans text-slate-900">
      {/* ── Drifting Blur Blobs ───────────────────────────────────────────── */}
      <div className="blob-drift-1 pointer-events-none absolute left-[-10%] top-[10%] z-0 h-[300px] w-[300px] rounded-full bg-emerald-300/25 blur-[120px] sm:h-[450px] sm:w-[450px]" />
      <div className="blob-drift-2 pointer-events-none absolute bottom-[20%] right-[-10%] z-0 h-[350px] w-[350px] rounded-full bg-cyan-200/35 blur-[120px] sm:h-[500px] sm:w-[500px]" />

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 left-0 right-0 z-50 h-[76px] transition-all duration-300 flex items-center px-6 sm:px-12 ${
          isScrolled
            ? 'border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform" onClick={() => navigate('/')}>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #0f766e)' }}
            >
              <Bot className="h-4.5 w-4.5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-950">iBot</span>
          </div>

          {/* Center Links (Session Protected) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a
              href="/dashboard"
              onClick={(e) => handleProtectedNavigation(e, '/dashboard')}
              className="relative py-1 text-slate-600 transition-all after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:scale-x-0 after:bg-emerald-500 after:transition-transform after:duration-180 hover:scale-105 hover:text-emerald-700 hover:after:scale-x-100 active:scale-95"
            >
              Dashboard
            </a>
            <a
              href="/assessments"
              onClick={(e) => handleProtectedNavigation(e, '/assessments')}
              className="relative py-1 text-slate-600 transition-all after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:scale-x-0 after:bg-emerald-500 after:transition-transform after:duration-180 hover:scale-105 hover:text-emerald-700 hover:after:scale-x-100 active:scale-95"
            >
              Assessments
            </a>
            <a
              href="/candidates"
              onClick={(e) => handleProtectedNavigation(e, '/candidates')}
              className="relative py-1 text-slate-600 transition-all after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:scale-x-0 after:bg-emerald-500 after:transition-transform after:duration-180 hover:scale-105 hover:text-emerald-700 hover:after:scale-x-100 active:scale-95"
            >
              Candidates
            </a>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-emerald-600 hover:shadow-glow-emerald hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:scale-105"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-semibold text-slate-600 transition-all hover:scale-105 hover:text-emerald-700 active:scale-95"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-emerald-600 hover:shadow-glow-emerald hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:scale-105"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col items-center justify-center pt-24 pb-16 text-center z-10">
        
        {/* Eyebrow Pill */}
        <div className="animate-fadeIn inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-emerald-300 hover:bg-white">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-semibold text-slate-600 sm:text-sm">
            Live AI screening · initialized, generated, evaluated
          </span>
        </div>

        {/* Display Headline */}
        <h1 className="animate-slideUp stagger-1 mt-8 max-w-[920px] select-none font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
          Hire Smarter with<br />
          <span className="relative inline-block cursor-default bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text pb-3 text-transparent transition-transform duration-300 hover:scale-[1.01]">
            AI Interviews
            <span className="absolute bottom-1 left-0 right-0 h-[4px] rounded bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-75" />
          </span>
          {' '}that Scale
        </h1>

        {/* Subtext */}
        <p className="animate-slideUp stagger-2 mt-6 max-w-[640px] text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl">
          One link. A real conversational interview.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-slideUp stagger-3">
          <button
            onClick={handleScrollToFeatures}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-glow-emerald transition-all duration-300 hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:scale-105"
          >
            See how it works
            <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1 duration-200" />
          </button>
        </div>

        {/* Trust checkmarks */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-slideUp stagger-4 text-sm font-medium">
          <div className="flex cursor-default items-center gap-1.5 text-slate-600 transition-colors duration-200 hover:text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Easy to setup
          </div>
          <div className="flex cursor-default items-center gap-1.5 text-slate-600 transition-colors duration-200 hover:text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Fast evaluations
          </div>
          <div className="flex cursor-default items-center gap-1.5 text-slate-600 transition-colors duration-200 hover:text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Low cost
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-20 flex justify-center animate-fadeIn stagger-4">
          <div
            onClick={handleScrollToFeatures}
            className="flex h-[36px] w-[24px] cursor-pointer items-start justify-center rounded-full border-2 border-slate-300 p-1.5 transition-all duration-200 hover:scale-105 hover:border-emerald-400 active:scale-95"
          >
            <div className="w-[3px] h-[6px] rounded-full bg-emerald-400 animate-scroll-mouse" />
          </div>
        </div>
      </main>

      {/* ── Features Anchor Section ───────────────────────────────────────── */}
      <section id="features" className="relative z-10 mx-auto w-full max-w-7xl border-t border-slate-200 px-6 py-24 sm:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fadeIn">
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Everything you need to screen at scale
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Run complete candidate cycles, from parsing resumes to conducting custom voice/text screening and comparative analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative flex cursor-default flex-col gap-5 overflow-hidden rounded-card border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/60 sm:flex-row"
              >
                {/* Visual Top Border Highlight on Hover */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon Container */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5.5 w-5.5" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 transition-colors duration-200 group-hover:text-emerald-700">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="z-10 w-full border-t border-slate-200 bg-white/80 px-6 py-8 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #0f766e)' }}
            >
              <Bot className="h-3 w-3" />
            </div>
            <span className="text-sm font-semibold text-slate-700">© 2026 IBot</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="#" className="transition-colors hover:text-emerald-700 hover:underline">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-emerald-700 hover:underline">Terms of Service</a>
            <a href="#" className="transition-colors hover:text-emerald-700 hover:underline">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
