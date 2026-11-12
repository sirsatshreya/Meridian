import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  FileText,
  DollarSign,
  Truck,
  Camera,
  CheckSquare,
  AlertTriangle,
  History,
  ShieldCheck,
  Award,
  Layers,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Download,
  Eye,
  Sliders,
  Send,
  Lock,
} from 'lucide-react';
import { Agreement2Console } from '../agreement2/Agreement2Console';
import { EvidenceGalleryTab } from '../dashboard/EvidenceGalleryTab';
import { BilateralSignaturesTab } from '../dashboard/BilateralSignaturesTab';
import { Phase5CompletionConsole } from './Phase5CompletionConsole';

interface TradeWorkspaceConsoleProps {
  tradeId: string;
  currentUserRole: 'BUYER' | 'SELLER';
  onBack?: () => void;
  onRefresh?: () => void;
}

type SectionKey =
  | 'overview'
  | 'agreement2'
  | 'negotiation'
  | 'payment'
  | 'shipment'
  | 'evidence'
  | 'inspection'
  | 'disputes'
  | 'audit'
  | 'completion';

export const TradeWorkspaceConsole: React.FC<TradeWorkspaceConsoleProps> = ({
  tradeId,
  currentUserRole,
  onBack,
  onRefresh,
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [trade, setTrade] = useState<any>(null);
  const [agreement2, setAgreement2] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [sentinelAlerts, setSentinelAlerts] = useState<any[]>([]);
  const [paypalOrders, setPaypalOrders] = useState<any[]>([]);
  const [realProofs, setRealProofs] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [handoff, setHandoff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-tabs & modal states
  const [paymentSubTab, setPaymentSubTab] = useState<'PAYPAL_SANDBOX' | 'REAL_COMMERCIAL'>('PAYPAL_SANDBOX');
  const [simulatingTelemetry, setSimulatingTelemetry] = useState(false);
  const [creatingPaypalOrder, setCreatingPaypalOrder] = useState(false);
  const [capturingPaypalOrder, setCapturingPaypalOrder] = useState(false);

  // Real proof upload form
  const [realPayMethod, setRealPayMethod] = useState<'BANK_TRANSFER' | 'WIRE_SWIFT' | 'UPI' | 'OTHER'>('WIRE_SWIFT');
  const [realPayRef, setRealPayRef] = useState('');
  const [realPayAmount, setRealPayAmount] = useState<string>('87500');
  const [realPayNotes, setRealPayNotes] = useState('');
  const [submittingRealProof, setSubmittingRealProof] = useState(false);

  // Inspection form
  const [inspectionDecision, setInspectionDecision] = useState<'ACCEPTED' | 'REJECTED' | 'ADDITIONAL_EVIDENCE_REQUIRED'>('ACCEPTED');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [checklist, setChecklist] = useState({
    cargoIntegrityVerified: true,
    packagingIntact: true,
    temperatureComplianceVerified: true,
    sealsMatched: true,
    quantityMatched: true,
  });
  const [submittingInspection, setSubmittingInspection] = useState(false);

  // Dispute form
  const [disputeSummary, setDisputeSummary] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeClause, setDisputeClause] = useState('clause-5');
  const [disputeResolution, setDisputeResolution] = useState('Option A: 5% price adjustment for transient temperature rise during crane hoist.');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false);
  const [aiEvidenceResult, setAiEvidenceResult] = useState<any>(null);
  const [loadingAiEvidence, setLoadingAiEvidence] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        tradeRes,
        agrRes,
        shpRes,
        alertsRes,
        paypalRes,
        proofsRes,
        inspRes,
        dispRes,
        handoffRes,
      ] = await Promise.all([
        api.trades.getById(tradeId).catch(() => ({ trade: null })),
        api.agreement2.get(tradeId).catch(() => ({ agreement2: null })),
        api.shipment.get(tradeId).catch(() => ({ shipment: null })),
        api.shipment.getSentinelAlerts(tradeId).catch(() => ({ alerts: [] })),
        api.payments.getPayPalOrders(tradeId).catch(() => ({ orders: [] })),
        api.payments.getRealProofs(tradeId).catch(() => ({ proofs: [] })),
        api.inspection.list(tradeId).catch(() => ({ inspections: [] })),
        api.disputes.list(tradeId).catch(() => ({ disputes: [] })),
        api.phase5.getHandoff(tradeId).catch(() => ({ handoff: null })),
      ]);

      if (tradeRes.trade) setTrade(tradeRes.trade);
      if (agrRes.agreement2) setAgreement2(agrRes.agreement2);
      if (shpRes.shipment) setShipment(shpRes.shipment);
      if (alertsRes.alerts) setSentinelAlerts(alertsRes.alerts);
      if (paypalRes.orders) setPaypalOrders(paypalRes.orders);
      if (proofsRes.proofs) setRealProofs(proofsRes.proofs);
      if (inspRes.inspections) setInspections(inspRes.inspections);
      if (dispRes.disputes) setDisputes(dispRes.disputes);
      if (handoffRes.handoff) setHandoff(handoffRes.handoff);
    } catch (err: any) {
      setError(err.message || 'Failed to load trade workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    const paypalStatus = params.get('paypalStatus');
    const paypalToken = params.get('token');
    if (paypalStatus === 'approved' && paypalToken) {
      setActiveSection('payment');
      setPaymentSubTab('PAYPAL_SANDBOX');
      api.payments
        .capturePayPalOrder(tradeId, { orderId: paypalToken })
        .then(() => loadData())
        .catch(() => {});
    }
  }, [tradeId]);

  // PayPal Sandbox actions
  const handleCreatePayPalOrder = async () => {
    try {
      setCreatingPaypalOrder(true);
      setError(null);
      const totalAmount = agreement2
        ? Number(agreement2.clauses.find((c: any) => c.id === 'clause-1')?.content?.match(/\d[\d,.]*/)?.[0]?.replace(/,/g, '') || 87500)
        : trade?.targetPricePerUnit * trade?.quantity || 87500;

      const res = await api.payments.createPayPalOrder(tradeId, {
        amount: totalAmount,
        currency: trade?.currency || 'EUR',
      });

      await loadData();

      // Immediate redirect to PayPal Sandbox Checkout if approval URL is returned
      if (res?.order?.approvalUrl) {
        window.location.href = res.order.approvalUrl;
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize PayPal Sandbox order');
    } finally {
      setCreatingPaypalOrder(false);
    }
  };

  const handleCapturePayPalOrder = async (orderId: string) => {
    try {
      setCapturingPaypalOrder(true);
      await api.payments.capturePayPalOrder(tradeId, {
        orderId,
        payerEmail: 'buyer.sandbox@meridian-trade.test',
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to capture PayPal Sandbox order');
    } finally {
      setCapturingPaypalOrder(false);
    }
  };

  // Real Commercial Payment Proof
  const handleSubmitRealProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realPayRef.trim() || !realPayAmount) return;

    try {
      setSubmittingRealProof(true);
      await api.payments.submitRealProof(tradeId, {
        paymentMethod: realPayMethod,
        claimedAmount: Number(realPayAmount),
        currency: trade?.currency || 'EUR',
        transactionReference: realPayRef.trim(),
        notes: realPayNotes,
        fileName: `SWIFT_ADVICE_${realPayRef.trim().toUpperCase()}.pdf`,
      });
      setRealPayRef('');
      setRealPayNotes('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit commercial payment proof');
    } finally {
      setSubmittingRealProof(false);
    }
  };

  const handleVerifyRealProof = async (proofId: string, decision: 'VERIFIED_BY_AUTHORIZED_REVIEWER' | 'REJECTED_INSUFFICIENT_EVIDENCE') => {
    try {
      await api.payments.verifyRealProof(tradeId, proofId, {
        decision,
        reviewNotes: decision === 'VERIFIED_BY_AUTHORIZED_REVIEWER'
          ? 'Cleared bank reconciliation confirmed via correspondent SWIFT MT103 advice.'
          : 'Insufficient matching reference on beneficiary settlement ledger.',
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Verification update failed');
    }
  };

  // Telemetry Simulator
  const handleSimulateTelemetry = async (eventType: string) => {
    try {
      setSimulatingTelemetry(true);
      await api.shipment.simulateTelemetry(tradeId, eventType);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Telemetry simulation failed');
    } finally {
      setSimulatingTelemetry(false);
    }
  };

  // Inspection
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingInspection(true);
      await api.inspection.submit(tradeId, {
        decision: inspectionDecision,
        observations: inspectionNotes || 'Container inspected at port terminal. Physical bolt seals verified against Ocean Bill of Lading.',
        checklist,
      });
      setInspectionNotes('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit inspection');
    } finally {
      setSubmittingInspection(false);
    }
  };

  const handleRunAiEvidenceAnalysis = async () => {
    try {
      setLoadingAiEvidence(true);
      const res = await api.evidence.aiAnalyze(tradeId);
      setAiEvidenceResult(res.analysis || res);
    } catch (err: any) {
      setError(err.message || 'AI evidence analysis failed');
    } finally {
      setLoadingAiEvidence(false);
    }
  };

  // Disputes
  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeSummary.trim() || !disputeResolution.trim()) return;

    try {
      setSubmittingDispute(true);
      await api.disputes.create(tradeId, {
        issueSummary: disputeSummary.trim(),
        details: disputeDetails.trim(),
        relevantClauseId: disputeClause,
        proposedResolution: disputeResolution.trim(),
      });
      setDisputeSummary('');
      setDisputeDetails('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to lodge dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleAiDisputeAssist = async (disputeId: string) => {
    try {
      setSelectedDisputeId(disputeId);
      setLoadingAiAnalysis(true);
      const res = await api.disputes.aiAssist(tradeId, disputeId);
      setAiAnalysis(res.analysis);
    } catch (err: any) {
      setError(err.message || 'AI assessment failed');
    } finally {
      setLoadingAiAnalysis(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, outcome: 'RESOLVED_BUYER_ACCEPTED' | 'RESOLVED_MUTUAL_AGREEMENT') => {
    try {
      await api.disputes.resolve(tradeId, disputeId, {
        resolutionNotes: 'Bilateral mutual agreement executed under Schedule D. 5% commercial settlement accepted.',
        outcome,
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve dispute');
    }
  };

  const sections: { key: SectionKey; label: string; icon: any }[] = [
    { key: 'overview', label: '1. Trade Overview', icon: Layers },
    { key: 'agreement2', label: '2. Agreement 2', icon: FileText },
    { key: 'negotiation', label: '3. Negotiation History', icon: History },
    { key: 'payment', label: '4. Payment (PayPal & Real)', icon: DollarSign },
    { key: 'shipment', label: '5. Shipment & Telemetry', icon: Truck },
    { key: 'evidence', label: '6. Evidence Gallery', icon: Camera },
    { key: 'inspection', label: '7. Inspection Review', icon: CheckSquare },
    { key: 'disputes', label: '8. Dispute Management', icon: AlertTriangle },
    { key: 'audit', label: '9. Bilateral Signatures', icon: ShieldCheck },
    { key: 'completion', label: '10. Completion Status', icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#111315] border border-white/10 rounded-2xl">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
                TRADE WORKSPACE CONSOLE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-mono">
                {tradeId}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#D7FF43]/20 text-[#D7FF43] font-mono">
                {trade?.status || 'ACTIVE'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#F5F5F2]">
              {trade?.productDescription || 'High-Barrier Multi-Layer Polymer Packaging Film'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadData();
              onRefresh?.();
            }}
            className="px-3.5 py-2 bg-[#171A1C] hover:bg-white/5 border border-white/10 text-xs font-mono text-[#F5F5F2] rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Workspace</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-white hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* 10-Section Navigation Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-thin">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.key;
          return (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#D7FF43] text-[#08090A] font-bold shadow-lg shadow-[#D7FF43]/10'
                  : 'bg-[#111315] text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. TRADE OVERVIEW */}
      {/* ======================================================== */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#111315] border border-white/10 rounded-2xl">
              <span className="text-[11px] font-mono text-[#999D9B] uppercase block mb-1">Trade Progress</span>
              <span className="text-base font-bold text-[#D7FF43]">{trade?.status?.replace(/_/g, ' ') || 'ACTIVE'}</span>
              <p className="text-[11px] text-[#999D9B] mt-1">Bilateral lifecycle orchestration active</p>
            </div>
            <div className="p-4 bg-[#111315] border border-white/10 rounded-2xl">
              <span className="text-[11px] font-mono text-[#999D9B] uppercase block mb-1">Contract Value</span>
              <span className="text-base font-bold text-white">
                {trade?.currency || 'EUR'} {(trade?.targetPricePerUnit * trade?.quantity || 87500).toLocaleString()}
              </span>
              <p className="text-[11px] text-[#999D9B] mt-1">{trade?.quantity || 50000} {trade?.quantityUnit || 'Rolls'}</p>
            </div>
            <div className="p-4 bg-[#111315] border border-white/10 rounded-2xl">
              <span className="text-[11px] font-mono text-[#999D9B] uppercase block mb-1">Agreement 2 Status</span>
              <span className="text-base font-bold text-white">
                {agreement2?.signatures?.buyer && agreement2?.signatures?.seller
                  ? 'EXECUTED (BOTH SIGNED)'
                  : agreement2?.signatures?.buyer || agreement2?.signatures?.seller
                  ? 'PARTIALLY SIGNED'
                  : 'DRAFT IN NEGOTIATION'}
              </span>
              <p className="text-[11px] text-[#999D9B] mt-1">v{agreement2?.version || '1.0'}</p>
            </div>
            <div className="p-4 bg-[#111315] border border-white/10 rounded-2xl">
              <span className="text-[11px] font-mono text-[#999D9B] uppercase block mb-1">Payment Status</span>
              <span className="text-base font-bold text-emerald-400">
                {paypalOrders.some((o) => o.status === 'CAPTURED')
                  ? 'SANDBOX CAPTURED'
                  : realProofs.some((p) => p.status === 'VERIFIED_BY_AUTHORIZED_REVIEWER')
                  ? 'REAL WIRE VERIFIED'
                  : 'PENDING'}
              </span>
              <p className="text-[11px] text-[#999D9B] mt-1">Virtual demo verification recorded</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#D7FF43]" />
                Commercial Terms & Routing
              </h3>
              <div className="space-y-2 text-xs font-mono text-[#999D9B]">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span>Product:</span>
                  <span className="text-white text-right">{trade?.productDescription}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span>HS Code:</span>
                  <span className="text-white">{trade?.hsCode || '3920.10.12'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span>Origin Port:</span>
                  <span className="text-white">Nhava Sheva Port, Mumbai (IN)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span>Destination:</span>
                  <span className="text-white">Hamburg Port, Terminal Altenwerder (DE)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span>Incoterm:</span>
                  <span className="text-white">{trade?.incoterms || 'CIF Hamburg (Incoterms 2020)'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Payment Terms:</span>
                  <span className="text-white">{trade?.paymentTerms || '100% against shipping documents & SGS assay'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D7FF43]" />
                Counterparties & Verification
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#999D9B] block">BUYER ENTITY</span>
                    <span className="text-white font-bold">MERIDIAN DEMO BUYER PVT LTD</span>
                    <span className="text-[11px] text-[#999D9B] block">Mumbai, India (REG: U74999MH2021PTC368921)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">VERIFIED</span>
                </div>

                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#999D9B] block">SELLER ENTITY</span>
                    <span className="text-white font-bold">NEXUS GLOBAL LOGISTICS GMBH</span>
                    <span className="text-[11px] text-[#999D9B] block">Hamburg, Germany (REG: HRB-189422)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AGREEMENT 2 */}
      {/* ======================================================== */}
      {activeSection === 'agreement2' && (
        <div>
          <Agreement2Console
            tradeId={tradeId}
            currentRole={currentUserRole}
            onUpdate={() => loadData()}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. NEGOTIATION HISTORY */}
      {/* ======================================================== */}
      {activeSection === 'negotiation' && (
        <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">Negotiation & Clause History</h3>
              <p className="text-xs text-[#999D9B]">
                Version-controlled bilateral changes to Agreement 2 terms
              </p>
            </div>
            <span className="text-xs font-mono text-[#D7FF43]">Version {agreement2?.version || '1.0'}</span>
          </div>

          <div className="space-y-3">
            {agreement2?.clauses?.map((cl: any) => (
              <div key={cl.id} className="p-4 bg-white/5 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#D7FF43] font-bold">{cl.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    cl.status === 'APPROVED_BY_BOTH'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {cl.status}
                  </span>
                </div>
                <p className="text-white/80 whitespace-pre-line text-[11px]">{cl.content}</p>
                <div className="flex justify-between text-[10px] text-[#999D9B] pt-2 border-t border-white/5">
                  <span>Schedule: {cl.schedule}</span>
                  <span>Buyer: {cl.approvedByBuyer ? '✓ Approved' : 'Pending'} | Seller: {cl.approvedBySeller ? '✓ Approved' : 'Pending'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PAYMENT (PAYPAL SANDBOX & REAL COMMERCIAL PROOF) */}
      {/* ======================================================== */}
      {activeSection === 'payment' && (
        <div className="space-y-6">
          {/* Sub-tab Switcher */}
          <div className="flex gap-2 p-1.5 bg-[#111315] border border-white/10 rounded-xl w-fit">
            <button
              onClick={() => setPaymentSubTab('PAYPAL_SANDBOX')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                paymentSubTab === 'PAYPAL_SANDBOX'
                  ? 'bg-[#D7FF43] text-[#08090A] font-bold'
                  : 'text-[#999D9B] hover:text-white'
              }`}
            >
              PayPal Sandbox (Virtual Demonstration)
            </button>
            <button
              onClick={() => setPaymentSubTab('REAL_COMMERCIAL')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                paymentSubTab === 'REAL_COMMERCIAL'
                  ? 'bg-[#D7FF43] text-[#08090A] font-bold'
                  : 'text-[#999D9B] hover:text-white'
              }`}
            >
              Real Commercial Payments (Wire / SWIFT)
            </button>
          </div>

          {paymentSubTab === 'PAYPAL_SANDBOX' ? (
            <div className="space-y-6">
              {/* Disclaimer Banner */}
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-xs text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-mono uppercase mb-0.5">
                    PAYPAL SANDBOX — VIRTUAL PAYMENT DEMONSTRATION — NO REAL MONEY TRANSFERRED
                  </strong>
                  This transaction operates strictly within the PayPal Sandbox test environment. Virtual orders, approval tokens, and capture responses demonstrate workflow orchestration without moving live funds.
                </div>
              </div>

              {/* Order Controls */}
              <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>PayPal Sandbox Payments Gateway</span>
                      {paypalOrders.some((o) => o.status === 'CAPTURED') ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ PAYMENT CAPTURED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          AWAITING BUYER PAYMENT
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#999D9B] mt-0.5">
                      Agreed contractual price: <strong className="text-white font-mono">{trade?.currency || 'EUR'} {(trade?.targetPricePerUnit * trade?.quantity || 87500).toLocaleString()}</strong> (Agreement 2 Milestone)
                    </p>
                  </div>

                  {/* Prominent PayPal Action Button */}
                  {currentUserRole === 'BUYER' && !paypalOrders.some((o) => o.status === 'CAPTURED') && (
                    <button
                      onClick={handleCreatePayPalOrder}
                      disabled={creatingPaypalOrder}
                      className="px-6 py-3.5 bg-[#FFC439] hover:bg-[#ffb617] disabled:opacity-50 text-[#003087] font-extrabold text-sm rounded-xl flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-[#FFC439]/20 transition-all transform hover:scale-[1.02]"
                      title="Launch PayPal Sandbox Order and Proceed to Checkout"
                    >
                      <svg className="w-5 h-5 fill-[#003087]" viewBox="0 0 24 24">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 6 0h7.625c3.55 0 6.177 1.258 6.46 4.708.23 2.802-1.353 5.485-4.57 6.845-.595.251-1.255.438-1.956.556l-.887 4.542a.641.641 0 0 1-.632.52h-2.93l.635-3.256h-2.67z" />
                      </svg>
                      <span>{creatingPaypalOrder ? 'Connecting to PayPal...' : `Pay ${trade?.currency || 'EUR'} ${(trade?.targetPricePerUnit * trade?.quantity || 87500).toLocaleString()} with PayPal`}</span>
                    </button>
                  )}
                  {currentUserRole !== 'BUYER' && !paypalOrders.some((o) => o.status === 'CAPTURED') && (
                    <div className="text-right">
                      <span className="text-xs text-amber-300 font-mono bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 inline-block">
                        Awaiting Buyer PayPal execution
                      </span>
                    </div>
                  )}
                </div>

                {/* Orders List */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-mono text-[#999D9B] uppercase">Recorded Virtual Sandbox Transactions</h4>
                  {paypalOrders.length === 0 ? (
                    <p className="text-xs text-[#999D9B] italic">No PayPal Sandbox orders created yet.</p>
                  ) : (
                    paypalOrders.map((ord) => (
                      <div key={ord.id} className="p-4 bg-white/5 rounded-xl text-xs font-mono space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[#D7FF43] font-bold">{ord.paypalOrderId}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            ord.status === 'CAPTURED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#999D9B]">
                          <div>Amount: <span className="text-white">{ord.currency} {Number(ord.amount).toLocaleString()}</span></div>
                          <div>Capture Ref: <span className="text-white">{ord.paypalCaptureId || 'Pending'}</span></div>
                          <div>Created: <span className="text-white">{ord.createdAt?.substring(0, 16)}</span></div>
                          <div>Mode: <span className="text-[#D7FF43]">{ord.usedLiveApi ? 'LIVE SANDBOX API' : 'SANDBOX VIRTUAL'}</span></div>
                        </div>
                        {ord.convertedAmount && (
                          <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                            Currency Converted for PayPal Checkout: {ord.amount} {ord.currency} → {ord.convertedAmount} {ord.convertedCurrency} (Rate: {ord.exchangeRate})
                          </div>
                        )}
                        {ord.status !== 'CAPTURED' && (
                          <div className="pt-2 flex flex-wrap gap-3">
                            {ord.approvalUrl && (
                              <a
                                href={ord.approvalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 bg-[#171A1C] hover:bg-white/10 border border-[#D7FF43]/40 text-[#D7FF43] font-bold text-[11px] rounded-lg flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Proceed to PayPal Sandbox Checkout</span>
                              </a>
                            )}
                            <button
                              onClick={() => handleCapturePayPalOrder(ord.id)}
                              disabled={capturingPaypalOrder}
                              className="px-3.5 py-1.5 bg-[#D7FF43] text-[#08090A] font-bold text-[11px] rounded-lg cursor-pointer"
                            >
                              {capturingPaypalOrder ? 'Capturing...' : 'Verify & Capture Sandbox Payment'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Real Payment Notice */}
              <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-2xl text-xs text-blue-200">
                <strong className="block text-blue-300 font-mono uppercase mb-0.5">
                  COMMERCIAL WIRE / SWIFT SETTLEMENT VERIFICATION
                </strong>
                Commercial payment advice and SWIFT MT103 receipts require independent reviewer verification before funds are marked cleared against Agreement 2 Schedule A.
              </div>

              {/* Upload Proof Form */}
              <form onSubmit={handleSubmitRealProof} className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">Submit Commercial Wire / SWIFT Payment Advice</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#999D9B] mb-1">Method</label>
                    <select
                      value={realPayMethod}
                      onChange={(e: any) => setRealPayMethod(e.target.value)}
                      className="w-full bg-[#171A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="WIRE_SWIFT">Bank Wire / SWIFT MT103</option>
                      <option value="BANK_TRANSFER">SEPA / Domestic Transfer</option>
                      <option value="UPI">Authorized Trade UPI</option>
                      <option value="OTHER">Other Settlement Arrangement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#999D9B] mb-1">Transaction Ref / UTR</label>
                    <input
                      type="text"
                      value={realPayRef}
                      onChange={(e) => setRealPayRef(e.target.value)}
                      placeholder="e.g. SWIFT-DEUTDEFF-889421"
                      required
                      className="w-full bg-[#171A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#999D9B] mb-1">Claimed Amount ({trade?.currency || 'EUR'})</label>
                    <input
                      type="number"
                      value={realPayAmount}
                      onChange={(e) => setRealPayAmount(e.target.value)}
                      required
                      className="w-full bg-[#171A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#999D9B] mb-1">Notes / Remittance Details</label>
                  <input
                    type="text"
                    value={realPayNotes}
                    onChange={(e) => setRealPayNotes(e.target.value)}
                    placeholder="Beneficiary: NEXUS GLOBAL LOGISTICS GMBH (Commerzbank Hamburg)"
                    className="w-full bg-[#171A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submittingRealProof}
                    className="px-5 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-50 text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D7FF43]/20"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{submittingRealProof ? 'Submitting...' : 'Upload Settlement Advice'}</span>
                  </button>
                </div>
              </form>

              {/* Real Proofs List */}
              <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
                <h4 className="text-xs font-mono text-[#999D9B] uppercase">Submitted Commercial Settlement Proofs</h4>
                {realProofs.length === 0 ? (
                  <p className="text-xs text-[#999D9B] italic">No commercial wire transfer proofs uploaded.</p>
                ) : (
                  realProofs.map((p) => (
                    <div key={p.id} className="p-4 bg-white/5 rounded-xl text-xs font-mono space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[#D7FF43] font-bold">{p.transactionReference}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          p.status === 'VERIFIED_BY_AUTHORIZED_REVIEWER'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#999D9B]">
                        <div>Amount: <span className="text-white">{p.currency} {Number(p.claimedAmount).toLocaleString()}</span></div>
                        <div>Method: <span className="text-white">{p.paymentMethod}</span></div>
                        <div>SHA-256: <span className="text-white truncate max-w-[120px] inline-block">{p.sha256Hash?.substring(0, 16)}...</span></div>
                        <div>Date: <span className="text-white">{p.submittedAt?.substring(0, 10)}</span></div>
                      </div>
                      {p.status !== 'VERIFIED_BY_AUTHORIZED_REVIEWER' && (
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => handleVerifyRealProof(p.id, 'VERIFIED_BY_AUTHORIZED_REVIEWER')}
                            className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] cursor-pointer"
                          >
                            ✓ Mark Verified by Authorized Reviewer
                          </button>
                          <button
                            onClick={() => handleVerifyRealProof(p.id, 'REJECTED_INSUFFICIENT_EVIDENCE')}
                            className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-[10px] cursor-pointer"
                          >
                            ✗ Reject / Request Evidence
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SHIPMENT & TELEMETRY */}
      {/* ======================================================== */}
      {activeSection === 'shipment' && (
        <div className="space-y-6">
          {/* Telemetry Simulator Notice */}
          <div className="p-4 bg-white/5 border border-[#D7FF43]/20 rounded-2xl text-xs text-[#F5F5F2] flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-mono text-xs text-[#D7FF43] uppercase block font-bold">
                SIMULATED DEMO TELEMETRY — NOT LIVE PHYSICAL SENSOR DATA
              </span>
              <p className="text-[11px] text-[#999D9B] mt-0.5">
                Predefined simulated anomaly triggers demonstrate real-time AI Sentinel contractual threshold monitoring.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSimulateTelemetry('NORMAL')}
                disabled={simulatingTelemetry}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[11px] font-mono rounded cursor-pointer"
              >
                Normal (21.8°C)
              </button>
              <button
                onClick={() => handleSimulateTelemetry('TEMP_SPIKE')}
                disabled={simulatingTelemetry}
                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[11px] font-mono rounded cursor-pointer"
              >
                ⚠ Temp Spike (28.9°C)
              </button>
              <button
                onClick={() => handleSimulateTelemetry('TEMP_NORMAL')}
                disabled={simulatingTelemetry}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono rounded cursor-pointer"
              >
                ✓ Normalized (21.2°C)
              </button>
              <button
                onClick={() => handleSimulateTelemetry('HUMIDITY_ANOMALY')}
                disabled={simulatingTelemetry}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-mono rounded cursor-pointer"
              >
                Humidity (76%)
              </button>
              <button
                onClick={() => handleSimulateTelemetry('DELIVERY_DELAY')}
                disabled={simulatingTelemetry}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[11px] font-mono rounded cursor-pointer"
              >
                Delay (+48h)
              </button>
              <button
                onClick={() => handleSimulateTelemetry('SUCCESSFUL_DELIVERY')}
                disabled={simulatingTelemetry}
                className="px-2.5 py-1 bg-[#D7FF43] text-[#08090A] font-bold text-[11px] font-mono rounded cursor-pointer"
              >
                Arrived Hamburg
              </button>
            </div>
          </div>

          {/* Shipment Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl md:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#D7FF43]" />
                Ocean Consignment Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono text-[#999D9B]">
                <div>Carrier: <span className="text-white block">{shipment?.carrierName}</span></div>
                <div>Bill of Lading: <span className="text-white block">{shipment?.trackingNumber}</span></div>
                <div>Container Number: <span className="text-white block">{shipment?.containerNumber}</span></div>
                <div>Vessel Name: <span className="text-white block">{shipment?.vesselName}</span></div>
                <div>Current Location: <span className="text-white block">{shipment?.lastLocationName}</span></div>
                <div>Status: <span className="text-[#D7FF43] block font-bold">{shipment?.status}</span></div>
              </div>
            </div>

            <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Live Environmental Readings</h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-[#999D9B] font-mono">Temperature</span>
                  <span className={`text-lg font-bold font-mono ${
                    (shipment?.currentTemperatureC || 22) > 25 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {shipment?.currentTemperatureC || 22.4}°C
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-[#999D9B] font-mono">Relative Humidity</span>
                  <span className={`text-lg font-bold font-mono ${
                    (shipment?.currentHumidityPercent || 55) > 65 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {shipment?.currentHumidityPercent || 55}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Sentinel Alerts */}
          <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D7FF43]" />
              AI Sentinel — Threshold Monitoring Logs
            </h3>
            <div className="space-y-3">
              {sentinelAlerts.length === 0 ? (
                <p className="text-xs text-[#999D9B] italic">No active threshold alerts recorded.</p>
              ) : (
                sentinelAlerts.map((alt) => (
                  <div key={alt.id} className="p-4 bg-white/5 rounded-xl text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#D7FF43] font-bold">{alt.eventType}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        alt.severity === 'POTENTIAL_BREACH'
                          ? 'bg-red-500/20 text-red-300'
                          : alt.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-white/90 text-[11px]">{alt.recommendedAction}</p>
                    <div className="flex justify-between text-[10px] text-[#999D9B] pt-2 border-t border-white/5">
                      <span>Threshold: {alt.thresholdValue} | Actual: {alt.actualValue}</span>
                      <span>Clause: {alt.relevantClauseId}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. EVIDENCE GALLERY */}
      {/* ======================================================== */}
      {activeSection === 'evidence' && (
        <div>
          <EvidenceGalleryTab
            tradeId={tradeId}
            currentUserRole={currentUserRole}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. INSPECTION REVIEW */}
      {/* ======================================================== */}
      {activeSection === 'inspection' && (
        <div className="space-y-6">
          <form onSubmit={handleSubmitInspection} className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#D7FF43]" />
              Buyer Inward Inspection & Verification Checklist
            </h3>
            <p className="text-xs text-[#999D9B]">
              Record independent physical receiving observations against Agreement 2 Schedule C specifications.
            </p>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.cargoIntegrityVerified}
                  onChange={(e) => setChecklist({ ...checklist, cargoIntegrityVerified: e.target.checked })}
                  className="rounded text-[#D7FF43]"
                />
                <span>Cargo Integrity Verified — No outer pallet crushing or transit impact damage</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.packagingIntact}
                  onChange={(e) => setChecklist({ ...checklist, packagingIntact: e.target.checked })}
                  className="rounded text-[#D7FF43]"
                />
                <span>Packaging Intact — Multi-layer barrier film shrink-wrap intact with desiccant packs</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.temperatureComplianceVerified}
                  onChange={(e) => setChecklist({ ...checklist, temperatureComplianceVerified: e.target.checked })}
                  className="rounded text-[#D7FF43]"
                />
                <span>Temperature Compliance — Cold chain logs reviewed against 25.0°C contract limit</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.sealsMatched}
                  onChange={(e) => setChecklist({ ...checklist, sealsMatched: e.target.checked })}
                  className="rounded text-[#D7FF43]"
                />
                <span>Seals Matched — ISO 17712 bolt seal number matches Ocean Bill of Lading exactly</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-mono text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.quantityMatched}
                  onChange={(e) => setChecklist({ ...checklist, quantityMatched: e.target.checked })}
                  className="rounded text-[#D7FF43]"
                />
                <span>Quantity Verified — 50,000 packaging film rolls tallied on 20 standard EUR-pallets</span>
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-mono text-[#999D9B] mb-1">Inspector Notes & Observations</label>
              <textarea
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                rows={3}
                placeholder="Observed minor outer carton humidity stain on pallet row 4; SGS Grade A certificate verified."
                className="w-full bg-[#171A1C] border border-white/10 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInspectionDecision('ACCEPTED')}
                  className={`px-3 py-1.5 rounded text-xs font-mono cursor-pointer ${
                    inspectionDecision === 'ACCEPTED' ? 'bg-emerald-500 text-black font-bold' : 'bg-white/10 text-white'
                  }`}
                >
                  ✓ ACCEPT CARGO
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionDecision('REJECTED')}
                  className={`px-3 py-1.5 rounded text-xs font-mono cursor-pointer ${
                    inspectionDecision === 'REJECTED' ? 'bg-red-500 text-white font-bold' : 'bg-white/10 text-white'
                  }`}
                >
                  ✗ REJECT / LODGE DISPUTE
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionDecision('ADDITIONAL_EVIDENCE_REQUIRED')}
                  className={`px-3 py-1.5 rounded text-xs font-mono cursor-pointer ${
                    inspectionDecision === 'ADDITIONAL_EVIDENCE_REQUIRED' ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-white'
                  }`}
                >
                  ? REQUEST EVIDENCE
                </button>
              </div>

              <button
                type="submit"
                disabled={submittingInspection}
                className="px-5 py-2 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-50 text-[#08090A] font-bold text-xs rounded-xl cursor-pointer"
              >
                {submittingInspection ? 'Submitting...' : 'Record Inspection Result'}
              </button>
            </div>
          </form>

          {/* AI Evidence Analysis Card */}
          <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D7FF43]" />
                  AI Evidence & Telemetry Verification Assistant
                </h4>
                <p className="text-xs text-[#999D9B] mt-0.5">
                  Cross-checks uploaded shipment photos, certificates, and telemetry logs against Agreement 2 Schedule C tolerances.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunAiEvidenceAnalysis}
                disabled={loadingAiEvidence}
                className="px-4 py-2 bg-[#D7FF43]/10 hover:bg-[#D7FF43]/20 border border-[#D7FF43]/40 text-[#D7FF43] font-mono font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingAiEvidence ? 'Analyzing Evidence...' : 'Run AI Evidence Analysis'}</span>
              </button>
            </div>

            {aiEvidenceResult && (
              <div className="p-4 bg-white/5 border border-[#D7FF43]/20 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#D7FF43] font-bold">
                    RECOMMENDATION: {aiEvidenceResult.recommendation || 'REVIEW_COMPLETED'}
                  </span>
                  <span className="text-[10px] text-[#999D9B]">
                    Model: {aiEvidenceResult.model || 'gemini-2.5-flash'}
                  </span>
                </div>
                <p className="text-white/90 text-[11px] leading-relaxed">{aiEvidenceResult.summary}</p>
                {Array.isArray(aiEvidenceResult.findings) && aiEvidenceResult.findings.length > 0 && (
                  <ul className="list-disc pl-5 text-[11px] text-[#999D9B] space-y-1">
                    {aiEvidenceResult.findings.map((f: string, idx: number) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                )}
                <div className="text-[10px] text-amber-300 italic pt-1 border-t border-white/5">
                  {aiEvidenceResult.disclaimer || 'AI-generated operational assistance only. Does not constitute legal advice or definitive proof.'}
                </div>
              </div>
            )}
          </div>

          {/* Past Inspection Records */}
          <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
            <h4 className="text-xs font-mono text-[#999D9B] uppercase">Recorded Inspections</h4>
            {inspections.length === 0 ? (
              <p className="text-xs text-[#999D9B] italic">No inspection results recorded yet.</p>
            ) : (
              inspections.map((ins) => (
                <div key={ins.id} className="p-4 bg-white/5 rounded-xl text-xs font-mono space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#D7FF43] font-bold">{ins.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      ins.decision === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {ins.decision}
                    </span>
                  </div>
                  <p className="text-white/90 text-[11px]">{ins.observations}</p>
                  <div className="flex justify-between text-[10px] text-[#999D9B] pt-2 border-t border-white/5">
                    <span>Inspector: {ins.inspectorUserId}</span>
                    <span>Date: {ins.inspectedAt?.substring(0, 16)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. DISPUTES */}
      {/* ======================================================== */}
      {activeSection === 'disputes' && (
        <div className="space-y-6">
          {/* File Dispute Form */}
          <form onSubmit={handleCreateDispute} className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Lodge Internal Commercial Dispute
            </h3>
            <p className="text-xs text-[#999D9B]">
              Initiates bilateral dispute workflow linked to Agreement 2 Schedule D.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#999D9B] mb-1">Issue Summary</label>
                <input
                  type="text"
                  value={disputeSummary}
                  onChange={(e) => setDisputeSummary(e.target.value)}
                  placeholder="e.g. Transient temperature spike observed at port transfer"
                  required
                  className="w-full bg-[#171A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#999D9B] mb-1">Relevant Agreement 2 Clause</label>
                <select
                  value={disputeClause}
                  onChange={(e) => setDisputeClause(e.target.value)}
                  className="w-full bg-[#171A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="clause-5">Schedule C — Clause 5 (Cold Chain & Quality Tolerances)</option>
                  <option value="clause-4">Schedule B — Clause 4 (Delivery Window & Demurrage)</option>
                  <option value="clause-1">Schedule A — Clause 1 (Commercial Terms & Pricing)</option>
                  <option value="clause-6">Schedule D — Clause 6 (Dispute Resolution & Governing Law)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#999D9B] mb-1">Proposed Resolution</label>
              <input
                type="text"
                value={disputeResolution}
                onChange={(e) => setDisputeResolution(e.target.value)}
                placeholder="Option A: 5% credit note against final invoice for outer carton repackaging"
                required
                className="w-full bg-[#171A1C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingDispute}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-[#08090A] font-bold text-xs rounded-xl cursor-pointer"
              >
                {submittingDispute ? 'Lodging...' : 'Lodge Dispute Case'}
              </button>
            </div>
          </form>

          {/* Active Disputes */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-[#999D9B] uppercase">Dispute Records & Bilateral Resolutions</h4>
            {disputes.length === 0 ? (
              <p className="text-xs text-[#999D9B] italic">No active or historical disputes recorded.</p>
            ) : (
              disputes.map((disp) => (
                <div key={disp.id} className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-[#D7FF43] font-bold">{disp.id}</span>
                      <h4 className="text-sm font-bold text-white">{disp.issueSummary}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-xs font-mono ${
                      disp.status.includes('RESOLVED')
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {disp.status}
                    </span>
                  </div>

                  <p className="text-xs text-white/80">{disp.details || disp.proposedResolution}</p>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleAiDisputeAssist(disp.id)}
                      className="px-3 py-1.5 bg-[#D7FF43]/10 hover:bg-[#D7FF43]/20 text-[#D7FF43] border border-[#D7FF43]/30 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{loadingAiAnalysis && selectedDisputeId === disp.id ? 'Analyzing...' : 'AI Dispute Resolution Assessment'}</span>
                    </button>

                    {disp.status !== 'RESOLVED_MUTUAL_AGREEMENT' && (
                      <button
                        onClick={() => handleResolveDispute(disp.id, 'RESOLVED_MUTUAL_AGREEMENT')}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono cursor-pointer"
                      >
                        ✓ Accept Mutual Resolution Agreement
                      </button>
                    )}
                  </div>

                  {/* AI Analysis Preview */}
                  {selectedDisputeId === disp.id && aiAnalysis && (
                    <div className="p-4 bg-white/5 border border-[#D7FF43]/20 rounded-xl space-y-3 text-xs font-mono">
                      <div className="text-[#D7FF43] font-bold uppercase">AI Contractual Dispute Evaluation</div>
                      <div className="text-white/80 text-[11px] leading-relaxed">
                        {aiAnalysis.draftMutualResolutionText}
                      </div>
                      <div className="text-[10px] text-amber-300 italic">
                        {aiAnalysis.disclaimer}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. BILATERAL SIGNATURES */}
      {/* ======================================================== */}
      {activeSection === 'audit' && (
        <div className="space-y-6">
          <BilateralSignaturesTab tradeId={tradeId} userRole={currentUserRole} />
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. PHASE 5 FINAL TRADE COMPLETION & DOSSIER */}
      {/* ======================================================== */}
      {activeSection === 'completion' && (
        <Phase5CompletionConsole
          tradeId={tradeId}
          currentUserRole={currentUserRole}
          onRefresh={loadData}
          onNavigate={(route) => {
            window.history.pushState({}, '', route);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        />
      )}
    </div>
  );
};
