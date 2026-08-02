import { api } from '../../../config/api';
import type { APIResponse } from '../../../types/api.types';
import type {
  AssessmentResponse,
  AssessmentSummaryResponse,
  AssessmentStatus,
  AssessmentUpdatePayload,
} from '../../../types/assessment.types';

// ── Assessment service ────────────────────────────────────────────────────────

export const assessmentService = {
  /**
   * Create a new assessment.
   * Expects a FormData object containing text parameters, focus areas JSON, and optionally a PDF file.
   */
  async createAssessment(formData: FormData): Promise<APIResponse<AssessmentResponse>> {
    const response = await api.post<APIResponse<AssessmentResponse>>('/assessments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Fetch all assessments owned by the logged-in recruiter.
   */
  async getAssessments(): Promise<APIResponse<AssessmentSummaryResponse[]>> {
    const response = await api.get<APIResponse<AssessmentSummaryResponse[]>>('/assessments');
    return response.data;
  },

  /**
   * Retrieve full details of an assessment including parsed JD analysis and interview plan.
   */
  async getAssessmentDetails(assessmentId: string): Promise<APIResponse<AssessmentResponse>> {
    const response = await api.get<APIResponse<AssessmentResponse>>(`/assessments/${assessmentId}`);
    return response.data;
  },

  /**
   * Update the status of an assessment (DRAFT -> ACTIVE, etc.)
   */
  async updateAssessmentStatus(
    assessmentId: string,
    status: AssessmentStatus,
  ): Promise<APIResponse<AssessmentResponse>> {
    const response = await api.patch<APIResponse<AssessmentResponse>>(
      `/assessments/${assessmentId}/status`,
      { status },
    );
    return response.data;
  },

  /** Update recruiter-editable assessment metadata, schedule, and plan fields. */
  async updateAssessment(
    assessmentId: string,
    payload: AssessmentUpdatePayload,
  ): Promise<APIResponse<AssessmentResponse>> {
    const response = await api.patch<APIResponse<AssessmentResponse>>(
      `/assessments/${assessmentId}`,
      payload,
    );
    return response.data;
  },

  /** Permanently delete an assessment that has no started interviews. */
  async deleteAssessment(assessmentId: string): Promise<APIResponse<null>> {
    const response = await api.delete<APIResponse<null>>(`/assessments/${assessmentId}`);
    return response.data;
  },
};
