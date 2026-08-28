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
    dismiss: () => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    // If exit confirmation toast, clear previous toasts to guarantee only 1 chip
    if (message.includes("Press back again")) {
      setToasts([{ id, type, message }]);
    } else {
      setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    }

    // Auto dismiss after 2.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 2500);
  }, [removeToast]);

  const toast = React.useMemo(
    () => ({
      success: (msg: string) => addToast("success", msg),
      error: (msg: string) => addToast("error", msg),
      info: (msg: string) => addToast("info", msg),
      dismiss: () => dismissAll(),
    }),
    [addToast, dismissAll]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Capsule Chip Notification Snackbar Container */}
      <div 
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2 max-w-md w-auto px-4 pointer-events-none font-sans select-none"
        style={{ paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 8px), 8px)" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-bounce-in cursor-pointer active:scale-95 whitespace-nowrap max-w-[90vw] ${
              t.type === "success"
                ? "bg-slate-950/95 text-white border-emerald-400/60 shadow-emerald-500/20"
                : t.type === "error"
                ? "bg-slate-950/95 text-white border-rose-400/60 shadow-rose-500/20"
                : "bg-slate-950/95 text-white border-amber-400/60 shadow-amber-500/20"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {t.type === "success" && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
              {t.type === "error" && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
              )}
              {t.type === "info" && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              )}
              <span className="text-xs font-heading font-extrabold tracking-tight text-white truncate">
                {t.message}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(t.id);
              }}
              className="p-0.5 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-colors shrink-0 ml-1 cursor-pointer"
            >
              <X className="w-3 h-3 stroke-[3]" />
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
        dismiss: () => {},
      },
    };
  }
  return context;
}
