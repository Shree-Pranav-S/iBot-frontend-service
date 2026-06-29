import { API_BASE_URL } from '../../../config/api';
import type { RecruiterRealtimeEvent } from '../../../types/realtime.types';

const RECRUITER_EVENT_NAME = 'recruiter-update';

export const openRecruiterEventStream = ({
  onEvent,
  onOpen,
}: {
  onEvent: (event: RecruiterRealtimeEvent) => void;
  onOpen: () => void;
}): EventSource => {
  const eventSource = new EventSource(
    `${API_BASE_URL}/sse/recruiter-events`,
    { withCredentials: true },
  );

  eventSource.onopen = onOpen;
  eventSource.addEventListener(RECRUITER_EVENT_NAME, (message) => {
    try {
      onEvent(JSON.parse((message as MessageEvent<string>).data));
    } catch (error) {
      console.error('Ignored malformed recruiter dashboard event', error);
    }
  });
  return eventSource;
};
