import { useCallback, useState } from 'react';
import { livekitService } from '../services/livekit';
import type { LiveKitTokenResponse } from '../services/livekit';

const tokenErrorMessage = (err: unknown) => {
  const error = err as {
    response?: { data?: { detail?: string; message?: string } };
    message?: string;
  };

  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'Failed to initialize interview session.'
  );
};

export function useLiveKitInterviewToken(invitationToken: string) {
  const [data, setData] = useState<LiveKitTokenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tokenData = await livekitService.createCandidateToken(invitationToken);
      setData(tokenData);
      return tokenData;
    } catch (err: unknown) {
      console.error('Failed to create LiveKit token:', err);
      setError(tokenErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [invitationToken]);

  return { data, loading, error, createToken };
}

