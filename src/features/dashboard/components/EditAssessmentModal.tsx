import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Briefcase,
  CalendarDays,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useDeleteAssessment, useUpdateAssessment } from '../../../hooks/queries';
import { useToast } from '../../../hooks/useToast';
import type {
  AssessmentResponse,
  AssessmentUpdatePayload,
  InterviewSection,
} from '../../../types/assessment.types';
import {
  allocatedInterviewUnits,
  validateAssessmentEdit,
  type EditableAssessmentTopic,
} from '../utils/assessmentEdit';

interface EditAssessmentModalProps {
  assessment: AssessmentResponse;
  onClose: () => void;
  onDeleted: () => void;
}

const inputStyles =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-accent focus:ring-2 focus:ring-brand-soft disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

const sectionTime = (section: InterviewSection | undefined, fallback: number) =>
  section?.allocated_mins ?? fallback;

const toLocalInput = (iso: string) => {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const validIso = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

export const EditAssessmentModal: React.FC<EditAssessmentModalProps> = ({
  assessment,
  onClose,
  onDeleted,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const updateMutation = useUpdateAssessment();
  const deleteMutation = useDeleteAssessment();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const initialIntro = assessment.interview_plan?.sections.find(
    (section) => section.section_name === 'self_intro',
  );
  const initialBehavioural = assessment.interview_plan?.sections.find(
    (section) => section.section_name === 'behavioural_cultural',
  );
  const initialTopics = useMemo(
    () =>
      (assessment.interview_plan?.sections ?? [])
        .filter(
          (section) =>
            section.section_name !== 'self_intro' &&
            section.section_name !== 'behavioural_cultural' &&
            section.skill,
        )
        .map((section, index) => ({
          id: `${index}-${section.skill}`,
          skill: section.skill ?? section.section_name,
          allocatedMins: section.allocated_mins,
          expectedSignals:
            section.expected_signals && section.expected_signals.length >= 2
              ? [...section.expected_signals]
              : ['Demonstrates practical understanding', 'Explains decisions and trade-offs'],
        })),
    [assessment],
  );

  const [title, setTitle] = useState(assessment.title);
  const [roleName, setRoleName] = useState(assessment.role_name);
  const [duration, setDuration] = useState(assessment.interview_duration_mins);
  const [windowStart, setWindowStart] = useState(toLocalInput(assessment.window_start));
  const [windowEnd, setWindowEnd] = useState(toLocalInput(assessment.window_end));
  const [introMins, setIntroMins] = useState(sectionTime(initialIntro, 1));
  const [behaviouralMins, setBehaviouralMins] = useState(
    sectionTime(initialBehavioural, 1),
  );
  const [topics, setTopics] = useState<EditableAssessmentTopic[]>(initialTopics);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const planLocked = assessment.has_started_interviews;
  const allocatedUnits = allocatedInterviewUnits(introMins, behaviouralMins, topics);
  const requiredUnits = duration * 10;
  const remainingMins = (requiredUnits - allocatedUnits) / 10;
  const windowChanged =
    validIso(windowStart) !== new Date(assessment.window_start).toISOString() ||
    validIso(windowEnd) !== new Date(assessment.window_end).toISOString();

  const validationError = useMemo(() => {
    return validateAssessmentEdit({
      title,
      roleName,
      windowStart,
      windowEnd,
      planLocked,
      duration,
      introMins,
      behaviouralMins,
      topics,
    });
  }, [
    behaviouralMins,
    duration,
    introMins,
    planLocked,
    roleName,
    title,
    topics,
    windowEnd,
    windowStart,
  ]);

  useEffect(() => {
    titleInputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !updateMutation.isPending && !deleteMutation.isPending) {
        if (confirmDelete) setConfirmDelete(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDelete, deleteMutation.isPending, onClose, updateMutation.isPending]);

  const updateTopic = (id: string, changes: Partial<EditableAssessmentTopic>) => {
    setTopics((current) =>
      current.map((topic) => (topic.id === id ? { ...topic, ...changes } : topic)),
    );
  };

  const moveTopic = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= topics.length) return;
    setTopics((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addTopic = () => {
    setTopics((current) => [
      ...current,
      {
        id: `new-${crypto.randomUUID()}`,
        skill: '',
        allocatedMins: 1,
        expectedSignals: ['', ''],
      },
    ]);
  };

  const saveAssessment = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: AssessmentUpdatePayload = {
      title: title.trim(),
      role_name: roleName.trim(),
      window_start: new Date(windowStart).toISOString(),
      window_end: new Date(windowEnd).toISOString(),
    };
    if (!planLocked) {
      payload.interview_duration_mins = duration;
      payload.interview_plan = {
        sections: [
          { section_name: 'self_intro', skill: null, allocated_mins: introMins },
          ...topics.map((topic) => ({
            section_name: topic.skill.trim(),
            skill: topic.skill.trim(),
            allocated_mins: topic.allocatedMins,
            expected_signals: topic.expectedSignals.map((signal) => signal.trim()),
          })),
          {
            section_name: 'behavioural_cultural',
            skill: null,
            allocated_mins: behaviouralMins,
          },
        ],
      };
    }

    try {
      await updateMutation.mutateAsync({ id: assessment.id, payload });
      toastSuccess(
        'Assessment updated',
        windowChanged
          ? 'Changes saved. Pending candidates will receive the updated window.'
          : 'Your assessment changes were saved.',
      );
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update assessment.';
      setFormError(message);
      toastError('Update failed', message);
    }
  };

  const deleteAssessment = async () => {
    if (deleteConfirmation !== assessment.title) return;
    setFormError(null);
    try {
      await deleteMutation.mutateAsync(assessment.id);
      toastSuccess('Assessment deleted', 'The assessment was permanently removed.');
      onDeleted();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete assessment.';
      setFormError(message);
      setConfirmDelete(false);
      toastError('Deletion failed', message);
    }
  };

  return (
    <div className="ibot-overlay" role="presentation">
      <div
        className="ibot-modal max-h-[92vh] max-w-5xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-assessment-title"
      >
        <div className="h-1.5 shrink-0 bg-gradient-to-r from-brand-charcoal via-brand-accent to-brand-hover" />
        <header className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-gradient-to-r from-brand-soft via-white to-[#FCFAF6] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-charcoal text-white shadow-md shadow-black/15">
              <Edit3 className="h-4 w-4" />
            </span>
            <div>
              <h2 id="edit-assessment-title" className="font-display text-base font-black text-slate-950">
                Edit assessment
              </h2>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                Update campaign details, availability, and the interview sequence.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending || deleteMutation.isPending}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40"
            aria-label="Close edit assessment"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          id="edit-assessment-form"
          onSubmit={saveAssessment}
          className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto bg-gradient-to-br from-white via-slate-50/50 to-brand-soft/20 px-4 py-5 sm:px-6"
        >
          <div className="space-y-5">
            {(formError || validationError) && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError || validationError}</span>
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-hover">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-brand-hover">Assessment details</h3>
                  <p className="text-[9px] font-semibold text-slate-400">Candidate-facing campaign and scheduling information.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Assessment title
                  <input ref={titleInputRef} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className={inputStyles} />
                </label>
                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Role name
                  <input value={roleName} onChange={(event) => setRoleName(event.target.value)} maxLength={120} className={inputStyles} />
                </label>
                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Window starts
                  <input type="datetime-local" value={windowStart} onChange={(event) => setWindowStart(event.target.value)} className={inputStyles} />
                </label>
                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Window ends
                  <input type="datetime-local" value={windowEnd} onChange={(event) => setWindowEnd(event.target.value)} className={inputStyles} />
                </label>
              </div>
              {windowChanged && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] font-semibold leading-4 text-amber-800">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Pending candidates will receive an email with the updated window after you save.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-indigo-700">Interview plan</h3>
                    <p className="text-[9px] font-semibold text-slate-400">Order topics and allocate the complete interview time.</p>
                  </div>
                </div>
                <div className={`rounded-xl border px-3 py-2 text-right ${remainingMins === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">Allocated</p>
                  <p className={`text-sm font-black ${remainingMins === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {(allocatedUnits / 10).toFixed(1)} / {duration} min
                  </p>
                  {remainingMins !== 0 && (
                    <p className="text-[8px] font-bold text-amber-700">
                      {remainingMins > 0 ? `${remainingMins.toFixed(1)} remaining` : `${Math.abs(remainingMins).toFixed(1)} over`}
                    </p>
                  )}
                </div>
              </div>

              {planLocked && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-[10px] font-semibold leading-4 text-blue-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  An interview has already started. Duration and plan topics are locked to keep live interviews and evaluations consistent; assessment details and dates remain editable.
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
                <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Total duration
                  <input type="number" min={2} max={180} step={1} value={duration} disabled={planLocked} onChange={(event) => setDuration(Number(event.target.value))} className={inputStyles} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Introduction
                    <input type="number" min={0.1} step={0.1} value={introMins} disabled={planLocked} onChange={(event) => setIntroMins(Number(event.target.value))} className={inputStyles} />
                  </label>
                  <label className="space-y-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Behavioural
                    <input type="number" min={0.1} step={0.1} value={behaviouralMins} disabled={planLocked} onChange={(event) => setBehaviouralMins(Number(event.target.value))} className={inputStyles} />
                  </label>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700">Technical and domain topics</h4>
                    <p className="text-[9px] font-semibold text-slate-400">The displayed order is the interview order.</p>
                  </div>
                  <button type="button" onClick={addTopic} disabled={planLocked} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-charcoal px-3 py-2 text-[9px] font-black text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40">
                    <Plus className="h-3.5 w-3.5" /> Add topic
                  </button>
                </div>

                {topics.map((topic, index) => (
                  <article key={topic.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[9px] font-black text-slate-500 shadow-sm">{index + 1}</span>
                      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_110px]">
                        <label className="space-y-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
                          Topic name
                          <input value={topic.skill} disabled={planLocked} maxLength={120} onChange={(event) => updateTopic(topic.id, { skill: event.target.value })} placeholder="e.g. System Design" className={inputStyles} />
                        </label>
                        <label className="space-y-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
                          Minutes
                          <input type="number" min={0.1} step={0.1} value={topic.allocatedMins} disabled={planLocked} onChange={(event) => updateTopic(topic.id, { allocatedMins: Number(event.target.value) })} className={inputStyles} />
                        </label>
                      </div>
                      <div className="flex shrink-0 gap-1 pt-4">
                        <button type="button" disabled={planLocked || index === 0} onClick={() => moveTopic(index, -1)} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-brand-hover disabled:opacity-30" aria-label={`Move ${topic.skill || 'topic'} up`}><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" disabled={planLocked || index === topics.length - 1} onClick={() => moveTopic(index, 1)} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-brand-hover disabled:opacity-30" aria-label={`Move ${topic.skill || 'topic'} down`}><ArrowDown className="h-3.5 w-3.5" /></button>
                        <button type="button" disabled={planLocked || topics.length === 1} onClick={() => setTopics((current) => current.filter((item) => item.id !== topic.id))} className="rounded-lg border border-red-200 bg-white p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30" aria-label={`Remove ${topic.skill || 'topic'}`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div className="ml-8 mt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Expected signals</p>
                        <button type="button" disabled={planLocked || topic.expectedSignals.length >= 4} onClick={() => updateTopic(topic.id, { expectedSignals: [...topic.expectedSignals, ''] })} className="text-[9px] font-black text-brand-hover hover:text-brand-charcoal disabled:opacity-30">+ Add signal</button>
                      </div>
                      <div className="space-y-2">
                        {topic.expectedSignals.map((signal, signalIndex) => (
                          <div key={`${topic.id}-signal-${signalIndex}`} className="flex gap-2">
                            <input value={signal} disabled={planLocked} maxLength={200} onChange={(event) => {
                              const expectedSignals = [...topic.expectedSignals];
                              expectedSignals[signalIndex] = event.target.value;
                              updateTopic(topic.id, { expectedSignals });
                            }} placeholder="Observable evidence the interviewer should listen for" className={inputStyles} />
                            <button type="button" disabled={planLocked || topic.expectedSignals.length <= 2} onClick={() => updateTopic(topic.id, { expectedSignals: topic.expectedSignals.filter((_, itemIndex) => itemIndex !== signalIndex) })} className="rounded-lg border border-slate-200 bg-white px-2 text-slate-400 hover:border-red-200 hover:text-red-500 disabled:opacity-30" aria-label="Remove expected signal"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-red-700">Danger zone</h3>
                    <p className="mt-1 text-[9px] font-semibold leading-4 text-red-700/80">
                      Permanently delete this assessment, its enrollments, sessions, and evaluations.
                    </p>
                    {planLocked && <p className="mt-1 text-[9px] font-black text-red-700">Deletion is unavailable because an interview has started.</p>}
                  </div>
                </div>
                <button type="button" disabled={planLocked || deleteMutation.isPending} onClick={() => { setDeleteConfirmation(''); setConfirmDelete(true); }} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-[9px] font-black text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
                  <Trash2 className="h-3.5 w-3.5" /> Delete assessment
                </button>
              </div>
            </section>
          </div>
        </form>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/90 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} disabled={updateMutation.isPending} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Cancel</button>
          <button type="submit" form="edit-assessment-form" disabled={Boolean(validationError) || updateMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-charcoal px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40">
            {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="delete-assessment-title">
            <div className="border-b border-red-100 bg-red-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white"><Trash2 className="h-4 w-4" /></span>
                <div>
                  <h2 id="delete-assessment-title" className="text-sm font-black text-red-950">Permanently delete assessment?</h2>
                  <p className="mt-0.5 text-[10px] font-semibold text-red-700">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-xs font-semibold leading-5 text-slate-600">
                Type <strong className="text-slate-900">{assessment.title}</strong> to confirm deletion of all associated operational data.
              </p>
              <input autoFocus value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className={inputStyles} aria-label="Type assessment title to confirm deletion" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleteMutation.isPending} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Keep assessment</button>
                <button type="button" onClick={deleteAssessment} disabled={deleteConfirmation !== assessment.title || deleteMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">
                  {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
