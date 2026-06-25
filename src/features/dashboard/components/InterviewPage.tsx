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
  const [durationMins, setDurationMins] = useState<number>(30);

  if (token) {
    if (view === 'waiting_room') {
      return (
        <WaitingRoom
          token={token}
          onStartInterview={() => setView('interview')}
          onStartDemo={() => setView('demo')}
          onDetailsLoaded={(details) => setDurationMins(details.interview_duration_mins)}
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
      <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-white">
        <InterviewRoom token={token} durationMins={durationMins} />
      </div>
    );
  }

  return (
    <div className="ibot-waiting-room-bg flex h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/80 bg-white/90 p-8 text-center shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-black text-slate-950">Invalid invitation link</h2>
        <p className="text-xs leading-relaxed text-slate-500">
          We could not find an interview invitation token in your link. Please use the complete URL provided in your invitation email.
        </p>
      </div>
      <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-[10px] text-slate-500">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="leading-relaxed">
          If you believe this is an error, please reach out to your recruiter to get a fresh invitation link.
        </p>
      </div>
      </div>
    </div>
  );
};
