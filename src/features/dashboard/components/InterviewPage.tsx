import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InterviewRoom } from './InterviewRoom';
import { WaitingRoom } from './WaitingRoom';
import { DemoInterviewRoom } from './DemoInterviewRoom';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  CANDIDATE_SESSION_STORAGE_KEY,
  type CandidateSessionBootstrapResponse,
} from '../services/livekit';

export const InterviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const invitationToken = searchParams.get('token')?.trim() || null;
  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    sessionStorage.getItem(CANDIDATE_SESSION_STORAGE_KEY),
  );
  const [view, setView] = useState<'waiting_room' | 'interview' | 'demo' | 'completed'>('waiting_room');
  const [durationMins, setDurationMins] = useState<number>(30);
  const [companyName, setCompanyName] = useState<string>('the company');

  const handleSessionReady = (session: CandidateSessionBootstrapResponse) => {
    sessionStorage.setItem(
      CANDIDATE_SESSION_STORAGE_KEY,
      session.session_token,
    );
    setSessionToken(session.session_token);
    setDurationMins(session.interview_duration_mins);
    setCompanyName(session.company_name || 'the company');

    if (invitationToken) {
      setSearchParams({}, { replace: true });
    }
    if (
      session.interview_started ||
      session.session_status === 'DISCONNECTED'
    ) {
      setView('interview');
    }
  };

  const clearCandidateSession = () => {
    sessionStorage.removeItem(CANDIDATE_SESSION_STORAGE_KEY);
    setSessionToken(null);
  };

  if (invitationToken || sessionToken) {
    if (view === 'waiting_room') {
      return (
        <WaitingRoom
          invitationToken={invitationToken}
          sessionToken={sessionToken}
          onStartInterview={() => setView('interview')}
          onStartDemo={() => setView('demo')}
          onSessionReady={handleSessionReady}
          onSessionInvalid={() => {
            if (!invitationToken) clearCandidateSession();
          }}
          onDetailsLoaded={(details) => {
            setDurationMins(details.interview_duration_mins);
            setCompanyName(details.company_name || 'the company');
          }}
        />
      );
    }

    if (view === 'demo') {
      return (
        <DemoInterviewRoom
          token={sessionToken!}
          onExit={() => setView('waiting_room')}
        />
      );
    }

    if (view === 'completed') {
      return (
        <div className="ibot-waiting-room-bg flex h-screen items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border border-white/80 bg-white/95 p-10 text-center shadow-2xl shadow-slate-900/10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-6 text-2xl font-black text-slate-950">Interview completed</h1>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
              Thank you for completing your interview for {companyName}. Your responses have been submitted successfully.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              The recruiting team will contact you if there are any next steps.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-white">
        <InterviewRoom
          token={sessionToken!}
          durationMins={durationMins}
          onComplete={() => {
            sessionStorage.removeItem(CANDIDATE_SESSION_STORAGE_KEY);
            setView('completed');
          }}
        />
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
