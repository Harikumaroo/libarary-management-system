import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle color="#10b981" size={20} />,
    error: <XCircle color="#ef4444" size={20} />,
    warning: <AlertTriangle color="#f59e0b" size={20} />,
    info: <Info color="#3b82f6" size={20} />
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="toast"
        >
          {icons[toast.type] || icons.info}
          <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
            {toast.message}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={16} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Toast;
