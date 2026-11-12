import React, { useState } from 'react';
import { WorkflowStage } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, ShieldCheck, ArrowRight, Info } from 'lucide-react';

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'stage-01',
    number: '01',
    title: 'Business Registration',
    shortDesc: 'Corporate entity identification & trading partner link',
    whatHappens:
      'Both the buying entity and selling entity establish their corporate accounts on Meridian. They specify authorized commercial representatives, operational jurisdictions, and designate their pre-existing trade counterparty.',
    whyImportant:
      'Establishes legal identity boundaries and ensures that coordination begins only between recognized, mutually chosen counterparties—without random matchmaking.',
    meridianAssistance:
      'Meridian generates unique partner invitation tokens and cross-links corporate profiles while securing sensitive corporate data from public directories.',
    stageType: 'onboarding',
  },
  {
    id: 'stage-02',
    number: '02',
    title: 'Business Verification',
    shortDesc: 'KYB validation & sanction compliance screening',
    whatHappens:
      'Commercial documentation, government business registry numbers, ultimate beneficial ownership (UBO), and trade compliance standing are verified through automated validation frameworks.',
    whyImportant:
      'International trade cross-border mandates strict counterparty diligence to avoid export violations, sanctions breaches, or shell-entity exposure.',
    meridianAssistance:
      'Meridian coordinates verified audit trails and generates standardized verification certificates recognized across international trade corridors.',
    stageType: 'onboarding',
  },
  {
    id: 'stage-03',
    number: '03',
    title: 'Digital Trade Agreement',
    shortDesc: 'Incoterms, product specifications, milestones & SLAs',
    whatHappens:
      'Buyer and seller coordinate agreed transaction terms: commercial invoices, Incoterms (e.g. FOB, CIF, DDP), milestone schedules, inspection criteria, and delivery deadlines in a unified agreement record.',
    whyImportant:
      'Disputes in international trade predominantly stem from ambiguous or conflicting email threads, misaligned Incoterms, or unaligned milestone gates.',
    meridianAssistance:
      'Meridian provides structured clause reconciliation, automated version hashing, and cryptographic dual-party signing locks.',
    stageType: 'contract',
  },
  {
    id: 'stage-04',
    number: '04',
    title: 'Subscription & Platform Access',
    shortDesc: 'Tiered orchestration access for corporate trade desks',
    whatHappens:
      'Both trading partners configure their Meridian trade workspace access tier, giving their logistics teams, legal reviewers, and finance controllers synchronized workflow seats.',
    whyImportant:
      'Enterprise trade requires multi-department access control without compromising commercial security or introducing per-transaction toll fees.',
    meridianAssistance:
      'Meridian provisions dedicated trade desks, audit logs, and external API webhook connections for ERP/TMS interoperability.',
    stageType: 'contract',
  },
  {
    id: 'stage-05',
    number: '05',
    title: 'Payment Coordination',
    shortDesc: 'External provider milestone escrow & payment status tracking',
    whatHappens:
      'Trade funds or letters of credit are coordinated through authorized external financial partners (such as PayPal Sandbox in demonstration and licensed banking partners in production).',
    whyImportant:
      'Protects working capital. Meridian acts strictly as an orchestration layer, ensuring funds are released only when cryptographically verified milestones are satisfied.',
    meridianAssistance:
      'Meridian monitors real-time transaction states from external providers and triggers conditional payment releases upon verified delivery proof.',
    stageType: 'execution',
  },
  {
    id: 'stage-06',
    number: '06',
    title: 'Shipment Monitoring',
    shortDesc: 'Real-time multi-carrier telemetry & IoT condition logs',
    whatHappens:
      'Bill of Lading tracking, container GPS coordinates, customs clearance checkpoints, and IoT container telemetry (temperature, humidity, shock) are ingested into the trade timeline.',
    whyImportant:
      'Early awareness of customs holds, demurrage risks, route diversions, or cargo spoilage prevents cascading supply chain delays.',
    meridianAssistance:
      'Meridian normalizes heterogeneous freight data, flags route anomalies, and timestamps every custody transfer with cryptographic immutability.',
    stageType: 'execution',
  },
  {
    id: 'stage-07',
    number: '07',
    title: 'AI-Based Dispute Support',
    shortDesc: 'Evidence consolidation, contract clause mapping & resolution',
    whatHappens:
      'If an anomaly or breach occurs (such as thermal excursions or delayed port discharge), Meridian compiles the sensor telemetry, agreed contract clauses, and shipping manifests.',
    whyImportant:
      'Cross-border litigation or arbitration takes months and costs tens of thousands of dollars without synchronized, structured objective evidence.',
    meridianAssistance:
      'Meridian’s AI engine structures an unbiased evidence dossier, benchmarks deviation against contract tolerances, and recommends amicable settlement splits.',
    stageType: 'settlement',
  },
  {
    id: 'stage-08',
    number: '08',
    title: 'Settlement Reporting',
    shortDesc: 'Final audit documentation, reconciliation & tax exports',
    whatHappens:
      'Upon mutual delivery sign-off, the transaction is marked fulfilled. Final disbursements are confirmed via the external payment provider, and complete compliance dossiers are exported.',
    whyImportant:
      'Corporate accounting, cross-border VAT reconciliation, and customs audits require unified proof of delivery and matched invoice-to-settlement journals.',
    meridianAssistance:
      'Meridian generates single-click exportable audit packages compliant with GAAP, IFRS, and international customs auditing standards.',
    stageType: 'settlement',
  },
];

export const WorkflowTimeline: React.FC = () => {
  const [selectedStageId, setSelectedStageId] = useState<string>('stage-01');

  const selectedStage =
    WORKFLOW_STAGES.find((s) => s.id === selectedStageId) || WORKFLOW_STAGES[0];

  return (
    <div className="w-full">
      {/* Proposed platform notice badge */}
      <div className="flex items-center gap-2 mb-8 text-xs text-[#999D9B] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
        <span>PROPOSED END-TO-END SAAS WORKFLOW ARCHITECTURE</span>
        <span className="text-white/20">/</span>
        <span>NO DIRECTORY OR MATCHMAKING INVOLVED</span>
      </div>

      {/* Desktop Horizontal Step Track */}
      <div className="hidden lg:grid grid-cols-8 gap-2 mb-10 pb-4 border-b border-white/10">
        {WORKFLOW_STAGES.map((stage) => {
          const isSelected = stage.id === selectedStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStageId(stage.id)}
              className={`text-left p-3.5 rounded-xl transition-all duration-200 group relative ${
                isSelected
                  ? 'bg-[#171A1C] border border-[#D7FF43]/40 shadow-lg'
                  : 'bg-transparent hover:bg-[#111315] border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-mono text-xs font-semibold ${
                    isSelected ? 'text-[#D7FF43]' : 'text-[#999D9B]'
                  }`}
                >
                  {stage.number}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-[#D7FF43]' : 'bg-white/15'
                  }`}
                />
              </div>
              <h4
                className={`text-xs font-medium leading-snug line-clamp-2 transition-colors ${
                  isSelected ? 'text-[#F5F5F2]' : 'text-[#999D9B] group-hover:text-[#F5F5F2]'
                }`}
              >
                {stage.title}
              </h4>

              {/* Active bottom accent indicator */}
              {isSelected && (
                <motion.div
                  layoutId="activeTimelineGlow"
                  className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#D7FF43]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile/Tablet Horizontal Scroll Step Track */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {WORKFLOW_STAGES.map((stage) => {
          const isSelected = stage.id === selectedStageId;
          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStageId(stage.id)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#171A1C] border-[#D7FF43] text-[#F5F5F2]'
                  : 'bg-[#111315] border-white/5 text-[#999D9B]'
              }`}
            >
              <span className="font-mono text-[#D7FF43]">{stage.number}</span>
              <span className="whitespace-nowrap">{stage.title}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Active Stage Detail Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedStage.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="bg-[#171A1C] border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle lime glow in background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D7FF43]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-[#111315] border border-white/10 rounded-lg font-mono text-xs text-[#D7FF43]">
                  PHASE {selectedStage.number}
                </span>
                <span className="text-xs uppercase tracking-wider text-[#999D9B] font-mono">
                  {(selectedStage.stageType || 'Platform').toUpperCase()} GOVERNANCE
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#999D9B]">
                <Info className="w-3.5 h-3.5 text-[#D7FF43]" />
                <span>Proposed SaaS Workflow Stage</span>
              </div>
            </div>

            {/* Title & Short Description */}
            <div className="mt-6 mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F5F2] tracking-tight mb-2">
                {selectedStage.title}
              </h3>
              <p className="text-sm sm:text-base text-[#999D9B]">
                {selectedStage.shortDesc}
              </p>
            </div>

            {/* 3 Detail Columns: What happens, Why it is important, How Meridian assists */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Column 1: What happens */}
              <div className="p-5 bg-[#111315]/80 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#F5F5F2]">
                      What Happens During This Stage
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#999D9B] leading-relaxed">
                    {selectedStage.whatHappens}
                  </p>
                </div>
              </div>

              {/* Column 2: Why it is important */}
              <div className="p-5 bg-[#111315]/80 rounded-xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#F5F5F2]">
                      Why It Is Important
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#999D9B] leading-relaxed">
                    {selectedStage.whyImportant}
                  </p>
                </div>
              </div>

              {/* Column 3: How Meridian assists */}
              <div className="p-5 bg-[#111315]/80 rounded-xl border border-[#D7FF43]/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#D7FF43]">
                      How Meridian Coordinates
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#F5F5F2] leading-relaxed">
                    {selectedStage.meridianAssistance}
                  </p>
                </div>
              </div>
            </div>

            {/* Step navigation buttons */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#999D9B]">
                Stage {selectedStage.number} of {WORKFLOW_STAGES.length} in Meridian Orchestration
              </span>
              <div className="flex items-center gap-2">
                {Number(selectedStage.number) > 1 && (
                  <button
                    onClick={() => {
                      const prevIdx = Number(selectedStage.number) - 2;
                      setSelectedStageId(WORKFLOW_STAGES[prevIdx].id);
                    }}
                    className="px-3.5 py-1.5 text-xs text-[#999D9B] hover:text-[#F5F5F2] bg-[#111315] hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
                  >
                    Previous
                  </button>
                )}
                {Number(selectedStage.number) < WORKFLOW_STAGES.length && (
                  <button
                    onClick={() => {
                      const nextIdx = Number(selectedStage.number);
                      setSelectedStageId(WORKFLOW_STAGES[nextIdx].id);
                    }}
                    className="px-3.5 py-1.5 text-xs text-[#08090A] bg-[#D7FF43] hover:bg-[#cbf436] font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    Next Stage
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
