'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmLabel?: string;
  onConfirm?: () => void;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  confirmLabel = 'Understood',
  onConfirm
}: ModalProps) {
  const icons = {
    info: <Info className="text-blue-500" size={32} />,
    success: <CheckCircle2 className="text-emerald-500" size={32} />,
    warning: <AlertTriangle className="text-amber-500" size={32} />,
    error: <AlertCircle className="text-red-500" size={32} />,
  };

  const colors = {
    info: 'border-blue-500',
    success: 'border-emerald-500',
    warning: 'border-amber-500',
    error: 'border-red-500',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border-t-8 ${colors[type]} overflow-hidden`}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  {icons[type]}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="text-gray-400" size={24} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-emerald-950 mb-3 tracking-tight">
                {title}
              </h3>
              <p className="text-gray-600 font-medium leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={onConfirm || onClose}
                  className="flex-1 py-4 bg-emerald-950 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-800 transition-all active:scale-95"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
            
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 -mr-16 -mt-16 rounded-full opacity-50 pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
