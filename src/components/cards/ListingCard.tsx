"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Share2, Bookmark, Phone, MessageSquare, MapPin, Calendar, Flag, X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { formatRelativeTime, formatIndianCurrencyText } from "@/lib/constants";
import InAppChatModal from "@/components/chat/InAppChatModal";
import { reportListing } from "@/lib/moderation";
import { useToast } from "@/context/ToastContext";
import CategoryVectorIllustration from "@/components/ui/CategoryVectorIllustration";
import CategoryIcon from "@/components/ui/CategoryIcon";

export interface ListingItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  expected_price_from?: string;
  expected_price_to?: string;
  location?: string;
  images?: string[];
  image_url?: string;
  category?: string;
  type?: "sell" | "looking_for" | "service" | "offer";
  views_count?: number;
  shares_count?: number;
  saved_by?: string[];
  phone?: string;
  show_phone?: boolean;
  seller_id?: string;
  seller_name?: string;
  youtube_link?: string;
  google_maps_link?: string;
  created_at?: any;
}

// ── Fullscreen Image Gallery Modal ─────────────────────────────────────────
function GalleryModal({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setCurrent((p) => Math.min(p + 1, images.length - 1));
      if (e.key === "ArrowLeft") setCurrent((p) => Math.max(p - 1, 0));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center font-sans"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer z-10"
        aria-label="Close gallery"
      >
        <X className="w-5 h-5" />
      </button>

      <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/80 text-xs font-bold tracking-wider">
        {current + 1} / {images.length}
      </span>

      <div
        className="relative w-full max-w-2xl max-h-[80vh] mx-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[current]}
          alt={`Photo ${current + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCurrent((p) => Math.max(p - 1, 0)); }}
            disabled={current === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCurrent((p) => Math.min(p + 1, images.length - 1)); }}
            disabled={current === images.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === current ? "bg-amber-400 scale-125" : "bg-white/40"}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sell Card Component (Figma Wireframe Exact Implementation) ──────────────
export default function ListingCard({ listing }: { listing: ListingItem }) {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    return Boolean(user?.uid && listing.saved_by && listing.saved_by.includes(user.uid));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved: any[] = JSON.parse(localStorage.getItem("namma_thanjai_saved_posts") || "[]");
        if (saved.some((s) => s.id === listing.id)) {
          setIsSaved(true);
        }
      } catch (e) {}
    }
  }, [listing.id]);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const isOwnPost = React.useMemo(() => {
    if (user?.uid && listing.seller_id === user.uid) return true;
    if (profile?.phone && listing.phone && profile.phone === listing.phone) return true;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        if (stored.some((p: any) => p.id === listing.id)) return true;
      } catch (e) {}
    }
    return false;
  }, [user, profile, listing]);

  // Native Android System Share Action
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://mythanjai.vercel.app";
    const shareText = `Check out "${listing.title}" in Thanjavur on Namma Thanjai app:\n${shareUrl}`;

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: listing.title || "Namma Thanjai Listing",
          text: shareText,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, "_blank");
      }
      const listingRef = doc(db, "needs_and_sales", listing.id);
      await updateDoc(listingRef, { shares_count: increment(1) });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Listing link copied to clipboard!");
      }
    }
  };

  // Toggle Save — persists to localStorage (classifieds collection doesn't exist in this app)
  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile?.isVerified && !user) {
      toast.info("Please verify your WhatsApp mobile number to save listings to your profile.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      const saved: any[] = JSON.parse(localStorage.getItem("namma_thanjai_saved_posts") || "[]");
      if (nextState) {
        if (!saved.some((s: any) => s.id === listing.id)) {
          saved.unshift({
            id: listing.id,
            title: listing.title,
            price: listing.price,
            image_url: listing.image_url,
            phone: listing.phone,
            area_tag: listing.location,
            category: listing.category,
            type: listing.type,
            colName: "needs_and_sales",
            saved_at: new Date().toISOString(),
          });
        }
        toast.success("Listing saved to your profile!");
      } else {
        const updated = saved.filter((s: any) => s.id !== listing.id);
        localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(updated));
        toast.info("Listing removed from saved.");
        return;
      }
      localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(saved));
    } catch (e) {}
  };

  // Report Listing
  const handleReportListing = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = reportListing(listing.id, "Inappropriate content");
    if (result.isQuarantined) {
      toast.info("Post flagged and sent to moderation review.");
    } else {
      toast.info("Thank you for reporting. Admin has been notified.");
    }
  };

  const getCategoryIllustration = (category?: string) => {
    return "";
  };


  // Collect all images for multi-image gallery
  const allImages = React.useMemo<string[]>(() => {
    const arr: string[] = [];
    const push = (v: any) => { if (typeof v === "string" && v.trim()) arr.push(v); };
    (listing.images || []).forEach(push);
    ((listing as any).image_urls || []).forEach(push);
    if (!arr.length) push(listing.image_url);
    return arr.filter(Boolean);
  }, [listing]);

  const categoryFallback = getCategoryIllustration(listing.category || listing.type);
  const imageSrc = allImages[0] || categoryFallback;
  const extraCount = allImages.length - 1;

  const isLookingFor = listing.type === "looking_for" || listing.expected_price_from;

  const formattedPrice = React.useMemo(() => {
    if (isLookingFor) {
      if (listing.expected_price_from || listing.expected_price_to) {
        return `₹${listing.expected_price_from || "0"} - ₹${listing.expected_price_to || "0"}`;
      }
      return listing.price ? (String(listing.price).startsWith("₹") ? listing.price : `₹${listing.price}`) : "";
    }
    if (!listing.price) return "";
    const str = String(listing.price).replace(/[^0-9.]/g, "");
    const num = parseFloat(str);
    if (isNaN(num) || num === 0) return String(listing.price).startsWith("₹") ? listing.price : `₹${listing.price}`;
    return formatIndianCurrencyText(num);
  }, [listing.price, listing.expected_price_from, listing.expected_price_to, isLookingFor]);

  const rawPhone = String(listing.phone || "");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello! I saw your listing "${listing.title}" on Namma Thanjai. Is it available?`
  )}`;

  return (
    <>
      <div className="bg-white rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 border border-slate-200/90 relative font-sans h-full">
        <div className="flex flex-col gap-3 flex-1">

          {/* ── TOP HEADER BLOCK: Left Image Box + Right Details Column ── */}
          <div className="flex items-start gap-3 w-full">
            
            {/* LEFT: Compact Square Image Container with +N Badge (w-20 h-20 sm:w-24 sm:h-24) */}
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 relative overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs group/img cursor-pointer"
              onClick={(e) => {
                if (allImages.length > 0) {
                  e.stopPropagation();
                  setGalleryIndex(0);
                }
              }}
            >
              {allImages.length > 0 ? (
                <Image
                  src={imageSrc}
                  alt={listing.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover/img:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-amber-400 p-2 flex flex-col items-center justify-center text-center select-none">
                  <Camera className="w-5 h-5 text-amber-400 mb-1 opacity-80" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Request Photo</span>
                </div>
              )}
              {/* +N Badge overlay on bottom-right of image */}
              {extraCount > 0 && (
                <div className="absolute bottom-1.5 right-1.5 bg-slate-950/85 backdrop-blur-md text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-amber-400/40 shadow-md">
                  +{extraCount}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Category Badge (left) + Price (right) + Title (left) */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
              {/* Top Row: Category Name on Left, Price on Right */}
              <div className="flex items-center justify-between gap-2 w-full">
                <CategoryIcon category={listing.category || listing.type} />
                <div className="font-heading font-black text-base sm:text-lg text-[#0F172A] tracking-tight shrink-0">
                  {formattedPrice}
                </div>
              </div>

              {/* Title: Single-line bold text */}
              <h3 className="font-sans font-extrabold text-sm sm:text-base text-slate-900 truncate line-clamp-1 whitespace-nowrap leading-snug text-left mt-0.5">
                {listing.title}
              </h3>
            </div>
          </div>

          {/* ── MIDDLE SECTION: Fixed Height Description Box ── */}
          <div className="min-h-[4.5rem] bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl flex items-center">
            <p className="text-xs text-slate-700 font-normal leading-relaxed line-clamp-3">
              {listing.description || "No detailed description provided."}
            </p>
          </div>

          {/* ── ROW 3: Location on Left + 3 Icon Buttons on Right ── */}
          <div className="flex items-center justify-between text-xs text-slate-600 border-t border-b border-slate-100 py-2 my-0.5 gap-2">
            {/* Location Tag */}
            <div className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold truncate">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{listing.location || "Medical College Rd, Thanjavur"}</span>
            </div>

            {/* 3 Square Action Icon Buttons (Save, Share, Report) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1st: Save */}
              <button
                type="button"
                onClick={handleSaveToggle}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  isSaved
                    ? "bg-amber-50 border-amber-300 text-amber-600"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                }`}
                title={isSaved ? "Saved" : "Save Listing"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-600" : ""}`} />
              </button>

              {/* 2nd: Share */}
              <button
                type="button"
                onClick={handleShare}
                className="w-7 h-7 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Share Listing"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {/* 3rd: Report */}
              <button
                type="button"
                onClick={handleReportListing}
                className="w-7 h-7 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Report Listing"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── FOOTER ROW: Date Ago (Left) + 2 Rectangular Buttons (Right) ── */}
        <div className="pt-2 flex items-center justify-between gap-2 mt-auto border-t border-slate-100">
          {/* Left: Date Ago */}
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatRelativeTime(listing.created_at)}</span>
          </span>

          {/* Right: 2 Rectangular CTA Buttons (Exact w-[128px] each matching other segments) */}
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isVerified) {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                  }
                  return;
                }
                router.push(`/chat?listingId=${listing.id}&sellerId=${listing.seller_id || ""}&title=${encodeURIComponent(listing.title)}`);
              }}
              className="w-[128px] shrink-0 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 text-[#0F172A] shrink-0 stroke-[2.5]" />
              <span>Chat</span>
            </button>

            {(listing.show_phone !== false) && (
              <a
                href={callUrl}
                onClick={(e) => e.stopPropagation()}
                className="w-[128px] shrink-0 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4 text-white shrink-0" />
                <span>Call</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* In-App Chat Modal */}
      <InAppChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        listingId={listing.id}
        listingTitle={listing.title}
        sellerId={listing.seller_id || "seller_default"}
        sellerName={listing.seller_name || "Seller"}
      />

      {/* Fullscreen Gallery Modal for multi-images */}
      {galleryIndex !== null && allImages.length > 0 && (
        <GalleryModal
          images={allImages}
          startIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </>
  );
}
