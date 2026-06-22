import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Square,
  Volume2,
  Info,
  Shield,
  Loader2,
  X,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { candidateService } from "../services/candidate";
import type { TokenValidationResponse } from "../../../types/candidate.types";

interface WaitingRoomProps {
  token: string;
  onStartInterview: () => void;
  onStartDemo: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  token,
  onStartInterview,
  onStartDemo,
}) => {
  const [details, setDetails] = useState<TokenValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mic states
  const [micStatus, setMicStatus] = useState<"idle" | "granted" | "denied" | "checking">("idle");
  const [micVolume, setMicVolume] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Network states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [latency, setLatency] = useState<number | null>(null);
  const [latencyChecking, setLatencyChecking] = useState(false);

  // Modal states
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);

  // Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<any>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch Token Details
  useEffect(() => {
    let isMounted = true;
    candidateService
      .validateCandidateToken(token)
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setDetails(res.data);
          } else {
            setError(res.message || "Failed to validate invitation token.");
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Could not validate invitation token. Please check your link.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Connection Monitor & Latency Test
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkLatency();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setLatency(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (navigator.onLine) {
      checkLatency();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkLatency = async () => {
    setLatencyChecking(true);
    const start = Date.now();
    try {
      // Fetch core api health endpoint to estimate latency
      await fetch(import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/health` : "http://localhost:8002/health");
      setLatency(Date.now() - start);
    } catch (err) {
      // Fallback
      setLatency(Date.now() - start);
    } finally {
      setLatencyChecking(false);
    }
  };

  // 3. Microphone Check
  const requestMicPermission = async () => {
    setMicStatus("checking");
    cleanupMic();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicStatus("granted");

      // Setup audio analyzer for volume meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Map average volume from 0-128 range to 0-100 percentage
        const mapped = Math.min(100, Math.round((average / 80) * 100));
        setMicVolume(mapped);
        animationRef.current = requestAnimationFrame(updateVolume);
      };

      animationRef.current = requestAnimationFrame(updateVolume);
    } catch (err) {
      setMicStatus("denied");
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
  };

  useEffect(() => {
    return () => cleanupMic();
  }, []);

  // 4. Record & Playback Audio Clip Test
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
        const blob = new Blob(chunks, { type: "audio/webm" });
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
      console.error("Failed to start MediaRecorder", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
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

  // 5. Utility formatting
  const getLatencyLabel = (ms: number | null) => {
    if (ms === null) return { text: "Disconnected", color: "text-red-500", bg: "bg-red-50" };
    if (ms < 100) return { text: `Excellent (${ms}ms)`, color: "text-emerald-600", bg: "bg-emerald-50" };
    if (ms < 250) return { text: `Good (${ms}ms)`, color: "text-teal-600", bg: "bg-teal-50" };
    return { text: `Poor (${ms}ms)`, color: "text-amber-600", bg: "bg-amber-50" };
  };

  const getFormatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 p-6">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-emerald-100 blur-xl animate-pulse" />
          <Loader2 className="relative h-10 w-10 animate-spin text-emerald-600" />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-500">Preparing your waiting room...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
        <div className="w-full max-w-md space-y-5 rounded-lg border border-red-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-950">Unable to Join Waiting Room</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              {error || "We encountered an error loading your interview details. The token may be invalid or expired."}
            </p>
          </div>
          <div className="border-t border-slate-100 pt-4 text-xs font-medium leading-relaxed text-slate-400">
            Please make sure you copied the complete URL from your email invitation or reach out to your recruiter.
          </div>
        </div>
      </div>
    );
  }

  const latencyInfo = getLatencyLabel(latency);
  const isReady = micStatus === "granted" && isOnline;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <audio
        ref={testAudioRef}
        onEnded={() => setIsPlayingTest(false)}
        className="hidden"
      />

      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-md shadow-emerald-900/10"
            style={{ background: "linear-gradient(135deg, #10b981, #0f766e)" }}
          >
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-slate-950">iBot</span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Waiting Room
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">Complete checks before joining the interview</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {details.interview_duration_mins} mins
          </div>
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${
            isReady
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isReady ? "bg-emerald-500" : "bg-amber-500"}`} />
            {isReady ? "Ready" : "Checks pending"}
          </div>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-12 gap-4 p-5">
        <section className="col-span-7 grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
          <div className="ibot-surface ibot-grid-bg rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Invitation verified
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Welcome, {details.candidate_name}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">You are invited to interview for</p>
            <div className="mt-3 rounded-lg border border-emerald-100 bg-white px-4 py-3">
              <p className="text-lg font-black text-emerald-700">{details.assessment_title}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="font-bold uppercase tracking-[0.16em] text-slate-400">Valid Until</p>
                <p className="mt-1 font-black text-slate-800">{getFormatDate(details.window_end)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="font-bold uppercase tracking-[0.16em] text-slate-400">Status</p>
                <p className="mt-1 font-black uppercase text-amber-700">{details.status}</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-black text-slate-950">Interview Overview</h2>
              </div>
              <button
                onClick={() => setInstructionsOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100"
              >
                Rules <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                "Keep this tab active during the interview.",
                "Use a quiet room and speak naturally into your mic.",
                "Do not close the browser after the session starts.",
                "Complete the setup checks before joining live mode.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">{item}</p>
                </div>
              ))}
            </div>
            <div className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-black text-amber-900">Proctored assessment</p>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed text-amber-800">
                    Browser focus, audio input, and session continuity may be monitored for integrity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-black text-slate-950">Ready to begin?</p>
              <p className={`mt-1 text-xs font-semibold ${isReady ? "text-emerald-700" : "text-red-500"}`}>
                {isReady ? "Microphone and network checks are complete." : "Enable microphone access and stay online to continue."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onStartDemo}
                disabled={!isReady}
                className={`flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black border transition-all ${
                  isReady
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Attend Demo Interview
              </button>
              <button
                onClick={() => setConfirmStartOpen(true)}
                disabled={!isReady}
                className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-black text-white transition-all shadow-sm ${
                  isReady
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10"
                    : "bg-slate-300 cursor-not-allowed shadow-none"
                }`}
              >
                Start Interview
              </button>
            </div>
          </div>
        </section>

        <aside className="col-span-5 grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-950">Connection Quality</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">Needed for real-time speech processing</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isOnline ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
              }`}>
                {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Network</p>
                <p className={`mt-1 text-sm font-black ${isOnline ? "text-emerald-700" : "text-red-600"}`}>
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
              <div className={`rounded-lg border border-slate-200 p-3 ${latencyInfo.bg}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Latency</p>
                <p className={`mt-1 text-sm font-black ${latencyInfo.color}`}>
                  {latencyChecking ? "Checking..." : latencyInfo.text}
                </p>
              </div>
            </div>
            <button
              onClick={checkLatency}
              disabled={latencyChecking || !isOnline}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Retest Connection
            </button>
          </div>

          <div className="min-h-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-slate-950">Microphone Check</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">Grant access and verify playback</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                micStatus === "granted" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
              }`}>
                <Mic className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                {micStatus === "granted" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                    Permission required
                  </span>
                )}
                {micStatus !== "granted" && (
                  <button
                    onClick={requestMicPermission}
                    disabled={micStatus === "checking"}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {micStatus === "checking" ? "Checking..." : "Enable Mic"}
                  </button>
                )}
              </div>

              {micStatus === "granted" && (
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5" /> Input Activity</span>
                      <span>{micVolume}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-75"
                        style={{ width: `${micVolume}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-xs font-black text-slate-800">Playback Test</h4>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                      Record five seconds and play it back to confirm audio input and output.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          disabled={isPlayingTest}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                        >
                          <Play className="h-3.5 w-3.5" /> Record 5s
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-black text-white animate-pulse hover:bg-red-600"
                        >
                          <Square className="h-3.5 w-3.5" /> Stop ({5 - recordingSeconds}s)
                        </button>
                      )}

                      {audioUrl && !isRecording && (
                        <button
                          onClick={playRecordedAudio}
                          disabled={isPlayingTest}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition-all ${
                            isPlayingTest
                              ? "border border-slate-200 bg-white text-slate-400"
                              : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          {isPlayingTest ? "Playing..." : "Play Sample"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {micStatus === "denied" && (
                <div className="mt-4 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="leading-relaxed">
                    Microphone access was denied. Check browser permissions for this site and reload the page.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {instructionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setInstructionsOpen(false)}
          />

          <div className="relative flex max-h-[86vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-950">Detailed Rules & Guidelines</h3>
              </div>
              <button
                onClick={() => setInstructionsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="ibot-scrollbar flex-1 overflow-y-auto py-4 pr-1 text-xs leading-relaxed text-slate-600">
              <p className="font-medium">
                Review these mandatory proctoring rules before starting the automated AI interview.
              </p>

              <div className="mt-4 space-y-3">
                {[
                  "Maintain focus on the interview tab. Switching tabs or opening developer tools may be flagged.",
                  `The session runs continuously once launched. Make sure you are free for the full ${details.interview_duration_mins} minutes.`,
                  "Use a quiet, well-lit environment so speech transcription remains accurate.",
                  "Keep your microphone available during speech turns and avoid muting it unexpectedly.",
                  "If your internet drops, do not close the tab. The client will try to reconnect automatically.",
                ].map((rule) => (
                  <div key={rule} className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <p>{rule}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3.5 text-emerald-800">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-[11px] leading-relaxed">
                  By starting the assessment, you acknowledge that your responses and audio interactions may be transcribed, analyzed, and shared with the recruitment team.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setInstructionsOpen(false)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmStartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setConfirmStartOpen(false)}
          />

          <div className="relative w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-base font-black text-slate-950">Start the live interview?</h3>
              <p className="text-xs leading-relaxed text-slate-500">
                You will enter a proctored interview environment. Browser focus, audio input, and assessment timeline may be monitored.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmStartOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition-all hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                id="btn-confirm-start-interview"
                onClick={() => {
                  setConfirmStartOpen(false);
                  onStartInterview();
                }}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
