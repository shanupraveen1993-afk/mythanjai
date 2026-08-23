"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Shield,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Search,
  RefreshCw,
  BarChart2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Phone,
  Tag,
  MapPin,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";

type ModerationItem = {
  id: string;
  colName: string;
  title: string;
  name?: string;
  shop_name?: string;
  phone: string;
  area_tag: string;
  is_verified?: boolean;
  is_reported?: boolean;
  price?: number | string | null;
  category: string;
  created_at: any;
  image_url?: string;
};

export default function AdminClientPage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Auto-verify Admin if user mobile is 9994837342 or user profile is admin
  useEffect(() => {
    const rawPhone = String(profile?.phone || user?.phoneNumber || "");
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.includes("9994837342") || profile?.isAdmin) {
      setIsAdmin(true);
    }
  }, [profile, user]);

  // Live Real-Time Snapshot Stream from All Live Firestore Collections
  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const collectionsToQuery = ["needs_and_sales", "services", "shops", "offers"];
    const collectionDataMap: Record<string, ModerationItem[]> = {};

    const unsubscribes = collectionsToQuery.map((colName) => {
      const colRef = collection(db, colName);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const colItems: ModerationItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            colItems.push({
              id: docSnap.id,
              colName,
              title: data.title || data.name || data.shop_name || data.offer_title || "Untitled Listing",
              phone: data.phone || "",
              area_tag: data.area_tag || "Thanjavur",
              is_verified: data.is_verified !== false,
              is_reported: Boolean(data.is_reported || data.flagged || data.negative_reports_count > 0),
              price: data.price !== undefined ? data.price : null,
              category: data.category || data.skill_category || "General",
              created_at: data.created_at,
              image_url: data.image_url || data.image_urls?.[0],
            });
          });
          collectionDataMap[colName] = colItems;

          // Merge all collections & local posts
          let merged: ModerationItem[] = Object.values(collectionDataMap).flat();

          if (typeof window !== "undefined") {
            try {
              const localPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
              localPosts.forEach((lp: any) => {
                if (!merged.some((m) => m.id === lp.id)) {
                  merged.push({
                    id: lp.id,
                    colName: lp.skill_category ? "services" : lp.type === "SELL" || lp.type === "NEED" ? "needs_and_sales" : "shops",
                    title: lp.title || lp.name || lp.shop_name || lp.offer_title || "Local Post",
                    phone: lp.phone || "",
                    area_tag: lp.area_tag || "Thanjavur",
                    is_verified: lp.is_verified !== false,
                    is_reported: Boolean(lp.is_reported),
                    price: lp.price || null,
                    category: lp.category || lp.skill_category || "General",
                    created_at: lp.created_at,
                    image_url: lp.image_url,
                  });
                }
              });
            } catch (e) {}
          }

          merged.sort((a, b) => {
            const timeA = a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at || 0).getTime();
            const timeB = b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at || 0).getTime();
            return timeB - timeA;
          });

          setItems(merged);
          setLoading(false);
        },
        (err) => {
          console.warn(`Admin stream warning for ${colName}:`, err);
          setLoading(false);
        }
      );
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [isAdmin]);

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "shanu70#") {
      setIsAdmin(true);
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 50, spread: 60 });
      } catch (err) {}
    } else {
      toast.error("Invalid Admin Passcode!");
    }
  };

  const handleDelete = async (id: string, colName: string) => {
    if (!confirm("Delete this live listing permanently from database?")) return;
    try {
      await deleteDoc(doc(db, colName, id));
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (typeof window !== "undefined") {
        try {
          const localPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
          const updated = localPosts.filter((lp: any) => lp.id !== id);
          localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(updated));
        } catch (e) {}
      }
      toast.success("Listing deleted permanently.");
    } catch (error) {
      toast.error("Error deleting item: " + error);
    }
  };

  const handleToggleVerify = async (item: ModerationItem) => {
    try {
      const nextVerify = !item.is_verified;
      await updateDoc(doc(db, item.colName, item.id), {
        is_verified: nextVerify,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_verified: nextVerify } : i))
      );
      toast.success(nextVerify ? "Listing status set to APPROVED ✓" : "Listing set to Pending Review.");
    } catch (error) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_verified: !item.is_verified } : i))
      );
      toast.success("Listing status updated locally.");
    }
  };

  const statsSummary = useMemo(() => {
    const total = items.length;
    const verified = items.filter((i) => i.is_verified).length;
    const pending = items.filter((i) => !i.is_verified).length;
    const reported = items.filter((i) => i.is_reported).length;
    return { total, verified, pending, reported };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let matchesTab = activeTab === "all" || item.colName === activeTab;
      if (activeTab === "reported") {
        matchesTab = Boolean(item.is_reported);
      }
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.area_tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [items, activeTab, searchQuery]);

  const getColBadge = (colName: string) => {
    switch (colName) {
      case "needs_and_sales":
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Sell / Need</span>;
      case "services":
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-400/40 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Service</span>;
      case "shops":
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Store Offer</span>;
      default:
        return null;
    }
  };

  // Security Login Screen
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0f172a] text-white min-h-screen font-sans">
        <div className="w-full max-w-sm flex flex-col gap-6 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/20">
              <Shield className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h2 className="font-heading font-black text-2xl text-white tracking-tight">Admin Console</h2>
            <p className="text-xs text-slate-400 font-medium">Master moderation portal for Namma Thanjai</p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Security Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-black text-xs uppercase tracking-wider cursor-pointer rounded-2xl shadow-md transition-all"
            >
              Verify Passcode & Launch Console →
            </button>
          </form>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Namma Thanjai App</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0b1329] text-slate-100 flex flex-col min-h-screen font-sans pb-16">
      {/* Sleek Master Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-2xl border-b border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-heading font-black text-base sm:text-lg text-white flex items-center gap-2 tracking-tight">
              <span>Admin Console</span>
              <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Online
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Real-time community listings moderation & verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Post Buttons for all 4 segments */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link href="/post?segment=offer&admin=true" className="flex items-center gap-1 text-[10px] bg-amber-400/20 border border-amber-400/40 text-amber-300 hover:bg-amber-400/30 font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider shrink-0">
              <Sparkles className="w-3 h-3" /> Post Offer
            </Link>
            <Link href="/post?segment=sell&admin=true" className="flex items-center gap-1 text-[10px] bg-blue-400/20 border border-blue-400/40 text-blue-300 hover:bg-blue-400/30 font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider shrink-0">
              + Post Sell
            </Link>
            <Link href="/post?segment=need&admin=true" className="flex items-center gap-1 text-[10px] bg-purple-400/20 border border-purple-400/40 text-purple-300 hover:bg-purple-400/30 font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider shrink-0">
              + Post Need
            </Link>
            <Link href="/post?segment=service&admin=true" className="flex items-center gap-1 text-[10px] bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/30 font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider shrink-0">
              + Post Service
            </Link>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-black px-3 py-2 rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Console</span>
          </Link>
        </div>
      </header>


      <div className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Live Metric Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col gap-1.5 backdrop-blur-md">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Live Listings</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-heading font-black text-white">{statsSummary.total}</span>
              <BarChart2 className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-md flex flex-col gap-1.5 backdrop-blur-md">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">Approved Posts</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-heading font-black text-emerald-400">{statsSummary.verified}</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 shadow-md flex flex-col gap-1.5 backdrop-blur-md">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">Pending Review</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-heading font-black text-amber-400">{statsSummary.pending}</span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4 shadow-md flex flex-col gap-1.5 backdrop-blur-md">
            <span className="text-[11px] font-black text-rose-400 uppercase tracking-wider">Reported Issues</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-heading font-black text-rose-400">{statsSummary.reported}</span>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Toolbar: Category Tabs & Search Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {[
              { id: "all", label: "All Queue" },
              { id: "needs_and_sales", label: "Sell / Need" },
              { id: "services", label: "Services" },
              { id: "shops", label: "Shops & Offers" },
              { id: "reported", label: "🚩 Flagged Issues" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-black shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, phone, or locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* LIVE REAL-TIME MODERATION QUEUE GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Streaming Live Online Listings...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-900/60 p-6">
            No live community listings matching filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-lg backdrop-blur-md font-sans transition-all hover:border-slate-700 ${
                  item.is_reported ? "border-rose-500/50 bg-rose-950/20" : "border-slate-800"
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Top Badge Row */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      {getColBadge(item.colName)}
                      {item.is_reported && (
                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md text-[10px] font-black uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Reported
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Media + Title Details */}
                  <div className="flex gap-3">
                    {item.image_url ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center text-slate-600">
                        <Tag className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-black text-sm text-white leading-snug line-clamp-1 truncate">{item.title}</h4>
                      {item.price !== null && item.price !== undefined && (
                        <span className="text-xs text-amber-400 font-extrabold block mt-0.5">
                          ₹{typeof item.price === "number" ? item.price.toLocaleString("en-IN") : item.price}
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-400" />{item.area_tag}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-amber-400" />+{item.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Moderation Controls: Approve Toggle & Delete */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleToggleVerify(item)}
                    className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-xs font-heading font-black uppercase transition-all cursor-pointer ${
                      item.is_verified
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{item.is_verified ? "Approved ✓" : "Approve Listing"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.colName)}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors shrink-0 cursor-pointer font-heading font-black text-xs flex items-center gap-1"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
