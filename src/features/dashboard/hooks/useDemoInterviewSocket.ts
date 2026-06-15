/**
 * useDemoInterviewSocket
 *
 * Manages the WebSocket lifecycle for a real-time practice AI interview session.
 * Connects through the gateway at /ws/interview/demo?token=<invitation_token>.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../../config/api';
import type { MessageRole, ChatMessage, SocketStatus, UseInterviewSocketOptions } from '../../../types/socket.types';

export function useDemoInterviewSocket({
  token,
  autoConnect = false,
}: UseInterviewSocketOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SocketStatus>('idle');
  const [lastAudioBytes, setLastAudioBytes] = useState<Blob | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const expectAudioRef = useRef(false);

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

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    const url = `${wsBase}/ws/interview/demo?token=${encodeURIComponent(token)}`;

    setStatus('connecting');
    setMessages([]);
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const blob = new Blob([event.data], { type: 'audio/mpeg' });
        setLastAudioBytes(blob);
        expectAudioRef.current = false;
        return;
      }

      try {
        const msg = JSON.parse(event.data as string);
        const type: string = msg.type;
        const payload = msg.payload ?? {};

        switch (type) {
          case 'connection_ack':
            pushMessage('system', payload.message ?? 'Practice session connected.');
            break;

          case 'partial_transcript':
            updateLastPartial(payload.text ?? '');
            break;

          case 'final_transcript':
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
        // ignore
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
