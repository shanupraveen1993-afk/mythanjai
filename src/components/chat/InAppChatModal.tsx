"use client";

import React, { useState, useEffect } from "react";
import { X, Send, MessageSquare, ShieldCheck, User } from "lucide-react";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
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
}

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

  // Generate deterministic chat room ID between current user & seller for this listing
  const chatId = user?.uid ? `${listingId}_${[user.uid, sellerId].sort().join("_")}` : "";

  useEffect(() => {
    if (!isOpen || !chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(list);
    });

    return () => unsubscribe();
  }, [isOpen, chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !chatId) return;

    setLoading(true);
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: profile?.displayName || "Buyer",
        text: inputText.trim(),
        timestamp: serverTimestamp(),
      });
      setInputText("");
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col h-[520px] animate-scale-up font-sans">
        
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 text-slate-950 flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm text-slate-100">{sellerName}</h3>
              <p className="text-[11px] text-slate-400 font-semibold truncate max-w-[220px]">
                Item: {listingTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-[10px] text-slate-500 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>In-App Private Chat • Phone numbers remain hidden</span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="my-auto text-center flex flex-col items-center gap-2 text-slate-400">
              <MessageSquare className="w-8 h-8 stroke-1" />
              <p className="text-xs font-semibold">No messages yet. Send a message to start negotiating!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl max-w-[80%] text-xs font-semibold ${
                      isMe
                        ? "bg-yellow-500 text-slate-950 rounded-br-none"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">
                    {msg.senderName}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 disabled:opacity-50 text-slate-955 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
