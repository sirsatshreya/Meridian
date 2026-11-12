import React from 'react';
import { MeridianLogo } from './MeridianLogo';
import { Shield, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#08090A] border-t border-white/10 text-xs text-[#999D9B] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <MeridianLogo size="md" />
            <p className="text-xs sm:text-sm text-[#999D9B] max-w-sm leading-relaxed">
              Meridian Trade Systems is an AI-powered SaaS orchestration platform for pre-vetted international trade partners. We coordinate contracts, milestones, IoT condition monitoring, and dispute resolution.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-[#D7FF43]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
              <span>ORCHESTRATION LAYER ONLY · NOT A BANK OR ESCROW AGENT</span>
            </div>
          </div>

          {/* Column 1: Platform & Architecture */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#F5F5F2]">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    onNavigate('/');
                    setTimeout(() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                  className="hover:text-[#F5F5F2] transition-colors"
                >
                  8-Stage Workflow
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('/');
                    setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                  className="hover:text-[#F5F5F2] transition-colors"
                >
                  Coordination Engine
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('/');
                    setTimeout(() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                  className="hover:text-[#F5F5F2] transition-colors"
                >
                  Risk Architecture
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('/');
                    setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                  className="hover:text-[#F5F5F2] transition-colors"
                >
                  Platform FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Portals */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#F5F5F2]">
              Workspaces
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('/login/buyer')}
                  className="hover:text-[#F5F5F2] transition-colors flex items-center gap-1"
                >
                  <span>Buyer Portal</span>
                  <ArrowUpRight className="w-3 h-3 text-[#D7FF43]" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/login/seller')}
                  className="hover:text-[#F5F5F2] transition-colors flex items-center gap-1"
                >
                  <span>Seller Portal</span>
                  <ArrowUpRight className="w-3 h-3 text-[#D7FF43]" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/auth')}
                  className="hover:text-[#F5F5F2] transition-colors"
                >
                  Role Selection
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/forgot-password')}
                  className="hover:text-[#F5F5F2] transition-colors"
                >
                  Password Recovery
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Governance */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#F5F5F2]">
              Governance
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('/legal-documents')}
                  className="hover:text-[#D7FF43] text-left transition-colors font-mono text-[11px]"
                >
                  Legal Documents (12 Drafts)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-[#F5F5F2] transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-[#F5F5F2] transition-colors text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <span className="text-[#999D9B]/60 block text-[11px]">
                  Commercial Inquiries: desk@meridian-trade.systems
                </span>
              </li>
              <li>
                <span className="text-[#999D9B]/60 block text-[11px]">
                  Registered Jurisdiction: Delaware / Singapore (Trade Hub)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#999D9B]/80">
          <div>
            © {new Date().getFullYear()} Meridian Trade Systems Inc. All international rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[11px] text-[#D7FF43]">Phase 2 Production Architecture</span>
            <button
              onClick={() => onNavigate('/internal/admin')}
              className="text-[#999D9B]/40 hover:text-[#D7FF43] text-[10px] font-mono tracking-wider transition-colors"
            >
              [INTERNAL]
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
