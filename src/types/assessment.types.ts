/**
 * assessment.types.ts
 *
 * Types and interfaces for assessment campaigns, JD analysis,
 * interview plans, and focus area overrides.
 */

// ── JD Analysis ───────────────────────────────────────────────────────────────

export interface SkillPriority {
  skill: string;
  priority_score: number;
  depth_required: string;
  reasoning: string;
}

export interface JDAnalysis {
  inferred_role_title: string;
  seniority_level: string;
  difficulty: string;
  skills: SkillPriority[];
  behavioural_signals: string[];
}

// ── Interview Plan ────────────────────────────────────────────────────────────

export interface InterviewSection {
  section_name: string;
  skill: string | null;
  allocated_mins: number;
  priority_score: number | null;
}

export interface InterviewPlan {
  total_mins: number;
  sections: InterviewSection[];
}

// ── Focus Areas ───────────────────────────────────────────────────────────────

export interface FocusAreaOverride {
  skill: string;
  weight_override: number;
}

// ── Assessment Responses ──────────────────────────────────────────────────────

export type AssessmentStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface AssessmentResponse {
  id: string;
  recruiter_id: string;
  title: string;
  role_name: string;
  jd_text: string;
  jd_file_path: string | null;
  jd_analysis: JDAnalysis | null;
  focus_areas: FocusAreaOverride[] | null;
  interview_plan: InterviewPlan | null;
  interview_duration_mins: number;
  window_start: string;
  window_end: string;
  status: AssessmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AssessmentSummaryResponse {
  id: string;
  title: string;
  role_name: string;
  status: AssessmentStatus;
  interview_duration_mins: number;
  window_start: string;
  window_end: string;
  created_at: string;
}
