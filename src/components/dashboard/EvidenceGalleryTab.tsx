import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DocumentEvidenceRecord, IntegrityVerificationRecord } from '../../types';
import {
  Camera,
  Upload,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  ExternalLink,
  Tag,
  Clock,
  User,
  Building2,
  X,
  FileCheck2,
} from 'lucide-react';
import { DocumentIntegrityModal } from '../trades/DocumentIntegrityModal';

interface EvidenceGalleryTabProps {
  tradeId: string;
  userRole?: 'BUYER' | 'SELLER' | 'DEVELOPER';
  currentUserRole?: 'BUYER' | 'SELLER' | 'DEVELOPER';
  userOrgName?: string;
  onNavigate?: (route: string) => void;
}

const SELLER_CATEGORIES = [
  { id: 'PRODUCT_ORIGINAL', label: 'Original Product Condition', desc: 'Raw goods, lot verification, factory floor' },
  { id: 'PACKING', label: 'Packaging & Palletizing', desc: 'Inner wraps, desiccants, pallet banding' },
  { id: 'PRE_DISPATCH', label: 'Pre-Dispatch Loading', desc: 'Container loading, tare weights, staging area' },
  { id: 'SHIPMENT_DISPATCH', label: 'Shipment / Dispatch', desc: 'Carrier handover, bill of lading, truck/vessel departure' },
  { id: 'CONTAINER_SEAL', label: 'Container Seal & Security', desc: 'High-security ISO 17712 bolt seal stamped' },
];

const BUYER_CATEGORIES = [
  { id: 'RECEIVED_GOODS', label: 'Received Goods Inspection', desc: 'Unloading at destination port/warehouse' },
  { id: 'PRODUCT_CONDITION', label: 'Product Condition & Grade', desc: 'Visual assessment, packaging integrity' },
  { id: 'INSPECTION', label: 'Inspection & Lab Assay', desc: 'Third-party testing report, SGS/Bureau Veritas assay' },
  { id: 'DISCREPANCY_DAMAGE', label: 'Discrepancy / Damage Claim', desc: 'Transit damage, moisture ingress, defect logging' },
];

export const EvidenceGalleryTab: React.FC<EvidenceGalleryTabProps> = ({
  tradeId,
  userRole,
  currentUserRole,
  userOrgName,
  onNavigate,
}) => {
  const effectiveRole = userRole || currentUserRole || 'BUYER';
  const role = effectiveRole;
  const [evidenceList, setEvidenceList] = useState<DocumentEvidenceRecord[]>([]);
  const [logs, setLogs] = useState<IntegrityVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    userRole === 'SELLER' ? 'PRODUCT_ORIGINAL' : 'RECEIVED_GOODS'
  );
  const [caption, setCaption] = useState('');
  const [documentVersion, setDocumentVersion] = useState('v1.0');
  const [uploading, setUploading] = useState(false);

  // Filter State
  const [filterRole, setFilterRole] = useState<'ALL' | 'SELLER' | 'BUYER'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Lightbox Modal State
  const [lightboxEvidence, setLightboxEvidence] = useState<DocumentEvidenceRecord | null>(null);

  // Verification Modal State
  const [verifyModalEvidence, setVerifyModalEvidence] = useState<DocumentEvidenceRecord | null>(null);

  const isSeller = userRole === 'SELLER';
  const roleCategories = isSeller ? SELLER_CATEGORIES : BUYER_CATEGORIES;

  const loadEvidenceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [evRes, logRes] = await Promise.all([
        api.evidence.list(tradeId),
        api.evidence.getLogs(tradeId),
      ]);
      setEvidenceList(evRes.evidence || []);
      setLogs(logRes.logs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load evidence records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidenceData();
  }, [tradeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setError('File size exceeds 12MB limit for demonstration upload.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileBase64) {
      setError('Please select an image or document file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const res = await api.evidence.upload(tradeId, {
        category: selectedCategory,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        fileData: fileBase64,
        caption: caption.trim() || undefined,
        documentVersion: documentVersion.trim() || 'v1.0',
      });

      if (res.success) {
        setSuccessMessage(`File "${selectedFile.name}" securely stored in private object storage with SHA-256 baseline.`);
        setShowUploadModal(false);
        setSelectedFile(null);
        setFileBase64(null);
        setCaption('');
        await loadEvidenceData();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSimulateTamper = async (evidenceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.evidence.simulateTampering(tradeId, evidenceId);
      if (res.success) {
        setSuccessMessage('Simulation: Storage binary modified on server! Re-run verification to see tamper detection.');
        await loadEvidenceData();
        setTimeout(() => setSuccessMessage(null), 6000);
      }
    } catch (err: any) {
      setError(err.message || 'Tamper simulation failed');
    }
  };

  // Filtered evidence items
  const filteredEvidence = evidenceList.filter((item) => {
    if (filterRole === 'SELLER' && !item.uploadedBy.includes('SELLER')) return false;
    if (filterRole === 'BUYER' && !item.uploadedBy.includes('BUYER')) return false;
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#171A1C] border border-white/10 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-[#D7FF43]/10 text-[#D7FF43] border border-[#D7FF43]/30">
              PERSISTENT OBJECT STORAGE
            </span>
            <span className="text-xs text-white/30 font-mono">/</span>
            <span className="text-xs font-mono text-[#999D9B]">TRADE: {tradeId}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#D7FF43]" />
            <span>Photo Evidence Gallery & Cryptographic Baseline Register</span>
          </h2>
          <p className="text-xs text-[#999D9B] mt-1 max-w-2xl leading-relaxed">
            Upload and inspect high-resolution photographs of cargo, packaging, container seals, and inspection certificates. Each binary is held in persistent private object storage with SHA-256 integrity baseline hashing.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadEvidenceData}
            className="p-2.5 bg-[#111315] hover:bg-white/5 border border-white/10 rounded-xl text-[#999D9B] hover:text-white transition-colors"
            title="Refresh Evidence Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#D7FF43]/10 flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload {isSeller ? 'Seller' : 'Buyer'} Evidence</span>
          </button>
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

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#111315] border border-white/5 rounded-xl">
          <span className="text-[10px] font-mono text-[#999D9B] uppercase block">TOTAL EVIDENCE FILES</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">{evidenceList.length}</span>
        </div>
        <div className="p-4 bg-[#111315] border border-white/5 rounded-xl">
          <span className="text-[10px] font-mono text-[#999D9B] uppercase block">SELLER CARGO UPLOADS</span>
          <span className="text-xl font-bold font-mono text-[#D7FF43] mt-1 block">
            {evidenceList.filter((e) => e.uploadedBy.includes('SELLER')).length}
          </span>
        </div>
        <div className="p-4 bg-[#111315] border border-white/5 rounded-xl">
          <span className="text-[10px] font-mono text-[#999D9B] uppercase block">BUYER INSPECTION PROOFS</span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
            {evidenceList.filter((e) => e.uploadedBy.includes('BUYER')).length}
          </span>
        </div>
        <div className="p-4 bg-[#111315] border border-white/5 rounded-xl">
          <span className="text-[10px] font-mono text-[#999D9B] uppercase block">INTEGRITY AUDIT EVENTS</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">{logs.length}</span>
        </div>
      </div>

      {/* Filter and Role Tag Controls */}
      <div className="p-4 bg-[#111315] border border-white/5 rounded-xl flex flex-wrap items-center justify-between gap-4">
        {/* Role Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#999D9B] font-mono uppercase mr-1">Party:</span>
          {(['ALL', 'SELLER', 'BUYER'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filterRole === role
                  ? 'bg-[#D7FF43] text-[#08090A] font-bold shadow-sm'
                  : 'bg-[#171A1C] text-[#999D9B] hover:text-white border border-white/5'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role === 'SELLER' ? 'Seller Uploads' : 'Buyer Uploads'}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#999D9B] font-mono uppercase">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#171A1C] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D7FF43]"
          >
            <option value="ALL">All Categories ({evidenceList.length})</option>
            <optgroup label="Seller Categories">
              {SELLER_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </optgroup>
            <optgroup label="Buyer Categories">
              {BUYER_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="p-16 text-center bg-[#171A1C] border border-white/10 rounded-2xl">
          <div className="w-8 h-8 border-2 border-[#D7FF43] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-[#999D9B]">Fetching persistent evidence binaries from object storage...</p>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div className="p-16 text-center bg-[#171A1C] border border-white/10 rounded-2xl space-y-3">
          <Camera className="w-10 h-10 text-white/20 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Evidence Uploads Found</h3>
          <p className="text-xs text-[#999D9B] max-w-md mx-auto">
            {filterRole !== 'ALL' || filterCategory !== 'ALL'
              ? 'No records match your selected filter criteria. Try resetting the filters.'
              : `No photographs or inspection certificates uploaded yet for trade ${tradeId}. Click Upload Evidence above to record cargo condition.`}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl"
          >
            Upload First Evidence File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvidence.map((evd) => {
            const isImage = evd.mimeType.startsWith('image/');
            const isSellerUpload = evd.uploadedBy.includes('SELLER');

            return (
              <div
                key={evd.id}
                className="group bg-[#171A1C] border border-white/10 hover:border-[#D7FF43]/40 rounded-2xl overflow-hidden transition-all flex flex-col justify-between"
              >
                {/* Media Preview Container */}
                <div
                  onClick={() => setLightboxEvidence(evd)}
                  className="relative h-48 bg-[#08090A] overflow-hidden cursor-pointer flex items-center justify-center border-b border-white/5"
                >
                  {isImage ? (
                    <img
                      src={evd.storageUrl}
                      alt={evd.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <FileText className="w-12 h-12 text-[#D7FF43]" />
                      <span className="text-xs font-mono text-white font-medium">{evd.fileName}</span>
                      <span className="text-[10px] text-[#999D9B] uppercase font-mono">{evd.mimeType}</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isSellerUpload
                          ? 'bg-[#D7FF43] text-[#08090A]'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {isSellerUpload ? 'SELLER' : 'BUYER'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 backdrop-blur-sm text-white/90 border border-white/10">
                      {evd.documentVersion || 'v1.0'}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-white/80">
                    {(evd.fileSize / 1024).toFixed(1)} KB
                  </div>

                  {/* Click to Zoom Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
                    <Eye className="w-4 h-4" />
                    <span>View Lightbox</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#999D9B]">
                      <span className="uppercase text-[#D7FF43] font-semibold truncate">
                        {evd.category.replace(/_/g, ' ')}
                      </span>
                      <span>{new Date(evd.uploadedAt).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white truncate" title={evd.fileName}>
                      {evd.fileName}
                    </h4>

                    {evd.caption && (
                      <p className="text-xs text-[#999D9B] line-clamp-2 leading-relaxed">
                        {evd.caption}
                      </p>
                    )}
                  </div>

                  {/* SHA-256 Digest Bar */}
                  <div className="p-2.5 rounded-lg bg-[#111315] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#999D9B]">
                      <span>BASELINE SHA-256 HASH</span>
                      <span className="text-emerald-400 font-bold">STORED</span>
                    </div>
                    <div
                      className="font-mono text-[10px] text-white/90 truncate cursor-pointer hover:text-[#D7FF43]"
                      title={evd.sha256Hash}
                      onClick={() => navigator.clipboard.writeText(evd.sha256Hash)}
                    >
                      {evd.sha256Hash.substring(0, 24)}...
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setVerifyModalEvidence(evd)}
                      className="flex-1 py-1.5 px-3 bg-[#111315] hover:bg-[#D7FF43] hover:text-[#08090A] border border-white/10 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF43] group-hover:text-[#08090A]" />
                      <span>Verify SHA-256</span>
                    </button>

                    <a
                      href={evd.storageUrl}
                      download={evd.fileName}
                      className="p-1.5 bg-[#111315] hover:bg-white/10 border border-white/10 rounded-lg text-[#999D9B] hover:text-white transition-colors"
                      title="Download Original Binary"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={(e) => handleSimulateTamper(evd.id, e)}
                      className="p-1.5 bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title="Simulate Server Tampering (Test Verification)"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Access-Controlled Append-Only Integrity Audit Trail */}
      <div className="p-6 bg-[#171A1C] border border-white/10 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#D7FF43]" />
              <span>Access-Controlled, Append-Only Integrity Audit Trail</span>
            </h3>
            <p className="text-xs text-[#999D9B] mt-0.5">
              Historical ledger of byte-level SHA-256 integrity verifications and uploader baselines for Trade {tradeId}.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#111315] text-[#999D9B] border border-white/5">
            {logs.length} Verification Entries
          </span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs font-mono text-[#999D9B] text-center py-4">
            No verification records logged yet. Run SHA-256 verification on any evidence file above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#111315] text-[#999D9B] border-b border-white/5">
                <tr>
                  <th className="p-3">VERIFICATION ID</th>
                  <th className="p-3">EVIDENCE REF</th>
                  <th className="p-3">VERIFIER</th>
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">RECALCULATED DIGEST</th>
                  <th className="p-3 text-right">RESULT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="p-3 font-semibold text-white">{log.id}</td>
                    <td className="p-3 text-[#D7FF43]">{log.evidenceId}</td>
                    <td className="p-3 text-[#999D9B]">{log.verifiedBy}</td>
                    <td className="p-3 text-[#999D9B]">
                      {new Date(log.verifiedAt).toLocaleString()}
                    </td>
                    <td className="p-3 text-white/80 font-mono text-[10px] truncate max-w-xs" title={log.recalculatedHash}>
                      {log.recalculatedHash.substring(0, 16)}...
                    </td>
                    <td className="p-3 text-right">
                      {log.match ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                          INTEGRITY CHECK FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPLOAD EVIDENCE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#171A1C] border border-white/10 rounded-2xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#D7FF43]" />
                <h3 className="text-base font-bold text-white">
                  Upload {isSeller ? 'Seller Cargo' : 'Buyer Inspection'} Evidence
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#999D9B] hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Category Tag Selection */}
              <div>
                <label className="block text-xs font-mono text-[#999D9B] mb-1">
                  EVIDENCE CATEGORY TAG (REQUIRED)
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D7FF43]"
                  required
                >
                  <optgroup label={`${isSeller ? 'Seller' : 'Buyer'} Workflow Milestones`}>
                    {roleCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} — ({cat.desc})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* File Selector */}
              <div>
                <label className="block text-xs font-mono text-[#999D9B] mb-1">
                  CARGO PHOTOGRAPH OR INSPECTION DOCUMENT (MAX 12MB)
                </label>
                <div className="p-4 border-2 border-dashed border-white/10 rounded-xl bg-[#111315] text-center space-y-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="evidence-file-input"
                  />
                  <label
                    htmlFor="evidence-file-input"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#171A1C] hover:bg-white/10 text-xs text-white font-medium rounded-lg cursor-pointer border border-white/10"
                  >
                    <Camera className="w-4 h-4 text-[#D7FF43]" />
                    <span>Choose Photograph or PDF</span>
                  </label>
                  {selectedFile ? (
                    <div className="text-xs font-mono text-[#D7FF43]">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#999D9B]">
                      Supports JPEG, PNG, WebP photographs and PDF certificates
                    </p>
                  )}
                </div>
              </div>

              {/* Document Version */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#999D9B] mb-1">DOCUMENT VERSION</label>
                  <input
                    type="text"
                    value={documentVersion}
                    onChange={(e) => setDocumentVersion(e.target.value)}
                    className="w-full bg-[#111315] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="e.g. v1.0, Rev B"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#999D9B] mb-1">UPLOADER ENTITY</label>
                  <div className="w-full bg-[#111315] border border-white/5 rounded-xl px-3 py-2 text-xs text-[#999D9B] truncate">
                    {userOrgName || userRole}
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-mono text-[#999D9B] mb-1">
                  TECHNICAL CAPTION / OBSERVATIONS
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Pallet 04 moisture-barrier sealed; ISO container seal #DE-98218 applied at factory gates..."
                  rows={2}
                  className="w-full bg-[#111315] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              {/* Storage Disclosure */}
              <div className="p-3 bg-[#111315] border border-white/5 rounded-xl text-[11px] text-[#999D9B] space-y-1">
                <div className="text-white font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF43]" />
                  <span>Persistent Storage & Baseline Hashing Protocol</span>
                </div>
                <p>
                  Original binary will be committed to private object storage. Meridian will calculate the canonical SHA-256 digest at moment of ingest to establish an unalterable verification baseline.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs text-[#999D9B] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-50 text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-[#08090A] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploading ? 'Storing in Object Storage...' : 'Commit to Object Storage'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-4xl w-full bg-[#171A1C] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-[#111315] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#D7FF43] text-[#08090A]">
                  {lightboxEvidence.category.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-bold text-white truncate">{lightboxEvidence.fileName}</span>
              </div>
              <button
                onClick={() => setLightboxEvidence(null)}
                className="text-[#999D9B] hover:text-white text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Media Body */}
            <div className="flex-1 bg-[#08090A] overflow-auto flex items-center justify-center p-4 min-h-[300px]">
              {lightboxEvidence.mimeType.startsWith('image/') ? (
                <img
                  src={lightboxEvidence.storageUrl}
                  alt={lightboxEvidence.fileName}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-16 h-16 text-[#D7FF43] mx-auto" />
                  <div className="text-sm font-semibold text-white">{lightboxEvidence.fileName}</div>
                  <p className="text-xs text-[#999D9B]">PDF Document Stored in Object Storage</p>
                  <a
                    href={lightboxEvidence.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl"
                  >
                    <span>Open PDF in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer Metadata */}
            <div className="p-4 bg-[#111315] border-t border-white/10 space-y-2 text-xs">
              {lightboxEvidence.caption && (
                <p className="text-white italic">{lightboxEvidence.caption}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-[#999D9B]">
                <div>
                  <strong>Uploaded By:</strong> {lightboxEvidence.uploadedBy} on {new Date(lightboxEvidence.uploadedAt).toLocaleString()}
                </div>
                <div>
                  <strong>Storage Key:</strong> {lightboxEvidence.storageKey}
                </div>
              </div>
              <div className="p-2.5 rounded bg-[#08090A] border border-white/5 font-mono text-[10px] break-all">
                <span className="text-[#999D9B]">SHA-256 BASELINE: </span>
                <span className="text-[#D7FF43] font-bold">{lightboxEvidence.sha256Hash}</span>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    const target = lightboxEvidence;
                    setLightboxEvidence(null);
                    setVerifyModalEvidence(target);
                  }}
                  className="px-4 py-1.5 bg-[#D7FF43] text-[#08090A] font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify SHA-256 Integrity</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT INTEGRITY VERIFICATION MODAL */}
      {verifyModalEvidence && (
        <DocumentIntegrityModal
          evidence={verifyModalEvidence}
          onClose={() => setVerifyModalEvidence(null)}
          onVerified={() => {
            loadEvidenceData();
          }}
        />
      )}
    </div>
  );
};
