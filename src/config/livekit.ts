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
