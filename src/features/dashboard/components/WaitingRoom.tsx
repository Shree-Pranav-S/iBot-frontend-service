import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Gauge,
  Headphones,
  Info,
  Loader2,
  Mic,
  Play,
  Shield,
  Sparkles,
  Square,
  Video,
  VideoOff,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import type { TokenValidationResponse } from '../../../types/candidate.types';
import { livekitService } from '../services/livekit';
import type { CandidateSessionBootstrapResponse } from '../../../types/livekit.types';
import { IbotMark } from '../../../components/ui/IbotMark';

interface WaitingRoomProps {
  invitationToken: string | null;
  sessionToken: string | null;
  onStartInterview: () => void;
  onStartDemo: () => void;
  onDetailsLoaded?: (details: TokenValidationResponse) => void;
  onSessionReady: (session: CandidateSessionBootstrapResponse) => void;
  onSessionInvalid: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  invitationToken,
  sessionToken,
  onStartInterview,
  onStartDemo,
  onDetailsLoaded,
  onSessionReady,
  onSessionInvalid,
}) => {
  const [details, setDetails] = useState<TokenValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [micStatus, setMicStatus] = useState<'idle' | 'granted' | 'denied' | 'checking'>('idle');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'granted' | 'denied' | 'checking'>('idle');
  const [cameraDeviceLabel, setCameraDeviceLabel] = useState<string | null>(null);
  const [micVolume, setMicVolume] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [latency, setLatency] = useState<number | null>(null);
  const [latencyChecking, setLatencyChecking] = useState(false);

  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const onDetailsLoadedRef = useRef(onDetailsLoaded);
  const onSessionReadyRef = useRef(onSessionReady);
  const onSessionInvalidRef = useRef(onSessionInvalid);
  const bootstrapRequestRef = useRef<{
    key: string;
    promise: Promise<CandidateSessionBootstrapResponse>;
  } | null>(null);
  const lastVolumeUpdateRef = useRef(0);
  const lastVolumeRef = useRef(0);

  useEffect(() => {
    onDetailsLoadedRef.current = onDetailsLoaded;
    onSessionReadyRef.current = onSessionReady;
    onSessionInvalidRef.current = onSessionInvalid;
  }, [onDetailsLoaded, onSessionInvalid, onSessionReady]);

  const checkLatency = useCallback(async () => {
    setLatencyChecking(true);
    const start = Date.now();
    try {
      await fetch(
        import.meta.env.VITE_API_BASE_URL
          ? `${import.meta.env.VITE_API_BASE_URL}/health`
          : 'http://localhost:8002/health',
      );
      setLatency(Date.now() - start);
    } catch {
      setLatency(Date.now() - start);
    } finally {
      setLatencyChecking(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const credentialKey = invitationToken
      ? `invite:${invitationToken}`
      : sessionToken
        ? `session:${sessionToken}`
        : 'missing';
    let loadSession = bootstrapRequestRef.current?.key === credentialKey
      ? bootstrapRequestRef.current.promise
      : null;
    if (!loadSession) {
      loadSession = invitationToken
        ? livekitService.enterCandidateSession(invitationToken)
        : sessionToken
          ? livekitService.restoreCandidateSession(sessionToken)
          : Promise.reject(new Error('No interview credential is available.'));
      bootstrapRequestRef.current = {
        key: credentialKey,
        promise: loadSession,
      };
    }

    loadSession
      .then((session) => {
        if (isMounted) {
          setDetails(session);
          onDetailsLoadedRef.current?.(session);
          onSessionReadyRef.current(session);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Could not validate invitation token. Please check your link.');
          onSessionInvalidRef.current();
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [invitationToken, sessionToken]);

  useEffect(() => {
    let initialLatencyTimer: ReturnType<typeof setTimeout> | null = null;
    const handleOnline = () => {
      setIsOnline(true);
      checkLatency();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setLatency(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      initialLatencyTimer = setTimeout(() => {
        void checkLatency();
      }, 0);
    }

    return () => {
      if (initialLatencyTimer) {
        clearTimeout(initialLatencyTimer);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkLatency]);

  const requestMicPermission = async () => {
    setMicStatus('checking');
    cleanupMic();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicStatus('granted');

      const AudioCtx =
        window.AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('AudioContext is not supported in this browser.');
      }
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i += 1) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const mapped = Math.min(100, Math.round((average / 80) * 100));
        const now = performance.now();

        if (
          now - lastVolumeUpdateRef.current >= 100 &&
          Math.abs(mapped - lastVolumeRef.current) >= 2
        ) {
          lastVolumeUpdateRef.current = now;
          lastVolumeRef.current = mapped;
          setMicVolume(mapped);
        }

        animationRef.current = requestAnimationFrame(updateVolume);
      };

      animationRef.current = requestAnimationFrame(updateVolume);
    } catch {
      setMicStatus('denied');
      setMicVolume(0);
    }
  };

  const cleanupMic = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    lastVolumeUpdateRef.current = 0;
    lastVolumeRef.current = 0;
  };

  const cleanupCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      cameraStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setCameraDeviceLabel(null);
  };

  const requestCameraPermission = async () => {
    setCameraStatus('checking');
    cleanupCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('No video track available.');
      }

      videoTrack.onended = () => {
        cleanupCamera();
        setCameraStatus('idle');
      };

      cameraStreamRef.current = stream;
      setCameraDeviceLabel(videoTrack.label || null);
      setCameraStatus('granted');
    } catch {
      cleanupCamera();
      setCameraStatus('denied');
    }
  };

  useEffect(() => {
    const video = videoPreviewRef.current;
    const stream = cameraStreamRef.current;
    if (!video || !stream || cameraStatus !== 'granted') {
      return;
    }

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }

    return () => {
      video.srcObject = null;
    };
  }, [cameraStatus]);

  useEffect(() => {
    return () => {
      cleanupMic();
      cleanupCamera();
    };
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const recorder = new MediaRecorder(streamRef.current);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);
      recorder.start();
      setIsRecording(true);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 4) {
            stopRecording();
            return 5;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start MediaRecorder', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const playRecordedAudio = () => {
    if (!audioUrl || !testAudioRef.current) return;
    setIsPlayingTest(true);
    testAudioRef.current.src = audioUrl;
    testAudioRef.current.play().catch(() => {
      setIsPlayingTest(false);
    });
  };

  const getLatencyLabel = (ms: number | null) => {
    if (ms === null) return { text: 'Disconnected', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-100' };
    if (ms < 100) return { text: `Excellent (${ms}ms)`, color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-100' };
    if (ms < 250) return { text: `Good (${ms}ms)`, color: 'text-teal-700', bg: 'bg-teal-50', ring: 'ring-teal-100' };
    return { text: `Needs attention (${ms}ms)`, color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-100' };
  };

  const getFormatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="ibot-candidate-shell ibot-waiting-room-bg flex h-screen flex-col items-center justify-center overflow-hidden p-6">
        <div className="relative">
          <div className="absolute -inset-5 animate-pulse rounded-full bg-brand-accent/20 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-hover shadow-xl shadow-brand-accent/10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <p className="mt-5 text-sm font-black text-slate-700">Preparing your waiting room</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">Verifying invitation and setup requirements.</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="ibot-candidate-shell ibot-waiting-room-bg flex h-screen items-center justify-center overflow-hidden p-6">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-red-100 bg-white/90 p-8 text-center shadow-2xl shadow-red-900/10 backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-950">Unable to join waiting room</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              {error || 'We encountered an error loading your interview details. The token may be invalid or expired.'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs font-medium leading-relaxed text-slate-500">
            Please make sure you copied the complete URL from your email invitation or reach out to your recruiter.
          </div>
        </div>
      </div>
    );
  }

  const latencyInfo = getLatencyLabel(latency);
  const isReady = micStatus === 'granted' && cameraStatus === 'granted' && isOnline;
  const completedChecks = [isOnline, micStatus === 'granted', cameraStatus === 'granted'].filter(Boolean).length;
  const setupPercent = Math.round((completedChecks / 3) * 100);
  const overviewItems = [
    'Keep this tab active during the interview.',
    'Use a quiet, well-lit room and speak naturally.',
    'Do not close the browser after the session starts.',
    'Complete the setup checks before joining live mode.',
  ];

  return (
    <div className="ibot-candidate-shell ibot-waiting-room-bg flex h-screen flex-col overflow-hidden text-[#1F1D1A]">
      <audio ref={testAudioRef} onEnded={() => setIsPlayingTest(false)} className="hidden" />

      <header className="z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-[#E6DED2] bg-white/92 px-6 shadow-sm shadow-[#1F1D1A]/5 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <IbotMark />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-black text-[#1F1D1A]">iBot</span>
              <span className="rounded-full border border-[#D9C4A7] bg-brand-soft px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-brand-hover">
                Waiting Room
              </span>
            </div>
            <p className="truncate text-xs font-semibold text-[#706A61]">Complete setup checks before joining.</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm sm:flex">
            <Clock className="h-3.5 w-3.5 text-brand-accent" />
            {details.interview_duration_mins} mins
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black shadow-sm ${
              isReady
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isReady ? 'Ready' : `${completedChecks}/3 checks`}
          </div>
        </div>
      </header>

      <main className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
        <div className="mx-auto grid min-h-full w-full max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="flex min-h-0 flex-col gap-5">
            <div className="ibot-hero-panel relative overflow-hidden rounded-2xl border border-white/80 p-5 shadow-xl shadow-slate-200/50 sm:p-6">
              <div className="relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Invitation verified
                </div>
                <h1 className="font-display text-3xl font-black text-slate-950 sm:text-4xl">
                  Welcome, {details.candidate_name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#706A61]">
                  Run the final checks below, then choose practice mode or start the live assessment. Test your camera and microphone here before joining.
                </p>

                <div className="mt-5 rounded-2xl border border-[#D9C4A7] bg-white/90 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400">Assessment</p>
                  <p className="mt-1 text-lg font-black text-brand-hover">{details.assessment_title}</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <InfoTile icon={<CalendarDays className="h-4 w-4" />} label="Valid Until" value={getFormatDate(details.window_end)} />
                  <InfoTile icon={<Clock className="h-4 w-4" />} label="Duration" value={`${details.interview_duration_mins} minutes`} />
                  <InfoTile icon={<Gauge className="h-4 w-4" />} label="Status" value={details.status} />
                </div>
              </div>
            </div>

            <div className="ibot-panel p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-950">Setup progress</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Camera, microphone, and connection checks protect interview quality.
                  </p>
                </div>
                <button
                  onClick={() => setInstructionsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D9C4A7] bg-brand-soft px-3 py-2 text-xs font-black text-brand-hover transition-all hover:border-brand-accent hover:bg-[#EAD7BE] active:scale-[0.98]"
                >
                  Interview rules
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
                  <span>{completedChecks} of 3 checks complete</span>
                  <span>{setupPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-hover transition-all duration-700"
                    style={{ width: `${setupPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {overviewItems.slice(0, 4).map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                      <p className="text-xs font-semibold leading-relaxed text-slate-600">{item}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-black text-amber-900">Proctored assessment</p>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-amber-800">
                      Browser focus, media input, and session continuity may be monitored for assessment integrity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="ibot-start-panel flex flex-col gap-4 rounded-2xl border border-[#E6DED2] p-5 shadow-xl shadow-brand-accent/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D9C4A7] bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-hover">
                  <Sparkles className="h-3 w-3" />
                  Final step
                </div>
                <p className="text-lg font-black text-slate-950">Ready to begin?</p>
                <p className={`mt-1 text-sm font-semibold ${isReady ? 'text-brand-hover' : 'text-red-600'}`}>
                  {isReady
                    ? 'Camera, microphone, and network checks are complete.'
                    : 'Enable camera and microphone access and stay online to continue.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onStartDemo}
                  disabled={!isReady}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-black transition-all active:scale-[0.98] ${
                    isReady
                      ? 'border-[#D9C4A7] bg-white text-brand-hover shadow-sm hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-soft hover:shadow-md'
                      : 'cursor-not-allowed border-slate-200 bg-white/60 text-slate-400'
                  }`}
                >
                  <Headphones className="h-4 w-4" />
                  Demo Interview
                </button>
                <button
                  onClick={() => setConfirmStartOpen(true)}
                  disabled={!isReady}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white transition-all active:scale-[0.98] ${
                    isReady
                      ? 'bg-brand-charcoal shadow-lg shadow-black/15 hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-brand-accent/15'
                      : 'cursor-not-allowed bg-slate-300 shadow-none'
                  }`}
                >
                  Start Interview
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-5">
            <div className="ibot-panel p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black text-slate-950">Connection Quality</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Needed for real-time speech processing.</p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    isOnline ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100'
                  }`}
                >
                  {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CheckCard
                  label="Network"
                  value={isOnline ? 'Online' : 'Offline'}
                  state={isOnline ? 'good' : 'bad'}
                />
                <div className={`rounded-xl p-4 ring-1 ${latencyInfo.bg} ${latencyInfo.ring}`}>
                  <p className="text-[10px] font-black uppercase text-slate-400">Latency</p>
                  <p className={`mt-1 text-sm font-black ${latencyInfo.color}`}>
                    {latencyChecking ? 'Checking...' : latencyInfo.text}
                  </p>
                </div>
              </div>

              <button
                onClick={checkLatency}
                disabled={latencyChecking || !isOnline}
                className="mt-4 w-full rounded-xl border border-[#E6DED2] bg-white px-3 py-2.5 text-xs font-black text-[#706A61] transition-all hover:border-brand-accent hover:bg-brand-soft hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retest Connection
              </button>
            </div>

            <div className="ibot-panel overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black text-slate-950">Camera Check</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Grant access and confirm your video preview.</p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    cameraStatus === 'granted'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                      : 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
                  }`}
                >
                  <Video className="h-5 w-5" />
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  {cameraStatus === 'granted' ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">
                      Permission required
                    </span>
                  )}
                  {cameraStatus !== 'granted' && (
                    <button
                      onClick={requestCameraPermission}
                      disabled={cameraStatus === 'checking'}
                      className="rounded-xl bg-brand-charcoal px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-brand-hover disabled:opacity-50"
                    >
                      {cameraStatus === 'checking' ? 'Checking...' : 'Enable Camera'}
                    </button>
                  )}
                </div>

                <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#D8CCBC] bg-brand-charcoal shadow-inner">
                  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/65 to-transparent px-4 pb-6 pt-3 text-white">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#E8C794]">Camera preview</p>
                      <p className="mt-0.5 text-[11px] font-bold">Your live video feed</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black ${
                        cameraStatus === 'granted'
                          ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
                          : 'border-white/20 bg-white/10 text-white/75'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          cameraStatus === 'granted' ? 'bg-emerald-400' : 'bg-white/45'
                        }`}
                      />
                      {cameraStatus === 'granted' ? 'Camera on' : 'Camera off'}
                    </span>
                  </div>

                  {cameraStatus === 'granted' ? (
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="aspect-video w-full scale-x-[-1] object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(185,131,63,0.2),transparent_38%)] px-6 text-center text-white">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#E8C794]">
                        <VideoOff className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-black">Camera preview unavailable</p>
                      <p className="mt-1 max-w-xs text-[11px] font-medium leading-relaxed text-white/55">
                        Enable camera access to verify lighting, framing, and that your video is working.
                      </p>
                    </div>
                  )}
                </div>

                {cameraStatus === 'granted' && (
                  <div className="mt-4 space-y-3">
                    {cameraDeviceLabel && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5">
                        <p className="text-[10px] font-black uppercase text-slate-400">Active device</p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{cameraDeviceLabel}</p>
                      </div>
                    )}
                    <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                      Confirm your face is clearly visible, well lit, and centered. You can adjust camera settings in the live interview room if needed.
                    </p>
                    <button
                      onClick={requestCameraPermission}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9C4A7] bg-white px-3 py-2 text-xs font-black text-brand-hover transition-all hover:bg-brand-soft"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Retest Camera
                    </button>
                  </div>
                )}

                {cameraStatus === 'denied' && (
                  <div className="mt-4 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="leading-relaxed">
                      Camera access was denied. Check browser permissions for this site, ensure no other app is using the camera, and reload the page.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="ibot-panel overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black text-slate-950">Microphone Check</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Grant access and verify playback.</p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    micStatus === 'granted'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                      : 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
                  }`}
                >
                  <Mic className="h-5 w-5" />
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  {micStatus === 'granted' ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">
                      Permission required
                    </span>
                  )}
                  {micStatus !== 'granted' && (
                    <button
                      onClick={requestMicPermission}
                      disabled={micStatus === 'checking'}
                      className="rounded-xl bg-brand-charcoal px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-brand-hover disabled:opacity-50"
                    >
                      {micStatus === 'checking' ? 'Checking...' : 'Enable Mic'}
                    </button>
                  )}
                </div>

                {micStatus === 'granted' && (
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="h-3.5 w-3.5" />
                          Input Activity
                        </span>
                        <span>{micVolume}%</span>
                      </div>
                      <div className="flex h-12 items-end gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                        {Array.from({ length: 18 }).map((_, index) => {
                          const filled = micVolume >= ((index + 1) / 18) * 100;
                          const height = 18 + ((index % 6) * 4);
                          return (
                            <span
                              key={index}
                              className={`flex-1 rounded-full transition-all duration-100 ${
                                filled ? 'bg-emerald-500' : 'bg-slate-200'
                              }`}
                              style={{ height: `${height}px` }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <h4 className="text-xs font-black text-slate-900">Playback Test</h4>
                      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
                        Record five seconds and play it back to confirm input and output.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            disabled={isPlayingTest}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9C4A7] bg-white px-3 py-2 text-xs font-black text-brand-hover transition-all hover:bg-brand-soft disabled:opacity-40"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Record 5s
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="inline-flex animate-pulse items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white transition-all hover:bg-red-600"
                          >
                            <Square className="h-3.5 w-3.5" />
                            Stop ({5 - recordingSeconds}s)
                          </button>
                        )}

                        {audioUrl && !isRecording && (
                          <button
                            onClick={playRecordedAudio}
                            disabled={isPlayingTest}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                              isPlayingTest
                                ? 'border border-slate-200 bg-white text-slate-400'
                                : 'border border-[#D9C4A7] bg-white text-brand-hover hover:bg-brand-soft'
                            }`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            {isPlayingTest ? 'Playing...' : 'Play Sample'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {micStatus === 'denied' && (
                  <div className="mt-4 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="leading-relaxed">
                      Microphone access was denied. Check browser permissions for this site and reload the page.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {instructionsOpen && (
        <ModalShell onClose={() => setInstructionsOpen(false)} maxWidth="max-w-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-accent" />
              <h3 className="text-base font-black text-slate-950">Detailed rules and guidelines</h3>
            </div>
            <button
              onClick={() => setInstructionsOpen(false)}
              className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="ibot-scrollbar max-h-[60vh] overflow-y-auto px-6 py-5 text-sm leading-relaxed text-slate-600">
            <p className="font-semibold">
              Review these mandatory proctoring rules before starting the automated AI interview.
            </p>

            <div className="mt-5 space-y-3">
              {[
                'Maintain focus on the interview tab. Switching tabs or opening developer tools may be flagged.',
                `The session runs continuously once launched. Make sure you are free for the full ${details.interview_duration_mins} minutes.`,
                'Use a quiet, well-lit environment so speech transcription and video remain clear.',
                'Test your camera and microphone in the waiting room before joining the live session.',
                'If your internet drops, do not close the tab. The client will try to reconnect automatically.',
              ].map((rule) => (
                <div key={rule} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-accent" />
                  <p className="text-xs font-semibold leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3 rounded-2xl border border-[#D9C4A7] bg-brand-soft p-4 text-brand-hover">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
              <p className="text-xs font-semibold leading-relaxed">
                By starting the assessment, you acknowledge that your camera and microphone will be active in the live room and that your responses may be transcribed, analyzed, and shared with the recruitment team.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button
              onClick={() => setInstructionsOpen(false)}
              className="rounded-xl bg-brand-charcoal px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-brand-hover"
            >
              I Understand
            </button>
          </div>
        </ModalShell>
      )}

      {confirmStartOpen && (
        <ModalShell onClose={() => setConfirmStartOpen(false)} maxWidth="max-w-md">
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-950">Start the live interview?</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                You will enter a proctored interview environment with camera and microphone access. Browser focus, media input, and the assessment timeline may be monitored.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmStartOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition-all hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                id="btn-confirm-start-interview"
                onClick={() => {
                  setConfirmStartOpen(false);
                  onStartInterview();
                }}
                className="flex-1 rounded-xl bg-brand-charcoal px-4 py-3 text-xs font-black text-white shadow-lg shadow-black/10 transition-all hover:bg-brand-hover"
              >
                Start Now
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

const InfoTile: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-hover ring-1 ring-[#D9C4A7]">
      {icon}
    </div>
    <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
    <p className="mt-1 text-xs font-black text-slate-800">{value}</p>
  </div>
);

const CheckCard: React.FC<{ label: string; value: string; state: 'good' | 'bad' }> = ({
  label,
  value,
  state,
}) => (
  <div className={`rounded-xl p-4 ring-1 ${state === 'good' ? 'bg-emerald-50 ring-emerald-100' : 'bg-red-50 ring-red-100'}`}>
    <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
    <p className={`mt-1 text-sm font-black ${state === 'good' ? 'text-emerald-700' : 'text-red-600'}`}>
      {value}
    </p>
  </div>
);

const ModalShell: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  maxWidth: string;
}> = ({ children, onClose, maxWidth }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-brand-charcoal/65 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative w-full ${maxWidth} overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl animate-scaleIn`}>
      {children}
    </div>
  </div>
);
