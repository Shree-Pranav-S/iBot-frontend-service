import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InterviewRoom } from './InterviewRoom';
import { WaitingRoom } from './WaitingRoom';
import { DemoInterviewRoom } from './DemoInterviewRoom';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export const InterviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || null;
  const [view, setView] = useState<'waiting_room' | 'interview' | 'demo'>('waiting_room');

  if (token) {
    if (view === 'waiting_room') {
      return (
        <WaitingRoom
          token={token}
          onStartInterview={() => setView('interview')}
          onStartDemo={() => setView('demo')}
        />
      );
    }

    if (view === 'demo') {
      return (
        <DemoInterviewRoom
          token={token}
          onExit={() => setView('waiting_room')}
        />
      );
    }

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
        </header>

        {/* Live Interview Engine */}
        <div className="flex-1 min-h-0 bg-gray-50 flex flex-col">
          <InterviewRoom token={token} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-600 mx-auto">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-gray-950">Invalid Invitation Link</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          We could not find an interview invitation token in your link. Please use the complete URL provided in your invitation email.
        </p>
      </div>
      <div className="flex gap-3 text-[10px] text-gray-500 border border-gray-100 bg-gray-50 rounded-xl p-4 text-left">
        <ShieldAlert className="h-4.5 w-4.5 text-gray-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          If you believe this is an error, please reach out to your recruiter to get a fresh invitation link.
        </p>
      </div>
    </div>
  );
};
