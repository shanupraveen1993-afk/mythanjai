"use client";

import React from "react";
import { ShieldCheck, Phone, MessageSquare, AlertTriangle, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PreContactVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contactType: "call" | "whatsapp";
  targetName: string;
  phone: string;
}

export default function PreContactVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  contactType,
  targetName,
  phone,
}: PreContactVerificationModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 font-sans relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-4">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-slate-955 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="font-heading font-black text-base text-slate-900 leading-snug">
              {t("safetyTitle")}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {t("connectingWith")} <strong className="text-slate-800">{targetName}</strong> (+91 {phone})
            </p>
          </div>

          {/* Guidelines Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs text-slate-700 font-medium">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">1.</span>
              <p>{t("safetyRule1")}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">2.</span>
              <p>{t("safetyRule2")}</p>
            </div>
            <div className="flex items-start gap-2 text-rose-700 font-semibold bg-rose-50 p-2 rounded-xl border border-rose-200/60">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <p className="text-[11px] leading-tight">
                {t("safetyWarning")}
              </p>
            </div>
          </div>

          {/* Action Buttons: Confirm vs Cancel */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={onConfirm}
              className={`w-full py-3 text-white font-heading font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                contactType === "whatsapp"
                  ? "bg-[#00a884] hover:bg-[#008f6f]"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {contactType === "whatsapp" ? (
                <>
                  <MessageSquare className="w-4 h-4 fill-white stroke-none" />
                  <span>{t("proceedWhatsApp")}</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 fill-current" />
                  <span>{t("proceedCall")}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
            >
              {t("cancel")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
