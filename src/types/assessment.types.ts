/**
 * assessment.types.ts
 *
 * Types and interfaces for assessment campaigns, JD analysis,
 * interview plans, and focus area overrides.
 */

// JD Analysis 

type InferredDifficulty = 'junior level' | 'mid-level' | 'senior level';

interface SkillPriority {
  skill: string;
  priority_score: number;
  reasoning: string;
}

interface JDAnalysis {
  inferred_difficulty: InferredDifficulty;
  skills: SkillPriority[];
  behavioural_signals: string[];
}

// Interview Plan 

interface InterviewSection {
  section_name: string;
  skill: string | null;
  allocated_mins: number;
  expected_signals?: string[];
}

interface InterviewPlan {
  total_mins: number;
  inferred_difficulty: InferredDifficulty;
  sections: InterviewSection[];
}

// â”€â”€ Focus Areas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface FocusAreaOverride {
  skill: string;
  weight_override: number;
}

// â”€â”€ Assessment Responses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type AssessmentStatus = 'PROCESSING' | 'DRAFT' | 'ACTIVE' | 'CLOSED';

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


