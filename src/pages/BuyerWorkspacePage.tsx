import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2, Lock, LogOut, Clock, Layers } from 'lucide-react';
import { MeridianLogo } from '../components/common/MeridianLogo';

interface BuyerWorkspacePageProps {
  onNavigate: (route: string) => void;
}

export const BuyerWorkspacePage: React.FC<BuyerWorkspacePageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  // Route security check
  if (!user) {
    return (
      <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-32 px-4 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl max-w-md space-y-4">
          <h2 className="text-lg font-bold text-red-200">Authentication Required</h2>
          <p className="text-xs text-[#999D9B]">
            You must be logged in as an authorized Buyer to access this procurement workspace.
          </p>
          <button
            onClick={() => onNavigate('/login/buyer')}
            className="w-full py-2.5 bg-[#D7FF43] text-[#08090A] font-semibold text-xs rounded-xl"
          >
            Go to Buyer Sign In
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'BUYER' && user.role !== 'DEVELOPER') {
    return (
      <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-32 px-4 flex flex-col items-center justify-center text-center">
        <div className="p-6 bg-[#171A1C] border border-amber-500/30 rounded-2xl max-w-md space-y-4">
          <div className="flex items-center justify-center text-amber-400 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-amber-200">Role Boundary Enforced</h2>
          <p className="text-xs text-[#999D9B] leading-relaxed">
            Your authenticated account is registered as a <span className="font-mono text-white">{user.role}</span>. You do not have permissions to access the Buyer procurement desk.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate(user.role === 'SELLER' ? '/seller/home' : '/internal/admin')}
              className="flex-1 py-2.5 bg-[#D7FF43] text-[#08090A] font-semibold text-xs rounded-xl"
            >
              Go to Your {user.role} Portal
            </button>
            <button
              onClick={logout}
              className="py-2.5 px-4 bg-[#111315] hover:bg-white/5 border border-white/10 text-xs rounded-xl"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#D7FF43]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Top bar within workspace */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#171A1C] border border-[#D7FF43]/30 rounded-xl text-[#D7FF43]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
                  BUYER DESK · ACTIVE SESSION
                </span>
                <span className="text-white/20">/</span>
                <span className="text-xs text-[#999D9B] font-mono">PHASE 1</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
                Welcome, {user.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="px-3.5 py-1.5 text-xs text-[#999D9B] hover:text-[#F5F5F2] bg-[#171A1C] border border-white/10 rounded-lg transition-colors"
            >
              Public Site
            </button>
            <button
              onClick={() => {
                logout();
                onNavigate('/auth');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#08090A] bg-[#D7FF43] hover:bg-[#cbf436] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Phase 1 Branded Welcome Screen & Phase 2 Notice */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#171A1C] border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D7FF43]">
            <span className="w-2 h-2 rounded-full bg-[#D7FF43]" />
            <span>AUTHENTICATION VALIDATED · ACCOUNT READY</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F5F2] tracking-tight">
              Buyer Procurement Workspace
            </h2>
            <p className="text-sm sm:text-base text-[#999D9B] leading-relaxed max-w-2xl">
              Your Meridian corporate purchasing profile is verified and active for <span className="text-white font-medium">{user.email}</span>. Complete business setup and supplier KYB onboarding will unlock in Phase 2.
            </p>
          </div>

          {/* Planned Phase 2 Modules Preview */}
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-4">
              Upcoming Phase 2 Implementation Modules:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#111315] border border-white/5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F2]">
                  <Clock className="w-4 h-4 text-[#D7FF43]" />
                  <span>Company KYB & Verification</span>
                </div>
                <p className="text-xs text-[#999D9B] leading-relaxed">
                  Upload corporate certificates, tax numbers, and signatory resolutions.
                </p>
              </div>

              <div className="p-4 bg-[#111315] border border-white/5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F2]">
                  <Layers className="w-4 h-4 text-[#D7FF43]" />
                  <span>Supplier Channel Pairing</span>
                </div>
                <p className="text-xs text-[#999D9B] leading-relaxed">
                  Generate secure invitation tokens for your existing international suppliers.
                </p>
              </div>

              <div className="p-4 bg-[#111315] border border-white/5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F2]">
                  <ShieldCheck className="w-4 h-4 text-[#D7FF43]" />
                  <span>Trade Agreement Desk</span>
                </div>
                <p className="text-xs text-[#999D9B] leading-relaxed">
                  Structure digital purchase orders, Incoterms, and milestone escrow locks.
                </p>
              </div>
            </div>
          </div>

          {/* Account Detail Card */}
          <div className="p-4 bg-[#111315]/80 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#999D9B]">
            <div>
              <span className="text-white/40">USER ID: </span>
              <span className="text-white">{user.id}</span>
            </div>
            <div>
              <span className="text-white/40">ROLE: </span>
              <span className="text-[#D7FF43] font-semibold">{user.role}</span>
            </div>
            <div>
              <span className="text-white/40">SESSION STATUS: </span>
              <span className="text-white">ACTIVE (DEMO ENCRYPTED)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
