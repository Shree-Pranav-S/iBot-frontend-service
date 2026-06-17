import React, { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
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
} from 'lucide-react';
import type { AssessmentStatus } from '../../../types/assessment.types';

export const AssessmentsPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  
  // Queries & Mutations
  const { data: assessments = [], isLoading: loadingAssessments } = useAssessments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: selectedAssessment, isLoading: loadingDetails } = useAssessmentDetails(selectedId);
  const { data: assessmentCandidates = [], isLoading: loadingCandidates } = useCandidates(selectedId);
  const [showCandidates, setShowCandidates] = useState(false);

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

  // Automatically select the first assessment if none is selected
  useEffect(() => {
    if (assessments.length > 0 && !selectedId) {
      setSelectedId(assessments[0].id);
    }
  }, [assessments, selectedId]);

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
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
      toastSuccess('Campaign Created', 'Your assessment campaign has been launched successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create assessment.';
      setCreateError(msg);
      toastError('Campaign Creation Failed', msg);
    }
  };

  const addFocusArea = () => {
    if (!newSkillOverride.trim()) return;
    if (createFocusAreas.some(fa => fa.skill.toLowerCase() === newSkillOverride.trim().toLowerCase())) {
      return; // duplicate
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
      toastSuccess('Status Updated', `Campaign status transitioned to ${nextStatus}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update campaign status.';
      toastError('Status Transition Failed', msg);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden gap-8 -mt-2">
      {/* Left Column: Campaigns List (locked height, scrollable) */}
      <div className="w-80 flex-shrink-0 flex flex-col h-full gap-4">
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-500" />
            Campaigns ({assessments.length})
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>

        {loadingAssessments ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-gray-200 bg-white rounded-2xl shadow-sm">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
            <p className="text-xs text-gray-500 font-medium">Loading campaigns...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-300 bg-white rounded-2xl">
            <Briefcase className="h-8 w-8 text-gray-300 mb-2" />
            <p className="font-semibold text-gray-600 text-sm">No campaigns found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">Create a campaign to automatically evaluate job descriptions and candidates.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
            {assessments.map((a) => (
              <div
                key={a.id}
                onClick={() => { setSelectedId(a.id); setShowCandidates(false); }}
                className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
                  selectedId === a.id
                    ? 'border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-100'
                    : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-xs line-clamp-1 flex-1 pr-2">{a.title}</h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold border ${
                    a.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium mb-3">{a.role_name}</p>
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {a.interview_duration_mins} mins
                  </span>
                  <span>
                    Expires {new Date(a.window_end).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Detail View (locked height, scrollable) */}
      <div className="flex-1 h-full min-w-0">
        {loadingDetails ? (
          <div className="flex flex-col items-center justify-center h-full border border-gray-200 bg-white rounded-2xl shadow-sm">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">Analyzing job description details...</p>
          </div>
        ) : selectedAssessment ? (
          <div className="h-full border border-gray-200 bg-white rounded-2xl flex flex-col overflow-hidden shadow-sm">
            
            {/* Detail Header */}
            <div className="border-b border-gray-100 p-6 flex-shrink-0 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-gray-900 mb-1">{selectedAssessment.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
                    <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">{selectedAssessment.role_name}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {selectedAssessment.interview_duration_mins} mins
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {new Date(selectedAssessment.window_start).toLocaleDateString()} - {new Date(selectedAssessment.window_end).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Status Toggle Action */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500">Campaign Status:</span>
                  <button
                    onClick={() => toggleCampaignStatus(selectedAssessment.id, selectedAssessment.status)}
                    disabled={updateStatusMutation.isPending}
                    className="flex items-center hover:opacity-85 transition-opacity"
                    title={selectedAssessment.status === 'ACTIVE' ? 'Close Campaign' : 'Activate Campaign'}
                  >
                    {selectedAssessment.status === 'ACTIVE' ? (
                      <ToggleRight className="h-8 w-8 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Detail Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* LLM Inferred Signals Summary */}
              {selectedAssessment.jd_analysis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-5">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Inferred Title</span>
                    <span className="text-xs font-semibold text-gray-900 mt-1">{selectedAssessment.jd_analysis.inferred_role_title}</span>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Seniority Level</span>
                    <span className="text-xs font-semibold text-gray-900 mt-1">{selectedAssessment.jd_analysis.seniority_level}</span>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Evaluation Difficulty</span>
                    <span className="text-xs font-semibold text-indigo-600 mt-1">{selectedAssessment.jd_analysis.difficulty}</span>
                  </div>
                </div>
              )}

              {/* Skills Priorities list */}
              {selectedAssessment.jd_analysis?.skills && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    JD Skill Analysis Priorities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAssessment.jd_analysis.skills.map((skillItem, index) => (
                      <div key={index} className="p-4 bg-gray-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-gray-900 text-xs">{skillItem.skill}</span>
                            <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                              {skillItem.depth_required}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed italic mb-3">
                            "{skillItem.reasoning}"
                          </p>
                        </div>
                        
                        <div className="space-y-1.5 mt-auto">
                          <div className="flex justify-between items-center text-[10px] text-gray-400">
                            <span>Score Priority:</span>
                            <span className="font-bold text-indigo-700">{skillItem.priority_score}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-1 rounded-full"
                              style={{ width: `${skillItem.priority_score * 10}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Behavioural Signals */}
              {selectedAssessment.jd_analysis?.behavioural_signals && selectedAssessment.jd_analysis.behavioural_signals.length > 0 && (
                <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Behavioural Signals Focus</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssessment.jd_analysis.behavioural_signals.map((sig, idx) => (
                      <span key={idx} className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Plan Timeline */}
              {selectedAssessment.interview_plan?.sections && (
                <div className="flex flex-col gap-4 border-t border-gray-100 pt-5">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-indigo-500" />
                    Generated Time Allocation Plan
                  </h3>
                  <div className="relative pl-6 border-l border-gray-200 flex flex-col gap-5 mt-2 ml-2">
                    {selectedAssessment.interview_plan.sections.map((section, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[28px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border border-indigo-400" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-gray-900 text-xs capitalize">
                              {section.section_name === 'self_intro' ? 'Self Introduction' : section.section_name}
                            </span>
                            {section.skill && (
                              <span className="text-[10px] text-gray-400 ml-2">({section.skill} technical section)</span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shrink-0">
                            {section.allocated_mins} mins
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidates Section */}
              <div className="border-t border-gray-100 pt-5">
                <button
                  onClick={() => setShowCandidates(v => !v)}
                  className="flex w-full items-center justify-between group"
                >
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-500" />
                    Candidates
                    <span className="ml-1 inline-flex items-center justify-center h-4.5 px-1.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                      {assessmentCandidates.length}
                    </span>
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 group-hover:text-indigo-700">
                    {showCandidates ? (
                      <><ChevronUp className="h-3.5 w-3.5" /> Hide</>
                    ) : (
                      <><ChevronDown className="h-3.5 w-3.5" /> View Candidates</>
                    )}
                  </div>
                </button>

                {showCandidates && (
                  <div className="mt-3">
                    {loadingCandidates ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                      </div>
                    ) : assessmentCandidates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <FileSpreadsheet className="h-7 w-7 text-gray-300" />
                        <p className="text-xs font-semibold text-gray-500">No candidates yet</p>
                        <p className="text-[10px] text-gray-400 max-w-[200px]">Upload a CSV from the Candidates tab to invite people to this campaign.</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              <th className="px-4 py-2.5">Candidate</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Decision</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {assessmentCandidates.map((c) => (
                              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-[10px]">
                                      {c.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-bold text-gray-800">{c.full_name}</p>
                                      <p className="text-[9px] text-gray-400 flex items-center gap-0.5">
                                        <Mail className="h-2.5 w-2.5" />{c.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold border ${
                                    c.status === 'EVALUATED' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                    c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    c.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                                    c.recruiter_decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                    c.recruiter_decision === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200' :
                                    'bg-amber-100 text-amber-800 border-amber-200'
                                  }`}>
                                    {c.recruiter_decision}
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

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border border-dashed border-gray-300 bg-white rounded-2xl p-6 text-center">
            <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-bold text-gray-600 text-sm">No campaign selected</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Select a campaign from the list on the left to view the JD analysis details and interview timelines.</p>
          </div>
        )}
      </div>

      {/* Create Assessment Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  Launch New Assessment Campaign
                </h2>
                <p className="text-xs text-gray-500 mt-1">Configure parameters and upload details. The AI parses the job and generates custom rubrics.</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="rounded-xl border border-gray-200 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Notification */}
            {createError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <span>{createError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateAssessment} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Campaign Title</label>
                  <input
                    required
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. Senior Node.js Developer Hiring"
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Target Role Name</label>
                  <input
                    required
                    type="text"
                    value={createRoleName}
                    onChange={(e) => setCreateRoleName(e.target.value)}
                    placeholder="e.g. Backend Developer"
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Interview Duration (mins)</label>
                  <select
                    value={createDuration}
                    onChange={(e) => setCreateDuration(Number(e.target.value))}
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  >
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Start Window Datetime</label>
                  <input
                    required
                    type="datetime-local"
                    value={createWindowStart}
                    onChange={(e) => setCreateWindowStart(e.target.value)}
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">End Window Datetime</label>
                  <input
                    required
                    type="datetime-local"
                    value={createWindowEnd}
                    onChange={(e) => setCreateWindowEnd(e.target.value)}
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              {/* Focus Area overrides */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col gap-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-800">Focus Weight Overrides (Optional)</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Define custom weights for specific technical skills. Otherwise, weights are inferred from the JD.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillOverride}
                    onChange={(e) => setNewSkillOverride(e.target.value)}
                    placeholder="e.g. Docker"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Weight:</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newWeightOverride}
                      onChange={(e) => setNewWeightOverride(Number(e.target.value))}
                      className="w-20 accent-indigo-600"
                    />
                    <span className="text-xs text-gray-900 font-bold w-4">{newWeightOverride}</span>
                  </div>
                  <button
                    type="button"
                    onClick={addFocusArea}
                    className="rounded-xl bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Add
                  </button>
                </div>
                {createFocusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {createFocusAreas.map((fa, index) => (
                      <span key={index} className="inline-flex items-center gap-1 rounded-xl bg-indigo-100 border border-indigo-200 px-3 py-1 text-xs text-indigo-700 font-medium">
                        {fa.skill} (Weight: {fa.weight})
                        <button type="button" onClick={() => removeFocusArea(index)} className="text-indigo-500 hover:text-indigo-700">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* JD Type Switcher */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Job Description Input Mode</label>
                <div className="flex border border-gray-300 rounded-xl overflow-hidden bg-gray-50 max-w-xs self-start">
                  <button
                    type="button"
                    onClick={() => setCreateJdType('text')}
                    className={`px-4 py-2 text-xs font-semibold transition-all ${
                      createJdType === 'text' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateJdType('file')}
                    className={`px-4 py-2 text-xs font-semibold transition-all ${
                      createJdType === 'file' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Upload PDF
                  </button>
                </div>
              </div>

              {/* JD Input fields */}
              {createJdType === 'text' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Job Description Text</label>
                  <textarea
                    required
                    value={createJdText}
                    onChange={(e) => setCreateJdText(e.target.value)}
                    placeholder="Paste the job requirements, responsibilities, skills, and qualifications here…"
                    rows={5}
                    className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Job Description PDF File</label>
                  <div className="border border-dashed border-gray-300 bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 text-center relative hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                    <FileText className="h-8 w-8 text-gray-400" />
                    {createJdFile ? (
                      <span className="text-xs text-indigo-600 font-bold">{createJdFile.name}</span>
                    ) : (
                      <span className="text-xs text-gray-500">Select PDF job description file (Max 10MB)</span>
                    )}
                    <input
                      required
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setCreateJdFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="border-t border-gray-100 pt-5 mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing JD...
                    </>
                  ) : (
                    'Launch Campaign'
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
