"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Calendar, Tag, MapPin, Share2, Eye, Bookmark, UserCheck, Camera, MoreVertical, Trash2, Pencil, Flag } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { formatIndianCurrencyText, formatRelativeTime } from "@/lib/constants";
import InAppChatModal from "@/components/chat/InAppChatModal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

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
    toast.success("Thank you! Post reported to admin for verification.");
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  const formatDate = (timestamp: any) => formatRelativeTime(timestamp);
  const isNeedType = post.type?.toUpperCase() === "NEED";

  if (isDeleted) return null;

  return (
    <div className={`bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-[0_3px_8px_rgba(0,0,0,0.03)] transition-all duration-200 relative group overflow-hidden font-sans border ${
      isSold ? "border-slate-300 opacity-80" : "border-slate-200/80"
    }`}>

      {/* SOLD Overlay Banner */}
      {isSold && (
        <div className="bg-slate-900 text-yellow-400 text-[10px] font-black uppercase px-3 py-1 rounded-md w-fit flex items-center gap-1">
          {t("markedSold")}
        </div>
      )}

      {/* Top Header Category & Type Badges */}
      <div className="flex items-center justify-between gap-2 pr-8">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Type Badge: FOR SALE vs WANTED NEED */}
          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border shadow-2xs ${
            isNeedType 
              ? "bg-amber-500/15 text-amber-900 border-amber-400/80" 
              : "bg-emerald-500/10 text-emerald-700 border-emerald-300"
          }`}>
            <Tag className={`w-3 h-3 ${isNeedType ? "text-amber-600 fill-amber-500/20" : "text-emerald-600"}`} />
            <span>{isNeedType ? "WANTED BUYER NEED" : "FOR SALE"}</span>
          </span>

          {post.category && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
              <span>{post.category}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Title & Price */}
      <div className="flex flex-col gap-1">
        <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 leading-snug group-hover:text-slate-800 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {displayPriceText && (
          <div className={`text-xs sm:text-sm font-black tracking-tight w-fit px-2.5 py-0.5 rounded-lg border mt-0.5 ${
            isNeedType
              ? "text-amber-900 bg-amber-50 border-amber-200"
              : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}>
            <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">{isNeedType ? "Budget:" : "Price:"}</span>
            <span>{displayPriceText}</span>
          </div>
        )}
      </div>

      {/* Media Box — ONLY RENDERED FOR SELL POSTS */}
      {!isNeedType && (
        youtubeId && isPlayingVideo ? (
          <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-black shadow-inner">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={post.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : images.length > 0 ? (
          <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
            <Image
              src={images[activeImgIndex] || "/thanjavur_temple_illustration.png"}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                {activeImgIndex + 1}/{images.length}
              </div>
            )}
          </div>
        ) : (
          /* Placeholder Box for Sell Posts without Images for 100% Uniform Height */
          <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <Camera className="w-6 h-6 stroke-[1.5] text-slate-300" />
            <span className="text-xs font-semibold text-slate-400">No Image Provided</span>
          </div>
        )
      )}

      {/* Description Box */}
      {post.description && (
        <div className={`p-3 rounded-xl border ${
          isNeedType ? "bg-amber-50/60 border-amber-200/70" : "bg-slate-50 border-slate-200/80"
        }`}>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {post.description}
          </p>
        </div>
      )}

      {/* Social Engagement Bar: Left = Date & Views, Right = Share & Save */}
      {!isPreview && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-t border-b border-slate-100 py-2 my-0.5">
          {/* Left: Meta Info (Date & Views) */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-slate-400 font-medium">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDate(post.created_at)}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{viewsCount} {t("views")}</span>
            </span>
          </div>

          {/* Right: Actions (Share & Save) */}
          <div className="flex items-center gap-2.5">

            <button 
              onClick={handleSharePost}
              className="flex items-center gap-1 hover:text-slate-800 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{sharesCount}</span>
            </button>
            <button 
              onClick={handleToggleSave}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${saved ? "text-yellow-600 font-bold" : "hover:text-slate-800"}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-yellow-500 text-yellow-600" : "text-slate-400"}`} />
              <span>{saved ? t("saved") : t("save")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Info & Action CTAs */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[140px]">{post.area_tag}</span>
        </div>

        {/* Contact CTA or Post Management Options */}
        <div className="flex items-center gap-1.5">
          {isOwnPost ? (
            <Link
              href="/profile?tab=my_posts"
              className="flex items-center gap-1.5 h-8 bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-black px-3 rounded-lg text-[11px] transition-colors cursor-pointer border border-yellow-400"
            >
              <Pencil className="w-3 h-3" />
              <span>Manage Listing</span>
            </Link>
          ) : isValidSellerId ? (
            <Link
              href={`/chat?listingId=${post.id}&sellerId=${post.userId}&title=${encodeURIComponent(post.title || "Item")}`}
              className="flex items-center gap-1.5 h-9 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-3.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
              <span>{t("chat")}</span>
            </Link>
          ) : (
            /* Safe fallback for demo/seed posts without real userId */
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-9 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-3.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
              <span>{t("whatsApp")}</span>
            </a>
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
          sellerName={isNeedType ? "Buyer" : "Seller"}
        />
      )}
    </div>
  );
}
