'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, AlertCircle, CheckCircle2, Info, AlertTriangle, Gavel } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'security' | 'judicial';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  confirmLabel = 'Understood',
  cancelLabel,
  onConfirm
}: ModalProps) {
  const icons = {
    info: <Info className="text-blue-400" size={32} />,
    success: <CheckCircle2 className="text-emerald-400" size={32} />,
    warning: <AlertTriangle className="text-amber-400" size={32} />,
    error: <AlertCircle className="text-red-400" size={32} />,
    security: <ShieldCheck className="text-emerald-400" size={32} />,
    judicial: <Gavel className="text-emerald-400" size={32} />,
  };

  const glowColors = {
    info: 'shadow-blue-500/20 border-blue-500/30',
    success: 'shadow-emerald-500/20 border-emerald-500/30',
    warning: 'shadow-amber-500/20 border-amber-500/30',
    error: 'shadow-red-500/20 border-red-500/30',
    security: 'shadow-emerald-500/20 border-emerald-500/30',
    judicial: 'shadow-emerald-500/20 border-emerald-500/30',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0f0d]/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className={`
              relative w-full max-w-md overflow-hidden
              bg-[#121c18] border border-white/10 rounded-[2.5rem] shadow-2xl ${glowColors[type]}
            `}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-emerald-500`} />

            <div className="p-8 relative z-10">
              <div className="flex justify-between items-start mb-8">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl shadow-inner"
                >
                  {icons[type]}
                </motion.div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                {title}
              </h3>
              <p className="text-white/60 font-medium leading-relaxed mb-8 text-sm uppercase tracking-wide">
                {message}
              </p>

              <div className="flex gap-4">
                {cancelLabel && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 bg-white/5 text-white/60 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                  >
                    {cancelLabel}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    else onClose();
                  }}
                  className="flex-1 py-4 bg-emerald-500 text-emerald-950 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>

            {/* Design accents */}
            <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-30" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
