import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './Modal.css';

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};
const panelVariants = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { type: 'spring', damping: 26, stiffness: 340 } },
  exit:    { opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.18 } },
};

const Modal = ({ open, onClose, title, children, maxWidth = '540px' }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="modal-panel"
            style={{ maxWidth }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{title}</h3>
              <button className="btn btn-ghost btn-icon modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
