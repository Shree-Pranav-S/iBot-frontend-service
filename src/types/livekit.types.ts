export interface LiveKitTokenResponse {
  livekit_url: string;
  token: string;
  room_name: string;
  elapsed_secs: number;
  interview_started: boolean;
  tab_switch_count: number;
}

export interface CandidateSessionBootstrapResponse {
  session_token: string;
  session_token_expires_at: string;
  session_status: string;
  invite_reissued: boolean;
  interview_started: boolean;
  reconnect_deadline: string | null;
  disconnect_count: number;
  candidate_name: string;
  company_name: string;
  assessment_title: string;
  interview_duration_mins: number;
  window_end: string;
  status: string;
  sections_overview: string[];
}
