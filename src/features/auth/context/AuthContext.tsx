/**
 * AuthContext — HttpOnly cookie session model.
 *
 * With cookies managed by the gateway, this context never touches raw tokens.
 * Session state is a lightweight UserInfo object populated from GET /auth/me.
 *
 * On mount:
 *   1. Call GET /auth/me — if the session cookie is valid the gateway forwards
 *      the request and core-api returns the recruiter profile.
 *   2. If the call succeeds, hydrate React state with the profile.
 *   3. If the call returns 401 (no valid cookie), stay logged-out silently.
 *
 * Login:
 *   POST /auth/login → gateway sets HttpOnly cookies → returns profile data.
 *   Store profile in React state (and optionally localStorage for UX hints
 *   like the greeting name — never tokens).
 *
 * Logout:
 *   POST /auth/logout → gateway reads refresh cookie, revokes DB record,
 *   clears both cookies → we clear React state.
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth';
import type { UserInfo, AuthContextType, LoginRequest, RecruiterRegisterRequest } from '../../../types/auth.types';

export type { UserInfo, AuthContextType };

// ── Context ───────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── Handle gateway-signalled session expiry ─────────────────────────────────
  // fetchWithAuth dispatches this event when the gateway returns 401
  // (meaning the silent refresh also failed).
  useEffect(() => {
    const handleSessionExpired = () => {
      // Clear any cached UX hints — no tokens to clear.
      localStorage.removeItem('recruiter_name');
      localStorage.removeItem('recruiter_company');
      setUser(null);
      setError('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  // ── Session restore on mount ────────────────────────────────────────────────
  // Call GET /auth/me to validate the session cookie. If valid the gateway
  // injects X-User-Id and core-api returns the full profile.
  // If the cookie is absent or expired the gateway returns 401 — we stay
  // logged out quietly (no error shown on first load).
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const response = await authService.getMe();
        if (!cancelled && response.success && response.data) {
          const profile = response.data;
          setUser({
            id: profile.id,
            email: profile.email,
            role: 'recruiter',
            full_name: profile.full_name,
            company_name: profile.company_name,
          });
          // Cache non-sensitive display data for greeting UX
          localStorage.setItem('recruiter_name', profile.full_name);
          localStorage.setItem('recruiter_company', profile.company_name);
        }
      } catch {
        // 401 = no valid session cookie — silently stay logged out.
        // Any other network error is also silent on mount.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      if (response.success && response.data) {
        const profile = response.data;
        setUser({
          id: profile.id,
          email: profile.email,
          role: 'recruiter',
          full_name: profile.full_name,
          company_name: profile.company_name,
        });
        // Cache display hints — not tokens.
        localStorage.setItem('recruiter_name', profile.full_name ?? '');
        localStorage.setItem('recruiter_company', profile.company_name ?? '');
      } else {
        throw new Error(response.message || 'Login failed.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred during login.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Register ────────────────────────────────────────────────────────────────
  const register = useCallback(async (payload: RecruiterRegisterRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      if (response.success) {
        // Auto-login after successful registration.
        await login({ email: payload.email, password: payload.password });
      } else {
        throw new Error(response.message || 'Registration failed.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred during registration.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    // Clear React state immediately for fast UI response.
    setUser(null);
    setError(null);
    localStorage.removeItem('recruiter_name');
    localStorage.removeItem('recruiter_company');

    // Tell the gateway to revoke the session and clear cookies.
    // Errors are swallowed — the local state is already cleared.
    try {
      await authService.logout();
    } catch (err) {
      console.error('Server-side logout failed:', err);
    }
  }, []);

  // ── Clear error ─────────────────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
