"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Phone, MessageSquare, ShieldCheck, Clock, ArrowRight, Trash2, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface NotificationItem {
  id: string;
  type: "call_request" | "chat" | "price_drop" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  phone?: string;
}

export default function NotificationDrawer() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "call_request" | "chat" | "system">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener("namma_thanjai_open_notifications", handleOpen);
    window.addEventListener("namma_thanjai_close_notifications", handleClose);

    return () => {
      window.removeEventListener("namma_thanjai_open_notifications", handleOpen);
      window.removeEventListener("namma_thanjai_close_notifications", handleClose);
    };
  }, []);

  // Real-Time Firestore Notification Listener across current user UID & Phone Number
  useEffect(() => {
    const currentUid = user?.uid || "";
    const currentPhone = profile?.phone ? profile.phone.replace(/\D/g, "") : "";
    const cleanCurrentPhone = currentPhone.slice(-10);
    const currentMemberId = profile?.memberId || "";

    if (!currentUid && !cleanCurrentPhone && !currentMemberId) return;

    const notifRef = collection(db, "notifications");
    const unsubscribe = onSnapshot(
      notifRef,
      (snapshot) => {
        const list: NotificationItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const cleanRecipPhone = (data.recipientPhone || "").replace(/\D/g, "").slice(-10);

          const isRecipient = Boolean(
            data.recipientId === "all" ||
            data.recipientId === "broadcast" ||
            data.recipientPhone === "all" ||
            !data.recipientId ||
            (currentUid && data.recipientId === currentUid) ||
            (currentMemberId && (data.recipientId === currentMemberId || data.recipientPhone === currentMemberId)) ||
            (cleanCurrentPhone && (
              cleanRecipPhone === cleanCurrentPhone ||
              (data.recipientId && String(data.recipientId).replace(/\D/g, "").endsWith(cleanCurrentPhone))
            ))
          );

          if (isRecipient) {
            const item: NotificationItem = {
              id: docSnap.id,
              type: data.type || "chat",
              title: data.title || "New Alert",
              message: data.message || "",
              timestamp: data.timestamp?.seconds
                ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Just now",
              read: Boolean(data.read),
              actionUrl: data.actionUrl || "/chat",
              phone: data.senderPhone,
            };
            list.push(item);
          }
        });

        // Unread first, then sorted by newest, capped at recent 10 items
        list.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1));
        setNotifications(list.slice(0, 10));
      },
      (err) => {
        console.warn("Notifications real-time listener note:", err);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, profile?.phone]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read!");
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "call_request") return n.type === "call_request";
    if (activeTab === "chat") return n.type === "chat";
    if (activeTab === "system") return n.type === "system" || n.type === "price_drop";
    return true;
  }).slice(0, 10);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[99998] transition-opacity animate-fade-in"
      />

      {/* Slide-Over Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 z-[99999] w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-slide-in-right"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 12px)" }}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold relative">
              <Bell className="w-5 h-5 text-amber-800" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="font-heading font-black text-base text-slate-900 tracking-tight">
                Notifications
              </h2>
              <span className="text-xs font-medium text-slate-500">
                Recent 10 alerts & updates
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-amber-200"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl font-heading font-extrabold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-[#0F172A] text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>All</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("call_request")}
            className={`px-3 py-1.5 rounded-xl font-heading font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "call_request"
                ? "bg-[#0F172A] text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Phone className="w-3 h-3 text-amber-500" />
            <span>Call Requests</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-xl font-heading font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "chat"
                ? "bg-[#0F172A] text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-3 h-3 text-emerald-500" />
            <span>Chat Alerts</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Bell className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-500">No alerts found</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={async () => {
                  setIsOpen(false);
                  try {
                    await updateDoc(doc(db, "notifications", n.id), { read: true });
                  } catch (e) {}
                  if (n.actionUrl) {
                    router.push(n.actionUrl);
                  }
                }}
                className={`w-full rounded-2xl border p-4 flex items-start gap-3.5 transition-all shadow-2xs cursor-pointer active:scale-[0.99] ${
                  n.read
                    ? "bg-white border-slate-200/90"
                    : "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  n.type === "call_request"
                    ? "bg-amber-100 text-amber-900 border-amber-200"
                    : n.type === "chat"
                    ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                    : "bg-blue-100 text-blue-900 border-blue-200"
                }`}>
                  {n.type === "call_request" ? (
                    <Phone className="w-4 h-4 text-amber-700" />
                  ) : n.type === "chat" ? (
                    <MessageSquare className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-heading font-black text-xs text-slate-900 leading-tight truncate">
                      {n.title}
                    </h3>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {n.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {n.message}
                  </p>

                  {n.phone && (
                    <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-slate-100">
                      <a
                        href={`tel:${n.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Phone className="w-3 h-3 text-white" />
                        <span>Call Buyer Now</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {unreadCount > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
            <button
              onClick={markAllAsRead}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-amber-400" />
              <span>Mark All Notifications as Read</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
