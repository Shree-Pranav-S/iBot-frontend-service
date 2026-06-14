/**
 * auth.types.ts
 *
 * Types and interfaces for authentication, user session, and context.
 */

import type { APIResponse } from './api.types';

// ── User / session ────────────────────────────────────────────────────────────

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  company_name?: string;
}

// ── Auth context ──────────────────────────────────────────────────────────────

export interface AuthContextType {
  /** Authenticated recruiter profile — null when logged out. */
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RecruiterRegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// ── Request types ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RecruiterRegisterRequest {
  full_name: string;
  email: string;
  password: string;
  company_name: string;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface RecruiterResponse {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  is_active: boolean;
  created_at: string;
}

// ── Component prop types ─────────────────────────────────────────────────────

export interface LoginFormProps {
  onToggleView: () => void;
}

export interface RegisterFormProps {
  onToggleView: () => void;
}

// Re-export so callers can import everything auth-related from one place
export type { APIResponse };
