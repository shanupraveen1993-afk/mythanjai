"use client";

import React from "react";
import { Share2, X, CheckCircle, Sparkles, MessageCircle } from "lucide-react";

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle: string;
  areaTag: string;
  postRoute?: string;
}

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  postTitle,
  areaTag,
  postRoute = "/sell",
}: WhatsAppShareModalProps) {
  if (!isOpen) return null;

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://mythanjai.vercel.app";
  const fullShareUrl = `${siteUrl}${postRoute}`;
  const tamilCaption = `நம்ம தஞ்சாவூர் ஃபீடில் என் விளம்பரம்: "${postTitle}" (${areaTag}). வாங்குவோரும் விற்போரும் பாருங்கள் ➔ ${fullShareUrl}`;

  const handleShareToWhatsApp = () => {
    const encodedText = encodeURIComponent(tamilCaption);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }
    onClose();
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: tamilCaption,
          url: fullShareUrl,
        });
        onClose();
      } catch (e) {
        handleShareToWhatsApp();
      }
    } else {
      handleShareToWhatsApp();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-amber-400/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-5 text-center relative overflow-hidden">
        
        {/* Glow Header Background */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 border border-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 shrink-0">
          <MessageCircle className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center justify-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30 mx-auto">
            <Sparkles className="w-3 h-3" /> Post Published Successfully!
          </span>
          <h3 className="font-heading font-black text-xl text-white mt-1 leading-snug">
            Share on WhatsApp Status for 5x Faster Calls!
          </h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed mt-1">
            Get instant buyer inquiries by sharing your ad link directly to your WhatsApp Status & groups in Thanjavur.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-left flex flex-col gap-1">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Preview Share Message:</span>
          <p className="text-xs text-slate-300 font-sans line-clamp-3 leading-snug">
            {tamilCaption}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleShareToWhatsApp}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 fill-slate-950 stroke-none" />
            <span>Share to WhatsApp Status</span>
          </button>
          
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4 text-slate-400" />
            <span>More Share Options</span>
          </button>
        </div>
      </div>
    </div>
  );
}
