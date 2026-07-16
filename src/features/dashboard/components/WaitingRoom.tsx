import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
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

const WAITING_ROOM_MEDIA_READY_KEY = 'ibot.waitingRoom.mediaReady';

const readRememberedMediaReady = () => {
  try {
    const raw = sessionStorage.getItem(WAITING_ROOM_MEDIA_READY_KEY);
    if (!raw) return { mic: false, camera: false };
    const parsed = JSON.parse(raw) as Partial<Record<'mic' | 'camera', boolean>>;
    return {
      mic: Boolean(parsed.mic),
      camera: Boolean(parsed.camera),
    };
  } catch {
    return { mic: false, camera: false };
  }
};

const rememberMediaReady = (kind: 'mic' | 'camera', ready: boolean) => {
  try {
    const current = readRememberedMediaReady();
    const next = { ...current, [kind]: ready };
    if (!next.mic && !next.camera) {
      sessionStorage.removeItem(WAITING_ROOM_MEDIA_READY_KEY);
      return;
    }
    sessionStorage.setItem(WAITING_ROOM_MEDIA_READY_KEY, JSON.stringify(next));
  } catch {
    // Session storage is only a convenience for the current waiting-room visit.
  }
};

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
  const [rememberedMediaReady] = useState(readRememberedMediaReady);
  const autoRestoreAttemptedRef = useRef(false);

  const [micStatus, setMicStatus] = useState<'idle' | 'granted' | 'denied' | 'checking'>(
    rememberedMediaReady.mic ? 'checking' : 'idle',
  );
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'granted' | 'denied' | 'checking'>(
    rememberedMediaReady.camera ? 'checking' : 'idle',
  );
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

  const cleanupMic = useCallback(() => {
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
  }, []);

  const requestMicPermission = useCallback(async () => {
    setMicStatus('checking');
    cleanupMic();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      rememberMediaReady('mic', true);
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
      rememberMediaReady('mic', false);
      setMicStatus('denied');
      setMicVolume(0);
    }
  }, [cleanupMic]);

  const cleanupCamera = useCallback(() => {
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
  }, []);

  const requestCameraPermission = useCallback(async () => {
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
        rememberMediaReady('camera', false);
        setCameraStatus('idle');
      };

      cameraStreamRef.current = stream;
      setCameraDeviceLabel(videoTrack.label || null);
      rememberMediaReady('camera', true);
      setCameraStatus('granted');
    } catch {
      cleanupCamera();
      rememberMediaReady('camera', false);
      setCameraStatus('denied');
    }
  }, [cleanupCamera]);

  useEffect(() => {
    if (autoRestoreAttemptedRef.current) return;
    autoRestoreAttemptedRef.current = true;

    const restoreTimer = window.setTimeout(() => {
      if (rememberedMediaReady.mic) {
        void requestMicPermission();
      }
      if (rememberedMediaReady.camera) {
        void requestCameraPermission();
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [rememberedMediaReady, requestCameraPermission, requestMicPermission]);

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
  }, [cleanupCamera, cleanupMic]);

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
      <div className="ibot-candidate-shell ibot-waiting-room-bg flex h-dvh flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
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
      <div className="ibot-candidate-shell ibot-waiting-room-bg flex h-dvh items-center justify-center overflow-hidden p-4 sm:p-6">
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
    'Use a quiet, well-lit room and speak naturally.',
    'Keep this tab open and active throughout the interview.',
    'Allow enough uninterrupted time to complete the session.',
  ];
  const readinessChecks = [
    {
      label: 'Connection',
      detail: isOnline ? (latencyChecking ? 'Checking quality…' : latencyInfo.text) : 'Offline',
      ready: isOnline,
      icon: isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />,
    },
    {
      label: 'Camera',
      detail: cameraStatus === 'granted' ? 'Camera ready' : cameraStatus === 'checking' ? 'Checking…' : 'Permission needed',
      ready: cameraStatus === 'granted',
      icon: cameraStatus === 'granted' ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />,
    },
    {
      label: 'Microphone',
      detail: micStatus === 'granted' ? 'Microphone ready' : micStatus === 'checking' ? 'Checking…' : 'Permission needed',
      ready: micStatus === 'granted',
      icon: <Mic className="h-4 w-4" />,
    },
  ];

  return (
    <div className="ibot-candidate-shell ibot-waiting-room-bg flex h-dvh min-w-0 flex-col overflow-hidden text-[#1F1D1A]">
      <audio ref={testAudioRef} onEnded={() => setIsPlayingTest(false)} className="hidden" />

      <header className="z-20 flex min-h-[68px] shrink-0 items-center justify-between gap-2 border-b border-[#E6DED2] bg-white/92 px-3 py-2 shadow-sm shadow-[#1F1D1A]/5 backdrop-blur-xl sm:h-[72px] sm:px-6 sm:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <IbotMark />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-black text-[#1F1D1A]">iBot</span>
              <span className="rounded-full border border-[#D9C4A7] bg-brand-soft px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-brand-hover">
                Waiting Room
              </span>
            </div>
            <p className="hidden truncate text-xs font-semibold text-[#706A61] sm:block">Complete setup checks before joining.</p>
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

      <main className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5">
          <section className="ibot-hero-panel relative overflow-hidden rounded-2xl border border-white/80 p-4 shadow-xl shadow-slate-200/50 sm:p-6">
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1.5 text-[11px] font-black text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Invitation verified
                </div>
                <h1 className="mt-3 font-display text-2xl font-black text-slate-950 sm:text-3xl">
                  Hi {details.candidate_name}, let’s get you ready
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-[#706A61]">
                  Complete the three checks below. When they are ready, you can practice or begin the live interview.
                </p>
              </div>
              <div className="min-w-0 rounded-2xl border border-[#D9C4A7] bg-white/90 p-4 shadow-sm lg:w-[360px]">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Your assessment</p>
                <p className="mt-1 truncate text-base font-black text-brand-hover">{details.assessment_title}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-brand-accent" />{details.interview_duration_mins} minutes</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-brand-accent" />Available until {getFormatDate(details.window_end)}</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-5">
              <div className="mb-2 flex items-center justify-between text-[11px] font-black text-slate-500">
                <span>{completedChecks} of 3 checks complete</span><span>{setupPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-hover transition-all duration-700" style={{ width: `${setupPercent}%` }} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {readinessChecks.map((check) => (
                  <div key={check.label} className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 ${check.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white/85 text-slate-600'}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${check.ready ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{check.icon}</span>
                    <span className="min-w-0"><span className="block text-xs font-black">{check.label}</span><span className="block truncate text-[10px] font-semibold opacity-75">{check.detail}</span></span>
                    {check.ready && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="ibot-panel overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-hover">Step 1</p><h2 className="mt-1 text-sm font-black text-slate-950">Check your camera</h2><p className="mt-1 text-xs font-semibold text-slate-500">Make sure your face is centered and clearly lit.</p></div>
                <button onClick={requestCameraPermission} disabled={cameraStatus === 'checking'} className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all disabled:opacity-50 ${cameraStatus === 'granted' ? 'border border-[#D9C4A7] bg-white text-brand-hover hover:bg-brand-soft' : 'bg-brand-charcoal text-white hover:bg-brand-hover'}`}>
                  {cameraStatus === 'checking' ? 'Checking…' : cameraStatus === 'granted' ? 'Retest camera' : 'Enable camera'}
                </button>
              </header>
              <div className="p-4 sm:p-5">
                <div className="relative overflow-hidden rounded-2xl border border-[#D8CCBC] bg-brand-charcoal shadow-inner">
                  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/65 to-transparent px-4 pb-6 pt-3 text-white">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#E8C794]">Camera preview</p>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${cameraStatus === 'granted' ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100' : 'border-white/20 bg-white/10 text-white/75'}`}>{cameraStatus === 'granted' ? 'Camera on' : 'Camera off'}</span>
                  </div>
                  {cameraStatus === 'granted' ? (
                    <video ref={videoPreviewRef} autoPlay muted playsInline className="aspect-video w-full scale-x-[-1] object-cover" />
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(185,131,63,0.2),transparent_38%)] px-6 text-center text-white">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#E8C794]"><VideoOff className="h-5 w-5" /></div>
                      <p className="mt-3 text-sm font-black">Enable your camera to preview your framing</p>
                    </div>
                  )}
                </div>
                {cameraStatus === 'granted' && cameraDeviceLabel && <p className="mt-3 truncate text-[10px] font-semibold text-slate-500">Using {cameraDeviceLabel}</p>}
                {cameraStatus === 'denied' && <div className="mt-3 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><p>Camera access was denied. Allow camera access in your browser settings, then retry.</p></div>}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="ibot-panel p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-hover">Step 2</p><h2 className="mt-1 text-sm font-black text-slate-950">Check your connection</h2><p className="mt-1 text-xs font-semibold text-slate-500">A stable connection keeps the conversation smooth.</p></div>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}</span>
                </div>
                <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl px-3 py-3 ring-1 ${latencyInfo.bg} ${latencyInfo.ring}`}><span className="text-xs font-black text-slate-700">{isOnline ? 'Online' : 'Offline'}</span><span className={`text-xs font-black ${latencyInfo.color}`}>{latencyChecking ? 'Checking…' : latencyInfo.text}</span></div>
                <button onClick={checkLatency} disabled={latencyChecking || !isOnline} className="mt-3 w-full rounded-xl border border-[#E6DED2] bg-white px-3 py-2.5 text-xs font-black text-[#706A61] hover:border-brand-accent hover:bg-brand-soft hover:text-brand-hover disabled:opacity-50">Retest connection</button>
              </div>

              <div className="ibot-panel p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-hover">Step 3</p><h2 className="mt-1 text-sm font-black text-slate-950">Check your microphone</h2><p className="mt-1 text-xs font-semibold text-slate-500">Speak normally and confirm the meter moves.</p></div>
                  <button onClick={requestMicPermission} disabled={micStatus === 'checking'} className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all disabled:opacity-50 ${micStatus === 'granted' ? 'border border-[#D9C4A7] bg-white text-brand-hover hover:bg-brand-soft' : 'bg-brand-charcoal text-white hover:bg-brand-hover'}`}>{micStatus === 'checking' ? 'Checking…' : micStatus === 'granted' ? 'Retest mic' : 'Enable mic'}</button>
                </div>
                {micStatus === 'granted' && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-black text-slate-500"><span className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5" />Input activity</span><span>{micVolume}%</span></div>
                    <div className="flex h-10 items-end gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      {Array.from({ length: 18 }).map((_, index) => <span key={index} className={`flex-1 rounded-full transition-all ${micVolume >= ((index + 1) / 18) * 100 ? 'bg-emerald-500' : 'bg-slate-200'}`} style={{ height: `${12 + ((index % 6) * 3)}px` }} />)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!isRecording ? <button onClick={startRecording} disabled={isPlayingTest} className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9C4A7] bg-white px-3 py-2 text-xs font-black text-brand-hover disabled:opacity-40"><Play className="h-3.5 w-3.5" />Record 5s</button> : <button onClick={stopRecording} className="inline-flex animate-pulse items-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white"><Square className="h-3.5 w-3.5" />Stop ({5 - recordingSeconds}s)</button>}
                      {audioUrl && !isRecording && <button onClick={playRecordedAudio} disabled={isPlayingTest} className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9C4A7] bg-white px-3 py-2 text-xs font-black text-brand-hover disabled:opacity-40"><Volume2 className="h-3.5 w-3.5" />{isPlayingTest ? 'Playing…' : 'Play sample'}</button>}
                    </div>
                  </div>
                )}
                {micStatus === 'denied' && <div className="mt-3 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><p>Microphone access was denied. Allow microphone access in your browser settings, then retry.</p></div>}
              </div>
            </div>
          </section>

          <section className="ibot-panel p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-brand-accent" /><h2 className="text-sm font-black text-slate-950">Before you begin</h2></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">{overviewItems.map((item) => <div key={item} className="flex gap-2 rounded-xl bg-slate-50 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" /><p className="text-[11px] font-semibold leading-relaxed text-slate-600">{item}</p></div>)}</div>
                <button onClick={() => setInstructionsOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-brand-hover hover:text-brand-charcoal"><Info className="h-3.5 w-3.5" />Read interview rules and privacy details</button>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 lg:max-w-sm"><div className="flex gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><p className="text-[11px] font-semibold leading-relaxed text-amber-900">This is a proctored assessment. Browser focus, media input, and session continuity may be monitored.</p></div></div>
            </div>
          </section>

          <section className="ibot-start-panel flex flex-col gap-4 rounded-2xl border border-[#E6DED2] p-4 shadow-xl shadow-brand-accent/10 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="inline-flex items-center gap-2 rounded-full border border-[#D9C4A7] bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-hover"><Sparkles className="h-3 w-3" />Final step</div><p className="mt-2 text-lg font-black text-slate-950">{isReady ? 'You’re ready to begin' : 'Complete all three checks'}</p><p className={`mt-1 text-sm font-semibold ${isReady ? 'text-brand-hover' : 'text-red-600'}`}>{isReady ? 'Practice first or start the live interview when you are comfortable.' : 'Camera, microphone, and connection must be ready before you continue.'}</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button onClick={onStartDemo} disabled={!isReady} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-black ${isReady ? 'border-[#D9C4A7] bg-white text-brand-hover hover:bg-brand-soft' : 'cursor-not-allowed border-slate-200 bg-white/60 text-slate-400'}`}><Headphones className="h-4 w-4" />Practice first</button>
              <button onClick={() => setConfirmStartOpen(true)} disabled={!isReady} className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white ${isReady ? 'bg-brand-charcoal shadow-lg shadow-black/15 hover:bg-brand-hover' : 'cursor-not-allowed bg-slate-300'}`}>Start interview<ChevronRight className="h-4 w-4" /></button>
            </div>
          </section>
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
