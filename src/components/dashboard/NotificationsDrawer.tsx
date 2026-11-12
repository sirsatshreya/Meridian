import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { Bell, X, Check, ExternalLink, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.notifications);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#08090A]/70 backdrop-blur-sm"
        />

        {/* Drawer Window */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md h-full bg-[#171A1C] border-l border-white/10 shadow-2xl z-10 flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#111315]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#171A1C] border border-white/10 rounded-lg text-[#D7FF43]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F2]">Notifications</h3>
                <span className="text-[11px] text-[#999D9B]">
                  {notifications.filter((n) => !n.read).length} unread updates
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#999D9B] hover:text-[#F5F5F2] hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#999D9B]">
                No notifications recorded.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${
                    n.read
                      ? 'bg-[#111315]/60 border-white/5 opacity-80'
                      : 'bg-[#111315] border-[#D7FF43]/30 shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {n.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-[#D7FF43] shrink-0" />}
                      {n.type === 'ACTION_REQUIRED' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                      {n.type === 'INFO' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
                      <span className="font-semibold text-[#F5F5F2]">{n.title}</span>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-[10px] text-[#999D9B] hover:text-[#D7FF43] shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[#999D9B] leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-[#999D9B]/60">
                    <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {n.link && onNavigate && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigate(n.link!);
                        }}
                        className="text-[#D7FF43] hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>View</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
