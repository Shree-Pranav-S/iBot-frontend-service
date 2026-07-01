import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import {
  useAssessments,
  useCandidates,
  useBulkUploadCandidates,
  useCreateCandidate,
  useDeleteCandidate,
  useUniqueCandidates,
  useEnrollCandidate,
  useCandidateEvaluation,
} from '../../../hooks/queries';
import type {
  BulkUploadResponse,
  CandidateAssessmentListItem,
} from '../../../types/candidate.types';
import { DecisionModal } from './EvaluationUI';
import { formatDateTime, useEvaluationDecision } from './evaluationUiUtils';
import {
  buildAssessmentInstanceNumbers,
  buildAssessmentSelectOptions,
  formatAssessmentTitle,
  formatEnrolledAssessmentsList,
} from '../utils/assessmentDisplay';
import {
  Users,
  Mail,
  FileText,
  Loader2,
  AlertCircle,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ChevronDown,
  Info,
  Briefcase,
  Trash2,
  Plus,
  UserPlus,
  ArrowUpRight,
  CalendarClock,
  ClipboardList,
  UserCheck,
  UserX,
} from 'lucide-react';

const PAGE_SIZE = 15;

export const CandidatesPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  // Fetch assessments for dropdown selector
  const { data: assessments = [], isLoading: loadingCampaigns } = useAssessments();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [page, setPage] = useState(0);
  const searchQuery = '';

  const instanceNumbers = useMemo(
    () => buildAssessmentInstanceNumbers(assessments),
    [assessments],
  );
  const assessmentSelectOptions = useMemo(
    () => buildAssessmentSelectOptions(assessments, instanceNumbers),
    [assessments, instanceNumbers],
  );

  // Candidates query & mutations
  const { data: candidates = [], isLoading: loadingCandidates } = useCandidates(selectedCampaignId || null);
  const { data: uniqueCandidates = [] } = useUniqueCandidates();
  const selectedAssessment = assessments.find(a => a.id === selectedCampaignId) || null;
  const bulkUploadMutation = useBulkUploadCandidates();
  const deleteMutation = useDeleteCandidate();
  const enrollMutation = useEnrollCandidate();
  const {
    modal: decisionModal,
    requestDecision,
    closeDecision,
    saveDecision,
    isSaving: isSavingDecision,
  } = useEvaluationDecision();

  // Candidate detail and document modal states
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateAssessmentListItem | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showJdModal, setShowJdModal] = useState(false);
  const activeCandidate = selectedCandidate
    ? candidates.find((candidate) => candidate.id === selectedCandidate.id) ?? selectedCandidate
    : null;
  const {
    data: candidateEvaluation,
    isLoading: loadingCandidateEvaluation,
    isError: candidateEvaluationError,
  } = useCandidateEvaluation(
    showCandidateModal && activeCandidate?.status === 'EVALUATED'
      ? activeCandidate.id
      : null,
  );

  useEffect(() => {
    if (!showCandidateModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !decisionModal.open) {
        setShowCandidateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [decisionModal.open, showCandidateModal]);

  const openCandidateDetails = (candidate: CandidateAssessmentListItem) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  const openCandidateResume = (candidate: CandidateAssessmentListItem) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(false);
    setShowResumeModal(true);
  };

  const openCandidateJd = (candidate: CandidateAssessmentListItem) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(false);
    setShowJdModal(true);
  };

  const requestCandidateDecision = (decision: 'APPROVED' | 'REJECTED') => {
    if (!activeCandidate) return;
    requestDecision(
      activeCandidate.id,
      activeCandidate.full_name,
      activeCandidate.recruiter_decision,
      decision,
    );
  };

  // CSV Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadModal = () => {
    setCsvFile(null);
    setUploadResult(null);
    setDragOver(false);
  };

  // Manual Create modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualAssessmentId, setManualAssessmentId] = useState('');
  const [manualResume, setManualResume] = useState<File | null>(null);
  const createMutation = useCreateCandidate();

  const resetManualModal = () => {
    setManualName('');
    setManualEmail('');
    setManualAssessmentId(selectedCampaignId !== 'all' ? (selectedCampaignId || '') : '');
    setManualResume(null);
  };

  const handleCloseManual = () => {
    setShowManualModal(false);
    resetManualModal();
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualEmail || !manualAssessmentId || !manualResume) {
      toastError('Missing Fields', 'Please fill in all fields and select an assessment.');
      return;
    }

    const normalizedEmail = manualEmail.trim().toLowerCase();
    const existingCandidate = uniqueCandidates.find(
      (c) => c.email.trim().toLowerCase() === normalizedEmail,
    );
    if (existingCandidate) {
      toastError(
        'Candidate Already Exists',
        'This email is already registered. Use Enroll to add them to another assessment.',
      );
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: manualName.trim(),
        email: normalizedEmail,
        assessmentId: manualAssessmentId,
        resumeFile: manualResume,
      });
      toastSuccess('Candidate Added', 'Invitation sent successfully.');
      handleCloseManual();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Creation failed.';
      if (msg.toLowerCase().includes('already exists')) {
        toastError(
          'Candidate Already Exists',
          'Use Enroll to add this candidate to another assessment.',
        );
      } else {
        toastError('Failed', msg);
      }
    }
  };

  // Enroll existing candidate modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCandidateId, setEnrollCandidateId] = useState('');
  const [enrollAssessmentId, setEnrollAssessmentId] = useState('');
  const [enrollResume, setEnrollResume] = useState<File | null>(null);
  const needEnrollmentsLookup = showEnrollModal && selectedCampaignId !== 'all';
  const { data: fetchedAllEnrollments = [] } = useCandidates(needEnrollmentsLookup ? 'all' : null);
  const allEnrollments = selectedCampaignId === 'all' ? candidates : fetchedAllEnrollments;
  const selectedEnrollCandidate = uniqueCandidates.find(
    (candidate) => candidate.id === enrollCandidateId,
  );
  const enrolledAssessmentIds = useMemo(() => {
    if (!selectedEnrollCandidate) return new Set<string>();
    const email = selectedEnrollCandidate.email.trim().toLowerCase();
    return new Set(
      allEnrollments
        .filter((enrollment) => enrollment.email.trim().toLowerCase() === email)
        .map((enrollment) => enrollment.assessment_id)
        .filter((id): id is string => Boolean(id)),
    );
  }, [selectedEnrollCandidate, allEnrollments]);
  const enrollAssessmentSelectOptions = useMemo(
    () =>
      buildAssessmentSelectOptions(assessments, instanceNumbers).filter(
        (option) => !enrolledAssessmentIds.has(option.value),
      ),
    [assessments, instanceNumbers, enrolledAssessmentIds],
  );
  const enrolledAssessmentsSummary = useMemo(() => {
    if (enrolledAssessmentIds.size === 0) return '';
    return formatEnrolledAssessmentsList(
      [...enrolledAssessmentIds],
      assessments,
      instanceNumbers,
    );
  }, [enrolledAssessmentIds, assessments, instanceNumbers]);

  useEffect(() => {
    if (enrollAssessmentId && enrolledAssessmentIds.has(enrollAssessmentId)) {
      setEnrollAssessmentId('');
    }
  }, [enrollAssessmentId, enrolledAssessmentIds]);

  const resetEnrollModal = () => {
    setEnrollCandidateId('');
    setEnrollAssessmentId('');
    setEnrollResume(null);
  };

  const handleCloseEnroll = () => {
    setShowEnrollModal(false);
    resetEnrollModal();
  };

  const handleEnrollCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollCandidateId || !enrollAssessmentId) {
      toastError('Missing Fields', 'Please select both a candidate and an assessment.');
      return;
    }
    if (enrolledAssessmentIds.has(enrollAssessmentId)) {
      toastError(
        'Already Enrolled',
        'This candidate is already registered for the selected assessment.',
      );
      return;
    }
    try {
      await enrollMutation.mutateAsync({
        candidateId: enrollCandidateId,
        assessmentId: enrollAssessmentId,
        resumeFile: enrollResume,
      });
      toastSuccess('Enrolled', 'Candidate enrolled and invitation sent.');
      handleCloseEnroll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enrollment failed.';
      toastError('Failed', msg);
    }
  };

  const handleCloseUpload = () => {
    setShowUploadModal(false);
    resetUploadModal();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
    } else {
      toastError('Invalid File', 'Please upload a .csv file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith('.csv')) {
      toastError('Invalid File', 'Please upload a .csv file.');
      return;
    }
    setCsvFile(file);
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return;
    try {
      const result = await bulkUploadMutation.mutateAsync(csvFile);
      setUploadResult(result);
      if (result.failed_rows === 0) {
        toastSuccess('Upload Complete', `${result.successful_rows} candidate(s) invited.`);
      } else if (result.successful_rows > 0) {
        toastSuccess('Partial Upload', `${result.successful_rows} invited, ${result.failed_rows} failed.`);
      } else {
        toastError('Upload Failed', `All ${result.failed_rows} rows failed.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      toastError('Failed', msg);
    }
  };

  const handleDeleteCandidate = async (caId: string) => {
    if (!window.confirm("Are you sure you want to delete this candidate from the assessment? This will permanently delete their registration and all associated interview session history. If this is their only enrollment, the candidate record will also be removed so the email can be used again.")) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(caId);
      toastSuccess('Candidate Deleted', 'Candidate removed from assessment successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete candidate.';
      toastError('Failed', msg);
    }
  };

  const getStatusBadge = (status: string) => {
    let classes = 'bg-slate-100 text-slate-600 border-slate-200';
    let dotClass = 'bg-slate-400';
    if (status === 'EVALUATED') {
      classes = 'bg-teal-50 text-teal-600 border-teal-200';
      dotClass = 'bg-teal-500';
    } else if (status === 'COMPLETED') {
      classes = 'bg-emerald-50 text-emerald-600 border-emerald-200';
      dotClass = 'bg-emerald-500';
    } else if (status === 'IN_PROGRESS') {
      classes = 'bg-blue-50 text-blue-600 border-blue-200';
      dotClass = 'bg-blue-500';
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all hover:scale-105 cursor-default ${classes}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {status}
      </span>
    );
  };

  const getDecisionBadge = (decision: string) => {
    let classes = 'bg-amber-50 text-amber-700 border-amber-200';
    let dotClass = 'bg-amber-500';
    const d = decision || 'PENDING';
    if (d === 'APPROVED') {
      classes = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotClass = 'bg-emerald-500';
    } else if (d === 'REJECTED') {
      classes = 'bg-red-50 text-red-700 border-red-200';
      dotClass = 'bg-red-500';
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold border transition-all hover:scale-105 cursor-default ${classes}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {d === 'APPROVED' ? 'HIRED' : d}
      </span>
    );
  };

  const inputStyles = "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  // Filter candidates locally using the search query
  const filteredCandidates = useMemo(
    () =>
      candidates.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          (c.role_name || selectedAssessment?.role_name || '').toLowerCase().includes(q)
        );
      }),
    [candidates, searchQuery, selectedAssessment?.role_name],
  );

  useEffect(() => {
    setPage(0);
  }, [selectedCampaignId, searchQuery]);

  const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleCandidates = filteredCandidates.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* ── Header Bar & Toolbar ─────────────────────────────────────────── */}
      <div className="ibot-section-toolbar relative z-20 mb-4 flex flex-shrink-0 flex-col justify-between gap-3 p-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="h-4 w-4 text-emerald-500" />
            Candidates
          </h2>

          {/* Campaign Filter Selector */}
          <CustomSelect
            value={selectedCampaignId}
            onChange={setSelectedCampaignId}
            options={
              loadingCampaigns
                ? [{ value: 'all', label: 'Loading…' }]
                : assessments.length === 0
                ? [{ value: 'all', label: 'No campaigns' }]
                : [
                    { value: 'all', label: 'All Campaigns' },
                    ...assessmentSelectOptions,
                  ]
            }
            disabled={loadingCampaigns}
            buttonClassName="min-w-[160px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              if (assessments.length === 0) {
                toastError('No Campaigns', 'Create a campaign first.');
                return;
              }
              resetManualModal();
              setShowManualModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            onClick={() => {
              if (assessments.length === 0) {
                toastError('No Campaigns', 'Create a campaign first.');
                return;
              }
              resetEnrollModal();
              setShowEnrollModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3.5 py-2 text-[11px] font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Enroll
          </button>
          <button
            onClick={() => {
              if (assessments.length === 0) {
                toastError('No Campaigns', 'Create a campaign first.');
                return;
              }
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
            id="upload-csv-btn"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* ── Table Container ──────────────────────────────────────────────── */}
      <div className="ibot-section-surface ibot-candidates-surface flex min-h-0 flex-1 flex-col overflow-hidden">
        {loadingCandidates ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-7 w-7 text-emerald-500 animate-spin mb-2" />
            <p className="text-xs text-slate-400 font-semibold">Loading candidates…</p>
          </div>
        ) : !selectedCampaignId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-400">
            <Users className="h-10 w-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-500 text-sm">No campaign selected</p>
            <p className="text-xs text-slate-400 mt-1">Choose a campaign above</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-500 text-sm">No candidates found</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting filters or upload a CSV to invite candidates</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm hover:scale-[1.03] active:scale-[0.97]"
            >
              <Upload className="h-3 w-3" />
              Upload CSV
            </button>
          </div>
        ) : (
          <div className="ibot-scrollbar flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-700 transition-colors">
                    Candidate <ChevronDown className="inline h-3 w-3 opacity-0 hover:opacity-100" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-700 transition-colors">
                    Role <ChevronDown className="inline h-3 w-3 opacity-0 hover:opacity-100" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-700 transition-colors">
                    Resume <ChevronDown className="inline h-3 w-3 opacity-0 hover:opacity-100" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-700 transition-colors">
                    Status <ChevronDown className="inline h-3 w-3 opacity-0 hover:opacity-100" />
                  </th>
                  <th className="px-4 py-3 text-center">Decision</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {visibleCandidates.map((c) => (
                  <tr
                    key={c.id}
                    className="group h-16 cursor-pointer transition-colors hover:bg-white/75 focus-within:bg-white/75"
                    onClick={() => openCandidateDetails(c)}
                  >
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openCandidateDetails(c);
                        }}
                        className="flex w-full items-center gap-2.5 text-left transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-label={`View full details for ${c.full_name}`}
                      >
                        {/* Avatar container with 2px ring highlight on hover */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/50 text-emerald-600 font-bold text-[11px] shrink-0 group-hover:ring-2 group-hover:ring-emerald-300 transition-all duration-300">
                          {c.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-700 transition-colors">{c.full_name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 font-medium truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            {c.email}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 transition-all hover:scale-105">
                        <Briefcase className="h-2.5 w-2.5 shrink-0" />
                        {(c.role_name || selectedAssessment?.role_name) ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all hover:scale-105 ${
                          c.resume_parse_status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}
                      >
                        <FileText className="h-2.5 w-2.5 shrink-0" />
                        {c.resume_parse_status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {getDecisionBadge(c.recruiter_decision)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5 shrink-0"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <button
                          onClick={() => openCandidateResume(c)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.97]"
                          aria-label={`View ${c.full_name}'s resume`}
                        >
                          <FileText className="h-3 w-3" />
                          Resume
                        </button>

                        {c.jd_text && (
                          <button
                            onClick={() => openCandidateJd(c)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-[0.97]"
                            aria-label={`View the job description for ${c.full_name}`}
                          >
                            <Briefcase className="h-3 w-3" />
                            JD
                          </button>
                        )}

                        {c.status === 'EVALUATED' && (
                          <button
                            onClick={() => navigate(`/candidates/${c.id}/report`)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-[10px] font-bold text-indigo-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-100 active:scale-[0.97]"
                            aria-label={`View ${c.full_name}'s evaluation report`}
                          >
                            <ClipboardList className="h-3 w-3" />
                            Report
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCandidate(c.id)}
                          disabled={deleteMutation.isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-red-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-90 disabled:opacity-30"
                          aria-label={`Delete ${c.full_name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0 text-xs font-semibold text-slate-500">
          <div>
            {filteredCandidates.length > 0
              ? `Showing ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filteredCandidates.length)} of ${filteredCandidates.length} candidates`
              : `Showing 0 of ${candidates.length} candidates`}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 text-[10px] font-bold text-slate-400">
              {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '—'}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage(currentPage + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Candidate details */}
      {showCandidateModal && activeCandidate && (
        <div
          className="ibot-overlay !items-center !overflow-hidden !p-4"
          onMouseDown={() => setShowCandidateModal(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-detail-title"
            className="ibot-modal max-h-[calc(100vh-2rem)] max-w-3xl !overflow-hidden"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="h-1.5 shrink-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500" />

            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-emerald-50/45 to-cyan-50/45 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-emerald-300 shadow-lg shadow-slate-900/15">
                  {activeCandidate.full_name
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'C'}
                </div>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    {getStatusBadge(activeCandidate.status)}
                    {getDecisionBadge(activeCandidate.recruiter_decision)}
                  </div>
                  <h2 id="candidate-detail-title" className="truncate font-display text-xl font-black tracking-tight text-slate-950">
                    {activeCandidate.full_name}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {activeCandidate.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCandidateModal(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close candidate details"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 overflow-hidden px-6 py-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: 'Campaign',
                    value:
                      (() => {
                        const assessment = assessments.find(
                          (item) => item.id === activeCandidate.assessment_id,
                        );
                        if (assessment) {
                          return formatAssessmentTitle(assessment, instanceNumbers);
                        }
                        return selectedAssessment?.title || 'All campaigns';
                      })(),
                  },
                  { label: 'Role', value: activeCandidate.role_name || selectedAssessment?.role_name || 'Not assigned' },
                  { label: 'Interview', value: activeCandidate.status.replace(/_/g, ' ') },
                  { label: 'Resume', value: activeCandidate.resume_parse_status.replace(/_/g, ' ') },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-800" title={item.value}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-xs font-black text-slate-900">Resume intelligence</h3>
                    </div>
                    {typeof activeCandidate.resume_parsed?.experience_years === 'number' && (
                      <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[9px] font-black text-emerald-700">
                        {activeCandidate.resume_parsed.experience_years} yrs
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[10px] font-medium leading-4 text-slate-600">
                    {activeCandidate.resume_parsed?.summary || 'Resume details are still being prepared.'}
                  </p>
                  <div className="mt-2 flex min-h-5 flex-wrap gap-1">
                    {(activeCandidate.resume_parsed?.skills || []).slice(0, 6).map((skill) => (
                      <span key={skill} className="rounded-md border border-emerald-100 bg-white px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        {skill}
                      </span>
                    ))}
                    {(activeCandidate.resume_parsed?.skills?.length || 0) > 6 && (
                      <span className="px-1 py-0.5 text-[9px] font-bold text-slate-400">
                        +{(activeCandidate.resume_parsed?.skills?.length || 0) - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-white p-3.5">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-cyan-700" />
                    <h3 className="text-xs font-black text-slate-900">Job description</h3>
                  </div>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line text-[10px] font-medium leading-4 text-slate-600">
                    {activeCandidate.jd_text || 'No job description is attached to this campaign.'}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/75 via-white to-cyan-50/60 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-black text-slate-900">Evaluation snapshot</h3>
                  </div>
                  {activeCandidate.status === 'EVALUATED' && (
                    <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-indigo-700">
                      Report ready
                    </span>
                  )}
                </div>

                {activeCandidate.status !== 'EVALUATED' ? (
                  <p className="mt-2 text-[10px] font-semibold text-slate-500">
                    The report and hiring actions unlock after evaluation is complete.
                  </p>
                ) : loadingCandidateEvaluation ? (
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    Loading evaluation summary…
                  </div>
                ) : candidateEvaluationError || !candidateEvaluation ? (
                  <p className="mt-2 text-[10px] font-semibold text-amber-700">
                    The full report is ready, but its summary could not be loaded here.
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-black text-indigo-700">
                        {candidateEvaluation.overall_score.toFixed(1)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">/10</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                        AI recommendation: {candidateEvaluation.hiring_recommendation}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-4 text-slate-600">
                        {candidateEvaluation.overall_summary || candidateEvaluation.recommendation_reasoning}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-[9px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                  Started: {formatDateTime(activeCandidate.interview_started_at)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                  Completed: {formatDateTime(activeCandidate.interview_ended_at)}
                </span>
              </div>
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-3.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openCandidateResume(activeCandidate)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-700"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Resume
                </button>
                {activeCandidate.jd_text && (
                  <button
                    type="button"
                    onClick={() => openCandidateJd(activeCandidate)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm transition-colors hover:border-cyan-300 hover:text-cyan-700"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    JD
                  </button>
                )}
                {activeCandidate.status === 'EVALUATED' && (
                  <button
                    type="button"
                    onClick={() => navigate(`/candidates/${activeCandidate.id}/report`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[10px] font-black text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Report
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {activeCandidate.status === 'EVALUATED' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => requestCandidateDecision('REJECTED')}
                    disabled={activeCandidate.recruiter_decision === 'REJECTED'}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[10px] font-black text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => requestCandidateDecision('APPROVED')}
                    disabled={activeCandidate.recruiter_decision === 'APPROVED'}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Hire
                  </button>
                </div>
              )}
            </footer>
          </section>
        </div>
      )}

      {/* CSV upload */}
      {showUploadModal && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-lg max-h-[85vh]">

            <div className="flex justify-between items-start border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500 animate-pulse" />
                  Upload Candidates
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">CSV upload with automatic invitations</p>
              </div>
              <button
                onClick={handleCloseUpload}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 duration-100"
                id="close-upload-modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ibot-scrollbar flex-1 overflow-y-auto">
              <div className="px-6 py-5 flex flex-col gap-4">
                {/* CSV Format Info */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2 hover:border-emerald-500/20 transition-all">
                  <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-[10px] text-slate-500 leading-relaxed font-bold">
                    Required columns:{' '}
                    <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[9px] font-mono">name</code>,{' '}
                    <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[9px] font-mono">email</code>,{' '}
                    <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[9px] font-mono">resume</code>,{' '}
                    <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[9px] font-mono">assessment_id</code>
                    {assessments.length > 0 && (
                      <div className="mt-2 border border-slate-200 rounded-md overflow-hidden">
                        <div className="bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Your Assessment IDs</div>
                        <div className="divide-y divide-slate-100 max-h-28 overflow-y-auto ibot-scrollbar">
                          {assessments.map((assessment) => (
                            <div key={assessment.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-white transition-colors gap-2">
                              <span className="text-[9px] text-slate-600 font-semibold truncate">
                                {formatAssessmentTitle(assessment, instanceNumbers)} ({assessment.role_name})
                              </span>
                              <button
                                type="button"
                                onClick={() => { navigator.clipboard.writeText(assessment.id); toastSuccess('Copied', 'Assessment ID copied to clipboard.'); }}
                                className="shrink-0 font-mono text-[8px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition-colors"
                                title="Click to copy"
                              >
                                {assessment.id.slice(0, 8)}…
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Result */}
                {uploadResult ? (
                  <div className="flex flex-col gap-3 animate-slideUp">
                    <div
                      className={`flex items-center gap-2.5 p-3 rounded-lg border ${
                        uploadResult.failed_rows === 0
                          ? 'bg-emerald-50 border-emerald-200'
                          : uploadResult.successful_rows > 0
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {uploadResult.failed_rows === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : uploadResult.successful_rows > 0 ? (
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {uploadResult.successful_rows} invited · {uploadResult.failed_rows} failed
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="ibot-scrollbar divide-y divide-slate-100 max-h-40 overflow-y-auto bg-slate-50/50">
                        {uploadResult.row_results.map((r) => (
                          <div key={r.row} className="flex items-start gap-2.5 px-3 py-2 group hover:bg-white transition-all">
                            {r.status === 'success' ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0 font-medium">
                              <p className="text-[10px] font-bold text-slate-700 truncate group-hover:text-emerald-700 transition-colors">
                                Row {r.row}: {r.email}
                              </p>
                              {r.reason && (
                                <p className="text-[9px] text-slate-400 mt-0.5">{r.reason}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* File Drop Zone */
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                      dragOver
                        ? 'border-emerald-400 bg-emerald-50 scale-98 shadow-inner'
                        : csvFile
                        ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                        : 'border-slate-300 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30 hover:scale-[1.01] hover:shadow-sm'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file" accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                      id="csv-file-input"
                    />
                    {csvFile ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-bounce" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-700">{csvFile.name}</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">
                            {(csvFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          className="text-[10px] text-slate-400 underline hover:text-slate-655 font-bold hover:scale-105 active:scale-95 transition-transform"
                          onClick={(e) => { e.stopPropagation(); setCsvFile(null); }}
                        >
                          Change
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center transition-transform hover:rotate-6">
                          <Upload className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-600">Drop CSV here</p>
                        <p className="text-[10px] text-slate-400 font-semibold">or click to browse</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-3 flex justify-end gap-2 shrink-0 bg-slate-50/50">
              {uploadResult ? (
                <button
                  onClick={handleCloseUpload}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all hover:scale-[1.03] active:scale-[0.97]"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="button" onClick={handleCloseUpload}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:scale-[1.03] active:scale-[0.97] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={!csvFile || bulkUploadMutation.isPending}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                    id="submit-upload-btn"
                  >
                    {bulkUploadMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Create Modal ──────────────────────────────────────────── */}
      {showManualModal && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-md max-h-[85vh] animate-scaleIn">
            <div className="flex justify-between items-start border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Users className="h-4 w-4 text-emerald-500 animate-pulse" />
                  Add Candidate
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Enter details and upload resume</p>
              </div>
              <button
                onClick={handleCloseManual}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ibot-scrollbar flex-1 overflow-y-auto px-6 py-5">
              <form id="manual-candidate-form" onSubmit={handleManualCreate} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input
                    required type="text" value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Jane Doe"
                    className={inputStyles}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                  <input
                    required type="email" value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className={inputStyles}
                  />
                  <p className="text-[9px] font-medium text-secondary">
                    Each candidate is created once. To add an existing email to another assessment, use Enroll.
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assessment</label>
                  <CustomSelect
                    value={manualAssessmentId}
                    onChange={setManualAssessmentId}
                    options={assessmentSelectOptions}
                    placeholder="Select an assessment"
                    className="w-full"
                  />
                  <p className="text-[9px] text-slate-400 font-semibold">Select which assessment to assign this candidate to</p>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resume PDF</label>
                  <div className="border border-dashed border-slate-300 bg-slate-50 p-4 rounded-lg flex flex-col items-center justify-center gap-1 text-center relative hover:border-emerald-400 hover:bg-emerald-50/20 hover:scale-[1.01] transition-all duration-300">
                    <FileText className="h-5 w-5 text-slate-400" />
                    {manualResume ? (
                      <span className="text-[11px] text-emerald-600 font-bold">{manualResume.name}</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Select PDF</span>
                    )}
                    <input
                      required type="file" accept=".pdf"
                      onChange={(e) => setManualResume(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t border-slate-100 px-6 py-3 flex justify-end gap-2 shrink-0 bg-slate-50/50">
              <button
                type="button" onClick={handleCloseManual}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:scale-[1.03] active:scale-[0.97] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit" form="manual-candidate-form"
                disabled={createMutation.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5" />
                    Add & Invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resume Modal ────────────────────────────────────────────────── */}
      {showResumeModal && selectedCandidate && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-2xl max-h-[85vh] animate-scaleIn">
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <FileText className="h-4 w-4 text-emerald-500 animate-pulse" />
                  Candidate Resume: {selectedCandidate.full_name}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Email: {selectedCandidate.email}</p>
              </div>
              <button
                onClick={() => { setShowResumeModal(false); setSelectedCandidate(null); }}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ibot-scrollbar p-6 overflow-y-auto space-y-4 text-xs">
              {selectedCandidate.resume_file_path && (
                <div className="text-[10px] text-slate-400 mb-2 font-bold">
                  File name: <span className="font-mono">{selectedCandidate.resume_file_path}</span>
                </div>
              )}

              {selectedCandidate.resume_parse_status === 'PENDING' ? (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-center animate-pulse font-bold">
                  Resume parsing is in progress. Please check back in a few seconds.
                </div>
              ) : selectedCandidate.resume_parse_status === 'FAILED' || !selectedCandidate.resume_parsed ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-center font-bold">
                  Failed to parse resume details.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCandidate.resume_parsed.summary && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h4 className="font-bold text-slate-800 mb-1.5 text-xs">Technical Summary</h4>
                      <p className="text-slate-600 leading-relaxed font-bold">{selectedCandidate.resume_parsed.summary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedCandidate.resume_parsed.skills && selectedCandidate.resume_parsed.skills.length > 0 && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 className="font-bold text-slate-800 mb-2 text-xs">Technical Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedCandidate.resume_parsed.skills.map((skill: string, index: number) => (
                            <span key={index} className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 transition-all hover:scale-105 cursor-default">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {typeof selectedCandidate.resume_parsed.experience_years === 'number' && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-center items-center text-center transition-all hover:border-emerald-300">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Experience</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1">
                          {selectedCandidate.resume_parsed.experience_years}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 font-bold">Years Est.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 shrink-0 flex justify-end bg-slate-50/50">
              <button
                onClick={() => { setShowResumeModal(false); setSelectedCandidate(null); }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── JD Modal ────────────────────────────────────────────────────── */}
      {showJdModal && selectedCandidate && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-2xl max-h-[85vh] animate-scaleIn">
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Briefcase className="h-4 w-4 text-emerald-500 animate-pulse" />
                  Job Description
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Campaign Role: {selectedCandidate.role_name}</p>
              </div>
              <button
                onClick={() => { setShowJdModal(false); setSelectedCandidate(null); }}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ibot-scrollbar p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedCandidate.jd_text || "No job description text available."}
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 shrink-0 flex justify-end bg-slate-50/50">
              <button
                onClick={() => { setShowJdModal(false); setSelectedCandidate(null); }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enroll Existing Candidate Modal ──────────────────────────────── */}
      {showEnrollModal && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-md max-h-[85vh] animate-scaleIn">
            <div className="flex justify-between items-start border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <UserPlus className="h-4 w-4 text-emerald-500 animate-pulse" />
                  Enroll Candidate
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Assign an existing candidate to another assessment</p>
              </div>
              <button
                onClick={handleCloseEnroll}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ibot-scrollbar flex-1 overflow-y-auto px-6 py-5">
              <form id="enroll-candidate-form" onSubmit={handleEnrollCandidate} className="flex flex-col gap-3.5">

                {/* Info banner */}
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-700 font-semibold leading-relaxed">
                    If the candidate has an active enrollment whose interview window overlaps with the new assessment, they must complete that assessment first. A new resume is optional — their previous resume will be reused if none is uploaded.
                  </p>
                </div>

                {/* Candidate selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Candidate</label>
                  {uniqueCandidates.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold italic">No candidates found. Add a candidate first.</p>
                  ) : (
                    <CustomSelect
                      value={enrollCandidateId}
                      onChange={setEnrollCandidateId}
                      options={uniqueCandidates.map((candidate) => ({
                        value: candidate.id,
                        label: candidate.full_name,
                        description: candidate.email,
                      }))}
                      placeholder="Select a candidate"
                      className="w-full"
                    />
                  )}
                </div>

                {enrolledAssessmentsSummary && (
                  <div className="p-3 rounded-lg bg-sky-50 border border-sky-100 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-sky-700 font-semibold leading-relaxed">
                      Currently enrolled in: {enrolledAssessmentsSummary}
                    </p>
                  </div>
                )}

                {/* Assessment selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assessment</label>
                  <CustomSelect
                    value={enrollAssessmentId}
                    onChange={setEnrollAssessmentId}
                    options={enrollAssessmentSelectOptions}
                    placeholder="Select an assessment"
                    className="w-full"
                  />
                </div>

                {/* Optional resume */}
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    New Resume PDF <span className="text-slate-300 font-normal normal-case">(optional)</span>
                  </label>
                  <div className="border border-dashed border-slate-300 bg-slate-50 p-4 rounded-lg flex flex-col items-center justify-center gap-1 text-center relative hover:border-emerald-400 hover:bg-emerald-50/20 hover:scale-[1.01] transition-all duration-300">
                    <FileText className="h-5 w-5 text-slate-400" />
                    {enrollResume ? (
                      <span className="text-[11px] text-emerald-600 font-bold">{enrollResume.name}</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Select PDF or leave blank to reuse previous</span>
                    )}
                    <input
                      type="file" accept=".pdf"
                      onChange={(e) => setEnrollResume(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  {enrollResume && (
                    <button type="button" onClick={() => setEnrollResume(null)} className="text-[9px] text-slate-400 underline self-start font-bold hover:text-slate-600 transition-colors">
                      Remove resume
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="border-t border-slate-100 px-6 py-3 flex justify-end gap-2 shrink-0 bg-slate-50/50">
              <button
                type="button" onClick={handleCloseEnroll}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:scale-[1.03] active:scale-[0.97] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit" form="enroll-candidate-form"
                disabled={enrollMutation.isPending || uniqueCandidates.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
              >
                {enrollMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enrolling…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Enroll & Invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <DecisionModal
        key={`${decisionModal.candidateId}:${decisionModal.decision}:${decisionModal.open}`}
        open={decisionModal.open}
        candidateName={decisionModal.candidateName}
        currentDecision={decisionModal.currentDecision}
        decision={decisionModal.decision}
        loading={isSavingDecision}
        onClose={closeDecision}
        onConfirm={saveDecision}
      />
    </div>
  );
};
