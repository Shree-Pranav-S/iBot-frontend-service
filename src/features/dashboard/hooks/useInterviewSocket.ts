/**
 * useInterviewSocket
 *
 * Manages the WebSocket lifecycle for a real-time AI interview session.
 * Connects through the gateway at /ws/interview?token=<invitation_token>.
 *
 * The hook exposes:
 *  - messages      : ordered list of chat messages (transcripts + assistant replies)
 *  - status        : 'idle' | 'connecting' | 'connected' | 'error' | 'closed'
 *  - sendText      : send a typed message to the interview AI
 *  - startSession  : trigger session_start (fires LLM greeting)
 *  - stopSession   : send stop + close the socket
 *  - sendAudioChunk: forward a raw PCM/opus binary chunk to the server
 *  - lastAudioBytes: the most recent TTS MP3 blob from the server (play it!)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../../config/api';
import type { MessageRole, ChatMessage, SocketStatus, UseInterviewSocketOptions } from '../../../types/socket.types';

export type { MessageRole, ChatMessage, SocketStatus };

// ── hook ──────────────────────────────────────────────────────────────────────

export function useInterviewSocket({
  token,
  autoConnect = false,
}: UseInterviewSocketOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SocketStatus>('idle');
  const [lastAudioBytes, setLastAudioBytes] = useState<Blob | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  // Tracks whether next binary frame is expected TTS audio
  const expectAudioRef = useRef(false);

  // ── internal helpers ────────────────────────────────────────────────────────

  const pushMessage = useCallback(
    (role: MessageRole, text: string, isFinal = true) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          role,
          text,
          isFinal,
          timestamp: new Date(),
        },
      ]);
    },
    [],
  );

  const updateLastPartial = useCallback((text: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'user' && !last.isFinal) {
        return [...prev.slice(0, -1), { ...last, text }];
      }
      return [
        ...prev,
        {
          id: `partial-${Date.now()}`,
          role: 'user' as MessageRole,
          text,
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
            updateLastPartial(payload.text ?? '');
            break;

          case 'final_transcript':
            // Replace the partial with a final user message
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'user' && !last.isFinal) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: payload.text ?? last.text, isFinal: true },
                ];
              }
              return [
                ...prev,
                {
                  id: `final-${Date.now()}`,
                  role: 'user' as MessageRole,
                  text: payload.text ?? '',
                  isFinal: true,
                  timestamp: new Date(),
                },
              ];
            });
            break;

          case 'assistant_text':
            pushMessage('assistant', payload.text ?? '');
            break;

          case 'tts_audio':
            // Next binary frame will be audio — flag it
            expectAudioRef.current = true;
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
      setStatus('closed');
      wsRef.current = null;
    };
  }, [token, pushMessage, updateLastPartial]);

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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop', payload: {} }));
      wsRef.current.close(1000, 'Session ended by user');
    }
  }, []);

  // ── auto-connect ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      wsRef.current?.close(1000, 'Component unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    status,
    lastAudioBytes,
    connect,
    startSession,
    sendText,
    sendAudioChunk,
    stopSession,
  };
}
