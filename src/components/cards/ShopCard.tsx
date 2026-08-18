"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Phone, MessageSquare, MapPin, Store, Sparkles, ShoppingBag, Utensils, Shirt, Calendar, Tag, Camera, Navigation, Eye, Share2, Bookmark, Lock, Flag } from "lucide-react";
import { ShopPost } from "@/types";
import { formatRelativeTime } from "@/lib/constants";
import { useToast } from "@/context/ToastContext";

function formatOfferValidity(validFrom?: any, validTo?: any, createdAt?: any) {
  if (validFrom && validTo) {
    try {
      const fromDate = new Date(validFrom.seconds ? validFrom.seconds * 1000 : validFrom);
      const toDate = new Date(validTo.seconds ? validTo.seconds * 1000 : validTo);
      const fromMonth = fromDate.toLocaleString('default', { month: 'short' });
      const toMonth = toDate.toLocaleString('default', { month: 'short' });
      return `Valid: ${fromMonth} ${fromDate.getDate()} - ${toMonth} ${toDate.getDate()}`;
    } catch (e) {}
  }
  if (validTo) {
    try {
      const toDate = new Date(validTo.seconds ? validTo.seconds * 1000 : validTo);
      const toMonth = toDate.toLocaleString('default', { month: 'short' });
      return `Valid till ${toMonth} ${toDate.getDate()}`;
    } catch (e) {}
  }
  try {
    const baseDate = createdAt ? new Date(createdAt.seconds ? createdAt.seconds * 1000 : createdAt) : new Date();
    const endDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const m1 = baseDate.toLocaleString('default', { month: 'short' });
    const m2 = endDate.toLocaleString('default', { month: 'short' });
    return `Valid: ${m1} ${baseDate.getDate()} - ${m2} ${endDate.getDate()}`;
  } catch (e) {
    return "Valid 30 Days";
  }
}

import { useLanguage } from "@/context/LanguageContext";
import { reportListing } from "@/lib/moderation";

interface ShopCardProps {
  post: ShopPost;
  isPreview?: boolean;
  index?: number;
  isGuest?: boolean;
}

export default function ShopCard({ post, isPreview = false, index, isGuest = false }: ShopCardProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);

  // Expired offer & Ends Today check logic
  const { isExpired, isEndsToday } = React.useMemo(() => {
    if (!post.valid_to) return { isExpired: false, isEndsToday: false };
    try {
      const toDate = new Date((post.valid_to as any).seconds ? (post.valid_to as any).seconds * 1000 : post.valid_to);
      const now = new Date();
      const expired = toDate < now;
      const sameDay = toDate.toDateString() === now.toDateString();
      return { isExpired: expired, isEndsToday: sameDay && !expired };
    } catch (e) {
      return { isExpired: false, isEndsToday: false };
    }
  }, [post.valid_to]);

  // Dynamic View & Share state stored in localStorage per card
  const [viewsCount, setViewsCount] = useState(() => {
    if (typeof window === "undefined") return 140;
    const stored = localStorage.getItem(`views_shop_${post.id}`);
    if (stored) return parseInt(stored, 10);
    const initial = Math.floor(180 + (post.shop_name?.length || 5) * 14 + Math.random() * 25);
    localStorage.setItem(`views_shop_${post.id}`, String(initial));
    return initial;
  });

  const [sharesCount, setSharesCount] = useState(() => {
    if (typeof window === "undefined") return 19;
    const stored = localStorage.getItem(`shares_shop_${post.id}`);
    if (stored) return parseInt(stored, 10);
    return Math.floor(18 + (post.shop_name?.length || 5) * 2);
  });

  const rawPhone = String((post as any).whatsapp_phone || post.phone || "9876543210");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${post.shop_name}, I saw your offer "${post.offer_title || "Special Offer"}" on Namma Thanjai! Is it currently available?`
  )}`;
  const whatsappGroupShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `🔥 Offer from *${post.shop_name}* in ${post.area_tag}, Thanjavur:\n"${post.offer_title || "Exclusive Deal"}"\nCheck out on Namma Thanjai!`
  )}`;
  const directionUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${post.shop_name} ${post.address_text || post.area_tag || "Thanjavur"}`
  )}`;

  const isBlurred = isGuest && index !== undefined && index >= 1;

  if (isBlurred) {
    return (
      <div 
        onClick={() => {
          if (typeof window !== "undefined") {
            localStorage.setItem("namma_thanjai_target_post_route", "/shops");
            window.dispatchEvent(new Event("namma_thanjai_open_signin"));
          }
        }}
        className="bg-white rounded-3xl border border-amber-300 p-5 shadow-md relative overflow-hidden cursor-pointer group hover:border-yellow-400 transition-all min-h-[220px] flex flex-col justify-center"
      >
        <div className="filter blur-[7px] pointer-events-none opacity-40 select-none">
          <div className="flex items-center justify-between mb-3">
            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">{post.category || "Store Offer"}</span>
            <span className="text-xs font-bold text-slate-400">{post.area_tag || "Thanjavur"}</span>
          </div>
          <h3 className="font-heading font-black text-base text-slate-900 line-clamp-1">{post.shop_name}</h3>
          <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-2">{post.offer_title}</p>
          <div className="mt-4 h-24 bg-slate-200 rounded-2xl w-full" />
        </div>
        <div className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
          <div className="icon-box-dark mb-2.5 animate-bounce">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-heading font-black text-sm text-[#FBBF24] uppercase tracking-wider">
            Unlock 2nd Offer & Beyond
          </span>
          <p className="text-xs text-slate-200 font-bold mt-1 max-w-[240px] leading-relaxed">
            Verify your WhatsApp mobile number to unlock all local store deals & direct contact numbers.
          </p>
          <button
            type="button"
            className="mt-3.5 btn btn-tertiary btn-sm uppercase tracking-wider cursor-pointer"
          >
            Verify WhatsApp to Unlock →
          </button>
        </div>
      </div>
    );
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedShares = sharesCount + 1;
    setSharesCount(updatedShares);
    if (typeof window !== "undefined") {
      localStorage.setItem(`shares_shop_${post.id}`, String(updatedShares));
    }
    if (navigator.share) {
      navigator.share({
        title: `${post.shop_name} - ${post.offer_title || "Offer"}`,
        text: `Check out this offer from ${post.shop_name} in ${post.area_tag}, Thanjavur on Namma Thanjai!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Offer link copied to clipboard!");
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = reportListing(post.id, "Inappropriate content");
    if (result.isQuarantined) {
      toast.error("This store offer has been sent for moderation review.");
    } else {
      toast.success("Thank you! Listing reported to admin for verification.");
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  const images = React.useMemo(() => {
    const rawList = (post as any).image_urls || [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.filter((url: any): url is string => typeof url === "string" && url.trim().length > 0);
    }
    if (typeof post.image_url === "string" && post.image_url.trim().length > 0) {
      return [post.image_url];
    }
    return [];
  }, [post]);

  const validityText = formatOfferValidity(post.valid_from, post.valid_to, post.created_at);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/80 flex flex-col relative font-sans group">
      {/* Featured / Expired / Ends Today Overlay Banner */}
      {isExpired ? (
        <div className="absolute top-2.5 left-2.5 z-20 bg-rose-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
          <span>⚠️ Offer Expired</span>
        </div>
      ) : isEndsToday ? (
        <div className="absolute top-2.5 left-2.5 z-20 bg-slate-950/90 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-md border border-slate-800">
          <Sparkles className="w-3 h-3 fill-slate-950" />
          <span>🔥 Ends Today!</span>
        </div>
      ) : post.is_featured ? (
        <div className="absolute top-2.5 left-2.5 z-20 bg-[#FBBF24] text-[#0F172A] text-xs font-semibold px-2 py-0.5 rounded-xl flex items-center gap-1 shadow-md border-b border-[#D97706]">
          <Sparkles className="w-2.5 h-2.5 fill-current" />
          <span>Featured Store</span>
        </div>
      ) : (
        <div className="absolute top-2.5 left-2.5 z-20">
          <span className="bg-slate-950/40 backdrop-blur-md text-white font-semibold text-[11px] px-2.5 py-1 rounded-md border border-white/20 shadow-2xs">
            {post.category || "Store Offer"}
          </span>
        </div>
      )}

      {/* Top Right: Vertical Stack of 2 Action Buttons (1st: Save, 2nd: Share) */}
      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={handleToggleSave}
          className={`w-7 h-7 rounded-md border backdrop-blur-md shadow-2xs flex items-center justify-center transition-all cursor-pointer ${
            saved
              ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
              : "bg-slate-950/40 text-white border-white/20 hover:bg-slate-950/70"
          }`}
          title={saved ? "Saved" : "Save Offer"}
          aria-label={saved ? "Remove saved offer" : "Save this offer"}
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} />
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="w-7 h-7 rounded-md border border-white/20 bg-slate-950/40 text-white hover:bg-slate-950/70 flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-md"
          title="Share Offer"
          aria-label="Share this offer"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Media priority: Video Reel ➔ Photo ➔ "No Image Provided" Banner */}
      {post.offer_social_link ? (
        <div className="relative w-full h-48 sm:h-56 bg-black overflow-hidden">
          <video
            src={post.offer_social_link}
            controls
            preload="metadata"
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      ) : images.length > 0 ? (
        <div className="relative w-full h-44 sm:h-52 bg-slate-900 overflow-hidden">
          <Image
            src={images[0]}
            alt={post.shop_name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="relative w-full h-44 sm:h-52 bg-slate-50 border-b border-slate-200/60 flex flex-col items-center justify-center gap-1.5 text-slate-400">
          <Camera className="w-6 h-6 stroke-[1.5] text-slate-300" />
          <span className="text-xs font-semibold text-slate-400">No Image Provided</span>
        </div>
      )}

      {/* Info Details */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-heading font-bold text-sm sm:text-base text-slate-800 leading-snug line-clamp-1 truncate min-w-0 flex-1">
            {post.shop_name}
          </h3>
        </div>

        {/* 1. Active Promotion Offer Details (Highlighted in Royal Blue Pattern Box) */}
        {post.offer_title && (
          <div className={`border rounded-xl p-3 flex flex-col gap-1.5 mt-0.5 font-sans ${
            isExpired ? "bg-slate-50 border-slate-200 text-slate-500 opacity-75" : "bg-blue-50 border-blue-200 text-blue-950"
          }`}>
            <div className="flex items-center gap-1.5 text-blue-950 font-bold text-xs truncate">
              <Sparkles className="w-3.5 h-3.5 fill-blue-600 text-blue-700 shrink-0" />
              <span className="truncate">{post.offer_title}</span>
            </div>
            {post.offer_description && (
              <p className="text-xs text-slate-700 font-normal leading-relaxed bg-white/90 p-2 rounded-lg border border-blue-100">
                {post.offer_description}
              </p>
            )}
          </div>
        )}

        {/* 2. Offer Validity Badge */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-xs w-fit ${
          isExpired ? "text-rose-700 bg-rose-50 border-rose-200" : "text-slate-700 bg-slate-100 border-slate-200"
        }`}>
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{isExpired ? "Offer Expired" : validityText}</span>
        </div>

        {/* 3. Standardized Location Tag */}
        <div className="flex items-center text-slate-600 text-xs font-normal gap-1 pt-0.5">
          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">{post.address_text || post.area_tag || "Thanjavur"}</span>
        </div>

        {/* Footer CTAs: Conditional Call & Get Directions (NO WhatsApp) */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 mt-auto">
          {/* DIRECTION BUTTON: Get Directions */}
          <a
            href={directionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 min-h-[38px] shadow-2xs cursor-pointer flex-1"
          >
            <Navigation className="w-3.5 h-3.5 text-white" />
            <span>{t("getDirection")}</span>
          </a>

          {/* CALL BUTTON: Rendered ONLY if Availability Toggle is ON (show_phone !== false) */}
          {(post as any).is_available_now !== false && post.show_phone !== false && (
            <a
              href={callUrl}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#f59e0b] text-slate-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 min-h-[38px] shadow-2xs cursor-pointer shrink-0"
            >
              <Phone className="w-4 h-4 text-slate-950" />
              <span>Call</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
