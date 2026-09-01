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
  const [isIndividualChatOpen, setIsIndividualChatOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Dynamic real-time snapshot listener for unread chat messages for logged in user
  useEffect(() => {
    if (typeof window === "undefined") return;
    let unsubscribe: any = null;
    const cleanPhone = (localStorage.getItem("namma_thanjai_phone") || localStorage.getItem("my_thanjai_phone") || "").replace(/\D/g, "").slice(-10);

    import("firebase/firestore").then(({ collection, onSnapshot }) => {
      import("@/lib/firebase").then(({ db }) => {
        const notifRef = collection(db, "notifications");
        unsubscribe = onSnapshot(notifRef, (snapshot) => {
          let foundUnread = false;
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            const recipPhone = (d.recipientPhone || "").replace(/\D/g, "").slice(-10);
            if (!d.read && (cleanPhone && recipPhone === cleanPhone || d.recipientId === "all")) {
              foundUnread = true;
            }
          });
          setHasUnreadMessages(foundUnread);
        });
      });
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Detect if an individual chat conversation thread is currently active
  useEffect(() => {
    const checkChatThreadState = () => {
      if (pathname.startsWith("/chat")) {
        if (typeof window !== "undefined") {
          const search = window.location.search;
          const hasQueryParams =
            search.includes("listingId") ||
            search.includes("sellerId") ||
            search.includes("threadId") ||
            search.includes("chatId");

          const isMobileThreadActive =
            sessionStorage.getItem("namma_thanjai_active_chat_thread") === "true";

          setIsIndividualChatOpen(hasQueryParams || isMobileThreadActive);
        }
      } else {
        setIsIndividualChatOpen(false);
      }
    };

    checkChatThreadState();

    if (typeof window !== "undefined") {
      window.addEventListener("namma_thanjai_chat_thread_changed", checkChatThreadState);
      return () => window.removeEventListener("namma_thanjai_chat_thread_changed", checkChatThreadState);
    }
  }, [pathname]);

  const [isInputFocused, setIsInputFocused] = useState(false);

  // Hide bottom tab bar when any input field (like chat search) is focused on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Hide Bottom Navigation on specific routes or when keyboard/input is focused
  const isHiddenRoute =
    pathname.startsWith("/post") ||
    pathname.startsWith("/search") ||
    isInputFocused ||
    (pathname.startsWith("/chat") && isIndividualChatOpen);

  if (isHiddenRoute) return null;

  const navItems = [
    {
      id: "home",
      label: t("home") || "Home",
      icon: Home,
      route: "/",
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      route: "/chat",
    },
    {
      id: "listings",
      label: "My Posts",
      icon: Package,
      route: "/listings",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      route: "/profile",
    },
  ];

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-[#1E244A] text-white border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] select-none transition-transform duration-300 ease-in-out ${
        shouldHide ? "translate-y-full pointer-events-none" : "translate-y-0 pointer-events-auto"
      }`}
      style={{
        paddingTop: "0.5rem",
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-center justify-around px-2 sm:px-6 w-full max-w-md mx-auto py-0">
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
              className={`flex items-center gap-2 rounded-full min-h-[48px] min-w-[48px] justify-center transition-all duration-300 ease-out cursor-pointer select-none active:scale-95 relative ${
                isActive
                  ? "bg-white text-[#1E244A] px-4 py-2 font-heading font-black text-[13px] sm:text-sm shadow-md scale-105 border border-white/90"
                  : "text-slate-300 hover:text-white font-bold p-2"
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`transition-all duration-300 ${
                    isActive
                      ? "w-5 h-5 fill-[#1E244A] text-[#1E244A] stroke-[1.5]"
                      : "w-6 h-6 text-slate-300 stroke-[2] fill-transparent hover:text-white"
                  }`}
                />
                {item.id === "chat" && hasUnreadMessages && !pathname.startsWith("/chat") && !pathname.startsWith("/profile") && !pathname.startsWith("/listings") && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#1E244A] animate-pulse" />
                )}
              </div>
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
