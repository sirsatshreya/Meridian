import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Building,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  Lock,
  DollarSign,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Phase5CompletionRecord } from '../../types';
import { generateFinalCompletionCertificatePdf } from '../../utils/pdfGenerator';

interface Phase5CompletionConsoleProps {
  tradeId: string;
  currentUserRole: 'BUYER' | 'SELLER';
  onRefresh?: () => void;
  onNavigate?: (route: string) => void;
}

export const Phase5CompletionConsole: React.FC<Phase5CompletionConsoleProps> = ({
  tradeId,
  currentUserRole,
  onRefresh,
  onNavigate,
}) => {
  const { user, organization } = useAuth();

  const [completion, setCompletion] = useState<Phase5CompletionRecord | null>(null);
  const [dossierData, setDossierData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Review submission state
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Signature Pad state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [signerName, setSignerName] = useState(user?.name || '');
  const [signerTitle, setSignerTitle] = useState(
    currentUserRole === 'BUYER' ? 'Head of Global Procurement' : 'VP of International Sales & Logistics'
  );
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [submittingSig, setSubmittingSig] = useState(false);

  // PDF Generation State
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [compRes, dosRes] = await Promise.all([
        api.phase5.getStatus(tradeId),
        api.phase5.getDossierData(tradeId),
      ]);
      setCompletion(compRes.completion);
      setDossierData(dosRes.dossier);
    } catch (err: any) {
      setError(err.message || 'Failed to load Phase 5 trade closure record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tradeId]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#D7FF43';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Submit Review
  const handleSubmitReview = async (approved: boolean) => {
    try {
      setSubmittingReview(true);
      setError(null);
      const res = await api.phase5.submitReview(tradeId, {
        approved,
        notes: reviewNotes,
      });
      setCompletion(res.completion);
      setActionSuccessMsg(
        approved
          ? 'Phase 5 trade review approved. Proceeding to execution signatures.'
          : 'Revisions requested. Notified counterparty to review.'
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to submit trade review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit Signature
  const handleSubmitSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentConfirmed) {
      setError('Please review and check the legal acknowledgement confirmation.');
      return;
    }
    if (!hasDrawnSignature) {
      setError('Please draw your electronic signature representation in the box.');
      return;
    }

    try {
      setSubmittingSig(true);
      setError(null);

      const canvas = canvasRef.current;
      const signatureData = canvas ? canvas.toDataURL('image/png') : undefined;

      const res = await api.phase5.submitSignature(tradeId, {
        signerName,
        signerTitle,
        signatureData,
        signatureMethod: 'PROTOTYPE_CANVAS',
        consentConfirmed: true,
      });

      setCompletion(res.completion);
      setActionSuccessMsg('Your bilateral completion signature has been securely recorded!');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to record completion signature');
    } finally {
      setSubmittingSig(false);
    }
  };

  // Generate & Download PDF
  const handleDownloadFinalPdf = async () => {
    if (!dossierData) return;

    try {
      setGeneratingPdf(true);

      // Fetch photo evidence as data URLs for embedding in PDF
      const evidenceDataUrls: Record<string, string> = {};
      const photoEvidence = (dossierData.evidenceList || []).filter(
        (e: any) => e.category === 'shipment_photo' || e.fileName.match(/\.(png|jpg|jpeg|webp)$/i)
      );

      for (const ev of photoEvidence) {
        try {
          const res = await fetch(`/api/storage/${ev.storageKey}`);
          if (res.ok) {
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            evidenceDataUrls[ev.id] = dataUrl;
          }
        } catch {
          // ignore individual failed photo fetch
        }
      }

      const generated = await generateFinalCompletionCertificatePdf({
        trade: dossierData.trade,
        agreement2: dossierData.agreement2,
        completion,
        buyerOrg: dossierData.buyerOrg,
        sellerOrg: dossierData.sellerOrg,
        paypalOrders: dossierData.paypalOrders,
        realProofs: dossierData.realProofs,
        shipment: dossierData.shipment,
        evidenceList: dossierData.evidenceList,
        telemetry: dossierData.telemetry,
        inspections: dossierData.inspections,
        disputes: dossierData.disputes,
        evidenceDataUrls,
        saveToFile: true,
      });

      // Register generated PDF with backend object storage
      if (generated.dataUrl) {
        await api.phase5.saveCertificate(tradeId, {
          pdfBase64: generated.dataUrl,
        }).catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to compile final trade completion PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-[#111315] border border-white/10 rounded-2xl space-y-4">
        <RefreshCw className="w-8 h-8 text-[#D7FF43] animate-spin mx-auto" />
        <h3 className="text-base font-bold text-white">Compiling Phase 5 Trade Closure Audit...</h3>
        <p className="text-xs text-[#999D9B] font-mono">
          Verifying Agreement 2 seals, PayPal milestone captures, IoT telemetry digests, and bilateral reviews.
        </p>
      </div>
    );
  }

  const isCompleted = completion?.status === 'COMPLETED';
  const myParty = currentUserRole === 'BUYER' ? 'BUYER' : 'SELLER';
  const myReview = currentUserRole === 'BUYER' ? completion?.buyerReview : completion?.sellerReview;
  const counterReview = currentUserRole === 'BUYER' ? completion?.sellerReview : completion?.buyerReview;
  const mySignature = currentUserRole === 'BUYER' ? completion?.buyerSignature : completion?.sellerSignature;
  const counterSignature = currentUserRole === 'BUYER' ? completion?.sellerSignature : completion?.buyerSignature;
  const bothReviewsApproved = completion?.buyerReview?.status === 'APPROVED' && completion?.sellerReview?.status === 'APPROVED';

  return (
    <div className="space-y-8 font-sans">
      {/* Alert / Notification Messages */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. DEAL COMPLETED! CELEBRATION EXPERIENCE SCREEN */}
      {/* ======================================================== */}
      {isCompleted && (
        <div className="p-8 sm:p-10 bg-gradient-to-b from-[#111315] via-[#14181B] to-[#0D1012] border-2 border-[#D7FF43]/40 rounded-3xl space-y-8 shadow-2xl shadow-[#D7FF43]/10 relative overflow-hidden">
          {/* Subtle Glow Backdrop */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D7FF43]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Heading & Badge */}
          <div className="text-center space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D7FF43]/10 border border-[#D7FF43]/30 text-[#D7FF43] font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Success state — Trade Lifecycle Closed</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              DEAL COMPLETED! 🎉
            </h1>

            <p className="text-base sm:text-lg text-[#D7FF43] font-medium max-w-2xl mx-auto">
              Congratulations! Your trade journey has been successfully completed on Meridian.
            </p>

            <p className="text-xs sm:text-sm text-[#999D9B] max-w-xl mx-auto">
              Both parties have reviewed and acknowledged the final trade completion record. Your final trade documentation and completion certificate are ready.
            </p>
          </div>

          {/* Key Facts Summary Card */}
          <div className="p-6 bg-black/40 border border-white/10 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#999D9B] block text-[10px]">TRADE IDENTIFIER</span>
              <span className="text-white font-bold">{tradeId}</span>
            </div>
            <div>
              <span className="text-[#999D9B] block text-[10px]">FINAL SETTLED VALUE</span>
              <span className="text-[#D7FF43] font-bold">
                {dossierData?.trade?.currency || 'EUR'} {(dossierData?.trade?.targetPricePerUnit * dossierData?.trade?.quantity || 87500).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#999D9B] block text-[10px]">PAYMENT CLEARANCE</span>
              <span className="text-emerald-400 font-bold">✓ VERIFIED & CAPTURED</span>
            </div>
            <div>
              <span className="text-[#999D9B] block text-[10px]">CLOSING CERTIFICATE REF</span>
              <span className="text-white font-bold truncate block">{completion?.id}</span>
            </div>
          </div>

          {/* Two Signature Seals Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white/5 border border-emerald-500/30 rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Buyer Final Seal Recorded
                </span>
                <span className="text-[10px] text-[#999D9B]">{completion?.buyerSignature?.receiptCode}</span>
              </div>
              <p className="text-white font-sans text-sm font-semibold">
                {completion?.buyerSignature?.companyName || dossierData?.buyerOrg?.legalName}
              </p>
              <p className="text-xs text-[#999D9B]">
                Signatory: <span className="text-zinc-300">{completion?.buyerSignature?.signerName}</span> ({completion?.buyerSignature?.signerTitle})
              </p>
              <p className="text-[10px] text-zinc-500">
                Signed UTC: {completion?.buyerSignature?.signedAtUtc?.substring(0, 19).replace('T', ' ')}
              </p>
            </div>

            <div className="p-5 bg-white/5 border border-emerald-500/30 rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Seller Final Seal Recorded
                </span>
                <span className="text-[10px] text-[#999D9B]">{completion?.sellerSignature?.receiptCode}</span>
              </div>
              <p className="text-white font-sans text-sm font-semibold">
                {completion?.sellerSignature?.companyName || dossierData?.sellerOrg?.legalName}
              </p>
              <p className="text-xs text-[#999D9B]">
                Signatory: <span className="text-zinc-300">{completion?.sellerSignature?.signerName}</span> ({completion?.sellerSignature?.signerTitle})
              </p>
              <p className="text-[10px] text-zinc-500">
                Signed UTC: {completion?.sellerSignature?.signedAtUtc?.substring(0, 19).replace('T', ' ')}
              </p>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/10">
            <button
              onClick={handleDownloadFinalPdf}
              disabled={generatingPdf}
              className="px-6 py-3.5 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D7FF43]/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{generatingPdf ? 'Compiling Official Signed PDF...' : 'Download Final Trade Completion PDF'}</span>
            </button>

            <button
              onClick={() => (onNavigate ? onNavigate(currentUserRole === 'BUYER' ? '/buyer/home' : '/seller/home') : window.location.assign('/'))}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium text-xs rounded-xl flex items-center gap-2 cursor-pointer border border-white/10"
            >
              <Building className="w-4 h-4 text-[#D7FF43]" />
              <span>Return to Dashboard</span>
            </button>
          </div>

          {/* Final Governance Note */}
          <div className="text-center text-[11px] text-[#999D9B] pt-2">
            "Congratulations! Your trade has been successfully completed and documented on Meridian. Both parties' acknowledgements, the final trade summary and final completion documentation have been securely recorded."
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. LIVE READINESS AUDIT CHECKLIST (7 POINTS) */}
      {/* ======================================================== */}
      <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-[#D7FF43] uppercase tracking-wider block">
              PHASE 5 READINESS GATEWAY
            </span>
            <h3 className="text-lg font-bold text-white">Trade Closure Pre-Requisite Verification</h3>
            <p className="text-xs text-[#999D9B]">
              Every commercial prerequisite must be independently verified by the platform before completion.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                completion?.overallReadinessPassed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {completion?.overallReadinessPassed ? '✓ 7/7 PREREQUISITES PASSED' : 'PREREQUISITES OUTSTANDING'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs font-mono">
          {(completion?.readinessChecks || []).map((check) => (
            <div
              key={check.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                check.passed
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-zinc-300'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-white">{check.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${check.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {check.passed ? 'PASSED' : 'PENDING'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">{check.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INDEPENDENT BILATERAL REVIEW SECTION */}
      {/* ======================================================== */}
      <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-6">
        <div>
          <span className="text-xs font-mono text-[#D7FF43] uppercase tracking-wider block">
            STEP 1 — INDEPENDENT BILATERAL REVIEWS
          </span>
          <h3 className="text-lg font-bold text-white">Buyer & Seller Trade Closing Review</h3>
          <p className="text-xs text-[#999D9B]">
            Both parties must independently inspect the payment summary, carrier delivery logs, and photo evidence. Silence does not count as consent.
          </p>
        </div>

        {/* Current Review States */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">BUYER REVIEW DISPOSITION</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  completion?.buyerReview?.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {completion?.buyerReview?.status || 'PENDING_REVIEW'}
              </span>
            </div>
            <p className="text-[#999D9B] text-[11px]">
              Reviewer: <span className="text-white">{completion?.buyerReview?.reviewerName || 'Awaiting buyer submission'}</span>
            </p>
            {completion?.buyerReview?.notes && (
              <p className="text-zinc-300 italic text-[11px]">"{completion.buyerReview.notes}"</p>
            )}
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">SELLER REVIEW DISPOSITION</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  completion?.sellerReview?.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {completion?.sellerReview?.status || 'PENDING_REVIEW'}
              </span>
            </div>
            <p className="text-[#999D9B] text-[11px]">
              Reviewer: <span className="text-white">{completion?.sellerReview?.reviewerName || 'Awaiting seller submission'}</span>
            </p>
            {completion?.sellerReview?.notes && (
              <p className="text-zinc-300 italic text-[11px]">"{completion.sellerReview.notes}"</p>
            )}
          </div>
        </div>

        {/* User's Review Controls if not approved or wants revision */}
        {myReview?.status !== 'APPROVED' && !isCompleted && (
          <div className="p-5 bg-black/40 border border-white/10 rounded-xl space-y-3">
            <h4 className="text-xs font-mono font-bold text-[#D7FF43] uppercase">
              Submit Your ({myParty}) Review Disposition
            </h4>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add optional notes, confirmation remarks, or specific points for mutual review..."
              className="w-full h-20 bg-[#171A1C] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF43]"
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleSubmitReview(true)}
                disabled={submittingReview}
                className="px-5 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D7FF43]/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingReview ? 'Submitting...' : 'Approve Final Trade Record'}</span>
              </button>

              <button
                onClick={() => handleSubmitReview(false)}
                disabled={submittingReview}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                <span>Request Revisions / Record Concern</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. DEDICATED BILATERAL SIGNATURE EXECUTION DESK */}
      {/* ======================================================== */}
      {!isCompleted && (
        <div className="p-6 bg-[#111315] border border-white/10 rounded-2xl space-y-6">
          <div>
            <span className="text-xs font-mono text-[#D7FF43] uppercase tracking-wider block">
              STEP 2 — BILATERAL DIGITAL EXECUTION
            </span>
            <h3 className="text-lg font-bold text-white">Final Trade Completion Acknowledgement</h3>
            <p className="text-xs text-[#999D9B]">
              Both parties must independently execute closing digital seals. This creates the permanent completion certificate referencing Agreement 2.
            </p>
          </div>

          {/* Counterparty Status Notice */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs font-mono flex items-center justify-between">
            <span>Counterparty Signature Status:</span>
            <span className={counterSignature ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {counterSignature ? `✓ SIGNED by ${counterSignature.signerName}` : 'PENDING COUNTERPARTY SIGNATURE'}
            </span>
          </div>

          {/* User's Signing Desk */}
          {mySignature ? (
            <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Your Electronic Seal Has Been Recorded
              </span>
              <p className="text-white text-sm font-semibold">
                Signatory: {mySignature.signerName} ({mySignature.signerTitle})
              </p>
              <p className="text-[#999D9B]">Receipt Code: {mySignature.receiptCode}</p>
              <p className="text-zinc-500">Signed UTC: {mySignature.signedAtUtc}</p>
              {!counterSignature && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg text-amber-300">
                  Waiting for counterparty to execute their final closing seal. Once both seals are placed, the Deal Completed celebration screen will unlock automatically.
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitSignature} className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#999D9B] mb-1">
                    Authorized Signatory Full Name
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    required
                    className="w-full bg-[#171A1C] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#999D9B] mb-1">
                    Signatory Corporate Designation / Role
                  </label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    required
                    className="w-full bg-[#171A1C] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>
              </div>

              {/* Signature Pad Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-[#999D9B]">
                    Draw Electronic Signature Representation (Cursor or Touchscreen)
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs text-amber-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear & Redraw
                  </button>
                </div>

                <div className="border border-white/20 rounded-xl overflow-hidden bg-[#08090A] relative">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={150}
                    className="w-full h-36 cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasDrawnSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-600 text-xs font-mono">
                      Draw your signature inside this box
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Consent Checkbox */}
              <label className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 accent-[#D7FF43] w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-zinc-300 leading-relaxed font-sans">
                  I confirm that I am an authorized corporate representative of{' '}
                  <strong className="text-white">{organization?.legalName || 'my company'}</strong>. I have reviewed
                  the complete trade record, verified payment advice, logistics manifest, and quality inspection. I
                  execute this bilateral completion acknowledgement under governing Agreement 2.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingSig || !consentConfirmed || !hasDrawnSignature || !bothReviewsApproved}
                className="w-full py-3.5 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-50 text-[#08090A] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D7FF43]/20"
              >
                <Award className="w-4 h-4" />
                <span>
                  {submittingSig
                    ? 'Recording Digital Seal...'
                    : !bothReviewsApproved
                    ? 'Both Parties Must Approve Review First'
                    : 'Sign & Finalize Bilateral Completion Record'}
                </span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
