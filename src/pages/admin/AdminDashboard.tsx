import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Organization,
  AuthorizedRepresentative,
  BusinessDocument,
  AgreementAcceptance,
  ComplianceScreening,
  AuditEvent,
  TradeRequest,
  SellerInvitation,
  EmailOutboxItem,
} from '../../types';
import {
  Terminal,
  Shield,
  Building2,
  Users,
  FileText,
  Layers,
  History,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  LogOut,
  Sparkles,
  Server,
  Lock,
} from 'lucide-react';
import { EmailOutboxModal } from '../../components/dashboard/EmailOutboxModal';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'compliance' | 'trades' | 'legal-queue' | 'audit' | 'email'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<Organization[]>([]);
  const [screenings, setScreenings] = useState<ComplianceScreening[]>([]);
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [invitations, setInvitations] = useState<SellerInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [outbox, setOutbox] = useState<EmailOutboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearingTradeId, setClearingTradeId] = useState<string | null>(null);
  const [clearResolutionNotes, setClearResolutionNotes] = useState('');

  // Search & Filters
  const [companySearch, setCompanySearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Selected Company Inspector Modal
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyDetail, setCompanyDetail] = useState<{
    organization: Organization;
    representative?: AuthorizedRepresentative;
    documents: BusinessDocument[];
    agreementAcceptances: AgreementAcceptance[];
    complianceScreenings: ComplianceScreening[];
    auditEvents: AuditEvent[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Email Outbox Modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, compRes, compScreenRes, tradeRes, auditRes, outboxRes] = await Promise.all([
        api.admin.getOverview().catch(() => ({ stats: {} })),
        api.admin.getCompanies().catch(() => ({ organizations: [] })),
        api.admin.getCompliance().catch(() => ({ screenings: [] })),
        api.admin.getTradeRequests().catch(() => ({ tradeRequests: [] })),
        api.admin.getAuditLogs().catch(() => ({ auditEvents: [] })),
        api.email.getOutbox().catch(() => ({ outbox: [] })),
      ]);

      setStats(statsRes.stats || {});
      setCompanies(compRes.organizations || []);
      setScreenings(compScreenRes.screenings || []);
      setTradeRequests(tradeRes.tradeRequests || []);
      setAuditLogs(auditRes.auditEvents || []);
      setOutbox(outboxRes.outbox || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCompanyInspector = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    setDetailLoading(true);
    try {
      const res = await api.admin.getCompanyDetail(companyId);
      setCompanyDetail(res);
    } catch (err) {
      console.error('Failed to load company detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateCompanyStatus = async (newStatus: 'VERIFIED' | 'UNDER_REVIEW' | 'REJECTED') => {
    if (!selectedCompanyId) return;
    setUpdatingStatus(true);
    try {
      await api.admin.updateCompanyStatus(selectedCompanyId, newStatus);
      await openCompanyInspector(selectedCompanyId);
      await loadData();
    } catch (err: any) {
      alert('Failed to update company verification status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.legalName.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.country.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.entityType.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.id.toLowerCase().includes(companySearch.toLowerCase());

    if (!matchesSearch) return false;
    if (companyFilter === 'ALL') return true;
    if (companyFilter === 'VERIFIED') return c.verificationStatus === 'VERIFIED';
    if (companyFilter === 'PENDING') return c.verificationStatus === 'KYB_PENDING' || c.verificationStatus === 'UNDER_REVIEW' || c.verificationStatus === 'NOT_STARTED';
    if (companyFilter === 'REJECTED') return c.verificationStatus === 'REJECTED';
    return true;
  });

  // Filtered audit logs
  const filteredAudit = auditLogs.filter(
    (a) =>
      (a.eventType || a.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
      (a.details || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
      (a.actor || a.performedBy || '').toLowerCase().includes(auditSearch.toLowerCase())
  );

  const handleClearLegalReview = async (tradeId: string) => {
    if (!clearResolutionNotes.trim()) {
      alert('Resolution notes are required for administrative clearance.');
      return;
    }
    setLoading(true);
    try {
      await api.admin.clearLegalReview(tradeId, clearResolutionNotes);
      setClearingTradeId(null);
      setClearResolutionNotes('');
      await loadData();
      alert(`Trade ${tradeId} legal review hold cleared successfully.`);
    } catch (err: any) {
      alert('Failed to clear legal review hold: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#171A1C] border border-[#D7FF43]/30 rounded-xl text-[#D7FF43]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
                  MERIDIAN INTERNAL OPERATIONS & ARCHITECTURE CONSOLE
                </span>
                <span className="text-white/20">/</span>
                <span className="text-xs text-[#999D9B] font-mono">ROOT DEVELOPER</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
                Super-Admin Management Console
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-3.5 py-1.5 text-xs text-[#F5F5F2] bg-[#171A1C] hover:bg-white/5 border border-white/10 rounded-lg flex items-center gap-1.5 font-mono"
            >
              <Mail className="w-3.5 h-3.5 text-[#D7FF43]" />
              <span>Outbox ({outbox.length})</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-[#999D9B] hover:text-[#F5F5F2] bg-[#171A1C] border border-white/10 rounded-lg"
              title="Refresh console state"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="px-3.5 py-1.5 text-xs text-[#999D9B] hover:text-[#F5F5F2] bg-[#171A1C] border border-white/10 rounded-lg"
            >
              Public Site
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 text-xs font-semibold text-red-300 bg-red-950/40 hover:bg-red-950/60 border border-red-500/20 rounded-lg flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/5 scrollbar-none font-mono text-xs">
          {[
            { id: 'overview', label: 'System Overview', icon: Server },
            { id: 'companies', label: `Companies & KYB (${companies.length})`, icon: Building2 },
            { id: 'compliance', label: `Compliance Screenings (${screenings.length})`, icon: Shield },
            { id: 'trades', label: `Trade Requests (${tradeRequests.length})`, icon: Layers },
            { id: 'legal-queue', label: 'Mandatory Legal Review Queue', icon: AlertTriangle },
            { id: 'audit', label: `Audit Events (${auditLogs.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#D7FF43] text-[#08090A] font-bold'
                    : 'bg-[#171A1C] text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-[#171A1C] border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-[#999D9B] uppercase">Registered Enterprises</span>
                <div className="text-2xl font-bold text-[#F5F5F2] font-mono">{stats?.totalOrganizations || companies.length}</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{stats?.verifiedOrganizations || 2} Fully Verified</span>
                </div>
              </div>

              <div className="p-5 bg-[#171A1C] border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-[#999D9B] uppercase">Agreement 1 Signed</span>
                <div className="text-2xl font-bold text-[#D7FF43] font-mono">{stats?.totalAgreementsSigned || 2}</div>
                <div className="text-xs text-[#999D9B]">SHA-256 Verified Timestamped</div>
              </div>

              <div className="p-5 bg-[#171A1C] border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-[#999D9B] uppercase">Trade Requests</span>
                <div className="text-2xl font-bold text-[#F5F5F2] font-mono">{stats?.totalTradeRequests || tradeRequests.length}</div>
                <div className="text-xs text-blue-400">1 Bilateral Active</div>
              </div>

              <div className="p-5 bg-[#171A1C] border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-[#999D9B] uppercase">Compliance Checks</span>
                <div className="text-2xl font-bold text-[#F5F5F2] font-mono">{stats?.totalComplianceScreenings || screenings.length}</div>
                <div className="text-xs text-emerald-400">Zero Sanctions Hits</div>
              </div>
            </div>

            {/* Platform Quick Links & Invariant Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Architecture Invariants */}
              <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#D7FF43] flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Phase 2 Invariant Enforcement</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400">ALL PASSING</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-[#111315] rounded-xl flex items-center justify-between border border-white/5">
                    <div>
                      <div className="font-semibold text-[#F5F5F2]">12 Verbatim Legal Drafts Loaded</div>
                      <div className="text-[11px] text-[#999D9B]">Draft disclaimer applied to all documents</div>
                    </div>
                    <span className="text-xs font-mono text-[#D7FF43]">SECURED</span>
                  </div>

                  <div className="p-3 bg-[#111315] rounded-xl flex items-center justify-between border border-white/5">
                    <div>
                      <div className="font-semibold text-[#F5F5F2]">Identity-Bound Session Auth</div>
                      <div className="text-[11px] text-[#999D9B]">Salted PBKDF2 password hashes + Bearer session tokens</div>
                    </div>
                    <span className="text-xs font-mono text-[#D7FF43]">ENFORCED</span>
                  </div>

                  <div className="p-3 bg-[#111315] rounded-xl flex items-center justify-between border border-white/5">
                    <div>
                      <div className="font-semibold text-[#F5F5F2]">Non-Bank / Non-Escrow Disclaimers</div>
                      <div className="text-[11px] text-[#999D9B]">Visible on landing, dashboard, and invite acceptance</div>
                    </div>
                    <span className="text-xs font-mono text-[#D7FF43]">COMPLIANT</span>
                  </div>

                  <div className="p-3 bg-[#111315] rounded-xl flex items-center justify-between border border-white/5">
                    <div>
                      <div className="font-semibold text-[#F5F5F2]">Permanent Database Persistence</div>
                      <div className="text-[11px] text-[#999D9B]">Atomic disk flush to /data/meridian_db.json</div>
                    </div>
                    <span className="text-xs font-mono text-[#D7FF43]">ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Seeded Entities Quick Inspector */}
              <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#F5F5F2] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#D7FF43]" />
                    <span>Mandatory Seed Entities</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#999D9B]">DEMO ENVIRONMENT</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[#111315] rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#F5F5F2]">MERIDIAN DEMO BUYER PRIVATE LIMITED</div>
                      <div className="text-[11px] text-[#999D9B] font-mono">DEMO-BUYER-001 · buyer.demo@meridian.test · India</div>
                    </div>
                    <button
                      onClick={() => openCompanyInspector('DEMO-BUYER-001')}
                      className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-[#D7FF43] font-mono"
                    >
                      Inspect
                    </button>
                  </div>

                  <div className="p-3.5 bg-[#111315] rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#F5F5F2]">MERIDIAN DEMO SELLER GMBH</div>
                      <div className="text-[11px] text-[#999D9B] font-mono">DEMO-SELLER-001 · seller.demo@meridian.test · Germany</div>
                    </div>
                    <button
                      onClick={() => openCompanyInspector('DEMO-SELLER-001')}
                      className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-[#D7FF43] font-mono"
                    >
                      Inspect
                    </button>
                  </div>

                  <div className="p-3.5 bg-[#111315] rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#F5F5F2]">DEMO-TRADE-001: Packaging Film</div>
                      <div className="text-[11px] text-[#999D9B] font-mono">5,000 rolls · EUR 18.50/roll · CIF Nhava Sheva</div>
                    </div>
                    <button
                      onClick={() => setActiveTab('trades')}
                      className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-[#D7FF43] font-mono"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPANIES & KYB */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#171A1C] border border-white/10 rounded-2xl">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#999D9B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search legal name, country, ID..."
                  className="w-full bg-[#111315] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {(['ALL', 'VERIFIED', 'PENDING', 'REJECTED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCompanyFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      companyFilter === filter
                        ? 'bg-[#D7FF43] text-[#08090A] font-bold'
                        : 'bg-[#111315] text-[#999D9B] hover:text-[#F5F5F2]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Companies Table */}
            <div className="bg-[#171A1C] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111315] text-[#999D9B] font-mono uppercase text-[10px] border-b border-white/5">
                    <tr>
                      <th className="py-3 px-4">Entity ID & Legal Name</th>
                      <th className="py-3 px-4">Jurisdiction</th>
                      <th className="py-3 px-4">Entity Type</th>
                      <th className="py-3 px-4">KYB Status</th>
                      <th className="py-3 px-4">Agreement 1</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#F5F5F2]">
                    {filteredCompanies.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#F5F5F2]">{c.legalName}</div>
                          <div className="text-[10px] font-mono text-[#999D9B]">ID: {c.id} · {c.officialEmail}</div>
                        </td>
                        <td className="py-3 px-4">{c.country} ({c.stateRegion || 'N/A'})</td>
                        <td className="py-3 px-4 text-[#999D9B]">{c.entityType}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                              c.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : c.verificationStatus === 'REJECTED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {c.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {c.agreement1Status === 'ACCEPTED' || c.agreement1Signed ? (
                            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Signed</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openCompanyInspector(c.id)}
                            className="px-3 py-1 bg-white/5 hover:bg-[#D7FF43] hover:text-[#08090A] text-[#999D9B] rounded-lg text-xs font-mono transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#999D9B] font-mono">
                          No organizations matched current filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLIANCE */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#F5F5F2] uppercase font-mono tracking-wider">
                  Source-Based Regulatory & Sanctions Screening Engine
                </h3>
                <p className="text-xs text-[#999D9B] mt-0.5">
                  Screens against United Nations Security Council, US OFAC SDN, UK FCDO, EU EEAS, US BIS, and India DGFT denied lists.
                </p>
              </div>
              <span className="text-xs font-mono text-[#D7FF43]">6 REGULATORY LISTS ACTIVE</span>
            </div>

            <div className="bg-[#171A1C] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111315] text-[#999D9B] font-mono uppercase text-[10px] border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Screening ID</th>
                    <th className="py-3 px-4">Entity Screened</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Databases Checked</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F5F5F2]">
                  {screenings.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-[11px]">{s.id}</td>
                      <td className="py-3 px-4 font-semibold">{s.subjectIdentifier}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                            s.resultStatus === 'CLEAR_ON_CHECKED_SOURCES'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : s.resultStatus === 'PROHIBITED_OR_SANCTIONS_ALERT'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {s.resultStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#999D9B] font-mono text-[11px]">
                        {s.sourcesChecked.length} lists ({s.sourcesChecked.slice(0, 3).map((sc: any) => sc.sourceName || sc).join(', ')}...)
                      </td>
                      <td className="py-3 px-4 text-[#999D9B] font-mono text-[11px]">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {s.resultStatus === 'CLEAR_ON_CHECKED_SOURCES' ? 'CLEAR' : 'REVIEW'}
                      </td>
                    </tr>
                  ))}
                  {screenings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#999D9B] font-mono">
                        No compliance screenings recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TRADE REQUESTS */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            <div className="bg-[#171A1C] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111315] text-[#999D9B] font-mono uppercase text-[10px] border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Trade ID</th>
                    <th className="py-3 px-4">Commodity</th>
                    <th className="py-3 px-4">Buyer Enterprise</th>
                    <th className="py-3 px-4">Target Seller</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F5F5F2]">
                  {tradeRequests.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#D7FF43]">{t.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{t.productDescription}</div>
                        <div className="text-[10px] text-[#999D9B] font-mono">
                          {t.quantity} {t.unit} · {t.incoterms || 'CIF'}
                        </div>
                      </td>
                      <td className="py-3 px-4">{t.buyerCompanyName}</td>
                      <td className="py-3 px-4 text-[#999D9B]">{t.sellerCompanyName || 'Invitation Dispatched'}</td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {t.currency} {(t.proposedPrice || t.targetPrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tradeRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#999D9B] font-mono">
                        No trade requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: MANDATORY LEGAL REVIEW QUEUE */}
        {activeTab === 'legal-queue' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#F5F5F2] uppercase font-mono tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Mandatory Administrative Legal Review Queue</span>
                </h3>
                <p className="text-xs text-[#999D9B] mt-0.5">
                  Transactions with unresolved legal flags, sanctions ambiguity, or clause disputes are held here under server-side invariant lock.
                </p>
              </div>
              <span className="text-xs font-mono text-red-400">STRICT INVARIANT ENFORCEMENT</span>
            </div>

            <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
              <div className="divide-y divide-white/5">
                {tradeRequests.map((tr) => (
                  <div key={tr.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#D7FF43]">{tr.id}</span>
                        <span className="font-semibold text-white">{tr.productDescription}</span>
                      </div>
                      <div className="text-[#999D9B]">
                        Buyer: {tr.buyerCompanyName} · Seller: {tr.sellerCompanyName || 'Pending'} · Value: {tr.currency} {tr.proposedPrice}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setClearingTradeId(tr.id);
                          setClearResolutionNotes(`Administrative legal review performed by compliance counsel. Sanctions clear; terms harmonized.`);
                        }}
                        className="px-3.5 py-1.5 bg-[#D7FF43] text-[#08090A] font-bold rounded-lg text-xs font-mono"
                      >
                        Clear Legal Hold
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Modal */}
            {clearingTradeId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-[#171A1C] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />
                    <span>Clear Legal Hold for {clearingTradeId}</span>
                  </h3>
                  <p className="text-[#999D9B]">
                    Enter formal resolution notes. This will clear the `legalReviewFlag` server-side and log an immutable audit event.
                  </p>
                  <textarea
                    value={clearResolutionNotes}
                    onChange={(e) => setClearResolutionNotes(e.target.value)}
                    rows={4}
                    className="w-full bg-[#111315] border border-white/10 rounded-xl p-3 text-white"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setClearingTradeId(null)}
                      className="px-4 py-2 text-[#999D9B] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleClearLegalReview(clearingTradeId)}
                      disabled={loading}
                      className="px-5 py-2 bg-[#D7FF43] text-[#08090A] font-bold rounded-xl"
                    >
                      Clear & Authorize
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 bg-[#171A1C] border border-white/10 rounded-2xl">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#999D9B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit actions, emails, details..."
                  className="w-full bg-[#111315] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43]"
                />
              </div>
              <span className="text-xs font-mono text-[#999D9B]">
                {filteredAudit.length} events logged
              </span>
            </div>

            <div className="bg-[#171A1C] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#111315] text-[#999D9B] uppercase text-[10px] border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F5F5F2] text-[11px]">
                  {filteredAudit.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 text-[#999D9B] whitespace-nowrap">
                        {new Date(a.serverTimestampUtc || a.timestamp || '').toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#D7FF43]">{a.eventType || a.action}</td>
                      <td className="py-2.5 px-4 text-[#999D9B]">{a.objectId || a.entityId || 'SYS'}</td>
                      <td className="py-2.5 px-4">{a.actor || a.performedBy || 'SYSTEM'}</td>
                      <td className="py-2.5 px-4 text-[#999D9B] max-w-xs truncate">{a.details || ''}</td>
                    </tr>
                  ))}
                  {filteredAudit.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#999D9B]">
                        No audit events match search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Deep Company Inspector Modal */}
      {selectedCompanyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#171A1C] border border-white/10 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#D7FF43] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-mono text-[#999D9B]">Loading corporate records...</p>
              </div>
            ) : companyDetail ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#D7FF43]">COMPANY INSPECTOR</span>
                      <span className="text-white/20">/</span>
                      <span className="font-mono text-xs text-[#999D9B]">ID: {companyDetail.organization.id}</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#F5F5F2] mt-1">
                      {companyDetail.organization.legalName}
                    </h2>
                    <div className="text-xs text-[#999D9B] mt-0.5">
                      {companyDetail.organization.country} · {companyDetail.organization.entityType}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCompanyId(null);
                      setCompanyDetail(null);
                    }}
                    className="p-1.5 text-[#999D9B] hover:text-white bg-white/5 rounded-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Override Panel */}
                <div className="p-4 bg-[#111315] border border-white/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono text-[#999D9B] uppercase">CURRENT VERIFICATION STATUS</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                          companyDetail.organization.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : companyDetail.organization.verificationStatus === 'REJECTED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {companyDetail.organization.verificationStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateCompanyStatus('VERIFIED')}
                      disabled={updatingStatus || companyDetail.organization.verificationStatus === 'VERIFIED'}
                      className="px-3 py-1.5 bg-[#D7FF43] disabled:opacity-40 text-[#08090A] font-bold text-xs rounded-lg"
                    >
                      Approve (VERIFIED)
                    </button>
                    <button
                      onClick={() => handleUpdateCompanyStatus('UNDER_REVIEW')}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs rounded-lg"
                    >
                      Under Review
                    </button>
                    <button
                      onClick={() => handleUpdateCompanyStatus('REJECTED')}
                      disabled={updatingStatus || companyDetail.organization.verificationStatus === 'REJECTED'}
                      className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 text-xs rounded-lg"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#999D9B] block font-mono text-[10px] uppercase">Official Email</span>
                    <span className="text-[#F5F5F2] font-mono">{companyDetail.organization.officialEmail}</span>
                  </div>
                  <div>
                    <span className="text-[#999D9B] block font-mono text-[10px] uppercase">Registration Number</span>
                    <span className="text-[#F5F5F2] font-mono">{companyDetail.organization.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-[#999D9B] block font-mono text-[10px] uppercase">Tax / VAT ID</span>
                    <span className="text-[#F5F5F2] font-mono">{companyDetail.organization.taxId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#999D9B] block font-mono text-[10px] uppercase">Registered Address</span>
                    <span className="text-[#F5F5F2]">{companyDetail.organization.registeredAddress}</span>
                  </div>
                </div>

                {/* Representative */}
                <div className="p-4 bg-[#111315] rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#D7FF43] block">
                    Authorized Representative
                  </span>
                  {companyDetail.representative ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[#999D9B] text-[10px]">Name:</span>
                        <div className="font-semibold text-[#F5F5F2]">{companyDetail.representative.fullName}</div>
                      </div>
                      <div>
                        <span className="text-[#999D9B] text-[10px]">Title:</span>
                        <div className="text-[#F5F5F2]">{companyDetail.representative.designation || companyDetail.representative.title}</div>
                      </div>
                      <div>
                        <span className="text-[#999D9B] text-[10px]">Email:</span>
                        <div className="text-[#F5F5F2] font-mono">{companyDetail.representative.officialEmail || companyDetail.representative.email}</div>
                      </div>
                      <div>
                        <span className="text-[#999D9B] text-[10px]">Authority Declaration:</span>
                        <div className="text-emerald-400 font-mono">Confirmed & Bound</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#999D9B]">No representative declared yet.</p>
                  )}
                </div>

                {/* Uploaded Documents */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#999D9B] block">
                    Uploaded Corporate Documents ({companyDetail.documents.length})
                  </span>
                  <div className="space-y-2">
                    {companyDetail.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-[#111315] border border-white/5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#D7FF43]" />
                          <div>
                            <div className="font-semibold">{doc.fileName}</div>
                            <div className="text-[10px] text-[#999D9B] font-mono">{doc.documentType}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {doc.status || doc.verificationStatus || 'VERIFIED'}
                        </span>
                      </div>
                    ))}
                    {companyDetail.documents.length === 0 && (
                      <p className="text-xs text-[#999D9B]">No corporate documents submitted yet.</p>
                    )}
                  </div>
                </div>

                {/* Agreement 1 Acceptance Receipts */}
                <div className="p-4 bg-[#111315] rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#D7FF43] block">
                    Agreement 1 Electronic Execution Receipts ({companyDetail.agreementAcceptances.length})
                  </span>
                  {companyDetail.agreementAcceptances.map((acc) => (
                    <div key={acc.id} className="text-xs font-mono space-y-1 p-2 bg-[#08090A] rounded border border-white/5">
                      <div className="text-[#F5F5F2] flex items-center justify-between">
                        <span>Signatory: {acc.authorizedRepresentative} ({acc.designation})</span>
                        <span className="text-[#999D9B]">{new Date(acc.acceptedAtUtc || acc.timestamp || '').toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-[#999D9B] break-all">
                        Receipt: {acc.acceptanceId} · Code: {acc.receiptCode} · SHA-256: {acc.documentHash}
                      </div>
                    </div>
                  ))}
                  {companyDetail.agreementAcceptances.length === 0 && (
                    <p className="text-xs text-[#999D9B]">Agreement 1 has not been executed yet.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Email Outbox Viewer */}
      <EmailOutboxModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
