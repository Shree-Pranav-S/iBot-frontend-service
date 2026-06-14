import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { assessmentService } from '../features/dashboard/services/assessment';
import type { AssessmentSummaryResponse, AssessmentResponse, AssessmentStatus } from '../types/assessment.types';
import type { CandidateAssessmentListItem } from '../types/candidate.types';

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

// Mock storage helper for Candidates since the backend endpoints don't exist yet
const getMockCandidates = (assessmentId: string): CandidateAssessmentListItem[] => {
  const key = `mock_candidates_${assessmentId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  // Seed initial mock candidates for the demo
  const defaults: CandidateAssessmentListItem[] = [
    {
      id: 'ca-1',
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      status: 'INVITED',
      resume_parse_status: 'COMPLETED',
      interview_started_at: null,
      interview_ended_at: null,
      recruiter_decision: 'PENDING',
    },
    {
      id: 'ca-2',
      full_name: 'Jane Smith',
      email: 'jane.smith@example.com',
      status: 'EVALUATED',
      resume_parse_status: 'COMPLETED',
      interview_started_at: new Date(Date.now() - 3600000).toISOString(),
      interview_ended_at: new Date(Date.now() - 1800000).toISOString(),
      recruiter_decision: 'APPROVED',
    },
    {
      id: 'ca-3',
      full_name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      status: 'IN_PROGRESS',
      resume_parse_status: 'COMPLETED',
      interview_started_at: new Date().toISOString(),
      interview_ended_at: null,
      recruiter_decision: 'PENDING',
    }
  ];
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
};

const saveMockCandidates = (assessmentId: string, candidates: CandidateAssessmentListItem[]) => {
  const key = `mock_candidates_${assessmentId}`;
  localStorage.setItem(key, JSON.stringify(candidates));
};

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

// ── CANDIDATE HOOKS (MOCKED VIA LOCAL STORAGE & REACT QUERY) ──────────────────

export const useCandidates = (assessmentId: string | null) => {
  return useQuery<CandidateAssessmentListItem[], Error>({
    queryKey: ['candidates', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return [];
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getMockCandidates(assessmentId);
    },
    enabled: !!assessmentId,
  });
};

export const useInviteCandidate = () => {
  const queryClient = useQueryClient();
  return useCustomMutation<
    CandidateAssessmentListItem,
    Error,
    { assessmentId: string; full_name: string; email: string; resume_name: string }
  >(
    async ({ assessmentId, full_name, email, resume_name: _resume_name }) => {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Latency simulation
      const current = getMockCandidates(assessmentId);
      
      if (current.some(c => c.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Candidate with this email is already registered.');
      }

      const newCandidate: CandidateAssessmentListItem = {
        id: `ca-${Math.random().toString(36).substr(2, 9)}`,
        full_name,
        email,
        status: 'INVITED',
        resume_parse_status: 'COMPLETED',
        interview_started_at: null,
        interview_ended_at: null,
        recruiter_decision: 'PENDING',
      };

      const updated = [newCandidate, ...current];
      saveMockCandidates(assessmentId, updated);
      return newCandidate;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['candidates', variables.assessmentId] });
      },
    }
  );
};

export const useUpdateCandidateDecision = () => {
  const queryClient = useQueryClient();
  return useCustomMutation<
    CandidateAssessmentListItem,
    Error,
    { assessmentId: string; candidateId: string; decision: 'APPROVED' | 'REJECTED' }
  >(
    async ({ assessmentId, candidateId, decision }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const current = getMockCandidates(assessmentId);
      const index = current.findIndex(c => c.id === candidateId);
      if (index === -1) {
        throw new Error('Candidate assessment not found.');
      }
      
      const updatedItem = {
        ...current[index],
        recruiter_decision: decision
      };
      
      const updated = [...current];
      updated[index] = updatedItem;
      saveMockCandidates(assessmentId, updated);
      return updatedItem;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['candidates', variables.assessmentId] });
      },
    }
  );
};
