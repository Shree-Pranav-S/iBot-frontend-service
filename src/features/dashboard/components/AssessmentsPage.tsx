import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Mail,
  FileSpreadsheet,
  Gauge,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  CalendarDays,
  ArrowUpRight,
  Code2,
  Layers3,
  BrainCircuit,
  CircleDot,
  CheckCircle2,
  UserRoundPlus,
  FileCheck2,
} from 'lucide-react';
import type { AssessmentStatus, AssessmentSummaryResponse } from '../../../types/assessment.types';
import { buildAssessmentInstanceNumbers } from '../utils/assessmentDisplay';
import {
  CARD_MIN_H,
  CARD_MIN_W,
  SIDEBAR_CARD_MIN_H,
  computeGridCapacity,
} from '../utils/gridCapacity';

const CANDIDATES_PAGE_SIZE = 5;
type StatusFilter = 'all' | 'active' | 'closed';
type SortOption = 'newest' | 'start' | 'title';

const ASSESSMENT_PALETTES = [
  {
    line: 'from-brand-charcoal to-brand-accent',
    icon: 'bg-gradient-to-br from-brand-charcoal to-brand-hover text-white shadow-[rgba(36,33,29,0.18)]',
    border: 'hover:border-brand-accent',
    title: 'group-hover:text-brand-hover',
    wash: 'from-brand-soft/80 to-white',
    meta: 'text-brand-hover',
  },
  {
    line: 'from-brand-accent to-brand-hover',
    icon: 'bg-gradient-to-br from-brand-accent to-brand-hover text-white shadow-[rgba(185,131,63,0.18)]',
    border: 'hover:border-brand-accent',
    title: 'group-hover:text-brand-hover',
    wash: 'from-brand-soft/80 to-white',
    meta: 'text-brand-hover',
  },
  {
    line: 'from-[#8A6A45] to-brand-accent',
    icon: 'bg-gradient-to-br from-[#8A6A45] to-brand-accent text-white shadow-[rgba(138,106,69,0.18)]',
    border: 'hover:border-brand-accent',
    title: 'group-hover:text-brand-hover',
    wash: 'from-brand-soft/80 to-white',
    meta: 'text-brand-hover',
  },
  {
    line: 'from-[#D7AA6A] to-brand-hover',
    icon: 'bg-gradient-to-br from-[#D7AA6A] to-brand-hover text-white shadow-[rgba(154,106,48,0.18)]',
    border: 'hover:border-brand-accent',
    title: 'group-hover:text-brand-hover',
    wash: 'from-brand-soft/80 to-white',
    meta: 'text-brand-hover',
  },
  {
    line: 'from-brand-hover to-brand-charcoal',
    icon: 'bg-gradient-to-br from-brand-hover to-brand-charcoal text-white shadow-[rgba(36,33,29,0.18)]',
    border: 'hover:border-brand-accent',
    title: 'group-hover:text-brand-hover',
    wash: 'from-brand-soft/80 to-white',
    meta: 'text-brand-hover',
  },
  {
    line: 'from-[#5A5045] to-[#B9833F]',
    icon: 'bg-gradient-to-br from-[#5A5045] to-brand-accent text-white shadow-[rgba(36,33,29,0.18)]',
    border: 'hover:border-brand-accent',
    title: 'group-hover:text-brand-hover',
    wash: 'from-brand-soft/80 to-white',
    meta: 'text-brand-hover',
  },
] as const;

function assessmentPalette(id: string) {
  const hash = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ASSESSMENT_PALETTES[hash % ASSESSMENT_PALETTES.length];
}

function assessmentStatusMeta(status: AssessmentStatus) {
  if (status === 'ACTIVE') {
    return {
      label: 'Active',
      classes: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
    };
  }
  if (status === 'DRAFT') {
    return {
      label: 'Draft',
      classes: 'border-amber-200 bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
    };
  }
  if (status === 'PROCESSING') {
    return {
      label: 'Processing',
      classes: 'border-amber-200 bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
    };
  }
  return {
    label: 'Closed',
    classes: 'border-slate-200 bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  };
}

function formatAssessmentDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type DetailTab = 'overview' | 'candidates';

interface PaginationFooterProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const PaginationFooter: React.FC<PaginationFooterProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-t border-default bg-elevated px-4 py-3">
      <p className="text-[10px] font-semibold text-secondary">
        Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-default bg-surface text-secondary transition-colors hover:border-brand-accent hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPageChange(i)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
              i === page
                ? 'bg-brand-charcoal text-white shadow-sm'
                : 'border border-default bg-surface text-secondary hover:border-brand-accent hover:text-brand-hover'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-default bg-surface text-secondary transition-colors hover:border-brand-accent hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const AssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();
  
  // Queries & Mutations
  const { data: assessments = [], isLoading: loadingAssessments } = useAssessments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: selectedAssessment, isLoading: loadingDetails } =
    useAssessmentDetails(selectedId);
  const { data: assessmentCandidates = [], isLoading: loadingCandidates } =
    useCandidates(selectedId);

  const [campaignPage, setCampaignPage] = useState(0);
  const [sidebarPage, setSidebarPage] = useState(0);
  const [candidatesPage, setCandidatesPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showJdModal, setShowJdModal] = useState(false);

  const browseGridRef = useRef<HTMLDivElement>(null);
  const sidebarGridRef = useRef<HTMLDivElement>(null);
  const [browseCapacity, setBrowseCapacity] = useState(() =>
    computeGridCapacity(800, 400, CARD_MIN_W, CARD_MIN_H),
  );
  const [sidebarCapacity, setSidebarCapacity] = useState(() =>
    computeGridCapacity(260, 400, CARD_MIN_W, SIDEBAR_CARD_MIN_H, 1),
  );

  useEffect(() => {
    const el = browseGridRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBrowseCapacity(computeGridCapacity(width, height, CARD_MIN_W, CARD_MIN_H));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedId, loadingAssessments]);

  useEffect(() => {
    const el = sidebarGridRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSidebarCapacity(
        computeGridCapacity(width, height, CARD_MIN_W, SIDEBAR_CARD_MIN_H, 1),
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedId, loadingAssessments]);

  const campaignPageSize = browseCapacity.pageSize;
  const sidebarPageSize = sidebarCapacity.pageSize;

  const instanceNumbers = useMemo(
    () => buildAssessmentInstanceNumbers(assessments),
    [assessments],
  );

  const sortedAssessments = useMemo(() => {
    return [...assessments].sort((left, right) => {
      if (sortOption === 'title') return left.title.localeCompare(right.title);
      if (sortOption === 'start') {
        return new Date(left.window_start).getTime() - new Date(right.window_start).getTime();
      }
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [assessments, sortOption]);

  const filteredAssessments = useMemo(() => {
    if (statusFilter === 'all') return sortedAssessments;
    if (statusFilter === 'active') {
      return sortedAssessments.filter((assessment) => assessment.status === 'ACTIVE');
    }
    if (statusFilter === 'closed') {
      return sortedAssessments.filter((assessment) => assessment.status === 'CLOSED');
    }
    return sortedAssessments;
  }, [sortedAssessments, statusFilter]);

  const campaignPageCount = Math.max(1, Math.ceil(filteredAssessments.length / campaignPageSize));
  const safeCampaignPage = Math.min(campaignPage, campaignPageCount - 1);
  const sidebarPageCount = Math.max(1, Math.ceil(sortedAssessments.length / sidebarPageSize));
  const safeSidebarPage = Math.min(sidebarPage, sidebarPageCount - 1);
  const candidatesPageCount = Math.max(
    1,
    Math.ceil(assessmentCandidates.length / CANDIDATES_PAGE_SIZE),
  );
  const safeCandidatesPage = Math.min(candidatesPage, candidatesPageCount - 1);

  const visibleCampaigns = filteredAssessments.slice(
    safeCampaignPage * campaignPageSize,
    (safeCampaignPage + 1) * campaignPageSize,
  );
  const visibleSidebarCampaigns = sortedAssessments.slice(
    safeSidebarPage * sidebarPageSize,
    (safeSidebarPage + 1) * sidebarPageSize,
  );
  const browseRowCount = Math.max(
    1,
    Math.ceil(visibleCampaigns.length / browseCapacity.cols) || 1,
  );
  const sidebarRowCount = Math.max(1, visibleSidebarCampaigns.length);

  const visibleCandidates = assessmentCandidates.slice(
    safeCandidatesPage * CANDIDATES_PAGE_SIZE,
    (safeCandidatesPage + 1) * CANDIDATES_PAGE_SIZE,
  );

  const handleSelectAssessment = (id: string) => {
    const index = sortedAssessments.findIndex((assessment) => assessment.id === id);
    if (index >= 0) {
      setSidebarPage(Math.floor(index / sidebarPageSize));
    }
    setSelectedId(id);
    setDetailTab('overview');
    setCandidatesPage(0);
  };

  const handleBackToBrowse = () => {
    setSelectedId(null);
    setDetailTab('overview');
    setCandidatesPage(0);
  };

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

      setSidebarPage(0);
      setSelectedId(created.id);
      setDetailTab('overview');
      setCandidatesPage(0);
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

  const inputStyles =
    'rounded-lg border border-default bg-surface px-3 py-2.5 text-xs text-primary placeholder-secondary outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-soft transition-all';

  const totalCandidates = assessmentCandidates.length;
  const completedCandidates = assessmentCandidates.filter(
    (c) => c.status === 'COMPLETED' || c.status === 'EVALUATED',
  ).length;
  const inProgressCandidates = assessmentCandidates.filter(
    (c) => c.status === 'IN_PROGRESS',
  ).length;
  const invitedCandidates = totalCandidates - completedCandidates - inProgressCandidates;
  const selectedStatus = selectedAssessment
    ? assessmentStatusMeta(selectedAssessment.status)
    : null;

  const renderInstanceBadge = (id: string) => {
    const num = instanceNumbers.get(id);
    if (!num) return null;
    return (
      <span className="inline-flex items-center rounded-full border border-[#D8C9B5] bg-brand-soft px-1.5 py-0.5 text-[9px] font-bold text-brand-hover">
        #{num}
      </span>
    );
  };

  const renderCampaignCard = (
    assessment: AssessmentSummaryResponse,
    options: { compact?: boolean; stretch?: boolean } = {},
  ) => {
    const { compact = false, stretch = false } = options;
    const isSelected = selectedId === assessment.id;
    const palette = assessmentPalette(assessment.id);
    const status = assessmentStatusMeta(assessment.status);

    if (compact) {
      return (
        <button
          key={assessment.id}
          type="button"
          onClick={() => handleSelectAssessment(assessment.id)}
          className={`group relative flex h-full min-h-[92px] w-full flex-col justify-center overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 ${
            isSelected
              ? 'border-brand-accent bg-brand-soft/75 shadow-md shadow-black/10'
              : 'border-default bg-surface hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-md'
          }`}
        >
          <span
            className={`absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b ${
              isSelected ? 'from-brand-accent to-brand-hover' : palette.line
            }`}
          />
          <div className="flex items-start justify-between gap-2 pl-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-xs font-black text-slate-900">{assessment.title}</h3>
                {renderInstanceBadge(assessment.id)}
              </div>
              <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
                {assessment.role_name}
              </p>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wide ${status.classes}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <ArrowUpRight className={`absolute bottom-3 right-3 h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 ${palette.meta}`} />
        </button>
      );
    }

    return (
      <button
        key={assessment.id}
        type="button"
        onClick={() => handleSelectAssessment(assessment.id)}
        className={`ibot-assessment-card group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-colors duration-200 ${palette.border} ${
          stretch ? 'flex h-full min-h-[210px] flex-col' : 'min-h-[210px]'
        }`}
      >
        <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${palette.line}`} />
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${palette.icon}`}>
                <Code2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className={`truncate text-sm font-black text-slate-900 transition-colors ${palette.title}`}>
                    {assessment.title}
                  </h3>
                  {renderInstanceBadge(assessment.id)}
                </div>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Assessment campaign
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${status.classes}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 opacity-0 shadow-sm transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          <div className={`mt-4 rounded-xl border border-slate-100 bg-gradient-to-r px-3.5 py-2.5 ${palette.wash}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Role</p>
            <p className="mt-1 truncate text-xs font-bold text-slate-800">{assessment.role_name}</p>
          </div>

          <div className="mt-auto grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 pt-3.5">
            {[
              {
                label: 'Duration',
                value: `${assessment.interview_duration_mins} min`,
                icon: Clock,
              },
              {
                label: 'Start date',
                value: formatAssessmentDate(assessment.window_start),
                icon: CalendarDays,
              },
              {
                label: 'End date',
                value: formatAssessmentDate(assessment.window_end),
                icon: CalendarDays,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={index === 0 ? 'pr-3' : 'px-3'}>
                  <p className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <Icon className="h-3 w-3" />
                    {item.label}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-black text-slate-700" title={item.value}>
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </button>
    );
  };

  const renderCampaignHeader = (compact = false) => {
    if (compact) {
      return (
        <div className="ibot-section-toolbar flex flex-shrink-0 items-center justify-between px-3 py-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-hover">
              <Briefcase className="h-4 w-4 text-brand-hover" />
              Campaigns
            </h2>
            <p className="mt-0.5 text-[9px] font-bold text-slate-400">{assessments.length} total</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-charcoal text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
            aria-label="Create assessment"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      );
    }

    const filters: Array<{ value: StatusFilter; label: string; dot: string }> = [
      { value: 'all', label: 'All', dot: 'bg-slate-400' },
      { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
      { value: 'closed', label: 'Closed', dot: 'bg-slate-500' },
    ];

    return (
      <div className="ibot-section-toolbar flex flex-shrink-0 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-brand-hover">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-hover">
              <Briefcase className="h-4 w-4" />
            </span>
            Campaigns
          </h2>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            Showing {filteredAssessments.length} of {assessments.length} assessments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-default bg-white/75 p-1 shadow-sm">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatusFilter(filter.value);
                  setCampaignPage(0);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black transition-all ${
                  statusFilter === filter.value
                    ? 'bg-brand-charcoal text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === filter.value ? 'bg-white' : filter.dot}`} />
                {filter.label}
              </button>
            ))}
          </div>
          <CustomSelect
            value={sortOption}
            onChange={(value) => {
              setSortOption(value);
              setCampaignPage(0);
            }}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'start', label: 'Start date' },
              { value: 'title', label: 'Title A–Z' },
            ]}
            buttonClassName="min-w-[142px]"
          />
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-charcoal px-4 py-2.5 text-[11px] font-black text-white shadow-md shadow-black/15 transition-all hover:-translate-y-0.5 hover:bg-brand-hover active:translate-y-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Assessment
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {!selectedId ? (
        /* ── Browse mode: full-width campaign grid ── */
        <div className="ibot-assessments-frame flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
          {renderCampaignHeader()}

          {loadingAssessments ? (
            <div className="ibot-panel flex flex-1 flex-col items-center justify-center">
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-brand-accent" />
              <p className="text-[11px] font-semibold text-secondary">Loading campaigns...</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="ibot-panel flex flex-1 flex-col items-center justify-center border-dashed p-8 text-center">
              <Briefcase className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold text-secondary">No campaigns yet</p>
              <p className="mt-1 text-xs text-muted">Create your first assessment to get started.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-charcoal px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Campaign
              </button>
            </div>
          ) : (
            <div ref={browseGridRef} className="ibot-section-surface flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/35">
              {filteredAssessments.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <Layers3 className="h-9 w-9 text-slate-300" />
                  <p className="mt-3 text-sm font-black text-slate-700">No assessments in this status</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setCampaignPage(0);
                    }}
                    className="mt-2 text-[11px] font-black text-brand-hover hover:text-brand-charcoal"
                  >
                    Show all assessments
                  </button>
                </div>
              ) : (
                <div
                  className="grid min-h-0 flex-1 gap-3 p-4"
                  style={{
                    gridTemplateColumns: `repeat(${browseCapacity.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${browseRowCount}, minmax(${CARD_MIN_H}px, 1fr))`,
                  }}
                >
                  {visibleCampaigns.map((assessment) =>
                    renderCampaignCard(assessment, { stretch: true }),
                  )}
                </div>
              )}
              <PaginationFooter
                page={safeCampaignPage}
                pageSize={campaignPageSize}
                total={filteredAssessments.length}
                onPageChange={setCampaignPage}
              />
            </div>
          )}
        </div>
      ) : (
        /* ── Detail mode: side list + detail panel ── */
        <div className="flex h-full min-h-0 w-full gap-4 overflow-hidden">
          <div className="flex w-[264px] flex-shrink-0 flex-col gap-3 overflow-hidden transition-all duration-300">
            {renderCampaignHeader(true)}

            {loadingAssessments ? (
              <div className="ibot-panel flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
              </div>
            ) : (
              <div className="ibot-section-surface flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  ref={sidebarGridRef}
                  className="grid min-h-0 flex-1 gap-2 p-2"
                  style={{
                    gridTemplateColumns: '1fr',
                    gridTemplateRows: `repeat(${sidebarRowCount}, minmax(${SIDEBAR_CARD_MIN_H}px, 1fr))`,
                  }}
                >
                  {visibleSidebarCampaigns.map((a) =>
                    renderCampaignCard(a, { compact: true, stretch: true }),
                  )}
                </div>
                <PaginationFooter
                  page={safeSidebarPage}
                  pageSize={sidebarPageSize}
                  total={sortedAssessments.length}
                  onPageChange={setSidebarPage}
                />
              </div>
            )}
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {loadingDetails ? (
              <div className="ibot-panel flex h-full flex-col items-center justify-center">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-accent" />
                <p className="text-xs font-semibold text-secondary">Loading details...</p>
              </div>
            ) : selectedAssessment ? (
              <div className="ibot-section-surface flex h-full flex-col overflow-hidden animate-scaleIn">
                <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-brand-soft/60 px-5 pb-3 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleBackToBrowse}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-default bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-500 shadow-sm transition-all hover:-translate-x-0.5 hover:border-brand-accent hover:bg-brand-soft hover:text-brand-hover"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      All campaigns
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/candidates?add=1&assessment=${encodeURIComponent(selectedAssessment.id)}`,
                          )
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-charcoal px-3 text-[10px] font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                      >
                        <UserRoundPlus className="h-3.5 w-3.5" />
                        Add candidate
                      </button>

                      {selectedStatus && (
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[8px] font-black uppercase tracking-wide ${selectedStatus.classes}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${selectedStatus.dot}`} />
                            {selectedStatus.label}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              toggleCampaignStatus(selectedAssessment.id, selectedAssessment.status)
                            }
                            disabled={updateStatusMutation.isPending}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-black text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                            aria-label={selectedAssessment.status === 'ACTIVE' ? 'Close assessment' : 'Activate assessment'}
                          >
                            {updateStatusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : selectedAssessment.status === 'ACTIVE' ? (
                              <ToggleRight className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                            {selectedAssessment.status === 'ACTIVE' ? 'Close' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-black tracking-tight text-slate-950">
                      {selectedAssessment.title}
                    </h2>
                    {renderInstanceBadge(selectedAssessment.id)}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {[
                       { label: 'Role name', value: selectedAssessment.role_name, icon: Briefcase, tone: 'text-brand-hover bg-brand-soft' },
                      { label: 'Duration', value: `${selectedAssessment.interview_duration_mins} minutes`, icon: Clock, tone: 'text-indigo-700 bg-indigo-50' },
                      { label: 'Start date', value: formatAssessmentDate(selectedAssessment.window_start), icon: CalendarDays, tone: 'text-sky-700 bg-sky-50' },
                      { label: 'End date', value: formatAssessmentDate(selectedAssessment.window_end), icon: CalendarDays, tone: 'text-violet-700 bg-violet-50' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.tone}`}>
                            <Icon className="h-3 w-3" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[7px] font-black uppercase tracking-[0.13em] text-slate-400">{item.label}</p>
                            <p className="truncate text-[10px] font-black text-slate-800" title={item.value}>{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                    <button
                      type="button"
                      onClick={() => setDetailTab('overview')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[10px] font-black transition-all ${
                        detailTab === 'overview'
                          ? 'bg-brand-charcoal text-white shadow-sm ring-1 ring-brand-accent/20'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('candidates')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[10px] font-black transition-all ${
                        detailTab === 'candidates'
                          ? 'bg-brand-charcoal text-white shadow-sm ring-1 ring-brand-accent/20'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      Candidates
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${
                        detailTab === 'candidates' ? 'bg-white/15 text-white' : 'bg-brand-soft text-brand-hover'
                      }`}>
                        {assessmentCandidates.length}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="ibot-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4">
                  {detailTab === 'overview' ? (
                    <div className="grid grid-cols-1 gap-4 animate-fadeIn xl:grid-cols-12">
                      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm xl:col-span-7">
                        <header className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                              <BrainCircuit className="h-4 w-4" />
                            </span>
                            <div>
                              <h3 className="text-xs font-black text-indigo-950">JD Analysis</h3>
                              <p className="mt-0.5 text-[9px] font-bold text-indigo-500">Role intelligence and priority skills</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAnalysisModal(true)}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[9px] font-black text-indigo-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
                          >
                            Full analysis
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </header>

                        <div className="p-4">
                          {selectedAssessment.jd_analysis ? (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
                                  <p className="text-[8px] font-black uppercase tracking-wider text-indigo-400">Difficulty</p>
                                  <p className="mt-1 text-xs font-black capitalize text-indigo-800">{selectedAssessment.jd_analysis.inferred_difficulty}</p>
                                </div>
                                <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5">
                                  <p className="text-[8px] font-black uppercase tracking-wider text-violet-400">Skills identified</p>
                                  <p className="mt-1 text-xs font-black text-violet-800">{selectedAssessment.jd_analysis.skills.length}</p>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {selectedAssessment.jd_analysis.skills.slice(0, 4).map((skill) => (
                                  <div key={skill.skill} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50/35">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="truncate text-[10px] font-black text-slate-800">{skill.skill}</p>
                                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[8px] font-black text-indigo-700">{skill.priority_score}/10</span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${skill.priority_score * 10}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {selectedAssessment.jd_analysis.behavioural_signals.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Behavioural focus</p>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {selectedAssessment.jd_analysis.behavioural_signals.slice(0, 5).map((signal) => (
                                      <span key={signal} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-[8px] font-bold text-indigo-700">{signal}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex min-h-36 flex-col items-center justify-center text-center">
                              <BrainCircuit className="h-7 w-7 text-slate-300" />
                              <p className="mt-2 text-[10px] font-bold text-slate-500">Analysis is still being prepared.</p>
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm xl:col-span-5">
                        <header className="flex items-center gap-2.5 border-b border-teal-100 bg-gradient-to-r from-teal-50 via-white to-emerald-50 px-4 py-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-200">
                            <FileCheck2 className="h-4 w-4" />
                          </span>
                          <div>
                            <h3 className="text-xs font-black text-teal-950">Job Description</h3>
                            <p className="mt-0.5 text-[9px] font-bold text-teal-600">Source context for this assessment</p>
                          </div>
                        </header>
                        <div className="flex min-h-56 flex-col p-4">
                          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                            <p className="line-clamp-[10] whitespace-pre-line text-[10px] font-medium leading-5 text-slate-600">
                              {selectedAssessment.jd_text || 'No job description text is available.'}
                            </p>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowJdModal(true)}
                            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2.5 text-[10px] font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-700"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Read full JD
                          </button>
                        </div>
                      </section>

                      <section className="order-first overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_16px_36px_-28px_rgba(154,106,48,0.55)] xl:col-span-12">
                        <header className="flex items-center justify-between gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200">
                              <Layers3 className="h-5 w-5" />
                            </span>
                            <div>
                              <h3 className="text-sm font-black text-amber-950">Interview Plan</h3>
                              <p className="mt-0.5 text-[10px] font-bold text-amber-700">Structured sequence, focus areas, and time allocation</p>
                            </div>
                          </div>
                          <span className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[10px] font-black text-amber-700 shadow-sm">
                            {selectedAssessment.interview_plan?.total_mins ?? selectedAssessment.interview_duration_mins} min total
                          </span>
                        </header>

                        {selectedAssessment.interview_plan?.sections?.length ? (
                          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                            {selectedAssessment.interview_plan.sections.map((section, index) => (
                              <div key={`${section.section_name}-${index}`} className="group min-h-[112px] rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/35 hover:shadow-md">
                                <div className="flex items-start gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[11px] font-black text-amber-700">{index + 1}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-black capitalize text-slate-900">
                                          {section.section_name === 'self_intro' ? 'Introduction' : section.section_name.replace(/_/g, ' ')}
                                        </p>
                                        <p className="mt-1 truncate text-[10px] font-bold text-slate-500">{section.skill || 'General assessment'}</p>
                                      </div>
                                      <span className="shrink-0 rounded-lg border border-amber-100 bg-white px-2 py-1 text-[10px] font-black text-amber-700 shadow-sm">{section.allocated_mins} min</span>
                                    </div>
                                    {section.expected_signals && section.expected_signals.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-1.5">
                                        {section.expected_signals.slice(0, 2).map((signal) => (
                                          <span key={signal} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-bold leading-none text-slate-600">{signal}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex min-h-32 flex-col items-center justify-center p-6 text-center">
                            <Layers3 className="h-7 w-7 text-slate-300" />
                            <p className="mt-2 text-[10px] font-bold text-slate-500">The interview plan is still being generated.</p>
                          </div>
                        )}
                      </section>
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col gap-3 animate-fadeIn">
                      <div className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-sky-50 px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-200">
                            <Users className="h-4 w-4" />
                          </span>
                          <div>
                            <h3 className="text-xs font-black text-cyan-950">Candidate Pipeline</h3>
                            <p className="mt-0.5 text-[9px] font-bold text-cyan-600">Progress for this assessment</p>
                          </div>
                        </div>
                        <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[9px] font-black text-cyan-700">
                          {totalCandidates} total
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        {[
                          { label: 'Total', value: totalCandidates, icon: Users, tone: 'border-cyan-100 bg-cyan-50 text-cyan-700' },
                          { label: 'Screened', value: completedCandidates, icon: CheckCircle2, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
                          { label: 'In progress', value: inProgressCandidates, icon: CircleDot, tone: 'border-blue-100 bg-blue-50 text-blue-700' },
                          { label: 'Invited', value: invitedCandidates, icon: UserRoundPlus, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
                        ].map((metric) => {
                          const Icon = metric.icon;
                          return (
                            <div key={metric.label} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${metric.tone}`}>
                              <Icon className="h-4 w-4 shrink-0" />
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-wider opacity-70">{metric.label}</p>
                                <p className="mt-0.5 text-sm font-black">{metric.value}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {loadingCandidates ? (
                        <div className="flex min-h-48 flex-1 items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                        </div>
                      ) : assessmentCandidates.length === 0 ? (
                        <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-200 bg-white p-8 text-center">
                          <FileSpreadsheet className="h-8 w-8 text-slate-300" />
                          <p className="text-xs font-black text-slate-700">No candidates yet</p>
                          <p className="text-[10px] text-muted">
                            Invite candidates via the Candidates dashboard
                          </p>
                        </div>
                      ) : (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-cyan-100 bg-white shadow-sm">
                          <div className="ibot-scrollbar min-h-0 flex-1 overflow-auto">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead className="sticky top-0 z-10 border-b border-cyan-100 bg-cyan-50/90 backdrop-blur-sm">
                              <tr className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                <th className="px-4 py-3">Candidate</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Decision</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                              {visibleCandidates.map((c) => (
                                <tr key={c.id} className="group transition-colors hover:bg-cyan-50/35">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-600">
                                        {c.full_name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-primary group-hover:text-emerald-700">
                                          {c.full_name}
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium text-secondary">
                                          <Mail className="h-3 w-3" />
                                          {c.email}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                                        c.status === 'EVALUATED'
                                          ? 'border-teal-200 bg-teal-50 text-teal-600'
                                          : c.status === 'COMPLETED'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                            : c.status === 'IN_PROGRESS'
                                              ? 'border-blue-200 bg-blue-50 text-blue-600'
                                              : 'border-default bg-elevated text-secondary'
                                      }`}
                                    >
                                      {c.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${
                                        c.recruiter_decision === 'APPROVED'
                                          ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                                          : c.recruiter_decision === 'REJECTED'
                                            ? 'border-red-200 bg-red-100 text-red-700'
                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                      }`}
                                    >
                                      {c.recruiter_decision === 'APPROVED'
                                        ? 'HIRED'
                                        : c.recruiter_decision || 'PENDING'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                          <PaginationFooter
                            page={safeCandidatesPage}
                            pageSize={CANDIDATES_PAGE_SIZE}
                            total={assessmentCandidates.length}
                            onPageChange={setCandidatesPage}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* â”€â”€ Analysis Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showAnalysisModal && selectedAssessment && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-4xl max-h-[88vh] relative flex flex-col bg-white">
            <div className="h-1.5 shrink-0 bg-gradient-to-r from-brand-charcoal via-brand-accent to-brand-hover" />
            <div className="flex shrink-0 items-center justify-between border-b border-default bg-gradient-to-r from-brand-soft via-white to-[#FCFAF6] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-charcoal text-white shadow-md shadow-black/15">
                  <BrainCircuit className="h-4 w-4" />
                </span>
                <div>
                <h2 className="font-display text-[16px] font-black text-slate-950">
                  JD Analysis & Interview Plan
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{selectedAssessment.title} · AI-generated from the job description</p>
                </div>
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

            <div className="ibot-scrollbar p-6 pb-12 overflow-y-auto space-y-6 flex-1 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/25">
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
                      <div key={item.label} className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-sm hover:border-indigo-300 cursor-default group">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 transition-transform group-hover:scale-110">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">{item.label}</span>
                          <span className={`block text-xs font-bold truncate ${item.accent ? 'text-indigo-700' : 'text-slate-800'}`}>
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
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    Skill Priorities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {selectedAssessment.jd_analysis.skills.map((skillItem, index) => (
                      <div key={index} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group cursor-default">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-700 transition-colors">{skillItem.skill}</span>
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 transition-transform group-hover:scale-105">
                            {skillItem.priority_score}/10
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3 line-clamp-2">
                          {skillItem.reasoning}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 group-hover:opacity-90"
                              style={{ width: `${skillItem.priority_score * 10}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-1.5 py-0.5 rounded-full shrink-0 group-hover:scale-105 transition-transform">
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
                    <Sliders className="h-3.5 w-3.5 text-amber-500" />
                    Time Allocation
                    <span className="ml-auto normal-case tracking-normal text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
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
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-amber-200 hover:shadow-md transition-all">
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
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded shadow-sm shrink-0">
                                    {section.allocated_mins} min
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
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
          <div className="ibot-modal max-w-3xl max-h-[90vh]">
            <div className="flex min-h-0 flex-1 flex-col animate-scaleIn">
            <div className="h-1.5 shrink-0 bg-gradient-to-r from-brand-charcoal via-brand-accent to-brand-hover" />
            <div className="flex shrink-0 items-start justify-between border-b border-default bg-gradient-to-r from-brand-soft via-white to-[#FCFAF6] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-charcoal text-white shadow-md shadow-black/15">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                <h2 className="font-display text-[16px] font-black text-slate-950">
                  Create Assessment
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Configure the campaign, interview window, and source JD</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ibot-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-gradient-to-br from-white via-slate-50/40 to-brand-soft/20 px-6 py-5">
              {/* Error */}
              {createError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-slideDown">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCreateAssessment} className="flex flex-col gap-4" id="create-campaign-form">
                <section className="rounded-2xl border border-default bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-hover"><Briefcase className="h-3.5 w-3.5" /></span>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-brand-hover">Campaign basics</h3>
                      <p className="text-[8px] font-semibold text-slate-400">Name the assessment and role being hired.</p>
                    </div>
                  </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                </section>

                <section className="rounded-2xl border border-default bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-hover"><CalendarDays className="h-3.5 w-3.5" /></span>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-brand-hover">Interview window</h3>
                      <p className="text-[8px] font-semibold text-slate-400">Set interview length and availability dates.</p>
                    </div>
                  </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                </section>

                {/* Focus Area overrides */}
                <section className="flex flex-col gap-2 rounded-2xl border border-default bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-hover"><Sliders className="h-3.5 w-3.5" /></span>
                    <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-brand-hover">Focus areas <span className="font-semibold normal-case text-slate-400">(optional)</span></h3>
                    <p className="text-[8px] font-semibold text-slate-400">Emphasize skills the generated interview should prioritize.</p>
                    </div>
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
                        className="w-16 accent-[#B9833F]"
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
                        <span key={index} className="inline-flex cursor-default items-center gap-1 rounded-md border border-[#D8C9B5] bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-hover transition-transform hover:scale-105">
                          {fa.skill} ({fa.weight})
                          <button type="button" onClick={() => removeFocusArea(index)} className="text-brand-accent hover:text-brand-charcoal">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* JD Type */}
                <section className="rounded-2xl border border-default bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-hover"><FileCheck2 className="h-3.5 w-3.5" /></span>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-brand-hover">Job description</h3>
                      <p className="text-[8px] font-semibold text-slate-400">Paste the role brief or upload its PDF.</p>
                    </div>
                  </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 max-w-xs self-start">
                    <button
                      type="button" onClick={() => setCreateJdType('text')}
                      className={`px-3 py-1.5 text-[11px] font-bold transition-all hover:bg-slate-100/50 ${
                        createJdType === 'text' ? 'bg-brand-charcoal text-white hover:bg-brand-hover' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button" onClick={() => setCreateJdType('file')}
                      className={`px-3 py-1.5 text-[11px] font-bold transition-all hover:bg-slate-100/50 ${
                        createJdType === 'file' ? 'bg-brand-charcoal text-white hover:bg-brand-hover' : 'text-slate-500 hover:text-slate-700'
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
                  <div className="relative flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition-all duration-300 hover:border-brand-accent hover:bg-brand-soft/30">
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
                </section>
              </form>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.04)]">
              <p className="text-[9px] font-semibold text-slate-400">AI analysis starts immediately after launch.</p>
              <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-campaign-form"
                disabled={createMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-brand-charcoal px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover active:translate-y-0 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Launch Assessment
                  </>
                )}
              </button>
              </div>
            </div>
            
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ JD Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showJdModal && selectedAssessment && (
        <div className="ibot-overlay">
          <div className="ibot-modal max-w-3xl max-h-[88vh] animate-scaleIn">
            <div className="h-1.5 shrink-0 bg-gradient-to-r from-brand-charcoal via-brand-accent to-brand-hover" />
            <div className="flex shrink-0 items-center justify-between border-b border-default bg-gradient-to-r from-brand-soft via-white to-[#FCFAF6] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-charcoal text-white shadow-md shadow-black/15">
                  <FileCheck2 className="h-4 w-4" />
                </span>
                <div>
                <h2 className="font-display text-[16px] font-black text-slate-950">
                  Job Description
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">{selectedAssessment.title} · {selectedAssessment.role_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowJdModal(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto bg-gradient-to-br from-white to-brand-soft/30 p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs font-medium leading-6 text-slate-700 whitespace-pre-wrap shadow-sm">
                {selectedAssessment.jd_text || 'No job description text is available.'}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/80 p-4 shrink-0 flex justify-end">
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
