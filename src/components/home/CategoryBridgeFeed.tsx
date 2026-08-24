"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";

export default function CategoryBridgeFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handlePostAction = (route: string) => {
    if (!user) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("namma_thanjai_target_post_route", route);
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push(route);
  };

  return (
    <div className="w-full bg-slate-950 text-white rounded-2xl p-5 shadow-md font-sans my-3 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
          <Handshake className="w-5 h-5 text-[#FBBF24] stroke-[2.5]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="font-heading font-extrabold text-sm text-white flex items-center gap-2">
            <span>{t("matchmakerTitle") || "Direct Local Buyers & Sellers"}</span>
            <span className="text-xs bg-[#FBBF24] text-[#0F172A] px-2 py-0.5 rounded font-black uppercase border-b border-[#D97706]">Instant</span>
          </h4>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {t("matchmakerDesc") || "Connect directly with buyers, sellers, and service providers in Thanjavur."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <button
          onClick={() => handlePostAction("/post/need")}
          className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider text-center rounded-xl cursor-pointer shadow-xs transition-all"
        >
          {t("postRequirement") || "+ Post Requirement"}
        </button>
        <button
          onClick={() => handlePostAction("/post/sell")}
          className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-heading font-black text-xs uppercase tracking-wider text-center rounded-xl cursor-pointer shadow-xs transition-all border border-slate-200"
        >
          {t("sellItem") || "+ Sell Item"}
        </button>
      </div>
    </div>
  );
}
