import { api } from "../../../config/api";
import type { APIResponse } from "../../../types/api.types";

import type {
  LiveKitTokenResponse,
  CandidateSessionBootstrapResponse,
} from "../../../types/livekit.types";

export const CANDIDATE_SESSION_STORAGE_KEY = "ibot:candidate-session-token";

export const livekitService = {
  enterCandidateSession: async (
    invitationToken: string,
  ): Promise<CandidateSessionBootstrapResponse> => {
    const response = await api.post<
      APIResponse<CandidateSessionBootstrapResponse>
    >("/livekit/session-entry", { invitation_token: invitationToken });
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || "Failed to enter interview session.",
      );
    }
    return response.data.data;
  },
  restoreCandidateSession: async (
    sessionToken: string,
  ): Promise<CandidateSessionBootstrapResponse> => {
    const response = await api.post<
      APIResponse<CandidateSessionBootstrapResponse>
    >("/livekit/session-context", { session_token: sessionToken });
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || "Failed to restore interview session.",
      );
    }
    return response.data.data;
  },
  createCandidateToken: async (
    sessionToken: string,
  ): Promise<LiveKitTokenResponse> => {
    const response = await api.post<APIResponse<LiveKitTokenResponse>>(
      "/livekit/candidate-token",
      {
        session_token: sessionToken,
      },
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || "Failed to initialize interview session.",
      );
    }
    return response.data.data;
  },
  createDemoToken: async (
    sessionToken: string,
  ): Promise<LiveKitTokenResponse> => {
    const response = await api.post<APIResponse<LiveKitTokenResponse>>(
      "/livekit/demo-token",
      {
        session_token: sessionToken,
      },
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || "Failed to initialize demo session.",
      );
    }
    return response.data.data;
  },
};
