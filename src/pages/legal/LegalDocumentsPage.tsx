import React, { useState } from 'react';
import { LEGAL_DOCUMENTS } from '../../server/legalDocumentsData';
import { LegalDocument } from '../../types';
import { FileText, ShieldAlert, Download, Search, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

interface LegalDocumentsPageProps {
  onNavigate: (route: string) => void;
}

export const LegalDocumentsPage: React.FC<LegalDocumentsPageProps> = ({ onNavigate }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-01');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDoc = LEGAL_DOCUMENTS.find((d) => d.id === selectedDocId) || LEGAL_DOCUMENTS[0];

  const filteredDocs = LEGAL_DOCUMENTS.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (doc: LegalDocument) => {
    const textContent = `${doc.title}\nFilename: ${doc.filename}\nVersion: ${doc.version} · Effective: ${doc.effectiveDate}\nSHA-256: ${doc.sha256Hash}\nStatus: ${doc.status}\n\nWARNING: DRAFT FOR DISCUSSION AND LEGAL REVIEW — NOT APPROVED FOR PRODUCTION EXECUTION.\n\n${doc.content}\n\n` +
      doc.clauses.map((c) => `--- Clause ${c.number}: ${c.title} ---\n${c.body}\n`).join('\n');

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.filename.replace('.pdf', '_DRAFT.txt');
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Top Back Nav & Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-[#999D9B] hover:text-[#F5F5F2] transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D7FF43]" />
              <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
                VERSIONED LEGAL DOCUMENT REPOSITORY
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F2]">
              Meridian Legal & Contract Framework
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#999D9B]">12 Core Documents Available</span>
          </div>
        </div>

        {/* Global Draft Banner */}
        <div className="p-4 bg-amber-950/40 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-mono uppercase block text-amber-300 mb-0.5">
              DRAFT FOR DISCUSSION AND LEGAL REVIEW — NOT APPROVED FOR PRODUCTION EXECUTION
            </strong>
            All 12 documents in this repository are drafts provided for architectural and review purposes. They establish Meridian's software orchestration role, bilateral buyer-seller schedules, and non-escrow disclaimers.
          </div>
        </div>

        {/* Repository Grid: Document Selector Sidebar + Clause Reader */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 12 Documents List (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#999D9B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search legal documents..."
                className="w-full bg-[#111315] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredDocs.map((doc) => {
                const isSelected = doc.id === selectedDoc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#171A1C] border-[#D7FF43] shadow-lg'
                        : 'bg-[#111315] hover:bg-[#15181a] border-white/5 text-[#999D9B]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={isSelected ? 'text-[#D7FF43] font-bold' : 'text-[#999D9B]'}>
                        DOC {doc.number} · {doc.roleCategory}
                      </span>
                      <span className="text-white/40">v{doc.version}</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[#F5F5F2] line-clamp-1">
                      {doc.title}
                    </h4>

                    <p className="text-[11px] text-[#999D9B] line-clamp-2 leading-relaxed">
                      {doc.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Clause Viewer (col-span-7) */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-[#171A1C] border border-white/10 rounded-2xl shadow-2xl space-y-6">
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="font-mono text-xs text-[#D7FF43] uppercase block mb-1">
                  DOCUMENT {selectedDoc.number} · {selectedDoc.roleCategory}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
                  {selectedDoc.title}
                </h2>
                <span className="font-mono text-xs text-[#999D9B] block mt-1">
                  Filename: {selectedDoc.filename}
                </span>
              </div>

              <button
                onClick={() => handleDownload(selectedDoc)}
                className="px-4 py-2 bg-[#111315] hover:bg-white/5 border border-white/10 text-xs font-mono text-[#D7FF43] rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Copy</span>
              </button>
            </div>

            {/* Cryptographic Hash Bar */}
            <div className="p-3 bg-[#111315] rounded-xl border border-white/5 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#999D9B]">DOCUMENT HASH (SHA-256):</span>
              <span className="text-[#D7FF43] text-[11px] select-all break-all">{selectedDoc.sha256Hash}</span>
            </div>

            {/* Introductory Preamble */}
            <div className="p-4 bg-[#08090A] border border-white/10 rounded-xl text-xs text-[#999D9B] leading-relaxed font-mono whitespace-pre-line">
              {selectedDoc.content}
            </div>

            {/* Clauses */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              <h3 className="text-xs font-mono uppercase text-[#999D9B]">
                Preserved Clauses ({selectedDoc.clauses.length})
              </h3>
              {selectedDoc.clauses.map((clause) => (
                <div key={clause.number} className="p-4 bg-[#111315] border border-white/5 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold font-mono text-[#F5F5F2]">
                    {clause.number}. {clause.title}
                  </h4>
                  <p className="text-xs text-[#999D9B] leading-relaxed">
                    {clause.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
