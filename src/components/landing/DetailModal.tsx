import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';

export interface ModalContent {
  title: string;
  category: string;
  tagline: string;
  description: string;
  keyAspects: string[];
  operationalRole: string;
  ctaText?: string;
  ctaAction?: () => void;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModalContent | null;
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#08090A]/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#171A1C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
        >
          {/* Subtle neon lime glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D7FF43]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category Tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#999D9B]">
              {data.category}
            </span>
          </div>

          {/* Title & Tagline */}
          <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F5F2] tracking-tight mb-2 pr-10">
            {data.title}
          </h3>
          <p className="text-sm text-[#D7FF43] font-medium mb-6">
            {data.tagline}
          </p>

          {/* Description */}
          <p className="text-sm sm:text-base text-[#999D9B] leading-relaxed mb-6 pb-6 border-b border-white/10">
            {data.description}
          </p>

          {/* Operational Role Specification */}
          <div className="p-4 bg-[#111315] rounded-xl border border-white/5 mb-6">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#F5F5F2] mb-1.5">
              Meridian Orchestration Protocol
            </h4>
            <p className="text-xs text-[#999D9B] leading-relaxed">
              {data.operationalRole}
            </p>
          </div>

          {/* Key Aspects */}
          <div className="mb-8">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-3">
              Core Technical Capabilities
            </h4>
            <div className="space-y-2.5">
              {data.keyAspects.map((aspect, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#D7FF43] shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-[#F5F5F2]">
                    {aspect}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-[#999D9B] font-mono">
              MERIDIAN ARCHITECTURE · PHASE 1
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#999D9B] hover:text-[#F5F5F2] transition-colors"
              >
                Close
              </button>
              {data.ctaText && data.ctaAction && (
                <button
                  onClick={() => {
                    onClose();
                    data.ctaAction?.();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#08090A] bg-[#D7FF43] hover:bg-[#cbf436] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {data.ctaText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
