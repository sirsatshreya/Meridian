import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setFeedback(`A secure recovery link and temporary credential verification has been dispatched to ${email}. Please check your corporate inbox.`);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#D7FF43]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        <div className="bg-[#171A1C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 space-y-2">
            <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider block">
              SECURITY & CREDENTIAL RECOVERY
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F2]">
              Reset Account Access
            </h1>
            <p className="text-xs text-[#999D9B] leading-relaxed">
              Enter your corporate business email associated with Meridian Trade Systems to initiate access recovery.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#999D9B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="corporate-officer@company.com"
                    required
                    className="w-full bg-[#111315] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>{loading ? 'Transmitting Request...' : 'Send Recovery Dispatch'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="p-4 bg-[#111315] border border-[#D7FF43]/30 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#D7FF43]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="font-bold">Dispatch Dispatched</span>
              </div>
              <p className="text-[#999D9B] leading-relaxed">
                {feedback}
              </p>
              <div className="pt-2 text-[11px] text-[#999D9B]/80 font-mono">
                Security notice: If your company employs Single Sign-On (SSO/SAML), please contact your internal IT administrator.
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigate('/auth')}
              className="text-[#999D9B] hover:text-[#F5F5F2] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Role Selection</span>
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="text-[#D7FF43] hover:underline"
            >
              Public Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
