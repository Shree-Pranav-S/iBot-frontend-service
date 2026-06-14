/**
 * socket.types.ts
 *
 * Types for the WebSocket interview session hook (useInterviewSocket).
 */

// ── Message contract ──────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  isFinal?: boolean;
  timestamp: Date;
}

// ── Connection status ─────────────────────────────────────────────────────────

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

// ── Hook options ──────────────────────────────────────────────────────────────

export interface UseInterviewSocketOptions {
  /** Candidate invitation token (UUID) */
  token: string;
  /** Connect immediately on mount (default: false) */
  autoConnect?: boolean;
}
