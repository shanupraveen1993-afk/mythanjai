"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, ExternalLink, Sparkles, Video, Calendar, Clock } from "lucide-react";
import { OfferPost } from "@/types";

interface OfferCardProps {
  post: OfferPost & {
    video_url?: string;
    valid_from?: string;
    valid_to?: string;
    hours?: string;
  };
}

export default function OfferCard({ post }: OfferCardProps) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Format Offer Validity display
  const validityText = React.useMemo(() => {
    if (post.valid_from && post.valid_to) {
      return `Valid: ${post.valid_from} - ${post.valid_to}`;
    }
    if (post.valid_to) {
      return `Valid till ${post.valid_to}`;
    }
    if (post.hours && post.hours !== "Limited Offer") {
      return post.hours;
    }
    return "Special Local Offer";
  }, [post.valid_from, post.valid_to, post.hours]);

  return (
    <div className="group block bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col relative w-full font-sans">
      {/* Featured Badge Overlay */}
      {post.is_featured && (
        <div className="absolute top-2.5 left-2.5 z-20 bg-[#F9B637] text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xl flex items-center gap-1 shadow-md border border-amber-400">
          <Sparkles className="w-2.5 h-2.5 fill-current" />
          <span>Featured Offer</span>
        </div>
      )}

      {/* ── Media Container: Natural Vertical Reel (9:16) vs Standard Image ── */}
      {post.video_url ? (
        <div className="relative aspect-[9/16] max-h-[380px] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
          <video
            src={post.video_url}
            controls
            playsInline
            className="w-full h-full object-cover"
            poster={post.thumbnail_url || "/placeholder.webp"}
          />
          <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-[#F9B637] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg flex items-center gap-1 border border-amber-400/40">
            <Video className="w-3 h-3 text-[#F9B637]" />
            <span>Reel</span>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video w-full bg-slate-50 border-b border-slate-100 overflow-hidden">
          <Image
            src={post.thumbnail_url || "/placeholder.webp"}
            alt={post.title}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            priority={post.is_featured}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
          <span className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
            {post.category || "Offer"}
          </span>
        </div>
      )}

      {/* Details Box */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-extrabold text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
            {post.title}
          </h3>
        </div>

        {post.description && (
          <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
            {post.description}
          </p>
        )}

        {/* Offer Validity Date Badge */}
        <div className="flex items-center gap-1.5 bg-[#FFDD9C]/60 border border-amber-300/80 px-2.5 py-1 rounded-xl w-fit mt-0.5">
          <Clock className="w-3 h-3 text-slate-900 shrink-0" />
          <span className="text-[10.5px] font-black text-slate-900 uppercase tracking-wide">
            {validityText}
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate max-w-[120px]">{post.area_tag}</span>
          </div>

          <a
            href={post.social_link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-[#F9B637] hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs shadow-2xs border border-amber-400 transition-all active:scale-95 cursor-pointer"
          >
            <span>View Deal</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
