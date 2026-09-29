import React from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, Sparkles, Activity, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Enterprise Intelligence Dashboard';
    if (path.startsWith('/documents')) return 'Document Repository & Vector Ingestion';
    if (path.startsWith('/chat')) return 'Enterprise AI Assistant (Grounded RAG)';
    if (path.startsWith('/research')) return 'Autonomous Research Agent';
    if (path.startsWith('/settings')) return 'Model & Vector Store Configuration';
    if (path.startsWith('/profile')) return 'User Profile & Identity';
    if (path.startsWith('/admin')) return 'Admin Governance & RAG Evaluation Suite';
    return 'Enterprise AI Workspace';
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">
          {getPageTitle(location.pathname)}
        </h2>
        <p className="text-xs text-slate-400">
          Tenant Isolation • Grounded Citations • Multi-Step Agents
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>RAG Pipeline: <strong className="text-emerald-400 font-medium">Ready</strong></span>
        </div>

        {/* Security badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-enterprise-950/40 border border-enterprise-500/30 text-enterprise-300 px-3 py-1.5 rounded-full text-xs">
          <Shield className="w-3.5 h-3.5 text-enterprise-400" />
          <span className="font-mono text-[11px]">JWT / Zero-Trust</span>
        </div>
      </div>
    </header>
  );
};
