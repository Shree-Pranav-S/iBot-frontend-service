import { api } from '../../../config/api';
import type { APIResponse } from '../../../types/api.types';
import type {
  CandidateAssessmentListItem,
  BulkUploadResponse,
  TokenValidationResponse,
  InterviewEvaluationResponse,
  RecruiterDecisionResponse,
  RecruiterEvaluationListItem,
  SingleCandidateResponse,
} from '../../../types/candidate.types';

export type { CandidateAssessmentListItem, BulkUploadResponse, TokenValidationResponse, InterviewEvaluationResponse, RecruiterDecisionResponse, RecruiterEvaluationListItem, SingleCandidateResponse };

// Candidate service

export const candidateService = {
  /**
   * Upload a CSV file of candidates for bulk processing.
   * The backend matches each candidate's role to an existing assessment,
   * creates records, and dispatches invitation emails.
   */
  async bulkUploadCandidates(csvFile: File): Promise<APIResponse<BulkUploadResponse>> {
    try {
      const formData = new FormData();
      formData.append('csv_file', csvFile);

      const response = await api.post<APIResponse<BulkUploadResponse>>(
        '/candidates/bulk-upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Create a single candidate manually.
   */
  async createSingleCandidate(data: { name: string; email: string; role: string; resumeFile: File }): Promise<APIResponse<SingleCandidateResponse>> {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('role', data.role);
      formData.append('resume', data.resumeFile);

      const response = await api.post<APIResponse<SingleCandidateResponse>>(
        '/candidates/manual',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (err: any) {
      const respData = err.response?.data;
      throw new Error(respData?.message || err.message);
    }
  },

  /**
   * Fetch all candidate-assessment records for a specific assessment.
   */
  async getCandidatesForAssessment(
    assessmentId: string
  ): Promise<APIResponse<CandidateAssessmentListItem[]>> {
    try {
      const response = await api.get<APIResponse<CandidateAssessmentListItem[]>>(
        `/candidates?assessment_id=${assessmentId}`
      );
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Fetch all candidate-assessment records for all assessments.
   */
  async getAllCandidates(): Promise<APIResponse<CandidateAssessmentListItem[]>> {
    try {
      const response = await api.get<APIResponse<CandidateAssessmentListItem[]>>(
        `/candidates`
      );
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Validate candidate token and retrieve details for the waiting room.
   */
  async validateCandidateToken(token: string): Promise<APIResponse<TokenValidationResponse>> {
    try {
      const response = await api.get<APIResponse<TokenValidationResponse>>(
        `/interview/validate-token`,
        {
          params: { token },
        }
      );
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },


  /**
   * Fetch all evaluated interviews for the current recruiter.
   */
  async getRecruiterEvaluations(): Promise<APIResponse<RecruiterEvaluationListItem[]>> {
    try {
      const response = await api.get<APIResponse<RecruiterEvaluationListItem[]>>(
        '/candidates/evaluations'
      );
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Persist recruiter hiring decision for a candidate assessment.
   */
  async updateCandidateDecision(
    caId: string,
    decision: 'APPROVED' | 'REJECTED',
    feedback?: string
  ): Promise<APIResponse<RecruiterDecisionResponse>> {
    try {
      const response = await api.post<APIResponse<RecruiterDecisionResponse>>(
        `/candidates/${caId}/decision`,
        { decision, feedback }
      );
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },
  /**
   * Fetch evaluation report for a candidate assessment.
   */
  async getCandidateEvaluation(caId: string): Promise<APIResponse<InterviewEvaluationResponse>> {
    try {
      const response = await api.get<APIResponse<InterviewEvaluationResponse>>(
        `/candidates/${caId}/evaluation`
      );
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },

  /**
   * Delete a candidate registration from an assessment.
   */
  async deleteCandidate(caId: string): Promise<APIResponse<null>> {
    try {
      const response = await api.delete<APIResponse<null>>(`/candidates/${caId}`);
      return response.data;
    } catch (err: any) {
      const data = err.response?.data;
      throw new Error(data?.message || err.message);
    }
  },
};



