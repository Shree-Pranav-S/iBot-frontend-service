/**
 * auth.ts — Auth service (gateway cookie model, Axios version).
 *
 * The frontend never sees raw JWT values. Tokens live exclusively inside
 * HttpOnly cookies managed by the gateway. This service only deals with
 * recruiter profile data and plain success/error responses.
 */

import { api } from '../../../config/api';
import type { APIResponse } from '../../../types/api.types';
import type {
  LoginRequest,
  RecruiterRegisterRequest,
  RecruiterResponse,
} from '../../../types/auth.types';

export type { LoginRequest, RecruiterRegisterRequest, RecruiterResponse };

// ── Auth service ──────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Register a new recruiter account.
   * Returns the created profile — no tokens involved.
   */
  async register(
    payload: RecruiterRegisterRequest,
  ): Promise<APIResponse<RecruiterResponse>> {
    try {
      const response = await api.post<APIResponse<RecruiterResponse>>('/auth/register', payload);
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      const fieldErrors = data?.errors;
      if (fieldErrors?.length) {
        const details = fieldErrors
          .map((errItem: any) => {
            const field = errItem.field?.replace(/^body\./, '') ?? 'input';
            return `${field}: ${errItem.message}`;
          })
          .join(' ');
        throw new Error(details || data?.message || err.message);
      }
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Authenticate the recruiter.
   *
   * The gateway intercepts the upstream response, strips the raw tokens,
   * sets HttpOnly cookies, and returns only recruiter profile data.
   * JavaScript never sees the access or refresh token values.
   */
  async login(payload: LoginRequest): Promise<APIResponse<RecruiterResponse>> {
    try {
      const response = await api.post<APIResponse<RecruiterResponse>>('/auth/login', payload);
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Fetch the current recruiter's profile using the active session cookie.
   *
   * Called on app mount to restore session state without touching localStorage
   * for token data. The gateway validates the cookie before forwarding the
   * request; if the cookie is absent or expired it returns 401.
   */
  async getMe(): Promise<APIResponse<RecruiterResponse>> {
    try {
      const response = await api.get<APIResponse<RecruiterResponse>>('/auth/me');
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Logout the current session.
   *
   * The gateway reads the refresh cookie, calls core-api to revoke the DB
   * record, and then clears both cookies from the browser. No body is needed
   * from the frontend.
   */
  async logout(): Promise<APIResponse<null>> {
    try {
      const response = await api.post<APIResponse<null>>('/auth/logout');
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Initiate a password reset.
   * Sends the recruiter's email and new password to the backend, which
   * generates a 4-digit OTP and emails it.
   */
  async forgotPassword(payload: { email: string; new_password: string }): Promise<APIResponse<null>> {
    try {
      const response = await api.post<APIResponse<null>>('/auth/forgot-password', payload);
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      const fieldErrors = data?.errors;
      if (fieldErrors?.length) {
        const details = fieldErrors
          .map((errItem: any) => {
            const field = errItem.field?.replace(/^body\./, '') ?? 'input';
            return `${field}: ${errItem.message}`;
          })
          .join(' ');
        throw new Error(details || data?.message || err.message);
      }
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Verify the 4-digit OTP and complete the password reset.
   */
  async verifyOTP(payload: { email: string; otp: string }): Promise<APIResponse<null>> {
    try {
      const response = await api.post<APIResponse<null>>('/auth/verify-otp', payload);
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Resend the OTP after the previous one has expired.
   */
  async resendOTP(payload: { email: string; new_password: string }): Promise<APIResponse<null>> {
    try {
      const response = await api.post<APIResponse<null>>('/auth/resend-otp', payload);
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },
};
