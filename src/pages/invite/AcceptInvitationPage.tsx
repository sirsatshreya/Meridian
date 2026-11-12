import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SellerInvitation, TradeRequest } from '../../types';
import {
  ShieldCheck,
  Building2,
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Lock,
  AlertTriangle,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Agreement1SigningModal } from '../legal/Agreement1SigningModal';

interface AcceptInvitationPageProps {
  token?: string;
  onNavigate: (route: string) => void;
}

export const AcceptInvitationPage: React.FC<AcceptInvitationPageProps> = ({ token: propToken, onNavigate }) => {
  const { user, organization, login, refreshProfile } = useAuth();

  // Extract token from prop, query parameter or path
  const [token, setToken] = useState<string>(() => {
    if (propToken) return propToken;
    const urlParams = new URLSearchParams(window.location.search);
    const qToken = urlParams.get('token');
    if (qToken) return qToken;
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart && lastPart !== 'invite' ? lastPart : 'inv-demo-trade-token-001';
  });

  const [invitation, setInvitation] = useState<SellerInvitation | null>(null);
  const [tradeRequest, setTradeRequest] = useState<TradeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals & Action States
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesNotes, setChangesNotes] = useState('');

  const loadInvitation = async () => {
    if (!token) {
      setError('No invitation token provided in request.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.invitations.resolveToken(token);
      setInvitation(res.invitation);
      if (res.tradeRequest) {
        setTradeRequest(res.tradeRequest);
      }
    } catch (err: any) {
      // If default demo token wasn't found by specific string, try fallback canonical demo tokens
      if (token !== 'inv-demo-001') {
        try {
          const fallbackRes = await api.invitations.resolveToken('inv-demo-001');
          setInvitation(fallbackRes.invitation);
          if (fallbackRes.tradeRequest) setTradeRequest(fallbackRes.tradeRequest);
          return;
        } catch {
          // Fall through to error
        }
      }
      setError(err.message || 'Invitation token is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const handleQuickDemoLogin = async (andAccept: boolean = false) => {
    try {
      setActionLoading(true);
      await login('seller.demo@meridian.test', 'Password@123', 'SELLER');
      await refreshProfile();
      await loadInvitation();
      if (andAccept) {
        await executeAccept(invitation?.id || 'inv-demo-001');
      }
    } catch (err: any) {
      setError('Failed to log in as demo seller: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const executeAccept = async (targetInvId?: string) => {
    const invId = targetInvId || invitation?.id;
    if (!invId) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await api.invitations.respond({
        invitationId: invId,
        action: 'ACCEPT',
      });
      if (res.success) {
        setSuccessMsg('Trade invitation accepted! Bilateral coordination channel established. Redirecting to company onboarding & KYB verification...');
        if (invitation) {
          setInvitation({ ...invitation, status: 'ACCEPTED' });
        }
        await refreshProfile();
        setTimeout(() => {
          onNavigate('/onboarding');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;
    if (organization?.agreement1Status !== 'ACCEPTED' && !organization?.agreement1Signed) {
      setIsAgreementModalOpen(true);
      return;
    }
    await executeAccept(invitation.id);
  };

  const handleDecline = async () => {
    if (!invitation) return;
    setActionLoading(true);
    try {
      const res = await api.invitations.respond({
        invitationId: invitation.id,
        action: 'DECLINE',
        notes: declineReason || 'Declined by seller',
      });
      if (res.success) {
        setShowDeclineModal(false);
        setSuccessMsg('Invitation declined.');
        await loadInvitation();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!invitation) return;
    setActionLoading(true);
    try {
      const res = await api.invitations.respond({
        invitationId: invitation.id,
        action: 'CHANGES_REQUESTED',
        notes: changesNotes || 'Modifications requested by seller',
      });
      if (res.success) {
        setShowChangesModal(false);
        setSuccessMsg('Counter-terms & revision request dispatched to buyer.');
        await loadInvitation();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request changes.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background illumination */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#D7FF43]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
                MERIDIAN SECURE INVITATION DISPATCH
              </span>
              <span className="text-white/20">/</span>
              <span className="text-xs text-[#999D9B] font-mono">TOKEN: {token}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F2] tracking-tight">
              B2B Trade Invitation & Bilateral Coordination
            </h1>
          </div>

          <button
            onClick={() => onNavigate('/')}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs text-[#999D9B] hover:text-[#F5F5F2] bg-[#171A1C] border border-white/10 rounded-lg transition-colors"
          >
            Return to Public Site
          </button>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="p-3.5 rounded-xl bg-[#111315] border border-white/10 text-xs text-[#999D9B] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D7FF43] shrink-0" />
            <span>
              Meridian is a cloud SaaS orchestration platform. Meridian coordinates workflows and external partners; it does not operate as a bank, money transmitter, or licensed escrow provider.
            </span>
          </div>
          <button
            onClick={() => onNavigate('/legal-documents')}
            className="text-[11px] text-[#D7FF43] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Legal Docs</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="p-12 text-center bg-[#171A1C] border border-white/10 rounded-2xl">
            <div className="w-8 h-8 border-2 border-[#D7FF43] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-[#999D9B]">Resolving cryptographic invitation token...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-6 bg-red-950/40 border border-red-500/30 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-300 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Invitation Error</span>
            </div>
            <p className="text-xs text-red-200">{error}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={loadInvitation}
                className="px-4 py-2 bg-[#171A1C] border border-white/10 hover:border-white/20 text-xs rounded-xl"
              >
                Retry
              </button>
              <button
                onClick={() => setToken('INV-SELLER-DEMO-001')}
                className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl"
              >
                Load Default Demo Invite
              </button>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-emerald-200">{successMsg}</div>
                <div className="text-[11px] text-emerald-400/80 mt-0.5">Redirecting to Company Onboarding & KYB verification...</div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/onboarding')}
              className="px-4 py-2 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-lg"
            >
              <span>Proceed to Onboarding & KYB Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {invitation && !loading && (
          <div className="space-y-6">
            {/* Invitation Status Card */}
            <div className="p-6 sm:p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-[#999D9B] uppercase tracking-wider">
                    INVITATION REFERENCE
                  </div>
                  <div className="text-lg font-bold text-[#F5F5F2] font-mono flex items-center gap-2">
                    <span>{invitation.id}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                        invitation.status === 'ACCEPTED'
                          ? 'bg-emerald-500/10 text-[#D7FF43] border border-emerald-500/30'
                          : invitation.status === 'DECLINED'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : invitation.status === 'CHANGES_REQUESTED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {invitation.status}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <div className="text-[11px] font-mono text-[#999D9B] uppercase">DISPATCH DATE</div>
                  <div className="text-xs text-[#F5F5F2] font-mono">
                    {new Date(invitation.sentAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Counterparty Connection Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inviting Buyer Card */}
                <div className="p-4 bg-[#111315] border border-white/5 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D7FF43] uppercase">
                    <Building2 className="w-4 h-4" />
                    <span>Inviting Buyer Enterprise</span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#F5F5F2]">
                      {tradeRequest?.buyerCompanyName || 'MERIDIAN DEMO BUYER PRIVATE LIMITED'}
                    </div>
                    <div className="text-xs text-[#999D9B] mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-white/5 rounded font-mono text-[10px]">BUYER-001</span>
                      <span>Country: India (IN)</span>
                      <span className="text-emerald-400">· KYB Verified</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#999D9B] leading-relaxed">
                    This corporate buyer has initiated a trade workflow and requests your participation as their preferred international vendor.
                  </p>
                </div>

                {/* Target Seller Card */}
                <div className="p-4 bg-[#111315] border border-white/5 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#999D9B] uppercase">
                    <Building2 className="w-4 h-4" />
                    <span>Target Invited Vendor</span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#F5F5F2]">
                      {invitation.recipientCompanyName}
                    </div>
                    <div className="text-xs text-[#999D9B] mt-1 flex items-center gap-2">
                      <span className="font-mono text-white/80">{invitation.recipientEmail}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#999D9B] leading-relaxed">
                    Access is restricted to authorized representatives of {invitation.recipientCompanyName}.
                  </p>
                </div>
              </div>

              {/* Trade Request Specifications */}
              {tradeRequest && (
                <div className="p-5 bg-[#111315] border border-white/5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#F5F5F2] uppercase tracking-wider">
                      <Package className="w-4 h-4 text-[#D7FF43]" />
                      <span>Order & Commodity Specifications (Ref: {tradeRequest.id})</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#999D9B]">
                      {tradeRequest.tradeType || 'Cross-Border Supply Chain'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[#999D9B] block text-[10px] font-mono uppercase">Commodity / Item</span>
                      <span className="text-[#F5F5F2] font-semibold">{tradeRequest.productDescription || tradeRequest.commodity}</span>
                    </div>
                    <div>
                      <span className="text-[#999D9B] block text-[10px] font-mono uppercase">Quantity</span>
                      <span className="text-[#F5F5F2] font-semibold">
                        {tradeRequest.quantity.toLocaleString()} {tradeRequest.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#999D9B] block text-[10px] font-mono uppercase">Target Price</span>
                      <span className="text-[#D7FF43] font-bold font-mono">
                        {tradeRequest.currency} {(tradeRequest.proposedPrice || tradeRequest.targetPrice || 0).toLocaleString()} ({tradeRequest.currency} {((tradeRequest.proposedPrice || 0) / (tradeRequest.quantity || 1)).toFixed(2)}/{tradeRequest.unit})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#999D9B] block text-[10px] font-mono uppercase">Incoterms</span>
                      <span className="text-[#F5F5F2] font-semibold">{tradeRequest.incoterms || 'CIF'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#999D9B] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#999D9B] text-[10px] uppercase font-mono block">Delivery Destination</span>
                        <span className="text-[#F5F5F2]">{tradeRequest.deliveryLocation || tradeRequest.destinationPortAddress}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-[#999D9B] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#999D9B] text-[10px] uppercase font-mono block">Expected Delivery Window</span>
                        <span className="text-[#F5F5F2]">{tradeRequest.proposedDeliveryDate || tradeRequest.deliveryWindow}</span>
                      </div>
                    </div>
                  </div>

                  {tradeRequest.specifications && (
                    <div className="p-3 bg-[#08090A] rounded-lg border border-white/5 text-xs text-[#999D9B]">
                      <span className="text-white font-mono text-[10px] block mb-1 uppercase">Technical Specifications:</span>
                      {tradeRequest.specifications}
                    </div>
                  )}

                  {(tradeRequest.milestoneNotes || tradeRequest.qualityRequirements) && (
                    <div className="p-3 bg-[#08090A] rounded-lg border border-white/5 text-xs text-[#999D9B]">
                      <span className="text-white font-mono text-[10px] block mb-1 uppercase">Milestone & Settlement Structure:</span>
                      {tradeRequest.milestoneNotes || tradeRequest.qualityRequirements}
                    </div>
                  )}
                </div>
              )}

              {/* User Authentication & Action Section */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                {!user ? (
                  <div className="p-6 bg-[#111315] rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                      <Lock className="w-4 h-4" />
                      <span>Authentication Required to Coordinate Trade Terms</span>
                    </div>
                    <p className="text-xs text-[#999D9B] leading-relaxed">
                      To accept this trade request, generate digital agreements, and link your enterprise supplier profile, please sign in or register with your corporate credentials.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={() => handleQuickDemoLogin(true)}
                        disabled={actionLoading}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        {actionLoading ? (
                          <div className="w-4 h-4 border-2 border-[#08090A] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span>1-Click Accept as Demo Seller ({invitation.recipientCompanyName})</span>
                      </button>
                      <button
                        onClick={() => handleQuickDemoLogin(false)}
                        disabled={actionLoading}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#171A1C] hover:bg-[#202428] border border-white/10 text-xs rounded-xl transition-colors"
                      >
                        Sign In Only
                      </button>
                      <button
                        onClick={() => onNavigate('/login/seller')}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-xs rounded-xl transition-colors"
                      >
                        Standard Seller Sign In
                      </button>
                      <button
                        onClick={() => onNavigate('/signup/seller')}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-xs text-[#999D9B] rounded-xl transition-colors"
                      >
                        Register New Enterprise
                      </button>
                    </div>
                  </div>
                ) : user.role !== 'SELLER' && user.role !== 'DEVELOPER' ? (
                  <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-amber-300">Logged in as {user.role} ({user.email})</div>
                    <p className="text-xs text-[#999D9B]">
                      This invitation is intended for the Seller enterprise ({invitation.recipientCompanyName}). Please switch accounts to respond.
                    </p>
                    <button
                      onClick={() => handleQuickDemoLogin(false)}
                      className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-lg"
                    >
                      Switch to Demo Seller Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Signed-in Seller Controls */}
                    <div className="p-4 bg-[#111315] rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-[#999D9B]">Authenticated as:</div>
                        <div className="text-sm font-bold text-[#F5F5F2]">{user.name} ({organization?.legalName || user.email})</div>
                        <div className="text-xs font-mono text-[#D7FF43] mt-0.5">
                          {organization?.agreement1Status === 'ACCEPTED' || organization?.agreement1Signed ? 'Agreement 1 Active & Signed' : 'Agreement 1 Pending'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {organization?.agreement1Status !== 'ACCEPTED' && !organization?.agreement1Signed && (
                          <button
                            onClick={() => setIsAgreementModalOpen(true)}
                            className="px-4 py-2 bg-[#171A1C] border border-[#D7FF43]/40 hover:border-[#D7FF43] text-[#D7FF43] font-semibold text-xs rounded-xl flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Sign Agreement 1</span>
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('/seller/home')}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-xs rounded-xl text-[#999D9B] hover:text-white"
                        >
                          Open Seller Desk
                        </button>
                      </div>
                    </div>

                    {/* Action buttons if status is PENDING or CHANGES_REQUESTED */}
                    {(invitation.status === 'PENDING' || invitation.status === 'CHANGES_REQUESTED') && (
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                          onClick={handleAccept}
                          disabled={actionLoading}
                          className="w-full sm:flex-1 py-3.5 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-50 text-[#08090A] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                        >
                          {actionLoading ? (
                            <div className="w-4 h-4 border-2 border-[#08090A] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>{actionLoading ? 'Connecting Bilateral Workflow...' : 'Accept Trade Terms & Establish Bilateral Channel'}</span>
                        </button>

                        <button
                          onClick={() => setShowChangesModal(true)}
                          disabled={actionLoading}
                          className="w-full sm:w-auto px-5 py-3 bg-[#111315] hover:bg-white/5 border border-white/10 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-amber-300"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>Propose Adjustments</span>
                        </button>

                        <button
                          onClick={() => setShowDeclineModal(true)}
                          disabled={actionLoading}
                          className="w-full sm:w-auto px-5 py-3 bg-[#111315] hover:bg-red-950/20 border border-red-500/20 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-red-400"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}

                    {invitation.status === 'ACCEPTED' && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-[#D7FF43]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>This trade invitation has been accepted and bilateral connection is established.</span>
                        </div>
                        <button
                          onClick={() => onNavigate('/onboarding')}
                          className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-lg flex items-center gap-1.5"
                        >
                          <span>Proceed to Onboarding</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {invitation.status === 'DECLINED' && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                        This invitation was declined.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#171A1C] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F2]">Decline Trade Invitation</h3>
            <p className="text-xs text-[#999D9B]">
              Please state why your enterprise is unable to fulfill this request. The buyer will be notified.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g., Production capacity fully booked for requested window; product grade not supported..."
              className="w-full h-24 bg-[#111315] border border-white/10 rounded-xl p-3 text-xs text-[#F5F5F2] focus:outline-none focus:border-red-400"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#171A1C] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F2]">Propose Term Modifications</h3>
            <p className="text-xs text-[#999D9B]">
              Specify counter-terms, price adjustments, or alternate delivery timelines for the buyer to review.
            </p>
            <textarea
              value={changesNotes}
              onChange={(e) => setChangesNotes(e.target.value)}
              placeholder="e.g., Minimum batch 6,000 rolls required; CIF Hamburg unit price EUR 19.50; delivery earliest March 25, 2026..."
              className="w-full h-28 bg-[#111315] border border-white/10 rounded-xl p-3 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowChangesModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl"
              >
                Transmit Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agreement 1 Signing Modal */}
      <Agreement1SigningModal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        onSigned={async () => {
          setIsAgreementModalOpen(false);
          await refreshProfile();
          await executeAccept();
        }}
      />
    </div>
  );
};
