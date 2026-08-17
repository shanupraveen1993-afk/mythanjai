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
        alert("Listing link copied to clipboard!");
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
      alert("Please sign in to save listings.");
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
      alert("This post has received multiple flags and has been sent for moderation review.");
    } else {
      alert("Thank you! Listing reported to admin for verification.");
    }
  };

  const imageSrc =
    (listing.images && listing.images[0]) ||
    listing.image_url ||
    "/thanjavur_temple_illustration.png";

  const isLookingFor = listing.type === "looking_for" || listing.expected_price_from;

  return (
    <>
      <div 
        onClick={handleCardView}
        className="bg-white -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full sm:rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 flex flex-col justify-between cursor-pointer font-sans group border-b border-slate-200/80 sm:border sm:border-slate-200/90 card-lift"
      >
        {/* Card Header Media Container */}
        <div className="w-full h-32 sm:h-36 bg-slate-100 relative overflow-hidden">
          <Image
            src={imageSrc}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Category & Relative Date Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="bg-slate-950/80 backdrop-blur-xs text-white font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-md">
              {listing.category || listing.type || "Classified"}
            </span>
            <span className="bg-slate-950/80 backdrop-blur-xs text-slate-200 font-medium text-xs px-2 py-1 rounded-md flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5 text-slate-300" />
              <span>{formatRelativeTime(listing.created_at)}</span>
            </span>
          </div>

          {/* Action Overlay Buttons: Save & Report */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <button
              onClick={handleSaveToggle}
              className={`w-8 h-8 rounded-full border shadow-xs flex items-center justify-center transition-all cursor-pointer ${
                isSaved
                  ? "bg-amber-500 text-slate-950 border-amber-400"
                  : "bg-white/90 text-slate-700 border-slate-200 hover:bg-white"
              }`}
              title={isSaved ? "Saved" : "Save Listing"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleReportListing}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white/90 text-slate-500 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Report Listing"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
          <div>
            {/* Price Row */}
            <div className="flex justify-between items-center mb-1">
              <span className="font-heading font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                {isLookingFor
                  ? `₹${listing.expected_price_from || "5,000"} - ₹${listing.expected_price_to || "15,000"}`
                  : listing.price || "₹2 Lakhs"}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-heading font-extrabold text-sm text-slate-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {listing.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-500 font-semibold line-clamp-2 mt-1 leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Footer Metadata & Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate max-w-[120px]">{listing.location || "Thanjavur District"}</span>
              </div>

              {/* Views & Shares counters */}
              <div className="flex items-center gap-3">
                {views < 15 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                    <span>New</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    {views} views
                  </span>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 hover:text-slate-700 transition-colors"
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
                      onClick={(e) => {
                        e.stopPropagation();
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
                      onClick={(e) => e.stopPropagation()}
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
