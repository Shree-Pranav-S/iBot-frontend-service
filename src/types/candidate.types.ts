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

export interface SingleCandidateResponse {
  candidate_assessment_id: string;
  candidate_id: string;
  full_name: string;
  email: string;
  status: string;
}

export interface TokenValidationResponse {
  candidate_name: string;
  assessment_title: string;
  interview_duration_mins: number;
  window_end: string;
  status: string;
  sections_overview: string[];
}

export interface TranscriptEvidence {
  turn_number: number | null;
  section: string | null;
  skill: string | null;
  quote: string;
  interpretation: string;
}

export interface EvaluationSkillBreakdown {
  priority_score: number | null;
  depth_required?: string | null;
  weighted_score: number;
  raw_score: number | null;
  weight_share?: number | null;
  weighted_contribution?: number | null;
  difficulty_reached: string | number | null;
  questions_asked?: number | null;
  assessed?: boolean | null;
  similar_skill_credit?: boolean;
  similar_skills_considered?: string[];
  transcript_evidence?: TranscriptEvidence[];
  signals_demonstrated: string[];
  signals_missing: string[];
  summary: string;
}

export interface EvaluationSectionSummary {
  summary: string;
  avg_score: number | null;
  difficulty_reached: string | number | null;
  questions_asked: number | null;
  evidence?: TranscriptEvidence[];
}

export interface HighlightAnswer {
  question: string;
  turn_number: number;
  section: string | null;
  difficulty_at_time: string | number | null;
  reason: string;
}

export interface RedFlag {
  description: string;
  severity: 'critical' | 'minor';
}

export interface ViolationSummary {
  total_irrelevant: number;
  total_silences: number;
  terminated_early: boolean;
  entries: any[];
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
  
  // Skills
  skill_scores: Record<string, EvaluationSkillBreakdown>;
  
  // Dimensions
  technical_dimension_score: number;
  score_evidence: string[];
  score_summary: string;
  behavioural_score: number;
  behavioural_evidence: string[];
  behavioural_summary: string;
  cultural_fit_score: number;
  cultural_fit_evidence: string[];
  cultural_fit_summary: string;
  tone_classification_score: number | null;
  tone_distribution: any[] | null;
  
  // Section summaries
  section_summaries: Record<string, EvaluationSectionSummary>;
  
  // Overall
  overall_score: number;
  hiring_recommendation: string;
  overall_narrative: string;
  recommendation_reasoning: string;
  
  // Highlights & Flags
  strengths: string[];
  concerns: string[];
  violation_summary: ViolationSummary | null;
  best_answer: HighlightAnswer | null;
  weakest_answer: HighlightAnswer | null;
  
  // Ranking
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
  hiring_recommendation: string;
  recommendation_reasoning: string;
  overall_narrative: string;
  technical_dimension_score: number;
  behavioural_score: number;
  cultural_fit_score: number;
  tone_classification_score: number | null;
  rank_in_assessment: number | null;
  percentile_in_assessment: number | null;
  total_candidates_evaluated: number | null;
  strengths: string[];
  concerns: string[];
  red_flags_count: number;
  skill_scores: Record<string, EvaluationSkillBreakdown>;
}

export interface RecruiterDecisionResponse {
  candidate_assessment_id: string;
  recruiter_decision: 'APPROVED' | 'REJECTED';
  updated_at: string;
}

