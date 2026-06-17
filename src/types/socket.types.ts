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
  replyType?: string;
}

// ── Connection status ─────────────────────────────────────────────────────────

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

// ── Interview section info ────────────────────────────────────────────────────

export interface SectionInfo {
  sectionName: string;
  skill: string;
  timeBudgetSecs: number;
  sectionNumber: number;
  totalSections: number;
}

// ── Interview state exposed to UI ─────────────────────────────────────────────

export interface InterviewMeta {
  currentSection: SectionInfo | null;
  isInterviewComplete: boolean;
  isTerminated: boolean;
  isBotSpeaking: boolean;
}

// ── Hook options ──────────────────────────────────────────────────────────────

export interface UseInterviewSocketOptions {
  /** Candidate invitation token (UUID) */
  token: string;
  /** Connect immediately on mount (default: false) */
  autoConnect?: boolean;
}
