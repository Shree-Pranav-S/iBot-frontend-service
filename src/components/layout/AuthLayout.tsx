import React from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Bot, Scale, Workflow, Zap } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

const features = [
  {
    icon: Workflow,
    title: 'Structured interviews',
    desc: 'Consistent, role-specific conversations.',
    accent: 'from-emerald-400 to-teal-400',
    iconClass: 'text-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Comparable reports',
    desc: 'Clear evaluation trail per interview.',
    accent: 'from-violet-500 to-cyan-500',
    iconClass: 'text-teal-600',
  },
  {
    icon: Zap,
    title: 'High throughput',
    desc: 'Invite once, interview at scale.',
    accent: 'from-amber-400 to-orange-400',
    iconClass: 'text-emerald-600',
  },
  {
    icon: Scale,
    title: 'Unbiased evaluation',
    desc: 'Fair, consistent scoring for all candidates.',
    accent: 'from-blue-500 to-cyan-400',
    iconClass: 'text-cyan-600',
  },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div
      data-testid="auth-shell"
      className="relative h-screen overflow-x-hidden overflow-y-auto bg-[#f8fbfc] font-sans text-slate-900 lg:overflow-y-hidden"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_right,black,black_72%,transparent)]" />
        <div className="absolute -left-32 top-20 h-[460px] w-[460px] rounded-full bg-emerald-200/22 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[-80px] h-[520px] w-[520px] rounded-full bg-cyan-200/22 blur-[130px]" />
        <div className="absolute -right-[15%] -top-[15%] h-[930px] w-[930px] rounded-full border-[120px] border-emerald-100/45" />
        <div className="absolute left-0 top-28 h-[390px] w-20 bg-[radial-gradient(circle,rgba(16,185,129,0.22)_1.5px,transparent_1.5px)] bg-[size:18px_18px] [mask-image:linear-gradient(to_right,black,transparent)]" />
        <div className="absolute bottom-0 right-0 h-[260px] w-24 bg-[radial-gradient(circle,rgba(6,182,212,0.2)_1.5px,transparent_1.5px)] bg-[size:18px_18px] [mask-image:linear-gradient(to_left,black,transparent)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-full w-full max-w-[1600px] items-center gap-10 px-5 py-6 sm:px-8 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(460px,0.85fr)] lg:gap-12 lg:px-12 lg:py-5 xl:gap-16 xl:px-16">
        <section className="hidden min-w-0 self-stretch lg:flex lg:flex-col">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex w-fit items-center gap-3"
            aria-label="iBot home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_12px_28px_-14px_rgba(5,150,105,0.72)] ring-1 ring-white transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
              <Bot className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-slate-950">iBot</span>
          </button>

          <div className="my-auto max-w-[680px] py-4">
            <h1 className="animate-slideUp font-display text-[clamp(3rem,4.25vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.055em] text-slate-950">
              <span className="block whitespace-nowrap">Hire smarter with</span>
              <span className="relative mt-2 inline-block whitespace-nowrap bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text pb-3 text-transparent">
                AI-powered interviews
                <span className="absolute bottom-0 left-0 h-[4px] w-[92px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
              </span>
            </h1>
            <p className="animate-slideUp stagger-1 mt-4 max-w-[560px] text-base leading-7 text-slate-600">
              Run structured interviews, monitor progress, and review candidate reports—all from one console.
            </p>

            <div className="mt-7 grid max-w-[660px] grid-cols-2 gap-4">
              {features.map(({ icon: Icon, title, desc, accent, iconClass }, index) => (
                <article
                  key={title}
                  className="group relative flex min-h-[108px] items-center gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/82 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.38)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:bg-white hover:shadow-[0_24px_48px_-28px_rgba(5,150,105,0.28)]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accent}`} />
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.4)] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold tracking-tight text-slate-900">{title}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col items-center justify-center py-2 lg:py-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group mb-6 flex items-center gap-2.5 lg:hidden"
            aria-label="iBot home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg">
              <Bot className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-950">iBot</span>
          </button>

          <div className="w-full max-w-[520px]">{children}</div>

          <div className="mt-5 flex items-center gap-5 text-[11px] font-medium text-slate-400">
            <span>© 2026 iBot</span>
            <a href="#" className="transition-colors hover:text-emerald-700">Privacy</a>
            <a href="#" className="transition-colors hover:text-emerald-700">Terms</a>
          </div>
        </section>
      </div>
    </div>
  );
};
