"use client";

import React from "react";
import { AlertCircle, Bookmark, Trash2 } from "lucide-react";

interface DraftProtectionModalProps {
  isOpen: boolean;
  onSaveDraft: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export default function DraftProtectionModal({
  isOpen,
  onSaveDraft,
  onDiscard,
  onCancel,
}: DraftProtectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
          <AlertCircle className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-heading font-black text-lg text-slate-900">Unsaved Changes</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            You have entered information in this post form. Would you like to save it as a draft or discard it?
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {/* 1. Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            className="w-full bg-[#1F244A] hover:bg-[#151936] text-white font-heading font-black text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <Bookmark className="w-4 h-4 fill-white text-white" />
            <span>Save Draft</span>
          </button>

          {/* 2. Discard Button */}
          <button
            type="button"
            onClick={onDiscard}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-heading font-extrabold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-rose-200 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Discard</span>
          </button>

          {/* 3. Continue Editing */}
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1 cursor-pointer"
          >
            Continue Editing
          </button>
        </div>
      </div>
    </div>
  );
}
