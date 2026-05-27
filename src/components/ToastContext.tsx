import React, { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, ShieldQuestion } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export interface ConfirmConfig {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "default" | "danger";
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type: "success" | "error") => void;
  showConfirm: (
    configOrMessage: string | Omit<ConfirmConfig, "onConfirm" | "onCancel">,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove logic directly scheduled on trigger
    const duration = type === "success" ? 3500 : 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const showConfirm = (
    configOrMessage: string | Omit<ConfirmConfig, "onConfirm" | "onCancel">,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    if (typeof configOrMessage === "string") {
      setConfirm({
        message: configOrMessage,
        onConfirm,
        onCancel,
        title: "Administrative Check",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        type: "default"
      });
    } else {
      setConfirm({
        message: configOrMessage.message,
        onConfirm,
        onCancel,
        title: configOrMessage.title || "Administrative Check",
        confirmLabel: configOrMessage.confirmLabel || "Confirm",
        cancelLabel: configOrMessage.cancelLabel || "Cancel",
        type: configOrMessage.type || "default"
      });
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Notifications List */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto shadow-lg backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 border ${
                toast.type === "success"
                  ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-100"
                  : "bg-rose-950/95 border-rose-500/30 text-rose-100"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-semibold leading-relaxed flex-1 antialiased">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[10px] uppercase tracking-wider font-bold opacity-60 hover:opacity-100 px-1 font-mono cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Confirmation Modal */}
      <AnimatePresence>
        {confirm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl relative text-left"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className={`w-10 h-10 ${confirm.type === "danger" ? "bg-rose-950/40 text-rose-400 border border-rose-900/40" : "bg-amber-950/40 text-amber-400 border border-amber-900/40"} rounded-2xl flex items-center justify-center shrink-0`}>
                  <ShieldQuestion className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 font-mono">
                  {confirm.title || "Administrative Check"}
                </h3>
              </div>
              
              <p className="text-xs font-semibold text-slate-200 leading-relaxed antialiased mb-6">
                {confirm.message}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm.onCancel) confirm.onCancel();
                    setConfirm(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 transition hover:bg-slate-850 cursor-pointer min-h-[44px] min-w-[44px]"
                >
                  {confirm.cancelLabel || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirm.onConfirm();
                    setConfirm(null);
                  }}
                  className={`px-5 py-2.5 rounded-xl ${
                    confirm.type === "danger"
                      ? "bg-rose-600 hover:bg-rose-500 animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-500"
                  } text-xs font-black uppercase text-white shadow-md hover:shadow-lg transition cursor-pointer min-h-[44px] min-w-[44px]`}
                >
                  {confirm.confirmLabel || "Confirm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

// Custom hook to automatically handle dismiss times
export function useToastWithTimer(toast: Toast, removeToast: (id: string) => void) {
  useEffect(() => {
    const time = toast.type === "success" ? 3500 : 5000;
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, time);
    return () => clearTimeout(timer);
  }, [toast, removeToast]);
}
