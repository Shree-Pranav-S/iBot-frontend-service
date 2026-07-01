import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openRecruiterEventStream } from '../features/dashboard/services/realtime';
import type { RecruiterRealtimeEvent } from '../types/realtime.types';
import { useToast } from './useToast';

export const useRecruiterRealtime = () => {
  const queryClient = useQueryClient();
  const { success, warning } = useToast();
  const toastRef = useRef({ success, warning });
  toastRef.current = { success, warning };

  const handledEventIds = useRef(new Set<string>());
  const isInitialConnect = useRef(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const refreshDashboardState = () => {
      if (isInitialConnect.current) {
        isInitialConnect.current = false;
        return;
      }

      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['assessments'] });
        void queryClient.invalidateQueries({ queryKey: ['candidates'] });
        void queryClient.invalidateQueries({ queryKey: ['evaluations'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }, 750);
    };

    const handleEvent = (event: RecruiterRealtimeEvent) => {
      if (handledEventIds.current.has(event.event_id)) return;
      handledEventIds.current.add(event.event_id);

      const payload = event.payload;
      if (event.event_type.startsWith('ASSESSMENT_PROCESSING_')) {
        void queryClient.invalidateQueries({ queryKey: ['assessments'] });
        if (payload.assessment_id) {
          void queryClient.invalidateQueries({
            queryKey: ['assessments', payload.assessment_id],
          });
        }
        if (event.event_type === 'ASSESSMENT_PROCESSING_COMPLETED') {
          toastRef.current.success(
            'Interview plan ready',
            `${payload.title ?? 'Your assessment'} is ready to use.`,
          );
        } else {
          toastRef.current.warning(
            'Assessment processing failed',
            `${payload.title ?? 'The assessment'} could not be prepared.`,
          );
        }
        return;
      }

      if (event.event_type.startsWith('RESUME_PARSING_')) {
        void queryClient.invalidateQueries({ queryKey: ['candidates'] });
        return;
      }

      if (event.event_type === 'INTERVIEW_EVALUATED') {
        void queryClient.invalidateQueries({ queryKey: ['candidates'] });
        void queryClient.invalidateQueries({ queryKey: ['evaluations'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        if (payload.candidate_assessment_id) {
          void queryClient.invalidateQueries({
            queryKey: ['candidate-evaluation', payload.candidate_assessment_id],
          });
        }
        toastRef.current.success(
          'Interview evaluation ready',
          `${payload.candidate_name ?? 'The candidate'}'s report is ready to review.`,
        );
      }
    };

    const eventSource = openRecruiterEventStream({
      onEvent: handleEvent,
      onOpen: refreshDashboardState,
    });

    return () => {
      clearTimeout(refreshTimer.current);
      eventSource.close();
    };
  }, [queryClient]);
};
