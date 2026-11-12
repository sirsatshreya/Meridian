import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Agreement2,
  Agreement2Clause,
  Agreement2ReadinessReport,
  ReadinessCheckItem,
  DocumentEvidenceRecord,
  EvidenceCategory,
} from '../../types';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Edit3,
  Check,
  RefreshCw,
  Scale,
  Cpu,
  Radio,
  FileCheck2,
  AlertOctagon,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  Printer,
  Eye,
  Download,
} from 'lucide-react';
import { PrototypeSignaturePad } from '../trades/PrototypeSignaturePad';
import { DocumentIntegrityModal } from '../trades/DocumentIntegrityModal';
import { downloadAgreement2Pdf } from '../../utils/pdfGenerator';

interface Agreement2ConsoleProps {
  tradeId: string;
  onNavigate?: (route: string) => void;
  currentRole?: 'BUYER' | 'SELLER';
  onUpdate?: () => Promise<void> | void;
}

export const Agreement2Console: React.FC<Agreement2ConsoleProps> = ({ tradeId, onNavigate, currentRole, onUpdate }) => {
  const { user, organization } = useAuth();

  const [agreement, setAgreement] = useState<Agreement2 | null>(null);
  const [readiness, setReadiness] = useState<Agreement2ReadinessReport | null>(null);
  const [activeTab, setActiveTab] = useState<
    'full_doc' | 'readiness' | 'framework' | 'schedule_a' | 'schedule_b' | 'schedule_c' | 'schedule_d' | 'execution' | 'integrity'
  >('full_doc');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Evidence state
  const [evidenceList, setEvidenceList] = useState<DocumentEvidenceRecord[]>([]);
  const [selectedEvidenceForModal, setSelectedEvidenceForModal] = useState<DocumentEvidenceRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<EvidenceCategory>('shipment_photo');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadBase64, setUploadBase64] = useState('');

  // Clause editing state
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  // Rejection modal state
  const [rejectClauseTarget, setRejectClauseTarget] = useState<Agreement2Clause | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Escalate modal state
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  // Sign modal state
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signatoryName, setSignatoryName] = useState(user?.name || '');
  const [signatoryDesignation, setSignatoryDesignation] = useState(
    organization?.role === 'BUYER' ? 'Director of Global Procurement' : 'Managing Director & Head of Export'
  );
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);

  const isBuyer = organization?.role === 'BUYER' || user?.role === 'BUYER';
  const isSeller = organization?.role === 'SELLER' || user?.role === 'SELLER';
  const isAdmin = user?.role === 'DEVELOPER';

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [res, readRes, evdRes] = await Promise.all([
        api.agreement2.get(tradeId),
        api.agreement2.getReadiness(tradeId).catch(() => ({ readiness: null, readinessReport: null })),
        api.evidence.list(tradeId).catch(() => ({ evidence: [] })),
      ]);
      setAgreement(res.agreement2 || (res as any).agreement);
      setReadiness(readRes.readiness || (readRes as any).readinessReport);
      setEvidenceList(evdRes.evidence || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load Agreement 2');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tradeId) {
      loadData();
    }
  }, [tradeId]);

  const handleStartEdit = (clause: Agreement2Clause) => {
    setEditingClauseId(clause.id);
    setEditedContent(clause.content);
  };

  const handleSaveClause = async (clauseId: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.agreement2.updateClause(tradeId, clauseId, editedContent);
      setAgreement(res.agreement2 || (res as any).agreement);
      await loadData();
      setEditingClauseId(null);
      setSuccessMessage('Clause updated. Notice: Approval state for this modified clause has been invalidated across counterparties.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update clause');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveClause = async (clauseId: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.agreement2.approveClause(tradeId, clauseId);
      await loadData();
      setSuccessMessage('Clause approved.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Approval rejected');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClauseSubmit = async () => {
    if (!rejectClauseTarget) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.agreement2.rejectClause(tradeId, rejectClauseTarget.id, rejectionReason);
      await loadData();
      setRejectClauseTarget(null);
      setRejectionReason('');
      setSuccessMessage('Clause rejected and flagged for amendment.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateAgreement = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.agreement2.generate(tradeId);
      setAgreement(res.agreement2 || (res as any).agreement);
      await loadData();
      setSuccessMessage('Agreement 2 generated and locked for bilateral execution.');
      setActiveTab('execution');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Readiness gate blocked generation');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrototypeSign = async (signData: {
    signatureMethod: 'PROTOTYPE_CANVAS' | 'PROTOTYPE_TYPED';
    signatureData: string;
    signerName: string;
    signerTitle: string;
    disclaimerText: string;
  }) => {
    if (!agreement) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.agreement2.sign(tradeId, {
        authorizedSignerName: signData.signerName,
        signerTitle: signData.signerTitle,
        expectedHash: agreement.sha256Hash,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        signatureMethod: signData.signatureMethod,
        signatureData: signData.signatureData,
        disclaimerText: signData.disclaimerText,
      });
      setAgreement(res.agreement || (res as any).agreement2);
      await loadData();
      setIsSignModalOpen(false);
      setSuccessMessage('Prototype electronic signature executed and cryptographically bound to Agreement 2.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Signature execution rejected by server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName || !uploadBase64) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const ext = uploadFileName.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg';
      await api.evidence.upload(tradeId, {
        category: uploadCategory,
        fileName: uploadFileName,
        mimeType,
        fileData: uploadBase64,
        caption: uploadCaption || undefined,
        documentVersion: 'v1.0',
      });
      setIsUploadModalOpen(false);
      setUploadFileName('');
      setUploadCaption('');
      setUploadBase64('');
      await loadData();
      setSuccessMessage('Evidence stored in private object storage and SHA-256 baseline recorded.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Evidence upload failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalateToLegalReview = async () => {
    if (!escalateReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.agreement2.escalate(tradeId, escalateReason);
      setAgreement(res.agreement2 || (res as any).agreement);
      setIsEscalateModalOpen(false);
      setEscalateReason('');
      await loadData();
      setSuccessMessage('Trade contract successfully escalated to Meridian Administrative Legal Review Queue.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Escalation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getClausesForSection = (section: Agreement2Clause['section']) => {
    if (!agreement) return [];
    return agreement.clauses.filter((c) => c.section === section);
  };

  const getPartyApprovalState = (clause: Agreement2Clause) => {
    const buyerApproved = !!clause.buyerApproved;
    const sellerApproved = !!clause.sellerApproved;
    const isRejected = clause.status === 'REJECTED';
    return { buyerApproved, sellerApproved, isRejected };
  };

  const canCurrentPartyApprove = (clause: Agreement2Clause) => {
    if (agreement?.status === 'EXECUTED') return false;
    if (isBuyer) return !clause.buyerApproved;
    if (isSeller) return !clause.sellerApproved;
    if (isAdmin) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
                MERIDIAN AGREEMENT 2 · BILATERAL TRANSACTION CONTRACT
              </span>
              <span className="text-white/20">/</span>
              <span className="font-mono text-xs text-[#999D9B]">{tradeId}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F2] flex items-center gap-3">
              <span>Master Trade Framework & Specialized Schedules</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase ${
                  agreement?.status === 'EXECUTED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : agreement?.status === 'READY_FOR_SIGNING'
                    ? 'bg-[#D7FF43]/10 text-[#D7FF43] border border-[#D7FF43]/30'
                    : agreement?.status === 'LEGAL_REVIEW_REQUIRED'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {agreement?.status || 'INITIALIZING'}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-[#111315] hover:bg-white/5 border border-white/10 rounded-xl text-[#999D9B] hover:text-[#F5F5F2]"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {agreement?.status !== 'LEGAL_REVIEW_REQUIRED' && agreement?.status !== 'EXECUTED' && (
              <button
                onClick={() => setIsEscalateModalOpen(true)}
                className="px-3 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-mono rounded-xl flex items-center gap-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Escalate to Legal Review</span>
              </button>
            )}

            {readiness?.overallPassed && (agreement?.status === 'READY_FOR_SIGNING' || agreement?.status === 'PARTIALLY_SIGNED') && (
              <button
                onClick={() => setIsSignModalOpen(true)}
                className="px-4 py-2 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-[#D7FF43]/20 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Execute Agreement 2</span>
              </button>
            )}

            {agreement && (
              <button
                onClick={() => downloadAgreement2Pdf(agreement)}
                className="px-3.5 py-2 bg-[#111315] hover:bg-white/10 border border-white/10 text-white font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                title="Download Agreement 2 PDF with signatures and SHA-256 digest"
              >
                <Download className="w-3.5 h-3.5 text-[#D7FF43]" />
                <span>Download Agreement 2 PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#111315] rounded-xl border border-white/5 space-y-1">
            <span className="text-[#999D9B] text-[10px] block">Contract Version</span>
            <span className="text-white font-bold">v{agreement?.version || '0.1'}</span>
          </div>
          <div className="p-3 bg-[#111315] rounded-xl border border-white/5 space-y-1">
            <span className="text-[#999D9B] text-[10px] block">SHA-256 Hash</span>
            <span className="text-[#D7FF43] truncate block" title={agreement?.sha256Hash}>
              {agreement?.sha256Hash ? `${agreement.sha256Hash.slice(0, 12)}...` : 'PENDING'}
            </span>
          </div>
          <div className="p-3 bg-[#111315] rounded-xl border border-white/5 space-y-1">
            <span className="text-[#999D9B] text-[10px] block">Readiness Gate</span>
            <span className={readiness?.overallPassed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {readiness ? `${readiness.passedCount} / ${readiness.totalChecks} Passed` : 'Evaluating...'}
            </span>
          </div>
          <div className="p-3 bg-[#111315] rounded-xl border border-white/5 space-y-1">
            <span className="text-[#999D9B] text-[10px] block">Signatures</span>
            <span className="text-white font-bold">
              {agreement?.signatures.buyer ? 'Buyer ✓ ' : 'Buyer ✗ '}
              {agreement?.signatures.seller ? '· Seller ✓' : '· Seller ✗'}
            </span>
          </div>
        </div>

        {/* Legal Review Warning if active */}
        {agreement?.legalReviewRequired && !agreement?.legalReviewCleared && (
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-red-300 font-bold font-mono uppercase">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>Strict Administrative Legal Block Active</span>
            </div>
            <p className="text-red-200 leading-relaxed">
              This transaction was escalated or flagged with unresolved legal/compliance discrepancies: "
              {agreement.legalReviewNotes || 'Discrepancy flagged'}". Finalization and signing are strictly locked
              server-side until cleared by a Meridian Compliance Administrator in the Internal Management Console.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/5 font-mono text-xs">
        {[
          { id: 'full_doc', label: 'Complete Agreement (Full Text & Signatures)', icon: FileText },
          { id: 'readiness', label: `Readiness Gate (${readiness?.passedCount || 0}/14)`, icon: ShieldCheck },
          { id: 'framework', label: 'Framework (Clauses 1–18)', icon: Scale },
          { id: 'schedule_a', label: 'Schedule A (Transaction)', icon: FileText },
          { id: 'schedule_b', label: 'Schedule B (Electronic Agent)', icon: Cpu },
          { id: 'schedule_c', label: 'Schedule C (IoT Telemetry)', icon: Radio },
          { id: 'schedule_d', label: 'Schedule D (Dispute Resolution)', icon: Scale },
          { id: 'execution', label: 'Bilateral Execution Desk', icon: FileCheck2 },
          { id: 'integrity', label: `Evidence & Integrity (${evidenceList.length})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#D7FF43] text-[#08090A] font-bold shadow-md shadow-[#D7FF43]/20'
                  : 'bg-[#171A1C] text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 0: COMPLETE AGREEMENT 2 DOCUMENT & EXECUTION DESK */}
      {activeTab === 'full_doc' && (
        <div className="space-y-8">
          {/* Document Header & Invariants Banner */}
          <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-[#D7FF43] uppercase tracking-wider block">
                  CANONICAL AGREEMENT 2 (VERSION {agreement?.version || '1.0'})
                </span>
                <h3 className="text-lg font-bold text-white">Full Bilateral Contract Instrument</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded bg-black/40 border border-white/10 text-[#D7FF43]">
                  {agreement?.clauses?.length || 59} Clauses Compiled
                </span>
                {agreement && (
                  <button
                    onClick={() => downloadAgreement2Pdf(agreement)}
                    className="px-3.5 py-1.5 bg-[#111315] hover:bg-white/10 border border-white/10 text-white font-mono text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#D7FF43]" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-[#999D9B] leading-relaxed">
              This digital instrument contains the Master Framework and all 4 specialized schedules. Read through the full agreement below, inspect clauses, reach the bilateral execution seals, and sign as authorized corporate representative.
            </p>
          </div>

          {/* Section 1: Framework Clauses */}
          <div className="space-y-4">
            <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Part I: Master Commercial Framework (Clauses 1–18)
                </h3>
                <p className="text-xs text-[#999D9B] mt-0.5">
                  Standard institutional provisions governing electronic orchestration, non-bank disclaimer, and bilateral commitments.
                </p>
              </div>
              <span className="text-xs font-mono text-[#D7FF43]">18 CLAUSES</span>
            </div>
            <div className="space-y-4">
              {getClausesForSection('FRAMEWORK').map((clause) => renderClauseCard(clause))}
            </div>
          </div>

          {/* Section 2: Schedule A */}
          <div className="space-y-4">
            <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Part II: Schedule A — Transaction Specification Schedule
                </h3>
                <p className="text-xs text-[#999D9B] mt-0.5">
                  Core commercial terms: Incoterms 2020, Pricing, Inspection, Quantity, and Delivery Destinations.
                </p>
              </div>
              <span className="text-xs font-mono text-[#D7FF43]">COMMERCIAL TERMS</span>
            </div>
            <div className="space-y-4">
              {getClausesForSection('SCHEDULE_A').map((clause) => renderClauseCard(clause))}
            </div>
          </div>

          {/* Section 3: Schedule B */}
          <div className="space-y-4">
            <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Part III: Schedule B — Electronic Agent & Digital Signature Schedule
                </h3>
                <p className="text-xs text-[#999D9B] mt-0.5">
                  UNCITRAL MLETR 2017 & US ESIGN / EU eIDAS electronic signature compliance.
                </p>
              </div>
              <span className="text-xs font-mono text-[#D7FF43]">DIGITAL SIGNATURES</span>
            </div>
            <div className="space-y-4">
              {getClausesForSection('SCHEDULE_B').map((clause) => renderClauseCard(clause))}
            </div>
          </div>

          {/* Section 4: Schedule C */}
          <div className="space-y-4">
            <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Part IV: Schedule C — IoT Telemetry & Condition Monitoring Protocol
                </h3>
                <p className="text-xs text-[#999D9B] mt-0.5">
                  Technical protocol governing sensor tracking, geofence breaches, and temperature thresholds.
                </p>
              </div>
              <span className="text-xs font-mono text-[#D7FF43]">TELEMETRY PROTOCOL</span>
            </div>
            <div className="space-y-4">
              {getClausesForSection('SCHEDULE_C').map((clause) => renderClauseCard(clause))}
            </div>
          </div>

          {/* Section 5: Schedule D */}
          <div className="space-y-4">
            <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Part V: Schedule D — Multi-Tier Dispute Resolution Schedule
                </h3>
                <p className="text-xs text-[#999D9B] mt-0.5">
                  Governing law (English Law), SIAC institutional arbitration, emergency relief, and conservatory orders.
                </p>
              </div>
              <span className="text-xs font-mono text-[#D7FF43]">DISPUTE PROTOCOL</span>
            </div>
            <div className="space-y-4">
              {getClausesForSection('SCHEDULE_D').map((clause) => renderClauseCard(clause))}
            </div>
          </div>

          {/* Section 6: Bilateral Execution Desk (The Signatures) */}
          <div className="p-8 bg-[#171A1C] border-2 border-[#D7FF43]/30 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="text-[11px] font-mono text-[#D7FF43] uppercase tracking-wider block">
                  PART VI — BILATERAL ELECTRONIC EXECUTION SEALS
                </span>
                <h3 className="text-lg font-bold text-white">Authorized Signatory Affirmation & Cryptographic Seals</h3>
              </div>
              <span
                className={`px-3 py-1 rounded font-mono text-xs font-bold uppercase ${
                  agreement?.status === 'EXECUTED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {agreement?.status}
              </span>
            </div>

            {/* Current SHA-256 Hash Digest */}
            <div className="p-4 bg-[#111315] border border-white/10 rounded-xl space-y-2 text-xs">
              <span className="font-mono text-[10px] text-[#999D9B] uppercase block">
                CANONICAL AGREEMENT 2 SHA-256 HASH DIGEST
              </span>
              <div className="p-3 bg-[#08090A] rounded border border-white/5 font-mono text-[#D7FF43] break-all select-all">
                {agreement?.sha256Hash || 'HASH_GENERATION_PENDING'}
              </div>
            </div>

            {/* Dual Execution Seals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer Seal */}
              <div className="p-5 bg-[#111315] border border-white/5 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#D7FF43] uppercase text-[10px]">Buyer Execution Seal</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      agreement?.signatures.buyer ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#999D9B]'
                    }`}
                  >
                    {agreement?.signatures.buyer ? 'EXECUTED' : 'PENDING'}
                  </span>
                </div>
                {agreement?.signatures.buyer ? (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="text-white font-bold">{agreement.signatures.buyer.authorizedSignerName}</div>
                    <div className="text-[#999D9B]">{agreement.signatures.buyer.signerTitle}</div>
                    <div className="text-[10px] text-emerald-400">
                      Signed: {new Date(agreement.signatures.buyer.signedAtUtc).toUTCString()}
                    </div>
                    {agreement.signatures.buyer.signatureData?.startsWith('data:image/') && (
                      <div className="h-16 bg-black/60 rounded p-1 flex items-center justify-center">
                        <img src={agreement.signatures.buyer.signatureData} alt="Buyer Signature" className="max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[#999D9B] text-[11px]">Awaiting affirmative execution by Buyer Representative.</p>
                    {isBuyer && (agreement?.status === 'READY_FOR_SIGNING' || agreement?.status === 'PARTIALLY_SIGNED') && (
                      <button
                        onClick={() => setIsSignModalOpen(true)}
                        className="w-full py-2 bg-[#D7FF43] text-[#08090A] font-bold rounded-lg text-xs cursor-pointer shadow-md"
                      >
                        Affirm & Sign as Buyer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Seller Seal */}
              <div className="p-5 bg-[#111315] border border-white/5 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#D7FF43] uppercase text-[10px]">Seller Execution Seal</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      agreement?.signatures.seller ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#999D9B]'
                    }`}
                  >
                    {agreement?.signatures.seller ? 'EXECUTED' : 'PENDING'}
                  </span>
                </div>
                {agreement?.signatures.seller ? (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="text-white font-bold">{agreement.signatures.seller.authorizedSignerName}</div>
                    <div className="text-[#999D9B]">{agreement.signatures.seller.signerTitle}</div>
                    <div className="text-[10px] text-emerald-400">
                      Signed: {new Date(agreement.signatures.seller.signedAtUtc).toUTCString()}
                    </div>
                    {agreement.signatures.seller.signatureData?.startsWith('data:image/') && (
                      <div className="h-16 bg-black/60 rounded p-1 flex items-center justify-center">
                        <img src={agreement.signatures.seller.signatureData} alt="Seller Signature" className="max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[#999D9B] text-[11px]">Awaiting affirmative execution by Seller Representative.</p>
                    {isSeller && (agreement?.status === 'READY_FOR_SIGNING' || agreement?.status === 'PARTIALLY_SIGNED') && (
                      <button
                        onClick={() => setIsSignModalOpen(true)}
                        className="w-full py-2 bg-[#D7FF43] text-[#08090A] font-bold rounded-lg text-xs cursor-pointer shadow-md"
                      >
                        Affirm & Sign as Seller
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 7: Continuation Sections Below Signature (Trade Evidence & Verification Vault) */}
          <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[11px] font-mono text-[#D7FF43] uppercase tracking-wider block">
                  PART VII — TRADE EVIDENCE & VERIFICATION VAULT
                </span>
                <h3 className="text-base font-bold text-white">Cryptographic Stored Evidence & Baseline Integrity</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#D7FF43] text-black font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Stored Evidence</span>
              </button>
            </div>
            <p className="text-xs text-[#999D9B]">
              Total {evidenceList.length} persistent evidence files uploaded for trade {tradeId}. Each file is hashed with SHA-256 upon ingest and checked against tampering.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {evidenceList.map((evd) => (
                <div key={evd.id} className="p-3 bg-[#111315] border border-white/5 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#D7FF43] text-[10px] uppercase">{evd.category.replace('_', ' ')}</span>
                    <span className="text-zinc-500 text-[10px]">{(evd.fileSize / 1024).toFixed(0)} KB</span>
                  </div>
                  <div className="text-white font-medium truncate" title={evd.fileName}>{evd.fileName}</div>
                  <div className="text-[10px] font-mono text-zinc-400 truncate">SHA: {evd.sha256Hash.substring(0, 16)}...</div>
                  <button
                    onClick={() => setSelectedEvidenceForModal(evd)}
                    className="w-full mt-1 py-1 text-[11px] bg-white/5 hover:bg-white/10 rounded text-zinc-300 font-sans cursor-pointer"
                  >
                    Verify SHA-256 Hash
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: READINESS GATE INSPECTOR */}
      {activeTab === 'readiness' && (
        <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D7FF43]" />
                <span>Server-Side Readiness Gate Invariant Matrix</span>
              </h3>
              <p className="text-xs text-[#999D9B] mt-1">
                The backend independently verifies all 14 mandatory legal and identity safeguards. Client-side bypass is strictly rejected by server endpoints.
              </p>
            </div>

            {agreement?.status === 'TERMS_NEGOTIATING' && readiness?.overallPassed && (
              <button
                onClick={handleGenerateAgreement}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lock & Generate for Execution</span>
              </button>
            )}
          </div>

          {/* 14 Check Items */}
          <div className="space-y-3">
            {readiness?.items.map((check: ReadinessCheckItem) => (
              <div
                key={check.id}
                className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  check.passed
                    ? 'bg-[#111315] border-white/5'
                    : 'bg-red-950/20 border-red-500/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#999D9B]">INVARIANT {check.id}</span>
                    <span className="text-white font-bold">{check.title}</span>
                  </div>
                  <p className="text-[11px] text-[#999D9B]">{check.code}</p>
                  <p
                    className={`font-mono text-[11px] ${
                      check.passed ? 'text-[#D7FF43]' : 'text-red-300'
                    }`}
                  >
                    Diagnostic: {check.details}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase flex items-center gap-1.5 ${
                      check.passed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {check.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{check.passed ? 'PASSED' : 'BLOCKED'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: FRAMEWORK CLAUSES (1-18) */}
      {activeTab === 'framework' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Meridian Master Trade Framework Agreement (Clauses 1–18)
              </h3>
              <p className="text-xs text-[#999D9B] mt-0.5">
                Standard institutional provisions governing electronic orchestration, non-bank disclaimer, and bilateral commitments.
              </p>
            </div>
            <span className="text-xs font-mono text-[#D7FF43]">18 CLAUSES LOADED</span>
          </div>

          <div className="space-y-4">
            {getClausesForSection('FRAMEWORK').map((clause) => renderClauseCard(clause))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SCHEDULE A */}
      {activeTab === 'schedule_a' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Schedule A — Transaction Specification Schedule
              </h3>
              <p className="text-xs text-[#999D9B] mt-0.5">
                Core commercial terms: Incoterms 2020, Pricing, Inspection, Quantity, and Delivery Destinations.
              </p>
            </div>
            <span className="text-xs font-mono text-[#D7FF43]">COMMERCIAL TERMS</span>
          </div>

          <div className="space-y-4">
            {getClausesForSection('SCHEDULE_A').map((clause) => renderClauseCard(clause))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: SCHEDULE B */}
      {activeTab === 'schedule_b' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Schedule B — Electronic Agent & Digital Signature Schedule
              </h3>
              <p className="text-xs text-[#999D9B] mt-0.5">
                UNCITRAL Model Law on Electronic Transferable Records (MLETR 2017) & US ESIGN / EU eIDAS compliance.
              </p>
            </div>
            <span className="text-xs font-mono text-[#D7FF43]">DIGITAL SIGNATURES</span>
          </div>

          <div className="space-y-4">
            {getClausesForSection('SCHEDULE_B').map((clause) => renderClauseCard(clause))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: SCHEDULE C */}
      {activeTab === 'schedule_c' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Schedule C — IoT Telemetry & Condition-Precedent Monitoring Protocol
              </h3>
              <p className="text-xs text-[#999D9B] mt-0.5">
                Technical protocol governing cryptographic telemetry devices, geofence breaches, and temperature thresholds.
              </p>
            </div>
            <span className="text-xs font-mono text-[#D7FF43]">TELEMETRY PROTOCOL</span>
          </div>

          <div className="space-y-4">
            {getClausesForSection('SCHEDULE_C').map((clause) => renderClauseCard(clause))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: SCHEDULE D */}
      {activeTab === 'schedule_d' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171A1C] border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Schedule D — Multi-Tier Dispute Resolution Schedule
              </h3>
              <p className="text-xs text-[#999D9B] mt-0.5">
                Governing law (English Law), SIAC institutional arbitration, emergency relief, and interim conservatory orders.
              </p>
            </div>
            <span className="text-xs font-mono text-[#D7FF43]">DISPUTE PROTOCOL</span>
          </div>

          <div className="space-y-4">
            {getClausesForSection('SCHEDULE_D').map((clause) => renderClauseCard(clause))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: EXECUTION DESK */}
      {activeTab === 'execution' && (
        <div className="p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#D7FF43]" />
                <span>Bilateral Execution Desk & Tamper-Evident SHA-256 Ledger</span>
              </h3>
              <p className="text-xs text-[#999D9B] mt-1">
                Legal execution requires independent affirmative signature by authorized corporate representatives matching the exact contract hash.
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded font-mono text-xs font-bold uppercase ${
                agreement?.status === 'EXECUTED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {agreement?.status}
            </span>
          </div>

          {/* Current SHA-256 Hash Digest */}
          <div className="p-4 bg-[#111315] border border-white/10 rounded-xl space-y-2 text-xs">
            <span className="font-mono text-[10px] text-[#999D9B] uppercase block">
              CANONICAL AGREEMENT 2 SHA-256 HASH DIGEST
            </span>
            <div className="p-3 bg-[#08090A] rounded border border-white/5 font-mono text-[#D7FF43] break-all select-all">
              {agreement?.sha256Hash || 'HASH_GENERATION_PENDING'}
            </div>
            <p className="text-[11px] text-[#999D9B]">
              Any modification to any clause immediately invalidates this digest and requires new affirmative signatures from both parties.
            </p>
          </div>

          {/* Dual Execution Seals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Buyer Seal */}
            <div className="p-5 bg-[#111315] border border-white/5 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[#D7FF43] uppercase text-[10px]">Buyer Execution Seal</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    agreement?.signatures.buyer ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#999D9B]'
                  }`}
                >
                  {agreement?.signatures.buyer ? 'EXECUTED' : 'PENDING'}
                </span>
              </div>

              {agreement?.signatures.buyer ? (
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="text-white font-bold">{agreement.signatures.buyer.authorizedSignerName}</div>
                  <div className="text-[#999D9B]">{agreement.signatures.buyer.signerTitle}</div>
                  <div className="text-[#999D9B] text-[10px] truncate">
                    Hash Match: {agreement.signatures.buyer.documentVersionHash.slice(0, 20)}...
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Signed at: {new Date(agreement.signatures.buyer.signedAtUtc).toUTCString()}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[#999D9B] text-[11px]">Awaiting affirmative execution by Buyer Representative.</p>
                  {isBuyer && (agreement?.status === 'READY_FOR_SIGNING' || agreement?.status === 'PARTIALLY_SIGNED') && (
                    <button
                      onClick={() => setIsSignModalOpen(true)}
                      className="w-full py-2 bg-[#D7FF43] text-[#08090A] font-bold rounded-lg text-xs"
                    >
                      Affirm & Sign as Buyer
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Seller Seal */}
            <div className="p-5 bg-[#111315] border border-white/5 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[#D7FF43] uppercase text-[10px]">Seller Execution Seal</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    agreement?.signatures.seller ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#999D9B]'
                  }`}
                >
                  {agreement?.signatures.seller ? 'EXECUTED' : 'PENDING'}
                </span>
              </div>

              {agreement?.signatures.seller ? (
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="text-white font-bold">{agreement.signatures.seller.authorizedSignerName}</div>
                  <div className="text-[#999D9B]">{agreement.signatures.seller.signerTitle}</div>
                  <div className="text-[#999D9B] text-[10px] truncate">
                    Hash Match: {agreement.signatures.seller.documentVersionHash.slice(0, 20)}...
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Signed at: {new Date(agreement.signatures.seller.signedAtUtc).toUTCString()}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[#999D9B] text-[11px]">Awaiting affirmative execution by Seller Representative.</p>
                  {isSeller && (agreement?.status === 'READY_FOR_SIGNING' || agreement?.status === 'PARTIALLY_SIGNED') && (
                    <button
                      onClick={() => setIsSignModalOpen(true)}
                      className="w-full py-2 bg-[#D7FF43] text-[#08090A] font-bold rounded-lg text-xs"
                    >
                      Affirm & Sign as Seller
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: EVIDENCE & INTEGRITY DESK */}
      {activeTab === 'integrity' && (
        <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D7FF43]" />
                <span>Trade Evidence & Cryptographic Baseline Registers</span>
              </h3>
              <p className="text-xs text-[#999D9B] mt-1 font-mono">
                Actual uploaded photographs, inspection certificates, and transport bills are held in private persistent object storage with SHA-256 baseline tracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3.5 py-2 bg-[#D7FF43] hover:bg-[#cbf436] text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#D7FF43]/20"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Evidence</span>
              </button>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidenceList.map((evd) => (
              <div
                key={evd.id}
                className="p-4 rounded-xl bg-[#111315] border border-white/10 hover:border-[#D7FF43]/30 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase text-[10px]">
                      {evd.category.replace('_', ' ')}
                    </span>
                    <span className="text-zinc-500 text-[11px]">{(evd.fileSize / 1024).toFixed(1)} KB</span>
                  </div>

                  <div className="h-32 rounded-lg bg-black/60 border border-white/5 overflow-hidden flex items-center justify-center">
                    {evd.mimeType.startsWith('image/') ? (
                      <img src={evd.storageUrl} alt={evd.fileName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-zinc-400">
                        <FileText className="w-8 h-8 text-[#D7FF43]" />
                        <span className="text-[11px] font-mono">{evd.fileName}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs font-mono space-y-1">
                    <div className="font-semibold text-white truncate" title={evd.fileName}>{evd.fileName}</div>
                    {evd.caption && <div className="text-zinc-400 italic text-[11px] line-clamp-1">{evd.caption}</div>}
                    <div className="text-[10px] text-zinc-500 break-all pt-1 border-t border-white/5">
                      Baseline SHA-256: <span className="text-[#D7FF43]">{evd.sha256Hash.substring(0, 16)}...</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(evd.uploadedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedEvidenceForModal(evd)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#D7FF43] text-zinc-300 hover:text-black font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Verify Integrity
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Legal Governance Banner */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-400 font-mono leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#D7FF43] shrink-0 mt-0.5" />
            <div>
              <strong>Cryptographic Baseline Principle:</strong> Raw payloads are stored in private persistent object storage (never inflated in JSON records). SHA-256 verification detects differences against the stored baseline and does not independently establish document authenticity or cargo condition.
            </div>
          </div>
        </div>
      )}

      {/* REJECT CLAUSE MODAL */}
      {rejectClauseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171A1C] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Reject Clause Proposal</span>
              </h3>
              <button
                onClick={() => setRejectClauseTarget(null)}
                className="text-[#999D9B] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-mono text-[#D7FF43] block">
                {rejectClauseTarget.number} — {rejectClauseTarget.title}
              </span>
              <p className="text-[#999D9B]">
                Specify why this wording is unacceptable. The clause will be marked as REJECTED and blocked from entering the final Agreement 2.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (e.g. Incoterm conflict, unacceptable delivery tolerance)..."
                rows={4}
                className="w-full bg-[#111315] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectClauseTarget(null)}
                className="px-4 py-2 text-xs text-[#999D9B] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectClauseSubmit}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROTOTYPE ELECTRONIC SIGNATURE EXECUTION MODAL */}
      {isSignModalOpen && agreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="max-w-2xl w-full space-y-2 my-auto max-h-[92vh] overflow-y-auto pr-1">
            <div className="flex justify-end">
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="px-3 py-1 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <PrototypeSignaturePad
              partyRole={isBuyer ? 'BUYER' : 'SELLER'}
              companyName={organization?.legalName || (isBuyer ? agreement.buyerCompanyName : agreement.sellerCompanyName)}
              representativeName={user?.name || (isBuyer ? 'Elena Vance' : 'Marcus Weber')}
              representativeTitle={isBuyer ? 'Director of Global Procurement' : 'Managing Director & Head of Export'}
              agreementVersion={agreement.version}
              agreementSha256={agreement.sha256Hash}
              isSubmitting={actionLoading}
              onSign={handlePrototypeSign}
            />
          </div>
        </div>
      )}

      {/* UPLOAD EVIDENCE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111315] border border-white/10 rounded-2xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#D7FF43]" />
                <span>Upload Stored Trade Evidence</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadEvidence} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">EVIDENCE CATEGORY</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full bg-[#171A1C] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                >
                  <option value="shipment_photo">Cargo / Container Photograph</option>
                  <option value="inspection_certificate">Quality & Inspection Certificate</option>
                  <option value="bill_of_lading">Bill of Lading / Transport Document</option>
                  <option value="packing_list">Packing List / Weight Certificate</option>
                  <option value="customs_declaration">Customs Export Declaration</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">SELECT FILE (PHOTO OR PDF)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileUploadChange}
                  className="w-full bg-[#171A1C] border border-white/10 rounded-lg p-2 text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#D7FF43] file:text-black file:font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">DESCRIPTION / CAPTION</label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="e.g. Loading inspection at terminal berth 4"
                  className="w-full bg-[#171A1C] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-white/5 text-[11px] text-zinc-400">
                Payload will be placed in persistent private object storage with instantaneous SHA-256 baseline hashing.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadBase64 || actionLoading}
                  className="px-5 py-2 bg-[#D7FF43] text-black font-semibold rounded-xl hover:bg-[#cbf436] disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Uploading...' : 'Save & Compute Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT INTEGRITY MODAL */}
      {selectedEvidenceForModal && (
        <DocumentIntegrityModal
          evidence={selectedEvidenceForModal}
          tradeId={tradeId}
          isOpen={!!selectedEvidenceForModal}
          onClose={() => setSelectedEvidenceForModal(null)}
          onVerificationComplete={loadData}
        />
      )}

      {/* ESCALATE MODAL */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171A1C] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>Escalate to Administrative Legal Review</span>
              </h3>
              <button onClick={() => setIsEscalateModalOpen(false)} className="text-[#999D9B] hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#999D9B]">
                This will trigger a strict server-side freeze on Agreement 2. Neither party will be able to finalize or sign until cleared by a Meridian compliance administrator.
              </p>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="State the regulatory, sanctions, or material contractual issue requiring human legal oversight..."
                rows={4}
                className="w-full bg-[#111315] border border-white/10 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsEscalateModalOpen(false)} className="px-4 py-2 text-xs text-[#999D9B]">Cancel</button>
              <button
                onClick={handleEscalateToLegalReview}
                disabled={!escalateReason.trim() || actionLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderClauseCard(clause: Agreement2Clause) {
    const { buyerApproved, sellerApproved, isRejected } = getPartyApprovalState(clause);
    const isEditing = editingClauseId === clause.id;

    return (
      <div
        key={clause.id}
        className={`p-5 rounded-2xl border transition-all space-y-3 ${
          isRejected
            ? 'bg-red-950/20 border-red-500/30'
            : buyerApproved && sellerApproved
            ? 'bg-[#171A1C] border-[#D7FF43]/30'
            : 'bg-[#171A1C] border-white/10'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-[#D7FF43]">{clause.number}</span>
            <h4 className="text-sm font-bold text-white">{clause.title}</h4>
            {clause.isMandatory && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#999D9B]">
                MANDATORY
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                buyerApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#999D9B]'
              }`}
            >
              Buyer: {buyerApproved ? '✓ Agreed' : 'Pending'}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                sellerApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#999D9B]'
              }`}
            >
              Seller: {sellerApproved ? '✓ Agreed' : 'Pending'}
            </span>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={5}
              className="w-full bg-[#111315] border border-[#D7FF43]/40 rounded-xl p-3 text-xs text-white font-mono focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingClauseId(null)}
                className="px-3 py-1.5 text-xs text-[#999D9B] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveClause(clause.id)}
                disabled={actionLoading}
                className="px-4 py-1.5 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-lg"
              >
                Save & Propose Clause Modification
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#999D9B] leading-relaxed whitespace-pre-line bg-[#111315] p-3.5 rounded-xl border border-white/5 font-mono">
            {clause.content}
          </div>
        )}

        {clause.rejectionReason && (
          <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-300">
            <strong>Rejection Reason:</strong> {clause.rejectionReason}
          </div>
        )}

        {agreement?.status !== 'EXECUTED' && !isEditing && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
            <button
              onClick={() => handleStartEdit(clause)}
              className="text-xs text-[#D7FF43] hover:underline flex items-center gap-1 font-mono"
            >
              <Edit3 className="w-3 h-3" />
              <span>Propose Wording Adjustment</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectClauseTarget(clause)}
                className="px-3 py-1 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-300 rounded-lg text-xs"
              >
                Reject Wording
              </button>

              {canCurrentPartyApprove(clause) && (
                <button
                  onClick={() => handleApproveClause(clause.id)}
                  disabled={actionLoading}
                  className="px-3 py-1 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Clause</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
};
