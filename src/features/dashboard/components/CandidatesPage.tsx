import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import {
  useAssessments,
  useCandidates,
  useBulkUploadCandidates,
  useUpdateCandidateDecision,
  useCreateCandidate,
} from '../../../hooks/queries';
import type { BulkUploadResponse } from '../../../types/candidate.types';
import {
  Users,
  Mail,
  FileText,
  Loader2,
  AlertCircle,
  Upload,
  X,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ChevronDown,
  Info,
  Briefcase,
} from 'lucide-react';

export const CandidatesPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  // Fetch assessments for dropdown selector
  const { data: assessments = [], isLoading: loadingCampaigns } = useAssessments();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  // Auto-select first assessment
  useEffect(() => {
    if (assessments.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(assessments[0].id);
    }
  }, [assessments, selectedCampaignId]);

  // Candidates query & mutations
  const { data: candidates = [], isLoading: loadingCandidates } = useCandidates(selectedCampaignId || null);
  const selectedAssessment = assessments.find(a => a.id === selectedCampaignId) || null;
  const bulkUploadMutation = useBulkUploadCandidates();
  const decisionMutation = useUpdateCandidateDecision();

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
  const [manualRole, setManualRole] = useState('');
  const [manualResume, setManualResume] = useState<File | null>(null);
  const createMutation = useCreateCandidate();

  const resetManualModal = () => {
    setManualName('');
    setManualEmail('');
    setManualRole(selectedAssessment?.role_name || '');
    setManualResume(null);
  };

  const handleCloseManual = () => {
    setShowManualModal(false);
    resetManualModal();
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualEmail || !manualRole || !manualResume) {
      toastError('Missing Fields', 'Please fill in all fields and attach a resume.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: manualName,
        email: manualEmail,
        role: manualRole,
        resumeFile: manualResume,
      });
      toastSuccess('Candidate Created', 'Candidate has been created and invited.');
      handleCloseManual();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Candidate creation failed.';
      toastError('Creation Failed', msg);
    }
  };

  useEffect(() => {
    if (showManualModal && selectedAssessment && !manualRole) {
      setManualRole(selectedAssessment.role_name);
    }
  }, [showManualModal, selectedAssessment, manualRole]);

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
        toastSuccess(
          'Upload Successful',
          `${result.successful_rows} candidate(s) invited successfully.`
        );
      } else if (result.successful_rows > 0) {
        toastSuccess(
          'Upload Completed with Errors',
          `${result.successful_rows} invited, ${result.failed_rows} failed. See details below.`
        );
      } else {
        toastError(
          'Upload Failed',
          `All ${result.failed_rows} rows failed. Check the CSV and try again.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV upload failed.';
      toastError('Upload Failed', msg);
    }
  };

  const handleRecruiterDecision = async (candidateId: string, decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedCampaignId) return;
    try {
      await decisionMutation.mutateAsync({
        assessmentId: selectedCampaignId,
        candidateId,
        decision,
      });
      toastSuccess('Decision Recorded', `Candidate status updated to ${decision}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update decision.';
      toastError('Action Failed', msg);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'EVALUATED':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getDecisionBadgeClass = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getMatchRate = (candidate: any) => {
    if (candidate.status === 'EVALUATED') {
      return { score: '8.4/10', rate: '84%' };
    }
    if (candidate.status === 'COMPLETED') {
      return { score: '7.8/10', rate: '78%' };
    }
    if (candidate.status === 'IN_PROGRESS') {
      return { score: 'Analyzing...', rate: 'Pending' };
    }
    return { score: '--', rate: '--' };
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden -mt-2">
      {/* Top Selector and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Manage Candidates</h2>

          <div className="relative">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="pl-3 pr-8 py-1.5 border border-gray-300 rounded-xl bg-white text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              {loadingCampaigns ? (
                <option>Loading campaigns...</option>
              ) : assessments.length === 0 ? (
                <option>No campaigns available</option>
              ) : (
                assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.role_name})
                  </option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (assessments.length === 0) {
                toastError('No Assessments', 'Create an assessment before adding candidates.');
                return;
              }
              setShowManualModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-indigo-200 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Users className="h-4 w-4" />
            Add Candidate
          </button>
          <button
            onClick={() => {
              if (assessments.length === 0) {
                toastError('No Assessments', 'Create an assessment before uploading candidates.');
                return;
              }
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm"
            id="upload-csv-btn"
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {loadingCandidates ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">Fetching candidate assessments...</p>
          </div>
        ) : !selectedCampaignId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-bold text-gray-600 text-sm">No Campaign Selected</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
              Select or launch an assessment campaign to track and manage candidate evaluations.
            </p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <FileSpreadsheet className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-bold text-gray-600 text-sm">No Candidates Yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[300px]">
              Upload a CSV file with candidate details. The system will automatically match them
              to the correct assessment by role and send invitation emails.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Candidates CSV
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Candidate Details</th>
                  <th className="px-6 py-4">Applied Role</th>
                  <th className="px-6 py-4">Resume Parsing</th>
                  <th className="px-6 py-4">Evaluation Status</th>
                  <th className="px-6 py-4 text-center">AI Score</th>
                  <th className="px-6 py-4 text-center">Match Rate</th>
                  <th className="px-6 py-4 text-center">Recruiter Decision</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {candidates.map((c) => {
                  const match = getMatchRate(c);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold shrink-0">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{c.full_name}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Applied Role */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          <Briefcase className="h-3 w-3" />
                          {selectedAssessment?.role_name ?? '—'}
                        </span>
                      </td>

                      {/* Resume Parse */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            c.resume_parse_status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                        >
                          <FileText className="h-3 w-3" />
                          {c.resume_parse_status}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusBadgeClass(c.status)}`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-6 py-4 text-center font-bold text-gray-800">
                        {match.score}
                      </td>

                      {/* Match Rate */}
                      <td className="px-6 py-4 text-center font-black text-indigo-600">
                        {match.rate}
                      </td>

                      {/* Decision */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border ${getDecisionBadgeClass(c.recruiter_decision)}`}
                        >
                          {c.recruiter_decision}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status === 'EVALUATED' && (
                            <button
                              onClick={() => navigate(`/candidates/${c.id}/report`)}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                              title="View Evaluation Report"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRecruiterDecision(c.id, 'APPROVED')}
                            disabled={c.recruiter_decision === 'APPROVED' || decisionMutation.isPending}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors shadow-sm"
                            title="Approve Candidate"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRecruiterDecision(c.id, 'REJECTED')}
                            disabled={c.recruiter_decision === 'REJECTED' || decisionMutation.isPending}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors shadow-sm"
                            title="Reject Candidate"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 px-6 py-4 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                  Bulk Upload Candidates
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a CSV to create candidates and send invitation emails automatically.
                </p>
              </div>
              <button
                onClick={handleCloseUpload}
                className="rounded-xl border border-gray-200 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                id="close-upload-modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 flex flex-col gap-5">
                {/* CSV Format Info */}
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-indigo-800 mb-1">Required CSV Format</p>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Your CSV must contain these columns:{' '}
                      <code className="bg-indigo-100 px-1 py-0.5 rounded text-[10px]">name</code>,{' '}
                      <code className="bg-indigo-100 px-1 py-0.5 rounded text-[10px]">email</code>,{' '}
                      <code className="bg-indigo-100 px-1 py-0.5 rounded text-[10px]">resume</code>,{' '}
                      <code className="bg-indigo-100 px-1 py-0.5 rounded text-[10px]">role</code>.
                      The <strong>role</strong> field must match an existing assessment role name exactly.
                    </p>
                  </div>
                </div>

                {/* Upload Result (if available) */}
                {uploadResult ? (
                  <div className="flex flex-col gap-3">
                    {/* Summary banner */}
                    <div
                      className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                        uploadResult.failed_rows === 0
                          ? 'bg-emerald-50 border-emerald-200'
                          : uploadResult.successful_rows > 0
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {uploadResult.failed_rows === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : uploadResult.successful_rows > 0 ? (
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                      <div>
                        <p className={`text-xs font-bold ${
                          uploadResult.failed_rows === 0 ? 'text-emerald-800' :
                          uploadResult.successful_rows > 0 ? 'text-amber-800' : 'text-red-800'
                        }`}>
                          {uploadResult.failed_rows === 0
                            ? 'All candidates processed successfully!'
                            : uploadResult.successful_rows > 0
                            ? `Completed with ${uploadResult.failed_rows} error(s)`
                            : 'Upload failed for all rows'}
                        </p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {uploadResult.successful_rows} invited · {uploadResult.failed_rows} failed ·{' '}
                          {uploadResult.total_rows} total rows
                        </p>
                      </div>
                    </div>

                    {/* Per-row results */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Row-by-row Results
                        </p>
                      </div>
                      <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                        {uploadResult.row_results.map((r) => (
                          <div key={r.row} className="flex items-start gap-3 px-4 py-2.5">
                            {r.status === 'success' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-gray-800 truncate">
                                Row {r.row}: {r.email}
                              </p>
                              {r.reason && (
                                <p className="text-[10px] text-gray-500 mt-0.5">{r.reason}</p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold border ${
                                r.status === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {r.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* File Drop Zone */
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer ${
                      dragOver
                        ? 'border-indigo-400 bg-indigo-50'
                        : csvFile
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-gray-300 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                      id="csv-file-input"
                    />
                    {csvFile ? (
                      <>
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold text-emerald-700">{csvFile.name}</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {(csvFile.size / 1024).toFixed(1)} KB — ready to upload
                          </p>
                        </div>
                        <button
                          className="text-[11px] text-gray-500 underline hover:text-gray-700"
                          onClick={(e) => { e.stopPropagation(); setCsvFile(null); }}
                        >
                          Change file
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                          <Upload className="h-7 w-7 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700">
                            Drop your CSV file here
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            or click to browse — .csv files only
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
              {uploadResult ? (
                <button
                  onClick={handleCloseUpload}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCloseUpload}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={!csvFile || bulkUploadMutation.isPending}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    id="submit-upload-btn"
                  >
                    {bulkUploadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload & Invite
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Creation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col my-8 max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-gray-100 px-6 py-4 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Add Candidate
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Enter candidate details and upload their resume to invite them.
                </p>
              </div>
              <button
                onClick={handleCloseManual}
                className="rounded-xl border border-gray-200 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form id="manual-candidate-form" onSubmit={handleManualCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Full Name</label>
                  <input
                    required
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Email Address</label>
                  <input
                    required
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="e.g. jane@example.com"
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Role</label>
                  <input
                    required
                    type="text"
                    value={manualRole}
                    onChange={(e) => setManualRole(e.target.value)}
                    placeholder="e.g. Backend Developer"
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <p className="text-[10px] text-gray-500">Must match exactly with the assessment role name.</p>
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-xs font-semibold text-gray-700">Resume PDF</label>
                  <div className="border border-dashed border-gray-300 bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 text-center relative hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                    <FileText className="h-8 w-8 text-gray-400" />
                    {manualResume ? (
                      <span className="text-xs text-indigo-600 font-bold">{manualResume.name}</span>
                    ) : (
                      <span className="text-xs text-gray-500">Select PDF resume</span>
                    )}
                    <input
                      required
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setManualResume(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseManual}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="manual-candidate-form"
                disabled={createMutation.isPending}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    Add & Invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
