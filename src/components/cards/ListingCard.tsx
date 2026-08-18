"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, Share2, Bookmark, Phone, MessageSquare, MapPin, UserCheck, Calendar, Sparkles, Flag } from "lucide-react";
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { formatRelativeTime } from "@/lib/constants";
import InAppChatModal from "@/components/chat/InAppChatModal";
import { reportListing } from "@/lib/moderation";
import { useToast } from "@/context/ToastContext";

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

export default function ListingCard({ listing }: { listing: ListingItem }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(
    user?.uid && listing.saved_by ? listing.saved_by.includes(user.uid) : false
  );
  const [views, setViews] = useState(listing.views_count || 12);
  const [shares, setShares] = useState(listing.shares_count || 3);

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

  // Increment views count on card interaction
  const handleCardView = async () => {
    setViews((prev) => prev + 1);
    try {
      const listingRef = doc(db, "classifieds", listing.id);
      await updateDoc(listingRef, { views_count: increment(1) });
    } catch (e) {
      // Silent catch
    }
  };

  // Share action with share count increment
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShares((prev) => prev + 1);
    const shareData = {
      title: listing.title,
      text: `${listing.title} on Namma Thanjavur`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
      const listingRef = doc(db, "classifieds", listing.id);
      await updateDoc(listingRef, { shares_count: increment(1) });
    } catch (e) {
      // Silent catch
    }
  };

  // Toggle Save / Bookmark
  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save listings.");
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);

    try {
      const listingRef = doc(db, "classifieds", listing.id);
      await updateDoc(listingRef, {
        saved_by: nextState ? arrayUnion(user.uid) : arrayRemove(user.uid),
      });
    } catch (e) {
      // Silent catch
    }
  };

  // Report Listing trigger
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
    const cat = (category || "").toLowerCase();
    if (cat.includes("real estate") || cat.includes("plot") || cat.includes("house") || cat.includes("land") || cat.includes("property")) {
      return "/hero_building_visual.png";
    }
    if (cat.includes("vehicle") || cat.includes("car") || cat.includes("bike") || cat.includes("scooter") || cat.includes("auto")) {
      return "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop";
    }
    if (cat.includes("electronic") || cat.includes("mobile") || cat.includes("laptop") || cat.includes("tv") || cat.includes("phone")) {
      return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop";
    }
    if (cat.includes("household") || cat.includes("furniture") || cat.includes("appliance") || cat.includes("home")) {
      return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop";
    }
    if (cat.includes("fashion") || cat.includes("cloth") || cat.includes("dress") || cat.includes("wear")) {
      return "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop";
    }
    return "/thanjavur_temple_illustration.png";
  };

  const categoryFallback = getCategoryIllustration(listing.category || listing.type);
  const imageSrc =
    (listing.images && listing.images[0]) ||
    (listing.image_url && listing.image_url !== "/thanjavur_temple_illustration.png" ? listing.image_url : null) ||
    categoryFallback;

  const isLookingFor = listing.type === "looking_for" || listing.expected_price_from;

  // Service Provider Availability State (Only for service listing type)
  const isServiceListing = listing.type === "service";
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  // Toggle Service Availability (Only for own service listing)
  const handleToggleAvailability = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`namma_thanjai_service_avail_${listing.id}`, String(nextState));
      } catch (err) {}
    }
  };

  return (
    <>
      <div 
        onClick={handleCardView}
        className="bg-white -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full sm:rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col justify-between cursor-pointer font-sans border-b border-slate-200/80 sm:border sm:border-slate-200/90"
      >
        {/* Card Header Media Container (OLX Competitor Standard) */}
        <div className="w-full h-36 sm:h-40 bg-slate-100 relative overflow-hidden">
          <Image
            src={imageSrc}
            alt={listing.title}
            fill
            className="object-cover"
          />
          
          {/* Top Left: Category Badge Overlay (Semi-Transparent Glass) */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-slate-950/40 backdrop-blur-md text-white font-extrabold text-[11px] px-2.5 py-1 rounded-md border border-white/20 shadow-2xs">
              {listing.category || listing.type || "Classified"}
            </span>
          </div>

          {/* Top Right: Vertical 3 Action Buttons Stack (1st: Flag, 2nd: Save, 3rd: Share) */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
            {/* 1st: Flag / Report */}
            <button
              type="button"
              onClick={handleReportListing}
              className="w-7 h-7 rounded-md border border-white/20 bg-slate-950/40 text-white hover:text-rose-400 hover:bg-slate-950/70 flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-md"
              title="Report Listing"
              aria-label="Report this listing"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            {/* 2nd: Save / Bookmark */}
            <button
              type="button"
              onClick={handleSaveToggle}
              className={`w-7 h-7 rounded-md border backdrop-blur-md shadow-2xs flex items-center justify-center transition-all cursor-pointer ${
                isSaved
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                  : "bg-slate-950/40 text-white border-white/20 hover:bg-slate-950/70"
              }`}
              title={isSaved ? "Saved" : "Save Listing"}
              aria-label={isSaved ? "Remove saved listing" : "Save this listing"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
            </button>

            {/* 3rd: Share */}
            <button
              type="button"
              onClick={handleShare}
              className="w-7 h-7 rounded-md border border-white/20 bg-slate-950/40 text-white hover:bg-slate-950/70 flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-md"
              title="Share Listing"
              aria-label="Share this listing"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Content Body (Human-Centric Hierarchy) */}
        <div className="p-3.5 sm:p-4 flex flex-col gap-2 flex-1 justify-between">
          <div className="flex flex-col gap-1.5">
            {/* 1st Line Below Image: Price in Amber Yellow */}
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-base sm:text-lg text-amber-600">
                {isLookingFor
                  ? `₹${listing.expected_price_from || "5k"} - ₹${listing.expected_price_to || "15k"}`
                  : (() => {
                      if (!listing.price) return "₹2,50,000";
                      const str = String(listing.price).replace(/[^0-9.]/g, "");
                      const num = Number(str);
                      if (isNaN(num) || num === 0) return String(listing.price).startsWith("₹") ? listing.price : `₹${listing.price}`;
                      return `₹${num.toLocaleString("en-IN")}`;
                    })()}
              </span>
            </div>

            {/* 2nd Line: Item Title */}
            <h3 className="font-heading font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {listing.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
              {listing.description}
            </p>

            {/* Standardized Location Tag */}
            <div className="flex items-center text-slate-600 text-xs font-normal gap-1 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{listing.location || "Medical College Rd, Thanjavur"}</span>
            </div>
          </div>

          {/* Service Provider Availability Banner (Only for Service Listings) */}
          {isServiceListing && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className={`text-[11px] font-medium ${isAvailable ? "text-emerald-700" : "text-amber-700"}`}>
                  {isAvailable ? "Available Now (கிடைக்கிறார்)" : "Currently Busy (தற்சமயம் வர இயலாது)"}
                </span>
              </div>

              {/* Service Provider Only Toggle Control */}
              {isOwnPost && (
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer active:scale-95 ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  }`}
                  title="Toggle Your Service Availability"
                >
                  {isAvailable ? "Set to Busy" : "Set to Available"}
                </button>
              )}
            </div>
          )}

          {/* Card Footer Bar: Left = Relative Posted Date (Bottom-aligned), Right = 2 Larger Action Buttons (Chat & Call) */}
          <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2 mt-auto">
            {/* Left Side: Relative Posted Date (Bottom Aligned) */}
            <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1 shrink-0 pb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatRelativeTime(listing.created_at)}</span>
            </span>

            {/* Right Side: 2 Larger Action Buttons (Chat #128C7E + Yellow Call) */}
            <div className="flex items-center gap-2 shrink-0">
              {isOwnPost ? (
                <div className="px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[38px]">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Your Listing</span>
                </div>
              ) : (
                <>
                  {!isLookingFor && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isServiceListing && !isAvailable) {
                          toast.info("This provider is currently busy. Leave a message in chat.");
                        }
                        setIsChatOpen(true);
                      }}
                      className="bg-[#128C7E] text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 min-h-[38px] shadow-2xs cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-white fill-current" />
                      <span>Chat</span>
                    </button>
                  )}

                  {(listing.show_phone !== false) && (
                    <a
                      href={`tel:${listing.phone || "919994837342"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isServiceListing && !isAvailable) {
                          toast.info("This provider is currently busy/unavailable.");
                        }
                      }}
                      className="bg-[#f59e0b] text-slate-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 min-h-[38px] shadow-2xs cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-slate-950" />
                      <span>Call</span>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* In-App Chat Modal for Sell Items */}
      <InAppChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        listingId={listing.id}
        listingTitle={listing.title}
        sellerId={listing.seller_id || "seller_default"}
        sellerName={listing.seller_name || "Seller"}
      />
    </>
  );
}
