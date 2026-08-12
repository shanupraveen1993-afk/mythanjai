"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Calendar, Tag, MapPin, Share2, Eye, Bookmark, UserCheck, Maximize2 } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { formatIndianCurrencyText, formatRelativeTime } from "@/lib/constants";
import InAppChatModal from "@/components/chat/InAppChatModal";
import ImageLightboxModal from "@/components/modals/ImageLightboxModal";
import { useAuth } from "@/hooks/use-auth";

interface NeedCardProps {
  post: NeedOrSalePost;
  onShare?: (post: NeedOrSalePost) => void;
  isPreview?: boolean;
}

export default function NeedCard({ post, onShare, isPreview = false }: NeedCardProps) {
  const { user, profile } = useAuth();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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

  const viewsCount = Math.floor(150 + (post.title?.length || 5) * 14);
  const sharesCount = Math.floor(22 + (post.title?.length || 5) * 2);

  const displayPriceText = React.useMemo(() => {
    if (post.price === null || post.price === undefined || post.price === "") return null;
    return formatIndianCurrencyText(post.price);
  }, [post.price]);

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
      alert("Post link copied to clipboard!");
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  const formatDate = (timestamp: any) => formatRelativeTime(timestamp);
  const isNeedType = post.type?.toUpperCase() === "NEED";

  return (
    <div className="bg-white -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 relative group overflow-hidden font-sans border-b border-slate-200/80 sm:border sm:border-slate-200/90 flex flex-row items-stretch">
      
      {/* LEFT COLUMN: Fixed Media Box + Lightbox Trigger + Image Scroll */}
      <div className="w-28 sm:w-36 shrink-0 relative bg-slate-100 overflow-hidden flex flex-col group/img cursor-pointer border-r border-slate-100">
        {youtubeId ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={post.title}
              className="w-full h-full border-0 pointer-events-none"
            />
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="absolute inset-0 bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
            >
              <Maximize2 className="w-5 h-5 text-white shadow-md" />
            </div>
          </div>
        ) : images.length > 0 ? (
          <div
            onClick={() => setIsLightboxOpen(true)}
            className="w-full h-full relative overflow-hidden flex snap-x snap-mandatory scrollbar-none"
          >
            <Image
              src={images[activeImgIndex] || "/thanjavur_temple_illustration.png"}
              alt={post.title}
              fill
              className="object-cover group-hover/img:scale-105 transition-transform duration-300"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-top justify-end p-1.5">
              <span className="bg-black/50 text-white p-1 rounded-md text-[9px] flex items-center gap-0.5 backdrop-blur-xs">
                <Maximize2 className="w-3 h-3" />
                {images.length > 1 && <span>{images.length}</span>}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center p-2 text-center text-slate-400 text-[10px] font-semibold">
            Namma Thanjai
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Compact Content Details */}
      <div className="flex-1 p-3.5 flex flex-col justify-between gap-2 min-w-0">
        
        {/* Header: Category Tag & Date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {post.category && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                <span className="truncate max-w-[90px]">{post.category}</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(post.created_at)}
          </span>
        </div>

        {/* Title & Price */}
        <div className="flex flex-col gap-0.5">
          <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-1 truncate">
            {post.title}
          </h3>
          {displayPriceText && (
            <div className="text-xs font-black text-emerald-600 tracking-tight">
              {displayPriceText}
            </div>
          )}
        </div>

        {/* Description Snippet with Inline Read More Expander */}
        {post.description && (
          <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-lg">
            <p className={`text-[11px] text-slate-700 font-medium leading-normal ${isDescExpanded ? "" : "line-clamp-2"}`}>
              {post.description}
            </p>
            {post.description.length > 80 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 mt-0.5 cursor-pointer"
              >
                {isDescExpanded ? "Show Less" : "...Read More"}
              </button>
            )}
          </div>
        )}

        {/* Social Bar & Location */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-[120px]">{post.area_tag}</span>
          </div>

          {!isPreview && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1 text-slate-400 text-[9px]">
                <Eye className="w-3 h-3 text-slate-400" />
                {viewsCount}
              </span>
              <button 
                onClick={handleSharePost}
                className="flex items-center gap-1 hover:text-slate-800 cursor-pointer transition-colors text-[9px]"
              >
                <Share2 className="w-3 h-3 text-slate-400" />
                <span>{sharesCount}</span>
              </button>
              <button 
                onClick={handleToggleSave}
                className={`flex items-center gap-1 cursor-pointer transition-colors text-[9px] ${saved ? "text-yellow-600 font-bold" : "hover:text-slate-800"}`}
              >
                <Bookmark className={`w-3 h-3 ${saved ? "fill-yellow-500 text-yellow-600" : "text-slate-400"}`} />
                <span>{saved ? "Saved" : "Save"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom CTA Action Bar */}
        <div className="pt-0.5 flex justify-end">
          {isOwnPost ? (
            <span className="flex items-center gap-1 h-7 bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2.5 rounded-lg text-[10px]">
              <UserCheck className="w-3 h-3 text-slate-500" />
              <span>Your Post</span>
            </span>
          ) : (
            <Link
              href={`/chat?listingId=${post.id}&sellerId=${post.userId || "seller_id"}&title=${encodeURIComponent(post.title || "Item")}`}
              className="flex items-center gap-1 h-7 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-3 rounded-lg text-[10px] transition-all shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-3 h-3 fill-white stroke-none" />
              <span>In-App Chat</span>
            </Link>
          )}
        </div>
      </div>

      {/* Full Screen Image Lightbox Modal */}
      {isLightboxOpen && images.length > 0 && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          images={images}
          initialIndex={activeImgIndex}
          title={post.title}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

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
