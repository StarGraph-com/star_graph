"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "error" | "success" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  details?: string;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, details?: string, action?: ToastAction) => void;
  error: (message: string, details?: string, action?: ToastAction) => void;
  success: (message: string, action?: ToastAction) => void;
  info: (message: string, details?: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, details?: string, action?: ToastAction) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message, details, action }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const error = useCallback(
    (message: string, details?: string, action?: ToastAction) =>
      showToast("error", message, details, action),
    [showToast]
  );
  const success = useCallback(
    (message: string, action?: ToastAction) =>
      showToast("success", message, undefined, action),
    [showToast]
  );
  const info = useCallback(
    (message: string, details?: string, action?: ToastAction) =>
      showToast("info", message, details, action),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, error, success, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-start gap-3 transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === "error"
                ? "bg-red-50/95 border-red-200 text-red-900"
                : toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                : "bg-slate-50/95 border-slate-200 text-slate-900"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Info className="w-4 h-4 text-indigo-600" />
              )}
            </div>

            <div className="flex-1 text-xs">
              <p className="font-semibold leading-tight">{toast.message}</p>
              {toast.details && (
                <p className="mt-1 text-[11px] opacity-80 font-mono break-all">{toast.details}</p>
              )}
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-2 inline-flex items-center px-2 py-1 rounded bg-indigo-600 text-white font-medium text-[11px] hover:bg-indigo-700 transition-colors shadow-2xs"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
