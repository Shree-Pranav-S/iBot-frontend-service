import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { assessmentService } from '../features/dashboard/services/assessment';
import { candidateService } from '../features/dashboard/services/candidate';
import type { AssessmentSummaryResponse, AssessmentResponse, AssessmentStatus } from '../types/assessment.types';
import type { CandidateAssessmentListItem, BulkUploadResponse } from '../types/candidate.types';

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

// Deprecated hook kept for any remaining references — use useBulkUploadCandidates instead
export const useInviteCandidate = () => {
  const queryClient = useQueryClient();
  return useCustomMutation<
    CandidateAssessmentListItem,
    Error,
    { assessmentId: string; full_name: string; email: string; resume_name: string }
  >(
    async () => {
      throw new Error(
        'Single candidate invite is not supported. Please use the CSV bulk upload.'
      );
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['candidates', variables.assessmentId] });
      },
    }
  );
};
