import type { InterviewTranscriptResponse, TranscriptTurn } from '../../../types/candidate.types';
import { formatLabel } from './evaluationUiUtils';

export const isInterviewerTurn = (turn: TranscriptTurn) => {
  const speaker = turn.speaker.toLowerCase();
  return speaker === 'bot' || speaker === 'interviewer' || speaker === 'agent';
};

export const formatElapsedTime = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return null;
  }
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export const transcriptTurnTime = (turn: TranscriptTurn) => {
  const elapsed = formatElapsedTime(turn.elapsed_secs);
  if (elapsed) return elapsed;
  if (!turn.timestamp) return null;
  const date = new Date(turn.timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

const safeFilePart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'candidate';

export const transcriptFileName = (candidateName: string) =>
  `${safeFilePart(candidateName)}-interview-transcript.txt`;

export const buildTranscriptText = (transcript: InterviewTranscriptResponse) => {
  const duration = formatElapsedTime(transcript.total_elapsed_secs) ?? 'Unavailable';
  const header = [
    'INTERVIEW TRANSCRIPT',
    '====================',
    `Candidate: ${transcript.candidate_name || 'Candidate'}`,
    `Assessment: ${transcript.assessment_title || 'Assessment'}`,
    `Duration: ${duration}`,
    `Total turns: ${transcript.turns.length}`,
    '',
  ];

  const turns = transcript.turns.flatMap((turn) => {
    const speaker = isInterviewerTurn(turn) ? 'Interviewer' : 'Candidate';
    const time = transcriptTurnTime(turn);
    const context = [
      turn.section ? `Section: ${formatLabel(turn.section)}` : null,
      turn.skill ? `Skill: ${turn.skill}` : null,
      turn.difficulty ? `Difficulty: ${formatLabel(turn.difficulty)}` : null,
      turn.question_type ? `Question type: ${formatLabel(turn.question_type)}` : null,
      turn.response_type ? `Response type: ${formatLabel(turn.response_type)}` : null,
      turn.tone ? `Tone: ${formatLabel(turn.tone)}` : null,
    ].filter(Boolean);
    return [
      `[Turn ${turn.turn_number}${time ? ` · ${time}` : ''}] ${speaker}`,
      ...(context.length > 0 ? [context.join(' · ')] : []),
      turn.text.trim() || '[No transcribed text]',
      '',
    ];
  });

  return [...header, ...turns].join('\n');
};

export const downloadTextFile = (contents: string, fileName: string) => {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
