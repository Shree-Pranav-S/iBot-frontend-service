import React, { useState } from 'react';
import { InterviewRoom } from './InterviewRoom';
import { Radio, ShieldAlert } from 'lucide-react';

export const InterviewPage: React.FC = () => {
  const [interviewToken, setInterviewToken] = useState('');
  const [activeToken, setActiveToken] = useState<string | null>(null);

  if (activeToken) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden">
        {/* Viewport Header */}
        <header className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur-md flex-shrink-0 flex items-center px-8 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">
              iBot <span className="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded px-1.5 py-0.5 ml-1 bg-indigo-50">Interview Room</span>
            </span>
          </div>
          <button
            onClick={() => setActiveToken(null)}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
          >
            Exit Session
          </button>
        </header>

        {/* Live Interview Engine */}
        <div className="flex-1 min-h-0 bg-gray-50 flex flex-col">
          <InterviewRoom token={activeToken} onExit={() => setActiveToken(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-8">
      {/* Radio Header */}
      <div className="border border-indigo-200 bg-indigo-50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-600 shrink-0">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1 flex-1">
            <h2 className="text-sm font-bold text-indigo-950">Test Interview Connection</h2>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Generate a candidate invitation token by adding a candidate in the Candidates tab, or copy a token from your logs, then paste it below to launch a live AI interview session.
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="token-input" className="text-xs font-bold text-gray-700">
            Candidate Invitation Token (UUID)
          </label>
          <div className="flex gap-2">
            <input
              id="token-input"
              type="text"
              value={interviewToken}
              onChange={(e) => setInterviewToken(e.target.value)}
              placeholder="Paste invitation token UUID (e.g. 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d4bad)…"
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
            />
            <button
              id="btn-launch-interview"
              disabled={!interviewToken.trim()}
              onClick={() => setActiveToken(interviewToken.trim())}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
            >
              Launch Session
            </button>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <div className="flex gap-3 text-xs text-gray-500 border border-gray-200 bg-gray-50 rounded-xl p-4">
        <ShieldAlert className="h-4.5 w-4.5 text-gray-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Note:</strong> Starting an interview connection will request microphone permissions. Make sure your browser allows microphone access for simulated voice assessment tests.
        </p>
      </div>
    </div>
  );
};
