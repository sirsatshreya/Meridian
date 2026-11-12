import React, { useState } from 'react';
import { Hero3DCanvas } from '../components/landing/Hero3DCanvas';
import { WorkflowTimeline } from '../components/landing/WorkflowTimeline';
import { FAQAccordion } from '../components/landing/FAQAccordion';
import { DetailModal, ModalContent } from '../components/landing/DetailModal';
import {
  ArrowRight,
  ArrowUpRight,
  Shield,
  Layers,
  FileCheck2,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [modalData, setModalData] = useState<ModalContent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openDetail = (content: ModalContent) => {
    setModalData(content);
    setIsModalOpen(true);
  };

  // Section 3: About Meridian cards
  const aboutCards = [
    {
      id: 'coord',
      title: 'Trade Coordination',
      tagline: 'One synchronized command plane across contracts, shipments, and settlement.',
      description:
        'Manage every distinct stage of an international commercial transaction without disjointed email chains, lost paper manifests, or untracked amendments.',
      operationalRole:
        'Meridian connects both trading counterparties into an immutable state machine where progression requires verified mutual consensus.',
      keyAspects: [
        'Deterministic stage progression from trade term alignment to final delivery sign-off.',
        'Synchronized versioning for bills of lading, commercial invoices, and packing lists.',
        'Cross-departmental seats for logistics coordinators, legal counsel, and finance directors.',
      ],
      icon: Layers,
    },
    {
      id: 'transp',
      title: 'Transaction Transparency',
      tagline: 'Real-time visibility into milestone states, payment locks, and multi-modal tracking.',
      description:
        'Maintain absolute visibility into agreement statuses, commercial milestones, external payment holds, and live transit events without waiting for manual carrier updates.',
      operationalRole:
        'Meridian ingests real-time webhooks from external financial partners and global freight APIs to keep both counterparties on the exact same page.',
      keyAspects: [
        'Live milestone gate verification backed by cryptographic timestamps.',
        'External payment release criteria visible to both buyer and seller in advance.',
        'Consolidated freight and customs checkpoint status updates.',
      ],
      icon: Activity,
    },
    {
      id: 'risk',
      title: 'AI-Assisted Risk Management',
      tagline: 'Objective anomaly detection and evidence dossiers to prevent dispute escalation.',
      description:
        'Identify unusual shipment conditions, delayed port clearances, or contractual variances early, with automated evidence compilation to resolve friction before litigation.',
      operationalRole:
        'Meridian benchmarks live telemetry against agreed contract tolerances and generates unbiased incident dossiers for rapid settlement.',
      keyAspects: [
        'Continuous analysis of container condition telemetry (thermal excursions, route shock).',
        'Automatic cross-referencing between delivery discrepancies and contract penalty clauses.',
        'Neutral evidence dossier export ready for mutual arbitration or insurance claims.',
      ],
      icon: Sparkles,
    },
  ];

  // Section 5: For Buyers features
  const buyerFeatures = [
    {
      title: 'Business Registration',
      tagline: 'Corporate identity verification & counterparty linking.',
      description:
        'Register your corporate procurement entity, add authorized signatories, and link pre-existing international suppliers securely via corporate connection tokens.',
      operationalRole:
        'Validates counterparty legitimacy upfront without advertising your trade connections to external marketplaces.',
      keyAspects: [
        'Enterprise identity validation & domain verification',
        'Direct counterparty invitation without directory listings',
        'Multi-entity procurement desk structuring',
      ],
      icon: Building2,
    },
    {
      title: 'Business Verification',
      tagline: 'KYB diligence & sanctions screening.',
      description:
        'Verify your international supplier’s commercial registration, ownership structures, and compliance credentials before committing capital.',
      operationalRole:
        'Generates comprehensive verification audit packages meeting international cross-border compliance standards.',
      keyAspects: [
        'Global trade registry and corporate entity cross-checking',
        'Sanctions list screening (OFAC, EU, UN sanctions monitors)',
        'Standardized verification certificates for internal auditors',
      ],
      icon: Shield,
    },
    {
      title: 'Trade Agreement Management',
      tagline: 'Standardized Incoterm terms & milestone locks.',
      description:
        'Structure clear commercial terms, product specifications, inspection thresholds, and agreed Incoterms in a tamper-resistant digital agreement.',
      operationalRole:
        'Locks contract terms so neither party can alter milestones unilaterally without explicit cryptographic approval.',
      keyAspects: [
        'Incoterm 2020 clause reconciliation (FOB, CIF, CFR, DDP)',
        'Milestone-driven release gates tied to verified inspection reports',
        'Cryptographic dual-party contract finalization',
      ],
      icon: FileCheck2,
    },
    {
      title: 'Payment Workflow Visibility',
      tagline: 'Milestone escrow visibility via external providers.',
      description:
        'Monitor committed purchase funds held securely with authorized external payment partners, ensuring funds release only when agreed criteria are fulfilled.',
      operationalRole:
        'Coordinates payment states directly with external banking and escrow APIs (such as PayPal Sandbox during demonstration).',
      keyAspects: [
        'Transparent view of reserved capital and conditional disbursement rules',
        'Automated release triggers upon verified proof-of-delivery sign-off',
        'Protection against premature fund dispersal before milestone validation',
      ],
      icon: Lock,
    },
    {
      title: 'Shipment Monitoring',
      tagline: 'Multi-carrier telemetry & container condition checks.',
      description:
        'Track international freight milestones across ocean, air, and rail carriers, with real-time temperature, humidity, and location updates.',
      operationalRole:
        'Aggregates disparate freight carrier data into a single coherent timeline for your logistics and procurement teams.',
      keyAspects: [
        'Vessel tracking, port dwell times, and AIS vessel coordinates',
        'IoT sensor threshold tracking (cold chain integrity, transit shock)',
        'Proactive delay warnings for customs clearance holdups',
      ],
      icon: Activity,
    },
    {
      title: 'Dispute Support',
      tagline: 'Objective evidence dossiers & resolution assistance.',
      description:
        'In the event of cargo damage, transit delay, or specification variance, access a structured evidence package to resolve claims fairly.',
      operationalRole:
        'Synthesizes sensor logs, bills of lading, and contract clauses into a neutral evidentiary report.',
      keyAspects: [
        'Structured anomaly timelines mapped directly to contract clauses',
        'Exportable evidence packages for marine cargo insurance',
        'Fair settlement allocation recommendations based on agreed terms',
      ],
      icon: AlertTriangle,
    },
  ];

  // Section 6: For Sellers features
  const sellerFeatures = [
    {
      title: 'Business Registration',
      tagline: 'Verified supplier profile & buyer relationship management.',
      description:
        'Establish your export enterprise profile, verify manufacturing capabilities, and connect directly with existing international corporate clients.',
      operationalRole:
        'Maintains confidential bilateral trade channels without exposing customer lists to competitor directories.',
      keyAspects: [
        'Official export entity and facility registration',
        'Direct relationship onboarding via private invitation keys',
        'Granular role-based permissions for factory and export staff',
      ],
      icon: Building2,
    },
    {
      title: 'Business Verification',
      tagline: 'Demonstrable trust & compliance credentials.',
      description:
        'Complete KYB verification to build immediate institutional trust with international buyers and their external trade financiers.',
      operationalRole:
        'Pre-qualifies your export operations for faster milestone payment processing with financial providers.',
      keyAspects: [
        'Verified corporate and manufacturing registry credentials',
        'Streamlined compliance documentation exchange',
        'Institutional assurance for global purchasing officers',
      ],
      icon: Shield,
    },
    {
      title: 'Agreement Management',
      tagline: 'Unambiguous commercial terms & clear specifications.',
      description:
        'Define explicit delivery tolerances, payment milestones, and quality acceptance windows to prevent unreasonable buyer deductions.',
      operationalRole:
        'Ensures buyers sign off on strict inspection criteria before manufacturing and export shipment begin.',
      keyAspects: [
        'Clear specification thresholds and accepted variance metrics',
        'Fixed review and sign-off windows for destination inspection',
        'Tamper-proof digital records of all agreed amendments',
      ],
      icon: FileCheck2,
    },
    {
      title: 'Payment Status Visibility',
      tagline: 'Verified fund reservations prior to dispatch.',
      description:
        'Gain verified confirmation that buyer funds or documentary credits are committed with external financial institutions before shipping.',
      operationalRole:
        'Protects sellers from non-payment risk and bad debt through transparent external fund reservation monitoring.',
      keyAspects: [
        'Live confirmation of external escrow fund commitments',
        'Automated milestone payout requests upon Bill of Lading upload',
        'Protection against unilateral buyer chargebacks',
      ],
      icon: Lock,
    },
    {
      title: 'Shipment Progress Monitoring',
      tagline: 'Documented custody transfer & carrier checkpoints.',
      description:
        'Record custody handoffs to freight forwarders and ocean carriers with verifiable digital receipts and bill-of-lading endorsements.',
      operationalRole:
        'Establishes proof of compliance with Incoterms at origin (e.g., FOB railhead or vessel rail).',
      keyAspects: [
        'Digital timestamping of carrier receipt notes and customs declarations',
        'Real-time vessel transit updates visible to both parties',
        'Automated notification to buyers upon milestone completion',
      ],
      icon: Activity,
    },
    {
      title: 'Dispute Documentation',
      tagline: 'Immutable defense records against unwarranted claims.',
      description:
        'Protect your business with certified factory inspection logs, pre-shipment photos, and sensor telemetry showing compliance at dispatch.',
      operationalRole:
        'Maintains a legally sound audit trail proving that goods met contract criteria when custody was transferred.',
      keyAspects: [
        'Pre-shipment inspection certificates linked to trade contracts',
        'Chain of custody verification demonstrating carrier responsibility',
        'Rapid mediation dossiers that prevent prolonged payment freezes',
      ],
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="w-full bg-[#08090A] text-[#F5F5F2] selection:bg-[#D7FF43] selection:text-[#08090A]">
      {/* SECTION 2 — HERO SECTION */}
      <section
        id="hero"
        className="relative pt-32 sm:pt-36 lg:pt-44 pb-20 sm:pb-28 overflow-hidden border-b border-white/5"
      >
        {/* Subtle radial ambient illumination */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#D7FF43]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Editorial Headline & Copy */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              {/* Refined unboxed kicker (anti-slop: clean text, no pill box) */}
              <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-[#D7FF43]">
                <span className="w-2 h-2 rounded-full bg-[#D7FF43]" />
                <span>AI-POWERED GLOBAL TRADE ORCHESTRATION</span>
              </div>

              {/* Oversized editorial headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F5F5F2] leading-[1.08] text-balance">
                Every Trade.
                <br />
                <span className="text-[#D7FF43]">One Connected</span> Platform.
              </h1>

              {/* Alternative supporting headline */}
              <p className="text-lg sm:text-xl font-medium text-[#F5F5F2]/90 tracking-tight">
                Coordinate global trade with clarity.
              </p>

              {/* Precise description */}
              <p className="text-sm sm:text-base text-[#999D9B] max-w-xl leading-relaxed text-balance">
                From business verification and digital agreements to payment coordination, shipment monitoring and dispute support, Meridian brings your international trade workflow together.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('about');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 text-xs font-semibold text-[#F5F5F2] bg-[#171A1C] hover:bg-[#202428] border border-white/10 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>Explore Meridian</span>
                  <ArrowRight className="w-4 h-4 text-[#D7FF43]" />
                </button>

                <button
                  onClick={() => onNavigate('/auth')}
                  className="px-6 py-3.5 text-xs font-semibold text-[#08090A] bg-[#D7FF43] hover:bg-[#cbf436] rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xl shadow-[#D7FF43]/10"
                >
                  <span>Get Started</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* Subtle architectural trust footnote */}
              <div className="pt-6 border-t border-white/5 flex flex-wrap items-center gap-6 text-xs text-[#999D9B] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#D7FF43]">·</span>
                  <span>Direct Counterparty Coordination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#D7FF43]">·</span>
                  <span>External Payment Integrations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#D7FF43]">·</span>
                  <span>Non-Marketplace Architecture</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Interactive Canvas visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl bg-[#111315]/80 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm">
                <Hero3DCanvas />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — ABOUT MERIDIAN */}
      <section id="about" className="py-24 sm:py-32 border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16 space-y-4">
            <span className="font-mono text-xs text-[#D7FF43] tracking-widest uppercase">
              ABOUT MERIDIAN TRADE SYSTEMS
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F2] leading-tight text-balance">
              International Trade Is Complex. Managing It Shouldn't Be.
            </h2>
            <p className="text-base sm:text-lg text-[#999D9B] leading-relaxed">
              Even after finding a trading partner, international businesses face several challenges in managing agreements, payment workflows, shipment conditions and transaction disputes. Meridian provides a centralized SaaS platform to coordinate these stages more efficiently.
            </p>
          </div>

          {/* Three large interactive information cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {aboutCards.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() =>
                    openDetail({
                      title: card.title,
                      category: 'CORE CAPABILITY',
                      tagline: card.tagline,
                      description: card.description,
                      keyAspects: card.keyAspects,
                      operationalRole: card.operationalRole,
                      ctaText: 'View 8-Stage Workflow',
                      ctaAction: () => {
                        document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
                      },
                    })
                  }
                  className="group p-8 rounded-2xl bg-[#171A1C] border border-white/10 hover:border-[#D7FF43]/40 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-xl"
                >
                  {/* Subtle hover gradient accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D7FF43]/5 rounded-full blur-2xl group-hover:bg-[#D7FF43]/10 transition-all pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-3 bg-[#111315] rounded-xl border border-white/10 text-[#D7FF43] group-hover:border-[#D7FF43]/40 transition-colors">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-xs text-[#999D9B]">
                        0{idx + 1}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#F5F5F2] mb-3 group-hover:text-[#D7FF43] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-[#999D9B] leading-relaxed mb-6">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#D7FF43]">
                    <span>Inspect Architecture</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 — THE MERIDIAN WORKFLOW */}
      <section id="workflow" className="py-24 sm:py-32 border-b border-white/5 bg-[#111315]/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 space-y-4">
            <span className="font-mono text-xs text-[#D7FF43] tracking-widest uppercase">
              ORCHESTRATION PIPELINE
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F2] leading-tight">
              From Agreement to Delivery.
            </h2>
            <p className="text-base sm:text-lg text-[#999D9B] leading-relaxed">
              Explore the eight distinct stages coordinated through Meridian. Select any phase to review operational objectives, significance, and Meridian's software assistance.
            </p>
          </div>

          <WorkflowTimeline />
        </div>
      </section>

      {/* SECTION 5 — FOR BUYERS */}
      <section id="buyers" className="py-24 sm:py-32 border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
                <span className="font-mono text-xs text-[#D7FF43] tracking-widest uppercase">
                  PROCUREMENT & IMPORTERS
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F2] leading-tight">
                Built for the Businesses That Buy.
              </h2>
              <p className="text-base sm:text-lg text-[#999D9B] leading-relaxed">
                Manage your international purchasing transactions with greater visibility, organized agreements and intelligent trade coordination.
              </p>
            </div>

            <button
              onClick={() => onNavigate('/auth?role=buyer')}
              className="px-6 py-3.5 text-xs font-semibold text-[#08090A] bg-[#D7FF43] hover:bg-[#cbf436] rounded-xl transition-all duration-200 flex items-center gap-2 self-start lg:self-auto cursor-pointer shadow-lg"
            >
              <span>Continue as Buyer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 6 Feature cards for buyers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buyerFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  onClick={() =>
                    openDetail({
                      title: feat.title,
                      category: 'BUYER FEATURE',
                      tagline: feat.tagline,
                      description: feat.description,
                      keyAspects: feat.keyAspects,
                      operationalRole: feat.operationalRole,
                      ctaText: 'Access Buyer Portal',
                      ctaAction: () => onNavigate('/login/buyer'),
                    })
                  }
                  className="p-6 rounded-2xl bg-[#171A1C] border border-white/10 hover:border-[#D7FF43]/40 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-2.5 bg-[#111315] rounded-lg border border-white/5 text-[#D7FF43]">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs text-[#999D9B]">0{idx + 1}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#F5F5F2] mb-2 group-hover:text-[#D7FF43] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#999D9B] leading-relaxed mb-4">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#999D9B] group-hover:text-[#F5F5F2]">
                    <span>View Buyer Protocol</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#D7FF43]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6 — FOR SELLERS */}
      <section id="sellers" className="py-24 sm:py-32 border-b border-white/5 bg-[#111315]/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
                <span className="font-mono text-xs text-[#D7FF43] tracking-widest uppercase">
                  MANUFACTURERS & EXPORTERS
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F2] leading-tight">
                Built for the Businesses That Supply.
              </h2>
              <p className="text-base sm:text-lg text-[#999D9B] leading-relaxed">
                Manage international sales transactions, coordinate agreements and maintain visibility into payments, shipment conditions and trade-related issues.
              </p>
            </div>

            <button
              onClick={() => onNavigate('/auth?role=seller')}
              className="px-6 py-3.5 text-xs font-semibold text-[#08090A] bg-[#D7FF43] hover:bg-[#cbf436] rounded-xl transition-all duration-200 flex items-center gap-2 self-start lg:self-auto cursor-pointer shadow-lg"
            >
              <span>Continue as Seller</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 6 Feature cards for sellers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellerFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  onClick={() =>
                    openDetail({
                      title: feat.title,
                      category: 'SELLER FEATURE',
                      tagline: feat.tagline,
                      description: feat.description,
                      keyAspects: feat.keyAspects,
                      operationalRole: feat.operationalRole,
                      ctaText: 'Access Seller Portal',
                      ctaAction: () => onNavigate('/login/seller'),
                    })
                  }
                  className="p-6 rounded-2xl bg-[#171A1C] border border-white/10 hover:border-[#D7FF43]/40 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-2.5 bg-[#111315] rounded-lg border border-white/5 text-[#D7FF43]">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs text-[#999D9B]">0{idx + 1}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#F5F5F2] mb-2 group-hover:text-[#D7FF43] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#999D9B] leading-relaxed mb-4">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#999D9B] group-hover:text-[#F5F5F2]">
                    <span>View Seller Protocol</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#D7FF43]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7 — WHY MERIDIAN? */}
      <section id="why" className="py-24 sm:py-32 border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16 space-y-4">
            <span className="font-mono text-xs text-[#D7FF43] tracking-widest uppercase">
              SYSTEM FOUNDATIONS
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F2] leading-tight">
              Why Meridian?
            </h2>
            <p className="text-base sm:text-lg text-[#999D9B] leading-relaxed">
              International trade execution has historically been fragmented across siloed customs brokers, disparate email threads, and manual phone calls. Meridian bridges these divides with four structural pillars.
            </p>
          </div>

          {/* Four key pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-[#171A1C] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-[#D7FF43]">PILLAR 01</span>
                <span className="text-xs text-[#999D9B] font-mono">/ UNIFIED EXECUTION</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
                Centralized Trade Management
              </h3>
              <p className="text-sm text-[#999D9B] leading-relaxed">
                Consolidate your multi-jurisdiction trade contracts, customs documentation, Incoterm definitions, and delivery sign-offs within a single synchronized dashboard accessible to all designated stakeholders.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#171A1C] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-[#D7FF43]">PILLAR 02</span>
                <span className="text-xs text-[#999D9B] font-mono">/ INTELLIGENT AGENTS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
                AI-Assisted Coordination
              </h3>
              <p className="text-sm text-[#999D9B] leading-relaxed">
                Automated reconciliation of shipping bills against contract terms, early flagging of transit temperature excursions or dwell time delays, and structured clause synthesis without human bias.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#171A1C] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-[#D7FF43]">PILLAR 03</span>
                <span className="text-xs text-[#999D9B] font-mono">/ AUDIT READINESS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
                Transaction Transparency
              </h3>
              <p className="text-sm text-[#999D9B] leading-relaxed">
                Clear visibility into external escrow statuses, carrier handover receipts, and mutual milestone locks ensures both sides operate on identical verified facts at every step.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#171A1C] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-[#D7FF43]">PILLAR 04</span>
                <span className="text-xs text-[#999D9B] font-mono">/ OBJECTIVE DOSSIERS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F5F5F2]">
                Evidence-Based Risk Management
              </h3>
              <p className="text-sm text-[#999D9B] leading-relaxed">
                Disputes are met with objective data: timestamps, GPS traces, container sensor graphs, and matched contract penalty clauses—short-circuiting months of contentious debate into amicable resolution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FAQ */}
      <section id="faq" className="py-24 sm:py-32 border-b border-white/5 bg-[#111315]/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16 space-y-4 text-center mx-auto">
            <span className="font-mono text-xs text-[#D7FF43] tracking-widest uppercase">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F2] leading-tight">
              Platform & Governance Clarifications.
            </h2>
            <p className="text-base sm:text-lg text-[#999D9B] leading-relaxed">
              Clear answers regarding Meridian’s orchestration model, counterparty relationships, and payment coordination protocols.
            </p>
          </div>

          <FAQAccordion />
        </div>
      </section>

      {/* SECTION 9 — FINAL CTA */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        {/* Neon lime ambient light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#D7FF43]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <span className="font-mono text-xs text-[#D7FF43] tracking-widest uppercase">
            ORCHESTRATE YOUR INTERNATIONAL TRADE
          </span>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F5F5F2] leading-tight text-balance">
            Bring Your Trade Workflow Together.
          </h2>

          <p className="text-base sm:text-xl text-[#999D9B] max-w-2xl mx-auto leading-relaxed text-balance">
            Start coordinating your international business transactions through Meridian.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/auth')}
              className="px-8 py-4 text-sm font-semibold text-[#08090A] bg-[#D7FF43] hover:bg-[#cbf436] rounded-xl transition-all duration-200 shadow-2xl shadow-[#D7FF43]/20 flex items-center gap-2 cursor-pointer group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('workflow');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 text-sm font-medium text-[#F5F5F2] bg-[#171A1C] hover:bg-[#202428] border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Explore 8-Stage Workflow
            </button>
          </div>
        </div>
      </section>

      {/* Detail Inspection Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData}
      />
    </div>
  );
};
