import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Terminal, Lock, Key, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AdminDashboard } from './admin/AdminDashboard';

interface InternalAdminPageProps {
  onNavigate: (route: string) => void;
}

export const InternalAdminPage: React.FC<InternalAdminPageProps> = ({ onNavigate }) => {
  const { user, unlockDeveloperAccess } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    const res = await unlockDeveloperAccess(passcode);
    setLoading(false);
    if (!res.success) {
      setAuthError(res.error || 'Access denied. Invalid developer credentials.');
    }
  };

  const isAuthorized = user?.role === 'DEVELOPER';

  if (isAuthorized) {
    return <AdminDashboard onNavigate={onNavigate} />;
  }

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-mono">
      {/* Background illumination */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#D7FF43]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md mx-auto space-y-8 relative z-10">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#171A1C] border border-white/10 rounded-lg text-[#D7FF43]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#D7FF43] tracking-widest uppercase block">
                INTERNAL CONSOLE · ROUTE /internal/admin
              </span>
              <span className="text-xs text-[#999D9B]">
                Restricted Operations & Compliance Admin
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/')}
            className="px-3 py-1.5 text-xs text-[#999D9B] hover:text-[#F5F5F2] border border-white/10 rounded-lg"
          >
            Exit
          </button>
        </div>

        {/* Authorization Prompt */}
        <div className="p-8 rounded-2xl bg-[#171A1C] border border-white/10 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#D7FF43]" />
            <h2 className="text-sm font-bold text-[#F5F5F2] uppercase tracking-wider">
              Super-Admin Credential Gateway
            </h2>
          </div>

          <p className="text-xs text-[#999D9B] leading-relaxed">
            This route is protected and hidden from public navigation. Enter the Meridian developer authorization credential to access corporate KYB verification, compliance screening controls, and audit logs.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#999D9B] mb-1.5">
                Internal Developer Passcode
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#999D9B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter meridian-dev-2026"
                  className="w-full bg-[#111315] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#F5F5F2] placeholder-[#999D9B]/40 focus:outline-none focus:border-[#D7FF43]"
                />
              </div>
              <div className="mt-2 text-[11px] text-[#999D9B]/80 flex items-center justify-between">
                <span>Demo credential:</span>
                <button
                  type="button"
                  onClick={() => setPasscode('meridian-dev-2026')}
                  className="text-[#D7FF43] hover:underline font-mono"
                >
                  meridian-dev-2026
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Unlock Super-Admin Session'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
