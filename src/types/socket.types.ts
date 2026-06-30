/**
 * socket.types.ts
 *
 * Types for the WebSocket interview session hook (useInterviewSocket).
 */

// ── Message contract ──────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  isFinal?: boolean;
  timestamp: Date;
  replyType?: string;
}
