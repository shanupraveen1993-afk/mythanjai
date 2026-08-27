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
        className="pointer-events-auto mx-3 max-w-md sm:mx-auto bg-[#1e3a8a]/95 text-white backdrop-blur-2xl rounded-2xl border border-blue-800/80 shadow-[0_10px_35px_rgba(30,58,138,0.4)] px-2 py-1 flex items-center justify-between"
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

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.route)}
              className={`relative flex flex-col items-center justify-center flex-1 h-12 py-0.5 px-1 transition-all duration-200 cursor-pointer rounded-xl ${
                isActive ? "bg-amber-400/20 text-[#FBBF24]" : "text-blue-200/70 hover:text-white"
              }`}
            >
              {/* Top Golden Active Indicator Bar */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-1 bg-[#FBBF24] rounded-full shadow-md shadow-amber-400/80" />
              )}

              <div className="flex items-center justify-center transition-transform active:scale-90">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? "fill-[#FBBF24] text-[#FBBF24] stroke-[1.2] scale-110"
                      : "text-blue-200/70 stroke-[2] fill-transparent"
                  }`}
                />
              </div>

              <span
                className={`text-[10px] tracking-tight font-heading mt-0.5 leading-tight transition-colors ${
                  isActive ? "font-black text-[#FBBF24]" : "font-semibold text-blue-200/70"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
