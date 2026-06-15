/**
 * candidate.types.ts
 *
 * Types for candidates and candidate assessments.
 */

export interface CandidateAssessmentListItem {
  id: string;
  full_name: string;
  email: string;
  status: 'INVITED' | 'WAITING_ROOM' | 'IN_PROGRESS' | 'COMPLETED' | 'EVALUATED';
  resume_parse_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  interview_started_at: string | null;
  interview_ended_at: string | null;
  recruiter_decision: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface CSVRowResult {
  row: number;
  email: string;
  status: 'success' | 'failed';
  reason: string | null;
}

export interface BulkUploadResponse {
  upload_id: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  row_results: CSVRowResult[];
  overall_status: string;
}

export interface TokenValidationResponse {
  candidate_name: string;
  assessment_title: string;
  interview_duration_mins: number;
  window_end: string;
  status: string;
  sections_overview: string[];
}
