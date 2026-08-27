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
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      route: "/chat",
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
      id: "profile",
      label: "Profile",
      icon: User,
      route: "/profile",
      isCenter: false,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 w-full bg-white/98 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto select-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 10px)" }}
    >
      <div className="flex items-center justify-between h-14 px-6 sm:px-10 w-full max-w-md mx-auto">
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
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer group ${
                isActive ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {/* Top Golden Accent Line for Active Tab */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#FBBF24] rounded-full shadow-xs shadow-amber-400/60" />
              )}

              <div className="flex items-center justify-center pt-1 transition-transform group-active:scale-90">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? "fill-slate-950 text-slate-950 stroke-[1.2] scale-110"
                      : "text-slate-400 stroke-[2] fill-transparent"
                  }`}
                />
              </div>

              <span
                className={`text-[10px] tracking-tight font-heading mt-1 leading-tight transition-colors ${
                  isActive ? "font-black text-slate-950" : "font-semibold text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
