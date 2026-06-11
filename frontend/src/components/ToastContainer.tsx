import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import type { Toast } from "../context/ToastContext";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const styles = {
  success: { border: "border-l-green-500", icon: "text-green-600 dark:text-green-400" },
  error:   { border: "border-l-red-500",   icon: "text-red-600 dark:text-red-400" },
  info:    { border: "border-l-blue-500",  icon: "text-blue-600 dark:text-blue-400" },
};

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          const { border, icon } = styles[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-l-[3px] ${border} rounded-lg px-4 py-3 shadow-lg w-72`}
            >
              <Icon size={16} className={`shrink-0 ${icon}`} strokeWidth={2} />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{toast.message}</p>
              <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
