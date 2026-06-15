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
    if (ms < 250) return { text: `Good (${ms}ms)`, color: "text-indigo-600", bg: "bg-indigo-50" };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/20 flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-indigo-100 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 relative" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">
          Entering Waiting Room...
        </p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-white border border-gray-200 rounded-2xl shadow-xl text-center space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-red-500 mx-auto">
            <AlertTriangle className="h-7 w-7 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Unable to Join Waiting Room</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {error || "We encountered an error loading your interview details. The token may be invalid or expired."}
            </p>
          </div>
          <div className="pt-2 text-xs text-gray-400 border-t border-gray-100">
            Please make sure you have copied the correct URL from your email invitation or reach out to your recruiter.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50/20 flex flex-col">
      {/* Hidden tester audio element */}
      <audio
        ref={testAudioRef}
        onEnded={() => setIsPlayingTest(false)}
        className="hidden"
      />

      {/* Dynamic Header */}
      <header className="h-16 border-b border-gray-200 bg-white/70 backdrop-blur-md sticky top-0 z-30 flex items-center px-8 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900">
            iBot <span className="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded px-2 py-0.5 ml-1.5 bg-indigo-50">Waiting Room</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            Duration: {details.interview_duration_mins} Mins
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Candidate & Assessment Details */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Welcome Banner */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-50/40 blur-3xl pointer-events-none" />
            <div className="space-y-4 relative">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                AI Interview Prep
              </span>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Welcome, {details.candidate_name}!
                </h1>
                <p className="text-sm text-gray-500">
                  You are invited to take the interview for the role of:
                </p>
                <div className="text-xl font-semibold text-indigo-600 mt-1">
                  {details.assessment_title}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-y-2 justify-between text-xs text-gray-500">
                <div>
                  Invitation Validity: <span className="font-semibold text-gray-800">{getFormatDate(details.window_end)}</span>
                </div>
                <div>
                  Current Status: <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-md bg-amber-50 text-amber-800 border border-amber-200 uppercase">{details.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Rules & View Instructions Button */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900">Interview Overview & Rules</h2>
              </div>
              <button
                onClick={() => setInstructionsOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-4 flex items-center gap-1"
              >
                View Detailed Rules <Info className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              This is a fully automated, AI-driven technical and behavioural interview. Please review the instructions and complete the system checks to verify your setup before launching the session.
            </p>

            <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl flex gap-3 text-xs text-amber-800">
              <Shield className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Proctored Assessment Warning</p>
                <p className="leading-relaxed text-amber-700 text-[11px]">
                  Navigating away from the window, closing tabs, or using external browser aids will be flagged by our monitoring engine. Please complete the checks on the right before launching.
                </p>
              </div>
            </div>
          </div>

          {/* Action start button area */}
          <div className="flex justify-end items-center gap-4 pt-2">
            <button
              onClick={onStartDemo}
              disabled={micStatus !== "granted" || !isOnline}
              className={`flex items-center gap-2 rounded-xl px-6 py-4 text-sm font-bold border transition-all ${
                micStatus === "granted" && isOnline
                  ? "border-indigo-600 text-indigo-600 hover:bg-indigo-50/50 hover:-translate-y-0.5 active:translate-y-0"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Attend Demo Interview
            </button>
            <button
              onClick={() => setConfirmStartOpen(true)}
              disabled={micStatus !== "granted" || !isOnline}
              className={`flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white transition-all shadow-md ${
                micStatus === "granted" && isOnline
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gray-300 cursor-not-allowed shadow-none"
              }`}
            >
              Start Interview
            </button>
          </div>
          {micStatus !== "granted" && (
            <p className="text-right text-xs font-medium text-red-500 animate-pulse">
              ⚠️ Please allow and test your microphone to start the interview.
            </p>
          )}

        </section>

        {/* Right Column: Compatibility Checks */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* Equipment Checks Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Compatibility & Setup Checks</h2>
              <p className="text-xs text-gray-500 mt-1">Ensure your system complies with testing rules.</p>
            </div>

            {/* Check 1: Internet Connection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${isOnline ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                    {isOnline ? <Wifi className="h-4.5 w-4.5" /> : <WifiOff className="h-4.5 w-4.5" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Internet Connection</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Required for real-time speech processing</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOnline ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              {isOnline && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[11px] text-gray-500">Latency to Gateway:</span>
                    <span className={`font-semibold ${getLatencyLabel(latency).color}`}>
                      {latencyChecking ? "checking..." : getLatencyLabel(latency).text}
                    </span>
                  </div>
                  <button
                    onClick={checkLatency}
                    disabled={latencyChecking}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                    Retest
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            {/* Check 2: Microphone Check */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${micStatus === "granted" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-gray-400"}`}>
                    <Mic className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">Microphone Input</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Speak clearly into your microphone</p>
                  </div>
                </div>
                
                {micStatus === "granted" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                ) : (
                  <button
                    onClick={requestMicPermission}
                    disabled={micStatus === "checking"}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                  >
                    {micStatus === "checking" ? "Checking..." : "Enable Mic"}
                  </button>
                )}
              </div>

              {/* Live Mic Meter & Test Record */}
              {micStatus === "granted" && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                  {/* Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span className="flex items-center gap-1 font-medium"><Volume2 className="h-3 w-3" /> Microphone Activity</span>
                      <span className="font-bold">{micVolume}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-75"
                        style={{ width: `${micVolume}%` }}
                      />
                    </div>
                  </div>

                  {/* Playback tester recorder */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-3">
                    <h4 className="text-[11px] font-bold text-gray-700">Test Your Audio Playback</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Record a 5-second snippet and play it back to verify your audio input and output volume.
                    </p>

                    <div className="flex items-center gap-3">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          disabled={isPlayingTest}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 disabled:opacity-40"
                        >
                          <Play className="h-3 w-3" /> Record 5s Clip
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 text-xs font-bold px-3 py-2 animate-pulse"
                        >
                          <Square className="h-3 w-3" /> Stop ({5 - recordingSeconds}s)
                        </button>
                      )}

                      {audioUrl && !isRecording && (
                        <button
                          onClick={playRecordedAudio}
                          disabled={isPlayingTest}
                          className={`flex items-center gap-1.5 rounded-lg text-xs font-bold px-3 py-2 transition-all ${
                            isPlayingTest
                              ? "bg-slate-100 border border-slate-200 text-slate-400"
                              : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
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
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex gap-2.5 text-xs text-red-800">
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Microphone access was denied. Please check your browser permission settings for this site and reload the page.
                  </p>
                </div>
              )}
            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-gray-200 bg-white text-center text-xs text-gray-400 mt-12 flex-shrink-0">
        iBot Assessment System &copy; 2026. All rights reserved.
      </footer>

      {/* MODAL 1: INTERVIEW RULES AND INSTRUCTIONS */}
      {instructionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setInstructionsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Detailed Rules & Guidelines</h3>
              </div>
              <button
                onClick={() => setInstructionsOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-gray-600 leading-relaxed pr-1">
              <p>
                Welcome to your automated AI interview. Please review the mandatory proctoring rules below. Violating these rules will terminate the test or flag flags on the recruiter dashboard:
              </p>

              <div className="space-y-3">
                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-bold text-gray-800">Proctored Browser Focus:</span> You must maintain focus on the interview tab. Switching tabs, opening developer tools, or resizing the browser window is strictly monitored and flagged.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-bold text-gray-800">No Session Pause:</span> The interview runs continuously in real-time. Once launched, you cannot pause or restart the session. Make sure you are free for the entire {details.interview_duration_mins} minutes.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-bold text-gray-800">Environment Requirements:</span> Ensure you are in a well-lit, quiet room. Background noise or third-party interference will disrupt the Speech-to-Text transcriber and may result in poor grading.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-bold text-gray-800">Always-On Microphone:</span> The AI engine processes answers in real-time. Do not mute or unplug your microphone during speech turns.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-bold text-gray-800">System Interruption:</span> In case of a sudden internet drop, do not close the tab. The client will try to reconnect automatically, or you can click "Reconnect" in the interview room.
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800 flex gap-2">
                <Shield className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  By starting the assessment, you acknowledge that your responses and audio interactions will be transcribed, analyzed, and shared with the recruitment team for candidate evaluation.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-3 flex justify-end">
              <button
                onClick={() => setInstructionsOpen(false)}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 font-semibold text-white transition-all shadow-sm"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM INTERVIEW START */}
      {confirmStartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setConfirmStartOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-gray-900">Are you sure you want to start the interview?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                By doing so, you will be redirected to a proctored environment where your browser workspace, audio input, and assessment timeline will be continuously monitored to ensure test integrity.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmStartOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-700 transition-all"
              >
                No, Go Back
              </button>
              <button
                id="btn-confirm-start-interview"
                onClick={() => {
                  setConfirmStartOpen(false);
                  onStartInterview();
                }}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-indigo-100"
              >
                Yes, Start Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
