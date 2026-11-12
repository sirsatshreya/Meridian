import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  TradeRequest,
  SellerInvitation,
  BuyerSellerConnection,
  ComplianceScreening,
  AuditEvent,
} from '../../types';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  FileText,
  Layers,
  Inbox,
  Users,
  Sparkles,
  History,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  Mail,
  ExternalLink,
  Lock,
  Camera,
  FileCheck2,
  Award,
  Sliders,
  Download,
  Send,
} from 'lucide-react';
import { EmailOutboxModal } from '../../components/dashboard/EmailOutboxModal';
import { NotificationsDrawer } from '../../components/dashboard/NotificationsDrawer';
import { Agreement1SigningModal } from '../legal/Agreement1SigningModal';
import { Agreement2Console } from '../../components/agreement2/Agreement2Console';
import { EvidenceGalleryTab } from '../../components/dashboard/EvidenceGalleryTab';
import { BilateralSignaturesTab } from '../../components/dashboard/BilateralSignaturesTab';
import { TradeWorkspaceConsole } from '../../components/trades/TradeWorkspaceConsole';
import { downloadAgreement1Pdf } from '../../utils/pdfGenerator';
import { LEGAL_DOCUMENTS } from '../../server/legalDocumentsData';
import { NotificationItem, AgreementAcceptance } from '../../types';

interface SellerDashboardProps {
  onNavigate: (route: string) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const { user, organization, refreshProfile, loginDemo, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedTradeForAgreement2, setSelectedTradeForAgreement2] = useState<string>('DEMO-TRADE-001');
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [connections, setConnections] = useState<BuyerSellerConnection[]>([]);

  const [screenings, setScreenings] = useState<ComplianceScreening[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [acceptanceReceipts, setAcceptanceReceipts] = useState<AgreementAcceptance[]>([]);
  const [membershipLoading, setMembershipLoading] = useState<string | null>(null);
  const [membershipMsg, setMembershipMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Demo Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Reviewing modal state
  const [reviewTrade, setReviewTrade] = useState<TradeRequest | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Utilities
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trRes, connRes, scrRes, audRes, notifRes, recRes] = await Promise.all([
        api.tradeRequests.getAll(),
        api.companies.getConnections(),
        api.compliance.getHistory(),
        api.audit.getHistory(),
        api.notifications.getAll().catch(() => ({ notifications: [] })),
        api.legal.getAcceptanceReceipts().catch(() => ({ receipts: [] })),
      ]);
      setTradeRequests(trRes.tradeRequests);
      setConnections(connRes.connections);
      setScreenings(scrRes.screenings);
      setAuditLogs(audRes.auditEvents);
      setNotifications(notifRes.notifications || []);
      setAcceptanceReceipts(recRes.receipts || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const params = new URLSearchParams(window.location.search);
    const paramTradeId = params.get('tradeId');
    if (paramTradeId) {
      setSelectedTradeForAgreement2(paramTradeId);
      setActiveTab('active-trades');
    }
  }, []);

  const handleRespondToInvitation = async (action: 'ACCEPT' | 'DECLINE' | 'CHANGES_REQUESTED') => {
    if (!reviewTrade) return;

    // Find invitation corresponding to this trade
    try {
      const invRes = await api.invitations.getMine();
      const matched = invRes.invitations.find((i) => i.tradeRequestId === reviewTrade.id) || { id: 'inv-demo-001' };

      await api.invitations.respond({
        invitationId: matched.id,
        action,
        notes: responseNotes,
      });

      setActionSuccess(`Trade Request response (${action}) submitted successfully!`);
      setTimeout(() => {
        setReviewTrade(null);
        setActionSuccess(null);
        fetchData();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleResetDemo = async () => {
    try {
      setResettingDemo(true);
      const res = await api.admin.resetDemo();
      setResetMessage(res.message);
      setShowResetModal(false);
      await fetchData();
      await refreshProfile();
      setTimeout(() => setResetMessage(null), 6000);
    } catch (err: any) {
      alert(`Demo reset failed: ${err.message}`);
    } finally {
      setResettingDemo(false);
    }
  };

  const handleSelectMembership = async (tier: 'REGULAR' | 'PRO' | 'ULTRA') => {
    try {
      setMembershipLoading(tier);
      setMembershipMsg(null);
      await api.companies.updateMembership(tier);
      await refreshProfile();
      setMembershipMsg(`Membership tier updated to ${tier} Plan.`);
      setTimeout(() => setMembershipMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update membership tier');
    } finally {
      setMembershipLoading(null);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // Ignore
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'agreements', label: 'Agreements', icon: FileText },
    { id: 'incoming', label: 'Invitations', icon: Send, count: tradeRequests.length },
    { id: 'membership', label: 'Membership', icon: Award },
    {
      id: 'active-trades',
      label: 'Active Trades',
      icon: Layers,
      sublabel: tradeRequests[0]?.productDescription
        ? `${tradeRequests[0].productDescription.substring(0, 22)}...`
        : 'Packaging Film (DEMO-TRADE-001)',
      count: tradeRequests.length || 1,
    },
    { id: 'trade-history', label: 'Trade History', icon: History },
    { id: 'documents', label: 'Documents and PDFs', icon: FileCheck2 },
    { id: 'notifications', label: 'Notifications', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-32 px-4 flex flex-col items-center justify-center text-center">
        <div className="p-8 bg-[#171A1C] border border-white/10 rounded-2xl max-w-md w-full space-y-6 shadow-2xl">
          <div className="flex items-center justify-center text-[#D7FF43]">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F5F5F2]">Seller Fulfillment Desk</h2>
            <p className="text-xs text-[#999D9B] mt-1 leading-relaxed">
              Authentication is required to access incoming buyer trade requests, negotiate terms, and maintain KYB verification.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={async () => {
                await loginDemo('SELLER');
                fetchData();
              }}
              className="w-full py-3 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Instant Demo Login (DEMO-SELLER-001)</span>
            </button>
            <button
              onClick={() => onNavigate('/login/seller')}
              className="w-full py-2.5 bg-[#111315] hover:bg-white/5 border border-white/10 text-xs rounded-xl transition-colors cursor-pointer"
            >
              Sign In with Corporate Account
            </button>
            <button
              onClick={() => onNavigate('/signup/seller')}
              className="w-full py-2 text-xs text-[#999D9B] hover:text-white cursor-pointer"
            >
              Register New Seller Enterprise
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'SELLER' && user.role !== 'DEVELOPER') {
    return (
      <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-32 px-4 flex flex-col items-center justify-center text-center">
        <div className="p-6 bg-[#171A1C] border border-amber-500/30 rounded-2xl max-w-md space-y-4">
          <div className="flex items-center justify-center text-amber-400 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-amber-200">Role Boundary Enforced</h2>
          <p className="text-xs text-[#999D9B] leading-relaxed">
            Your authenticated account is registered as a <span className="font-mono text-white">{user.role}</span>. You do not have permissions to access the Seller fulfillment desk.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate(user.role === 'BUYER' ? '/buyer/home' : '/internal/admin')}
              className="flex-1 py-2.5 bg-[#D7FF43] text-[#08090A] font-semibold text-xs rounded-xl cursor-pointer"
            >
              Go to Your {user.role} Portal
            </button>
            <button
              onClick={logout}
              className="py-2.5 px-4 bg-[#111315] hover:bg-white/5 border border-white/10 text-xs rounded-xl cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-24 pb-16 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 hidden md:flex flex-col justify-between p-4 bg-[#08090A]">
        <div className="space-y-6">
          {/* Organization badge */}
          <div className="p-3 bg-[#171A1C] border border-white/10 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D7FF43] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
              <span>SELLER DESK</span>
            </div>
            <h4 className="text-xs font-bold text-[#F5F5F2] truncate">
              {organization?.legalName || 'Seller Enterprise'}
            </h4>
            <span className="text-[10px] font-mono text-[#999D9B] block">
              {organization?.id || 'DEMO-SELLER-001'}
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#171A1C] border border-[#D7FF43]/40 text-[#F5F5F2] shadow-md'
                      : 'text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left truncate">
                    <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D7FF43]' : ''}`} />
                    <div className="truncate">
                      <span>{item.label}</span>
                      {(item as any).sublabel && (
                        <span className="text-[10px] text-[#D7FF43] block truncate font-mono">
                          {(item as any).sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#999D9B] shrink-0">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="w-full py-2 px-3 bg-[#111315] hover:bg-white/5 border border-white/10 rounded-xl text-xs text-[#999D9B] hover:text-[#F5F5F2] flex items-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-[#D7FF43]" />
            <span>Simulated Outbox</span>
          </button>
          <button
            onClick={() => onNavigate('/legal-documents')}
            className="w-full py-2 px-3 bg-[#111315] hover:bg-white/5 border border-white/10 rounded-xl text-xs text-[#999D9B] hover:text-[#F5F5F2] flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#D7FF43]" />
            <span>Legal Documents (12)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#D7FF43] uppercase mb-1">
              <span>MERIDIAN B2B TRADE ORCHESTRATION</span>
              <span className="text-white/20">/</span>
              <span>PHASE 2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F2]">
              Seller Export Workspace
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              title="Reset synthetic demo state for presentations"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>RESET DEMO FOR NEXT PRESENTATION</span>
            </button>
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="p-2.5 bg-[#171A1C] border border-white/10 text-[#999D9B] hover:text-[#F5F5F2] rounded-xl transition-colors cursor-pointer"
              title="Notifications"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={fetchData}
              className="p-2.5 bg-[#171A1C] border border-white/10 text-[#999D9B] hover:text-[#F5F5F2] rounded-xl transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {resetMessage && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs font-mono text-emerald-300 flex items-center justify-between">
            <span>✓ {resetMessage}</span>
            <button onClick={() => setResetMessage(null)} className="text-white hover:underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* SUBVIEW 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div
                onClick={() => setActiveTab('incoming')}
                className="p-6 bg-[#171A1C] border border-white/10 hover:border-[#D7FF43]/40 rounded-2xl cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-[#999D9B]">
                  <span>Incoming Trade Requests</span>
                  <Inbox className="w-5 h-5 text-[#D7FF43]" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {tradeRequests.length}
                </div>
                <div className="text-[11px] text-[#999D9B]">
                  {tradeRequests.filter((t) => t.status === 'AWAITING_SELLER_RESPONSE').length} awaiting your action
                </div>
              </div>

              <div
                onClick={() => setActiveTab('connections')}
                className="p-6 bg-[#171A1C] border border-white/10 hover:border-[#D7FF43]/40 rounded-2xl cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-[#999D9B]">
                  <span>Connected Buyers</span>
                  <Users className="w-5 h-5 text-[#D7FF43]" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {connections.length}
                </div>
                <div className="text-[11px] text-[#999D9B]">
                  Active bilateral trade corridors
                </div>
              </div>

              <div
                onClick={() => setActiveTab('verification')}
                className="p-6 bg-[#171A1C] border border-white/10 hover:border-[#D7FF43]/40 rounded-2xl cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-[#999D9B]">
                  <span>KYB Status</span>
                  <ShieldCheck className="w-5 h-5 text-[#D7FF43]" />
                </div>
                <div className="text-xl font-extrabold text-white">
                  {organization?.verificationStatus || 'VERIFIED'}
                </div>
                <div className="text-[11px] text-[#D7FF43] font-mono">
                  Export Authority Validated
                </div>
              </div>
            </div>

            {/* Incoming Requests Strip */}
            <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Recent Trade Inquiries
              </h3>

              <div className="space-y-3">
                {tradeRequests.map((tr) => (
                  <div key={tr.id} className="p-4 bg-[#111315] border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[#D7FF43]">{tr.id}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-[10px]">
                          {tr.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white">{tr.productDescription}</h4>
                      <span className="text-[#999D9B]">
                        From: {tr.buyerCompanyName} · Terms: {tr.quantity} {tr.unit} @ {tr.proposedPrice} {tr.currency}
                      </span>
                    </div>

                    <button
                      onClick={() => setReviewTrade(tr)}
                      className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold rounded-lg text-xs self-start sm:self-auto cursor-pointer"
                    >
                      Review & Respond
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 2: INCOMING INVITATIONS & TRADE REQUESTS */}
        {activeTab === 'incoming' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Trade Requests & Buyer Invitations</h2>
              <p className="text-xs text-[#999D9B]">
                Review commercial specifications and delivery terms from your buyers.
              </p>
            </div>

            <div className="space-y-4">
              {tradeRequests.map((tr) => (
                <div key={tr.id} className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="font-mono font-bold text-[#D7FF43]">{tr.id}</span>
                    <span className="px-2.5 py-1 rounded bg-[#111315] font-mono text-white border border-white/10">
                      {tr.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[#999D9B] block mb-1">Requesting Buyer</span>
                      <span className="font-semibold text-white block">{tr.buyerCompanyName}</span>
                      <span className="text-[#999D9B]">Org ID: {tr.buyerOrgId}</span>
                    </div>
                    <div>
                      <span className="text-[#999D9B] block mb-1">Commercial Terms</span>
                      <span className="font-semibold text-white block">
                        {tr.quantity} {tr.unit} · {tr.proposedPrice} {tr.currency}
                      </span>
                      <span className="text-[#999D9B]">Destination: {tr.deliveryLocation}</span>
                    </div>
                    <div>
                      <span className="text-[#999D9B] block mb-1">Target Delivery</span>
                      <span className="font-semibold text-white block">{tr.proposedDeliveryDate}</span>
                      <span className="text-[#999D9B]">Origin: {tr.countryOfOrigin}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#111315] rounded-xl border border-white/5 text-xs text-[#999D9B]">
                    <div><strong>Commodity:</strong> {tr.productDescription}</div>
                    <div><strong>Specifications:</strong> {tr.specifications}</div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedTradeForAgreement2(tr.id);
                        setActiveTab('agreement-2');
                      }}
                      className="px-4 py-2 bg-[#171A1C] hover:bg-white/10 border border-white/10 text-[#D7FF43] font-bold rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Agreement 2 Console</span>
                    </button>
                    <button
                      onClick={() => setReviewTrade(tr)}
                      className="px-5 py-2 bg-[#D7FF43] text-[#08090A] font-bold rounded-xl text-xs"
                    >
                      Inspect & Respond
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW: AGREEMENT 2 (TRADE CONTRACT & READINESS GATE) */}
        {activeTab === 'agreement-2' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Bilateral Agreement 2 Console</h2>
                <p className="text-xs text-[#999D9B]">
                  Review and negotiate the 18 Master Framework clauses and Schedules A–D with the buyer under strict server readiness gate controls.
                </p>
              </div>

              {tradeRequests.length > 1 && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#999D9B]">Active Trade:</span>
                  <select
                    value={selectedTradeForAgreement2}
                    onChange={(e) => setSelectedTradeForAgreement2(e.target.value)}
                    className="bg-[#171A1C] border border-white/10 rounded-lg p-1.5 text-white"
                  >
                    {tradeRequests.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.id} — {tr.productDescription.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Agreement2Console
              tradeId={selectedTradeForAgreement2}
              onNavigate={onNavigate}
            />
          </div>
        )}

        {/* SUBVIEW: PHOTO EVIDENCE GALLERY */}
        {activeTab === 'photo-evidence' && (
          <div className="space-y-6">
            {tradeRequests.length > 1 && (
              <div className="flex items-center justify-end gap-2 text-xs font-mono">
                <span className="text-[#999D9B]">Select Trade:</span>
                <select
                  value={selectedTradeForAgreement2}
                  onChange={(e) => setSelectedTradeForAgreement2(e.target.value)}
                  className="bg-[#171A1C] border border-white/10 rounded-lg p-1.5 text-white"
                >
                  {tradeRequests.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.id} — {tr.productDescription.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
            <EvidenceGalleryTab
              tradeId={selectedTradeForAgreement2}
              userRole="SELLER"
              userOrgName={organization?.legalName || 'MERIDIAN DEMO SELLER GMBH'}
              onNavigate={onNavigate}
            />
          </div>
        )}

        {/* SUBVIEW: BILATERAL SIGNATURES */}
        {activeTab === 'signatures' && (
          <div className="space-y-6">
            {tradeRequests.length > 1 && (
              <div className="flex items-center justify-end gap-2 text-xs font-mono">
                <span className="text-[#999D9B]">Select Trade:</span>
                <select
                  value={selectedTradeForAgreement2}
                  onChange={(e) => setSelectedTradeForAgreement2(e.target.value)}
                  className="bg-[#171A1C] border border-white/10 rounded-lg p-1.5 text-white"
                >
                  {tradeRequests.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.id} — {tr.productDescription.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
            <BilateralSignaturesTab
              tradeId={selectedTradeForAgreement2}
              userRole="SELLER"
              userOrgName={organization?.legalName || 'MERIDIAN DEMO SELLER GMBH'}
              userName={user?.name || 'Marcus Weber'}
              onNavigate={onNavigate}
            />
          </div>
        )}

        {/* SUBVIEW 3: CONNECTED BUYERS */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Connected Buyers</h2>
              <p className="text-xs text-[#999D9B]">
                Active trading counterparties bound through mutually approved trade requests.
              </p>
            </div>

            {connections.length === 0 ? (
              <div className="p-8 bg-[#171A1C] border border-white/10 rounded-2xl text-center space-y-2">
                <Users className="w-8 h-8 text-[#999D9B] mx-auto" />
                <h4 className="text-sm font-bold text-white">No bilateral connections active yet</h4>
                <p className="text-xs text-[#999D9B] max-w-sm mx-auto">
                  Accept an incoming trade request to establish your secure trade channel.
                </p>
              </div>
            ) : (
              connections.map((c) => (
                <div key={c.id} className="p-5 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[#D7FF43] block mb-1">CONNECTED CHANNEL · {c.id}</span>
                    <h4 className="text-sm font-bold text-white">{c.buyerCompanyName}</h4>
                    <span className="text-[#999D9B]">Buyer Org ID: {c.buyerOrgId}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-[#D7FF43] font-mono text-xs">
                    ACTIVE
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBVIEWS: VERIFICATION, AGREEMENT 1, PROFILE, AUDIT */}
        {activeTab === 'verification' && (
          <div className="p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4 text-xs font-mono">
            <h2 className="text-base font-bold text-white">Seller KYB Verification</h2>
            <div className="p-4 bg-[#111315] rounded-xl border border-white/5 space-y-2">
              <span className="text-white block font-bold">German Commercial Registry (Handelsregister) Checked</span>
              <span className="text-[#D7FF43]">Reg ID: {organization?.registrationNumber || 'HRB 189422'}</span>
            </div>
          </div>
        )}

        {activeTab === 'agreement-1' && (
          <div className="p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-white">Agreement 1 Acceptance Record</h2>
            <p className="text-[#999D9B]">Master Platform Terms v0.1 accepted by {organization?.agreement1AcceptedBy || 'Marcus Thorne'}.</p>
            <button
              onClick={() => setIsAgreementModalOpen(true)}
              className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold rounded-xl"
            >
              Open Agreement 1 Inspector
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-white">Seller Corporate Profile</h2>
            <div><strong>Company Name:</strong> {organization?.legalName}</div>
            <div><strong>Org ID:</strong> {organization?.id}</div>
            <div><strong>Country:</strong> {organization?.country}</div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-3 text-xs">
            <h2 className="text-base font-bold text-white">Activity Trail</h2>
            {auditLogs.map((l) => (
              <div key={l.id} className="py-2 border-b border-white/5 flex justify-between">
                <span>{l.eventType}</span>
                <span className="text-[#999D9B] font-mono">{new Date(l.serverTimestampUtc).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* SUBVIEW: ACTIVE TRADES (Opens 10-Section Trade Workspace Console) */}
        {activeTab === 'active-trades' && (
          <div className="space-y-4">
            {tradeRequests.length > 1 && (
              <div className="flex items-center justify-between p-4 bg-[#111315] border border-white/10 rounded-xl text-xs font-mono">
                <span className="text-[#999D9B]">SELECT ACTIVE TRADE WORKSPACE:</span>
                <select
                  value={selectedTradeForAgreement2}
                  onChange={(e) => setSelectedTradeForAgreement2(e.target.value)}
                  className="bg-[#171A1C] border border-white/10 rounded-lg p-2 text-white"
                >
                  {tradeRequests.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.id} — {tr.productDescription.slice(0, 32)} ({tr.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <TradeWorkspaceConsole
              tradeId={selectedTradeForAgreement2 || tradeRequests[0]?.id || 'DEMO-TRADE-001'}
              currentUserRole="SELLER"
              onRefresh={fetchData}
            />
          </div>
        )}

        {/* SUBVIEW: MEMBERSHIP */}
        {activeTab === 'membership' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-2">
              <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider block">MEMBERSHIP TIERS & DEAL LIMITS</span>
              <h2 className="text-xl font-bold text-white">Commercial Trade Orchestration Plans</h2>
              <p className="text-xs text-[#999D9B]">
                Meridian tiers enforce deal limits, SLA priority, and multi-jurisdiction compliance capabilities. Active tier: <span className="text-[#D7FF43] font-mono font-bold">{organization?.membershipTier || 'PRO'}</span>
              </p>
              {membershipMsg && (
                <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-[#D7FF43] font-mono">
                  ✓ {membershipMsg}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {([
                {
                  tier: 'REGULAR' as const,
                  tag: 'STARTER',
                  name: 'Regular Plan',
                  price: '€490',
                  features: ['✓ Up to 3 Active Trades', '✓ Agreement 1 & 2 Templates', '✓ Basic SHA-256 Hashing', '✓ Standard Email Support'],
                },
                {
                  tier: 'PRO' as const,
                  tag: 'PROFESSIONAL',
                  name: 'Pro Plan',
                  price: '€1,490',
                  features: ['✓ Up to 15 Active Trades', '✓ AI Sentinel Telemetry Rules', '✓ Private Storage Object Vault', '✓ PayPal & Wire Reconciliation', '✓ Bilateral Dispute Escalation'],
                },
                {
                  tier: 'ULTRA' as const,
                  tag: 'ENTERPRISE',
                  name: 'Ultra Plan',
                  price: '€3,900',
                  features: ['✓ Unlimited Trade Requests', '✓ Dedicated Account Executive', '✓ ERP & SAP Ingestion Bridge', '✓ 99.95% High-Availability SLA'],
                },
              ]).map((plan) => {
                const currentTier = organization?.membershipTier || 'PRO';
                const isCurrent = currentTier === plan.tier;
                return (
                  <div
                    key={plan.tier}
                    className={`p-6 bg-[#171A1C] rounded-2xl space-y-4 relative flex flex-col justify-between ${
                      isCurrent ? 'border-2 border-[#D7FF43] shadow-xl shadow-[#D7FF43]/10' : 'border border-white/10'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-[#D7FF43] text-[#08090A] font-bold text-[10px] font-mono uppercase">
                        CURRENT PLAN
                      </span>
                    )}
                    <div className="space-y-4">
                      <span className={`text-xs font-mono uppercase block font-bold ${plan.tier === 'ULTRA' ? 'text-purple-400' : plan.tier === 'PRO' ? 'text-[#D7FF43]' : 'text-[#999D9B]'}`}>
                        {plan.tag}
                      </span>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <div className="text-2xl font-bold text-white">
                        {plan.price} <span className="text-xs text-[#999D9B] font-normal">/ month</span>
                      </div>
                      <ul className="space-y-2 text-xs text-[#999D9B] font-mono">
                        {plan.features.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent || membershipLoading !== null}
                      onClick={() => handleSelectMembership(plan.tier)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-white/5 text-[#D7FF43] border border-[#D7FF43]/30 cursor-default'
                          : 'bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A]'
                      }`}
                    >
                      {membershipLoading === plan.tier ? 'Updating...' : isCurrent ? 'Active Plan' : `Select ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBVIEW: AGREEMENTS */}
        {activeTab === 'agreements' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider block">LEGAL FRAMEWORK</span>
                <h2 className="text-xl font-bold text-white">Meridian Agreements Portfolio</h2>
                <p className="text-xs text-[#999D9B]">
                  Bilateral platform terms and commercial trade transaction schedules.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Review / Sign Agreement 1</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-[#D7FF43] font-bold">PRIMARY AGREEMENT 1</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                    ACCEPTED
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">Meridian Master Platform Terms</h3>
                <p className="text-xs text-[#999D9B]">
                  Establishes Meridian SaaS terms, digital signature representation, and audit protocol.
                </p>
              </div>

              <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-[#D7FF43] font-bold">COMMERCIAL AGREEMENT 2</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px]">
                    IN NEGOTIATION / ACTIVE
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">Bilateral Commercial Trade Contract</h3>
                <p className="text-xs text-[#999D9B]">
                  18 clauses covering product specifications, price, Incoterms CIF Hamburg, cold-chain, and disputes.
                </p>
                <button
                  onClick={() => setActiveTab('active-trades')}
                  className="text-xs text-[#D7FF43] hover:underline flex items-center gap-1 font-mono pt-2"
                >
                  <span>Open Active Trade Workspace →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: DOCUMENTS AND PDFS */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-2">
              <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider block">OFFICIAL RECORDS</span>
              <h2 className="text-xl font-bold text-white">Documents, Certificates & PDFs</h2>
              <p className="text-xs text-[#999D9B]">
                Access-controlled persistent documents with verified SHA-256 cryptographic digests.
              </p>
            </div>

            <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-3">
              {acceptanceReceipts.length > 0 ? (
                acceptanceReceipts.map((acc) => (
                  <div key={acc.acceptanceId} className="p-4 bg-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono text-[#D7FF43] block">
                        01_Meridian_Master_Platform_Terms.pdf ({acc.receiptCode})
                      </span>
                      <span className="text-xs text-white block">
                        Signed Agreement 1 · {acc.authorizedRepresentative} ({acc.designation})
                      </span>
                      <span className="text-[11px] text-[#999D9B] font-mono">
                        {acc.watermark || `ELECTRONICALLY ACCEPTED BY ${acc.companyLegalName.toUpperCase()}`}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        downloadAgreement1Pdf({
                          acceptance: acc,
                          document: LEGAL_DOCUMENTS[0],
                          signatureMethod: acc.signatureMethod,
                          signatureData: acc.signatureData,
                        })
                      }
                      className="px-3 py-1.5 bg-[#D7FF43] hover:bg-[#cbf436] text-xs font-mono font-bold text-[#08090A] rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-[#D7FF43] block">01_Meridian_Master_Platform_Terms.pdf</span>
                    <span className="text-xs text-white">Platform Agreement 1 (Pending Signature)</span>
                  </div>
                  <button
                    onClick={() => setIsAgreementModalOpen(true)}
                    className="px-3 py-1.5 bg-[#D7FF43] text-xs font-mono font-bold text-[#08090A] rounded-lg cursor-pointer"
                  >
                    Sign Agreement 1
                  </button>
                </div>
              )}

              <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-[#D7FF43] block">Agreement 2 & Trade Evidence Vault</span>
                  <span className="text-xs text-white">Signed Bilateral Contract PDFs, Inspection Certificates & Payment Receipts</span>
                </div>
                <button
                  onClick={() => setActiveTab('active-trades')}
                  className="px-3 py-1.5 bg-[#171A1C] hover:bg-white/10 border border-white/10 text-xs font-mono text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Trade Workspace</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider block">LIVE ALERTS</span>
                <h2 className="text-xl font-bold text-white">Platform Notifications</h2>
                <p className="text-xs text-[#999D9B]">
                  Real-time workflow updates, signature alerts, and shipment milestones.
                </p>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-white cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 bg-[#171A1C] border border-white/10 rounded-2xl text-center text-xs text-[#999D9B]">
                No notifications recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-4 ${
                      n.read ? 'bg-[#111315] border-white/5 text-[#999D9B]' : 'bg-[#171A1C] border-[#D7FF43]/40 text-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-[#D7FF43]" />}
                        <span>{n.title}</span>
                      </div>
                      <p className="text-[#999D9B]">{n.message}</p>
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkNotifRead(n.id)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] font-mono text-[#D7FF43] shrink-0 cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW: TRADE HISTORY */}
        {activeTab === 'trade-history' && (
          <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Executed Trade History</h2>
            <p className="text-xs text-[#999D9B]">
              Closed and active commercial contracts with persistent manifests.
            </p>
            <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-[#171A1C]">
              {tradeRequests.map((tr) => (
                <div key={tr.id} className="p-4 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[#D7FF43] font-bold block">{tr.id}</span>
                    <span className="text-white">{tr.productDescription}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-white">{tr.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4 text-xs font-mono">
            <h2 className="text-xl font-bold text-white font-sans">Settings & Operational Preferences</h2>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                <span>Corporate Multi-Factor Authentication:</span>
                <span className="text-emerald-400">ENABLED (SIMULATED)</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                <span>PayPal Sandbox Webhook Receiver:</span>
                <span className="text-emerald-400">ACTIVE (/api/webhooks/paypal)</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                <span>IoT Telemetry Sensor Protocol:</span>
                <span className="text-[#D7FF43]">HMAC-SHA256 (MERIDIAN-TEL-V2)</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Demo Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="p-6 bg-[#171A1C] border border-amber-500/40 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <h3 className="text-base font-bold text-white">RESET DEMO FOR NEXT PRESENTATION</h3>
            </div>
            <p className="text-xs text-[#999D9B] leading-relaxed">
              This action will reset the synthetic demo entities (<span className="text-white font-mono">DEMO-BUYER-001</span>, <span className="text-white font-mono">DEMO-SELLER-001</span>, and <span className="text-white font-mono">DEMO-TRADE-001</span>) back to their pristine initial state.
            </p>
            <div className="p-3 bg-white/5 rounded-xl text-[11px] font-mono text-white/80 space-y-1">
              <div>✓ Archives current presentation run</div>
              <div>✓ Preserves real non-demo users & companies</div>
              <div>✓ Preserves permanent system audit logs</div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resettingDemo}
                className="px-4 py-2 text-xs text-[#999D9B] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={resettingDemo}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
              >
                <span>{resettingDemo ? 'Resetting Demo State...' : 'CONFIRM DEMO RESET'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW TRADE REQUEST MODAL */}
      {reviewTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090A]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#171A1C] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="font-mono text-xs text-[#D7FF43] uppercase">COUNTERPARTY INVITATION REVIEW</span>
                <h3 className="text-xl font-bold text-white">Review Trade Request {reviewTrade.id}</h3>
              </div>
              <button onClick={() => setReviewTrade(null)} className="p-1.5 text-[#999D9B] hover:text-white">✕</button>
            </div>

            {/* Notice */}
            <div className="p-3.5 bg-blue-950/40 border border-blue-500/20 rounded-xl text-xs text-blue-200">
              Accepting this invitation confirms bilateral intent and connects your organizations. It does NOT execute Agreement 2 (Trade Contract execution occurs in subsequent phase).
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#111315] rounded-xl border border-white/5 space-y-2">
                <span className="text-[#D7FF43] font-mono uppercase block">Buyer Information</span>
                <div className="font-semibold text-white">{reviewTrade.buyerCompanyName}</div>
                <div className="text-[#999D9B]">Org ID: {reviewTrade.buyerOrgId}</div>
              </div>

              <div className="p-4 bg-[#111315] rounded-xl border border-white/5 space-y-2">
                <span className="text-[#D7FF43] font-mono uppercase block">Proposed Terms</span>
                <div><strong>Product:</strong> {reviewTrade.productDescription}</div>
                <div><strong>Quantity:</strong> {reviewTrade.quantity} {reviewTrade.unit}</div>
                <div><strong>Price:</strong> {reviewTrade.proposedPrice} {reviewTrade.currency}</div>
                <div><strong>Delivery Destination:</strong> {reviewTrade.deliveryLocation}</div>
                <div><strong>Target Date:</strong> {reviewTrade.proposedDeliveryDate}</div>
                <div><strong>Specifications:</strong> {reviewTrade.specifications}</div>
              </div>

              <div>
                <label className="block text-[#999D9B] mb-1 font-mono uppercase">
                  Response Notes / Clarifications (Optional)
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Specify any adjustments to lead times, Incoterms, or packaging specifications..."
                  rows={3}
                  className="w-full bg-[#111315] border border-white/10 rounded-xl p-3 text-xs text-white"
                />
              </div>

              {actionSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-[#D7FF43]/40 rounded-xl text-xs text-[#D7FF43] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleRespondToInvitation('DECLINE')}
                  className="px-4 py-2 bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-300 rounded-xl font-bold"
                >
                  Decline
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRespondToInvitation('CHANGES_REQUESTED')}
                    className="px-4 py-2 bg-[#111315] hover:bg-white/5 border border-white/10 text-white rounded-xl"
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespondToInvitation('ACCEPT')}
                    className="px-6 py-2 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold rounded-xl"
                  >
                    Accept Invitation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EmailOutboxModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onNavigate={onNavigate}
      />
      <NotificationsDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onNavigate={onNavigate}
      />
      <Agreement1SigningModal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        onSuccess={() => {
          refreshProfile();
          fetchData();
        }}
      />
    </div>
  );
};
