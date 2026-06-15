import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  LogOut,
  Building,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/assessments', label: 'Assessments', icon: Briefcase },
    { to: '/candidates', label: 'Candidates', icon: Users },
  ];

  const initials = (user?.full_name || 'R')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans" style={{ background: '#f6f7fb' }}>

      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col justify-between border-r border-gray-200/80 shadow-sm"
        style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' }}
      >
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <span className="text-base font-extrabold text-white tracking-tight">iBot</span>
                <span className="ml-1.5 text-[10px] font-semibold text-indigo-300 border border-indigo-400/40 rounded px-1.5 py-0.5 bg-indigo-500/15">Recruiter</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1 mt-2">
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400/60">Menu</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-indigo-200/70 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${isActive ? 'bg-white/20 text-white' : 'text-indigo-300/70 group-hover:text-white'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-300 animate-pulse" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-extrabold shadow-sm"
              style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Recruiter'}</p>
              <p className="text-[10px] text-indigo-300/70 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            id="btn-logout"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-indigo-200 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 border-b border-gray-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-400">Organization:</span>
            <span className="font-bold text-gray-800">{user?.company_name || 'iBot Partner'}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
