"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { SELL_SAMPLES, NEED_SAMPLES, SERVICE_SAMPLES, SHOP_SAMPLES } from "@/lib/sampleData";
import {
  Shield,
  Trash2,
  CheckCircle,
  Wrench,
  ArrowLeft,
  Loader2,
  Search,
  RefreshCw,
  BarChart2,
  AlertTriangle,
  Clock,
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
  price?: number | null;
  category: string;
  created_at: any;
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

  const fetchModerationQueue = async () => {
    setLoading(true);
    const collectionsToQuery = ["needs_and_sales", "services", "shops", "offers"];
    const mergedListings: ModerationItem[] = [];

    try {
      for (const colName of collectionsToQuery) {
        const querySnapshot = await getDocs(collection(db, colName));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          mergedListings.push({
            id: docSnap.id,
            colName,
            title: data.title || data.name || data.shop_name || data.offer_title || "Untitled Listing",
            phone: data.phone || "",
            area_tag: data.area_tag || "Tanjore Town",
            is_verified: data.is_verified || false,
            is_reported: Boolean(data.is_reported || data.flagged),
            price: data.price !== undefined ? data.price : null,
            category: data.category || "General",
            created_at: data.created_at,
          });
        });
      }

      // Also merge local posts from localStorage for local verification
      if (typeof window !== "undefined") {
        try {
          const localPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
          localPosts.forEach((lp: any) => {
            if (!mergedListings.some((m) => m.id === lp.id)) {
              mergedListings.push({
                id: lp.id,
                colName: lp.type === "SELL" || lp.type === "NEED" ? "needs_and_sales" : lp.type === "SERVICE" ? "services" : "shops",
                title: lp.title || lp.name || lp.shop_name || lp.offer_title || "Local Post",
                phone: lp.phone || "",
                area_tag: lp.area_tag || "Tanjore Town",
                is_verified: lp.is_verified !== false,
                is_reported: Boolean(lp.is_reported),
                price: lp.price || null,
                category: lp.category || "General",
                created_at: lp.created_at,
              });
            }
          });
        } catch (e) {}
      }

      mergedListings.sort((a, b) => {
        const timeA = a.created_at?.seconds || 0;
        const timeB = b.created_at?.seconds || 0;
        return timeB - timeA;
      });
      setItems(mergedListings);
    } catch (error) {
      console.error("Error loading queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedFirestore = async () => {
    if (!confirm("Seed all 20 sample listings to live Firestore for admin phone 9994837342?")) return;
    setLoading(true);
    try {
      // 1. Seed Sell Samples
      for (const sample of SELL_SAMPLES) {
        await setDoc(doc(db, "needs_and_sales", sample.id), {
          ...sample,
          created_at: new Date(),
          updated_at: new Date(),
        }, { merge: true });
      }

      // 2. Seed Need Samples
      for (const sample of NEED_SAMPLES) {
        await setDoc(doc(db, "needs_and_sales", sample.id), {
          ...sample,
          created_at: new Date(),
          updated_at: new Date(),
        }, { merge: true });
      }

      // 3. Seed Service Samples
      for (const sample of SERVICE_SAMPLES) {
        await setDoc(doc(db, "services", sample.id), {
          ...sample,
          created_at: new Date(),
          updated_at: new Date(),
        }, { merge: true });
      }

      // 4. Seed Shop Samples
      for (const sample of SHOP_SAMPLES) {
        await setDoc(doc(db, "shops", sample.id), {
          ...sample,
          created_at: new Date(),
          updated_at: new Date(),
        }, { merge: true });
      }

      toast.success("Successfully seeded 20 sample listings to Firestore for admin 9994837342!");
      await fetchModerationQueue();
    } catch (err: any) {
      toast.error(`Seeding failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchModerationQueue();
    }
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
      toast.error("Invalid Admin Security Passcode!");
    }
  };

  const handleDelete = async (id: string, colName: string) => {
    if (!confirm("Delete this listing permanently from database?")) return;
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
      toast.success(nextVerify ? "Listing status set to APPROVED!" : "Listing set to pending verification.");
    } catch (error) {
      // Local fallback
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
        return <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md text-xs font-black uppercase">Marketplace</span>;
      case "services":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md text-xs font-black uppercase">Local Service</span>;
      case "shops":
        return <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-xs font-black uppercase">Shop Directory</span>;
      case "offers":
        return <span className="bg-pink-50 text-pink-700 border border-pink-200/80 px-2 py-0.5 rounded-md text-xs font-black uppercase">Live Offer</span>;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 text-white min-h-screen font-sans">
        <div className="w-full max-w-sm flex flex-col gap-5 bg-slate-800/90 border border-slate-700/80 p-6 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500 text-slate-950 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Shield className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="font-heading font-black text-xl text-white">Admin Command Center</h2>
            <p className="text-xs text-slate-400 font-medium">Protected console for Namma Thanjai moderation</p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter security passcode"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-yellow-500 focus:outline-none font-bold"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 btn-primary text-xs uppercase tracking-wider cursor-pointer"
            >
              Verify Passcode & Launch Console →
            </button>
          </form>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer mt-1 font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Namma Thanjai App</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 text-slate-900 flex flex-col min-h-screen font-sans pb-12">
      {/* Top Header Glass Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white px-4 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-yellow-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <Shield className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-sm text-white flex items-center gap-2">
              <span>Admin Moderation Console</span>
              <span className="bg-yellow-500 text-slate-950 text-xs font-black px-1.5 py-0.5 rounded uppercase">Master Admin</span>
            </h2>
            <p className="text-xs text-slate-400">Moderate community listings, verify providers & inspect reported posts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSeedFirestore}
            className="flex items-center gap-1.5 text-xs text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer shadow-xs"
            title="Seed 20 Sample Listings to Live Firestore for Admin 9994837342"
          >
            <span>🌱 Seed Live Posts (9994837342)</span>
          </button>

          <button
            type="button"
            onClick={fetchModerationQueue}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
            title="Refresh Moderation Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Queue</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-1 text-xs bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Console</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Metric Insights Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Queue Listings</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-heading font-black text-slate-900">{statsSummary.total}</span>
              <BarChart2 className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Approved Posts</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-heading font-black text-emerald-600">{statsSummary.verified}</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Pending Review</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-heading font-black text-amber-700">{statsSummary.pending}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1">
            <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Reported Issues</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-heading font-black text-rose-600">{statsSummary.reported}</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        </div>

        {/* Command Toolbar: Search Input + Category Tabs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {[
              { id: "all", label: "All Queue" },
              { id: "needs_and_sales", label: "Marketplace" },
              { id: "services", label: "Local Services" },
              { id: "shops", label: "Shop Directory" },
              { id: "offers", label: "Live Offers" },
              { id: "reported", label: "🚩 Reported Issues" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Filter Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-yellow-500 text-slate-800"
            />
          </div>
        </div>

        {/* MAIN MODERATION QUEUE GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-yellow-600" />
            <span className="text-xs font-extrabold text-slate-500">Loading Community Moderation Queue...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-slate-500 border border-dashed border-slate-300 rounded-xl bg-white shadow-2xs">
            No community listings matching filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md transition-all font-sans ${
                  item.is_reported ? "border-rose-300 bg-rose-50/20" : "border-slate-200/90"
                }`}
              >
                <div className="flex flex-col gap-2">
                  {/* Header item */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {getColBadge(item.colName)}
                      {item.is_reported && (
                        <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md text-xs font-black uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Reported
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <h4 className="font-heading font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">{item.title}</h4>
                    {item.price !== null && item.price !== undefined && (
                      <span className="text-xs text-emerald-600 font-extrabold block mt-0.5">
                        Price: ₹{item.price.toLocaleString("en-IN")}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1.5">
                      <span>Area: <strong className="text-slate-800 font-semibold">{item.area_tag}</strong></span>
                      <span>•</span>
                      <span>Contact: <strong className="text-slate-800 font-semibold">+{item.phone || "N/A"}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Action Controls: Approve & Delete */}
                <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleVerify(item)}
                    className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-heading font-black uppercase transition-all cursor-pointer ${
                      item.is_verified
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{item.is_verified ? "Approved ✓" : "Approve Post"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.colName)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0 cursor-pointer font-heading font-black text-xs flex items-center gap-1"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
