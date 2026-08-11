"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MessageSquare, Calendar, Tag, MapPin, Share2, Home, Cpu, Car, Eye, Bookmark, ShieldCheck, Lock } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import InAppChatModal from "@/components/chat/InAppChatModal";

interface NeedCardProps {
  post: NeedOrSalePost;
  onShare?: (post: NeedOrSalePost) => void;
}

export default function NeedCard({ post, onShare }: NeedCardProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    const num = Number(post.price);
    if (!isNaN(num)) {
      return `₹${num.toLocaleString("en-IN")}`;
    }
    return String(post.price);
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = typeof timestamp?.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
      }
    } catch (e) {
      // Fallback
    }
    return "Just now";
  };

  const isNeedType = post.type?.toUpperCase() === "NEED";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xs hover:shadow-md transition-all duration-300 relative group overflow-hidden font-sans">
      
      {/* Top Header Tags */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider ${
              isNeedType
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-amber-100 text-amber-900 border border-amber-200"
            }`}
          >
            {isNeedType ? "BUYING NEED" : "SELLING"}
          </span>

          {post.category && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
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
      <div className="flex flex-col gap-1">
        <h3 className="font-heading font-black text-base text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
          {post.title}
        </h3>

        {displayPriceText && (
          <div className="text-sm font-black text-emerald-600 tracking-tight">
            {displayPriceText}
          </div>
        )}
      </div>

      {/* YouTube Video Embed Preview */}
      {youtubeId && isPlayingVideo ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={post.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : images.length > 0 ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
          <Image
            src={images[activeImgIndex] || "/thanjavur_temple_illustration.png"}
            alt={post.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      {/* Description Body */}
      {post.description && (
        <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          {post.description}
        </p>
      )}

      {/* Facebook-Style Social Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold border-t border-b border-slate-100 py-2 my-0.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>{viewsCount} Views</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSharePost}
            className="flex items-center gap-1 hover:text-amber-600 cursor-pointer transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{sharesCount} Shares</span>
          </button>
          <button 
            onClick={handleToggleSave}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${saved ? "text-amber-600 font-extrabold" : "hover:text-amber-600"}`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Footer Info & Action CTAs — MASKED PHONE & IN-APP CHAT */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[110px]">{post.area_tag}</span>
        </div>

        {/* Contact Masking Notice & Chat CTA */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Protected Contact</span>
          </div>
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-yellow-400" />
            <span>In-App Chat</span>
          </button>
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
