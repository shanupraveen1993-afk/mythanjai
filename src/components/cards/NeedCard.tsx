"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MessageSquare, Calendar, Tag, MapPin, Share2, Home, Cpu, Car, Eye, Bookmark } from "lucide-react";
import { NeedOrSalePost } from "@/types";

interface NeedCardProps {
  post: NeedOrSalePost;
  onShare?: (post: NeedOrSalePost) => void;
}

export default function NeedCard({ post, onShare }: NeedCardProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [saved, setSaved] = useState(false);
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

  // Format phone for WhatsApp link (must start with country code, e.g. 91)
  const rawPhone = String(post.phone || "9994837342");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hi, I saw your post "${post.title}" on Namma Thanjai (Area: ${post.area_tag}). Is it still available?`
  )}`;

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

  // Format creation date
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

  const getCategoryIllustration = (cat: string) => {
    switch (cat) {
      case "Property Rental": return <Home className="w-3 h-3 text-slate-500" />;
      case "Electronics": return <Cpu className="w-3 h-3 text-slate-500" />;
      case "Motor Vehicle": return <Car className="w-3 h-3 text-slate-500" />;
      default: return <Tag className="w-3 h-3 text-slate-500" />;
    }
  };

  const isNeedType = post.type?.toUpperCase() === "NEED";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3.5 transition-all active:scale-[0.99] hover:shadow-sm w-full">
      {/* Category & Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
              isNeedType
                ? "bg-slate-105 text-slate-800 border border-slate-200"
                : "bg-yellow-55 text-yellow-900 border border-yellow-250/50"
            }`}
          >
            {isNeedType ? "Looking For" : "Selling"}
          </span>
          <span className="bg-slate-50 text-slate-700 border border-slate-200/60 font-bold px-2 py-0.5 rounded-xl text-[9px] flex items-center gap-1">
            {getCategoryIllustration(post.category)}
            <span className="capitalize">{post.category}</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-300" />
          {formatDate(post.created_at)}
        </span>
      </div>

      {/* Title & Price */}
      <div>
        <h3 className="font-heading font-extrabold text-sm text-slate-800 leading-snug line-clamp-1 truncate">
          {post.title}
        </h3>
        {displayPriceText && (
          <div className="text-yellow-600 font-black text-sm mt-0.5">
            {displayPriceText}
          </div>
        )}
      </div>

      {/* YouTube Video Player */}
      {youtubeId && (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
          {isPlayingVideo ? (
            <div className="relative w-full h-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlayingVideo(false);
                }}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white px-2 py-0.5 rounded text-[9px] font-black cursor-pointer"
              >
                Close Video
              </button>
            </div>
          ) : (
            <div 
              onClick={() => setIsPlayingVideo(true)}
              className="relative w-full h-full cursor-pointer group"
            >
              <Image
                src={post.youtube_thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                alt="YouTube Video Thumbnail"
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-12 h-12 bg-red-650 rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-700 transition-colors">
                  <svg className="w-6 h-6 fill-white text-white stroke-none translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Photo Carousel Slider */}
      {!youtubeId && images.length > 0 && (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm group">
          <Image
            src={images[activeImgIndex]}
            alt={post.title}
            fill
            className="object-cover"
            unoptimized
          />
          
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex((prev) => (prev + 1) % images.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold"
              >
                ▶
              </button>
              
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {images.map((_: any, idx: number) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === activeImgIndex ? "bg-white w-3.5" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Description Body (Max 2 lines short) */}
      <p className="text-xs text-slate-500 font-sans leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 line-clamp-2">
        {post.description || post.raw_text}
      </p>

      {/* Facebook-Style Social Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold border-t border-b border-slate-100 py-2 my-0.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>{viewsCount} Views</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSharePost}
            className="flex items-center gap-1 hover:text-yellow-600 cursor-pointer transition-colors"
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

      {/* Footer Info & Action CTAs */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[120px]">{post.area_tag}</span>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
