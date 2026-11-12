import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { FAQItem } from '../../types';

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is Meridian?',
    answer:
      'Meridian Trade Systems is a cloud-based, AI-powered B2B Trade Orchestration SaaS platform. It acts as an intelligent digital coordination layer that helps established international buyers and sellers manage the critical stages of their cross-border trade transactions—from verification and digital contracts to payment coordination, multi-modal shipment monitoring, and evidence-based dispute support.',
    category: 'general',
  },
  {
    question: 'Is Meridian a B2B marketplace?',
    answer:
      'No. Meridian is expressly not a marketplace, directory, or broker. We do not list supplier catalogs, generate leads, rank vendors, or facilitate anonymous supplier matching. Companies join Meridian alongside their existing, pre-vetted international trade counterparties to coordinate real execution workflows.',
    category: 'general',
  },
  {
    question: 'Do I need to find my trading partner through Meridian?',
    answer:
      'No. Meridian is purpose-built for businesses that already know and have chosen their trading partners. Once you establish your account, you link your trade counterpart via a secure corporate invitation code or mutual transaction ID.',
    category: 'general',
  },
  {
    question: 'Who can register on Meridian?',
    answer:
      'Registration is open to legally incorporated commercial entities operating as buyers (importers, procurement corporations, wholesalers) or sellers (exporters, manufacturers, authorized distributors). All registering entities complete business verification and sanctions screening before trade orchestration begins.',
    category: 'role',
  },
  {
    question: 'What does Meridian do for buyers?',
    answer:
      'For buyers, Meridian brings complete end-to-end purchasing visibility: digital trade agreement alignment, Incoterm enforcement, milestone-gated payment coordination with external providers, real-time shipment condition telemetry (temperature, GPS, port dwell times), and objective data dossiers if delivery variances occur.',
    category: 'role',
  },
  {
    question: 'What does Meridian do for sellers?',
    answer:
      'For sellers, Meridian provides immutable transaction documentation, proof-of-delivery reconciliation, verified external escrow/payment confirmation prior to production dispatch, milestone sign-off workflows, and protective audit logs that prevent unsubstantiated buyer payment deductions or chargebacks.',
    category: 'role',
  },
  {
    question: 'How does the SaaS subscription model work?',
    answer:
      'Meridian operates on a transparent SaaS subscription model based on organizational seats and active trade corridor capacity, rather than taking high per-transaction percentage cuts. This keeps trade costs predictable for enterprise logistics, legal, and procurement departments.',
    category: 'financial',
  },
  {
    question: 'How does payment integration work?',
    answer:
      'Meridian coordinates with authorized external payment and escrow providers. In this demonstration prototype, external payments are modeled using PayPal Sandbox endpoints to simulate milestone fund reservations and automated release triggers. In production environments, Meridian integrates with licensed commercial banks and certified global escrow institutions via secure webhooks.',
    category: 'financial',
  },
  {
    question: 'Does Meridian operate its own escrow service?',
    answer:
      'No. Meridian operates strictly as an orchestration and transaction-monitoring software layer. Meridian is not a bank, trust company, or licensed escrow agent. All fund holding and settlement execution occurs exclusively through licensed, regulated financial institutions.',
    category: 'financial',
  },
  {
    question: 'How does AI assist with shipment monitoring and disputes?',
    answer:
      'Meridian’s AI engine ingests real-time IoT telemetry, bill-of-lading milestones, customs logs, and digitized contract clauses. It autonomously identifies schedule deviations or environmental anomalies (such as container temperature spikes) and synthesizes an objective, verifiable evidence dossier to facilitate rapid, amicable dispute settlement.',
    category: 'technology',
  },
];

export const FAQAccordion: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {FAQ_DATA.map((item, idx) => {
        const isOpen = openIndices.includes(idx);
        return (
          <div
            key={idx}
            className={`border rounded-xl transition-all duration-200 overflow-hidden ${
              isOpen
                ? 'bg-[#171A1C] border-[#D7FF43]/30'
                : 'bg-[#111315] hover:bg-[#141719] border-white/5'
            }`}
          >
            <button
              onClick={() => toggleIndex(idx)}
              className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#999D9B]">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="text-sm sm:text-base font-semibold text-[#F5F5F2]">
                  {item.question}
                </span>
              </div>
              <div
                className={`p-1.5 rounded-lg border transition-transform duration-200 shrink-0 ${
                  isOpen
                    ? 'border-[#D7FF43]/30 text-[#D7FF43] rotate-180 bg-[#08090A]'
                    : 'border-white/10 text-[#999D9B] bg-transparent'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-[#999D9B] leading-relaxed border-t border-white/5">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
