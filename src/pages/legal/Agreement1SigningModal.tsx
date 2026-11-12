import React, { useState } from 'react';
import { api } from '../../services/api';
import { LEGAL_DOCUMENTS } from '../../server/legalDocumentsData';
import { AgreementAcceptance } from '../../types';
import { ShieldAlert, FileText, CheckCircle2, Download, X, ExternalLink, Lock, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrototypeSignaturePad } from '../../components/trades/PrototypeSignaturePad';
import { downloadAgreement1Pdf } from '../../utils/pdfGenerator';

interface Agreement1SigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (acceptance: AgreementAcceptance) => void;
  onSigned?: (acceptance?: AgreementAcceptance) => void;
  defaultRepresentative?: string;
  defaultDesignation?: string;
  companyName?: string;
  partyRole?: 'BUYER' | 'SELLER';
}

export const Agreement1SigningModal: React.FC<Agreement1SigningModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSigned,
  defaultRepresentative = '',
  defaultDesignation = '',
  companyName = 'Commercial Enterprise',
  partyRole = 'BUYER',
}) => {
  const masterDoc = LEGAL_DOCUMENTS[0]; // 01_Meridian_Master_Platform_Terms.pdf

  const [repName, setRepName] = useState(defaultRepresentative);
  const [designation, setDesignation] = useState(defaultDesignation);
  const [declaredAuthority, setDeclaredAuthority] = useState(false);
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureRecord, setSignatureRecord] = useState<{
    signatureMethod: string;
    signatureData: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedAcceptance, setCompletedAcceptance] = useState<AgreementAcceptance | null>(null);

  if (!isOpen) return null;

  const handleSignatureSubmission = async (sig: {
    signatureMethod: 'PROTOTYPE_CANVAS' | 'PROTOTYPE_TYPED';
    signatureData: string;
    signerName: string;
    signerTitle: string;
    disclaimerText: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      // 1. Acknowledge privacy notice separately
      await api.legal.acknowledgePrivacy();

      // 2. Accept Agreement 1
      const res = await api.legal.acceptAgreement1({
        authorizedRepresentative: sig.signerName.trim() || repName.trim(),
        designation: sig.signerTitle.trim() || designation.trim(),
        signatureMethod: sig.signatureMethod,
        signatureData: sig.signatureData,
      });

      setSignatureRecord({
        signatureMethod: sig.signatureMethod,
        signatureData: sig.signatureData,
      });
      setCompletedAcceptance(res.acceptance);
      onSuccess?.(res.acceptance);
      onSigned?.(res.acceptance);
    } catch (err: any) {
      setError(err.message || 'Failed to submit agreement acceptance.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!repName.trim() || !designation.trim()) {
      setError('Please provide the authorized representative full name and official corporate title.');
      return;
    }
    if (!declaredAuthority) {
      setError('Affirmative confirmation of signing authority is required to bind your entity.');
      return;
    }
    if (!acknowledgedPrivacy) {
      setError('Please acknowledge the separate Meridian Privacy Notice.');
      return;
    }

    // Advance to interactive canvas signature pad
    setShowSignaturePad(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#08090A]/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-[#171A1C] border border-white/10 rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#111315]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#171A1C] border border-white/10 rounded-lg text-[#D7FF43]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
                    PRIMARY AGREEMENT 1
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                    DEMO ACCEPTANCE MODE
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#F5F5F2]">
                  Meridian Platform Agreement
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mandatory Draft Notice Banner */}
          <div className="p-3.5 bg-amber-950/40 border-b border-amber-500/20 flex items-start gap-3 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-mono uppercase block text-amber-300 mb-0.5">
                DRAFT FOR DISCUSSION AND LEGAL REVIEW — NOT APPROVED FOR PRODUCTION EXECUTION
              </strong>
              This template establishes Meridian’s workflow orchestration role. Electronic acceptance operates in demonstration mode until operational counsel approval.
            </div>
          </div>

          {!completedAcceptance ? (
            showSignaturePad ? (
              /* Dedicated Signature Canvas View */
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h4 className="text-sm font-mono uppercase tracking-wider text-[#D7FF43] font-bold">
                      SIGN AGREEMENT 1
                    </h4>
                    <p className="text-xs text-[#999D9B]">
                      Personal cursor/touch prototype electronic signature interaction for {companyName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(false)}
                    className="text-xs text-[#999D9B] hover:text-white px-3 py-1 bg-white/5 rounded-lg border border-white/10"
                  >
                    ← Review Document Terms
                  </button>
                </div>

                <PrototypeSignaturePad
                  partyRole={partyRole}
                  companyName={companyName}
                  representativeName={repName}
                  representativeTitle={designation}
                  agreementVersion={masterDoc.version}
                  agreementSha256={masterDoc.sha256Hash}
                  isSubmitting={loading}
                  onSign={handleSignatureSubmission}
                />
              </div>
            ) : (
              /* Scrollable Document Body */
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Document Metadata Strip */}
                <div className="p-3.5 bg-[#111315] rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#999D9B]">
                  <div>
                    <span className="text-white/40">FILENAME: </span>
                    <span className="text-white">{masterDoc.filename}</span>
                  </div>
                  <div>
                    <span className="text-white/40">VERSION: </span>
                    <span className="text-[#D7FF43] font-bold">{masterDoc.version}</span>
                  </div>
                  <div>
                    <span className="text-white/40">SHA-256: </span>
                    <span className="text-white truncate max-w-[140px] inline-block align-bottom">{masterDoc.sha256Hash.substring(0, 16)}...</span>
                  </div>
                </div>

                {/* Primary Content View */}
                <div className="space-y-4 font-mono text-xs text-[#F5F5F2]/80 leading-relaxed max-h-[320px] overflow-y-auto p-4 bg-[#111315] rounded-xl border border-white/5 select-text">
                  <div className="text-white font-bold pb-2 border-b border-white/10 flex justify-between">
                    <span>{masterDoc.title}</span>
                    <span className="text-amber-400">DEMO SCHEDULE</span>
                  </div>
                  <p className="whitespace-pre-line text-[11px] text-[#999D9B]">
                    {masterDoc.content}
                  </p>
                </div>

                {/* Ancillary Links */}
                <div className="p-3 bg-[#111315]/50 border border-white/5 rounded-xl flex items-center justify-between text-[11px] text-[#999D9B]">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#D7FF43]" />
                    Bound platform schedules:
                  </span>
                  <div className="flex gap-2">
                    <span className="text-[#D7FF43] hover:underline cursor-pointer">Acceptable Use Policy (Doc 04)</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[#D7FF43] hover:underline cursor-pointer">Data Processing Agreement (Doc 06)</span>
                  </div>
                </div>

                {/* Signatory Form */}
                <form onSubmit={handleSign} className="space-y-4 pt-2 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                        Authorized Signatory Full Name
                      </label>
                      <input
                        type="text"
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        placeholder="e.g. Elena Vance"
                        required
                        className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                        Corporate Designation / Title
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Director of Procurement"
                        required
                        className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                      />
                    </div>
                  </div>

                  {/* Affirmative Checkboxes */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer text-xs text-[#999D9B]">
                      <input
                        type="checkbox"
                        checked={declaredAuthority}
                        onChange={(e) => setDeclaredAuthority(e.target.checked)}
                        className="mt-0.5 rounded border-white/20 bg-[#111315] text-[#D7FF43] focus:ring-0 cursor-pointer"
                      />
                      <span className="leading-relaxed">
                        "I confirm that I am authorized to accept the Meridian Platform Terms on behalf of this company."
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer text-xs text-[#999D9B]">
                      <input
                        type="checkbox"
                        checked={acknowledgedPrivacy}
                        onChange={(e) => setAcknowledgedPrivacy(e.target.checked)}
                        className="mt-0.5 rounded border-white/20 bg-[#111315] text-[#D7FF43] focus:ring-0 cursor-pointer"
                      />
                      <span className="leading-relaxed">
                        "I acknowledge separate receipt of the Meridian Privacy Notice and agree to operational SaaS orchestration terms."
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300">
                      {error}
                    </div>
                  )}

                  {/* Action Row */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs text-[#999D9B] hover:text-[#F5F5F2] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-50 text-[#08090A] font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D7FF43]/20"
                    >
                      <PenTool className="w-4 h-4" />
                      <span>Proceed to Draw Signature</span>
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : (
            /* Acceptance Success & Downloadable Receipt View */
            <div className="p-8 space-y-6 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#D7FF43]/10 border border-[#D7FF43] flex items-center justify-center text-[#D7FF43]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
                  Agreement 1 Electronically Accepted
                </h4>
                <p className="text-xs text-[#999D9B] max-w-md mx-auto leading-relaxed">
                  The acceptance of Master Platform Terms v{completedAcceptance.agreementVersion} has been recorded with an immutable SHA-256 hash reference.
                </p>
              </div>

              {/* Watermark Banner */}
              <div className="p-3 bg-white/5 border border-[#D7FF43]/30 rounded-xl max-w-lg mx-auto text-center font-mono text-xs font-bold text-[#D7FF43] tracking-widest uppercase shadow-inner">
                ★ ELECTRONICALLY ACCEPTED BY {completedAcceptance.companyLegalName.toUpperCase()} ★
              </div>

              {/* Signature Display if available */}
              {signatureRecord && (
                <div className="p-4 bg-[#111315] border border-white/10 rounded-xl max-w-lg mx-auto text-left">
                  <div className="text-[10px] font-mono text-[#999D9B] uppercase mb-1">
                    Recorded Prototype Signature ({signatureRecord.signatureMethod}):
                  </div>
                  {signatureRecord.signatureData.startsWith('data:image') ? (
                    <img
                      src={signatureRecord.signatureData}
                      alt="Signature"
                      className="h-16 object-contain bg-white/5 p-1 rounded border border-white/10"
                    />
                  ) : (
                    <div className="font-serif italic text-lg text-[#D7FF43]">
                      {signatureRecord.signatureData}
                    </div>
                  )}
                </div>
              )}

              {/* Receipt Summary Card */}
              <div className="p-5 bg-[#111315] border border-white/10 rounded-xl max-w-lg mx-auto text-left text-xs font-mono space-y-2 text-[#999D9B]">
                <div className="flex justify-between pb-2 border-b border-white/5 text-white font-bold">
                  <span>ACCEPTANCE RECEIPT</span>
                  <span className="text-[#D7FF43]">{completedAcceptance.acceptanceId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Company:</span>
                  <span className="text-white">{completedAcceptance.companyLegalName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Signatory:</span>
                  <span className="text-white">{completedAcceptance.authorizedRepresentative} ({completedAcceptance.designation})</span>
                </div>
                <div className="flex justify-between">
                  <span>UTC Timestamp:</span>
                  <span className="text-white">{completedAcceptance.acceptedAtUtc}</span>
                </div>
                <div className="flex justify-between">
                  <span>Document Hash (SHA-256):</span>
                  <span className="text-[#D7FF43] truncate max-w-[200px]">{completedAcceptance.documentHash}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span>Receipt Reference:</span>
                  <span className="text-white font-bold">{completedAcceptance.receiptCode}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    downloadAgreement1Pdf({
                      acceptance: completedAcceptance,
                      document: masterDoc,
                      signatureMethod: signatureRecord?.signatureMethod,
                      signatureData: signatureRecord?.signatureData,
                    });
                  }}
                  className="px-4 py-2 bg-[#171A1C] hover:bg-white/5 border border-white/10 text-xs font-mono text-[#F5F5F2] rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Signed Agreement (PDF)</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Continue to Workspace
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
