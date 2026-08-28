"use client";

import React, { useState, useEffect } from "react";
import { Home, MessageSquare, Plus, Package, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export type AppTab = "home" | "sell" | "need" | "services" | "shops" | "profile" | "chat" | "post" | "listings";

interface BottomTabBarProps {
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps = {}) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { t } = useLanguage();
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    setShouldHide(false);
  }, [pathname]);

  useEffect(() => {
    if (isAtTop) {
      setShouldHide(false);
    } else if (scrollDirection === "down") {
      setShouldHide(true);
    } else if (scrollDirection === "up") {
      setShouldHide(false);
    }
  }, [scrollDirection, isAtTop]);

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
      label: "My Ads",
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
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-[#1E244A] text-white border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] select-none transition-transform duration-300 ease-in-out ${
          shouldHide ? "translate-y-full pointer-events-none" : "translate-y-0 pointer-events-auto"
        }`}
        style={{ paddingBottom: "max(var(--safe-bottom), 8px)" }}
      >
      <div className="flex items-center justify-around h-15 px-2 sm:px-6 w-full max-w-md mx-auto">
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
              className={`flex items-center gap-2 rounded-full min-h-[48px] min-w-[48px] justify-center transition-all duration-300 ease-out cursor-pointer select-none active:scale-95 ${
                isActive
                  ? "bg-[#FBBF24] text-[#1E244A] px-4 py-2 font-heading font-black text-[13px] sm:text-sm shadow-md scale-105 border border-amber-300"
                  : "text-slate-300 hover:text-white font-bold p-2"
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon
                className={`transition-all duration-300 ${
                  isActive
                    ? "w-5 h-5 fill-[#1E244A] text-[#1E244A] stroke-[1.5]"
                    : "w-6 h-6 text-slate-300 stroke-[2] fill-transparent hover:text-white"
                }`}
              />
              {isActive && (
                <span className="truncate max-w-[100px] leading-none text-[13px] sm:text-sm font-black tracking-tight text-[#1E244A] animate-fade-in">
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
