import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCircle2, ClipboardCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRecruiterNotifications } from '../../hooks/queries';
import { useAuth } from '../../hooks/useAuth';

const formatNotificationTime = (value: string) => {
  const date = new Date(value);
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useRecruiterNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const seenStorageKey = `ibot:notifications-seen:${user?.id ?? 'recruiter'}`;
  const [seenThrough, setSeenThrough] = useState(() =>
    Number(localStorage.getItem(seenStorageKey) ?? 0),
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => new Date(notification.sent_at).getTime() > seenThrough,
      ).length,
    [notifications, seenThrough],
  );

  const toggleNotifications = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      const latestTime = notifications.reduce(
        (latest, item) => Math.max(latest, new Date(item.sent_at).getTime()),
        Date.now(),
      );
      localStorage.setItem(seenStorageKey, String(latestTime));
      setSeenThrough(latestTime);
    }
  };

  const openReport = (candidateAssessmentId: string) => {
    setIsOpen(false);
    navigate(`/candidates/${candidateAssessmentId}/report`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleNotifications}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-default bg-white text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-soft hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[48px] z-[60] w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-default bg-white shadow-[0_28px_70px_-28px_rgba(36,33,29,0.34)]">
          <div className="h-[3px] bg-brand-accent" />
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <p className="text-sm font-black text-slate-950">Notifications</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                Completed interview evaluations
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-black text-slate-800">You are all caught up</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  New evaluation reports will appear here automatically.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openReport(notification.candidate_assessment_id)}
                  className="flex w-full gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-brand-soft/65"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-hover ring-1 ring-inset ring-default">
                    <ClipboardCheck className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-slate-900">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium leading-relaxed text-slate-600">
                      {notification.message}
                    </span>
                    <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wide text-brand-hover">
                      {formatNotificationTime(notification.sent_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
