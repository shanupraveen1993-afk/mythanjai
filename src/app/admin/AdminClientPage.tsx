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
  BarChart2,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  Tag,
  MapPin,
  Plus,
  Radio,
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
  video_url?: string;
};

export default function AdminClientPage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; colName: string } | null>(null);

  // Live Real-Time Snapshot Stream from All Live Firestore Collections
  useEffect(() => {
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
              video_url: data.video_url,
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
                    image_url: lp.image_url || lp.image_urls?.[0],
                    video_url: lp.video_url,
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
  }, []);

  const handleDelete = (id: string, colName: string) => {
    setDeleteTarget({ id, colName });
  };

  const executeDelete = async (id: string, colName: string) => {
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
      setDeleteTarget(null);
      toast.success("Listing purged permanently from live system.");
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
      toast.success(nextVerify ? "Listing status set to APPROVED ✓" : "Listing status set to Pending.");
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
    const adminPosts = items.filter((i) => String(i.phone || "").replace(/\D/g, "").includes("9994837342")).length;
    const reelVideos = items.filter((i) => Boolean(i.video_url)).length;
    return { total, verified, pending, reported, adminPosts, reelVideos };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let matchesTab = activeTab === "all" || item.colName === activeTab;
      if (activeTab === "reported") {
        matchesTab = Boolean(item.is_reported);
      } else if (activeTab === "admin_posts") {
        matchesTab = String(item.phone || "").replace(/\D/g, "").includes("9994837342");
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
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-400/40 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">Sell / Need</span>;
      case "services":
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">Service</span>;
      case "shops":
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">Store Offer</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">Ad</span>;
    }
  };

  return (
    <div className="flex-1 bg-[#090D16] text-slate-100 flex flex-col min-h-screen font-sans pb-24">
      
      {/* ── 1. HEADER BAR — Floating Glassmorphic Top Navigation ── */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-2xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/20 shrink-0">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-base sm:text-xl text-white tracking-tight">Admin Console</h1>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Stream
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">Master Live Moderation & Real-Time Data Pipeline</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-black px-4 py-2.5 rounded-xl shadow-lg shadow-amber-400/15 transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Exit Console</span>
        </Link>
      </header>

      {/* ── 2. MAIN CONTAINER ── */}
      <div className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* ── QUICK ADMIN POST BAR ── */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400 shrink-0 stroke-[2.5]" />
            <div>
              <h3 className="font-heading font-black text-sm text-white">Admin Posting Shortcuts</h3>
              <p className="text-xs text-slate-400">Post directly to any feed segment with full admin privileges</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pt-2 sm:pt-0">
            <Link href="/post?segment=offer&admin=true" className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-heading font-black px-3.5 py-2 rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer uppercase tracking-wider shrink-0">
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Post Offer / Reel
            </Link>
            <Link href="/post?segment=sell&admin=true" className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-400/40 font-heading font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider shrink-0">
              + Post Sell
            </Link>
            <Link href="/post?segment=need&admin=true" className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 font-heading font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider shrink-0">
              + Post Need
            </Link>
            <Link href="/post?segment=service&admin=true" className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-400/40 font-heading font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider shrink-0">
              + Post Service
            </Link>
          </div>
        </div>

        {/* ── EXECUTIVE KPI METRIC CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Live Ads</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-white">{statsSummary.total}</span>
              <BarChart2 className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-400/40 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-xl">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">👑 Admin (9994837342)</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-amber-300">{statsSummary.adminPosts}</span>
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-xl">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Approved & Active</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-emerald-400">{statsSummary.verified}</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-xl">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Reel Video Posts</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-amber-400">
                {statsSummary.reelVideos} <span className="text-xs text-slate-500 font-bold">/ 30</span>
              </span>
              <Tag className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between backdrop-blur-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Flagged Reports</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-heading font-black text-rose-400">{statsSummary.reported}</span>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
          </div>
        </div>

        {/* ── TOOLBAR: Category Filter Tabs + Search Box ── */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {[
              { id: "all", label: `All Queue (${statsSummary.total})` },
              { id: "admin_posts", label: `👑 Admin 9994837342 (${statsSummary.adminPosts})` },
              { id: "needs_and_sales", label: "Sell / Need" },
              { id: "services", label: "Services" },
              { id: "shops", label: "Stores & Offers" },
              { id: "reported", label: `🚩 Flagged (${statsSummary.reported})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-heading font-black shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
                    : "text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800/80"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, phone, or locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* ── LIVE MODERATION CARDS GRID ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-slate-900/40 rounded-3xl border border-slate-800">
            <Loader2 className="w-9 h-9 animate-spin text-amber-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Streaming Live Online Listings...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-slate-400 border border-dashed border-slate-800 rounded-3xl bg-slate-900/60 p-6">
            No live community listings matching filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900/90 border rounded-3xl p-4.5 flex flex-col justify-between gap-4 shadow-xl backdrop-blur-xl font-sans transition-all hover:border-slate-700 ${
                  item.is_reported ? "border-rose-500/50 bg-rose-950/20" : "border-slate-800/90"
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Top Badge Row */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      {getColBadge(item.colName)}
                      {item.is_reported && (
                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Reported
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      item.is_verified ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                    }`}>
                      {item.is_verified ? "Approved ✓" : "Pending"}
                    </span>
                  </div>

                  {/* Media + Title Details */}
                  <div className="flex gap-3.5 items-center">
                    {item.image_url ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 shadow-md">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center text-amber-400 shadow-md">
                        <Tag className="w-7 h-7" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-black text-sm text-white leading-snug line-clamp-2">{item.title}</h4>
                      {item.price !== null && item.price !== undefined && (
                        <span className="text-xs text-amber-400 font-heading font-black block mt-1">
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
                <div className="flex items-center gap-2.5 pt-3.5 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleToggleVerify(item)}
                    className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-xs font-heading font-black uppercase transition-all cursor-pointer active:scale-95 ${
                      item.is_verified
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md shadow-amber-400/20"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>{item.is_verified ? "Approved ✓" : "Approve Listing"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.colName)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-all shrink-0 cursor-pointer font-heading font-black text-xs flex items-center gap-1.5 active:scale-95"
                    title="Purge Listing"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Purge</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CUSTOM IN-APP ADMIN DELETE MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-white">Purge Live Listing?</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">This listing will be permanently removed from the live database.</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-heading font-black text-xs rounded-xl cursor-pointer transition-all border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDelete(deleteTarget.id, deleteTarget.colName)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-heading font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                Purge Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
