"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Calendar, Tag, MapPin, Share2, Eye, Bookmark, UserCheck, Camera, MoreVertical, Trash2, Pencil, Flag, Sparkles, Phone } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { formatIndianCurrencyText, formatRelativeTime, getCategoryBadgeStyle } from "@/lib/constants";
import InAppChatModal from "@/components/chat/InAppChatModal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { reportListing } from "@/lib/moderation";

interface NeedCardProps {
  post: NeedOrSalePost;
  onShare?: (post: NeedOrSalePost) => void;
  isPreview?: boolean;
}

export default function NeedCard({ post, onShare, isPreview = false }: NeedCardProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const youtubeId = React.useMemo(() => {
    if (!post.youtube_url || typeof post.youtube_url !== "string") return null;
    const match = post.youtube_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  }, [post.youtube_url]);

  const images = React.useMemo(() => {
    if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
      return post.image_urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
    }
    if (typeof post.image_url === "string" && post.image_url.trim().length > 0) {
      return [post.image_url];
    }
    return [];
  }, [post.image_urls, post.image_url]);

  const displayPriceText = React.useMemo(() => {
    if (post.price === null || post.price === undefined || post.price === "") return null;
    return formatIndianCurrencyText(post.price);
  }, [post.price]);

  const [isSold, setIsSold] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Dynamic View & Share state stored in localStorage per card
  const [viewsCount] = useState(() => {
    if (typeof window === "undefined") return 150;
    const stored = localStorage.getItem(`views_need_${post.id}`);
    if (stored) return parseInt(stored, 10);
    const initial = Math.floor(150 + (post.title?.length || 5) * 14 + Math.random() * 20);
    localStorage.setItem(`views_need_${post.id}`, String(initial));
    return initial;
  });

  const [sharesCount, setSharesCount] = useState(() => {
    if (typeof window === "undefined") return 22;
    const stored = localStorage.getItem(`shares_need_${post.id}`);
    if (stored) return parseInt(stored, 10);
    return Math.floor(22 + (post.title?.length || 5) * 2);
  });

  const isValidSellerId = Boolean(
    post.userId && post.userId !== "seller_id" && post.userId !== "preview_user"
  );

  const rawPhone = String(post.phone || "9876543210");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello! I saw your post "${post.title}" in ${post.area_tag} on Namma Thanjai!`
  )}`;
  const whatsappGroupShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `📌 *${post.title}* in ${post.area_tag}, Thanjavur:\nCheck out this listing on Namma Thanjai!`
  )}`;

  const handleMarkSold = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSold(!isSold);
    toast.success(isSold ? "Listing marked active!" : "Listing marked as SOLD!");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        const updated = stored.filter((p: any) => p.id !== post.id);
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(updated));
      } catch (err) {}
    }
    setIsDeleted(true);
    toast.success("Post deleted successfully.");
  };

  const handleSharePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedShares = sharesCount + 1;
    setSharesCount(updatedShares);
    if (typeof window !== "undefined") {
      localStorage.setItem(`shares_need_${post.id}`, String(updatedShares));
    }
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

  const formatDate = (timestamp: any) => formatRelativeTime(timestamp);
  const isNeedType = post.type?.toUpperCase() === "NEED";

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

  const illustrationSrc = post.image_url || getCategoryIllustration(post.category);

  if (isDeleted) return null;

  return (
    <div
      className={`bg-white rounded-xl p-4 flex flex-col justify-between shadow-2xs border border-slate-200/90 transition-all duration-200 relative group overflow-hidden font-sans h-full min-h-[380px] sm:min-h-[400px] ${
        isSold ? "opacity-80" : ""
      }`}
    >
        {/* Top Category Vector Illustration Image Container */}
        <div className="w-full h-36 sm:h-40 bg-slate-100 relative overflow-hidden rounded-t-xl -mt-4 -mx-4 mb-1 border-b border-slate-200/70" style={{ width: "calc(100% + 2rem)" }}>
          <Image
            src={illustrationSrc}
            alt={post.title}
            fill
            className="object-cover"
          />

          {/* SOLD / FULFILLED Overlay Banner */}
          {isSold && (
            <div className="absolute top-2.5 left-2.5 z-10 bg-slate-950 text-amber-400 text-xs font-black uppercase px-3 py-1 rounded-md flex items-center gap-1 shadow-md">
              {t("markedSold")}
            </div>
          )}

          {/* Top Left: Category Badge Overlay (OLX Standard Clean Dark Glassmorphism) */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-slate-950/40 backdrop-blur-md text-white font-semibold text-[11px] px-2.5 py-1 rounded-md border border-white/20 shadow-2xs">
              {post.category || "Requirement"}
            </span>
          </div>

          {/* Top Right: Vertical Stack of 3 Action Buttons (1st: Flag, 2nd: Save, 3rd: Share) */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
            {/* 1st: Flag / Report */}
            <button
              type="button"
              onClick={handleReport}
              className="w-7 h-7 rounded-md border border-white/20 bg-slate-950/40 text-white hover:text-rose-400 hover:bg-slate-950/70 flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-md"
              title="Report Requirement"
              aria-label="Report this requirement"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            {/* 2nd: Save / Bookmark */}
            <button
              type="button"
              onClick={handleToggleSave}
              className={`w-7 h-7 rounded-md border backdrop-blur-md shadow-2xs flex items-center justify-center transition-all cursor-pointer ${
                saved
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                  : "bg-slate-950/40 text-white border-white/20 hover:bg-slate-950/70"
              }`}
              title={saved ? "Saved" : "Save Requirement"}
              aria-label={saved ? "Remove saved requirement" : "Save this requirement"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} />
            </button>

            {/* 3rd: Share */}
            <button
              type="button"
              onClick={handleSharePost}
              className="w-7 h-7 rounded-md border border-white/20 bg-slate-950/40 text-white hover:bg-slate-950/70 flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-md"
              title="Share Requirement"
              aria-label="Share this requirement"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Content Body (Human-Centric Hierarchy) */}
        <div className="flex flex-col gap-2 flex-1 justify-between">
          <div className="flex flex-col gap-1.5">
            {/* 1st Line: Budget / Price in Amber Yellow */}
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-base sm:text-lg text-amber-600">
                {displayPriceText || "Budget: Negotiable"}
              </span>
            </div>

            {/* 2nd Line: Requirement Title */}
            <h3 className="font-heading font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
              {post.title}
            </h3>

            {/* Requirement Description */}
            {post.description && (
              <p className="text-xs text-slate-600 font-normal line-clamp-3 leading-relaxed">
                {post.description}
              </p>
            )}

            {/* Standardized Location Tag */}
            <div className="flex items-center text-slate-600 text-xs font-normal gap-1 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{post.area_tag || "Medical College Rd, Thanjavur"}</span>
            </div>
          </div>

          {/* Card Footer Bar: Left = Relative Posted Date (Bottom-aligned), Right = 2 Larger Action Buttons (Chat & Call) */}
          <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2 mt-auto">
            {/* Left Side: Relative Posted Date (Bottom Aligned) */}
            <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1 shrink-0 pb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(post.created_at)}</span>
            </span>

            {/* Right Side: 2 Larger Action Buttons (Chat #128C7E + Yellow Call) */}
            <div className="flex items-center gap-2 shrink-0">
              {isOwnPost ? (
                <Link
                  href="/profile?tab=my_posts"
                  className="px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[38px]"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                  <span>Edit</span>
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsChatOpen(true);
                    }}
                    className="bg-[#128C7E] text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 min-h-[38px] shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-white fill-current" />
                    <span>Chat</span>
                  </button>

                  <a
                    href={callUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#f59e0b] text-slate-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 min-h-[38px] shadow-2xs cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-slate-950" />
                    <span>Call</span>
                  </a>
                </>
              )}
            </div>
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
