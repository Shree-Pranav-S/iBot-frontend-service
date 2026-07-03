import React from 'react';
import type {
  InterviewEvaluationResponse,
  InterviewTranscriptResponse,
} from '../../../types/candidate.types';
import { formatDateTime, formatLabel, scoreLabel } from './evaluationUiUtils';
import {
  formatElapsedTime,
  isInterviewerTurn,
  transcriptTurnTime,
} from './evaluationReportUtils';

interface EvaluationPrintReportProps {
  evaluation: InterviewEvaluationResponse;
  transcript: InterviewTranscriptResponse | null | undefined;
  recommendationReasoning: string;
  hiringRedFlag: string;
}

export const EvaluationPrintReport: React.FC<EvaluationPrintReportProps> = ({
  evaluation,
  transcript,
  recommendationReasoning,
  hiringRedFlag,
}) => {
  const skills = Object.entries(evaluation.skill_scores ?? {}).sort(([, a], [, b]) => {
    const priorityDifference = b.priority_score - a.priority_score;
    return priorityDifference || b.score - a.score;
  });
  const questions = evaluation.question_evaluations ?? [];
  const violation = evaluation.violation_summary;

  return (
    <article className="evaluation-print-report">
      <header className="evaluation-print-header">
        <div>
          <p className="evaluation-print-kicker">iBot recruiter evaluation</p>
          <h1>{evaluation.candidate_name || 'Candidate'}</h1>
          <p className="evaluation-print-subtitle">
            {[evaluation.role_name, evaluation.assessment_title].filter(Boolean).join(' · ')}
          </p>
          {evaluation.candidate_email && <p>{evaluation.candidate_email}</p>}
        </div>
        <dl className="evaluation-print-header-meta">
          <div>
            <dt>Recommendation</dt>
            <dd>{formatLabel(evaluation.hiring_recommendation)}</dd>
          </div>
          <div>
            <dt>Recruiter decision</dt>
            <dd>{formatLabel(evaluation.recruiter_decision || 'pending')}</dd>
          </div>
          <div>
            <dt>Generated</dt>
            <dd>{formatDateTime(evaluation.generated_at)}</dd>
          </div>
        </dl>
      </header>

      <PrintSection number="01" title="Executive decision">
        <div className="evaluation-print-score-grid">
          <PrintScore label="Final score" score={evaluation.overall_score} />
          <PrintScore label="Technical" score={evaluation.overall_technical_skill_score} />
          <PrintScore label="Behaviour & culture" score={evaluation.behavioural_cultural_score} />
          <PrintScore label="Communication" score={evaluation.communication_score} />
          <PrintScore label="Self introduction" score={evaluation.intro_section_score} />
        </div>
        <div className="evaluation-print-block">
          <h3>Executive summary</h3>
          <p>{evaluation.overall_summary}</p>
        </div>
        <div className="evaluation-print-block">
          <h3>Recommendation reasoning</h3>
          <p>{recommendationReasoning}</p>
        </div>
        {hiringRedFlag && (
          <div className="evaluation-print-alert">
            <strong>Hiring red flag</strong>
            <p>{hiringRedFlag}</p>
          </div>
        )}
        {evaluation.recruiter_feedback && (
          <div className="evaluation-print-block">
            <h3>Recruiter note</h3>
            <p>{evaluation.recruiter_feedback}</p>
          </div>
        )}
        <dl className="evaluation-print-facts">
          <div>
            <dt>Performance score</dt>
            <dd>{evaluation.raw_overall_score.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Integrity adjustment</dt>
            <dd>−{evaluation.violation_penalty.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Final score</dt>
            <dd>{evaluation.overall_score.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Assessment rank</dt>
            <dd>
              {evaluation.rank_in_assessment
                ? `#${evaluation.rank_in_assessment} of ${evaluation.total_candidates_evaluated ?? '—'}`
                : 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt>Percentile</dt>
            <dd>
              {evaluation.percentile_in_assessment === null
                ? 'Unavailable'
                : `${evaluation.percentile_in_assessment}%`}
            </dd>
          </div>
        </dl>
        <div className="evaluation-print-two-column">
          <PrintSignalList title="Demonstrated strengths" items={evaluation.strengths} />
          <PrintSignalList title="Technical concerns" items={evaluation.concerns} />
        </div>
      </PrintSection>

      <PrintSection number="02" title="Technical skill assessment" pageBreak>
        {skills.length === 0 ? (
          <p>No technical skill scores were generated.</p>
        ) : (
          <div className="evaluation-print-list">
            {skills.map(([skill, details]) => (
              <div key={skill} className="evaluation-print-block">
                <div className="evaluation-print-row-heading">
                  <div>
                    <h3>{skill}</h3>
                    <p>
                      Priority {details.priority_score.toFixed(1)} ·{' '}
                      {details.questions_evaluated} question
                      {details.questions_evaluated === 1 ? '' : 's'} ·{' '}
                      {Math.round(details.confidence * 100)}% confidence
                    </p>
                  </div>
                  <strong>{details.score.toFixed(1)}/10</strong>
                </div>
                <p>{evaluation.skill_summary?.[skill] || 'No summary generated.'}</p>
                <PrintEvidence
                  evidence={evaluation.skill_evidence?.[skill] || []}
                  empty="No direct skill evidence was recorded."
                />
              </div>
            ))}
          </div>
        )}
      </PrintSection>

      <PrintSection number="03" title="Question-by-question review" pageBreak>
        <dl className="evaluation-print-facts">
          <div>
            <dt>Questions assessed</dt>
            <dd>{questions.length}</dd>
          </div>
          <div>
            <dt>Substantive answers</dt>
            <dd>
              {questions.filter((question) => question.answered).length}/{questions.length}
            </dd>
          </div>
          <div>
            <dt>Average score</dt>
            <dd>
              {questions.length
                ? `${(
                    questions.reduce((sum, question) => sum + question.score, 0) /
                    questions.length
                  ).toFixed(1)}/10`
                : 'Unavailable'}
            </dd>
          </div>
        </dl>
        {questions.length === 0 ? (
          <p>No structured question evaluations are available for this report.</p>
        ) : (
          <div className="evaluation-print-list">
            {questions.map((question, index) => (
              <div key={question.question_id} className="evaluation-print-block">
                <div className="evaluation-print-row-heading">
                  <div>
                    <p className="evaluation-print-eyebrow">
                      Question {index + 1} ·{' '}
                      {question.skill || formatLabel(question.section)} ·{' '}
                      {formatLabel(question.difficulty)}
                    </p>
                    <h3>{question.question_text}</h3>
                  </div>
                  <strong>{question.score.toFixed(1)}/10</strong>
                </div>
                <dl className="evaluation-print-inline-facts">
                  <div>
                    <dt>Status</dt>
                    <dd>{question.answered ? 'Answered' : 'No substantive answer'}</dd>
                  </div>
                  <div>
                    <dt>Relevance</dt>
                    <dd>{formatLabel(question.relevance_class)}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{Math.round(question.confidence * 100)}%</dd>
                  </div>
                </dl>
                <h4>Answer assessment</h4>
                <p>{question.answer_summary}</p>
                <PrintEvidence
                  evidence={question.evidence}
                  empty="No question evidence was recorded."
                />
              </div>
            ))}
          </div>
        )}
      </PrintSection>

      <PrintSection number="04" title="Interview dimensions" pageBreak>
        <PrintDimension
          title="Self introduction"
          score={evaluation.intro_section_score}
          summary={evaluation.intro_section_summary}
          evidence={evaluation.intro_section_evidence}
        />
        <PrintDimension
          title="Behaviour and culture"
          score={evaluation.behavioural_cultural_score}
          summary={evaluation.behavioural_cultural_summary}
          evidence={evaluation.behavioural_cultural_evidence}
        />
        <PrintDimension
          title="Communication"
          score={evaluation.communication_score}
          summary={evaluation.communication_summary}
          evidence={evaluation.communication_evidence}
        />
        <h3 className="evaluation-print-subsection-title">Communication by section</h3>
        <div className="evaluation-print-list">
          {Object.entries(evaluation.section_communication_scores ?? {}).map(
            ([section, details]) => (
              <PrintDimension
                key={section}
                title={formatLabel(section)}
                score={details.score}
                summary={details.summary}
                evidence={details.evidence}
                compact
              />
            ),
          )}
        </div>
      </PrintSection>

      <PrintSection number="05" title="Integrity and conduct" pageBreak>
        {!violation ? (
          <p>No violation summary was generated.</p>
        ) : (
          <>
            <dl className="evaluation-print-facts">
              <div>
                <dt>Confirmed</dt>
                <dd>{violation.validated_violation_count}</dd>
              </div>
              <div>
                <dt>Low</dt>
                <dd>{violation.severity_counts.low}</dd>
              </div>
              <div>
                <dt>Medium</dt>
                <dd>{violation.severity_counts.medium}</dd>
              </div>
              <div>
                <dt>High</dt>
                <dd>{violation.severity_counts.high}</dd>
              </div>
              <div>
                <dt>Critical</dt>
                <dd>{violation.severity_counts.critical}</dd>
              </div>
            </dl>
            <div className="evaluation-print-block">
              <p>{violation.summary}</p>
            </div>
            {violation.hard_gate_reasons.length > 0 && (
              <PrintSignalList
                title="Hiring gate reasons"
                items={violation.hard_gate_reasons}
              />
            )}
            <PrintEvidence
              evidence={evaluation.violation_evidence ?? []}
              empty="No supporting integrity evidence was recorded."
            />
          </>
        )}
      </PrintSection>

      <PrintSection number="06" title="Complete interview transcript" pageBreak>
        {!transcript || transcript.turns.length === 0 ? (
          <p>No transcript was available when this report was printed.</p>
        ) : (
          <>
            <p className="evaluation-print-section-intro">
              {transcript.turns.length} turns · Duration{' '}
              {formatElapsedTime(transcript.total_elapsed_secs) ?? 'unavailable'}
            </p>
            <div className="evaluation-print-transcript">
              {transcript.turns.map((turn) => {
                const interviewer = isInterviewerTurn(turn);
                const time = transcriptTurnTime(turn);
                return (
                  <div
                    key={turn.turn_id || turn.turn_number}
                    className="evaluation-print-transcript-turn"
                  >
                    <div className="evaluation-print-transcript-meta">
                      <strong>{interviewer ? 'Interviewer' : 'Candidate'}</strong>
                      <span>
                        Turn {turn.turn_number}
                        {time ? ` · ${time}` : ''}
                      </span>
                    </div>
                    {(turn.section || turn.skill || turn.difficulty) && (
                      <p className="evaluation-print-eyebrow">
                        {[
                          turn.section ? formatLabel(turn.section) : null,
                          turn.skill,
                          turn.difficulty ? formatLabel(turn.difficulty) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    <p>{turn.text || '[No transcribed text]'}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </PrintSection>

      <footer className="evaluation-print-footer">
        Generated by iBot · {formatDateTime(evaluation.generated_at)}
      </footer>
    </article>
  );
};

const PrintSection: React.FC<{
  number: string;
  title: string;
  pageBreak?: boolean;
  children: React.ReactNode;
}> = ({ number, title, pageBreak = false, children }) => (
  <section
    className={`evaluation-print-section ${
      pageBreak ? 'evaluation-print-page-break' : ''
    }`}
  >
    <header className="evaluation-print-section-heading">
      <span>{number}</span>
      <h2>{title}</h2>
    </header>
    {children}
  </section>
);

const PrintScore: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <div className="evaluation-print-score">
    <span>{label}</span>
    <strong>{score.toFixed(1)}</strong>
    <small>{scoreLabel(score)}</small>
  </div>
);

const PrintEvidence: React.FC<{ evidence: string[]; empty: string }> = ({
  evidence,
  empty,
}) => (
  <div className="evaluation-print-evidence">
    <h4>Evidence</h4>
    {evidence.length === 0 ? (
      <p>{empty}</p>
    ) : (
      <ul>
        {evidence.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    )}
  </div>
);

const PrintSignalList: React.FC<{ title: string; items: string[] }> = ({
  title,
  items,
}) => (
  <div className="evaluation-print-block">
    <h3>{title}</h3>
    {items.length === 0 ? (
      <p>None identified.</p>
    ) : (
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )}
  </div>
);

const PrintDimension: React.FC<{
  title: string;
  score: number;
  summary: string;
  evidence: string[];
  compact?: boolean;
}> = ({ title, score, summary, evidence, compact = false }) => (
  <div className={`evaluation-print-block ${compact ? 'evaluation-print-compact' : ''}`}>
    <div className="evaluation-print-row-heading">
      <h3>{title}</h3>
      <strong>{score.toFixed(1)}/10</strong>
    </div>
    <p>{summary}</p>
    <PrintEvidence evidence={evidence} empty="No direct evidence was recorded." />
  </div>
);
