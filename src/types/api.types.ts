/**
 * api.types.ts
 *
 * Shared HTTP response envelope types used by all service modules.
 * Centralised here to avoid duplication across auth.ts and assessment.ts.
 */

// ── Generic API envelope ───────────────────────────────────────────────────────

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
