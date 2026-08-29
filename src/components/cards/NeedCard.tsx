"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Calendar, MapPin, Share2, Bookmark, Pencil, Flag, Phone } from "lucide-react";
import { NeedOrSalePost } from "@/types";
import { formatIndianCurrencyText, formatRelativeTime } from "@/lib/constants";
import InAppChatModal from "@/components/chat/InAppChatModal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { reportListing } from "@/lib/moderation";

import CategoryVectorIllustration from "@/components/ui/CategoryVectorIllustration";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface NeedCardProps {
  post: NeedOrSalePost;
  onShare?: (post: NeedOrSalePost) => void;
  isPreview?: boolean;
}

export default function NeedCard({ post, onShare, isPreview = false }: NeedCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isVerified } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedList: any[] = JSON.parse(localStorage.getItem("namma_thanjai_saved_posts") || "[]");
        if (savedList.some((s) => s.id === post.id)) {
          setSaved(true);
        }
      } catch (e) {}
    }
  }, [post.id]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSold, setIsSold] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const isOwnPost = React.useMemo(() => {
    if (isPreview) return false;
    if (user?.uid && user.uid !== "guest_user" && post.userId === user.uid) return true;
    const normalizePhone = (p: string) => String(p || "").replace(/\D/g, "").slice(-10);
    if (profile?.phone && post.phone) {
      if (normalizePhone(profile.phone) === normalizePhone(post.phone)) return true;
    }
    return false;
  }, [user, profile, post, isPreview]);

  const rawPhone = String(post.phone || "");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello! I saw your post "${post.title}" in ${post.area_tag} on Namma Thanjai!`
  )}`;

  const handleSharePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://mythanjai.vercel.app";
    const shareText = `Check out "${post.title}" in ${post.area_tag || "Thanjavur"} on Namma Thanjai app:\n${shareUrl}`;

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: post.title || "Namma Thanjai Requirement",
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
        toast.success("Requirement link copied to clipboard!");
      }
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await reportListing(post.id, "needs_and_sales", "Inappropriate content", profile?.phone || user?.phoneNumber || "Anonymous");
    if (res.success) {
      toast.success("Thank you! Report submitted for verification.");
    } else {
      toast.error("Could not submit report. Please try again.");
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user && !profile) {
      toast.error("Sign in to save listings.");
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
            title: post.title,
            price: post.price,
            image_url: post.image_url,
            phone: post.phone,
            area_tag: post.area_tag,
            category: post.category,
            type: "NEED",
            colName: "needs_and_sales",
            saved_at: new Date().toISOString(),
          });
        }
        localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(savedList));
        toast.success("Post saved to your profile!");
      } else {
        const updated = savedList.filter((s: any) => s.id !== post.id);
        localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(updated));
        toast.info("Post removed from saved.");
      }
    } catch (e) {}
  };

  const getCategoryIllustration = (category?: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("real estate") || cat.includes("plot") || cat.includes("house") || cat.includes("rental") || cat.includes("land") || cat.includes("property")) {
      return "/hero_building_visual.png";
    }
    if (cat.includes("vehicle") || cat.includes("car") || cat.includes("bike") || cat.includes("scooter") || cat.includes("auto")) {
      return "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop";
    }
    if (cat.includes("electronic") || cat.includes("mobile") || cat.includes("laptop") || cat.includes("tv") || cat.includes("phone")) {
      return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop";
    }
    if (cat.includes("household") || cat.includes("furniture") || cat.includes("appliance") || cat.includes("home")) {
      return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop";
    }
    if (cat.includes("fashion") || cat.includes("cloth") || cat.includes("dress") || cat.includes("wear")) {
      return "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop";
    }
    return "/thanjavur_temple_illustration.png";
  };

  const illustrationSrc = getCategoryIllustration(post.category);

  const displayPriceText = React.useMemo(() => {
    const fromVal = (post as any).price_from;
    const toVal = (post as any).price_to;

    if (fromVal && toVal) return `₹${Number(fromVal).toLocaleString("en-IN")} - ₹${Number(toVal).toLocaleString("en-IN")}`;
    if (fromVal) return `From ₹${Number(fromVal).toLocaleString("en-IN")}`;
    if (toVal) return `Up to ₹${Number(toVal).toLocaleString("en-IN")}`;
    if (post.price !== null && post.price !== undefined && post.price !== "") return formatIndianCurrencyText(post.price);
    return "Budget Flexible";
  }, [post.price, (post as any).price_from, (post as any).price_to]);

  const locationList = React.useMemo(() => {
    if (!post.area_tag) return ["Thanjavur"];
    const split = post.area_tag.split(",").map((l) => l.trim()).filter(Boolean);
    return split.length > 0 ? split.slice(0, 3) : ["Thanjavur"];
  }, [post.area_tag]);

  if (isDeleted) return null;

  return (
    <div className={`bg-white rounded-none sm:rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-none sm:shadow-2xs border-b sm:border border-slate-200/80 sm:border-slate-200/90 relative font-sans h-full w-full ${isSold ? "opacity-80" : ""}`}>
      <div className="flex flex-col gap-3 flex-1">

        {/* ── TOP HEADER BLOCK: Full-Width Title + Inline Category Badge + Budget ── */}
        <div className="flex flex-col">
          {/* Top Row: Category Badge + FULFILLED status + Budget */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <CategoryIcon category={post.category} />
              {isSold && (
                <span className="text-[10px] font-bold bg-slate-900 text-amber-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  FULFILLED
                </span>
              )}
            </div>
            <div className="font-heading font-black text-base sm:text-lg text-amber-700 tracking-tight shrink-0">
              {displayPriceText}
            </div>
          </div>

          {/* Title: Single Line Truncation for Compact Height */}
          <h3 className="font-sans font-extrabold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug text-left mt-1">
            {post.title}
          </h3>
        </div>

        {/* ── MIDDLE SECTION: Smart Responsive Description Box (4 Lines Desktop / Up to 10 Lines Mobile App) ── */}
        <div className="bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl flex flex-col justify-start overflow-y-auto max-h-[18em] custom-scrollbar">
          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line line-clamp-10 md:line-clamp-4">
            {post.description || "No specific requirement details provided."}
          </p>
        </div>

        {/* ── ROW 3: Preferred Locations on Left + 3 Icon Buttons on Right (Hidden in Preview) ── */}
        <div className="flex items-center justify-between text-xs border-t border-slate-100/90 pt-2 mt-1 gap-2">
          {/* Preferred Locations Clean Text */}
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium truncate flex-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{locationList.join(" • ")}</span>
          </div>

          {/* 3 Square Action Icon Buttons (Save, Share, Report) - Hidden on Own Posts & Live Preview */}
          {!isPreview && !isOwnPost && (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1st: Save */}
              <button
                type="button"
                onClick={handleToggleSave}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border-0 ${
                  saved
                    ? "bg-amber-50 text-amber-600"
                    : "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
                title="Save Requirement"
              >
                <Bookmark className={`w-4 h-4 stroke-[1.8] ${saved ? "fill-amber-600" : ""}`} />
              </button>

              {/* 2nd: Share */}
              <button
                type="button"
                onClick={handleSharePost}
                className="w-7 h-7 rounded-full border-0 bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 flex items-center justify-center transition-colors cursor-pointer"
                title="Share Requirement"
              >
                <Share2 className="w-4 h-4 stroke-[1.8]" />
              </button>

              {/* 3rd: Report */}
              <button
                type="button"
                onClick={handleReport}
                className="w-7 h-7 rounded-full border-0 bg-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Report Requirement"
              >
                <Flag className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Row: Plain Text Date Ago (Left) + Buttons (Right) */}
      <div className="pt-3 flex items-center justify-between gap-4 sm:gap-6 mt-auto w-full border-t border-slate-100">
        {/* 1. Plain Text Relative Date */}
        <span className="text-xs font-semibold text-slate-600 shrink-0 select-none">
          {formatRelativeTime(post.created_at)}
        </span>

        {/* 2. Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          {isOwnPost ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/listings");
              }}
              className="text-blue-600 hover:text-blue-700 font-heading font-extrabold text-xs sm:text-sm px-2.5 py-1.5 underline underline-offset-2 cursor-pointer transition-colors active:scale-95 bg-transparent border-0"
              title="Edit Need Ad"
            >
              Edit
            </button>
          ) : (
            <>
              {!post.phone ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isVerified) {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                      }
                      return;
                    }
                    router.push(`/chat?listingId=${post.id}&sellerId=${post.userId || ""}&title=${encodeURIComponent(post.title)}`);
                  }}
                  className="w-full bg-[#1F244A] hover:bg-[#151936] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-md cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-white shrink-0" />
                  <span>Chat with Buyer</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isVerified) {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                        }
                        return;
                      }
                      router.push(`/chat?listingId=${post.id}&sellerId=${post.userId || ""}&title=${encodeURIComponent(post.title)}`);
                    }}
                    className="w-[128px] shrink-0 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#0F172A] shrink-0" />
                    <span>Chat</span>
                  </button>

                  <a
                    href={callUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="w-[128px] shrink-0 bg-[#1F244A] hover:bg-[#151936] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors"
                  >
                    <Phone className="w-4 h-4 text-white shrink-0" />
                    <span>Call</span>
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Facebook-Style Mobile Card Separator Bar */}
      <div className="w-full h-2.5 bg-[#F0F2F5] border-y border-[#E4E6EB] mt-3 block sm:hidden" />

      {/* In-App Chat Modal */}
      {isChatOpen && (
        <InAppChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          listingId={post.id}
          listingTitle={post.title}
          sellerId={post.userId || "seller_id"}
          sellerName="Buyer"
        />
      )}
    </div>
  );
}
