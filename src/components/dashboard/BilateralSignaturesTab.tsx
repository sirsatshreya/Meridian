import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldCheck,
  FileCheck2,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Building2,
  Lock,
} from 'lucide-react';
import { PrototypeSignaturePad } from '../trades/PrototypeSignaturePad';
import { downloadAgreement2Pdf } from '../../utils/pdfGenerator';

interface BilateralSignaturesTabProps {
  tradeId: string;
  userRole?: 'BUYER' | 'SELLER' | 'DEVELOPER';
  userOrgName?: string;
  userName?: string;
  onNavigate?: (route: string) => void;
}

export const BilateralSignaturesTab: React.FC<BilateralSignaturesTabProps> = ({
  tradeId,
  userRole = 'BUYER',
  userOrgName,
  userName,
  onNavigate,
}) => {
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleUpper = (userRole || 'BUYER').toString().toUpperCase();
  const isBuyer = roleUpper === 'BUYER' || roleUpper === 'DEVELOPER';
  const isSeller = roleUpper === 'SELLER';

  const loadAgreementData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.agreement2.get(tradeId);
      setAgreement(res.agreement2 || (res as any).agreement);
    } catch (err: any) {
      setError(err.message || 'Failed to load Agreement 2 contract');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgreementData();
  }, [tradeId]);

  const handleExecuteSignature = async (signData: {
    signatureMethod: 'PROTOTYPE_CANVAS' | 'PROTOTYPE_TYPED';
    signatureData: string;
    signerName: string;
    signerTitle: string;
    disclaimerText: string;
  }) => {
    if (!agreement) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const role = userRole === 'SELLER' ? 'SELLER' : 'BUYER';
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
      setSuccessMessage(`Prototype electronic signature recorded and cryptographically bound to Agreement 2 (v${agreement.version}).`);
      await loadAgreementData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Signature execution rejected by server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buyerSig = agreement?.signatures?.buyer;
  const sellerSig = agreement?.signatures?.seller;
  const isExecuted = agreement?.status === 'EXECUTED';
  const canSign =
    (isBuyer && !buyerSig) ||
    (isSeller && !sellerSig);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#171A1C] border border-white/10 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-[#D7FF43]/10 text-[#D7FF43] border border-[#D7FF43]/30">
              BILATERAL EXECUTION DESK
            </span>
            <span className="text-xs text-white/30 font-mono">/</span>
            <span className="text-xs font-mono text-[#999D9B]">REF: {agreement?.id || tradeId}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#D7FF43]" />
            <span>Buyer & Seller Digital Signature Interface</span>
          </h2>
          <p className="text-xs text-[#999D9B] mt-1 max-w-2xl leading-relaxed">
            Independent bilateral review and affirmative execution desk for Agreement 2. Both parties must execute prototype electronic signatures cryptographically matching the exact canonical SHA-256 contract digest.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadAgreementData}
            className="p-2.5 bg-[#111315] hover:bg-white/5 border border-white/10 rounded-xl text-[#999D9B] hover:text-white transition-colors"
            title="Refresh Agreement Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {agreement && (
            <button
              onClick={() => downloadAgreement2Pdf(agreement)}
              className="px-4 py-2.5 bg-[#111315] hover:bg-white/5 border border-white/10 hover:border-[#D7FF43]/40 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 text-white cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D7FF43]" />
              <span>Download Agreement 2 (PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center bg-[#171A1C] border border-white/10 rounded-2xl">
          <div className="w-8 h-8 border-2 border-[#D7FF43] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-[#999D9B]">Loading bilateral contract & signature records...</p>
        </div>
      ) : !agreement ? (
        <div className="p-16 text-center bg-[#171A1C] border border-white/10 rounded-2xl space-y-3">
          <FileCheck2 className="w-10 h-10 text-white/20 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Agreement 2 Found</h3>
          <p className="text-xs text-[#999D9B] max-w-md mx-auto">
            Agreement 2 has not been compiled yet for this trade request. Open the Agreement 2 Contract tab to evaluate readiness gates and generate the document.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Agreement Status & Canonical Hash */}
          <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-[#999D9B] uppercase">EXECUTION STATUS</span>
                <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <span>Agreement 2 (v{agreement.version})</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase ${
                      isExecuted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : agreement.status === 'PARTIALLY_SIGNED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {agreement.status}
                  </span>
                </div>
              </div>

              <div className="text-right sm:text-right font-mono text-xs text-[#999D9B]">
                <div>Compiled: {new Date(agreement.createdAt).toLocaleDateString()}</div>
                <div className="text-[11px] text-[#D7FF43]">
                  {isExecuted ? 'Bilateral Execution Complete' : 'Awaiting Bilateral Signatures'}
                </div>
              </div>
            </div>

            {/* Canonical SHA-256 Digest */}
            <div className="p-4 bg-[#111315] border border-white/5 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#999D9B] uppercase">CANONICAL AGREEMENT 2 SHA-256 BASELINE DIGEST</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(agreement.sha256Hash);
                    setSuccessMessage('Contract SHA-256 digest copied to clipboard!');
                    setTimeout(() => setSuccessMessage(null), 3000);
                  }}
                  className="text-[10px] text-[#D7FF43] hover:underline"
                >
                  Copy Full Hash
                </button>
              </div>
              <div className="p-3 bg-[#08090A] rounded border border-white/5 font-mono text-[#D7FF43] text-xs break-all select-all">
                {agreement.sha256Hash}
              </div>
              <p className="text-[11px] text-[#999D9B]">
                This SHA-256 digest represents the immutable baseline of the agreed terms. Modifying any schedule clause recalculates this hash and invalidates prior signatures.
              </p>
            </div>
          </div>

          {/* Dual Execution Seals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Execution Card */}
            <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#D7FF43]" />
                  <span className="text-xs font-mono font-bold uppercase text-white">Buyer Execution Seal</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    buyerSig
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {buyerSig ? 'EXECUTED' : 'PENDING'}
                </span>
              </div>

              <div className="text-xs font-mono text-[#999D9B] space-y-1">
                <div className="text-white font-bold text-sm">
                  {agreement.buyerCompanyName || 'Meridian Demo Buyer'}
                </div>
                <div>Role: Authorized Buyer Principal</div>
              </div>

              {buyerSig ? (
                <div className="space-y-3 pt-2">
                  {/* Signature Representation */}
                  <div className="h-28 bg-[#111315] border border-white/10 rounded-xl flex items-center justify-center p-3 overflow-hidden">
                    {buyerSig.signatureMethod === 'PROTOTYPE_CANVAS' && buyerSig.signatureData ? (
                      <img
                        src={buyerSig.signatureData}
                        alt="Buyer Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="font-serif italic text-2xl text-[#D7FF43]">
                        {buyerSig.authorizedSignerName}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-[#111315] rounded-xl border border-white/5 space-y-1 text-xs font-mono">
                    <div className="text-white">
                      <strong>Signer:</strong> {buyerSig.authorizedSignerName} ({buyerSig.signerTitle})
                    </div>
                    <div className="text-[#999D9B]">
                      <strong>Timestamp:</strong> {new Date(buyerSig.signedAtUtc).toUTCString()}
                    </div>
                    <div className="text-[#D7FF43] truncate">
                      <strong>Receipt:</strong> {buyerSig.receiptCode}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate" title={buyerSig.documentVersionHash}>
                      Target Hash: {buyerSig.documentVersionHash.substring(0, 24)}...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-white/10 rounded-xl text-center space-y-2">
                  <Clock className="w-8 h-8 text-amber-400/60 mx-auto" />
                  <div className="text-xs font-semibold text-white">Awaiting Buyer Execution</div>
                  <p className="text-[11px] text-[#999D9B]">
                    Pending affirmative signature from authorized Buyer representative.
                  </p>
                </div>
              )}
            </div>

            {/* Seller Execution Card */}
            <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#D7FF43]" />
                  <span className="text-xs font-mono font-bold uppercase text-white">Seller Execution Seal</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    sellerSig
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {sellerSig ? 'EXECUTED' : 'PENDING'}
                </span>
              </div>

              <div className="text-xs font-mono text-[#999D9B] space-y-1">
                <div className="text-white font-bold text-sm">
                  {agreement.sellerCompanyName || 'Meridian Demo Seller GmbH'}
                </div>
                <div>Role: Authorized Seller Principal</div>
              </div>

              {sellerSig ? (
                <div className="space-y-3 pt-2">
                  {/* Signature Representation */}
                  <div className="h-28 bg-[#111315] border border-white/10 rounded-xl flex items-center justify-center p-3 overflow-hidden">
                    {sellerSig.signatureMethod === 'PROTOTYPE_CANVAS' && sellerSig.signatureData ? (
                      <img
                        src={sellerSig.signatureData}
                        alt="Seller Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="font-serif italic text-2xl text-[#D7FF43]">
                        {sellerSig.authorizedSignerName}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-[#111315] rounded-xl border border-white/5 space-y-1 text-xs font-mono">
                    <div className="text-white">
                      <strong>Signer:</strong> {sellerSig.authorizedSignerName} ({sellerSig.signerTitle})
                    </div>
                    <div className="text-[#999D9B]">
                      <strong>Timestamp:</strong> {new Date(sellerSig.signedAtUtc).toUTCString()}
                    </div>
                    <div className="text-[#D7FF43] truncate">
                      <strong>Receipt:</strong> {sellerSig.receiptCode}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate" title={sellerSig.documentVersionHash}>
                      Target Hash: {sellerSig.documentVersionHash.substring(0, 24)}...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-white/10 rounded-xl text-center space-y-2">
                  <Clock className="w-8 h-8 text-amber-400/60 mx-auto" />
                  <div className="text-xs font-semibold text-white">Awaiting Seller Execution</div>
                  <p className="text-[11px] text-[#999D9B]">
                    Pending affirmative signature from authorized Seller representative.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Prototype Signature Pad if not signed by current user */}
          {canSign && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#D7FF43] uppercase tracking-wider pl-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Execute Your Authorized Signature Representation</span>
              </div>
              <PrototypeSignaturePad
                partyRole={isSeller ? 'SELLER' : 'BUYER'}
                companyName={userOrgName || (isSeller ? agreement.sellerCompanyName : agreement.buyerCompanyName)}
                representativeName={userName || (isSeller ? 'Marcus Weber' : 'Elena Vance')}
                representativeTitle={isSeller ? 'Managing Director & Head of Export' : 'Director of Global Procurement'}
                agreementVersion={agreement.version}
                agreementSha256={agreement.sha256Hash}
                isSubmitting={isSubmitting}
                onSign={handleExecuteSignature}
              />
            </div>
          )}

          {/* Already Signed Confirmation Banner */}
          {!canSign && (
            <div className="p-5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-white text-sm">
                    {isExecuted
                      ? 'Bilateral Execution Complete & Binding Assent Recorded'
                      : `Your entity (${userOrgName || (isSeller ? 'Seller' : 'Buyer')}) has successfully executed this agreement.`}
                  </div>
                  <div className="text-[#999D9B] mt-0.5 font-mono">
                    All signatures are bound to canonical hash digest {agreement.sha256Hash.substring(0, 16)}...
                  </div>
                </div>
              </div>

              {agreement && (
                <button
                  onClick={() => downloadAgreement2Pdf(agreement)}
                  className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Agreement 2 (PDF)</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
