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
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-[#0F172A] border-t border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] pointer-events-auto select-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
    >
      <div className="flex items-center justify-around h-14 px-2 sm:px-6 w-full max-w-md mx-auto">
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

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.route)}
              className={`flex items-center gap-1.5 rounded-full transition-all duration-300 ease-out cursor-pointer select-none active:scale-95 ${
                isActive
                  ? "bg-[#1d4ed8] text-white px-3.5 py-1.5 font-heading font-black text-xs shadow-md shadow-blue-600/35 scale-105"
                  : "text-slate-400 hover:text-white p-2"
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon
                className={`transition-all duration-300 ${
                  isActive
                    ? "w-4 h-4 fill-white text-white stroke-[1.2]"
                    : "w-5 h-5 text-slate-400 stroke-[2] fill-transparent hover:text-white"
                }`}
              />
              {isActive && (
                <span className="truncate max-w-[90px] leading-none text-xs font-black tracking-tight animate-fade-in">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
