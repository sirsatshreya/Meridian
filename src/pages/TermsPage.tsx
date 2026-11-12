import React from 'react';
import { ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface TermsPageProps {
  onNavigate: (route: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-[#999D9B] hover:text-[#F5F5F2] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="space-y-3 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2 font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
            <span>LEGAL & ORCHESTRATION GOVERNANCE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F5F5F2] tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs text-[#999D9B] font-mono">
            Platform Revision: Phase 1 SaaS Architecture · Meridian Trade Systems Inc.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#999D9B] leading-relaxed">
          {/* Critical Disclaimer Card */}
          <section className="p-6 bg-[#171A1C] rounded-2xl border border-[#D7FF43]/30 space-y-3">
            <div className="flex items-center gap-2 text-[#D7FF43]">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                1. Software Orchestration Layer Only (Non-Bank & Non-Escrow)
              </h2>
            </div>
            <p className="text-[#F5F5F2]">
              Meridian Trade Systems is a cloud-based software-as-a-service (SaaS) workflow orchestration layer. Meridian is NOT a licensed banking institution, trust company, money transmitter, or licensed escrow agent.
            </p>
            <p className="text-xs text-[#999D9B]">
              Any payment coordination, fund reservation, or settlement release is executed exclusively through authorized third-party payment gateways and regulated financial institutions (modeled via PayPal Sandbox in this prototype environment). Meridian coordinates milestone condition triggers and audit logs; it does not custody customer funds.
            </p>
          </section>

          <section className="space-y-3 p-6 bg-[#171A1C] rounded-2xl border border-white/10">
            <h2 className="text-base font-bold text-[#F5F5F2]">
              2. Pre-Existing Bilateral Counterparty Relationship
            </h2>
            <p>
              Meridian does not discover suppliers, match buyers and sellers, provide credit ratings, or endorse trade participants. Users warrant that they enter the Meridian platform with their own mutually pre-agreed international trading partners.
            </p>
          </section>

          <section className="space-y-3 p-6 bg-[#171A1C] rounded-2xl border border-white/10">
            <h2 className="text-base font-bold text-[#F5F5F2]">
              3. Role-Based Account Usage & Security
            </h2>
            <p>
              Users must accurately register under their authentic corporate capacity as either a BUYER or a SELLER. Multi-role impersonation, false KYB representations, or attempting to circumvent role-based workspace boundaries is strictly prohibited.
            </p>
          </section>

          <section className="space-y-3 p-6 bg-[#171A1C] rounded-2xl border border-white/10">
            <h2 className="text-base font-bold text-[#F5F5F2]">
              4. Dispute Support & Evidence Dossiers
            </h2>
            <p>
              Meridian’s AI-assisted dispute tools synthesize objective telemetry, manifest timestamps, and agreed contract clauses. These dossiers are provided as structured reference material to facilitate amicable bilateral resolution; they do not constitute binding judicial arbitration or legal advice.
            </p>
          </section>

          <section className="space-y-3 p-6 bg-[#171A1C] rounded-2xl border border-white/10">
            <h2 className="text-base font-bold text-[#F5F5F2]">
              5. Governing Law
            </h2>
            <p>
              These Terms and your use of Meridian SaaS services shall be governed by international commercial trade frameworks and the state laws of Delaware, without regard to conflict of law principles.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
