"use client";

import React, { useEffect } from "react";
import { Home, MessageSquare, Plus, Package, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export type AppTab = "home" | "sell" | "need" | "services" | "shops" | "profile" | "chat" | "post" | "listings";

interface BottomTabBarProps {
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps = {}) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { t } = useLanguage();

  useEffect(() => {
    try {
      router.prefetch("/");
      router.prefetch("/chat");
      router.prefetch("/post");
      router.prefetch("/profile");
    } catch (e) {}
  }, [router]);

  const getDynamicPostRoute = () => {
    if (pathname.includes("/need")) return "/post/need";
    if (pathname.includes("/service")) return "/post/service";
    if (pathname.includes("/shops") || pathname.includes("/offer")) return "/post/offer";
    if (pathname.includes("/sell")) return "/post/sell";

    if (typeof window !== "undefined") {
      const activePill = localStorage.getItem("namma_thanjai_active_segment");
      if (activePill === "need") return "/post/need";
      if (activePill === "service") return "/post/service";
      if (activePill === "offer") return "/post/offer";
      if (activePill === "sell") return "/post/sell";
    }

    return "/post/sell";
  };

  const navItems = [
    {
      id: "home",
      label: t("home") || "Home",
      icon: Home,
      route: "/",
      isCenter: false,
    },
    {
      id: "listings",
      label: "My Listings",
      icon: Package,
      route: "/listings",
      isCenter: false,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      route: "/chat",
      isCenter: false,
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      route: "/profile",
      isCenter: false,
    },
  ];

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 w-full pointer-events-none select-none pb-[max(env(safe-area-inset-bottom,0px),8px)]"
    >
      <nav
        className="pointer-events-auto mx-3.5 max-w-md sm:mx-auto bg-[#0F172A]/95 text-white backdrop-blur-2xl rounded-full border border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-1.5 flex items-center justify-around gap-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === "home"
              ? pathname === "/" ||
                pathname.includes("/sell") ||
                pathname.includes("/need") ||
                pathname.includes("/service") ||
                pathname.includes("/shops") ||
                pathname.includes("/offer")
              : item.id === "post"
              ? pathname.startsWith("/post")
              : item.id === "chat"
              ? pathname.startsWith("/chat")
              : item.id === "listings"
              ? pathname.startsWith("/listings") || pathname.includes("tab=listings") || pathname.includes("tab=my_posts")
              : pathname === "/profile";

          if (isActive) {
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.route)}
                className="bg-[#1d4ed8] text-white px-4 py-2 rounded-full flex items-center gap-2 font-heading font-black text-xs shadow-md shadow-blue-600/30 transition-all duration-300 scale-105 shrink-0 cursor-pointer"
              >
                <Icon className="w-4.5 h-4.5 fill-white text-white stroke-[1.2]" />
                <span className="truncate max-w-[100px] leading-none">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.route)}
              className="p-2.5 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-90"
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 text-slate-400 stroke-[2] fill-transparent hover:text-white transition-colors" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
