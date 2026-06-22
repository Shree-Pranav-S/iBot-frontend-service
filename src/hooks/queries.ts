import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "../features/dashboard/services/assessment";
import { candidateService } from "../features/dashboard/services/candidate";
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
  RecruiterEvaluationListItem,
  SingleCandidateResponse,
} from "../types/candidate.types";

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
  return useMutation<BulkUploadResponse, Error, File>({
    mutationFn: async (csvFile) => {
      const resp = await candidateService.bulkUploadCandidates(csvFile);
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
    },
  });
};

export const useCreateCandidate = () => {
  const client = useQueryClient();
  return useMutation<
    SingleCandidateResponse,
    Error,
    { name: string; email: string; role: string; resumeFile: File }
  >({
    mutationFn: async (data) => {
      const resp = await candidateService.createSingleCandidate(data);
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to create candidate");
      return resp.data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
};

export const useRecruiterEvaluations = () => {
  return useQuery<RecruiterEvaluationListItem[], Error>({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const resp = await candidateService.getRecruiterEvaluations();
      if (!resp.success || !resp.data)
        throw new Error(resp.message || "Failed to fetch evaluations");
      return resp.data;
    },
  });
};
export const useCandidateEvaluation = (caId: string | null) => {
  return useQuery<InterviewEvaluationResponse | null, Error>({
    queryKey: ["candidate-evaluation", caId],
    queryFn: async () => {
      if (!caId) return null;
      const resp = await candidateService.getCandidateEvaluation(caId);
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
    },
  });
};
