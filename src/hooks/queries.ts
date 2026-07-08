import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "../features/dashboard/services/assessment";
import { candidateService } from "../features/dashboard/services/candidate";
import { evaluationService } from "../features/dashboard/services/evaluation";
import { notificationService } from "../features/dashboard/services/notification";
import type {
  AssessmentSummaryResponse,
  AssessmentResponse,
  AssessmentStatus,
} from "../types/assessment.types";
import type {
  CandidateAssessmentListItem,
  BulkUploadResponse,
  InterviewEvaluationResponse,
  RecruiterDecisionResponse,
  AIRejectionFeedbackResponse,
  RecruiterEvaluationListItem,
  SingleCandidateResponse,
  ExistingCandidateListItem,
  EnrollCandidateResponse,
  InterviewTranscriptResponse,
} from "../types/candidate.types";
import type { RecruiterDashboardNotification } from "../types/realtime.types";

export const useAssessments = () => {
  return useQuery<AssessmentSummaryResponse[], Error>({
    queryKey: ["assessments"],
    queryFn: async () => {
      const resp = await assessmentService.getAssessments();
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || "Failed to fetch assessments");
      }
      return resp.data;
    },
  });
};

export const useAssessmentDetails = (id: string | null) => {
  return useQuery<AssessmentResponse | null, Error>({
    queryKey: ["assessments", id],
    queryFn: async () => {
      if (!id) return null;
      const resp = await assessmentService.getAssessmentDetails(id);
      if (!resp.success || !resp.data) {
        throw new Error(resp.message || "Failed to fetch assessment details");
      }
      return resp.data;
    },
    enabled: !!id,
  });
};

export const useCreateAssessment = () => {
  const client = useQueryClient();
  return useMutation<AssessmentResponse, Error, FormData>({
    mutationFn: async (formData) => {
      const resp = await assessmentService.createAssessment(formData);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to create assessment");
      return resp.data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
};

export const useUpdateAssessmentStatus = () => {
  const client = useQueryClient();
  return useMutation<
    AssessmentResponse,
    Error,
    { id: string; status: AssessmentStatus }
  >({
    mutationFn: async ({ id, status }) => {
      const resp = await assessmentService.updateAssessmentStatus(id, status);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to update assessment status");
      return resp.data;
    },
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["assessments"] });
      client.invalidateQueries({ queryKey: ["assessments", data.id] });
    },
  });
};

export const useCandidates = (assessmentId: string | null) => {
  return useQuery<CandidateAssessmentListItem[], Error>({
    queryKey: ["candidates", assessmentId],
    queryFn: async () => {
      if (!assessmentId) return [];
      const resp =
        assessmentId === "all"
          ? await candidateService.getAllCandidates()
          : await candidateService.getCandidatesForAssessment(assessmentId);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to fetch candidates");
      return resp.data;
    },
    enabled: !!assessmentId,
  });
};

export const useBulkUploadCandidates = () => {
  const client = useQueryClient();
  return useMutation<
    BulkUploadResponse,
    Error,
    { csvFile: File; assessmentId: string }
  >({
    mutationFn: async ({ csvFile, assessmentId }) => {
      const resp = await candidateService.bulkUploadCandidates(csvFile, assessmentId);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to process CSV upload");
      return resp.data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
};

export const useUpdateCandidateDecision = () => {
  const client = useQueryClient();
  return useMutation<
    RecruiterDecisionResponse,
    Error,
    {
      assessmentId?: string;
      candidateId: string;
      decision: "APPROVED" | "REJECTED";
      feedback?: string;
    }
  >({
    mutationFn: async ({ candidateId, decision, feedback }) => {
      const resp = await candidateService.updateCandidateDecision(
        candidateId,
        decision,
        feedback,
      );
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to update candidate decision");
      return resp.data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
      client.invalidateQueries({ queryKey: ["evaluations"] });
      client.invalidateQueries({ queryKey: ["candidate-evaluation"] });
    },
  });
};

export const useGenerateRejectionFeedback = () =>
  useMutation<AIRejectionFeedbackResponse, Error, string>({
    mutationFn: async (candidateId) => {
      const response =
        await evaluationService.generateRejectionFeedback(candidateId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to generate rejection feedback");
      }
      return response.data;
    },
  });

export const useCreateCandidate = () => {
  const client = useQueryClient();
  return useMutation<
    SingleCandidateResponse,
    Error,
    { name: string; email: string; assessmentId: string; resumeFile: File }
  >({
    mutationFn: async (data) => {
      const resp = await candidateService.createSingleCandidate(data);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to create candidate");
      return resp.data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
      client.invalidateQueries({ queryKey: ["all-candidates"] });
    },
  });
};

export const useUniqueCandidates = () => {
  return useQuery<ExistingCandidateListItem[], Error>({
    queryKey: ["all-candidates"],
    queryFn: async () => {
      const resp = await candidateService.getUniqueCandidates();
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to fetch candidates");
      return resp.data;
    },
  });
};

export const useEnrollCandidate = () => {
  const client = useQueryClient();
  return useMutation<
    EnrollCandidateResponse,
    Error,
    { candidateId: string; assessmentId: string; resumeFile?: File | null }
  >({
    mutationFn: async (data) => {
      const resp = await candidateService.enrollExistingCandidate(data);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to enroll candidate");
      return resp.data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
      client.invalidateQueries({ queryKey: ["all-candidates"] });
    },
  });
};

export const useRecruiterEvaluations = () => {
  return useQuery<RecruiterEvaluationListItem[], Error>({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const resp = await evaluationService.getRecruiterEvaluations();
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to fetch evaluations");
      return resp.data;
    },
  });
};

export const useRecruiterNotifications = () => {
  return useQuery<RecruiterDashboardNotification[], Error>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const resp = await notificationService.getNotifications();
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to fetch notifications");
      return resp.data;
    },
  });
};
export const useCandidateEvaluation = (caId: string | null) => {
  return useQuery<InterviewEvaluationResponse | null, Error>({
    queryKey: ["candidate-evaluation", caId],
    queryFn: async () => {
      if (!caId) return null;
      const resp = await evaluationService.getCandidateEvaluation(caId);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to fetch candidate evaluation");
      return resp.data;
    },
    enabled: !!caId,
  });
};

export const useDeleteCandidate = () => {
  const client = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: async (caId) => {
      const resp = await candidateService.deleteCandidate(caId);
      if (!resp.success)
        throw new Error(resp.message || "Failed to delete candidate");
      return null;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
      client.invalidateQueries({ queryKey: ["all-candidates"] });
    },
  });
};

export const useInterviewTranscript = (caId: string | null) => {
  return useQuery<InterviewTranscriptResponse | null, Error>({
    queryKey: ["transcript", caId],
    queryFn: async () => {
      if (!caId) return null;
      const resp = await evaluationService.getInterviewTranscript(caId);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to fetch transcript");
      return resp.data;
    },
    enabled: !!caId,
  });
};
