import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AudioLines,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Check,
  Clock3,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Scale,
  Sparkles,
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Ibot3DAvatar } from '../../features/dashboard/components/InterviewExperience';

const features = [
  {
    icon: Brain,
    title: 'Structured interviews',
    desc: 'Consistent, role-specific conversations tailored to your job description and evaluation criteria.',
  },
  {
    icon: BarChart3,
    title: 'Comparable reports',
    desc: 'Clear, evidence-backed evaluations with skill breakdowns, transcripts, and concise hiring signals.',
  },
  {
    icon: Zap,
    title: 'High throughput',
    desc: 'Invite once and interview at scale. Screen dozens of candidates simultaneously, without calendar drag.',
  },
  {
    icon: Scale,
    title: 'Unbiased evaluation',
    desc: 'Fair, consistent scoring based on the criteria that matter—not subjective first impressions.',
  },
];

const InterviewConversation = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  const restartPreview = () => {
    setIsEnded(false);
    setIsMuted(false);
  };

  return (
    <div className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[42px] bg-gradient-to-br from-emerald-200/30 via-white/10 to-cyan-200/25 blur-3xl" />

      <div className="group/room animate-slideUp stagger-3 overflow-hidden rounded-[28px] border border-white/90 bg-white/85 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.28),0_12px_32px_-18px_rgba(5,150,105,0.2)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_38px_90px_-28px_rgba(15,23,42,0.32),0_18px_40px_-18px_rgba(5,150,105,0.3)]">
        <header className="flex min-h-[70px] items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 transition-transform duration-300 group-hover/room:-rotate-6 group-hover/room:scale-105">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-slate-950 sm:text-sm">AI Interview</p>
              <p className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700">Live voice room</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-[10px] font-black text-white shadow-md">
              <Clock3 className="h-3 w-3 text-emerald-400" />
              <span className="font-mono tabular-nums">{isEnded ? '00:00' : '12:48'}</span>
            </span>
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-black shadow-sm sm:inline-flex ${
                isEnded
                  ? 'border-slate-200 bg-slate-50 text-slate-500'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isEnded ? 'bg-slate-400' : 'animate-pulse bg-emerald-500'}`} />
              {isEnded ? 'Ended' : 'Live'}
            </span>
            {!isEnded && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMuted((current) => !current)}
                  aria-label={isMuted ? 'Unmute preview microphone' : 'Mute preview microphone'}
                  aria-pressed={isMuted}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  className={`grid h-8 w-8 place-items-center rounded-full border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 ${
                    isMuted
                      ? 'border-slate-300 bg-slate-100 text-slate-600'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEnded(true)}
                  aria-label="End preview session"
                  title="End session"
                  className="grid h-8 w-8 place-items-center rounded-full border border-red-200 bg-white text-red-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-95"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </header>

        {isEnded ? (
          <div className="grid min-h-[465px] place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.12),transparent_35%),linear-gradient(135deg,#f8fafc,#eef5f6)] p-8 text-center">
            <div className="animate-scaleIn">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xl shadow-slate-900/10">
                <PhoneOff className="h-6 w-6" />
              </div>
              <p className="mt-5 text-lg font-black text-slate-950">Session ended</p>
              <p className="mx-auto mt-2 max-w-xs text-xs font-medium leading-6 text-slate-500">
                This interactive preview mirrors the controls candidates use during a live interview.
              </p>
              <button
                type="button"
                onClick={restartPreview}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restart preview
              </button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[465px] grid-cols-1 gap-3 bg-[linear-gradient(rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#eef5f6)] bg-[size:28px_28px,28px_28px,auto] p-3 sm:grid-cols-[0.92fr_1.08fr] sm:p-4">
            <section className="group/stage ibot-stage-panel relative flex min-h-[350px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/90 p-3 shadow-xl shadow-slate-900/8 ring-1 ring-white/60 sm:min-h-0">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/12 blur-3xl transition-all duration-500 group-hover/stage:h-64 group-hover/stage:w-64 group-hover/stage:bg-emerald-300/20" />
              <div className="relative z-10 -my-3 transition-transform duration-500 group-hover/stage:-translate-y-2 group-hover/stage:scale-[1.03]">
                <Ibot3DAvatar isSpeaking={!isMuted} compact />
              </div>
              <div className="relative z-20 -mt-3 w-[88%] rounded-2xl border border-white/90 bg-white/92 px-3 py-3 text-center shadow-lg shadow-slate-200/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                  <span className={`h-1.5 w-1.5 rounded-full ${isMuted ? 'bg-slate-300' : 'animate-pulse bg-emerald-500'}`} />
                  Session state
                </div>
                <p className="mt-1 text-xs font-black text-slate-950">
                  {isMuted ? 'Microphone muted' : 'iBot is speaking'}
                </p>
              </div>
            </section>

            <section className="ibot-caption-panel flex min-h-[390px] min-w-0 flex-col overflow-hidden rounded-3xl border border-white/90 bg-white/90 shadow-xl shadow-slate-900/8 ring-1 ring-white/60">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white/60 px-4 py-3.5">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">Live room</p>
                  <p className="mt-0.5 text-xs font-black text-slate-950">Transcript</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[8px] font-black ${
                    isMuted
                      ? 'border border-slate-200 bg-white text-slate-500'
                      : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                  }`}
                >
                  {isMuted ? (
                    <>
                      <MicOff className="h-3 w-3" />
                      Muted
                    </>
                  ) : (
                    <>
                      <span className="flex h-3 items-end gap-[2px]">
                        {[6, 10, 8, 12].map((height, index) => (
                          <span
                            key={index}
                            className="w-[2px] animate-pulse rounded-full bg-emerald-500"
                            style={{ height, animationDelay: `${index * 90}ms` }}
                          />
                        ))}
                      </span>
                      Speak clearly
                    </>
                  )}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-end gap-3 p-3">
                <div className="ml-3 rounded-2xl border border-emerald-100 bg-emerald-50/45 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:translate-x-1 hover:border-emerald-200 hover:shadow-md">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white">
                      <User className="h-3 w-3" />
                    </span>
                    <div>
                      <p className="text-[9px] font-black text-slate-900">You</p>
                      <p className="text-[8px] font-semibold text-slate-400">12:47 PM</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium leading-[1.55] text-slate-700">
                    We simplified onboarding from seven steps to three after usability testing.
                  </p>
                </div>

                <div className="mr-3 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-3.5 text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-xl">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-emerald-300">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] font-black text-white">Interviewer</p>
                        <p className="text-[8px] font-semibold text-white/45">12:48 PM</p>
                      </div>
                    </div>
                    {!isMuted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-black text-emerald-700">
                        <Volume2 className="h-2.5 w-2.5" />
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium leading-[1.55] text-white">
                    What impact did that change have on activation?
                    {!isMuted && (
                      <span className="ml-2 inline-flex items-center gap-1 align-middle">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="h-1 w-1 animate-bounce rounded-full bg-emerald-400"
                            style={{ animationDelay: `${dot * 120}ms` }}
                          />
                        ))}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 bg-white/65 px-4 py-3 text-[9px] font-semibold text-slate-500">
                <AudioLines className={`h-3.5 w-3.5 ${isMuted ? 'text-slate-400' : 'text-emerald-600'}`} />
                {isMuted ? 'Unmute to continue your response' : 'Captions update as the conversation continues'}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { warning } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origHtmlHeight = document.documentElement.style.height;
    const origBodyOverflow = document.body.style.overflow;
    const origBodyHeight = document.body.style.height;
    const rootEl = document.getElementById('root');
    const origRootOverflow = rootEl?.style.overflow ?? '';
    const origRootHeight = rootEl?.style.height ?? '';

    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    if (rootEl) {
      rootEl.style.overflow = 'auto';
      rootEl.style.height = 'auto';
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 48);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
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

  const handleProtectedNavigation = (event: React.MouseEvent, path: string) => {
    event.preventDefault();
    if (isAuthenticated) {
      navigate(path);
      return;
    }
    warning('Access Denied', 'Please log in to view this dashboard page.');
    navigate('/login');
  };

  const handleScrollToFeatures = () => {
    const pageBottom = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: pageBottom, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f8fbfa] font-sans text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <div className="blob-drift-1 absolute -left-48 top-28 h-[460px] w-[460px] rounded-full bg-emerald-200/20 blur-[110px]" />
        <div className="blob-drift-2 absolute -right-44 top-44 h-[520px] w-[520px] rounded-full bg-cyan-200/25 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <header
        className={`sticky top-0 z-50 flex h-[76px] items-center border-b px-5 transition-all duration-300 sm:px-8 ${
          isScrolled
            ? 'border-slate-200/80 bg-white/88 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.5)] backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-[1fr_auto] items-center md:grid-cols-[1fr_auto_1fr]">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex w-fit items-center gap-2.5"
            aria-label="iBot home"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.8)] transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
              <Bot className="h-[18px] w-[18px]" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-[-0.03em] text-slate-950">iBot</span>
          </button>

          <nav className="hidden items-center gap-7 rounded-full border border-slate-200/70 bg-white/55 px-6 py-2.5 text-sm font-semibold shadow-sm backdrop-blur-sm md:flex lg:gap-8">
            {[
              ['Dashboard', '/dashboard'],
              ['Assessments', '/assessments'],
              ['Candidates', '/candidates'],
            ].map(([label, path]) => (
              <a
                key={path}
                href={path}
                onClick={(event) => handleProtectedNavigation(event, path)}
                className="text-slate-600 transition-colors hover:text-emerald-700"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2.5 sm:gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg"
              >
                Go to dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="hidden px-2 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-700 sm:block"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_12px_24px_-14px_rgba(5,150,105,0.8)] sm:px-5"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100svh-76px)] w-full max-w-[1320px] items-center gap-16 px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-[650px] text-center lg:mx-0 lg:text-left">
            <div className="animate-fadeIn inline-flex items-center gap-2.5 rounded-full border border-emerald-200/90 bg-white/80 px-4 py-2 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.7)] backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold tracking-[0.015em] text-slate-600 sm:text-xs">
                Live AI Screening <span className="mx-1 text-slate-300">•</span> Initialized <span className="mx-1 text-slate-300">•</span> Generated <span className="mx-1 text-slate-300">•</span> Evaluated
              </span>
            </div>

            <h1 className="animate-slideUp stagger-1 mt-7 font-display text-[clamp(2.75rem,6.5vw,4rem)] font-extrabold leading-[0.99] tracking-[-0.055em] text-slate-950 lg:text-[clamp(3.35rem,4.3vw,4rem)]">
              <span className="block lg:whitespace-nowrap">Hire smarter with</span>
              <span className="mt-2 block lg:whitespace-nowrap">
                <span className="relative inline-block bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text pb-2 text-transparent">
                  AI interviews
                  <span className="absolute bottom-0 left-0 h-[4px] w-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-70" />
                </span>
                <span className="text-slate-950"> that scale.</span>
              </span>
            </h1>

            <p className="animate-slideUp stagger-2 mx-auto mt-7 max-w-[570px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              Run thoughtful, role-specific interviews around the clock. Every candidate gets a consistent experience, and every hiring team gets evidence they can trust.
            </p>

            <div className="animate-slideUp stagger-3 mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_16px_30px_-14px_rgba(5,150,105,0.72)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_20px_35px_-14px_rgba(5,150,105,0.8)] active:translate-y-0"
              >
                Start interviewing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={handleScrollToFeatures}
                className="inline-flex h-13 items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold text-slate-600 transition-colors hover:bg-white/70 hover:text-emerald-700"
              >
                See how it works
              </button>
            </div>

            <div className="animate-slideUp stagger-4 mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold text-slate-500 lg:justify-start">
              {['Set up in minutes', 'Consistent evaluations', 'No scheduling'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <InterviewConversation />
        </section>

        <section id="features" className="border-y border-slate-200/80 bg-white/65 px-5 py-16 backdrop-blur-sm sm:px-8">
          <div className="mx-auto max-w-[1180px]">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <h2 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-4xl">
                A better interview, end to end
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                From the first question to the final report, iBot keeps every interview structured, human, and useful.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {features.map(({ icon: Icon, title, desc }) => (
                <article
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_-25px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_22px_45px_-28px_rgba(5,150,105,0.35)] sm:p-6"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white">
              <Bot className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold text-slate-600">© 2026 iBot</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
            <a href="#" className="transition-colors hover:text-emerald-700">Privacy</a>
            <a href="#" className="transition-colors hover:text-emerald-700">Terms</a>
            <a href="#" className="transition-colors hover:text-emerald-700">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
