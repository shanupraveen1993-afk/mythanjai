"use client";

import React from "react";
import Image from "next/image";
import { Tag, MapPin, ExternalLink, Sparkles } from "lucide-react";
import { OfferPost } from "@/types";

interface OfferCardProps {
  post: OfferPost;
}

export default function OfferCard({ post }: OfferCardProps) {
  // Determine social network icon using inline SVGs to avoid import bugs
  const getSocialIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "instagram":
        return (
          <svg
            className="w-3.5 h-3.5 text-pink-500 fill-none stroke-current shrink-0"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        );
      case "facebook":
        return (
          <svg
            className="w-3.5 h-3.5 text-blue-600 fill-none stroke-current shrink-0"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        );
      default:
        return <ExternalLink className="w-3.5 h-3.5 text-yellow-600 shrink-0" />;
    }
  };

  return (
    <a
      href={post.social_link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex flex-col relative w-full"
    >
      {/* Featured Badge Overlay */}
      {post.is_featured && (
        <div className="absolute top-2.5 left-2.5 z-20 bg-yellow-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xl flex items-center gap-1 shadow-md">
          <Sparkles className="w-2.5 h-2.5 fill-current" />
          <span>Featured</span>
        </div>
      )}

      {/* Image Thumbnail Container */}
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
        {/* Category Label overlay */}
        <span className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
          {post.category}
        </span>
      </div>

      {/* Details Box */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-extrabold text-sm text-slate-800 leading-snug line-clamp-2 group-hover:text-yellow-700 transition-colors">
            {post.title}
          </h3>
        </div>

        {post.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {post.description}
          </p>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
            <MapPin className="w-3 h-3 text-yellow-500" />
            <span className="truncate max-w-[120px]">{post.area_tag}</span>
          </div>

          {/* Social Network Redirect Indicator */}
          <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-750 font-bold px-3 py-1.5 rounded-xl text-xs">
            {getSocialIcon(post.platform)}
            <span className="capitalize text-[10px] tracking-wide">{post.platform || "Open Deal"}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
          </div>
        </div>
      </div>
    </a>
  );
}
