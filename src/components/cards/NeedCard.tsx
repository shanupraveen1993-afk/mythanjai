"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Calendar, MapPin, Share2, Bookmark, Pencil, Flag, Phone } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { formatIndianCurrencyText, formatRelativeTime } from "@/lib/constants";
import InAppChatModal from "@/components/chat/InAppChatModal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { reportListing } from "@/lib/moderation";

import CategoryVectorIllustration from "@/components/ui/CategoryVectorIllustration";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface NeedCardProps {
  post: NeedOrSalePost;
  onShare?: (post: NeedOrSalePost) => void;
  isPreview?: boolean;
}

export default function NeedCard({ post, onShare, isPreview = false }: NeedCardProps) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSold, setIsSold] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const isOwnPost = React.useMemo(() => {
    if (isPreview) return false;
    if (user?.uid && post.userId === user.uid) return true;
    if (profile?.phone && post.phone && profile.phone === post.phone) return true;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        if (stored.some((p: any) => p.id === post.id)) return true;
      } catch (e) {}
    }
    return false;
  }, [user, profile, post, isPreview]);

  const rawPhone = String(post.phone || "9876543210");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello! I saw your post "${post.title}" in ${post.area_tag} on Namma Thanjai!`
  )}`;

  const handleSharePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(post);
    } else if (navigator.share) {
      navigator.share({
        title: post.title,
        text: `Check out this listing "${post.title}" in ${post.area_tag}, Thanjavur on Namma Thanjai!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Post link copied to clipboard!");
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = reportListing(post.id, "Inappropriate content");
    if (result.isQuarantined) {
      toast.error("This post has been quarantined for moderation review.");
    } else {
      toast.success("Thank you! Post reported to admin for verification.");
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  const getCategoryIllustration = (category?: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("real estate") || cat.includes("plot") || cat.includes("house") || cat.includes("rental") || cat.includes("land") || cat.includes("property")) {
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

  const illustrationSrc = getCategoryIllustration(post.category);

  const displayPriceText = React.useMemo(() => {
    if (post.price === null || post.price === undefined || post.price === "") return "Budget Flexible";
    return formatIndianCurrencyText(post.price);
  }, [post.price]);

  const locationList = React.useMemo(() => {
    if (!post.area_tag) return ["Thanjavur"];
    const split = post.area_tag.split(",").map((l) => l.trim()).filter(Boolean);
    return split.length > 0 ? split.slice(0, 3) : ["Thanjavur"];
  }, [post.area_tag]);

  if (isDeleted) return null;

  return (
    <div className={`bg-white rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 border border-slate-200/90 relative font-sans h-full ${isSold ? "opacity-80" : ""}`}>
      <div className="flex flex-col gap-3 flex-1">

        {/* ── TOP HEADER BLOCK: Full-Width Title + Inline Category Badge + Budget ── */}
        <div className="flex flex-col gap-2 w-full">
          {/* Top Row: Category Badge + FULFILLED status + Budget */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <CategoryIcon category={post.category} />
              {isSold && (
                <span className="text-[10px] font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  FULFILLED
                </span>
              )}
            </div>
            <div className="font-heading font-black text-base sm:text-lg text-amber-600 tracking-tight shrink-0">
              {displayPriceText}
            </div>
          </div>

          {/* Title: 2-3 Lines max in clean font */}
          <h3 className="font-heading font-bold text-sm sm:text-base text-slate-800 line-clamp-2 leading-snug">
            {post.title}
          </h3>
        </div>

        {/* ── MIDDLE SECTION: Fixed Height Description Box ── */}
        <div className="min-h-[4.25rem] bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl flex items-center">
          <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3">
            {post.description || "No specific requirement details provided."}
          </p>
        </div>

        {/* ── ROW 3: Preferred Locations on Left + 3 Icon Buttons on Right ── */}
        <div className="flex items-center justify-between text-xs text-slate-600 border-t border-b border-slate-100 py-2 my-0.5 gap-2">
          {/* Preferred Locations Clean Text */}
          <div className="flex items-center gap-1 text-xs text-slate-600 font-medium truncate flex-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{locationList.join(" • ")}</span>
          </div>

          {/* 3 Square Action Icon Buttons (Save, Share, Report) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1st: Save */}
            <button
              type="button"
              onClick={handleToggleSave}
              className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                saved
                  ? "bg-amber-50 border-amber-300 text-amber-600"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
              }`}
              title={saved ? "Saved" : "Save Requirement"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-amber-600" : ""}`} />
            </button>

            {/* 2nd: Share */}
            <button
              type="button"
              onClick={handleSharePost}
              className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Share Requirement"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* 3rd: Report */}
            <button
              type="button"
              onClick={handleReport}
              className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Report Requirement"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ROW: Date Ago (Left) + 2 Rectangular Buttons (Right) ── */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        {/* Left: Date Ago */}
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatRelativeTime(post.created_at)}</span>
        </span>

        {/* Right: 2 Rectangular CTA Buttons (WhatsApp Green & Call Yellow) */}
        <div className="flex items-center gap-2 shrink-0">
          {isOwnPost ? (
            <Link
              href="/profile?tab=my_posts"
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[36px]"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </Link>
          ) : (
            <>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="bg-[#128C7E] text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1.5 min-h-[36px] shadow-2xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-white fill-current" />
                <span>WhatsApp</span>
              </a>

              <a
                href={callUrl}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1.5 min-h-[36px] shadow-2xs cursor-pointer transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-white" />
                <span>Call</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* In-App Chat Modal */}
      {isChatOpen && (
        <InAppChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          listingId={post.id}
          listingTitle={post.title}
          sellerId={post.userId || "seller_id"}
          sellerName="Buyer"
        />
      )}
    </div>
  );
}
