const trueValues = new Set(['1', 'true', 'yes', 'on']);

/**
 * Force LiveKit media through TURN relay for restrictive office networks.
 *
 * This is intentionally disabled by default so normal networks retain the
 * lower-latency automatic ICE transport selection.
 */
export const LIVEKIT_FORCE_RELAY = trueValues.has(
  String(import.meta.env.VITE_LIVEKIT_FORCE_RELAY ?? '').trim().toLowerCase(),
);

/** LiveKit data-channel topic for interview lifecycle events from the agent. */
export const INTERVIEW_DATA_TOPIC = 'ibot.interview';

/** Reliable candidate-to-agent topic for main-room proctoring events. */
export const INTERVIEW_PROCTORING_TOPIC = 'ibot.proctoring';

export const INTERVIEW_CLOSING_EVENT = 'interview_closing';
export const INTERVIEW_TERMINATED_EVENT = 'interview_terminated';
export const TAB_SWITCH_EVENT = 'tab_switch';
