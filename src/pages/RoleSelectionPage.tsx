import React, { useState } from 'react';
import { ShoppingBag, Store, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface RoleSelectionPageProps {
  onSelectRole: (role: 'BUYER' | 'SELLER') => void;
  onNavigate: (route: string) => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({
  onSelectRole,
  onNavigate,
}) => {
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'SELLER' | null>(null);

  const handleContinue = (role: 'BUYER' | 'SELLER') => {
    onSelectRole(role);
    onNavigate(role === 'BUYER' ? '/login/buyer' : '/login/seller');
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background ambient neon glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#D7FF43]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl w-full relative z-10 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#D7FF43] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
            <span>ROLE-BASED ORCHESTRATION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F5F2] leading-tight">
            Welcome to Meridian.
          </h1>

          <p className="text-base sm:text-lg text-[#999D9B]">
            How would you like to access the platform?
          </p>
        </div>

        {/* Two large interactive cards: Exactly BUYER and SELLER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* BUYER CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedRole('BUYER')}
            className={`p-8 sm:p-10 rounded-2xl bg-[#171A1C] border transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden shadow-2xl ${
              selectedRole === 'BUYER'
                ? 'border-[#D7FF43] ring-1 ring-[#D7FF43]/50'
                : 'border-white/10 hover:border-[#D7FF43]/40'
            }`}
          >
            {/* Top row */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    selectedRole === 'BUYER'
                      ? 'bg-[#D7FF43]/10 border-[#D7FF43] text-[#D7FF43]'
                      : 'bg-[#111315] border-white/10 text-[#F5F5F2]'
                  }`}
                >
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#999D9B]">
                  Role 01
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F2] mb-3">
                BUYER
              </h2>

              <p className="text-sm sm:text-base text-[#999D9B] leading-relaxed mb-6">
                For businesses purchasing products or services from existing international suppliers.
              </p>

              <div className="space-y-2.5 pb-8 border-b border-white/10 text-xs text-[#999D9B]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D7FF43]" />
                  <span>Procurement & trade agreement monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D7FF43]" />
                  <span>Milestone-gated payment verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D7FF43]" />
                  <span>Real-time container & customs telemetry</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinue('BUYER');
                }}
                className={`w-full py-3.5 px-5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  selectedRole === 'BUYER'
                    ? 'bg-[#D7FF43] text-[#08090A] shadow-lg shadow-[#D7FF43]/20'
                    : 'bg-[#111315] hover:bg-[#D7FF43] text-[#F5F5F2] hover:text-[#08090A] border border-white/10'
                }`}
              >
                <span>Continue as Buyer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* SELLER CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedRole('SELLER')}
            className={`p-8 sm:p-10 rounded-2xl bg-[#171A1C] border transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden shadow-2xl ${
              selectedRole === 'SELLER'
                ? 'border-[#D7FF43] ring-1 ring-[#D7FF43]/50'
                : 'border-white/10 hover:border-[#D7FF43]/40'
            }`}
          >
            {/* Top row */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    selectedRole === 'SELLER'
                      ? 'bg-[#D7FF43]/10 border-[#D7FF43] text-[#D7FF43]'
                      : 'bg-[#111315] border-white/10 text-[#F5F5F2]'
                  }`}
                >
                  <Store className="w-7 h-7" />
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#999D9B]">
                  Role 02
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F2] mb-3">
                SELLER
              </h2>

              <p className="text-sm sm:text-base text-[#999D9B] leading-relaxed mb-6">
                For businesses supplying products or services to existing international buyers.
              </p>

              <div className="space-y-2.5 pb-8 border-b border-white/10 text-xs text-[#999D9B]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D7FF43]" />
                  <span>Export contract specification locks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D7FF43]" />
                  <span>Payment status visibility prior to shipment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D7FF43]" />
                  <span>Immutable proof-of-dispatch audit defense</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinue('SELLER');
                }}
                className={`w-full py-3.5 px-5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  selectedRole === 'SELLER'
                    ? 'bg-[#D7FF43] text-[#08090A] shadow-lg shadow-[#D7FF43]/20'
                    : 'bg-[#111315] hover:bg-[#D7FF43] text-[#F5F5F2] hover:text-[#08090A] border border-white/10'
                }`}
              >
                <span>Continue as Seller</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Informative footnote */}
        <div className="text-center pt-4 text-xs text-[#999D9B]">
          <span>Not ready to sign in? </span>
          <button
            onClick={() => onNavigate('/')}
            className="text-[#D7FF43] hover:underline ml-1"
          >
            Return to Public Overview
          </button>
        </div>
      </div>
    </div>
  );
};
