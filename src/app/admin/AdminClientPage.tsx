"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  Shield,
  Trash2,
  CheckCircle,
  Star,
  Tag,
  Wrench,
  Store,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Video,
  Upload,
  Copy,
  Film,
  Sparkles,
  Search,
  Check,
  RefreshCw,
  Eye,
  Phone,
  BarChart2,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { TANJORE_LOCALITIES } from "@/lib/constants";

type ModerationItem = {
  id: string;
  colName: string;
  title: string;
  name?: string;
  shop_name?: string;
  phone: string;
  area_tag: string;
  is_verified?: boolean;
  is_featured?: boolean;
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

  // Video Upload & AI Offer Publisher States
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [directVideoUrl, setDirectVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoArea, setVideoArea] = useState<string>(TANJORE_LOCALITIES[0]);
  const [shopPhone, setShopPhone] = useState("9994837342");
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().split("T")[0]);
  const [validTo, setValidTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [publishToOffers, setPublishToOffers] = useState(true);
  const [isAiFormatting, setIsAiFormatting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");

  // Auto-verify Admin if user mobile is 9994837342
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
            title: data.title || data.name || data.shop_name || "Untitled Listing",
            phone: data.phone || "",
            area_tag: data.area_tag || "Tanjore Town",
            is_verified: data.is_verified || false,
            is_featured: data.is_featured || false,
            price: data.price !== undefined ? data.price : null,
            category: data.category || "General",
            created_at: data.created_at,
          });
        });
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
      toast.success(nextVerify ? "Listing status set to APPROVED!" : "Listing set to pending.");
    } catch (error) {
      toast.error("Error updating status: " + error);
    }
  };

  const handleToggleFeatured = async (item: ModerationItem) => {
    try {
      const nextFeatured = !item.is_featured;
      await updateDoc(doc(db, item.colName, item.id), {
        is_featured: nextFeatured,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_featured: nextFeatured } : i))
      );
      toast.success(nextFeatured ? "Listing pinned as FEATURED SPONSOR!" : "Sponsor pin removed.");
    } catch (error) {
      toast.error("Error updating promotion: " + error);
    }
  };

  const getApiUrl = (endpoint: string) => {
    if (typeof window !== "undefined") {
      const isNative = (window as any).Capacitor?.isNativePlatform() || window.location.protocol === "file:" || window.location.origin.includes("localhost");
      if (isNative) {
        return `https://mythanjai.vercel.app${endpoint}`;
      }
    }
    return endpoint;
  };

  const handleFormatWithAi = async () => {
    if (!videoDescription.trim()) {
      toast.error("Please enter raw offer notes to analyze with AI.");
      return;
    }
    setIsAiFormatting(true);
    try {
      const res = await fetch(getApiUrl("/api/gemini-format"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "shops",
          rawDescription: videoDescription,
        }),
      });
      const data = await res.json();
      if (data.success && data.formattedText) {
        setVideoDescription(data.formattedText);
        toast.success("Gemini AI generated a polished offer summary!");
      } else {
        toast.error(data.error || "Failed to format description with AI.");
      }
    } catch (err) {
      toast.error("Network error while formatting with AI.");
    } finally {
      setIsAiFormatting(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file (.mp4, .webm, .mov).");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error("Video file exceeds 25MB. Please use the direct video link option for instant publishing.");
      }
      setSelectedVideo(file);
      if (!videoTitle) {
        setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo && !directVideoUrl.trim()) {
      toast.error("Please select a video file or enter a direct video link.");
      return;
    }

    setVideoUploading(true);
    setUploadProgress(10);

    const publishOfferToFirestore = async (videoUrl: string) => {
      if (publishToOffers) {
        try {
          const offerRecord = {
            userId: user?.uid || "admin_9994837342",
            shop_name: videoTitle.trim() || "Local Partner Store",
            category: "Local Offers & Deals",
            area_tag: videoArea,
            address_text: `${videoArea}, Thanjavur`,
            phone: shopPhone || profile?.phone || "9994837342",
            image_url: "/thanjavur_temple_illustration.png",
            offer_social_link: videoUrl,
            offer_title: videoTitle.trim() || "Exclusive Discount Offer",
            offer_description: videoDescription.trim() || "Special promotional offer with video reel.",
            valid_from: validFrom || new Date().toISOString().split("T")[0],
            valid_to: validTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            is_featured: true,
            is_verified: true,
            is_claimed: true,
            hours: "Limited Time Offer",
            created_at: serverTimestamp(),
            show_phone: true,
          };

          await addDoc(collection(db, "shops"), offerRecord);
          await addDoc(collection(db, "offers"), offerRecord);
          toast.success("Video Offer Published Live to Offers Page!");
        } catch (pubErr: any) {
          console.warn("Live offer publishing error:", pubErr);
          toast.error("Error writing offer to database: " + pubErr.message);
        }
      } else {
        toast.success("Video linked successfully!");
      }
    };

    try {
      // Case 1: Direct Video Link provided
      if (directVideoUrl.trim()) {
        const finalUrl = directVideoUrl.trim();
        setUploadedVideoUrl(finalUrl);
        setUploadProgress(100);
        await publishOfferToFirestore(finalUrl);
        return;
      }

      // Case 2: File Upload via Firebase Storage (Resumable CDN Upload)
      if (selectedVideo) {
        setUploadProgress(10);
        const storageRef = ref(storage, `admin_videos/${Date.now()}_${selectedVideo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);

        const uploadTask = uploadBytesResumable(storageRef, selectedVideo);

        uploadTask.on("state_changed", (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        });

        const uploadSnapshot = await uploadTask;
        setUploadProgress(90);

        const downloadUrl = await getDownloadURL(uploadSnapshot.ref);
        setUploadedVideoUrl(downloadUrl);
        setUploadProgress(100);

        try {
          await addDoc(collection(db, "admin_videos"), {
            title: videoTitle || selectedVideo.name,
            video_url: downloadUrl,
            created_at: serverTimestamp(),
            uploaded_by: profile?.phone || "admin_9994837342",
          });
        } catch (e) {}

        await publishOfferToFirestore(downloadUrl);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to complete upload.");
    } finally {
      setVideoUploading(false);
    }
  };

  const statsSummary = useMemo(() => {
    const total = items.length;
    const verified = items.filter((i) => i.is_verified).length;
    const featured = items.filter((i) => i.is_featured).length;
    const services = items.filter((i) => i.colName === "services").length;
    return { total, verified, featured, services };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTab = activeTab === "all" || item.colName === activeTab;
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
        return <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">Marketplace</span>;
      case "services":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">Local Service</span>;
      case "shops":
        return <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">Shop Directory</span>;
      case "offers":
        return <span className="bg-pink-50 text-pink-700 border border-pink-200/80 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">Video Offer</span>;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 text-white min-h-screen font-sans">
        <div className="w-full max-w-sm flex flex-col gap-5 bg-slate-800/90 border border-slate-700/80 p-6 rounded-3xl shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500 text-slate-955 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Shield className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="font-heading font-black text-xl text-white">Admin Command Center</h2>
            <p className="text-xs text-slate-400 font-medium">Protected console for Namma Thanjai moderation</p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
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
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-heading font-black py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
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
          <div className="w-8 h-8 rounded-xl bg-yellow-500 text-slate-955 flex items-center justify-center font-bold shadow-xs">
            <Shield className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-sm text-white flex items-center gap-2">
              <span>Admin Moderation Console</span>
              <span className="bg-yellow-500 text-slate-955 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Master Admin</span>
            </h2>
            <p className="text-[10px] text-slate-400">Moderate listings, verify providers & publish promo video reels</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="flex items-center gap-1 text-xs bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Console</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Metric Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Queue Listings</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-heading font-black text-slate-900">{statsSummary.total}</span>
              <BarChart2 className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Verified Listings</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-heading font-black text-emerald-600">{statsSummary.verified}</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Featured Sponsors</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-heading font-black text-amber-700">{statsSummary.featured}</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-1">
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Trade Services</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-heading font-black text-purple-700">{statsSummary.services}</span>
              <Wrench className="w-4 h-4 text-purple-500" />
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
              { id: "video_upload", label: "📹 Upload Video Reel" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.id === "video_upload" && <Film className="w-3.5 h-3.5 text-yellow-400" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Filter Box */}
          {activeTab !== "video_upload" && (
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
          )}
        </div>

        {/* SECTION 1: DEDICATED VIDEO REEL UPLOADER TAB */}
        {activeTab === "video_upload" ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col gap-6 max-w-2xl mx-auto w-full font-sans">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center border border-yellow-500/20 shrink-0">
                <Video className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <span>Firebase Storage Video Reel Uploader</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-black uppercase">Firebase CDN</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Upload promo video reels directly to Firebase Storage & publish live offer cards on `/offers`.
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadVideo} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Store / Offer Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GLEN Kitchen Chimney — 50% OFF"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Location in Thanjavur</label>
                  <select
                    value={videoArea}
                    onChange={(e) => setVideoArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-yellow-500 cursor-pointer"
                  >
                    {TANJORE_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Offer Validity Date Pickers & Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9994837342"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Offer Valid From *</label>
                  <input
                    type="date"
                    required
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Offer Valid Until *</label>
                  <input
                    type="date"
                    required
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Offer Description with Gemini AI Polish Engine */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Offer Details & Notes</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFormatWithAi}
                    disabled={isAiFormatting || !videoDescription.trim()}
                    className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAiFormatting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>AI Formatting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>✨ AI Auto-Fill & Polish</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter raw offer notes (e.g. 50% discount on GLEN Chimney, free installation, valid till Sunday near Medical College Road)..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                />
              </div>

              {/* Video File Input Dropzone */}
              <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-amber-500 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer">
                <label className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
                    <Film className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="font-heading font-extrabold text-xs text-slate-900">
                    {selectedVideo ? selectedVideo.name : "Select or drag Video Reel (.mp4, .webm, .mov)"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {selectedVideo ? `${(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB` : "Video stored on Firebase Storage CDN & linked to live offer"}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Direct Video Link URL Input Option */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>OR Paste Direct Video Reel Link URL</span>
                  <span className="text-[10px] text-slate-400 font-normal">(YouTube shorts, MP4, Reel CDN URL)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={directVideoUrl}
                  onChange={(e) => setDirectVideoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Toggle: Publish directly to Local Offers directory */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-pink-600" />
                    <span>Publish live to Offers directory (/offers)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Creates an active video offer card visible to all Tanjore users immediately!
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={publishToOffers}
                    onChange={(e) => setPublishToOffers(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              {/* Real-time Progress Bar */}
              {videoUploading && (
                <div className="flex flex-col gap-1.5 bg-yellow-50 border border-yellow-200 p-3.5 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-600" />
                      <span>Uploading Video & Publishing Live Offer...</span>
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleUploadVideo}
                disabled={videoUploading || (!selectedVideo && !directVideoUrl.trim())}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-955 font-heading font-black text-xs uppercase tracking-wider rounded-xl border border-amber-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {videoUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-955" />
                    <span>Uploading & Publishing ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>Publish Video Offer Live</span>
                  </>
                )}
              </button>
            </form>

            {/* Uploaded Video Success & Copy URL Result Card with Natural Aspect Ratio Support */}
            {uploadedVideoUrl && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Video Uploaded & Live!</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(uploadedVideoUrl);
                      toast.success("Video CDN URL copied to clipboard!");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy CDN Link</span>
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-slate-950 flex items-center justify-center p-2 min-h-[220px] max-h-[70vh]">
                  <video src={uploadedVideoUrl} controls className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-md" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SECTION 2: MAIN MODERATION QUEUE GRID */
          loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-yellow-600" />
              <span className="text-xs font-extrabold text-slate-500">Loading Moderation Queue...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 text-xs font-bold text-slate-500 border border-dashed border-slate-300 rounded-3xl bg-white shadow-2xs">
              No listings matching filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md transition-all font-sans"
                >
                  <div className="flex flex-col gap-2">
                    {/* Header item */}
                    <div className="flex justify-between items-center gap-2">
                      {getColBadge(item.colName)}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.colName)}
                        className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Details */}
                    <div>
                      <h4 className="font-heading font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">{item.title}</h4>
                      {item.price !== null && item.price !== undefined && (
                        <span className="text-xs text-emerald-600 font-extrabold block mt-0.5">
                          Price: ₹{item.price.toLocaleString("en-IN")}
                        </span>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-1.5">
                        <span>Area: <strong className="text-slate-800 font-semibold">{item.area_tag}</strong></span>
                        <span>•</span>
                        <span>Contact: <strong className="text-slate-800 font-semibold">+{item.phone || "N/A"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Controls */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleToggleVerify(item)}
                      className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                        item.is_verified
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{item.is_verified ? "Approved" : "Approve Check"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(item)}
                      className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                        item.is_featured
                          ? "bg-amber-50 text-amber-900 border border-amber-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.is_featured ? "fill-amber-400 text-amber-500" : ""}`} />
                      <span>{item.is_featured ? "Sponsor Pinned" : "Pin Sponsor"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
