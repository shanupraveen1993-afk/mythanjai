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
      id: "post",
      label: "POST AD",
      icon: Plus,
      route: "/post",
      isCenter: true,
    },
    {
      id: "listings",
      label: "My Listings",
      icon: Package,
      route: "/profile?tab=listings",
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] w-full bg-white/97 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-6px_30px_rgba(0,0,0,0.10)] pointer-events-auto select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around items-center h-16 px-1 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === "home"
              ? pathname === "/"
              : item.id === "post"
              ? pathname.startsWith("/post")
              : item.id === "chat"
              ? pathname.startsWith("/chat")
              : item.id === "listings"
              ? pathname.includes("tab=listings") || pathname.includes("tab=my_posts")
              : pathname === "/profile";

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.route)}
                className="flex flex-col items-center justify-center relative -mt-6 cursor-pointer group"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 border-3 border-white flex items-center justify-center group-hover:scale-105 active:scale-95 transition-all">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="mt-0.5 text-[11px] font-heading font-black text-slate-900 uppercase tracking-wider">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.route)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-all duration-200 cursor-pointer ${
                isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? "bg-slate-900 text-amber-400 shadow-xs"
                    : "bg-transparent text-slate-500"
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <span
                className={`mt-1 text-[11px] tracking-tight font-heading ${
                  isActive ? "font-black text-slate-950" : "font-semibold text-slate-500"
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
