/**
 * useInterviewSocket
 *
 * Manages the WebSocket lifecycle for a real-time AI interview session.
 * Connects through the gateway at /ws/interview?token=<invitation_token>.
 *
 * The hook exposes:
 *  - messages       : ordered list of chat messages (transcripts + assistant replies)
 *  - status         : 'idle' | 'connecting' | 'connected' | 'error' | 'closed'
 *  - sendText       : send a typed message to the interview AI
 *  - startSession   : trigger session_start (fires LLM greeting)
 *  - stopSession    : ask the server to end the interview and wait for evaluation
 *  - sendAudioChunk : forward a raw 16 kHz mono linear16 PCM chunk to the server
 *  - lastAudioBytes : the most recent TTS MP3 blob from the server (play it!)
 *  - interviewMeta  : section info, completion status, bot speaking state
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../../config/api';
import type {
  MessageRole,
  ChatMessage,
  SocketStatus,
  UseInterviewSocketOptions,
  InterviewMeta,
} from '../../../types/socket.types';

export type { MessageRole, ChatMessage, SocketStatus };

// ── hook ──────────────────────────────────────────────────────────────────────

export function useInterviewSocket({
  token,
  autoConnect = false,
}: UseInterviewSocketOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SocketStatus>('idle');
  const [lastAudioBytes, setLastAudioBytes] = useState<Blob | null>(null);
  const [interviewMeta, setInterviewMeta] = useState<InterviewMeta>({
    currentSection: null,
    isInterviewComplete: false,
    isTerminated: false,
    isBotSpeaking: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  // Tracks whether next binary frame is expected TTS audio
  const expectAudioRef = useRef(false);
  const activeCandidateMessageIdRef = useRef<string | null>(null);
  const stopFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── internal helpers ────────────────────────────────────────────────────────

  const pushMessage = useCallback(
    (role: MessageRole, text: string, isFinal = true, replyType?: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          role,
          text,
          isFinal,
          timestamp: new Date(),
          replyType,
        },
      ]);
    },
    [],
  );


  const updateActiveCandidateTranscript = useCallback((text: string) => {
    const incoming = String(text ?? '').trim();
    if (!incoming) return;

    setMessages((prev) => {
      const activeId = activeCandidateMessageIdRef.current;
      const activeIndex = activeId
        ? prev.findIndex((msg) => msg.id === activeId && msg.role === 'user' && !msg.isFinal)
        : -1;

      if (activeIndex >= 0) {
        return prev.map((msg, index) =>
          index === activeIndex
            ? { ...msg, text: incoming }
            : msg,
        );
      }

      const last = prev[prev.length - 1];
      if (last && last.role === 'user' && !last.isFinal) {
        activeCandidateMessageIdRef.current = last.id;
        return [...prev.slice(0, -1), { ...last, text: incoming }];
      }

      const id = `partial-${Date.now()}`;
      activeCandidateMessageIdRef.current = id;
      return [
        ...prev,
        {
          id,
          role: 'user' as MessageRole,
          text: incoming,
          isFinal: false,
          timestamp: new Date(),
        },
      ];
    });
  }, []);

  // ── connect ─────────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    const url = `${wsBase}/ws/interview?token=${encodeURIComponent(token)}`;

    setStatus('connecting');
    setMessages([]);
    activeCandidateMessageIdRef.current = null;
    setInterviewMeta({
      currentSection: null,
      isInterviewComplete: false,
      isTerminated: false,
      isBotSpeaking: false,
    });

    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      // Binary frame — TTS audio
      if (event.data instanceof ArrayBuffer) {
        const blob = new Blob([event.data], { type: 'audio/mpeg' });
        setLastAudioBytes(blob);
        expectAudioRef.current = false;
        return;
      }

      // Text frame — JSON envelope
      try {
        const msg = JSON.parse(event.data as string);
        const type: string = msg.type;
        const payload = msg.payload ?? {};

        switch (type) {
          case 'connection_ack':
            pushMessage('system', payload.message ?? 'Interview session connected.');
            break;

          case 'partial_transcript':
            updateActiveCandidateTranscript(payload.text ?? '');
            break;

          case 'final_transcript':
            setMessages((prev) => {
              const finalText = String(payload.text ?? '').trim();
              const activeId = activeCandidateMessageIdRef.current;
              activeCandidateMessageIdRef.current = null;

              if (activeId) {
                const activeIndex = prev.findIndex(
                  (message) => message.id === activeId && message.role === 'user',
                );
                if (activeIndex >= 0) {
                  return prev.map((message, index) =>
                    index === activeIndex
                      ? {
                          ...message,
                          text: finalText || message.text,
                          isFinal: true,
                          timestamp: new Date(),
                        }
                      : message,
                  );
                }
              }

              const last = prev[prev.length - 1];
              if (last && last.role === 'user' && !last.isFinal) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: finalText || last.text, isFinal: true },
                ];
              }

              return [
                ...prev,
                {
                  id: `final-${Date.now()}`,
                  role: 'user' as MessageRole,
                  text: finalText,
                  isFinal: true,
                  timestamp: new Date(),
                },
              ];
            });
            break;

          case 'assistant_text':
            pushMessage('assistant', payload.text ?? '', true, payload.reply_type);
            break;

          case 'tts_audio':
            expectAudioRef.current = true;
            break;

          case 'section_start':
            setInterviewMeta((prev) => ({
              ...prev,
              currentSection: {
                sectionName: payload.section_name ?? '',
                skill: payload.skill ?? '',
                timeBudgetSecs: payload.time_budget_secs ?? 0,
                sectionNumber: payload.section_number ?? 1,
                totalSections: payload.total_sections ?? 1,
              },
            }));
            break;

          case 'section_transition':
            setInterviewMeta((prev) => ({
              ...prev,
              currentSection: payload.to_section
                ? {
                    ...prev.currentSection!,
                    sectionName: payload.to_section,
                  }
                : prev.currentSection,
            }));
            break;

          case 'bot_speaking':
            setInterviewMeta((prev) => ({ ...prev, isBotSpeaking: true }));
            break;

          case 'bot_done_speaking':
            setInterviewMeta((prev) => ({ ...prev, isBotSpeaking: false }));
            break;

          case 'interview_complete':
            if (stopFallbackTimerRef.current) {
              clearTimeout(stopFallbackTimerRef.current);
              stopFallbackTimerRef.current = null;
            }
            setInterviewMeta((prev) => ({
              ...prev,
              isInterviewComplete: true,
              isBotSpeaking: false,
            }));
            break;

          case 'session_terminated':
            if (stopFallbackTimerRef.current) {
              clearTimeout(stopFallbackTimerRef.current);
              stopFallbackTimerRef.current = null;
            }
            setInterviewMeta((prev) => ({
              ...prev,
              isTerminated: true,
              isBotSpeaking: false,
            }));
            break;

          case 'time_warning':
            pushMessage(
              'system',
              `⏱ ${payload.seconds_remaining ?? 0}s remaining${payload.scope === 'section' ? ' in this section' : ' overall'}`,
            );
            break;

          case 'error':
            pushMessage('system', `Error: ${payload.message ?? 'Unknown error'}`);
            break;

          case 'pong':
            break;

          default:
            break;
        }
      } catch {
        // silently ignore malformed frames
      }
    };

    ws.onerror = () => {
      setStatus('error');
    };

    ws.onclose = () => {
      if (stopFallbackTimerRef.current) {
        clearTimeout(stopFallbackTimerRef.current);
        stopFallbackTimerRef.current = null;
      }
      setStatus('closed');
      wsRef.current = null;
    };
  }, [token, pushMessage, updateActiveCandidateTranscript]);

  // ── public API ──────────────────────────────────────────────────────────────

  const startSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'session_start', payload: {} }));
    }
  }, []);

  const sendText = useCallback(
    (text: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        pushMessage('user', text, true);
        wsRef.current.send(JSON.stringify({ type: 'text_message', payload: { text } }));
      }
    },
    [pushMessage],
  );

  const sendAudioChunk = useCallback((chunk: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(chunk);
    }
  }, []);

  const stopSession = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ type: 'stop', payload: {} }));

    if (stopFallbackTimerRef.current) {
      clearTimeout(stopFallbackTimerRef.current);
    }

    stopFallbackTimerRef.current = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Session end acknowledgement timed out');
      }
      stopFallbackTimerRef.current = null;
    }, 10000);
  }, []);

  // ── auto-connect ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      if (stopFallbackTimerRef.current) {
        clearTimeout(stopFallbackTimerRef.current);
        stopFallbackTimerRef.current = null;
      }
      wsRef.current?.close(1000, 'Component unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    status,
    lastAudioBytes,
    interviewMeta,
    connect,
    startSession,
    sendText,
    sendAudioChunk,
    stopSession,
  };
}
