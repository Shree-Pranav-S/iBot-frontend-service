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
  ExistingCandidateListItem,
  EnrollCandidateResponse,
  InterviewTranscriptResponse,
} from '../../../types/candidate.types';

// Candidate service

export const candidateService = {
  /**
   * Upload a CSV file of candidates for bulk processing.
   * The backend matches each candidate by assessment_id,
   * creates records, and dispatches invitation emails.
   */
  async bulkUploadCandidates(csvFile: File): Promise<APIResponse<BulkUploadResponse>> {
    const formData = new FormData();
    formData.append('csv_file', csvFile);

    const response = await api.post<APIResponse<BulkUploadResponse>>(
      '/candidates/bulk-upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  /**
   * Create a single candidate manually using an assessment_id.
   */
  async createSingleCandidate(data: { name: string; email: string; assessmentId: string; resumeFile: File }): Promise<APIResponse<SingleCandidateResponse>> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('assessment_id', data.assessmentId);
    formData.append('resume', data.resumeFile);

    const response = await api.post<APIResponse<SingleCandidateResponse>>(
      '/candidates/manual',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  /**
   * Fetch all unique candidates (not per-assessment) for enrollment dropdown.
   */
  async getUniqueCandidates(): Promise<APIResponse<ExistingCandidateListItem[]>> {
    const response = await api.get<APIResponse<ExistingCandidateListItem[]>>(
      '/candidates/all-candidates',
    );
    return response.data;
  },

  /**
   * Enroll an existing candidate into a new assessment.
   * Optionally provides a new resume PDF; otherwise the previous resume is reused.
   */
  async enrollExistingCandidate(data: {
    candidateId: string;
    assessmentId: string;
    resumeFile?: File | null;
  }): Promise<APIResponse<EnrollCandidateResponse>> {
    const formData = new FormData();
    formData.append('candidate_id', data.candidateId);
    formData.append('assessment_id', data.assessmentId);
    if (data.resumeFile) {
      formData.append('resume', data.resumeFile);
    }

    const response = await api.post<APIResponse<EnrollCandidateResponse>>(
      '/candidates/enroll',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  /**
   * Fetch all candidate-assessment records for a specific assessment.
   */
  async getCandidatesForAssessment(
    assessmentId: string
  ): Promise<APIResponse<CandidateAssessmentListItem[]>> {
    const response = await api.get<APIResponse<CandidateAssessmentListItem[]>>(
      '/candidates',
      { params: { assessment_id: assessmentId } },
    );
    return response.data;
  },

  /**
   * Fetch all candidate-assessment records for all assessments.
   */
  async getAllCandidates(): Promise<APIResponse<CandidateAssessmentListItem[]>> {
    const response = await api.get<APIResponse<CandidateAssessmentListItem[]>>('/candidates');
    return response.data;
  },

  /**
   * Validate candidate token and retrieve details for the waiting room.
   */
  async validateCandidateToken(token: string): Promise<APIResponse<TokenValidationResponse>> {
    const response = await api.get<APIResponse<TokenValidationResponse>>(
      '/interview/validate-token',
      {
        params: { token },
      },
    );
    return response.data;
  },


  /**
   * Fetch all evaluated interviews for the current recruiter.
   */
  async getRecruiterEvaluations(): Promise<APIResponse<RecruiterEvaluationListItem[]>> {
    const response = await api.get<APIResponse<RecruiterEvaluationListItem[]>>(
      '/candidates/evaluations',
    );
    return response.data;
  },

  /**
   * Persist recruiter hiring decision for a candidate assessment.
   */
  async updateCandidateDecision(
    caId: string,
    decision: 'APPROVED' | 'REJECTED',
    feedback?: string
  ): Promise<APIResponse<RecruiterDecisionResponse>> {
    const response = await api.post<APIResponse<RecruiterDecisionResponse>>(
      `/candidates/${caId}/decision`,
      { decision, feedback },
    );
    return response.data;
  },
  /**
   * Fetch evaluation report for a candidate assessment.
   */
  async getCandidateEvaluation(caId: string): Promise<APIResponse<InterviewEvaluationResponse>> {
    const response = await api.get<APIResponse<InterviewEvaluationResponse>>(
      `/candidates/${caId}/evaluation`,
    );
    return response.data;
  },

  /**
   * Delete a candidate registration from an assessment.
   */
  async deleteCandidate(caId: string): Promise<APIResponse<null>> {
    const response = await api.delete<APIResponse<null>>(`/candidates/${caId}`);
    return response.data;
  },

  /**
   * Fetch the interview transcript for a candidate assessment.
   */
  async getInterviewTranscript(caId: string): Promise<APIResponse<InterviewTranscriptResponse>> {
    const response = await api.get<APIResponse<InterviewTranscriptResponse>>(
      `/candidates/${caId}/transcript`,
    );
    return response.data;
  },
};



