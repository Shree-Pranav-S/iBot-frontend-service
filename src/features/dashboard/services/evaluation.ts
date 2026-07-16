import { api } from "../../../config/api";
import type { APIResponse } from "../../../types/api.types";
import type {
  AIApprovalFeedbackResponse,
  AIRejectionFeedbackResponse,
  InterviewEvaluationResponse,
  InterviewTranscriptResponse,
  RecruiterEvaluationListItem,
} from "../../../types/candidate.types";

export const evaluationService = {
  async getRecruiterEvaluations(): Promise<
    APIResponse<RecruiterEvaluationListItem[]>
  > {
    const response =
      await api.get<APIResponse<RecruiterEvaluationListItem[]>>("/evaluations");
    return response.data;
  },

  async getCandidateEvaluation(
    caId: string,
  ): Promise<APIResponse<InterviewEvaluationResponse>> {
    const response = await api.get<APIResponse<InterviewEvaluationResponse>>(
      `/evaluations/${caId}`,
    );
    return response.data;
  },

  async getInterviewTranscript(
    caId: string,
  ): Promise<APIResponse<InterviewTranscriptResponse>> {
    const response = await api.get<APIResponse<InterviewTranscriptResponse>>(
      `/evaluations/${caId}/transcript`,
    );
    return response.data;
  },

  async generateRejectionFeedback(
    caId: string,
  ): Promise<APIResponse<AIRejectionFeedbackResponse>> {
    const response = await api.post<APIResponse<AIRejectionFeedbackResponse>>(
      `/evaluations/${caId}/rejection-feedback`,
    );
    return response.data;
  },

  async generateApprovalFeedback(
    caId: string,
  ): Promise<APIResponse<AIApprovalFeedbackResponse>> {
    const response = await api.post<APIResponse<AIApprovalFeedbackResponse>>(
      `/evaluations/${caId}/approval-feedback`,
    );
    return response.data;
  },
};
