import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  RefreshCw,
  Download,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  History,
  Lock,
} from 'lucide-react';
import { DocumentEvidenceRecord, IntegrityVerificationRecord } from '../../types';
import { api } from '../../services/api';

interface DocumentIntegrityModalProps {
  evidence: DocumentEvidenceRecord;
  tradeId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onVerificationComplete?: () => void;
  onVerified?: () => void;
}

export const DocumentIntegrityModal: React.FC<DocumentIntegrityModalProps> = ({
  evidence,
  tradeId = evidence.tradeId,
  isOpen = true,
  onClose,
  onVerificationComplete,
  onVerified,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IntegrityVerificationRecord | null>(null);
  const [logs, setLogs] = useState<IntegrityVerificationRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      // Auto-run verification on modal open
      handleVerify();
    } else {
      setVerificationResult(null);
      setFeedbackMessage(null);
    }
  }, [isOpen, evidence.id]);

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.evidence.getLogs(tradeId);
      const filtered = (res.logs || []).filter((l: IntegrityVerificationRecord) => l.evidenceId === evidence.id);
      setLogs(filtered);
    } catch (err) {
      console.error('Failed to load integrity logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setFeedbackMessage(null);
    try {
      const res = await api.evidence.verify(tradeId, evidence.id, 'User initiated verification check from integrity desk');
      if (res.success && res.record) {
        setVerificationResult(res.record);
        await loadLogs();
        if (onVerificationComplete) onVerificationComplete();
        if (onVerified) onVerified();
      }
    } catch (err: any) {
      setFeedbackMessage(`Verification error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTampering = async () => {
    if (!window.confirm('Simulate unauthorized byte tampering on this file? This will alter the private storage binary to test tamper detection.')) {
      return;
    }
    setSimulationLoading(true);
    try {
      await api.evidence.simulateTampering(tradeId, evidence.id);
      setFeedbackMessage('File binary was intentionally altered. Click "Re-Calculate SHA-256 Digest" to test detection.');
      // Re-verify immediately
      await handleVerify();
    } catch (err: any) {
      setFeedbackMessage(`Simulation failed: ${err.message}`);
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      reportType: 'MERIDIAN_DOCUMENT_INTEGRITY_VERIFICATION_REPORT',
      exportTimestamp: new Date().toISOString(),
      tradeId,
      documentMetadata: {
        id: evidence.id,
        category: evidence.category,
        fileName: evidence.fileName,
        mimeType: evidence.mimeType,
        fileSize: evidence.fileSize,
        recordedBaselineSha256: evidence.sha256Hash,
        uploadedBy: evidence.uploadedBy,
        uploadedAt: evidence.uploadedAt,
      },
      latestVerification: verificationResult || {
        recalculatedHash: evidence.sha256Hash,
        match: true,
        verifiedAt: new Date().toISOString(),
      },
      accessControlledAuditTrail: logs,
      governanceNotice: {
        scope: 'Byte-level SHA-256 comparison against initial upload baseline',
        disclaimer:
          'SHA-256 detects differences against the stored baseline and does not independently establish authenticity, legal validity, or underlying cargo condition.',
        standard: 'Meridian Trade Systems Cryptographic Baseline Specification v4.0',
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meridian_Integrity_Report_${evidence.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const isMatch = verificationResult ? verificationResult.match : true;
  const recalculated = verificationResult ? verificationResult.recalculatedHash : evidence.sha256Hash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#111315] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto text-white shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#111315]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isMatch ? 'bg-[#D7FF43]/10 text-[#D7FF43]' : 'bg-red-500/10 text-red-400'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Document Integrity Desk</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-zinc-800 text-zinc-300">
                  {evidence.category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Evidence ID: {evidence.id} • {evidence.fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Status Result Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isMatch
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {isMatch ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm uppercase tracking-wide">
                  {isMatch ? 'VERIFIED — Digest Matches Recorded Baseline' : 'INTEGRITY CHECK FAILED — Hash Mismatch Detected!'}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {isMatch
                    ? 'Byte-level comparison confirms the stored private object storage file matches the initial upload baseline.'
                    : 'The binary payload stored on disk has been altered or corrupted since initial ingestion.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                {isVerifying ? 'Re-Calculating...' : 'Re-Calculate SHA-256'}
              </button>
            </div>
          </div>

          {feedbackMessage && (
            <div className="p-3 text-xs rounded-lg bg-zinc-800 text-zinc-200 border border-white/10">
              {feedbackMessage}
            </div>
          )}

          {/* Side-by-Side SHA-256 Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Recorded Hash */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>ORIGINAL RECORDED BASELINE HASH</span>
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-white/5 font-mono text-xs break-all text-zinc-200">
                {evidence.sha256Hash}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono space-y-0.5">
                <div>Recorded: {new Date(evidence.uploadedAt).toUTCString()}</div>
                <div>Uploader: {evidence.uploadedBy}</div>
              </div>
            </div>

            {/* Live Recalculated Hash */}
            <div
              className={`p-4 rounded-xl bg-black/40 border space-y-2 ${
                isMatch ? 'border-[#D7FF43]/30' : 'border-red-500/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={isMatch ? 'text-[#D7FF43]' : 'text-red-400'}>
                  DYNAMICALLY RE-CALCULATED HASH
                </span>
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-[#D7FF43]' : 'text-zinc-500'}`} />
              </div>
              <div
                className={`p-3 rounded-lg bg-zinc-900 border font-mono text-xs break-all ${
                  isMatch ? 'text-[#D7FF43] border-[#D7FF43]/20' : 'text-red-400 border-red-500/30'
                }`}
              >
                {recalculated}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono space-y-0.5">
                <div>Algorithm: SHA-256 (256-bit Secure Hash Algorithm)</div>
                <div>Storage Reference: <span className="text-zinc-400">{evidence.storageKey}</span></div>
              </div>
            </div>
          </div>

          {/* Document Preview & Details */}
          <div className="p-4 rounded-xl bg-[#171A1C] border border-white/10 space-y-3">
            <h4 className="text-xs font-mono uppercase text-zinc-400">Stored Object Preview & Metadata</h4>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {evidence.mimeType.startsWith('image/') ? (
                  <img
                    src={evidence.storageUrl}
                    alt={evidence.fileName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <FileText className="w-8 h-8 text-[#D7FF43]" />
                )}
              </div>
              <div className="text-xs space-y-1 text-zinc-300 font-mono flex-1">
                <div><span className="text-zinc-500">File Name:</span> {evidence.fileName}</div>
                <div><span className="text-zinc-500">MIME Type:</span> {evidence.mimeType}</div>
                <div><span className="text-zinc-500">Payload Size:</span> {(evidence.fileSize / 1024).toFixed(1)} KB (Stored in Private Object Storage)</div>
                {evidence.caption && (
                  <div><span className="text-zinc-500">Description:</span> <span className="text-zinc-200 italic">{evidence.caption}</span></div>
                )}
              </div>
              <a
                href={evidence.storageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors shrink-0"
              >
                View Raw Asset
              </a>
            </div>
          </div>

          {/* Access-Controlled, Append-Only Audit Trail */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#D7FF43]" />
                <h4 className="text-xs font-mono uppercase text-zinc-300 tracking-wider">
                  Access-Controlled, Append-Only Audit Trail
                </h4>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">{logs.length} Verification Attempts Recorded</span>
            </div>

            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-white/5">
                  <tr>
                    <th className="p-2.5">TIMESTAMP (UTC)</th>
                    <th className="p-2.5">OPERATOR</th>
                    <th className="p-2.5">RECALCULATED DIGEST</th>
                    <th className="p-2.5 text-right">RESULT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-zinc-500 italic">
                        No previous verification attempts recorded.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="p-2.5 text-zinc-400">
                          {new Date(log.verifiedAt).toISOString().replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="p-2.5 text-zinc-300">{log.verifiedBy}</td>
                        <td className="p-2.5 text-zinc-400 truncate max-w-[200px]" title={log.recalculatedHash}>
                          {log.recalculatedHash.substring(0, 16)}...
                        </td>
                        <td className="p-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.match ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {log.match ? 'VERIFIED' : 'FAILED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Governance Callout Disclaimer */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block mb-0.5">Integrity Verification Disclaimer:</strong>
              SHA-256 detects byte differences against the recorded baseline digest and does not independently establish cargo authenticity, signatory legal authority, or document validity.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#111315]">
          <button
            onClick={handleSimulateTampering}
            disabled={simulationLoading}
            className="px-3.5 py-2 rounded-lg text-xs font-mono bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/40 transition-colors cursor-pointer"
          >
            {simulationLoading ? 'Tampering...' : '⚡ Simulate Unauthorized File Tampering'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#D7FF43] text-black hover:bg-[#cbf536] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#D7FF43]/20 font-sans"
            >
              <Download className="w-3.5 h-3.5" />
              Export Integrity Verification Report
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Close Desk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
