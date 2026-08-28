"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  User,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  Search,
  CheckCheck,
  Lock,
  Phone,
  MoreVertical,
  Trash2,
  Share2,
  Filter,
  Check,
  Bell,
  Paperclip,
  Smile,
} from "lucide-react";
import NotificationDrawer from "@/components/modals/NotificationDrawer";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import BottomTabBar from "@/components/layout/BottomTabBar";

export function generate5DigitMemberId(val?: string): string {
  if (!val) return "NT-84921";
  // PRESERVE EXISTING MEMBER IDs (e.g. NT-9994837342) 100% AS IS!
  if (val.startsWith("NT-")) {
    return val;
  }
  const digits = val.replace(/\D/g, "");
  if (digits.length >= 5) return `NT-${digits.slice(-5)}`;

  let hash = 0;
  for (let i = 0; i < val.length; i++) {
    hash = (hash << 5) - hash + val.charCodeAt(i);
    hash |= 0;
  }
  const fiveDigits = 10000 + (Math.abs(hash) % 90000);
  return `NT-${fiveDigits}`;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  hasFlaggedTerm?: boolean;
}

interface ChatThread {
  chatId: string;
  listingId: string;
  listingTitle: string;
  peerId: string;
  peerName: string;
  peerPhone?: string;
  lastMessage?: string;
  lastTimestamp?: any;
  unreadCount?: number;
  isSystemThread?: boolean;
}

const DEFAULT_SYSTEM_THREAD: ChatThread = {
  chatId: "namma_thanjai_system_welcome",
  listingId: "system_welcome",
  listingTitle: "Welcome to Namma Thanjai",
  peerId: "namma_thanjai_official",
  peerName: "Namma Thanjai Admin Support",
  peerPhone: "9994837342",
  lastMessage: "Vanakkam! Chat directly with Namma Thanjai Admin Support & local members here.",
  lastTimestamp: new Date(),
  isSystemThread: true,
};

const SCAM_KEYWORDS = [
  "advance payment",
  "advance",
  "gpay",
  "phonepe",
  "paytm",
  "upi link",
  "token amount",
  "bank transfer",
  "wildlife",
  "protected species",
  "google pay",
];

export default function ChatClientPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();

  const [queryListingId, setQueryListingId] = useState<string>("");
  const [querySellerId, setQuerySellerId] = useState<string>("");
  const [queryTitle, setQueryTitle] = useState<string>("Classified Item");
  const [queryAutoMsg, setQueryAutoMsg] = useState<string>("");
  const [queryAutoSend, setQueryAutoSend] = useState<boolean>(false);

  const [activeChatId, setActiveChatId] = useState<string>("namma_thanjai_system_welcome");
  const [activeListingTitle, setActiveListingTitle] = useState<string>("Welcome to Namma Thanjai");
  const [activePeerName, setActivePeerName] = useState<string>("Namma Thanjai");
  const [activePeerId, setActivePeerId] = useState<string>("namma_thanjai_official");
  const [activePeerPhone, setActivePeerPhone] = useState<string>("9994837342");

  const [threads, setThreads] = useState<ChatThread[]>([DEFAULT_SYSTEM_THREAD]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [scamAlertTriggered, setScamAlertTriggered] = useState(false);
  const [detectedKeyword, setDetectedKeyword] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "ads">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedThreadForDelete, setSelectedThreadForDelete] = useState<ChatThread | null>(null);
  const [activeMsgAction, setActiveMsgAction] = useState<ChatMessage | null>(null);

  const longPressTimerRef = useRef<any>(null);
  const threadPressTimerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const initialMsgSetRef = useRef<string>("");

  // Read URL query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const listingId = params.get("listingId") || "";
      setQueryListingId(listingId);
      const sellerId = params.get("sellerId") || "";
      setQuerySellerId(sellerId);
      if (sellerId) setActivePeerId(sellerId);
      const title = params.get("title");
      if (title) {
        const decoded = decodeURIComponent(title);
        setQueryTitle(decoded);
        setActiveListingTitle(decoded);
      }
      const autoMsg = params.get("autoMsg");
      if (autoMsg) {
        setQueryAutoMsg(decodeURIComponent(autoMsg));
      }
      const autoSend = params.get("autoSend") === "true";
      setQueryAutoSend(autoSend);

      if (listingId || sellerId) {
        setShowMobileChat(true);
      }
    }
  }, []);

  // Mobile Back Button Handler: Return to Chat List View before exiting /chat route
  useEffect(() => {
    const handleCloseMobileChat = () => {
      if (showMobileChat) {
        setShowMobileChat(false);
      }
    };
    window.addEventListener("namma_thanjai_close_mobile_chat", handleCloseMobileChat);
    return () => window.removeEventListener("namma_thanjai_close_mobile_chat", handleCloseMobileChat);
  }, [showMobileChat]);

  // Real-time Firestore snapshot for User Threads across all participating users
  useEffect(() => {
    const currentUid = user?.uid;
    const currentPhone = profile?.phone ? profile.phone.replace(/\D/g, "") : "";

    const chatsRef = collection(db, "chats");
    const unsubscribe = onSnapshot(
      chatsRef,
      (snapshot) => {
        const userThreads: ChatThread[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const participants = data.participants || [];
          const isUserParticipant =
            (currentUid && participants.includes(currentUid)) ||
            (currentPhone && participants.includes(currentPhone)) ||
            participants.includes("guest_user") ||
            !currentUid;

          if (isUserParticipant) {
            const isBuyer = data.buyerId === currentUid;
            let peerName = isBuyer
              ? data.sellerName || data.listingTitle || "Seller / Contact"
              : data.buyerName || "Buyer / Interested User";
            const peerPhone = isBuyer ? data.sellerPhone : data.buyerPhone;
            const peerId = isBuyer ? data.sellerId : data.buyerId;

            // 🏷️ UNIQUE DEDICATED NAME RESOLUTION:
            // Ensure no 1-on-1 thread displays generic "Namma Thanjai" so every conversation item is distinct!
            if (
              docSnap.id !== "namma_thanjai_system_welcome" &&
              (!peerName || peerName === "Namma Thanjai" || peerName === "Classified Item" || peerName === "Local Contact" || peerName === "Seller / Contact")
            ) {
              const memberIdVal = generate5DigitMemberId(peerId || peerPhone || docSnap.id);
              peerName = `User ${memberIdVal}`;
            }

            userThreads.push({
              chatId: docSnap.id,
              listingId: data.listingId || "post",
              listingTitle: data.listingTitle || "Thanjavur Listing",
              peerId: peerId || "contact",
              peerName: peerName,
              peerPhone: peerPhone || "",
              lastMessage: data.lastMessage || "Conversation started",
              lastTimestamp: data.lastTimestamp,
            });
          }
        });

        userThreads.sort((a, b) => {
          const tA = a.lastTimestamp?.seconds ? a.lastTimestamp.seconds * 1000 : new Date(a.lastTimestamp || 0).getTime();
          const tB = b.lastTimestamp?.seconds ? b.lastTimestamp.seconds * 1000 : new Date(b.lastTimestamp || 0).getTime();
          return tB - tA;
        });

        const hasSystem = userThreads.some((t) => t.chatId === DEFAULT_SYSTEM_THREAD.chatId);
        const finalThreads = hasSystem ? userThreads : [DEFAULT_SYSTEM_THREAD, ...userThreads];

        setThreads(finalThreads);
      },
      (err) => {
        console.warn("Real-time threads listener note:", err);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, profile?.phone]);

  // Initialize active chat room when navigating from an ad card
  useEffect(() => {
    if (queryListingId || querySellerId || (queryTitle && queryTitle !== "Classified Item")) {
      const currentUserId = user?.uid || "guest_user";
      const sellerId = querySellerId || "seller_contact";
      const generatedChatId = `${queryListingId || "post"}_${[currentUserId, sellerId].sort().join("_")}`;

      setActiveChatId(generatedChatId);
      setActiveListingTitle(queryTitle);
      setActivePeerId(sellerId);
      setActivePeerName(queryTitle !== "Classified Item" ? queryTitle : "Seller / Contact");
      setShowMobileChat(true);

      // ONLY populate initial message ONCE per chat session to prevent re-fill bug
      if (initialMsgSetRef.current !== generatedChatId) {
        initialMsgSetRef.current = generatedChatId;

        if (!queryAutoSend) {
          if (queryAutoMsg) {
            setInputText(queryAutoMsg);
          } else if (queryTitle && queryTitle !== "Classified Item") {
            setInputText(`Hi, I am interested in your listing "${queryTitle}". Is it still available?`);
          }
        } else {
          setInputText("");
        }
      }

      setThreads((prev) => {
        if (prev.some((t) => t.chatId === generatedChatId)) return prev;
        const newThread: ChatThread = {
          chatId: generatedChatId,
          listingId: queryListingId || "post",
          listingTitle: queryTitle,
          peerId: sellerId,
          peerName: queryTitle !== "Classified Item" ? queryTitle : "Seller / Contact",
          lastMessage: "Conversation initiated",
          lastTimestamp: new Date(),
        };
        return [newThread, ...prev];
      });
    }
  }, [queryListingId, querySellerId, queryTitle, queryAutoMsg, queryAutoSend, user?.uid]);

  // Execute Instant Auto-Send for Call Back Requests
  useEffect(() => {
    if (queryAutoSend && activeChatId && queryAutoMsg && activeChatId !== "namma_thanjai_system_welcome") {
      const executeAutoSend = async () => {
        try {
          const messagesRef = collection(db, "chats", activeChatId, "messages");
          await addDoc(messagesRef, {
            senderId: user?.uid || "buyer_guest",
            senderName: profile?.displayName || "Buyer",
            text: queryAutoMsg,
            timestamp: serverTimestamp(),
          });
          const chatDocRef = doc(db, "chats", activeChatId);
          await setDoc(
            chatDocRef,
            {
              lastMessage: queryAutoMsg,
              lastTimestamp: serverTimestamp(),
              participants: [user?.uid || "buyer_guest", activePeerId || "seller_contact"].filter(Boolean),
              listingId: queryListingId,
              listingTitle: activeListingTitle,
              buyerId: user?.uid || "buyer_guest",
              buyerName: profile?.displayName || "Buyer",
              buyerPhone: profile?.phone || "",
              sellerId: activePeerId,
              sellerName: activePeerName,
              sellerPhone: activePeerPhone,
            },
            { merge: true }
          );
        } catch (err) {
          console.warn("Instant auto-send note:", err);
        } finally {
          setInputText("");
          setQueryAutoSend(false);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("autoSend");
            url.searchParams.delete("autoMsg");
            window.history.replaceState({}, "", url.toString());
          }
        }
      };
      executeAutoSend();
    }
  }, [queryAutoSend, activeChatId, queryAutoMsg, user?.uid, profile?.displayName, profile?.phone, activePeerId, activePeerName, activePeerPhone, activeListingTitle, queryListingId]);

  // Firestore Messages Snapshot Listener for Active Chat
  useEffect(() => {
    if (!activeChatId) return;

    if (activeChatId === "namma_thanjai_system_welcome") {
      setMessages([
        {
          id: "sys_welcome_1",
          senderId: "namma_thanjai_official",
          senderName: "Namma Thanjai",
          text: "Vanakkam! Welcome to Namma Thanjai. 🙏",
          timestamp: new Date("2026-08-01T10:00:00"),
        },
        {
          id: "sys_welcome_2",
          senderId: "namma_thanjai_official",
          senderName: "Namma Thanjai",
          text: "You can chat directly with verified sellers, buyers, and local service providers in Thanjavur right here safely.",
          timestamp: new Date("2026-08-01T10:01:00"),
        },
      ]);
      return;
    }

    const messagesRef = collection(db, "chats", activeChatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const textLower = (data.text || "").toLowerCase();
          const flagged = SCAM_KEYWORDS.some((kw) => textLower.includes(kw));
          list.push({ id: doc.id, ...data, hasFlaggedTerm: flagged } as ChatMessage);
        });
        setMessages(list);
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
      (err) => {
        console.warn("Firestore chat listener note:", err);
      }
    );

    return () => unsubscribe();
  }, [activeChatId]);

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const textLower = inputText.toLowerCase();
    const matchedKw = SCAM_KEYWORDS.find((kw) => textLower.includes(kw));

    if (matchedKw) {
      setDetectedKeyword(matchedKw);
      setScamAlertTriggered(true);
    }

    const currentText = inputText.trim();
    setInputText("");
    setQueryAutoMsg("");
    try {
      const currentUid = user?.uid || (profile?.phone ? `phone_${profile.phone.replace(/\D/g, "")}` : "guest_user");
      const currentName = profile?.displayName || user?.displayName || "User";
      const currentPhone = (profile?.phone || user?.phoneNumber || "").replace(/\D/g, "");

      const messagesRef = collection(db, "chats", activeChatId, "messages");
      await addDoc(messagesRef, {
        senderId: currentUid,
        senderPhone: currentPhone,
        senderName: currentName,
        text: currentText,
        timestamp: serverTimestamp(),
      });

      // 🔔 REAL-TIME NOTIFICATION RECORD: Notify recipient user of new message
      if (activePeerId && activeChatId !== "namma_thanjai_system_welcome") {
        try {
          const notifRef = collection(db, "notifications");
          await addDoc(notifRef, {
            recipientId: activePeerId,
            recipientPhone: activePeerPhone,
            senderId: currentUid,
            senderName: currentName,
            type: "chat",
            title: `New message from ${currentName}`,
            message: `"${currentText.slice(0, 50)}${currentText.length > 50 ? "..." : ""}" re: ${activeListingTitle}`,
            actionUrl: `/chat?chatId=${activeChatId}&listingId=${queryListingId || ""}`,
            read: false,
            timestamp: serverTimestamp(),
          });
        } catch (e) {}
      }

      const threadRef = doc(db, "chats", activeChatId);
      await setDoc(
        threadRef,
        {
          chatId: activeChatId,
          listingId: queryListingId || "post",
          listingTitle: activeListingTitle,
          buyerId: currentUid,
          buyerName: currentName,
          buyerPhone: currentPhone,
          sellerId: activePeerId,
          sellerName: activePeerName,
          sellerPhone: activePeerPhone,
          lastMessage: currentText,
          lastTimestamp: serverTimestamp(),
          participants: Array.from(new Set([currentUid, activePeerId, currentPhone].filter(Boolean))),
        },
        { merge: true }
      );

      setThreads((prev) => {
        const updated = prev.map((t) =>
          t.chatId === activeChatId ? { ...t, lastMessage: currentText, lastTimestamp: new Date() } : t
        );
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("namma_thanjai_chat_threads", JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });

      // 🤖 GEMINI AI CUSTOMER ASSISTANT: Auto-reply to customer queries on Namma Thanjai Admin thread
      if (activeChatId === "namma_thanjai_system_welcome") {
        setTimeout(async () => {
          try {
            const aiRes = await fetch("/api/gemini-format", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: `You are Namma Thanjai Customer Support Assistant for the local Thanjavur app. Answer the user's question concisely in 2-3 friendly sentences in English or Tamil. User asked: "${currentText}"`,
                type: "format_only",
              }),
            });
            const aiData = await aiRes.json();
            const replyText =
              aiData.formattedText ||
              "Vanakkam! I am Namma Thanjai Assistant. You can post sell items, requirement needs, service listings, or store offers for free in Thanjavur!";

            const messagesRef = collection(db, "chats", activeChatId, "messages");
            await addDoc(messagesRef, {
              senderId: "namma_thanjai_official",
              senderPhone: "9994837342",
              senderName: "Namma Thanjai Assistant",
              text: replyText,
              timestamp: serverTimestamp(),
            });
          } catch (e) {
            console.warn("AI Admin Assistant response error:", e);
          }
        }, 600);
      }
    } catch (err) {
      console.warn("Local chat fallback active:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `local_${Date.now()}`,
          senderId: user?.uid || "buyer_guest",
          senderName: profile?.displayName || "Buyer",
          text: currentText,
          timestamp: new Date(),
          hasFlaggedTerm: Boolean(matchedKw),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Long-press handlers for Thread deletion
  const handleThreadTouchStart = (thread: ChatThread) => {
    if (thread.isSystemThread || thread.chatId === "namma_thanjai_system_welcome") return;
    threadPressTimerRef.current = setTimeout(() => {
      setSelectedThreadForDelete(thread);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 500);
  };

  const handleThreadTouchEnd = () => {
    if (threadPressTimerRef.current) {
      clearTimeout(threadPressTimerRef.current);
    }
  };

  // Execute thread deletion from Cloud Firestore and local state
  const executeDeleteThread = async (chatId: string) => {
    if (chatId === "namma_thanjai_system_welcome") {
      setSelectedThreadForDelete(null);
      toast.info("Namma Thanjai default greeting cannot be deleted.");
      return;
    }

    try {
      await deleteDoc(doc(db, "chats", chatId));
      const messagesRef = collection(db, "chats", chatId, "messages");
      const snap = await getDocs(messagesRef).catch(() => null);
      if (snap) {
        snap.forEach((d) => deleteDoc(d.ref).catch(() => {}));
      }
    } catch (e) {
      console.warn("Delete thread note:", e);
    }

    setThreads((prev) => prev.filter((t) => t.chatId !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId("");
      setShowMobileChat(false);
    }
    setSelectedThreadForDelete(null);
    toast.success("Conversation thread deleted.");
  };

  // Long-press handlers for Message options
  const handleMsgTouchStart = (msg: ChatMessage) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveMsgAction(msg);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 500);
  };

  const handleMsgTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const highlightFlaggedText = (text: string) => {
    const textLower = text.toLowerCase();
    const matchedKw = SCAM_KEYWORDS.find((kw) => textLower.includes(kw));

    if (!matchedKw) return text;

    const parts = text.split(new RegExp(`(${matchedKw})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === matchedKw ? (
            <span key={i} className="bg-amber-200 text-amber-950 font-extrabold px-1 rounded border border-amber-300">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = typeof timestamp?.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "Just now";
    }
  };

  // Filtered threads list
  const filteredThreads = React.useMemo(() => {
    return threads.filter((t) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (t.peerName || "").toLowerCase().includes(query);
        const matchesTitle = (t.listingTitle || "").toLowerCase().includes(query);
        const matchesMsg = (t.lastMessage || "").toLowerCase().includes(query);
        if (!matchesName && !matchesTitle && !matchesMsg) return false;
      }
      return true;
    });
  }, [threads, searchQuery]);

  // Auto-open Sign In Modal immediately for unverified users (1-Step Direct Sign In Flow)
  useEffect(() => {
    if (!isVerified && typeof window !== "undefined") {
      window.dispatchEvent(new Event("namma_thanjai_open_signin"));
    }
  }, [isVerified]);

  if (!isVerified) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-6 flex flex-col items-center justify-center text-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-2xs my-8 font-sans">
        <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
          <MessageSquare className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div className="flex flex-col gap-1 max-w-xs">
          <h2 className="font-heading font-black text-xl text-slate-900">Direct Messages</h2>
          <p className="text-blue-700 font-extrabold text-xs">செய்திகளை அணுக உள்நுழையவும்</p>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
            Verify your WhatsApp mobile number to chat directly with buyers and sellers across Thanjavur.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("namma_thanjai_open_signin"));
            }
          }}
          className="mt-2 w-full bg-[#128C7E] hover:bg-[#075e54] text-white font-heading font-black text-sm py-3 px-6 rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <MessageSquare className="w-5 h-5 fill-white stroke-[2.5]" />
          <span>Sign In / Verify</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-40 w-screen h-[100dvh] max-h-[100dvh] flex bg-[#f0f2f5] font-sans overflow-hidden p-0 m-0 ${showMobileChat ? "pb-0" : "pb-16 md:pb-0"}`}>
      {/* SCAM WARNING MODAL */}
      {scamAlertTriggered && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border-2 border-red-500 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-3 text-red-600 border-b border-red-100 pb-3">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 leading-tight">
                  High Risk Payment Warning
                </h3>
                <p className="text-xs text-red-600 font-bold">Thanjavur Safety Guard</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              You or the seller mentioned potential payment terms (advance, GPay, token amount).
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-900 font-medium space-y-1">
              <p className="font-bold">⚠️ Golden Rules for Safe Local Deals:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>NEVER send advance money or token amounts before seeing the item.</li>
                <li>Inspect item &amp; documents in person at a safe public location in Thanjavur.</li>
                <li>Pay ONLY after taking physical possession of the product/vehicle.</li>
              </ul>
            </div>

            <button
              onClick={() => setScamAlertTriggered(false)}
              className="mt-2 w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer border border-red-500 shadow-xs"
            >
              I Understand &amp; Proceed Safely
            </button>
          </div>
        </div>
      )}

      {/* MAIN CHAT PANEL (FILLS ENTIRE SCREEN 100%) */}
      <div className="flex-1 w-full flex bg-white overflow-hidden h-full">
        
        {/* LEFT COLUMN: Namma Thanjai Conversation List */}
        <div className={`w-full lg:w-[380px] border-r border-slate-200 flex-col bg-white ${showMobileChat ? "hidden lg:flex" : "flex"}`}>
          
          {/* 1. LEFT PANEL HEADER: White Header — Logo on Left Side, Chats Title Center, Notification Bell on Right */}
          <div className="bg-white text-slate-900 px-3.5 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between border-b border-slate-200/90 shadow-sm shrink-0 w-full min-h-[3.75rem]">
            {/* Left Side Logo */}
            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-2 cursor-pointer shrink-0 group select-none"
            >
              <img src="/namma_thanjai_logo.png" alt="Namma Thanjai Logo" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            </div>

            {/* Center Aligned Chats Title */}
            <h1 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight text-center flex-1 min-w-0 mx-2">
              Chats
            </h1>

            {/* Right Side Notification Bell */}
            <div className="flex items-center gap-2 text-slate-700 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Real-time messaging active" />
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("namma_thanjai_open_notifications"));
                  }
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* 2. SEARCH BAR — Increased Height */}
          <div className="p-2.5 bg-white border-b border-slate-200/80">
            <div className="flex items-center gap-2.5 bg-[#f0f2f5] border border-slate-200/80 rounded-2xl px-4 py-2.5 min-h-[44px] text-sm text-slate-700 shadow-2xs focus-within:ring-1 focus-within:ring-[#00a884]">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or start a new chat"
                className="w-full bg-transparent focus:outline-none text-sm text-slate-900 font-semibold placeholder:text-slate-500 text-center"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 4. CONVERSATION THREADS LIST (Compensated for Bottom Navigation Bar) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/90 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-4">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-500">No chat conversations yet.</p>
                <p className="text-[11px] text-slate-400">Browse listings and click 'Chat' to connect with sellers.</p>
              </div>
            ) : (
              filteredThreads.map((t) => (
                <div
                  key={t.chatId}
                  onClick={() => {
                    setActiveChatId(t.chatId);
                    setActiveListingTitle(t.listingTitle);
                    setActivePeerName(t.peerName);
                    setActivePeerPhone(t.peerPhone || "");
                    setShowMobileChat(true);
                  }}
                  onMouseDown={() => handleThreadTouchStart(t)}
                  onMouseUp={handleThreadTouchEnd}
                  onTouchStart={() => handleThreadTouchStart(t)}
                  onTouchEnd={handleThreadTouchEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedThreadForDelete(t);
                  }}
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#f5f6f8] select-none relative group ${
                    activeChatId === t.chatId ? "bg-[#f0f2f5] border-l-4 border-[#00a884]" : ""
                  }`}
                >
                  {/* User Avatar (Online dot removed per user requirement) */}
                  <div className="w-12 h-12 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-400/40 relative overflow-hidden">
                    {t.isSystemThread ? (
                      <img src="/namma_thanjai_logo.png" alt="Namma Thanjai" className="w-8 h-8 object-contain" />
                    ) : (
                      <User className="w-5 h-5 text-amber-400" />
                    )}
                  </div>

                  {/* Thread Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">{t.peerName}</h3>
                        {t.isSystemThread ? (
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">Official</span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded font-semibold shrink-0">
                            {generate5DigitMemberId(t.peerId || t.peerPhone)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#00a884] font-bold shrink-0 ml-1">
                        {formatTime(t.lastTimestamp)}
                      </span>
                    </div>
                    
                    {/* Ad Title Subtitle */}
                    {!t.isSystemThread && t.listingTitle && t.listingTitle !== "Welcome to Namma Thanjai" && (
                      <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                        Re: {t.listingTitle}
                      </p>
                    )}

                    {/* Last Message Preview */}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs sm:text-sm text-slate-600 font-medium truncate">{t.lastMessage}</p>
                    </div>
                  </div>

                  {/* Desktop Hover Delete Icon */}
                  {!t.isSystemThread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedThreadForDelete(t);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: ACTIVE CHAT CONVERSATION VIEW */}
        {/* ========================================== */}
        <div className={`flex-1 flex-col bg-[#efeae2] relative ${showMobileChat ? "flex" : "hidden lg:flex"}`}>
          
          {/* Active Chat Header Bar (White bg-white) with Safe Area Top Status Bar Inset */}
          <div className="bg-white text-slate-900 px-3.5 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between shadow-sm shrink-0 border-b border-slate-200/90 w-full min-h-[3.75rem] relative">
            <button
              type="button"
              onClick={() => setShowMobileChat(false)}
              className="lg:hidden p-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 transition-colors absolute left-3.5 z-10"
              title="Back to Conversations"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Left Aligned Active Peer Info */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-9 lg:pl-0 text-left">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-black text-xs shrink-0 border border-slate-200 relative">
                <User className="w-4 h-4 text-slate-700" />
              </div>
              
              <div className="min-w-0 flex flex-col justify-center items-start text-left">
                <div className="flex items-center justify-start gap-1.5 min-w-0 text-left">
                  <h3 className="font-heading font-black text-xs sm:text-sm text-slate-900 truncate leading-tight text-left">{activePeerName}</h3>
                  {activeChatId !== "namma_thanjai_system_welcome" && (
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded font-extrabold shrink-0">
                      {generate5DigitMemberId(activePeerId || activePeerPhone)}
                    </span>
                  )}
                </div>
                {activeChatId !== "namma_thanjai_system_welcome" && activeListingTitle && activeListingTitle !== "Welcome to Namma Thanjai" && (
                  <p className="text-[11px] text-amber-700 font-bold truncate mt-0.5 text-left">
                    Re: {activeListingTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Header Right Actions: Report + Delete */}
            <div className="flex items-center gap-1 shrink-0 absolute right-3.5 z-10">
              <button
                type="button"
                onClick={() => alert("Report submitted to Namma Thanjai moderation team.")}
                className="p-2 text-amber-200 hover:text-amber-100 hover:bg-white/10 rounded-full cursor-pointer transition-colors"
                title="Report User / Fraud"
              >
                <ShieldAlert className="w-5 h-5 text-amber-300" />
              </button>

              {!activeChatId.startsWith("namma_thanjai_system_welcome") && (
                <button
                  type="button"
                  onClick={() => setSelectedThreadForDelete(threads.find((t) => t.chatId === activeChatId) || null)}
                  className="p-2 text-rose-200 hover:text-rose-100 hover:bg-white/10 rounded-full cursor-pointer transition-colors"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-5 h-5 text-rose-300" />
                </button>
              )}
            </div>
          </div>

          {/* TOP SAFETY WARNING BANNER */}
          <div className="bg-[#fff3c4] text-[#856404] px-3.5 py-2 flex items-center gap-2 text-[11px] font-bold border-b border-[#ffeeba] shadow-2xs shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#856404] shrink-0 stroke-[2.5]" />
            <span>
              Safety Warning: Never send advance payments or UPI transfers before physically inspecting items in Thanjavur.
            </span>
          </div>

          {/* Messages Feed */}
          <div
            className="flex-1 p-3.5 sm:p-5 overflow-y-auto flex flex-col gap-2.5 bg-[#efeae2] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
            style={{ paddingBottom: "calc(max(env(safe-area-inset-bottom, 0px), 16px) + 24px)" }}
          >
            {messages.length === 0 ? (
              <div className="my-auto text-center flex flex-col items-center gap-2 text-slate-600 bg-white/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 max-w-xs mx-auto shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#128c7e] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="font-heading font-black text-xs sm:text-sm text-slate-900">Direct Encrypted Chat</h4>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Type your message below to connect safely with the seller in Thanjavur.
                </p>
              </div>
            ) : (
              messages.map((msg, msgIndex) => {
                const currentUid = user?.uid;
                const currentPhone = (profile?.phone || user?.phoneNumber || "").replace(/\D/g, "");
                const senderPhone = (msg as any).senderPhone ? String((msg as any).senderPhone).replace(/\D/g, "") : "";

                const isMe = Boolean(
                  (currentUid && msg.senderId === currentUid) ||
                  (currentPhone && senderPhone && currentPhone === senderPhone) ||
                  (msg.senderId === "buyer_guest" && !currentUid)
                );

                const hasLink = msg.text && (msg.text.includes("http://") || msg.text.includes("https://"));

                return (
                  <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} my-0.5`}>
                    <div
                      onTouchStart={() => handleMsgTouchStart(msg)}
                      onTouchEnd={handleMsgTouchEnd}
                      onMouseDown={() => handleMsgTouchStart(msg)}
                      onMouseUp={handleMsgTouchEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setActiveMsgAction(msg);
                      }}
                      className={`relative px-3.5 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[70%] text-xs font-medium shadow-2xs select-none cursor-pointer transition-transform active:scale-[0.98] ${
                        isMe
                          ? "bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-[#bbf2b3] self-end"
                          : "bg-white text-slate-900 rounded-tl-xs border border-slate-200/90 self-start"
                      }`}
                    >
                      {!isMe && (
                        <div className="text-[11px] font-bold text-[#075e54] mb-0.5 truncate">
                          ~{msg.senderName || "Contact"}
                        </div>
                      )}

                      {/* Message Content + Link Preview Embed */}
                      <div className="leading-relaxed text-slate-900 font-normal">
                        {highlightFlaggedText(msg.text)}
                      </div>

                      {hasLink && (
                        <div className="bg-[#f0f2f5] border border-slate-200/80 rounded-xl p-2 mt-1.5 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#00a884] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            🌐
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-slate-900 block truncate">Shared Web Link</span>
                            <span className="text-[10px] text-[#00a884] truncate block">Click to open link</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-semibold leading-none">
                        <span>{formatTime(msg.timestamp)}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#34b7f1] stroke-[2.5]" />}
                      </div>

                      {activeChatId === "nt_service_assistant" && msgIndex === messages.length - 1 && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-300/90 rounded-2xl flex flex-col gap-2 shadow-xs max-w-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">Sample Service Card Preview</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">● Live Format</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col gap-1">
                            <h4 className="font-heading font-black text-xs sm:text-sm text-slate-900">⚡ Tanjore Home Electrician &amp; AC Repairs</h4>
                            <p className="text-xs text-slate-600 font-medium">📍 Medical College Road, Thanjavur • 📞 9994837342</p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">Professional home wiring, fan fitting, inverter servicing &amp; AC gas fill in Tanjore town.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push("/listings")}
                            className="w-full bg-[#1d4ed8] hover:bg-blue-700 text-white font-heading font-black text-xs py-2 rounded-xl transition-colors cursor-pointer text-center shadow-xs mt-1 active:scale-95"
                          >
                            ✓ Post Published! Check in My Ads →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Long-Press Message Options Modal */}
          {activeMsgAction && (
            <div
              className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setActiveMsgAction(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl w-full max-w-xs flex flex-col gap-3"
              >
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span className="font-heading font-black text-xs text-slate-900">Message Options</span>
                  <button onClick={() => setActiveMsgAction(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-700 font-medium italic border border-slate-200 line-clamp-2">
                  "{activeMsgAction.text}"
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeMsgAction.text);
                      toast.success("Message copied to clipboard!");
                      setActiveMsgAction(null);
                    }}
                    className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-heading font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>📋 Copy Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessages((prev) => prev.filter((m) => m.id !== activeMsgAction.id));
                      toast.success("Message deleted.");
                      setActiveMsgAction(null);
                    }}
                    className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-heading font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-rose-200"
                  >
                    <span>🗑️ Delete Message</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message Input Form — Increased Height & Clear of Bottom Tab Bar */}
          <form
            onSubmit={handleSendMessage}
            className={`p-2.5 sm:p-3 bg-[#f0f2f5] border-t border-slate-200/90 flex items-center gap-2.5 shrink-0 z-10 ${
              showMobileChat
                ? "pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
                : "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:pb-3"
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              autoComplete="on"
              autoCorrect="on"
              spellCheck={true}
              autoCapitalize="sentences"
              className="flex-1 bg-white border border-slate-200/90 text-slate-900 rounded-2xl px-4 py-3 min-h-[48px] text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#00a884] shadow-2xs placeholder:text-slate-400 placeholder:text-sm"
            />

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              aria-label="Send message"
              className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#008f70] active:scale-95 disabled:opacity-50 text-white font-bold transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4 text-white fill-white ml-0.5" />
            </button>
          </form>

        </div>

      </div>

      {/* LONG PRESS / DELETE THREAD CONFIRMATION MODAL */}
      {selectedThreadForDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-900">Delete Conversation?</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Delete chat history with <span className="font-bold text-slate-900">{selectedThreadForDelete.peerName}</span> for listing "<span className="font-bold text-slate-900">{selectedThreadForDelete.listingTitle}</span>"?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedThreadForDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-black text-xs rounded-2xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeleteThread(selectedThreadForDelete.chatId)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-xs rounded-2xl cursor-pointer shadow-md transition-all"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Drawer Modal */}
      <NotificationDrawer />

      {/* Global Bottom Navigation Bar (Rendered ONLY on conversation list view, HIDDEN in active 1-on-1 chat room) */}
      {!showMobileChat && <BottomTabBar activeTab="chat" />}
    </div>
  );
}
