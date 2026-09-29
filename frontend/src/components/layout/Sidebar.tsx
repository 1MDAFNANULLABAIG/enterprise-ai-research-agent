import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  MessageSquare,
  Sparkles,
  Settings,
  User,
  ShieldCheck,
  LogOut,
  BrainCircuit,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents', path: '/documents', icon: Files },
    { label: 'AI Chat', path: '/chat', icon: MessageSquare },
    { label: 'Research Mode', path: '/research', icon: Sparkles },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin & Benchmarks', path: '/admin', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-enterprise-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-enterprise-500/20 text-white">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            Enterprise AI
            <span className="text-[10px] bg-enterprise-500/20 text-enterprise-400 px-1.5 py-0.5 rounded font-mono font-normal">v1.0</span>
          </h1>
          <p className="text-xs text-slate-400 truncate">Research & Doc Agent</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-enterprise-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* RAG Engine Status Banner */}
      <div className="p-3 mx-3 mb-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Vector Engine
          </span>
          <span className="text-[10px] font-mono text-enterprise-400">ACTIVE</span>
        </div>
        <p className="text-[11px] text-slate-400">Multi-tenant hybrid retrieval with BM25 reranking.</p>
      </div>

      {/* User Profile Card & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-xs text-enterprise-400 shrink-0">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate capitalize">{user?.role || 'user'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
