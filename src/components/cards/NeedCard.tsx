"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Calendar, Tag, MapPin, Share2, Eye, Bookmark, UserCheck } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { formatIndianCurrencyText, formatRelativeTime } from "@/lib/constants";
import InAppChatModal from "@/components/chat/InAppChatModal";
import { useAuth } from "@/hooks/use-auth";

interface NeedCardProps {
  post: NeedOrSalePost;
  onShare?: (post: NeedOrSalePost) => void;
  isPreview?: boolean;
}

export default function NeedCard({ post, onShare, isPreview = false }: NeedCardProps) {
  const { user, profile } = useAuth();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 relative group overflow-hidden font-sans border border-slate-200/80">
      
      {/* Top Header Tags */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {post.category && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{post.category}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{formatDate(post.created_at)}</span>
        </div>
      </div>

      {/* Main Title & Price */}
      <div className="flex flex-col gap-0.5">
        <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 leading-snug group-hover:text-slate-700 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {displayPriceText && (
          <div className="text-xs sm:text-sm font-bold text-emerald-600 tracking-tight">
            {displayPriceText}
          </div>
        )}
      </div>

      {/* YouTube Video Embed Preview */}
      {youtubeId && isPlayingVideo ? (
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
      ) : null}

      {/* Description Box */}
      {post.description && (
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {post.description}
          </p>
        </div>
      )}

      {/* Social Engagement Bar (Hidden in Live Preview Mode) */}
      {!isPreview && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-t border-b border-slate-100 py-2 my-0.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{viewsCount} Views</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSharePost}
              className="flex items-center gap-1 hover:text-slate-800 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{sharesCount} Shares</span>
            </button>
            <button 
              onClick={handleToggleSave}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${saved ? "text-yellow-600 font-bold" : "hover:text-slate-800"}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-yellow-500 text-yellow-600" : "text-slate-400"}`} />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Info & Action CTAs — MASKED PHONE & IN-APP CHAT */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[140px]">{post.area_tag}</span>
        </div>

        {/* Contact CTA */}
        <div className="flex items-center gap-2">
          {isOwnPost ? (
            <span className="flex items-center gap-1.5 h-9 bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3.5 rounded-xl text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Your Post</span>
            </span>
          ) : (
            <Link
              href={`/chat?listingId=${post.id}&sellerId=${post.userId || "seller_id"}&title=${encodeURIComponent(post.title || "Item")}`}
              className="flex items-center gap-1.5 h-9 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-3.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
              <span>In-App Chat</span>
            </Link>
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
