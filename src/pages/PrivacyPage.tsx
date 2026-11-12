import React from 'react';
import { Shield, Lock, FileText, ArrowLeft } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (route: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
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
            <span>GOVERNANCE & DATA INTEGRITY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F5F5F2] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#999D9B] font-mono">
            Effective Date: January 1, 2026 · Meridian Trade Systems Inc.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#999D9B] leading-relaxed">
          <section className="space-y-3 p-6 bg-[#171A1C] rounded-2xl border border-white/10">
            <h2 className="text-base font-bold text-[#F5F5F2] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D7FF43]" />
              <span>1. Strict Non-Marketplace Confidentiality</span>
            </h2>
            <p>
              Meridian Trade Systems operates exclusively as a private B2B orchestration infrastructure for parties with pre-existing trade relationships. Unlike commercial directories or lead brokers, Meridian never sells, indexes, cross-markets, or advertises your supplier identities, customer lists, pricing manifests, or shipping volumes to external third parties.
            </p>
          </section>

          <section className="space-y-3 p-6 bg-[#171A1C] rounded-2xl border border-white/10">
            <h2 className="text-base font-bold text-[#F5F5F2] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#D7FF43]" />
              <span>2. Telemetry and Contract Specification Encapsulation</span>
            </h2>
            <p>
              Data ingested during the trade orchestration lifecycle—including bills of lading, customs declarations, IoT sensor feeds (temperature, humidity, shock), and Incoterm specifications—is accessible only to the authenticated buyer and seller bound to that specific transaction identifier.
            </p>
          </section>

          <section className="space-y-3 p-6 bg-[#171A1C] rounded-2xl border border-white/10">
            <h2 className="text-base font-bold text-[#F5F5F2] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D7FF43]" />
              <span>3. External Payment and Verification Partners</span>
            </h2>
            <p>
              When coordinating external payments (e.g., PayPal Sandbox in prototype and authorized banking/escrow partners in production) and KYB sanctions screening, relevant verification metadata is transmitted via cryptographically signed webhooks strictly to authorize milestone release gates. Meridian does not store customer banking card numbers or raw bank credentials.
            </p>
          </section>

          <section className="space-y-3 p-6 bg-[#171A1C] rounded-2xl border border-white/10">
            <h2 className="text-base font-bold text-[#F5F5F2]">
              4. Corporate Signatory Inquiries
            </h2>
            <p>
              For enterprise data protection officer communications or audit package exports, contact:
              <br />
              <span className="font-mono text-[#F5F5F2] block mt-1">
                privacy@meridian-trade.systems
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
