import { useCallback, useState } from 'react';
import { livekitService } from '../services/livekit';
import type { LiveKitTokenResponse } from '../../../types/livekit.types';

const demoTokenErrorMessage = (errorValue: unknown) => {
  const error = errorValue as {
    response?: { data?: { detail?: string; message?: string } };
    message?: string;
  };

  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'Failed to initialize demo session.'
  );
};

export function useLiveKitDemoToken(sessionToken: string) {
  const [data, setData] = useState<LiveKitTokenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tokenData = await livekitService.createDemoToken(sessionToken);
      setData(tokenData);
      return tokenData;
    } catch (errorValue: unknown) {
      console.error('Failed to create LiveKit demo token:', errorValue);
      setError(demoTokenErrorMessage(errorValue));
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  return { data, loading, error, createToken };
}
