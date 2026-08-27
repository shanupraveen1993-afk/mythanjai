"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const toast = React.useMemo(
    () => ({
      success: (msg: string) => addToast("success", msg),
      error: (msg: string) => addToast("error", msg),
      info: (msg: string) => addToast("info", msg),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Toast Notification Container — Positioned safely above bottom tab bar & Android gesture inset */}
      <div 
        className="fixed bottom-20 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-5 z-[99999] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none font-sans"
        style={{ paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 8px), 8px)" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
              t.type === "success"
                ? "bg-slate-900/95 text-white border-emerald-500/40"
                : t.type === "error"
                ? "bg-slate-900/95 text-white border-rose-500/40"
                : "bg-slate-900/95 text-white border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === "info" && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="text-xs font-semibold leading-tight text-slate-100 line-clamp-2">{t.message}</span>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
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
  if (!context) {
    // Fallback if used outside provider
    return {
      toast: {
        success: (msg: string) => console.log("[Toast Success]", msg),
        error: (msg: string) => console.error("[Toast Error]", msg),
        info: (msg: string) => console.info("[Toast Info]", msg),
      },
    };
  }
  return context;
}
