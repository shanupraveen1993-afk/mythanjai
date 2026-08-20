"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  PhoneCall,
  MoreVertical,
} from "lucide-react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { formatRelativeTime } from "@/lib/constants";
import { useToast } from "@/context/ToastContext";

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
  lastMessage?: string;
  lastTimestamp?: any;
}

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
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  const queryListingId = searchParams.get("listingId") || "";
  const querySellerId = searchParams.get("sellerId") || "";
  const queryTitle = searchParams.get("title") || "Classified Item";

  const [activeChatId, setActiveChatId] = useState<string>("");
  const [activeListingTitle, setActiveListingTitle] = useState<string>(queryTitle);
  const [activePeerName, setActivePeerName] = useState<string>("Seller / Contact");
  const [activePeerId, setActivePeerId] = useState<string>(querySellerId);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [scamAlertTriggered, setScamAlertTriggered] = useState(false);
  const [detectedKeyword, setDetectedKeyword] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Sample messages removed to provide clean slate for user live testing
  const SAMPLE_MESSAGES_MAP: Record<string, ChatMessage[]> = {};

  // Initialize or load active chat room from query params or user threads
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

      // Add to thread list if not present
      setThreads((prev) => {
        if (prev.some((t) => t.chatId === generatedChatId)) return prev;
        const updated = [
          {
            chatId: generatedChatId,
            listingId: queryListingId || "post",
            listingTitle: queryTitle,
            peerId: sellerId,
            peerName: queryTitle !== "Classified Item" ? queryTitle : "Seller / Contact",
            lastMessage: "Click to start conversation...",
            lastTimestamp: new Date(),
          },
          ...prev,
        ];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("namma_thanjai_chat_threads", JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    }
  }, [queryListingId, querySellerId, queryTitle, user?.uid]);

  // Firestore Messages Snapshot Listener for Active Chat
  useEffect(() => {
    if (!activeChatId) return;

    if (SAMPLE_MESSAGES_MAP[activeChatId]) {
      setMessages(SAMPLE_MESSAGES_MAP[activeChatId]);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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
        console.warn("Firestore chat listener fallback:", err);
      }
    );

    return () => unsubscribe();
  }, [activeChatId]);

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
    setLoading(true);

    try {
      const messagesRef = collection(db, "chats", activeChatId, "messages");
      await addDoc(messagesRef, {
        senderId: user?.uid || "buyer_guest",
        senderName: profile?.displayName || "Buyer",
        text: currentText,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to send message to Firestore (using local preview):", err);
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDeleteChat = () => {
    if (confirm("Are you sure you want to delete this conversation thread?")) {
      setThreads((prev) => prev.filter((t) => t.chatId !== activeChatId));
      setMessages([]);
      setIsMenuOpen(false);
      setShowMobileChat(false);
    }
  };

  const handleShareChat = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: activeListingTitle,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Listing chat link copied to clipboard!");
      }
    } catch (err) {}
    setIsMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[99999] w-full h-full max-h-full flex flex-col bg-[#075e54] font-sans overflow-hidden">
      
      {/* Contextual Scam Alert Modal Overlay */}
      {scamAlertTriggered && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-500 rounded-2xl p-6 flex flex-col items-center text-center gap-3 max-w-xs shadow-2xl animate-bounce-short">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h4 className="font-heading font-bold text-base text-red-900 tracking-tight">
              Scam Prevention Warning
            </h4>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              Caution: Detected transaction term <span className="font-bold text-red-600 uppercase">"{detectedKeyword}"</span>.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 font-bold text-left leading-normal">
              ⚠️ Never send advance payments, GPay token money, or UPI links before physically inspecting the item in person.
            </div>
            <button
              onClick={() => setScamAlertTriggered(false)}
              aria-label="I Understand & Proceed Safely"
              className="mt-2 w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer border border-red-500 shadow-xs"
            >
              I Understand & Proceed Safely
            </button>
          </div>
        </div>
      )}

      {/* CHAT HEADER: Two-state — List view shows branding + back, Conversation view shows peer + back */}
      <div
        className="w-full bg-[#075e54] text-white px-4 py-2.5 flex items-center justify-between shadow-md shrink-0 border-b border-[#054c44] relative z-40"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 40px)" }}
      >
        {showMobileChat ? (
          /* Inside a 1-on-1 conversation — show back to inbox + peer name */
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setShowMobileChat(false)}
              className="p-1 text-white hover:bg-white/10 rounded-lg cursor-pointer flex items-center gap-1"
              title="Back to All Conversations"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Inbox</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-black text-sm leading-tight text-white truncate">{activePeerName}</h3>
              <p className="text-[11px] text-emerald-100 font-semibold truncate max-w-[200px]">{activeListingTitle}</p>
            </div>
          </div>
        ) : (
          /* Chat Inbox list — show back + full branding */
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-1 text-white hover:bg-white/10 rounded-lg cursor-pointer"
              title="Back to Main Feed"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <img src="/namma_thanjai_logo.png" alt="namma thanjai logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 mix-blend-multiply" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-heading font-bold tracking-tight text-white text-xs sm:text-sm uppercase">
                    namma thanjai
                  </span>
                  <span className="bg-emerald-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-md uppercase">
                    CHAT
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100 font-medium">All Conversations Inbox</span>
              </div>
            </div>
          </div>
        )}

        {/* Close button — always visible */}
        <button
          onClick={() => router.back()}
          aria-label="Close Chat"
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* WHATSAPP MAIN CONTAINER */}
      <div className="flex-1 w-full flex bg-white overflow-hidden">
        
        {/* LEFT COLUMN: WhatsApp Threads List (Desktop ALWAYS visible, Mobile toggled) */}
        <div className={`w-full lg:w-80 border-r border-slate-200 flex-col bg-white ${showMobileChat ? "hidden lg:flex" : "flex"}`}>
          
          {/* Threads List Header */}
          <div className="bg-slate-100 p-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#128c7e] text-white flex items-center justify-center font-bold text-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-bold text-sm text-slate-800">In-App Chats</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Scam Protected
            </span>
          </div>

          {/* Search Contacts Bar */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-500">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search chats or listings..."
                className="w-full bg-transparent focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Conversation Threads */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {threads.map((t) => (
              <div
                key={t.chatId}
                onClick={() => {
                  setActiveChatId(t.chatId);
                  setActiveListingTitle(t.listingTitle);
                  setActivePeerName(t.peerName);
                  setShowMobileChat(true);
                }}
                className={`p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                  activeChatId === t.chatId ? "bg-slate-100/80 border-l-4 border-[#128c7e]" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-800 truncate">{t.peerName}</h3>
                    <span className="text-xs text-slate-400 font-medium">{formatTime(t.lastTimestamp)}</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-800 truncate mt-0.5">{t.listingTitle}</p>
                  <p className="text-xs text-slate-500 truncate">{t.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Safety Footer Note */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Phone numbers are masked to prevent scam scraping.</span>
          </div>

        </div>

        {/* RIGHT COLUMN: WhatsApp Active Chat Window */}
        <div className={`flex-1 flex-col bg-[#efeae2] relative ${showMobileChat ? "flex" : "hidden lg:flex"}`}>
          
          {/* Mobile Active Contact Bar — hidden since header now handles this */}

          {/* PERMANENT TOP SCAM SAFETY BANNER */}
          <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center gap-2 text-xs font-bold border-b border-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>
              Safety Alert: Never send advance payments or UPI transfers before physically inspecting the item in person.
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2.5 bg-[#efeae2] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.length === 0 ? (
              <div className="my-auto text-center flex flex-col items-center gap-2 text-slate-500 bg-white/80 p-4 rounded-xl border border-slate-200/80 max-w-xs mx-auto">
                <ShieldCheck className="w-8 h-8 text-[#00a884]" />
                <h4 className="font-bold text-xs text-slate-800">Scam-Protected Chat</h4>
                <p className="text-xs font-medium text-slate-600">
                  Type below to message the seller safely without revealing your personal phone number.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.uid || msg.senderId === "buyer_guest";
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3 py-2 rounded-lg max-w-[85%] sm:max-w-[70%] text-xs font-medium shadow-2xs ${
                        isMe
                          ? "bg-[#d9fdd3] text-slate-900 rounded-tr-none"
                          : "bg-white text-slate-900 rounded-tl-none border border-slate-200/70"
                      }`}
                    >
                      {highlightFlaggedText(msg.text)}
                      <div className="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500">
                        <span>{formatTime(msg.timestamp)}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* WhatsApp Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              autoComplete="on"
              autoCorrect="on"
              spellCheck={true}
              autoCapitalize="sentences"
              className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2 text-xs font-medium focus:outline-none focus:border-[#00a884]"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              aria-label="Send message"
              className="bg-[#00a884] hover:bg-[#008f6f] active:scale-95 disabled:opacity-50 text-white font-bold p-2.5 rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
