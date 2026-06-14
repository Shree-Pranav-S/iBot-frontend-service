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
