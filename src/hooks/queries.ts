import { useState, useEffect, useCallback } from 'react';

type QueryKey = (string | null)[];

const queryCache = new Map<string, any>();
const queryListeners = new Map<string, Set<() => void>>();

export function useQuery<TData, TError>({
  queryKey,
  queryFn,
  enabled = true,
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  enabled?: boolean;
}) {
  const keyString = JSON.stringify(queryKey);
  const [data, setData] = useState<TData | undefined>(queryCache.get(keyString));
  const [isLoading, setIsLoading] = useState(!queryCache.has(keyString) && enabled);
  const [error, setError] = useState<TError | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      queryCache.set(keyString, result);
      setData(result);
    } catch (err) {
      setError(err as TError);
    } finally {
      setIsLoading(false);
    }
  }, [keyString, enabled, queryFn]);

  useEffect(() => {
    fetchData();

    let listeners = queryListeners.get(keyString);
    if (!listeners) {
      listeners = new Set();
      queryListeners.set(keyString, listeners);
    }
    listeners.add(fetchData);

    return () => {
      listeners?.delete(fetchData);
    };
  }, [fetchData, keyString]);

  return { data, isLoading, isPending: isLoading, error, isError: error !== null };
}

// Invalidation event system
type InvalidateQueryFilters = { queryKey: QueryKey };
export const queryClient = {
  invalidateQueries: (filters: InvalidateQueryFilters) => {
    const prefix = JSON.stringify(filters.queryKey).slice(0, -1); // '["assessments"]' -> '["assessments"'
    for (const [key, listeners] of queryListeners.entries()) {
      if (key.startsWith(prefix)) {
        queryCache.delete(key);
        listeners.forEach(listener => listener());
      }
    }
  }
};
export const useQueryClient = () => queryClient;
import { assessmentService } from '../features/dashboard/services/assessment';
import { candidateService } from '../features/dashboard/services/candidate';
import type { AssessmentSummaryResponse, AssessmentResponse, AssessmentStatus } from '../types/assessment.types';
import type { CandidateAssessmentListItem, BulkUploadResponse, InterviewEvaluationResponse, SingleCandidateResponse } from '../types/candidate.types';

// Custom lightweight mutation hook replacing TanStack useMutation
function useCustomMutation<TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
    onError?: (error: TError, variables: TVariables) => void | Promise<void>;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TError | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutateAsync = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutationFn(variables);
        setData(result);
        if (options?.onSuccess) {
          await options.onSuccess(result, variables);
        }
        return result;
      } catch (err) {
        const errorObj = err as TError;
        setError(errorObj);
        if (options?.onError) {
          await options.onError(errorObj, variables);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options]
  );

  const mutate = useCallback(
    (variables: TVariables, callbacks?: { onSuccess?: (data: TData) => void; onError?: (error: TError) => void }) => {
      mutateAsync(variables)
        .then((result) => {
          callbacks?.onSuccess?.(result);
        })
        .catch((err) => {
          callbacks?.onError?.(err as TError);
        });
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    isLoading,
    isPending: isLoading,
    isError: error !== null,
    error,
    data,
    isSuccess: data !== null,
  };
}

// ── ASSESSMENT HOOKS ─────────────────────────────────────────────────────────

export const useAssessments = () => {
  return useQuery<AssessmentSummaryResponse[], Error>({
    queryKey: ['assessments'],
    queryFn: async () => {
      const resp = await assessmentService.getAssessments();
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to fetch assessments');
      }
      return resp.data;
    },
  });
};

export const useAssessmentDetails = (id: string | null) => {
  return useQuery<AssessmentResponse | null, Error>({
    queryKey: ['assessments', id],
    queryFn: async () => {
      if (!id) return null;
      const resp = await assessmentService.getAssessmentDetails(id);
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to fetch assessment details');
      }
      return resp.data;
    },
    enabled: !!id,
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  return useCustomMutation<AssessmentResponse, Error, FormData>(
    async (formData: FormData) => {
      const resp = await assessmentService.createAssessment(formData);
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to create assessment');
      }
      return resp.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
      },
    }
  );
};

export const useUpdateAssessmentStatus = () => {
  const queryClient = useQueryClient();
  return useCustomMutation<AssessmentResponse, Error, { id: string; status: AssessmentStatus }>(
    async ({ id, status }) => {
      const resp = await assessmentService.updateAssessmentStatus(id, status);
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to update assessment status');
      }
      return resp.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        queryClient.invalidateQueries({ queryKey: ['assessments', data.id] });
      },
    }
  );
};

// ── CANDIDATE HOOKS ──────────────────────────────────────────────────────────

export const useCandidates = (assessmentId: string | null) => {
  return useQuery<CandidateAssessmentListItem[], Error>({
    queryKey: ['candidates', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return [];
      const resp = await candidateService.getCandidatesForAssessment(assessmentId);
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to fetch candidates');
      }
      return resp.data;
    },
    enabled: !!assessmentId,
  });
};

export const useBulkUploadCandidates = () => {
  const queryClient = useQueryClient();
  return useCustomMutation<BulkUploadResponse, Error, File>(
    async (csvFile: File) => {
      const resp = await candidateService.bulkUploadCandidates(csvFile);
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to process CSV upload');
      }
      return resp.data;
    },
    {
      onSuccess: () => {
        // Invalidate all candidate queries so the list refreshes after upload
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
      },
    }
  );
};

export const useUpdateCandidateDecision = () => {
  const queryClient = useQueryClient();
  return useCustomMutation<
    { assessmentId: string; candidateId: string; decision: string },
    Error,
    { assessmentId: string; candidateId: string; decision: 'APPROVED' | 'REJECTED' }
  >(
    async ({ assessmentId, candidateId, decision }) => {
      // TODO: Wire up real API endpoint when recruiter decision route is implemented
      // For now returns the variables as the "result" for cache invalidation
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { assessmentId, candidateId, decision };
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['candidates', variables.assessmentId] });
      },
    }
  );
};

export const useCreateCandidate = () => {
  const queryClient = useQueryClient();
  return useCustomMutation<SingleCandidateResponse, Error, { name: string; email: string; role: string; resumeFile: File }>(
    async (data) => {
      const resp = await candidateService.createSingleCandidate(data);
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to create candidate');
      }
      return resp.data;
    },
    {
      onSuccess: () => {
        // Invalidate all candidate queries so the list refreshes after creation
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
      },
    }
  );
};

export const useCandidateEvaluation = (caId: string | null) => {
  return useQuery<InterviewEvaluationResponse | null, Error>({
    queryKey: ['candidate-evaluation', caId],
    queryFn: async () => {
      if (!caId) return null;
      const resp = await candidateService.getCandidateEvaluation(caId);
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to fetch candidate evaluation');
      }
      return resp.data;
    },
    enabled: !!caId,
  });
};
