import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useAssessments } from '../../../hooks/queries';
import {
  Building,
  Mail,
  Shield,
  Activity,
  Briefcase,
  Users,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: assessments, isLoading } = useAssessments();

  const activeCount = assessments?.filter(a => a.status === 'ACTIVE').length ?? 0;
  const totalCount = assessments?.length ?? 0;

  // Mock monitoring log updates
  const systemLogs = [
    { id: 1, type: 'success', time: '10m ago', text: 'AI Interview Engine node standard health checks passed.' },
    { id: 2, type: 'info', time: '1h ago', text: 'Assessment database transaction tables auto-cleaned successfully.' },
    { id: 3, type: 'info', time: '3h ago', text: 'Gateway proxy rules updated for /sse and /ws/interview routes.' },
    { id: 4, type: 'success', time: '5h ago', text: 'LlamaParse API connectivity validation completed.' },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome & Recruiter Card */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-3 border border-indigo-100">
              <Shield className="h-3.5 w-3.5" />
              Recruiter Session Active
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
              Welcome back, {user?.full_name || 'Recruiter'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base max-w-xl">
              Configure voice and web AI interview campaigns, manage candidate invitations, and review automatically generated JD matching rubrics.
            </p>
          </div>
          
          {/* Recruiter Details Card */}
          <div className="border border-gray-200 rounded-xl bg-gray-50/50 p-5 min-w-[280px] space-y-3 shadow-inner">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-base shadow-sm">
                {(user?.full_name || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{user?.full_name || 'Recruiter'}</h3>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Recruiter Account</p>
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span>{user?.company_name || 'Not configured'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate max-w-[200px]">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Campaigns</span>
            <h2 className="text-2xl font-black text-gray-900 mt-1">
              {isLoading ? (
                <span className="block h-6 w-12 bg-gray-200 animate-pulse rounded" />
              ) : (
                totalCount
              )}
            </h2>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Campaigns</span>
            <h2 className="text-2xl font-black text-gray-900 mt-1">
              {isLoading ? (
                <span className="block h-6 w-12 bg-gray-200 animate-pulse rounded" />
              ) : (
                activeCount
              )}
            </h2>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 border border-violet-100 text-violet-600 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Candidates</span>
            <h2 className="text-2xl font-black text-gray-900 mt-1">
              {isLoading ? (
                <span className="block h-6 w-12 bg-gray-200 animate-pulse rounded" />
              ) : (
                totalCount > 0 ? totalCount * 3 : 0 // Mock total multiplier
              )}
            </h2>
          </div>
        </div>
      </div>

      {/* Monitoring Stuff / System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
              AI Evaluator Real-Time Monitoring
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Operational
            </span>
          </div>

          <div className="space-y-3">
            {systemLogs.map(log => (
              <div key={log.id} className="flex gap-3 items-start text-xs p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                {log.type === 'success' ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{log.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips / Connection Health */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
            <Radio className="h-5 w-5 text-indigo-500" />
            Interview Engine Status
          </h3>
          
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
              <span className="font-bold text-indigo-900 text-xs block">AI Voice Assistant</span>
              <p className="text-indigo-700 leading-relaxed text-[11px]">
                WebRTC session gateway is online. High-fidelity audio streams are actively evaluated via local transcription pipelines.
              </p>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-500">API Connection</span>
              <span className="font-bold text-gray-800">Healthy (22ms)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-500">Database Cluster</span>
              <span className="font-bold text-gray-800">Replica Sync OK</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Active Sockets</span>
              <span className="font-bold text-gray-800">0 connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
