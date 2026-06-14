import React from 'react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* Subtle background shapes */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-8%] h-[55%] w-[45%] rounded-full bg-indigo-100/60 blur-[100px]" />
        <div className="absolute bottom-[-15%] right-[-8%] h-[55%] w-[45%] rounded-full bg-violet-100/50 blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Brand / Teaser Column */}
          <div className="lg:col-span-7 text-left max-w-2xl mx-auto lg:mx-0">
            {/* Logo mark */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                iBot <span className="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded px-1.5 py-0.5 ml-1 bg-indigo-50">Recruiter</span>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-gray-900 mb-4">
              AI-Powered Interview Platform
            </h1>
            <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
              Automate candidate evaluation with intelligent AI interviewers. Parse job descriptions, generate custom rubrics, and evaluate candidates at scale.
            </p>

          </div>

          {/* Form Column */}
          <div className="lg:col-span-5 flex justify-center">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
};
