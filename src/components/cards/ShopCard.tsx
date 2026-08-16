"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Phone, MessageSquare, MapPin, Store, Sparkles, ShoppingBag, Utensils, Shirt, Calendar, Tag, Camera, Navigation, Eye, Share2, Bookmark, Lock } from "lucide-react";
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
      return `${fromMonth} ${fromDate.getDate()} - ${toMonth} ${toDate.getDate()}`;
    } catch (e) {}
  }
  return "Limited Time Offer";
}

import { useLanguage } from "@/context/LanguageContext";

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

  // Expired offer check logic
  const isExpired = React.useMemo(() => {
    if (!post.valid_to) return false;
    try {
      const toDate = new Date((post.valid_to as any).seconds ? (post.valid_to as any).seconds * 1000 : post.valid_to);
      return toDate < new Date();
    } catch (e) {
      return false;
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
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{post.category || "Store Offer"}</span>
            <span className="text-xs font-bold text-slate-400">{post.area_tag || "Thanjavur"}</span>
          </div>
          <h3 className="font-heading font-black text-base text-slate-900 line-clamp-1">{post.shop_name}</h3>
          <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-2">{post.offer_title}</p>
          <div className="mt-4 h-24 bg-slate-200 rounded-2xl w-full" />
        </div>
        <div className="absolute inset-0 bg-slate-955/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white z-20">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-slate-955 flex items-center justify-center mb-2.5 shadow-xl animate-bounce">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-heading font-black text-sm text-yellow-400 uppercase tracking-wider">
            Unlock 2nd Offer & Beyond
          </span>
          <p className="text-xs text-slate-200 font-bold mt-1 max-w-[240px] leading-relaxed">
            Verify your WhatsApp mobile number to unlock all local store deals & direct contact numbers.
          </p>
          <button
            type="button"
            className="mt-3.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:brightness-105 active:scale-95 text-slate-955 font-heading font-black text-xs px-5 py-2.5 rounded-xl shadow-lg border border-yellow-400 cursor-pointer transition-all"
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
    toast.success("Thank you! Listing reported to admin for verification.");
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
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_3px_8px_rgba(0,0,0,0.03)] transition-all duration-200 flex flex-col relative font-sans border border-slate-200/80 group">
      
      {/* Featured / Expired Overlay */}
      {isExpired ? (
        <div className="absolute top-2.5 left-2.5 z-20 bg-rose-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
          <span>⚠️ Offer Expired</span>
        </div>
      ) : post.is_featured ? (
        <div className="absolute top-2.5 left-2.5 z-20 bg-yellow-500 text-slate-955 text-[9px] font-semibold px-2 py-0.5 rounded-xl flex items-center gap-1 shadow-md animate-pulse">
          <Sparkles className="w-2.5 h-2.5 fill-current" />
          <span>Featured Store</span>
        </div>
      ) : null}




      {/* Main Image Box (Compulsory Image / Placeholder Box for 100% Uniform Height) */}
      {images.length > 0 ? (
        <div className="relative w-full h-44 sm:h-52 bg-slate-900 overflow-hidden">
          <Image
            src={images[0]}
            alt={post.shop_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </div>
      ) : (
        <div className="relative w-full h-44 sm:h-52 bg-slate-50 border-b border-slate-200/60 flex flex-col items-center justify-center gap-1.5 text-slate-400">
          <Camera className="w-6 h-6 stroke-[1.5] text-slate-300" />
          <span className="text-xs font-semibold text-slate-400">No Offer Image Provided</span>
        </div>
      )}

      {/* Info Details */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-1 truncate min-w-0 flex-1">
            {post.shop_name}
          </h3>
        </div>

        {/* Address and Landmark */}
        <p className="text-xs text-slate-500 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 line-clamp-2">
          {post.address_text}
          {post.landmark && (
            <span className="block mt-0.5 font-medium text-slate-700 truncate">
              Near: {post.landmark}
            </span>
          )}
        </p>

        {/* Offer Validity Badge */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[11px] w-fit mt-0.5 ${
          isExpired ? "text-rose-700 bg-rose-50 border-rose-200" : "text-slate-700 bg-slate-100 border-slate-200"
        }`}>
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{isExpired ? "Offer Expired" : validityText}</span>
        </div>

        {/* Active Promotion Offer Details */}
        {post.offer_title && (
          <div className={`border rounded-xl p-3 flex flex-col gap-1.5 mt-1 font-sans ${
            isExpired ? "bg-slate-50 border-slate-200 text-slate-500 opacity-75" : "bg-amber-50/60 border-amber-200/80 text-slate-900"
          }`}>
            <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs truncate">
              <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-600 shrink-0" />
              <span className="truncate">{post.offer_title}</span>
            </div>
            {post.offer_description && (
              <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white/95 p-2 rounded-lg border border-amber-100/60">
                {post.offer_description}
              </p>
            )}
          </div>
        )}

        {/* Video Reel Promo (Data-Saver Optimized Preload) */}
        {post.offer_social_link && (
          <div className="relative w-full rounded-xl overflow-hidden bg-black border border-slate-200 shadow-xs my-1 font-sans">
            <video
              src={post.offer_social_link}
              controls
              preload="metadata"
              playsInline
              className="w-full max-h-56 object-contain"
            />
          </div>
        )}

        {/* Social Engagement Bar: Left = Date & Views, Right = Share & Save */}
        {!isPreview && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-t border-b border-slate-100 py-2 my-0.5">
            {/* Left: Meta Info (Date & Views) */}
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatRelativeTime(post.created_at)}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{viewsCount} views</span>
              </span>
            </div>

            {/* Right: Actions (Share & Save) */}
            <div className="flex items-center gap-2.5">

              <button 
                onClick={handleShare}
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

        {/* Footer CTAs: Default = Get Direction Full-Width. If show_phone is enabled, show Call/WhatsApp */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-auto">
          {/* SECONDARY BUTTON: Get Directions */}
          <a
            href={directionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 font-extrabold px-4 rounded-xl text-xs transition-all duration-200 border border-amber-400/60 hover:border-amber-400 cursor-pointer shadow-2xs active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-700 fill-amber-700/20" />
            <span>{t("getDirection")}</span>
          </a>

          {post.show_phone && (
            <div className="flex items-center gap-2 shrink-0">
              {/* SECONDARY BUTTON: Call */}
              <a
                href={callUrl}
                className="flex items-center gap-1.5 h-9 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 font-extrabold px-3.5 rounded-xl text-xs transition-all duration-200 border border-amber-400/60 hover:border-amber-400 cursor-pointer active:scale-95 shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-amber-700 fill-current" />
                <span>{t("call")}</span>
              </a>

              {/* WHATSAPP BUTTON */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-3.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
                <span>{t("whatsApp")}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
