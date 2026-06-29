import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openRecruiterEventStream } from '../features/dashboard/services/realtime';
import type { RecruiterRealtimeEvent } from '../types/realtime.types';
import { useToast } from './useToast';

export const useRecruiterRealtime = () => {
  const queryClient = useQueryClient();
  const { success, warning } = useToast();
  const handledEventIds = useRef(new Set<string>());

  useEffect(() => {
    const refreshDashboardState = () => {
      void queryClient.invalidateQueries({ queryKey: ['assessments'] });
      void queryClient.invalidateQueries({ queryKey: ['candidates'] });
      void queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
          success(
            'Interview plan ready',
            `${payload.title ?? 'Your assessment'} is ready to use.`,
          );
        } else {
          warning(
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
        success(
          'Interview evaluation ready',
          `${payload.candidate_name ?? 'The candidate'}'s report is ready to review.`,
        );
      }
    };

    const eventSource = openRecruiterEventStream({
      onEvent: handleEvent,
      // Revalidate after every reconnect so no completion can be missed while
      // the browser, gateway, or Redis connection was temporarily offline.
      onOpen: refreshDashboardState,
    });

    return () => eventSource.close();
  }, [queryClient, success, warning]);
};
