"use client";

import React from "react";
import { Home, MessageSquare, Wrench, Store, User, Tag, ClipboardList } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import { useLanguage } from "@/context/LanguageContext";

export type AppTab = "home" | "sell" | "need" | "services" | "shops" | "profile";

interface BottomTabBarProps {
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
}

export default function BottomTabBar({
  activeTab,
  onTabChange,
}: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    {
      id: "home" as AppTab,
      label: t("home"),
      icon: Home,
      route: "/home",
    },
    {
      id: "sell" as AppTab,
      label: t("sell"),
      icon: Tag,
      route: "/sell",
    },
    {
      id: "need" as AppTab,
      label: t("need"),
      icon: ClipboardList,
      route: "/need",
    },
    {
      id: "services" as AppTab,
      label: t("services"),
      icon: Wrench,
      route: "/services",
    },
    {
      id: "shops" as AppTab,
      label: t("offers"),
      icon: Store,
      route: "/shops",
    },
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (onTabChange) onTabChange(tab.id);
    router.push(tab.route);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[9999] w-full bg-white/97 backdrop-blur-2xl border-t border-slate-200/70 shadow-[0_-6px_30px_rgba(0,0,0,0.10)] md:hidden pointer-events-auto select-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 10px)" }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.route || activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all duration-200 ${
                isActive
                  ? "text-amber-600 scale-105"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-amber-500/15 text-amber-600 scale-110 shadow-sm"
                    : "bg-transparent text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className={`mt-0.5 tracking-wide font-heading ${ isActive ? "font-black text-amber-600" : "font-bold"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
