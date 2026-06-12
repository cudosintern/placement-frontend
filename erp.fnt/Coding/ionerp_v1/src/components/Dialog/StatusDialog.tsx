import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@headlessui/react';

interface StatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable: () => void;
  onDisable: () => void;
  title?: string;
  message?: string;
}

const StatusDialog: React.FC<StatusDialogProps> = ({ isOpen, onClose, onEnable, onDisable, title = 'Change Status', message = 'Choose the desired status for this record.' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-2xl z-[1010]"
              >
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onDisable}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Disable
                  </button>
                  <button
                    onClick={onEnable}
                    className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Enable
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
};

export default StatusDialog;
