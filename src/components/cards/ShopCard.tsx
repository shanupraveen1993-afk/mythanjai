"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Phone, MessageSquare, MapPin, Store, Sparkles, Calendar, Navigation, Share2, Bookmark, Lock, Flag, Camera, Clock, Video, Play, Pause, Pencil } from "lucide-react";
import { ShopPost } from "@/types";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { reportListing } from "@/lib/moderation";
import { formatRelativeTime } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import CategoryIcon from "@/components/ui/CategoryIcon";

function formatOfferValidity(validFrom?: any, validTo?: any, createdAt?: any) {
  if (validFrom && validTo) {
    try {
      const fromDate = new Date(validFrom.seconds ? validFrom.seconds * 1000 : validFrom);
      const toDate = new Date(validTo.seconds ? validTo.seconds * 1000 : validTo);
      const fromMonth = fromDate.toLocaleString("default", { month: "short" });
      const toMonth = toDate.toLocaleString("default", { month: "short" });
      return `Valid: ${fromMonth} ${fromDate.getDate()} – ${toMonth} ${toDate.getDate()}`;
    } catch (e) {}
  }
  if (validTo) {
    try {
      const toDate = new Date((validTo as any).seconds ? (validTo as any).seconds * 1000 : validTo);
      const toMonth = toDate.toLocaleString("default", { month: "short" });
      return `Valid till ${toMonth} ${toDate.getDate()}`;
    } catch (e) {}
  }
  try {
    const baseDate = createdAt
      ? new Date(createdAt.seconds ? createdAt.seconds * 1000 : createdAt)
      : new Date();
    const endDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const m1 = baseDate.toLocaleString("default", { month: "short" });
    const m2 = endDate.toLocaleString("default", { month: "short" });
    return `Valid: ${m1} ${baseDate.getDate()} – ${m2} ${endDate.getDate()}`;
  } catch (e) {
    return "Valid 30 Days";
  }
}

interface ShopCardProps {
  post: ShopPost;
  isPreview?: boolean;
  index?: number;
  isGuest?: boolean;
}

export default function ShopCard({ post, isPreview = false, index = 0, isGuest = false }: ShopCardProps) {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isOwnPost = React.useMemo(() => {
    if (user?.uid && user.uid !== "guest_user" && post.userId === user.uid) return true;
    const normalizePhone = (p: string) => String(p || "").replace(/\D/g, "").slice(-10);
    if (profile?.phone && post.phone) {
      if (normalizePhone(profile.phone) === normalizePhone(post.phone)) return true;
    }
    return false;
  }, [user, profile, post]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  // Expired & Ends Today logic
  const { isExpired, isEndsToday } = React.useMemo(() => {
    if (!post.valid_to) return { isExpired: false, isEndsToday: false };
    try {
      const toDate = new Date((post.valid_to as any).seconds ? (post.valid_to as any).seconds * 1000 : post.valid_to);
      const now = new Date();
      return {
        isExpired: toDate < now,
        isEndsToday: toDate.toDateString() === now.toDateString() && toDate >= now,
      };
    } catch {
      return { isExpired: false, isEndsToday: false };
    }
  }, [post.valid_to]);

  const [sharesCount, setSharesCount] = useState(19);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`shares_shop_${post.id}`);
      if (stored) {
        setSharesCount(parseInt(stored, 10));
      } else {
        setSharesCount(Math.floor(18 + (post.shop_name?.length || 5) * 2));
      }
    }
  }, [post.id, post.shop_name]);

  const rawPhone = String((post as any).whatsapp_phone || post.phone || "");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${post.shop_name}, I saw your offer "${post.offer_title || "Special Offer"}" on Namma Thanjai! Is it currently available?`
  )}`;
  const directionUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${post.shop_name} ${post.address_text || post.area_tag || "Thanjavur"}`
  )}`;

  // Check if a video reel is provided
  const hasVideo = !!(post as any).video_url || !!(post as any).offer_social_link;
  const videoSrc = (post as any).video_url || (post as any).offer_social_link || "";

  const images = React.useMemo(() => {
    const rawList = (post as any).image_urls || [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.filter((url: any): url is string => typeof url === "string" && url.trim().length > 0);
    }
    if (typeof post.image_url === "string" && post.image_url.trim().length > 0) return [post.image_url];
    if (typeof (post as any).thumbnail_url === "string" && (post as any).thumbnail_url.trim().length > 0)
      return [(post as any).thumbnail_url];
    return [];
  }, [post]);

  const coverImage = images[0] || null;
  const validityText = formatOfferValidity(post.valid_from, post.valid_to, post.created_at);

  // ── Guest Blur State ──────────────────────────────────────────────────────
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
        className="bg-white rounded-xl border border-amber-300 shadow-md relative overflow-hidden cursor-pointer hover:border-yellow-400 transition-all"
        style={{ minHeight: 420 }}
      >
        <div className="filter blur-[7px] pointer-events-none opacity-40 select-none p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">{post.category || "Store Offer"}</span>
            <span className="text-xs font-bold text-slate-400">{post.area_tag || "Thanjavur"}</span>
          </div>
          <h3 className="font-heading font-black text-base text-slate-900 line-clamp-1">{post.shop_name}</h3>
          <p className="text-xs text-slate-500 font-bold mt-1 truncate line-clamp-1 whitespace-nowrap">{post.offer_title}</p>
          <div className="mt-4 h-40 bg-slate-200 rounded-xl w-full" />
        </div>
        <div className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
          <div className="w-11 h-11 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mb-3 animate-bounce">
            <Lock className="w-5 h-5 text-amber-400 stroke-[2.5]" />
          </div>
          <span className="font-heading font-black text-sm text-[#FBBF24] uppercase tracking-wider">Unlock 2nd Offer & Beyond</span>
          <p className="text-xs text-slate-200 font-medium mt-1.5 max-w-[220px] leading-relaxed">
            Verify your WhatsApp number to unlock all local store deals & direct contact numbers.
          </p>
          <button type="button" className="mt-4 btn btn-tertiary btn-sm uppercase tracking-wider cursor-pointer">
            Verify WhatsApp to Unlock →
          </button>
        </div>
      </div>
    );
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedShares = sharesCount + 1;
    setSharesCount(updatedShares);
    if (typeof window !== "undefined") localStorage.setItem(`shares_shop_${post.id}`, String(updatedShares));
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://mythanjai.vercel.app";
    const shareText = `Check out "${post.shop_name} — ${post.offer_title || "Special Offer"}" in ${post.area_tag || "Thanjavur"} on Namma Thanjai app:\n${shareUrl}`;

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: `${post.shop_name} – ${post.offer_title || "Offer"}`,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, "_blank");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Offer link copied to clipboard!");
      }
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = reportListing(post.id, "Inappropriate content");
    if (result.isQuarantined) toast.error("This store offer has been sent for moderation review.");
    else toast.success("Thank you! Listing reported to admin for verification.");
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isVerified) {
      toast.info("Please verify your WhatsApp mobile number to save store offers to your profile.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    const nextState = !saved;
    setSaved(nextState);
    try {
      const savedList: any[] = JSON.parse(localStorage.getItem("namma_thanjai_saved_posts") || "[]");
      if (nextState) {
        if (!savedList.some((s: any) => s.id === post.id)) {
          savedList.unshift({
            id: post.id,
            title: post.shop_name,
            offer_title: post.offer_title,
            phone: post.phone,
            area_tag: post.area_tag,
            category: post.category,
            type: "OFFER",
            colName: "shops",
            image_url: post.image_url,
            saved_at: new Date().toISOString(),
          });
        }
        localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(savedList));
        toast.success("Store offer saved to your profile!");
      } else {
        const updated = savedList.filter((s: any) => s.id !== post.id);
        localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(updated));
        toast.info("Store offer removed from saved.");
      }
    } catch (e) {}
  };

  // ── REEL MODE: Video was uploaded ─────────────────────────────────────────
  if (hasVideo) {
    return (
      <div className={`relative rounded-xl overflow-hidden shadow-md bg-slate-950 font-sans flex flex-col ${isExpired ? "opacity-60 grayscale filter pointer-events-none select-none" : ""}`} style={{ minHeight: 420 }}>
        {/* EXPIRED CENTER OVERLAY BADGE */}
        {/* EXPIRED CENTER OVERLAY BADGE — Light transparent overlay (can see content, but cannot interact) */}
        {isExpired && (
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] z-30 flex flex-col items-center justify-center p-4 text-center pointer-events-none select-none">
            <div className="bg-rose-600/90 text-white border-2 border-rose-400 px-5 py-2 rounded-2xl shadow-2xl flex flex-col items-center gap-0.5 backdrop-blur-xs">
              <span className="font-heading font-black text-sm sm:text-base uppercase tracking-widest">EXPIRED</span>
              <span className="text-[11px] font-bold text-rose-100">காலாவதியானது</span>
            </div>
          </div>
        )}
        {/* Full video background with lazy preload & click to play */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={(post as any).cover_image_url || (post as any).cover_image || undefined}
          playsInline
          loop
          muted={Boolean(isExpired)}
          preload="metadata"
          crossOrigin="anonymous"
          onError={(e) => {
            const videoEl = e.currentTarget;
            videoEl.style.display = "none";
          }}
          onClick={togglePlay}
          className="absolute inset-0 w-full h-full object-cover z-0 cursor-pointer"
        />

        {/* Centered Play / Pause Button Overlay */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/20 hover:bg-slate-950/40 transition-all cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-slate-950/80 text-amber-400 border-2 border-amber-400/60 backdrop-blur-md flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-amber-400 ml-1" />
            </div>
          </button>
        )}

        {/* Reel badge top right */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-slate-950/70 backdrop-blur-md text-amber-400 text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-amber-400/30">
          <Video className="w-3 h-3" />
          <span>Reel</span>
        </div>

        {/* Top right save/share/report */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
          <button type="button" onClick={handleToggleSave} className={`w-7 h-7 rounded-xl border backdrop-blur-md shadow-2xs flex items-center justify-center transition-all cursor-pointer ${saved ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-slate-950/50 text-white border-white/20"}`} aria-label="Save offer">
            <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} />
          </button>
          <button type="button" onClick={handleShare} className="w-7 h-7 rounded-xl border border-white/20 bg-slate-950/50 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md" aria-label="Share offer">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleReport} className="w-7 h-7 rounded-xl border border-white/20 bg-slate-950/50 text-white hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md" aria-label="Report offer">
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Featured / Expired / EndsToday overlay badge */}
        {isExpired && (
          <div className="absolute top-2.5 left-12 z-20 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg">⚠️ Expired</div>
        )}
        {isEndsToday && !isExpired && (
          <div className="absolute top-2.5 left-12 z-20 bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-lg">🔥 Ends Today!</div>
        )}
        {post.is_featured && !isExpired && !isEndsToday && (
          <div className="absolute top-2.5 left-12 z-20 bg-[#FBBF24] text-[#0F172A] text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
            <span>Featured</span>
          </div>
        )}

        {/* Dark gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent pt-16 p-4 flex flex-col gap-2">
          {/* Shop name + category */}
          <div className="flex items-center gap-2">
            <span className="bg-white/10 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md shrink-0">
              {post.category || "Store Offer"}
            </span>
          </div>
          <h3 className="font-heading font-black text-white text-sm leading-snug line-clamp-1">{post.shop_name}</h3>

          {/* Offer title & description */}
          {post.offer_title && (
            <p className="text-amber-300 text-xs font-bold truncate line-clamp-1 whitespace-nowrap leading-relaxed">{post.offer_title}</p>
          )}
          {(post.offer_description || (post as any).description) && (
            <p className="text-slate-200 text-xs font-normal leading-relaxed line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-white/10 backdrop-blur-md mt-0.5">
              {post.offer_description || (post as any).description}
            </p>
          )}

          {/* Validity + location row */}
          <div className="flex items-center gap-3 text-slate-300 text-[11px] font-medium flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{isExpired ? "Offer Expired" : validityText}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[120px]">{post.area_tag || "Thanjavur"}</span>
            </span>
          </div>

          {/* CTA Buttons — Plain Text Posted Date (Left) + Distinct Buttons (Right) */}
          <div className="flex items-center justify-between gap-3 mt-2 w-full pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-medium text-slate-400 shrink-0 select-none">
              {(() => {
                try {
                  const d = new Date((post.created_at as any)?.seconds ? (post.created_at as any).seconds * 1000 : post.created_at || Date.now());
                  return d.toLocaleString("default", { month: "short", year: "numeric" });
                } catch {
                  return "Aug 2026";
                }
              })()}
            </span>
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
              <a
                href={directionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white/80 text-white bg-slate-950/80 hover:bg-slate-900 font-heading font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 w-auto shadow-2xs backdrop-blur-md cursor-pointer transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Visit Store</span>
              </a>
              {post.show_phone !== false && (
                <a
                  href={`tel:${post.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-heading font-black text-xs py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 w-auto shadow-2xs cursor-pointer transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  <span>Call Shop</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VISITING CARD MODE: Photo cover header ─────────────────────────────
  if (coverImage) {
    return (
      <div className={`bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/80 flex flex-col relative font-sans h-full ${isExpired ? "opacity-60 grayscale filter pointer-events-none select-none" : ""}`} style={{ minHeight: 420 }}>
        {/* EXPIRED CENTER OVERLAY BADGE — Light transparent overlay (can see content, but cannot interact) */}
        {isExpired && (
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] z-30 flex flex-col items-center justify-center p-4 text-center pointer-events-none select-none">
            <div className="bg-rose-600/90 text-white border-2 border-rose-400 px-5 py-2 rounded-2xl shadow-2xl flex flex-col items-center gap-0.5 backdrop-blur-xs">
              <span className="font-heading font-black text-sm sm:text-base uppercase tracking-widest">EXPIRED</span>
              <span className="text-[11px] font-bold text-rose-100">காலாவதியானது</span>
            </div>
          </div>
        )}
        {/* Featured / Expired / Ends Today banner */}
        {isExpired ? (
          <div className="absolute top-2.5 left-2.5 z-20 bg-rose-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-lg shadow-md">⚠️ Offer Expired</div>
        ) : isEndsToday ? (
          <div className="absolute top-2.5 left-2.5 z-20 bg-slate-950/90 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-md border border-slate-800">
            <Sparkles className="w-3 h-3 text-amber-400 fill-current" />
            <span>Ends Today!</span>
          </div>
        ) : post.is_featured ? (
          <div className="absolute top-2.5 left-2.5 z-20 bg-[#FBBF24] text-[#0F172A] text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
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

        {/* Top Right: Save / Share / Report */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
          <button type="button" onClick={handleToggleSave} className={`w-7 h-7 rounded-xl border backdrop-blur-md shadow-2xs flex items-center justify-center transition-all cursor-pointer ${saved ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-slate-950/40 text-white border-white/20 hover:bg-slate-950/70"}`} aria-label={saved ? "Remove saved offer" : "Save offer"}>
            <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} />
          </button>
          <button type="button" onClick={handleShare} className="w-7 h-7 rounded-xl border border-white/20 bg-slate-950/40 text-white hover:bg-slate-950/70 flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-md" aria-label="Share offer">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleReport} className="w-7 h-7 rounded-xl border border-white/20 bg-slate-950/40 text-white hover:text-rose-400 hover:bg-slate-950/70 flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-md" aria-label="Report offer">
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Media: visiting card photo */}
        <div className="relative w-full bg-slate-900 overflow-hidden" style={{ height: 200 }}>
          <Image src={coverImage} alt={post.shop_name} fill className="object-cover" unoptimized />
        </div>

        {/* Info Details */}
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <h3 className="font-sans font-extrabold text-sm sm:text-base text-slate-900 leading-snug line-clamp-1 truncate min-w-0">
            {post.shop_name}
          </h3>

          {/* Offer title box with inline validity */}
          {post.offer_title && (
            <div className={`border rounded-xl p-3 flex flex-col gap-1.5 font-sans ${isExpired ? "bg-slate-50 border-slate-200 text-slate-500 opacity-75" : "bg-blue-50/80 border-blue-200 text-blue-950"}`}>
              <div className="flex items-center justify-between gap-2 font-bold text-xs truncate">
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 fill-blue-600 text-blue-700 shrink-0" />
                  <span className="truncate">{post.offer_title}</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 shrink-0 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                  {isExpired ? "Expired" : validityText}
                </span>
              </div>
              {post.offer_description && (
                <p className="text-xs text-slate-700 font-normal leading-relaxed bg-white/90 p-2 rounded-lg border border-blue-100 line-clamp-3">
                  {post.offer_description}
                </p>
              )}
            </div>
          )}

          {/* Location */}
          <div className="flex items-center text-slate-600 text-[11px] font-semibold gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{post.address_text || post.area_tag || "Thanjavur"}</span>
          </div>

          {/* Footer CTAs — Plain Text Posted Month+Year (Left) + Distinct Buttons (Right) */}
          <div className="pt-3 flex items-center justify-between gap-4 sm:gap-6 mt-auto w-full border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600 shrink-0 select-none">
            {(() => {
              try {
                return formatRelativeTime(post.created_at || new Date().toISOString());
              } catch {
                return "Aug 2026";
              }
            })()}
          </span>
            <span className="text-xs font-semibold text-slate-600 shrink-0 select-none">
              {(() => {
                try {
                  return formatRelativeTime(post.created_at || new Date().toISOString());
                } catch {
                  return "Aug 2026";
                }
              })()}
            </span>
            <div className="flex items-center gap-2 shrink-0 justify-end">
              {isOwnPost ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/listings");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs sm:text-sm py-2.5 px-4.5 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                >
                  <Pencil className="w-4 h-4 text-white shrink-0" />
                  <span>Manage</span>
                </button>
              ) : (
                <>
                  <a
                    href={directionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[128px] shrink-0 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-[#0F172A] shrink-0" />
                    <span>Visit Store</span>
                  </a>
                  {(post as any).is_available_now !== false && post.show_phone !== false && (
                    <a
                      href={callUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="w-[128px] shrink-0 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors"
                    >
                      <Phone className="w-4 h-4 text-white shrink-0" />
                      <span>Call Shop</span>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STATE C: CORPORATE SHOP INFO CARD (No Media Provided Fallback) ───────
  return (
    <div className={`bg-white rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 border border-slate-200/90 relative font-sans h-full ${isExpired ? "opacity-60 grayscale filter pointer-events-none select-none" : ""}`}>
      {/* EXPIRED CENTER OVERLAY BADGE */}
      {isExpired && (
        <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] z-30 flex flex-col items-center justify-center p-4 text-center pointer-events-none select-none rounded-xl">
          <div className="bg-rose-600/90 text-white border-2 border-rose-400 px-5 py-2 rounded-2xl shadow-2xl flex flex-col items-center gap-0.5 backdrop-blur-xs">
            <span className="font-heading font-black text-sm sm:text-base uppercase tracking-widest">EXPIRED</span>
            <span className="text-[11px] font-bold text-rose-100">காலாவதியானது</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 flex-1">
        {/* Top Row: Shop Name + Category & Utility Buttons */}
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <CategoryIcon category={post.category || (post as any).offer_category} />
              {isExpired && (
                <span className="text-[10px] font-black bg-slate-800 text-rose-300 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                  EXPIRED OFFER
                </span>
              )}
            </div>
            <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 line-clamp-1 truncate mt-0.5">
              {post.shop_name}
            </h3>
          </div>

          {/* Utility Icon Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={handleToggleSave} className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${saved ? "bg-amber-50 border-amber-300 text-amber-600" : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"}`} title="Save Offer">
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-amber-600" : ""}`} />
            </button>
            <button type="button" onClick={handleShare} className="w-7 h-7 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer" title="Share Offer">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Discount Badge if available */}
        {(post as any).discount_percentage && (
          <div className="inline-flex items-center gap-1 font-heading font-black text-base sm:text-lg text-amber-600">
            <span>{(post as any).discount_percentage}% OFF</span>
          </div>
        )}

        {/* Offer Description Container with inline validity badge */}
        <div className="min-h-[4.25rem] bg-slate-50/80 border border-slate-200/60 p-3 rounded-xl flex flex-col gap-1.5 justify-center">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-800 truncate">
              {post.offer_title || "Special Store Discount"}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 shrink-0 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {isExpired ? "Expired" : validityText}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3">
            {post.offer_description || (post as any).offer_details || (post as any).description || "Exclusive store discount directly from shop owner in Thanjavur."}
          </p>
        </div>

        {/* Location Info Row */}
        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium truncate py-1">
          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">{post.address_text || post.area_tag || "Thanjavur"}</span>
        </div>
      </div>

      {/* Footer CTAs */}
      <div className="pt-3 flex items-center justify-between gap-4 sm:gap-6 mt-auto w-full border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-600 shrink-0 select-none">
          {(() => {
            try {
              return formatRelativeTime(post.created_at || new Date().toISOString());
            } catch {
              return "Aug 2026";
            }
          })()}
        </span>
        <div className="flex items-center gap-2 shrink-0 justify-end">
          {isOwnPost ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/listings");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs sm:text-sm py-2.5 px-4.5 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
            >
              <Pencil className="w-4 h-4 text-white shrink-0" />
              <span>Manage</span>
            </button>
          ) : (
            <>
              <a
                href={directionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[128px] shrink-0 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors"
              >
                <Navigation className="w-4 h-4 text-[#0F172A] shrink-0" />
                <span>Visit Store</span>
              </a>
              {(post as any).is_available_now !== false && post.show_phone !== false && (
                <a
                  href={callUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="w-[128px] shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors"
                >
                  <Phone className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Call Shop</span>
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
