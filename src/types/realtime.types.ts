export type RecruiterEventType =
  | 'ASSESSMENT_PROCESSING_COMPLETED'
  | 'ASSESSMENT_PROCESSING_FAILED'
  | 'RESUME_PARSING_COMPLETED'
  | 'RESUME_PARSING_FAILED'
  | 'INTERVIEW_EVALUATED';

export interface RecruiterRealtimeEvent {
  event_id: string;
  event_type: RecruiterEventType;
  occurred_at: string;
  payload: {
    assessment_id?: string;
    candidate_assessment_id?: string;
    candidate_name?: string;
    assessment_title?: string;
    title?: string;
    status?: string;
    resume_parse_status?: string;
    overall_score?: number;
    hiring_recommendation?: string;
    notification_id?: string;
    notification_sent_at?: string;
  };
}

export interface RecruiterDashboardNotification {
  id: string;
  candidate_assessment_id: string;
  notification_type: 'REPORT_READY';
  title: string;
  message: string;
  candidate_name: string;
  assessment_title: string;
  role_name: string;
  sent_at: string;
}
