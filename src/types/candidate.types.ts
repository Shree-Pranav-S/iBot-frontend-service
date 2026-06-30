/**
 * candidate.types.ts
 *
 * Types for candidates and candidate assessments.
 */

export interface CandidateAssessmentListItem {
  id: string;
  full_name: string;
  email: string;
  status: 'INVITED' | 'WAITING_ROOM' | 'IN_PROGRESS' | 'COMPLETED' | 'EVALUATED' | 'TERMINATED';
  resume_parse_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  interview_started_at: string | null;
  interview_ended_at: string | null;
  recruiter_decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  assessment_id?: string;
  role_name?: string;
  resume_parsed?: {
    summary?: string;
    skills?: string[];
    experience_years?: number;
    error?: string;
  };
  resume_file_path?: string;
  jd_text?: string;
}

interface CSVRowResult {
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

export interface SingleCandidateResponse {
  candidate_assessment_id: string;
  candidate_id: string;
  full_name: string;
  email: string;
  status: string;
}

export interface TokenValidationResponse {
  candidate_name: string;
  company_name: string;
  assessment_title: string;
  interview_duration_mins: number;
  window_end: string;
  status: string;
  sections_overview: string[];
}

export interface EvaluationSkillBreakdown {
  score: number;
  priority_score: number;
  questions_evaluated: number;
  confidence: number;
}

export interface SectionCommunicationBreakdown {
  score: number;
  summary: string;
  evidence: string[];
}

interface SeverityCounts {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface ViolationSummary {
  has_violation: boolean;
  validated_violation_count: number;
  severity_counts: SeverityCounts;
  summary: string;
  penalty_applied: number;
  hard_gate_reasons: string[];
}

export interface InterviewEvaluationResponse {
  id: string;
  candidate_assessment_id: string;
  session_id: string;
  candidate_name?: string | null;
  candidate_email?: string | null;
  assessment_title?: string | null;
  role_name?: string | null;
  recruiter_decision?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  recruiter_feedback?: string | null;

  intro_section_score: number;
  intro_section_summary: string;
  intro_section_evidence: string[];

  skill_scores: Record<string, EvaluationSkillBreakdown>;
  overall_technical_skill_score: number;
  skill_summary: Record<string, string>;
  skill_evidence: Record<string, string[]>;

  behavioural_cultural_score: number;
  behavioural_cultural_summary: string;
  behavioural_cultural_evidence: string[];

  communication_score: number;
  communication_summary: string;
  communication_evidence: string[];
  section_communication_scores: Record<string, SectionCommunicationBreakdown>;

  violation_summary: ViolationSummary | null;
  violation_evidence: string[] | null;

  raw_overall_score: number;
  violation_penalty: number;
  overall_score: number;
  hiring_recommendation: 'hire' | 'consider' | 'no hire';
  model_recommendation: 'hire' | 'consider' | 'no hire';
  recommendation_override_reason: string | null;
  overall_summary: string;
  recommendation_reasoning: string;
  strengths: string[];
  concerns: string[];

  prompt_version: string;
  model_name: string;
  model_provider: string;
  evaluation_schema_version: string;
  transcript_hash: string;

  rank_in_assessment: number | null;
  percentile_in_assessment: number | null;
  total_candidates_evaluated: number | null;
  generated_at: string;
}

export interface RecruiterEvaluationListItem {
  candidate_assessment_id: string;
  candidate_name: string;
  candidate_email: string;
  assessment_id: string;
  assessment_title: string;
  role_name: string;
  recruiter_decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  interview_started_at: string | null;
  interview_ended_at: string | null;
  generated_at: string;
  overall_score: number;
  hiring_recommendation: 'hire' | 'consider' | 'no hire';
  recommendation_reasoning: string;
  overall_summary: string;
  overall_technical_skill_score: number;
  behavioural_cultural_score: number;
  communication_score: number;
  rank_in_assessment: number | null;
  percentile_in_assessment: number | null;
  total_candidates_evaluated: number | null;
  strengths: string[];
  concerns: string[];
  validated_violation_count: number;
  skill_scores: Record<string, EvaluationSkillBreakdown>;
}

export interface RecruiterDecisionResponse {
  candidate_assessment_id: string;
  recruiter_decision: 'APPROVED' | 'REJECTED';
  updated_at: string;
}

export interface ExistingCandidateListItem {
  id: string;
  full_name: string;
  email: string;
}

export interface EnrollCandidateResponse {
  candidate_assessment_id: string;
  candidate_id: string;
  full_name: string;
  email: string;
  status: string;
}

export interface TranscriptTurn {
  turn_number: number;
  speaker: string;
  text: string;
  tone?: string | null;
}

export interface InterviewTranscriptResponse {
  candidate_assessment_id: string;
  candidate_name: string | null;
  assessment_title: string | null;
  total_elapsed_secs: number;
  turns: TranscriptTurn[];
}

