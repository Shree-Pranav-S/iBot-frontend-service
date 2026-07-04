import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AudioLines,
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
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import { IbotMark } from '../ui/IbotMark';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Ibot3DAvatar } from '../../features/dashboard/components/InterviewExperience';

const features = [
  {
    icon: Brain,
    number: '01',
    title: 'Structured interviews',
    desc: 'Consistent, role-specific conversations tailored to your job description and evaluation criteria.',
  },
  {
    icon: BarChart3,
    number: '02',
    title: 'Comparable reports',
    desc: 'Clear, evidence-backed evaluations with skill breakdowns, transcripts, and concise hiring signals.',
  },
  {
    icon: Zap,
    number: '03',
    title: 'High throughput',
    desc: 'Invite once and interview at scale. Screen dozens of candidates simultaneously, without calendar drag.',
  },
  {
    icon: Scale,
    number: '04',
    title: 'Unbiased evaluation',
    desc: 'Fair, consistent scoring based on the criteria that matter—not subjective first impressions.',
  },
];

const InterviewConversation: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  const restartPreview = () => {
    setIsEnded(false);
    setIsMuted(false);
  };

  return (
    <div
      className="landing-reveal relative mx-auto w-full max-w-[980px]"
      data-reveal
      data-reveal-direction="right"
    >
      <div className="pointer-events-none absolute -inset-10 rounded-[42px] bg-[#B9833F]/10 blur-[70px]" />

      <div className="group/room relative overflow-hidden rounded-[28px] border border-white/10 bg-[#FCFAF6] shadow-[0_38px_100px_-35px_rgba(0,0,0,0.7)]">
        <header className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[#E6DED2] bg-white px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <IbotMark compact />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold tracking-[-0.01em] text-[#1F1D1A]">AI Interview</p>
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-[#9A6A30]">Live voice room</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#24211D] px-3 py-1.5 text-[10px] font-bold text-white">
              <Clock3 className="h-3 w-3 text-[#D7AA6A]" />
              <span className="font-mono tabular-nums">{isEnded ? '00:00' : '12:48'}</span>
            </span>
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold sm:inline-flex ${
                isEnded
                  ? 'border-[#E6DED2] bg-[#F7F3EA] text-[#706A61]'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isEnded ? 'bg-[#8A8175]' : 'animate-pulse bg-emerald-500'}`} />
              {isEnded ? 'Ended' : 'Live'}
            </span>
            {!isEnded && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMuted((current) => !current)}
                  aria-label={isMuted ? 'Unmute preview microphone' : 'Mute preview microphone'}
                  aria-pressed={isMuted}
                  className={`grid h-8 w-8 place-items-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] ${
                    isMuted
                      ? 'border-[#D8CCBD] bg-[#F7F3EA] text-[#706A61]'
                      : 'border-[#D8B783] bg-[#F4E8D6] text-[#9A6A30] hover:bg-[#ECD7B9]'
                  }`}
                >
                  {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEnded(true)}
                  aria-label="End preview session"
                  className="grid h-8 w-8 place-items-center rounded-full border border-rose-200 bg-white text-rose-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-500 hover:bg-rose-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </header>

        {isEnded ? (
          <div className="grid min-h-[450px] place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(185,131,63,0.14),transparent_34%),linear-gradient(135deg,#FCFAF6,#F4E8D6)] p-8 text-center">
            <div className="animate-scaleIn">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#E6DED2] bg-white text-[#706A61] shadow-[0_18px_42px_-24px_rgba(36,33,29,0.4)]">
                <PhoneOff className="h-6 w-6" />
              </div>
              <p className="mt-5 text-lg font-bold text-[#1F1D1A]">Session ended</p>
              <p className="mx-auto mt-2 max-w-xs text-xs font-medium leading-6 text-[#706A61]">
                This interactive preview mirrors the controls candidates use during a live interview.
              </p>
              <button
                type="button"
                onClick={restartPreview}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#24211D] px-5 py-2.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#9A6A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restart preview
              </button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[450px] grid-cols-1 gap-3 bg-[#F7F3EA] p-3 sm:grid-cols-[0.86fr_1.14fr] sm:p-4">
            <section className="ibot-stage-panel relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-[20px] border border-[#E6DED2] bg-[#FCFAF6] p-3 sm:min-h-0">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(36,33,29,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(36,33,29,0.035)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
              <div className="relative z-10 -my-3 transition-transform duration-500 group-hover/room:-translate-y-1">
                <Ibot3DAvatar isSpeaking={!isMuted} compact />
              </div>
              <div className="relative z-20 -mt-4 w-[84%] rounded-2xl border border-[#E6DED2] bg-white/95 px-3 py-3 text-center shadow-[0_12px_30px_-22px_rgba(36,33,29,0.38)]">
                <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#9A6A30]">
                  <span className={`h-1.5 w-1.5 rounded-full ${isMuted ? 'bg-[#B8AA9A]' : 'animate-pulse bg-emerald-500'}`} />
                  Session state
                </div>
                <p className="mt-1 text-xs font-bold text-[#1F1D1A]">
                  {isMuted ? 'Microphone muted' : 'iBot is speaking'}
                </p>
              </div>
            </section>

            <section className="flex min-h-[390px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#E6DED2] bg-white">
              <div className="flex items-center justify-between gap-2 border-b border-[#E6DED2] px-4 py-3.5">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#9A6A30]">Live room</p>
                  <p className="mt-0.5 text-xs font-bold text-[#1F1D1A]">Transcript</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[8px] font-bold ${
                    isMuted
                      ? 'border border-[#E6DED2] bg-[#F7F3EA] text-[#706A61]'
                      : 'border border-emerald-100 bg-emerald-50 text-emerald-700'
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
                            key={height}
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

              <div className="flex flex-1 flex-col justify-end gap-3 bg-[#FCFAF6] p-3 sm:p-4">
                <div className="ml-4 rounded-2xl border border-[#E6DED2] bg-white p-3.5 shadow-[0_10px_24px_-22px_rgba(36,33,29,0.35)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#F4E8D6] text-[#9A6A30]">
                      <User className="h-3 w-3" />
                    </span>
                    <div>
                      <p className="text-[9px] font-bold text-[#1F1D1A]">You</p>
                      <p className="text-[8px] font-medium text-[#8A8175]">12:47 PM</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium leading-[1.6] text-[#706A61]">
                    We simplified onboarding from seven steps to three after usability testing.
                  </p>
                </div>

                <div className="mr-4 rounded-2xl border border-[#24211D] bg-[#24211D] p-3.5 text-white shadow-[0_18px_32px_-22px_rgba(36,33,29,0.75)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#B9833F] text-white">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[9px] font-bold text-white">Interviewer</p>
                        <p className="text-[8px] font-medium text-white/45">12:48 PM</p>
                      </div>
                    </div>
                    {!isMuted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-bold text-emerald-700">
                        <Volume2 className="h-2.5 w-2.5" />
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium leading-[1.6] text-white">
                    What impact did that change have on activation?
                    {!isMuted && (
                      <span className="ml-2 inline-flex items-center gap-1 align-middle">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="h-1 w-1 animate-bounce rounded-full bg-[#D7AA6A]"
                            style={{ animationDelay: `${dot * 120}ms` }}
                          />
                        ))}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-[#E6DED2] bg-white px-4 py-3 text-[9px] font-medium text-[#706A61]">
                <AudioLines className={`h-3.5 w-3.5 ${isMuted ? 'text-[#8A8175]' : 'text-[#B9833F]'}`} />
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
    document.body.style.overflow = 'visible';
    document.body.style.height = 'auto';
    if (rootEl) {
      rootEl.style.overflow = 'visible';
      rootEl.style.height = 'auto';
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 36);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let observer: IntersectionObserver | undefined;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add('is-visible');
            } else {
              (entry.target as HTMLElement).classList.remove('is-visible');
            }
          });
        },
        { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
      );
      revealItems.forEach((item) => observer?.observe(item));
    }

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
      observer?.disconnect();
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

  const handleScrollToInterview = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="ibot-landing-shell relative min-h-screen bg-[#F7F3EA] font-body text-[#1F1D1A]">
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? 'border-[#E6DED2] bg-[#FCFAF6] shadow-[0_8px_30px_-25px_rgba(36,33,29,0.36)]'
            : 'border-transparent bg-[#F7F3EA]/92'
        }`}
      >
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex w-fit items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F3EA]"
            aria-label="iBot home"
          >
            <span className="transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
              <IbotMark />
            </span>
            <span className="font-display text-[21px] font-extrabold tracking-[-0.045em] text-[#1F1D1A]">
              iBot
            </span>
          </button>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-[#E6DED2] bg-white/75 p-1 shadow-[0_8px_24px_-20px_rgba(36,33,29,0.4)] backdrop-blur-md md:flex">
            {[
              ['Dashboard', '/dashboard'],
              ['Assessments', '/assessments'],
              ['Candidates', '/candidates'],
            ].map(([label, path]) => (
              <a
                key={path}
                href={path}
                onClick={(event) => handleProtectedNavigation(event, path)}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#706A61] transition-all duration-200 hover:bg-[#F4E8D6] hover:text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center rounded-full bg-[#24211D] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#9A6A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2"
              >
                Go to dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-full px-3 py-2.5 text-[13px] font-semibold text-[#706A61] transition-colors hover:bg-white/70 hover:text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] sm:px-4"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center rounded-full bg-[#24211D] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-16px_rgba(36,33,29,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#9A6A30] hover:shadow-[0_14px_28px_-16px_rgba(154,106,48,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2 sm:px-5"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1240px] items-center justify-center gap-1 overflow-x-auto px-4 pb-3 md:hidden">
          {[
            ['Dashboard', '/dashboard'],
            ['Assessments', '/assessments'],
            ['Candidates', '/candidates'],
          ].map(([label, path]) => (
            <a
              key={path}
              href={path}
              onClick={(event) => handleProtectedNavigation(event, path)}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#706A61] transition-colors hover:bg-[#F4E8D6] hover:text-[#1F1D1A]"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section className="relative isolate flex min-h-[calc(100svh-72px)] items-center overflow-hidden px-5 py-12 sm:px-8 md:py-16">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[42%] h-[620px] w-[920px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(244,232,214,0.92),rgba(244,232,214,0.3)_48%,transparent_72%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(36,33,29,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(36,33,29,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
            <div className="absolute left-[10%] top-[22%] h-2 w-2 rounded-full bg-[#B9833F]/45" />
            <div className="absolute right-[13%] top-[34%] h-1.5 w-1.5 rounded-full bg-[#B9833F]/40" />
            <div className="absolute bottom-[19%] left-[18%] h-1 w-1 rounded-full bg-[#24211D]/30" />
          </div>

          <div className="mx-auto w-full max-w-[1120px] text-center">
            <div className="animate-fadeIn inline-flex max-w-full items-center gap-2 rounded-full border border-[#D8C9B5] bg-white/75 px-3 py-2 shadow-[0_10px_30px_-24px_rgba(36,33,29,0.38)] backdrop-blur sm:gap-2.5 sm:px-4">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="whitespace-nowrap text-[8px] font-semibold tracking-[0.01em] text-[#706A61] sm:text-xs sm:tracking-[0.025em]">
                Live AI Screening <span className="mx-1 text-[#B8AA9A]">•</span> Initialized <span className="mx-1 text-[#B8AA9A]">•</span> Generated <span className="mx-1 text-[#B8AA9A]">•</span> Evaluated
              </span>
            </div>

            <h1 className="animate-slideUp stagger-1 mx-auto mt-7 max-w-[1100px] font-display text-[clamp(2.65rem,7vw,5.6rem)] font-extrabold leading-[0.94] tracking-[-0.062em] text-[#1F1D1A]">
              <span className="block">Hire smarter with</span>
              <span className="mt-2 block text-[#9A6A30]">AI interviews that scale.</span>
            </h1>

            <p className="animate-slideUp stagger-2 mx-auto mt-7 max-w-[690px] text-[15px] leading-7 text-[#706A61] sm:text-lg sm:leading-8">
              Run thoughtful, role-specific interviews around the clock. Every candidate gets a consistent experience, and every hiring team gets evidence they can trust.
            </p>

            <div className="animate-slideUp stagger-3 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[#B9833F] px-7 py-3.5 text-sm font-bold text-white shadow-[0_16px_34px_-18px_rgba(154,106,48,0.78)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#9A6A30] hover:shadow-[0_20px_38px_-18px_rgba(154,106,48,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F3EA]"
              >
                Start interviewing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={handleScrollToInterview}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D8C9B5] bg-white/55 px-7 py-3.5 text-sm font-bold text-[#1F1D1A] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B9833F] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F]"
              >
                See how it works
              </button>
            </div>

            <div className="animate-slideUp stagger-4 mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-semibold text-[#706A61]">
              {['Set up in minutes', 'Consistent evaluations', 'No scheduling'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-[#D8B783] bg-[#F4E8D6] text-[#9A6A30]">
                    <Check className="h-3 w-3 stroke-[2.6]" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          aria-label="Interactive interview preview"
          className="relative isolate flex min-h-screen scroll-mt-[72px] items-center overflow-hidden bg-[#24211D] px-5 py-20 sm:px-8 lg:py-16"
        >
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[680px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(185,131,63,0.16),transparent_66%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
          </div>
          <div className="mx-auto grid w-full max-w-[1240px] items-center gap-12 lg:grid-cols-[minmax(340px,0.72fr)_minmax(0,1.28fr)] lg:gap-10 xl:gap-12">
            <div
              className="landing-reveal mx-auto max-w-[540px] text-center lg:mx-0 lg:text-left"
              data-reveal
              data-reveal-direction="left"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B9833F]/35 bg-[#B9833F]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#E8C794]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Inside the interview
              </div>
              <h2 className="mt-5 font-display text-[clamp(2.25rem,4vw,2.7rem)] font-bold leading-[1.02] tracking-[-0.052em] text-white">
                Natural for candidates. Structured for recruiters.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#C7BCAF] sm:text-[15px]">
                Candidates meet a focused AI interviewer that follows the role, listens in real time, and keeps every conversation consistent. You receive complete evidence without adding another meeting.
              </p>

              <div className="mt-6 space-y-2.5 text-left">
                {[
                  {
                    icon: Brain,
                    title: 'Role-specific flow',
                    text: 'Questions follow your job description and evaluation criteria.',
                  },
                  {
                    icon: AudioLines,
                    title: 'Natural voice experience',
                    text: 'Candidates answer conversationally, with live captions and clear controls.',
                  },
                  {
                    icon: BarChart3,
                    title: 'Review-ready evidence',
                    text: 'Every response is captured for consistent, comparable evaluation.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="group flex gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3 transition-colors duration-300 hover:border-[#B9833F]/35 hover:bg-[#B9833F]/10"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[#B9833F]/30 bg-[#B9833F]/12 text-[#E8C794]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-white">{title}</h3>
                      <p className="mt-0.5 text-[10px] leading-4 text-[#AFA397]">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <InterviewConversation />
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-[#E6DED2] bg-[#F7F3EA] px-5 py-24 sm:px-8 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,232,214,0.9),transparent_45%)]" />
          <div className="relative mx-auto grid max-w-[1120px] gap-px overflow-hidden rounded-[24px] border border-[#E6DED2] bg-[#E6DED2] shadow-[0_28px_70px_-48px_rgba(36,33,29,0.5)] md:grid-cols-2">
            {features.map(({ icon: Icon, number, title, desc }, index) => (
              <article
                key={title}
                data-reveal
                className="landing-reveal group relative min-h-[280px] overflow-hidden bg-[#FCFAF6] p-7 transition-colors duration-300 hover:bg-white sm:p-9"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-[#F4E8D6] transition-transform duration-500 group-hover:translate-x-9 group-hover:-translate-y-9 group-hover:scale-110" />
                <div className="relative flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-[13px] border border-[#D8C9B5] bg-[#F4E8D6] text-[#9A6A30] transition-all duration-300 group-hover:border-[#B9833F] group-hover:bg-[#B9833F] group-hover:text-white">
                    <Icon className="h-[19px] w-[19px]" />
                  </span>
                  <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#B8AA9A]">{number}</span>
                </div>
                <h2 className="relative mt-12 font-display text-[22px] font-bold tracking-[-0.035em] text-[#1F1D1A]">
                  {title}
                </h2>
                <p className="relative mt-3 max-w-[430px] text-sm leading-7 text-[#706A61]">{desc}</p>
                <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#B9833F] transition-all duration-500 group-hover:w-full" />
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#FCFAF6] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <IbotMark compact />
            <span className="text-sm font-semibold text-[#706A61]">© 2026 iBot</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-[#706A61]">
            {['Privacy', 'Terms', 'Support'].map((item) => (
              <a
                key={item}
                href="#"
                className="rounded-full px-3 py-2 transition-colors hover:bg-[#F4E8D6] hover:text-[#9A6A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F]"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
