"use client";

import React from "react";
import { Home, MessageSquare, Wrench, Store, User } from "lucide-react";

export type AppTab = "home" | "classifieds" | "services" | "shops" | "profile" | "offers";

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export default function BottomTabBar({
  activeTab,
  onTabChange,
}: BottomTabBarProps) {
  const tabs = [
    {
      id: "home" as AppTab,
      label: "Home",
      icon: Home,
      route: "/",
    },
    {
      id: "sell" as any,
      label: "Sell",
      icon: MessageSquare,
      route: "/sell",
    },
    {
      id: "need" as any,
      label: "Need",
      icon: MessageSquare,
      route: "/need",
    },
    {
      id: "services" as AppTab,
      label: "Service",
      icon: Wrench,
      route: "/services",
    },
    {
      id: "shops" as AppTab,
      label: "Offer",
      icon: Store,
      route: "/shops",
    },
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-safe-bottom shadow-lg shadow-slate-100 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all duration-200 ${
                isActive
                  ? "text-yellow-600 scale-105"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-yellow-500/10 text-yellow-600 scale-110"
                    : "bg-transparent text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="mt-0.5 tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
