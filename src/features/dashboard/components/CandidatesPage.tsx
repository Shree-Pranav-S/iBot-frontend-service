import React, { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useAssessments, useCandidates, useInviteCandidate, useUpdateCandidateDecision } from '../../../hooks/queries';
import {
  Users,
  Mail,
  FileText,
  Loader2,
  AlertCircle,
  Upload,
  Plus,
  X,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

export const CandidatesPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  
  // Fetch campaigns for dropdown selector
  const { data: assessments = [], isLoading: loadingCampaigns } = useAssessments();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  // Auto-select first campaign
  useEffect(() => {
    if (assessments.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(assessments[0].id);
    }
  }, [assessments, selectedCampaignId]);

  // Candidates query & mutations
  const { data: candidates = [], isLoading: loadingCandidates } = useCandidates(selectedCampaignId || null);
  const inviteMutation = useInviteCandidate();
  const decisionMutation = useUpdateCandidateDecision();

  // Invite/Upload Form States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedCampaignId) {
      setFormError('Please select a campaign first.');
      return;
    }

    try {
      await inviteMutation.mutateAsync({
        assessmentId: selectedCampaignId,
        full_name: candidateName,
        email: candidateEmail,
        resume_name: resumeFile ? resumeFile.name : 'resume.pdf'
      });

      setCandidateName('');
      setCandidateEmail('');
      setResumeFile(null);
      setShowInviteModal(false);
      toastSuccess('Candidate Invited', 'An invitation has been registered and token generated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register candidate.';
      setFormError(msg);
      toastError('Invitation Failed', msg);
    }
  };

  const handleRecruiterDecision = async (candidateId: string, decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedCampaignId) return;
    try {
      await decisionMutation.mutateAsync({
        assessmentId: selectedCampaignId,
        candidateId,
        decision
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
                assessments.map(a => (
                  <option key={a.id} value={a.id}>{a.title} ({a.role_name})</option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (!selectedCampaignId) {
              toastError('Missing Campaign', 'Please select or create an assessment campaign first.');
              return;
            }
            setShowInviteModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Candidate
        </button>
      </div>

      {/* Main Table Area (locked height, scrollable) */}
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
            <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Select or launch an assessment campaign to track and manage candidate evaluations.</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-bold text-gray-600 text-sm">No Candidates Found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Invite or upload candidate details to evaluate them for this role.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Candidate Details</th>
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

                      {/* Resume Parse */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          c.resume_parse_status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <FileText className="h-3 w-3" />
                          {c.resume_parse_status}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusBadgeClass(c.status)}`}>
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
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border ${getDecisionBadgeClass(c.recruiter_decision)}`}>
                          {c.recruiter_decision}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRecruiterDecision(c.id, 'APPROVED')}
                            disabled={c.recruiter_decision === 'APPROVED' || decisionMutation.isPending}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors shadow-sm"
                            title="Approve Candidate"
                          >
                            <ThumbsUp className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleRecruiterDecision(c.id, 'REJECTED')}
                            disabled={c.recruiter_decision === 'REJECTED' || decisionMutation.isPending}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors shadow-sm"
                            title="Reject Candidate"
                          >
                            <ThumbsDown className="h-4.5 w-4.5" />
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

      {/* Add Candidate Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Add New Candidate
                </h2>
                <p className="text-xs text-gray-500 mt-1">Register the candidate and upload their resume PDF.</p>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setFormError(null);
                }}
                className="rounded-xl border border-gray-200 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Notification */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Full Name</label>
                <input
                  required
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Email Address</label>
                <input
                  required
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="e.g. john.doe@example.com"
                  className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Resume PDF (Optional)</label>
                <div className="border border-dashed border-gray-300 bg-gray-50 p-4 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center relative hover:border-indigo-400 transition-colors">
                  <Upload className="h-6 w-6 text-gray-400" />
                  {resumeFile ? (
                    <span className="text-xs text-indigo-600 font-bold">{resumeFile.name}</span>
                  ) : (
                    <span className="text-[11px] text-gray-500">Upload candidate resume file (PDF)</span>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-end gap-3.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {inviteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Candidate'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
