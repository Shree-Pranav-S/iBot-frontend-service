import React, { useState } from 'react';
import { useToast } from '../../../hooks/useToast';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import {
  useAssessments,
  useAssessmentDetails,
  useCreateAssessment,
  useUpdateAssessmentStatus,
  useCandidates,
} from '../../../hooks/queries';
import {
  Briefcase,
  Clock,
  Calendar,
  Sparkles,
  Plus,
  FileText,
  X,
  Loader2,
  AlertCircle,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  FileSpreadsheet,
  Gauge,
} from 'lucide-react';
import type { AssessmentStatus } from '../../../types/assessment.types';

export const AssessmentsPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  
  // Queries & Mutations
  const { data: assessments = [], isLoading: loadingAssessments } = useAssessments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeSelectedId = selectedId ?? assessments[0]?.id ?? null;
  const { data: selectedAssessment, isLoading: loadingDetails } =
    useAssessmentDetails(activeSelectedId);
  const { data: assessmentCandidates = [], isLoading: loadingCandidates } =
    useCandidates(activeSelectedId);
  const [showCandidates, setShowCandidates] = useState(true);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showJdModal, setShowJdModal] = useState(false);

  const createMutation = useCreateAssessment();
  const updateStatusMutation = useUpdateAssessmentStatus();

  // Create Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createRoleName, setCreateRoleName] = useState('');
  const [createDuration, setCreateDuration] = useState(30);
  const [createError, setCreateError] = useState<string | null>(null);

  // Get date defaults
  const getDates = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 10 * 60 * 1000).toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    return { start, end };
  };
  const dates = getDates();
  const [createWindowStart, setCreateWindowStart] = useState(dates.start);
  const [createWindowEnd, setCreateWindowEnd] = useState(dates.end);
  const [createJdType, setCreateJdType] = useState<'text' | 'file'>('text');
  const [createJdText, setCreateJdText] = useState('');
  const [createJdFile, setCreateJdFile] = useState<File | null>(null);

  // Skill weight overrides list
  const [newSkillOverride, setNewSkillOverride] = useState('');
  const [newWeightOverride, setNewWeightOverride] = useState(5);
  const [createFocusAreas, setCreateFocusAreas] = useState<{ skill: string; weight: number }[]>([]);

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      if (!Number.isFinite(createDuration) || createDuration < 2) {
        throw new Error('Interview duration must be at least 2 minutes.');
      }

      const fd = new FormData();
      fd.append('title', createTitle);
      fd.append('role_name', createRoleName);
      fd.append('interview_duration_mins', String(createDuration));
      fd.append('window_start', new Date(createWindowStart).toISOString());
      fd.append('window_end', new Date(createWindowEnd).toISOString());

      if (createJdType === 'text') {
        if (!createJdText.trim()) throw new Error('Please enter job description text.');
        fd.append('jd_text', createJdText);
      } else if (createJdFile) {
        fd.append('jd_file', createJdFile);
      } else {
        throw new Error('Please upload a PDF file.');
      }

      if (createFocusAreas.length > 0) {
        const faList = createFocusAreas.map(fa => ({
          skill: fa.skill,
          weight_override: fa.weight
        }));
        fd.append('focus_areas', JSON.stringify(faList));
      }

      const created = await createMutation.mutateAsync(fd);
      
      // Reset Form
      setCreateTitle('');
      setCreateRoleName('');
      setCreateDuration(30);
      setCreateJdText('');
      setCreateJdFile(null);
      setCreateFocusAreas([]);
      setShowCreateModal(false);
      
      setSelectedId(created.id);
      toastSuccess('Campaign Created', 'Assessment launched successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create assessment.';
      setCreateError(msg);
      toastError('Creation Failed', msg);
    }
  };

  const addFocusArea = () => {
    if (!newSkillOverride.trim()) return;
    if (createFocusAreas.some(fa => fa.skill.toLowerCase() === newSkillOverride.trim().toLowerCase())) {
      return;
    }
    setCreateFocusAreas([...createFocusAreas, { skill: newSkillOverride.trim(), weight: newWeightOverride }]);
    setNewSkillOverride('');
    setNewWeightOverride(5);
  };

  const removeFocusArea = (index: number) => {
    setCreateFocusAreas(createFocusAreas.filter((_, i) => i !== index));
  };

  const toggleCampaignStatus = async (id: string, currentStatus: AssessmentStatus) => {
    const nextStatus: AssessmentStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await updateStatusMutation.mutateAsync({ id, status: nextStatus });
      toastSuccess('Status Updated', `Campaign is now ${nextStatus}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      toastError('Update Failed', msg);
    }
  };

  const inputStyles = "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  // Calculate statistics for the collapsible candidate overview
  const totalCandidates = assessmentCandidates.length;
  const completedCandidates = assessmentCandidates.filter(c => c.status === 'COMPLETED' || c.status === 'EVALUATED').length;
  const inProgressCandidates = assessmentCandidates.filter(c => c.status === 'IN_PROGRESS').length;
  const invitedCandidates = totalCandidates - completedCandidates - inProgressCandidates;

  return (
    <div className="flex h-full min-h-0 overflow-hidden gap-4 animate-fadeIn">
      {/* â”€â”€ Left: Campaign List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-[320px] flex-shrink-0 flex flex-col h-full gap-3">
        <div className="ibot-command-panel flex justify-between items-center flex-shrink-0 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Briefcase className="h-4 w-4 text-emerald-500 animate-pulse" />
            Campaigns
            <span className="ml-1 text-[11px] font-bold text-slate-400">({assessments.length})</span>
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0 active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </button>
        </div>

        {loadingAssessments ? (
          <div className="flex-1 flex flex-col items-center justify-center ibot-panel">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mb-2" />
            <p className="text-[11px] text-slate-400 font-semibold">Loading...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-5 text-center ibot-panel border-dashed">
            <Briefcase className="h-7 w-7 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-500 text-xs">No campaigns yet</p>
            <p className="text-[10px] text-slate-400 mt-1">Create one to get started.</p>
          </div>
        ) : (
          <div className="ibot-scrollbar flex-1 overflow-y-auto space-y-2.5 pr-0.5 pb-2">
            {assessments.map((a, i) => (
              <div
                key={a.id}
                onClick={() => { setSelectedId(a.id); setShowCandidates(false); }}
                className={`relative cursor-pointer p-4 rounded-lg border transition-all duration-300 animate-slideUp hover:scale-[1.02] hover:shadow-sm ${
                  activeSelectedId === a.id
                    ? 'border-emerald-300 bg-white shadow-md shadow-emerald-900/5 pl-5'
                    : 'border-slate-200 bg-white/[0.92] hover:border-emerald-200 hover:bg-white'
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {/* 3px selected left accent bar */}
                {activeSelectedId === a.id && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-gradient-to-b from-emerald-400 to-emerald-600 animate-fadeIn" />
                )}

                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-xs line-clamp-1 flex-1 pr-2">{a.title}</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                    a.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <span className={`h-1 w-1 rounded-full ${a.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {a.status}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 mb-2.5">{a.role_name}</p>
                <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {a.interview_duration_mins}m
                  </span>
                  <span>
                    {new Date(a.window_end).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* â”€â”€ Right: Detail View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 h-full min-w-0">
        {loadingDetails ? (
          <div className="flex flex-col items-center justify-center h-full ibot-panel">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-semibold">Loading details...</p>
          </div>
        ) : selectedAssessment ? (
          <div className="h-full ibot-panel flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Header */}
            <div className="border-b border-slate-200/70 bg-white/[0.85] p-5 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-1 font-display">{selectedAssessment.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium">
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 text-[10px]">{selectedAssessment.role_name}</span>
                    <span className="text-slate-300"> • </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {selectedAssessment.interview_duration_mins}m
                    </span>
                    <span className="text-slate-300"> • </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(selectedAssessment.window_start).toLocaleDateString()} - {new Date(selectedAssessment.window_end).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Status Toggle Container */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 transition-all hover:bg-slate-100/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className="text-xs font-semibold text-slate-700 capitalize">{selectedAssessment.status.toLowerCase()}</span>
                  <button
                    onClick={() => toggleCampaignStatus(selectedAssessment.id, selectedAssessment.status)}
                    disabled={updateStatusMutation.isPending}
                    className="hover:opacity-80 transition-all ml-1.5 active:scale-95 duration-100"
                    title={selectedAssessment.status === 'ACTIVE' ? 'Close' : 'Activate'}
                  >
                    {selectedAssessment.status === 'ACTIVE' ? (
                      <ToggleRight className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="ibot-scrollbar flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/[0.45]">
              
              {/* Analysis & JD Cards (Rich Interactive) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-white border border-slate-200/80 p-5 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:scale-[1.02] hover:shadow-md group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 border border-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">AI Analysis & Timeline</h3>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {selectedAssessment.jd_analysis?.skills?.length ?? 3} skills tracked • Plan generated
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnalysisModal(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-emerald-600 transition-all hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <FileText className="h-3 w-3" />
                    View
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-white border border-slate-200/80 p-5 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:scale-[1.02] hover:shadow-md group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 border border-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Job Description (JD)</h3>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Launched {new Date(selectedAssessment.window_start).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowJdModal(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-emerald-600 transition-all hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <FileText className="h-3 w-3" />
                    View JD
                  </button>
                </div>
              </div>

              {/* Candidates Section */}
              <div className="border-t border-slate-100 pt-5">
                <button
                  onClick={() => setShowCandidates(v => !v)}
                  className="flex w-full items-center justify-between group py-1.5 px-1 hover:bg-slate-100/40 rounded transition-colors duration-300"
                >
                  <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                    <Users className="h-4 w-4 text-emerald-500 transition-transform group-hover:scale-110" />
                    Candidates
                    <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      {assessmentCandidates.length}
                    </span>
                  </h3>
                  <div className="text-xs font-medium text-slate-400 group-hover:text-emerald-600 transition-all duration-200">
                    {showCandidates ? (
                      <ChevronUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                    )}
                  </div>
                </button>

                {showCandidates && (
                  <div className="mt-4 animate-slideUp">
                    {loadingCandidates ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                      </div>
                    ) : assessmentCandidates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center border border-dashed border-slate-200 rounded-xl bg-white shadow-sm p-6">
                        <FileSpreadsheet className="h-7 w-7 text-slate-300 animate-bounce" />
                        <p className="text-xs font-semibold text-slate-500">No candidates yet</p>
                        <p className="text-[10px] text-slate-400">Invite candidates via the Candidates dashboard</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50/70 border-b border-slate-100">
                            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="px-4 py-3">Candidate</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Decision</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {assessmentCandidates.map((c) => (
                              <tr key={c.id} className="group hover:bg-slate-100/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/50 text-emerald-600 font-bold text-[10px] group-hover:scale-105 duration-200">
                                      {c.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-800 text-xs group-hover:text-emerald-700 transition-colors">{c.full_name}</p>
                                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 font-medium">
                                        <Mail className="h-3 w-3" />{c.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold border transition-transform group-hover:scale-105 ${
                                    c.status === 'EVALUATED' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                                    c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    c.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      (c.status === 'COMPLETED' || c.status === 'EVALUATED') ? 'bg-emerald-500 animate-pulse' :
                                      c.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-400'
                                    }`} />
                                    {c.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold border transition-transform group-hover:scale-105 ${
                                    c.recruiter_decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    c.recruiter_decision === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      c.recruiter_decision === 'APPROVED' ? 'bg-emerald-500' :
                                      c.recruiter_decision === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
                                    }`} />
                                    {c.recruiter_decision || 'PENDING'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Campaign Progress segmented bar (Interactive) */}
              {totalCandidates > 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm mt-3 animate-slideUp hover:border-emerald-300 hover:shadow-md transition-all duration-300 cursor-default group">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider">
                    <span>Campaign Progress</span>
                    <span className="text-emerald-600 font-extrabold group-hover:scale-105 transition-transform">{completedCandidates} / {totalCandidates} Screened</span>
                  </div>
                  <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-100 border border-slate-100">
                    <div className="bg-emerald-500 transition-all duration-300 hover:opacity-90" style={{ width: `${(completedCandidates / totalCandidates) * 100}%` }} title={`Screened: ${completedCandidates}`} />
                    <div className="bg-blue-500 transition-all duration-300 hover:opacity-90" style={{ width: `${(inProgressCandidates / totalCandidates) * 100}%` }} title={`In Progress: ${inProgressCandidates}`} />
                    <div className="bg-amber-400 transition-all duration-300 hover:opacity-90" style={{ width: `${(invitedCandidates / totalCandidates) * 100}%` }} title={`Invited: ${invitedCandidates}`} />
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2.5 text-[10px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {completedCandidates} Screened
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {inProgressCandidates} In Progress
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-amber-500 transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {invitedCandidates} Invited
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full ibot-panel border-dashed p-6 text-center">
            <Briefcase className="h-10 w-10 text-slate-300 mb-3 animate-pulse" />
            <p className="font-semibold text-slate-500 text-sm">Select a campaign</p>
            <p className="text-xs text-slate-400 mt-1">Choose from the list to view details</p>
          </div>
        )}
      </div>

      {/* â”€â”€ Analysis Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showAnalysisModal && selectedAssessment && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-3xl max-h-[85vh] relative flex flex-col bg-white">
            
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                  Analysis & Interview Plan
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">AI-generated from the job description</p>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 duration-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Soft bottom fade-gradient above sticky footer */}
            <div className="absolute bottom-[68px] left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

            <div className="ibot-scrollbar p-6 pb-12 overflow-y-auto space-y-6 flex-1">
              {/* Inferred Signals */}
              {selectedAssessment.jd_analysis && (
                <div className="grid grid-cols-3 gap-3 shrink-0">
                  {[
                    {
                      label: 'Difficulty',
                      value: selectedAssessment.jd_analysis.inferred_difficulty,
                      icon: Gauge,
                      accent: true,
                    },
                    {
                      label: 'Planned skills',
                      value: String(
                        selectedAssessment.interview_plan?.sections.filter((section) => section.skill).length
                          ?? selectedAssessment.jd_analysis.skills.length,
                      ),
                      icon: Sparkles,
                    },
                    {
                      label: 'Plan duration',
                      value: `${selectedAssessment.interview_plan?.total_mins ?? selectedAssessment.interview_duration_mins} min`,
                      icon: Clock,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center gap-3 transition-all hover:scale-[1.03] hover:shadow-sm hover:border-emerald-500/20 cursor-default group">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-emerald-50 border border-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">{item.label}</span>
                          <span className={`block text-xs font-bold truncate ${item.accent ? 'text-emerald-700' : 'text-slate-800'}`}>
                            {item.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Skills */}
              {selectedAssessment.jd_analysis?.skills && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    Skill Priorities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {selectedAssessment.jd_analysis.skills.map((skillItem, index) => (
                      <div key={index} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:scale-[1.03] hover:shadow-md transition-all duration-300 group cursor-default">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-bold text-slate-800 text-xs group-hover:text-emerald-700 transition-colors">{skillItem.skill}</span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 transition-transform group-hover:scale-105">
                            {skillItem.priority_score}/10
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3 line-clamp-2">
                          {skillItem.reasoning}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 group-hover:opacity-90"
                              style={{ width: `${skillItem.priority_score * 10}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-full shrink-0 group-hover:scale-105 transition-transform">
                            Priority
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Behavioural Signals */}
              {selectedAssessment.jd_analysis?.behavioural_signals && selectedAssessment.jd_analysis.behavioural_signals.length > 0 && (
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Behavioural Focus</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssessment.jd_analysis.behavioural_signals.map((sig, idx) => (
                      <span key={idx} className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-700 transition-all hover:scale-105 active:scale-95 duration-200 cursor-default">
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Plan Timeline / Labeled Stacked bar */}
              {selectedAssessment.interview_plan?.sections && (
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-emerald-500" />
                    Time Allocation
                    <span className="ml-auto normal-case tracking-normal text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                      {selectedAssessment.interview_plan.inferred_difficulty}
                    </span>
                  </h3>
                  
                  {(() => {
                    const totalAllocated = selectedAssessment.interview_plan.total_mins
                      || selectedAssessment.interview_plan.sections.reduce((sum, s) => sum + s.allocated_mins, 0)
                      || 1;
                    return (
                      <div className="flex flex-col gap-2.5">
                        {selectedAssessment.interview_plan.sections.map((section, idx) => {
                          const pct = Math.round((section.allocated_mins / totalAllocated) * 100);
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 capitalize">
                                      {section.section_name === 'self_intro' ? 'Introduction' : section.section_name.replace(/_/g, ' ')}
                                    </p>
                                    {section.skill && (
                                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{section.skill}</p>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded shadow-sm shrink-0">
                                    {section.allocated_mins} min
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{pct}%</span>
                                </div>
                                {section.expected_signals && section.expected_signals.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {section.expected_signals.map((signal, signalIndex) => (
                                      <span
                                        key={signalIndex}
                                        className="rounded-full bg-slate-50 border border-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500"
                                      >
                                        {signal}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Sticky Close Button Footer with custom shadow highlight */}
            <div className="border-t border-slate-100 p-4 shrink-0 flex justify-end bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.03)] z-10">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm hover:scale-[1.03] active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Create Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showCreateModal && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-2xl max-h-[88vh]">
            <div className="ibot-scrollbar overflow-y-auto animate-scaleIn">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                  New Campaign
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Configure details and upload the JD</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              {/* Error */}
              {createError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-slideDown">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCreateAssessment} className="flex flex-col gap-4" id="create-campaign-form">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Title</label>
                    <input
                      required type="text" value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="e.g. Senior Node.js Hiring"
                      className={inputStyles}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
                    <input
                      required type="text" value={createRoleName}
                      onChange={(e) => setCreateRoleName(e.target.value)}
                      placeholder="e.g. Backend Developer"
                      className={inputStyles}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration</label>
                    <CustomSelect
                      value={createDuration}
                      onChange={setCreateDuration}
                      options={Array.from({ length: 18 }, (_, i) => (i + 1) * 5).map((mins) => ({
                        value: mins,
                        label: `${mins} minutes`,
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Start</label>
                    <input required type="datetime-local" value={createWindowStart}
                      onChange={(e) => setCreateWindowStart(e.target.value)}
                      className={inputStyles}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">End</label>
                    <input required type="datetime-local" value={createWindowEnd}
                      onChange={(e) => setCreateWindowEnd(e.target.value)}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Focus Area overrides */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col gap-2">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Focus Overrides <span className="text-slate-400 font-normal lowercase">(optional)</span></h3>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" value={newSkillOverride}
                      onChange={(e) => setNewSkillOverride(e.target.value)}
                      placeholder="e.g. Docker"
                      className={`flex-1 ${inputStyles}`}
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range" min="1" max="10"
                        value={newWeightOverride}
                        onChange={(e) => setNewWeightOverride(Number(e.target.value))}
                        className="w-16 accent-emerald-600"
                      />
                      <span className="text-xs text-slate-800 font-bold w-4">{newWeightOverride}</span>
                    </div>
                    <button
                      type="button" onClick={addFocusArea}
                      className="rounded-lg bg-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-350 hover:scale-[1.03] active:scale-[0.97] transition-all font-bold"
                    >
                      Add
                    </button>
                  </div>
                  {createFocusAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {createFocusAreas.map((fa, index) => (
                        <span key={index} className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold transition-transform hover:scale-105 cursor-default">
                          {fa.skill} ({fa.weight})
                          <button type="button" onClick={() => removeFocusArea(index)} className="text-emerald-500 hover:text-emerald-700">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* JD Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Job Description</label>
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 max-w-xs self-start">
                    <button
                      type="button" onClick={() => setCreateJdType('text')}
                      className={`px-3 py-1.5 text-[11px] font-bold transition-all hover:bg-slate-100/50 ${
                        createJdType === 'text' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button" onClick={() => setCreateJdType('file')}
                      className={`px-3 py-1.5 text-[11px] font-bold transition-all hover:bg-slate-100/50 ${
                        createJdType === 'file' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Upload PDF
                    </button>
                  </div>
                </div>

                {/* JD Input */}
                {createJdType === 'text' ? (
                  <textarea
                    required value={createJdText}
                    onChange={(e) => setCreateJdText(e.target.value)}
                    placeholder="Paste the job requirements and qualifications..."
                    rows={4}
                    className={`${inputStyles} resize-none`}
                  />
                ) : (
                  <div className="border border-dashed border-slate-300 bg-slate-50 p-5 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center relative hover:border-emerald-400 hover:bg-emerald-50/20 transition-all duration-300">
                    <FileText className="h-6 w-6 text-slate-400 animate-pulse" />
                    {createJdFile ? (
                      <span className="text-xs text-emerald-600 font-bold">{createJdFile.name}</span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">Select PDF (max 10MB)</span>
                    )}
                    <input
                      required type="file" accept=".pdf"
                      onChange={(e) => setCreateJdFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:scale-[1.03] active:scale-[0.97] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-campaign-form"
                disabled={createMutation.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Launch'
                )}
              </button>
            </div>
            
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ JD Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showJdModal && selectedAssessment && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-2xl max-h-[85vh] animate-scaleIn">
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <FileText className="h-4 w-4 text-emerald-500 animate-pulse" />
                  Job Description: {selectedAssessment.title}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Role: {selectedAssessment.role_name}</p>
              </div>
              <button
                onClick={() => setShowJdModal(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ibot-scrollbar p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedAssessment.jd_text}
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 shrink-0 flex justify-end">
              <button
                onClick={() => setShowJdModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


