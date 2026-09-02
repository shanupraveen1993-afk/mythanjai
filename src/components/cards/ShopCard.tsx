"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Phone, MessageSquare, MapPin, Store, Tag, Calendar, Navigation, Share2, Bookmark, Lock, Flag, Camera, Clock, Video, Play, Pause, Pencil, Eye } from "lucide-react";
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
  if (!validFrom && !validTo) return null;
  return null;
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

  const validityText = formatOfferValidity(post.valid_from, post.valid_to, post.created_at);
  const [saved, setSaved] = useState(false);
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

  const isOwnPost = React.useMemo(() => {
    if (isPreview) return false;
    if (user?.uid && user.uid !== "guest_user" && post.userId === user.uid) return true;
    const normalizePhone = (p: string) => String(p || "").replace(/\D/g, "").slice(-10);
    if (profile?.phone && post.phone) {
      if (normalizePhone(profile.phone) === normalizePhone(post.phone)) return true;
    }
    return false;
  }, [user, profile, post, isPreview]);

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

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await reportListing(post.id, "shops", "Inappropriate content", profile?.phone || user?.phoneNumber || "Anonymous");
    if (res.success) {
      toast.success("Thank you! Report submitted for verification.");
    } else {
      toast.error("Could not submit report. Please try again.");
    }
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

  const images = React.useMemo(() => {
    const rawList = (post as any).image_urls || [];
    let list: string[] = [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      list = rawList.filter((url: any): url is string => typeof url === "string" && url.trim().length > 0);
    } else if (typeof post.image_url === "string" && post.image_url.trim().length > 0) {
      list = [post.image_url];
    } else if (typeof (post as any).thumbnail_url === "string" && (post as any).thumbnail_url.trim().length > 0) {
      list = [(post as any).thumbnail_url];
    }
    return list.filter((url) => !url.includes("photo-1556911220-e15b29be8c8f"));
  }, [post]);

  const coverImage = images[0] || null;

  // ── VISITING CARD MODE: Photo cover header ─────────────────────────────
  if (coverImage) {
    return (
      <div className={`bg-white rounded-none sm:rounded-2xl overflow-hidden shadow-none sm:shadow-2xs border-b sm:border border-slate-200/80 flex flex-col relative font-sans h-full w-full ${isExpired ? "opacity-60 grayscale filter pointer-events-none select-none" : ""}`} style={{ minHeight: 420 }}>
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
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Ends Today!</span>
          </div>
        ) : post.is_featured ? (
          <div className="absolute top-2.5 left-2.5 z-20 bg-[#FBBF24] text-[#0F172A] text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
            <Tag className="w-2.5 h-2.5 fill-current" />
            <span>Featured Store</span>
          </div>
        ) : null}

        {/* Media: visiting card photo */}
        <div className="relative w-full bg-slate-900 overflow-hidden" style={{ height: 200 }}>
          <Image src={coverImage} alt={post.shop_name} fill className="object-cover" unoptimized />
        </div>

        {/* Info Details */}
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 truncate text-left">
            {post.shop_name}
          </h3>

          {/* Offer title box with inline validity */}
          {post.offer_title && (
            <div className={`border rounded-xl p-3 flex flex-col gap-1.5 font-sans ${isExpired ? "bg-slate-50 border-slate-200 text-slate-500 opacity-75" : "bg-blue-50/80 border-blue-200 text-blue-950"}`}>
              <div className="flex items-center justify-between gap-2 font-bold text-xs truncate">
                <span className="flex items-center gap-1.5 truncate">
                  <Tag className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span className="truncate">{post.offer_title}</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 shrink-0 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                  {isExpired ? "Expired" : validityText}
                </span>
              </div>
              {post.offer_description && (
                <div className="bg-white/90 p-2 rounded-lg border border-blue-100 overflow-y-auto max-h-[7.5em] sm:max-h-[14em] custom-scrollbar">
                  <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                    {post.offer_description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Location + Action Buttons Row */}
          <div className="flex items-start justify-between text-xs text-slate-600 pt-1 mt-0.5 gap-2 min-h-[2.25rem]">
            <div className="flex items-start text-slate-600 text-xs font-medium gap-1 min-w-0 flex-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span className="font-medium text-slate-600 text-xs line-clamp-2 leading-tight">{post.address_text || post.area_tag || "Thanjavur"}</span>
            </div>

            {/* 3 Square Action Icon Buttons (Save, Share, Report) - Hidden on Own Posts & Live Preview */}
            {!isPreview && !isOwnPost && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border-0 ${
                    saved
                      ? "bg-amber-50 text-amber-600"
                      : "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                  title={saved ? "Saved" : "Save Offer"}
                >
                  <Bookmark className={`w-4 h-4 stroke-[1.8] ${saved ? "fill-amber-600" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-7 h-7 rounded-full border-0 bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 flex items-center justify-center transition-colors cursor-pointer"
                  title="Share Offer"
                >
                  <Share2 className="w-4 h-4 stroke-[1.8]" />
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  className="w-7 h-7 rounded-full border-0 bg-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                  title="Report Offer"
                >
                  <Flag className="w-4 h-4 stroke-[1.8]" />
                </button>
              </div>
            )}
          </div>

          {/* Footer CTAs */}
          <div className="pt-3 flex items-center justify-between gap-4 sm:gap-6 mt-auto w-full border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 shrink-0 select-none flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatRelativeTime(post.created_at || new Date().toISOString())}</span>
            </span>
            <div className="flex items-center gap-2 shrink-0 justify-end">
              {isOwnPost ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/listings");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-heading font-extrabold text-xs sm:text-sm px-2.5 py-1.5 underline underline-offset-2 cursor-pointer transition-colors active:scale-95 bg-transparent border-0"
                  title="Edit Store Offer"
                >
                  Edit
                </button>
              ) : (
                <>
                  {!post.phone ? (
                    <a
                      href={isPreview ? "#" : directionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { if (isPreview) e.preventDefault(); }}
                      className={`w-[110px] sm:w-[128px] shrink-0 bg-[#1F244A] hover:bg-[#151936] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-md cursor-pointer transition-colors ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
                    >
                      <Navigation className="w-4 h-4 text-white shrink-0" />
                      <span>Visit Store</span>
                    </a>
                  ) : (
                    <>
                      <a
                        href={isPreview ? "#" : directionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { if (isPreview) e.preventDefault(); }}
                        className={`w-[128px] shrink-0 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
                      >
                        <Navigation className="w-4 h-4 text-[#0F172A] shrink-0" />
                        <span>Visit Store</span>
                      </a>
                      {(post as any).is_available_now !== false && post.show_phone !== false && (
                        <a
                          href={isPreview ? "#" : callUrl}
                          onClick={(e) => { if (isPreview) e.preventDefault(); e.stopPropagation(); }}
                          className={`w-[128px] shrink-0 bg-[#1F244A] hover:bg-[#151936] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
                        >
                          <Phone className="w-4 h-4 text-white shrink-0" />
                          <span>Call Shop</span>
                        </a>
                      )}
                      {(post as any).phone2 && (post as any).show_phone !== false && (
                        <a
                          href={isPreview ? "#" : `tel:${String((post as any).phone2).replace(/\D/g, "")}`}
                          onClick={(e) => { if (isPreview) e.preventDefault(); e.stopPropagation(); }}
                          className={`w-[128px] shrink-0 border-2 border-emerald-600 bg-emerald-50 text-emerald-900 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
                        >
                          <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Call Alt</span>
                        </a>
                      )}
                    </>
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
    <div className={`bg-white rounded-none sm:rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-none sm:shadow-2xs border-b sm:border border-slate-200/80 sm:border-slate-200/90 relative font-sans h-full w-full ${isExpired ? "opacity-60 grayscale filter pointer-events-none select-none" : ""}`}>
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
            <h3 className="font-sans font-extrabold text-base sm:text-lg text-slate-900 line-clamp-2 leading-snug text-left mt-1">
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
              className="bg-[#0F172A] hover:bg-slate-900 text-white font-heading font-black text-xs sm:text-sm p-2.5 rounded-xl flex items-center justify-center min-h-[44px] min-w-[44px] border border-slate-800 shadow-sm cursor-pointer transition-colors active:scale-95"
              title="Edit Store Offer"
              aria-label="Edit Store Offer"
            >
              <Pencil className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
            </button>
          ) : (
            <>
              <a
                href={isPreview ? "#" : directionUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { if (isPreview) e.preventDefault(); }}
                className={`w-[128px] shrink-0 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
              >
                <Navigation className="w-4 h-4 text-[#0F172A] shrink-0" />
                <span>Visit Store</span>
              </a>
              {(post as any).is_available_now !== false && post.show_phone !== false && (
                <a
                  href={isPreview ? "#" : callUrl}
                  onClick={(e) => { if (isPreview) e.preventDefault(); e.stopPropagation(); }}
                  className={`w-[128px] shrink-0 bg-[#1F244A] hover:bg-[#151936] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
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
  );
}
