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

  const imageSrc =
    (listing.images && listing.images[0]) ||
    listing.image_url ||
    "/thanjavur_temple_illustration.png";

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
        className="bg-white -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full sm:rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 flex flex-col justify-between cursor-pointer font-sans group border-b border-slate-200/80 sm:border sm:border-slate-200/90 card-lift"
      >
        {/* Card Header Media Container (OLX Competitor Standard) */}
        <div className="w-full h-36 sm:h-40 bg-slate-100 relative overflow-hidden">
          <Image
            src={imageSrc}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Top Left: Location & Area Overlay Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
            <span className="bg-slate-950/80 backdrop-blur-xs text-white font-bold text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[120px]">{listing.location || "Thanjavur"}</span>
            </span>
          </div>

          {/* Top Right: Price / Budget Overlay Badge */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="bg-slate-950/85 backdrop-blur-xs text-white font-heading font-extrabold text-xs sm:text-sm px-3 py-1 rounded-full shadow-xs border border-slate-800 inline-block">
              {isLookingFor
                ? `₹${listing.expected_price_from || "5k"} - ₹${listing.expected_price_to || "15k"}`
                : listing.price || "₹2 Lakhs"}
            </span>
          </div>

          {/* Action Overlay Buttons: Save & Report */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={handleSaveToggle}
              className={`w-7 h-7 rounded-full border shadow-2xs flex items-center justify-center transition-all cursor-pointer ${
                isSaved
                  ? "bg-amber-500 text-slate-950 border-amber-400"
                  : "bg-slate-900/80 text-white border-slate-700 hover:bg-slate-900"
              }`}
              title={isSaved ? "Saved" : "Save Listing"}
              aria-label={isSaved ? "Remove saved listing" : "Save this listing"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleReportListing}
              className="w-7 h-7 rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-rose-400 hover:bg-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Report Listing"
              aria-label="Report this listing"
            >
              <Flag className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card Content Body (OLX Hierarchy) */}
        <div className="p-3.5 sm:p-4 flex flex-col gap-2 flex-1 justify-between">
          <div>
            {/* Category & Relative Time Row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md inline-block">
                {listing.category || listing.type || "Classified"}
              </span>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatRelativeTime(listing.created_at)}</span>
              </span>
            </div>

            {/* Item Title */}
            <h3 className="font-heading font-black text-sm text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {listing.title}
            </h3>

            {/* Key Specifications Line (OLX Metadata Pills) */}
            <div className="flex flex-wrap gap-1 my-1.5">
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                {listing.type === "sell" ? "Direct Sale" : listing.type === "service" ? "Doorstep Service" : "Local Tanjore"}
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                0% Brokerage
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Service Provider Availability Banner (Only for Service Listings) */}
          {isServiceListing && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className={`text-[11px] font-bold ${isAvailable ? "text-emerald-700" : "text-amber-700"}`}>
                  {isAvailable ? "Available Now (கிடைக்கிறார்)" : "Currently Busy (தற்சமயம் வர இயலாது)"}
                </span>
              </div>

              {/* Service Provider Only Toggle Control */}
              {isOwnPost && (
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer active:scale-95 ${
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

          {/* Footer Seller Info & Action Buttons */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-black text-[10px] flex items-center justify-center border border-amber-300">
                  {(listing.seller_name || "T")[0].toUpperCase()}
                </span>
                <span className="truncate max-w-[110px] text-slate-800 font-bold">{listing.seller_name || "Tanjore Local"}</span>
                <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </div>

              {/* Views counter */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px]">
                  <Eye className="w-3 h-3 text-slate-400" />
                  {views}
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1 text-[11px] hover:text-slate-700 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-3 h-3 text-slate-400" />
                  {shares}
                </button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2">
              {isOwnPost ? (
                <div className="w-full py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
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
                      className="btn btn-chat btn-sm flex-1 text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#78350F]" />
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
                      className="btn btn-call btn-sm flex-1 text-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-white" />
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
