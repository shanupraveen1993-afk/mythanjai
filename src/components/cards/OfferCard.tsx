"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, ExternalLink, Sparkles, Video, Calendar, Clock, Flag } from "lucide-react";
import { OfferPost } from "@/types";
import { reportListing } from "@/lib/moderation";
import { useToast } from "@/context/ToastContext";

interface OfferCardProps {
  post: OfferPost & {
    video_url?: string;
    valid_from?: string;
    valid_to?: string;
    hours?: string;
  };
}

export default function OfferCard({ post }: OfferCardProps) {
  const { toast } = useToast();
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const handleReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await reportListing(post.id, "offers", "Inappropriate offer content");
    if (res.success) {
      toast.success("Thank you! Offer reported to admin for verification.");
    } else {
      toast.error("Could not submit report. Please try again.");
    }
  };

  const validityText = React.useMemo(() => {
    if (post.valid_from && post.valid_to) {
      return `Valid: ${post.valid_from} - ${post.valid_to}`;
    }
    if (post.valid_to) {
      return `Valid till ${post.valid_to}`;
    }
    if (post.hours && !post.hours.toLowerCase().includes("limited")) {
      return post.hours;
    }
    return "Valid: Aug 18 - Sep 18";
  }, [post.valid_from, post.valid_to, post.hours]);

  return (
    <div className="group block bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col relative w-full font-sans">
      {/* Featured Badge Overlay */}
      {post.is_featured && (
        <div className="absolute top-2.5 left-2.5 z-20 bg-[#FBBF24] text-[#0F172A] text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-xl flex items-center gap-1 shadow-md border-b border-[#D97706]">
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
            preload="metadata"
            crossOrigin="anonymous"
            onError={(e) => {
              const videoEl = e.currentTarget;
              videoEl.style.display = "none";
            }}
            className="w-full h-full object-cover"
            poster={post.thumbnail_url || "/placeholder.webp"}
          />
          <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-[#F9B637] text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-lg flex items-center gap-1 border border-amber-400/40">
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
          <span className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
            {post.category || "Offer"}
          </span>
        </div>
      )}

      {/* Details Box */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans font-bold text-base sm:text-lg text-slate-900 leading-snug truncate line-clamp-1 whitespace-nowrap">
            {post.title}
          </h3>
        </div>

        {post.description && (
          <p className="text-sm text-slate-700 font-medium line-clamp-3 leading-relaxed">
            {post.description}
          </p>
        )}

        {/* Offer Validity Date Badge */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg w-fit mt-0.5">
          <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            {validityText}
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate max-w-[100px]">{post.area_tag}</span>
            </span>
            <button
              onClick={handleReport}
              className="text-slate-400 hover:text-rose-600 cursor-pointer transition-colors p-1"
              title="Report Offer"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={post.social_link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[34px] cursor-pointer transition-colors shadow-2xs"
          >
            <span>Visit Store</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#0F172A] stroke-[2.5]" />
          </a>
        </div>
      </div>
    </div>
  );
}
