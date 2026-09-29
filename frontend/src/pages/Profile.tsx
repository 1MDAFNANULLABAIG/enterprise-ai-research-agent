import React from 'react';
import { User as UserIcon, Shield, Key, Calendar, Mail, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight">User Identity & Access Management</h2>
        <p className="text-xs text-slate-400">
          Tenant account credentials, role authorization levels, and active security session parameters.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-enterprise-600 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-enterprise-500/20">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.full_name || 'Enterprise User'}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-enterprise-500/10 text-enterprise-400 border border-enterprise-500/20">
                Role: {user?.role || 'user'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Account Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Identity Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-enterprise-400" />
              <span>Tenant ID / UUID</span>
            </span>
            <span className="font-mono text-slate-200">{user?.id || '—'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Registered On</span>
            </span>
            <span className="font-mono text-slate-200">
              {user?.created_at ? new Date(user.created_at).toLocaleString() : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cryptographic Storage</span>
            </span>
            <span className="font-mono text-slate-200">Bcrypt Salted & Hashed (Cost Factor 12)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Session Authorization</span>
            </span>
            <span className="font-mono text-slate-200">HMAC-SHA256 Signed JWT Bearer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
