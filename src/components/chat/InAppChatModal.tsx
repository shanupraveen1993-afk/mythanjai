"use client";

import React, { useState, useEffect } from "react";
import { X, Send, MessageSquare, ShieldCheck, User, AlertTriangle, ShieldAlert } from "lucide-react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

interface InAppChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  hasFlaggedTerm?: boolean;
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

export default function InAppChatModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  sellerId,
  sellerName = "Seller",
}: InAppChatModalProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [scamAlertTriggered, setScamAlertTriggered] = useState(false);
  const [detectedKeyword, setDetectedKeyword] = useState("");

  // Deterministic chat room ID between current user & seller for this listing
  const chatId = user?.uid ? `${listingId}_${[user.uid, sellerId].sort().join("_")}` : `sample_${listingId}`;

  useEffect(() => {
    if (!isOpen || !chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const textLower = (data.text || "").toLowerCase();
        const flagged = SCAM_KEYWORDS.some((kw) => textLower.includes(kw));
        list.push({ id: doc.id, ...data, hasFlaggedTerm: flagged } as ChatMessage);
      });
      setMessages(list);
    });

    return () => unsubscribe();
  }, [isOpen, chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatId) return;

    const textLower = inputText.toLowerCase();
    const matchedKw = SCAM_KEYWORDS.find((kw) => textLower.includes(kw));

    if (matchedKw) {
      setDetectedKeyword(matchedKw);
      setScamAlertTriggered(true);
    }

    setLoading(true);
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        senderId: user?.uid || "buyer_guest",
        senderName: profile?.displayName || "Buyer",
        text: inputText.trim(),
        timestamp: serverTimestamp(),
      });
      setInputText("");
    } catch (err) {
      console.warn("Failed to send chat message to Firestore (using local preview):", err);
      // Fallback local update for demonstration
      setMessages((prev) => [
        ...prev,
        {
          id: `local_${Date.now()}`,
          senderId: user?.uid || "buyer_guest",
          senderName: profile?.displayName || "Buyer",
          text: inputText.trim(),
          timestamp: new Date(),
          hasFlaggedTerm: Boolean(matchedKw),
        },
      ]);
      setInputText("");
    } finally {
      setLoading(false);
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
            <span key={i} className="bg-amber-200 text-amber-950 font-black px-1 rounded border border-amber-300">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[560px] animate-scale-up font-sans relative">
        
        {/* Contextual Scam Alert Warning Modal Overlay */}
        {scamAlertTriggered && (
          <div className="absolute inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-5">
            <div className="bg-white border-2 border-red-500 rounded-xl p-6 flex flex-col items-center text-center gap-3 max-w-xs shadow-2xl animate-bounce-short">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h4 className="font-heading font-black text-base text-red-900 uppercase tracking-tight">
                Scam Prevention Warning
              </h4>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                Caution: Detected transaction term <span className="font-black text-red-600 uppercase">"{detectedKeyword}"</span>.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-800 font-bold text-left leading-normal">
                ⚠️ Never send advance payments, GPay token money, or UPI links before physically inspecting the item in person.
              </div>
              <button
                onClick={() => setScamAlertTriggered(false)}
                className="mt-2 w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border border-red-500 shadow-sm"
              >
                I Understand & Proceed Safely
              </button>
            </div>
          </div>
        )}

        {/* Chat Header */}
        <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/namma_thanjai_logo.png" alt="logo" className="w-8 h-8 object-contain shrink-0 filter brightness-0 invert" />
            <div>
              <h3 className="font-heading font-black text-sm text-slate-100">{sellerName}</h3>
              <p className="text-xs text-slate-400 font-semibold truncate max-w-[200px]">
                {listingTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-30"
            aria-label="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PERMANENT TOP SCAM SAFETY BANNER */}
        <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center gap-2 text-xs font-black border-b border-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span className="leading-tight">
            Safety Alert: Never send advance payments or UPI transfers before inspecting the item in person.
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="my-auto text-center flex flex-col items-center gap-2 text-slate-400">
              <MessageSquare className="w-8 h-8 stroke-1" />
              <p className="text-xs font-semibold max-w-[220px]">
                Protected In-App Chat. Start typing below to message the seller.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.uid || msg.senderId === "buyer_guest";
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-xs font-semibold ${
                      isMe
                        ? "bg-slate-900 text-white rounded-br-none"
                        : "bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-xs"
                    }`}
                  >
                    {highlightFlaggedText(msg.text)}
                  </div>
                  <span className="text-xs text-slate-400 mt-1 px-1 font-bold">
                    {msg.senderName}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            autoComplete="on"
            autoCorrect="on"
            spellCheck={true}
            autoCapitalize="sentences"
            className="flex-1 bg-slate-100 border border-slate-200 text-slate-900 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-4 py-2.5 btn-primary text-xs uppercase tracking-wider flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-[#0F172A]" />
          </button>
        </form>

      </div>
    </div>
  );
}
