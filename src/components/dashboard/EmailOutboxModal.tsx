import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EmailOutboxItem } from '../../types';
import { Mail, X, CheckCircle2, ExternalLink, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [emails, setEmails] = useState<EmailOutboxItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailOutboxItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOutbox = async () => {
    setLoading(true);
    try {
      const res = await api.email.getOutbox();
      setEmails(res.outbox);
      if (res.outbox.length > 0 && !selectedEmail) {
        setSelectedEmail(res.outbox[0]);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOutbox();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#08090A]/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-4xl h-[80vh] bg-[#171A1C] border border-white/10 rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#111315]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#171A1C] border border-white/10 rounded-lg text-[#D7FF43]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
                    SIMULATED EMAIL OUTBOX
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-[#D7FF43] font-mono">
                    SANDBOX ADAPTER
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#F5F5F2]">
                  Platform Email Dispatches ({emails.length})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchOutbox}
                disabled={loading}
                className="p-2 text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 rounded-lg transition-colors"
                title="Refresh Outbox"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: Split View (List on left, preview on right) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Email List */}
            <div className="w-2/5 border-r border-white/10 overflow-y-auto divide-y divide-white/5 bg-[#111315]/50">
              {emails.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#999D9B]">
                  No outbound email dispatches recorded yet.
                </div>
              ) : (
                emails.map((eml) => {
                  const isSelected = selectedEmail?.id === eml.id;
                  return (
                    <button
                      key={eml.id}
                      onClick={() => setSelectedEmail(eml)}
                      className={`w-full p-3.5 text-left transition-colors flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-[#171A1C] border-l-2 border-l-[#D7FF43]'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#999D9B]">
                        <span className="font-mono truncate max-w-[140px] text-[#F5F5F2]">
                          {eml.recipientEmail}
                        </span>
                        <span>{new Date(eml.sentAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#F5F5F2] line-clamp-1">
                        {eml.subject}
                      </div>
                      <span className="text-[10px] font-mono text-[#D7FF43]">
                        {eml.templateType}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right Column: Email Content Preview */}
            <div className="w-3/5 p-6 overflow-y-auto space-y-6 bg-[#171A1C]">
              {selectedEmail ? (
                <div className="space-y-6">
                  {/* Metadata Header */}
                  <div className="p-4 bg-[#111315] rounded-xl border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#999D9B]">Recipient:</span>
                      <span className="font-mono text-[#F5F5F2] font-semibold">{selectedEmail.recipientEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#999D9B]">Timestamp:</span>
                      <span className="font-mono text-[#999D9B]">{new Date(selectedEmail.sentAtUtc).toUTCString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#999D9B]">Delivery Status:</span>
                      <span className="font-mono text-[#D7FF43] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SIMULATED_SENT</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#999D9B]">Provider:</span>
                      <span className="text-[11px] text-[#999D9B]">{selectedEmail.provider}</span>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <h4 className="text-lg font-bold text-[#F5F5F2]">{selectedEmail.subject}</h4>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 bg-[#08090A] border border-white/10 rounded-xl space-y-4 text-xs sm:text-sm text-[#F5F5F2] leading-relaxed">
                    <div className="flex items-center gap-2 pb-4 border-b border-white/10 text-xs font-mono text-[#D7FF43]">
                      <span>MERIDIAN TRADE SYSTEMS DISPATCH</span>
                    </div>

                    {selectedEmail.templateType === 'SELLER_INVITATION' && (
                      <div className="space-y-4">
                        <p>Dear {selectedEmail.payloadJson.recipientCompanyName || 'Trade Partner'},</p>
                        <p>
                          <strong className="text-white">{selectedEmail.payloadJson.buyerCompany}</strong> has submitted a commercial Trade Request (Reference: <span className="font-mono text-[#D7FF43]">{selectedEmail.payloadJson.tradeReference}</span>) on Meridian and invited your company to review and coordinate trade terms.
                        </p>
                        <div className="p-3 bg-[#171A1C] rounded-lg border border-white/10 text-xs space-y-1">
                          <div><strong>Commodity:</strong> {selectedEmail.payloadJson.productDescription}</div>
                          <div><strong>Expiry:</strong> {new Date(selectedEmail.payloadJson.expiryDate).toLocaleDateString()}</div>
                        </div>
                        <p>To view the proposed trade specifications, pricing milestones, and confirm acceptance:</p>
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              onClose();
                              if (onNavigate && selectedEmail.payloadJson.invitationLink) {
                                const url = new URL(selectedEmail.payloadJson.invitationLink);
                                onNavigate(url.pathname);
                              }
                            }}
                            className="px-5 py-2.5 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-[#cbf436] transition-colors"
                          >
                            <span>Open Secure Invitation</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedEmail.templateType === 'AGREEMENT_ACCEPTANCE' && (
                      <div className="space-y-3">
                        <p>This confirms that <strong>{selectedEmail.payloadJson.companyName}</strong> has electronically reviewed and accepted the Meridian Master Platform Terms (Agreement 1).</p>
                        <div className="p-3 bg-[#171A1C] rounded-lg border border-white/10 text-xs font-mono space-y-1">
                          <div>Signatory: {selectedEmail.payloadJson.representative}</div>
                          <div>Version: {selectedEmail.payloadJson.version}</div>
                          <div>Acceptance ID: {selectedEmail.payloadJson.acceptanceId}</div>
                          <div>UTC Timestamp: {selectedEmail.payloadJson.date}</div>
                        </div>
                        <p className="text-xs text-[#999D9B]">A permanent cryptographic receipt hash has been recorded in the platform audit trail.</p>
                      </div>
                    )}

                    {selectedEmail.templateType === 'ACCOUNT_REGISTRATION' && (
                      <div className="space-y-3">
                        <p>Welcome to Meridian Trade Systems, {selectedEmail.payloadJson.name}!</p>
                        <p>Your business account has been initialized under the <strong>{selectedEmail.payloadJson.role}</strong> workspace. Next steps: complete your corporate entity KYB verification and review Agreement 1.</p>
                      </div>
                    )}

                    {selectedEmail.templateType === 'EMAIL_VERIFICATION' && (
                      <div className="space-y-3">
                        <p>Hello {selectedEmail.payloadJson.name},</p>
                        <p>Please confirm your corporate business email address using verification token:</p>
                        <div className="p-3 bg-[#171A1C] border border-[#D7FF43]/30 rounded-lg text-center font-mono text-lg font-bold text-[#D7FF43]">
                          {selectedEmail.payloadJson.verifyCode}
                        </div>
                      </div>
                    )}

                    {selectedEmail.templateType === 'SELLER_RESPONSE' && (
                      <div className="space-y-3">
                        <p>The invited seller <strong>{selectedEmail.payloadJson.sellerCompany}</strong> has responded to Trade Request <strong>{selectedEmail.payloadJson.tradeId}</strong>.</p>
                        <div className="p-3 bg-[#171A1C] rounded-lg border border-white/10 text-xs">
                          <div><strong>Status:</strong> {selectedEmail.payloadJson.action}</div>
                          {selectedEmail.payloadJson.notes && (
                            <div><strong>Notes:</strong> {selectedEmail.payloadJson.notes}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedEmail.templateType === 'LOGIN_SUCCESS' && (
                      <div className="space-y-2">
                        <p>Successful sign-in recorded for your Meridian account.</p>
                        <p className="text-xs text-[#999D9B]">If you did not authorize this login, please notify your corporate security administrator immediately.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#999D9B]">
                  Select an email dispatch to preview.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
