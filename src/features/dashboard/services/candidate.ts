import { api } from '../../../config/api';
import type { APIResponse } from '../../../types/api.types';
import type {
  CandidateAssessmentListItem,
  BulkUploadResponse,
} from '../../../types/candidate.types';

export type { CandidateAssessmentListItem, BulkUploadResponse };

// ── Candidate service ─────────────────────────────────────────────────────────

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
};
