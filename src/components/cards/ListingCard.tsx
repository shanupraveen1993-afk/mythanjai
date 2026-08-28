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

  const [photoRequestCount, setPhotoRequestCount] = useState<number>(() => {
    return (listing as any).photo_requests_count || 0;
  });
  const [hasRequestedPhoto, setHasRequestedPhoto] = useState<boolean>(false);

  const handleRequestPhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasRequestedPhoto) {
      toast.info("You have already requested a photo for this listing.");
      return;
    }
    if (photoRequestCount >= 3) {
      toast.info("Photo request limit reached (3 requests). Owner has been notified!");
      return;
    }
    setPhotoRequestCount((prev) => prev + 1);
    setHasRequestedPhoto(true);
    toast.success("Photo request sent to seller!");

    if (typeof window !== "undefined" && listing.phone) {
      const cleanPh = listing.phone.replace(/\D/g, "");
      if (cleanPh.length >= 10) {
        const caption = `வணக்கம்! Namma Thanjai ஃபீடில் உங்கள் விளம்பரம் "${listing.title}"-க்கு புகைப்படம் (Photo) பதிவேற்ற கோரிக்கை வரப்பெற்றுள்ளது.`;
        window.open(`https://api.whatsapp.com/send?phone=91${cleanPh.slice(-10)}&text=${encodeURIComponent(caption)}`, "_blank");
      }
    }
  };

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
      toast.success("Thank you! Report submitted for verification.");
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
      <div className="bg-white rounded-xl p-4 flex flex-col justify-between shadow-2xs border border-slate-200/90 relative font-sans h-full">
        <div className="flex flex-col gap-3 flex-1">

          {/* ── TOP HEADER BLOCK: Left Image Box + Right Details Column ── */}
          <div className="flex items-start gap-3 w-full">
            
            {/* LEFT: Compact Square Image Container — ONLY render if not a NEED/looking_for requirement card */}
            {!isLookingFor && (
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
                    src={imgError ? "/placeholder.webp" : imageSrc}
                    alt={listing.title}
                    fill
                    onError={() => setImgError(true)}
                    className="object-cover transition-transform duration-300 group-hover/img:scale-105"
                  />
                ) : isPreview ? (
                  <div className="w-full h-full bg-slate-100 border border-dashed border-slate-300 p-2 flex flex-col items-center justify-center text-center select-none">
                    <Camera className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 leading-tight">No Photo Uploaded</span>
                  </div>
                ) : (
                  <div
                    onClick={handleRequestPhotoClick}
                    className={`w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-amber-400 p-2 flex flex-col items-center justify-center text-center select-none transition-all ${
                      photoRequestCount >= 3 || hasRequestedPhoto ? "opacity-85 cursor-default" : "hover:bg-slate-900 cursor-pointer active:scale-95"
                    }`}
                    title={photoRequestCount >= 3 ? "Photo requested by 3 members" : "Click to request seller to upload photo"}
                  >
                    <Camera className="w-5 h-5 text-amber-400 mb-1 opacity-85" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      {photoRequestCount >= 3 || hasRequestedPhoto
                        ? `Photo Requested (${photoRequestCount >= 3 ? 3 : photoRequestCount})`
                        : "Request Photo"}
                    </span>
                  </div>
                )}
                {/* +N Badge overlay on bottom-right of image */}
                {extraCount > 0 && (
                  <div className="absolute bottom-1.5 right-1.5 bg-slate-950/85 backdrop-blur-md text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-amber-400/40 shadow-md">
                    +{extraCount}
                  </div>
                )}
              </div>
            )}

            {/* RIGHT COLUMN: Category Badge (left) + Price (right) + Title (left) */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
              {/* Top Row: Category Name on Left, Price on Right */}
              <div className="flex items-center justify-between gap-2 w-full">
                <CategoryIcon category={listing.category || listing.type} />
                <div className="font-heading font-bold text-base sm:text-lg text-amber-600 tracking-tight shrink-0">
                  {formattedPrice}
                </div>
              </div>

              {/* Title: Max 2 lines with fixed min-height for uniform alignment */}
              <h3 className="font-sans font-semibold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug text-left mt-0.5 min-h-[2.5rem] flex items-center">
                {listing.title}
              </h3>
            </div>
          </div>

          {/* ── MIDDLE SECTION: Fixed 3-Line Internal Scrollable Description Box ── */}
          <div className="h-[4.5rem] bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl flex flex-col justify-start overflow-y-auto custom-scrollbar">
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed whitespace-pre-line">
              {listing.description || "No detailed description provided."}
            </p>
          </div>

          {/* ── ROW 3: Location on Left + 3 Icon Buttons on Right (Hidden in Preview) ── */}
          <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100/90 pt-2 mt-1 gap-2">
            {/* Location Tag */}
            <div className="flex items-center gap-1 text-xs text-slate-600 font-medium truncate">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{listing.location || "Medical College Rd, Thanjavur"}</span>
            </div>

            {/* 3 Square Action Icon Buttons (Save, Share, Report) - Hidden in Live Preview */}
            {!isPreview && (
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
            )}
          </div>
        </div>

        {/* ── FOOTER ROW: Date Ago (Left) + Buttons (Right) ── */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-1">
          {/* Left: Date Ago */}
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatRelativeTime(listing.created_at)}</span>
          </span>

          {/* Right: 2 Rectangular CTA Buttons (Exact w-[128px] each matching other segments) */}
          <div className="flex items-center gap-2 shrink-0 justify-end">
            {isOwnPost ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/listings");
                }}
                className="bg-[#0F172A] hover:bg-slate-900 text-white font-heading font-black text-xs sm:text-sm py-2.5 px-4.5 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] border border-slate-800 shadow-sm cursor-pointer transition-colors whitespace-nowrap active:scale-95"
              >
                <Pencil className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
                <span>Edit</span>
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
                  className={`w-[128px] shrink-0 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors whitespace-nowrap ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <MessageSquare className="w-4 h-4 text-[#0F172A] shrink-0 stroke-[2.5]" />
                  <span>Chat</span>
                </button>

                {(listing.show_phone !== false) && (
                  <a
                    href={isPreview ? "#" : callUrl}
                    onClick={(e) => { if (isPreview) e.preventDefault(); e.stopPropagation(); }}
                    className={`w-[128px] shrink-0 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors whitespace-nowrap ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <Phone className="w-4 h-4 text-white shrink-0" />
                    <span>Call</span>
                  </a>
                )}
              </>
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
