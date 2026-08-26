"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Share2, Bookmark, Phone, MessageSquare, MapPin, Calendar, Flag, X, ChevronLeft, ChevronRight, Camera, Pencil, Eye } from "lucide-react";
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
  type?: "sell" | "looking_for" | "service" | "offer" | "NEED" | "need" | "SELL" | "buy" | string;
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
function GalleryModal({
  images,
  startIndex,
  onClose,
  onChat,
  onCall,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
  onChat?: () => void;
  onCall?: () => void;
}) {
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
        className="relative w-full max-w-2xl max-h-[75vh] mx-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[current]}
          alt={`Photo ${current + 1}`}
          className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
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

      {/* Lightbox Bottom Action Bar (Chat & Call CTAs Overlay) */}
      {(onChat || onCall) && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl backdrop-blur-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {onChat && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onChat();
              }}
              className="w-[128px] border-2 border-white text-white bg-white/10 hover:bg-white/20 font-heading font-black text-xs sm:text-sm py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-white stroke-[2.5]" />
              <span>Chat</span>
            </button>
          )}

          {onCall && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCall();
              }}
              className="w-[128px] bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-heading font-black text-xs sm:text-sm py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md"
            >
              <Phone className="w-4 h-4 text-white shrink-0" />
              <span>Call</span>
            </button>
          )}
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-20 flex gap-2">
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
export default function ListingCard({ listing, isPreview }: { listing: ListingItem; isPreview?: boolean }) {
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
  const [imgError, setImgError] = useState(false);

  const isOwnPost = React.useMemo(() => {
    if (isPreview) return false;
    // Check by Firebase UID (most reliable)
    if (user?.uid && user.uid !== "guest_user" && listing.seller_id === user.uid) return true;
    // Check by phone number (normalized — strip country code for comparison)
    const normalizePhone = (p: string) => String(p || "").replace(/\D/g, "").slice(-10);
    if (profile?.phone && listing.phone) {
      if (normalizePhone(profile.phone) === normalizePhone(listing.phone)) return true;
    }
    return false;
  }, [user, profile, listing, isPreview]);

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
  const handleReportListing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await reportListing(listing.id, "needs_and_sales", "Inappropriate content", profile?.phone || user?.phoneNumber || "Anonymous");
    if (res.success) {
      toast.success("Thank you! Report submitted to admin for verification.");
    } else {
      toast.error("Could not submit report. Please try again.");
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

  const isLookingFor =
    listing.type === "looking_for" ||
    listing.type === "NEED" ||
    listing.type === "need" ||
    listing.type === "buy" ||
    Boolean(listing.expected_price_from);

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
      {/* FACEBOOK-STYLE POST CARD CONTAINER */}
      <div className="bg-white border-y sm:border sm:rounded-xl border-slate-200/90 shadow-2xs mb-3.5 font-sans overflow-hidden transition-all">
        
        {/* 1. FACEBOOK POST HEADER ROW */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar Circle */}
            <div className="w-10 h-10 rounded-full bg-slate-950 text-amber-400 font-heading font-black text-sm flex items-center justify-center border border-amber-400/80 shrink-0 shadow-2xs select-none">
              {(listing.seller_name || listing.title || "NT").slice(0, 2).toUpperCase()}
            </div>
            
            {/* Author Name + Time + Location */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-sm text-slate-950 truncate leading-tight">
                  {listing.seller_name || "Thanjavur Resident"}
                </span>
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md shrink-0">
                  {listing.category || listing.type || "Listing"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate mt-0.5">
                <span>{formatRelativeTime(listing.created_at)}</span>
                <span>·</span>
                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">{listing.location || "Thanjavur"}</span>
              </div>
            </div>
          </div>

          {/* Price Badge on Right */}
          {formattedPrice && (
            <div className="font-heading font-black text-base sm:text-lg text-amber-600 tracking-tight shrink-0 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
              {formattedPrice}
            </div>
          )}
        </div>

        {/* 2. FACEBOOK POST CAPTION & TITLE SECTION */}
        <div className="px-3.5 sm:px-4 pb-3 flex flex-col gap-1.5">
          <h3 className="font-heading font-black text-base text-slate-950 leading-snug">
            {listing.title}
          </h3>
          {listing.description && (
            <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
              {listing.description}
            </p>
          )}
        </div>

        {/* 3. FULL-BLEED FACEBOOK MEDIA BLOCK */}
        {!isLookingFor && allImages.length > 0 && (
          <div
            className="relative w-full max-h-96 min-h-[220px] bg-slate-900 overflow-hidden cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              setGalleryIndex(0);
            }}
          >
            <img
              src={imgError ? "/placeholder.webp" : imageSrc}
              alt={listing.title}
              onError={() => setImgError(true)}
              className="w-full max-h-96 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            {extraCount > 0 && (
              <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md text-amber-400 text-xs font-black px-2.5 py-1 rounded-lg border border-amber-400/40 shadow-lg">
                +{extraCount} Photos
              </div>
            )}
          </div>
        )}

        {/* 4. FACEBOOK REACTION COUNTER & STATS BAR */}
        <div className="px-3.5 sm:px-4 py-2 bg-slate-50/60 border-t border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500">👍 ❤️</span>
            <span>18 interested in Thanjavur</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <button type="button" onClick={handleSaveToggle} className="hover:text-amber-600 flex items-center gap-1 cursor-pointer">
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-600 text-amber-600" : ""}`} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
            <button type="button" onClick={handleShare} className="hover:text-slate-900 flex items-center gap-1 cursor-pointer">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button type="button" onClick={handleReportListing} className="hover:text-rose-600 flex items-center gap-1 cursor-pointer">
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* 5. FACEBOOK POST ACTION BUTTONS ROW */}
        <div className="p-3 sm:p-3.5 flex items-center justify-end gap-2 bg-white">
          {isOwnPost ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/listings");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs sm:text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
            >
              <Pencil className="w-4 h-4 text-white shrink-0" />
              <span>Manage My Post</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPreview) return;
                  if (!isVerified) {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                    }
                    return;
                  }
                  router.push(`/chat?listingId=${listing.id}&sellerId=${listing.seller_id || ""}&title=${encodeURIComponent(listing.title)}`);
                }}
                className={`flex-1 sm:flex-none border-2 border-slate-900 text-slate-900 bg-white hover:bg-slate-100 font-heading font-black text-xs sm:text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
              >
                <MessageSquare className="w-4 h-4 text-slate-900 shrink-0 stroke-[2.5]" />
                <span>Chat</span>
              </button>

              {(listing.show_phone !== false) && (
                <a
                  href={isPreview ? "#" : callUrl}
                  onClick={(e) => { if (isPreview) e.preventDefault(); e.stopPropagation(); }}
                  className={`flex-1 sm:flex-none bg-[#1d4ed8] hover:bg-blue-800 text-white font-heading font-black text-xs sm:text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <Phone className="w-4 h-4 text-white shrink-0" />
                  <span>Call</span>
                </a>
              )}
            </>
          )}
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

      {/* Fullscreen Gallery Modal for multi-images with Chat & Call CTAs Overlay */}
      {galleryIndex !== null && allImages.length > 0 && (
        <GalleryModal
          images={allImages}
          startIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onChat={() => {
            if (!isVerified) {
              if (typeof window !== "undefined") window.dispatchEvent(new Event("namma_thanjai_open_signin"));
              return;
            }
            router.push(`/chat?listingId=${listing.id}&sellerId=${listing.seller_id || ""}&title=${encodeURIComponent(listing.title)}`);
          }}
          onCall={() => {
            if (typeof window !== "undefined") window.location.href = callUrl;
          }}
        />
      )}
    </>
  );
}
