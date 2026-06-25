import { api } from '../../../config/api';
import type { APIResponse } from '../../../types/api.types';

export interface LiveKitTokenResponse {
  livekit_url: string;
  token: string;
  room_name: string;
}

export const livekitService = {
  createCandidateToken: async (invitationToken: string): Promise<LiveKitTokenResponse> => {
    const response = await api.post<APIResponse<LiveKitTokenResponse>>('/livekit/candidate-token', {
      invitation_token: invitationToken,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to initialize interview session.');
    }
    return response.data.data;
  },
};

