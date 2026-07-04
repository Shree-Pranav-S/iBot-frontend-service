import React from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Scale, Workflow, Zap } from 'lucide-react';
import { IbotMark } from '../ui/IbotMark';

interface AuthLayoutProps {
  children: ReactNode;
}

const features = [
  {
    icon: Workflow,
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
    <div
      data-testid="auth-shell"
      className="relative h-screen overflow-x-hidden overflow-y-auto bg-[#F7F3EA] font-body text-[#1F1D1A] lg:overflow-y-hidden"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(36,33,29,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(36,33,29,0.03)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        <div className="absolute -left-48 top-20 h-[560px] w-[560px] rounded-full bg-[#F4E8D6]/75 blur-[100px]" />
        <div className="absolute -bottom-60 -right-36 h-[620px] w-[620px] rounded-full bg-[#E9D8BE]/55 blur-[120px]" />
        <div className="absolute right-[6%] top-[8%] h-2 w-2 rounded-full bg-[#B9833F]/45" />
        <div className="absolute bottom-[12%] left-[8%] h-1.5 w-1.5 rounded-full bg-[#24211D]/25" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-full w-full max-w-[1540px] items-center gap-10 px-5 py-6 sm:px-8 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(450px,0.92fr)] lg:gap-12 lg:px-12 lg:py-5 xl:gap-16 xl:px-16">
        <section className="hidden min-w-0 self-stretch lg:flex lg:flex-col">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F3EA]"
            aria-label="iBot home"
          >
            <span className="transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
              <IbotMark />
            </span>
            <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-[#1F1D1A]">iBot</span>
          </button>

          <div className="my-auto max-w-[680px] py-4">
            <h1 className="animate-slideUp font-display text-[clamp(3rem,4.25vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#1F1D1A]">
              <span className="block whitespace-nowrap">Hire smarter with</span>
              <span className="relative mt-2 inline-block whitespace-nowrap pb-3 text-[#9A6A30]">
                AI-powered interviews
                <span className="absolute bottom-0 left-0 h-[3px] w-[92px] rounded-full bg-[#B9833F]" />
              </span>
            </h1>
            <p className="animate-slideUp stagger-1 mt-4 max-w-[560px] text-[16px] leading-7 text-[#706A61]">
              Run structured interviews, monitor progress, and review candidate reports—all from one console.
            </p>

            <div className="mt-7 grid max-w-[660px] grid-cols-2 gap-4">
              {features.map(({ icon: Icon, title, desc }, index) => (
                <article
                  key={title}
                  className="group relative flex min-h-[108px] items-center gap-4 overflow-hidden rounded-2xl border border-[#E6DED2] bg-white/75 p-4 shadow-[0_18px_40px_-32px_rgba(36,33,29,0.38)] transition-all duration-300 hover:-translate-y-1 hover:border-[#CDA66F] hover:bg-white hover:shadow-[0_24px_48px_-30px_rgba(154,106,48,0.28)]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className="absolute inset-x-0 top-0 h-[2px] bg-[#B9833F] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#D8C9B5] bg-[#F4E8D6] text-[#9A6A30] transition-all duration-300 group-hover:border-[#B9833F] group-hover:bg-[#B9833F] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold tracking-tight text-[#1F1D1A]">{title}</h2>
                    <p className="mt-1 text-xs leading-5 text-[#706A61]">{desc}</p>
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
            className="group mb-6 flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] lg:hidden"
            aria-label="iBot home"
          >
            <span className="transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
              <IbotMark />
            </span>
            <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-[#1F1D1A]">iBot</span>
          </button>

          <div className="w-full max-w-[520px]">{children}</div>

          <div className="mt-5 flex items-center gap-2 text-[11px] font-medium text-[#8A8175]">
            <span className="px-2">© 2026 iBot</span>
            <a href="#" className="rounded-full px-2 py-1 transition-colors hover:bg-[#F4E8D6] hover:text-[#9A6A30]">Privacy</a>
            <a href="#" className="rounded-full px-2 py-1 transition-colors hover:bg-[#F4E8D6] hover:text-[#9A6A30]">Terms</a>
          </div>
        </section>
      </div>
    </div>
  );
};
