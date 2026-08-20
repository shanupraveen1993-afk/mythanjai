"use client";

import React, { useState, useEffect } from "react";
import { Phone, MessageSquare, MapPin, Share2, Bookmark, Calendar, Star, Flag } from "lucide-react";
import { ServiceProviderPost } from "@/types";
import ServiceFeedbackModal from "@/components/modals/ServiceFeedbackModal";
import { useToast } from "@/context/ToastContext";
import PreContactVerificationModal from "@/components/modals/PreContactVerificationModal";
import { useAuth } from "@/hooks/use-auth";
import { reportListing } from "@/lib/moderation";

import CategoryVectorIllustration from "@/components/ui/CategoryVectorIllustration";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface ServiceCardProps {
  post: ServiceProviderPost;
  isPreview?: boolean;
}

export default function ServiceCard({ post, isPreview = false }: ServiceCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saved, setSaved] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const savedList: any[] = JSON.parse(localStorage.getItem("namma_thanjai_saved_posts") || "[]");
        return savedList.some((s) => s.id === post.id);
      } catch (e) {}
    }
    return false;
  });
  const [isPreContactOpen, setIsPreContactOpen] = useState(false);
  const [contactType, setContactType] = useState<"call" | "whatsapp">("call");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Rating display check
  const numericRating = Number(post.rating || 4.8);
  const ratingDisplay = numericRating > 0 ? numericRating.toFixed(1) : "4.8";

  const rawPhone = String(post.phone || "9876543210");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${post.name}! I found your service listing (${post.skill_category}) in ${post.area_tag} on Namma Thanjai. Are you available for work?`
  )}`;
  const whatsappGroupShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `🛠️ Verified Service in Thanjavur:\n*${post.name}* — ${post.skill_category} in ${post.area_tag}\nContact via Namma Thanjai!`
  )}`;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${post.name} - ${post.skill_category}`,
        text: `Hire ${post.name} (${post.skill_category}) in ${post.area_tag}, Thanjavur on Namma Thanjai!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard!");
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = reportListing(post.id, "Inappropriate content");
    if (result.isQuarantined) {
      toast.error("This service provider listing has been sent for moderation review.");
    } else {
      toast.success("Thank you! Listing reported to admin for verification.");
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save service providers.");
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
            title: post.name,
            phone: post.phone,
            area_tag: post.area_tag,
            category: post.skill_category,
            type: "SERVICE",
            colName: "services",
            saved_at: new Date().toISOString(),
          });
        }
        localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(savedList));
        toast.success("Service provider saved to your profile!");
      } else {
        const updated = savedList.filter((s: any) => s.id !== post.id);
        localStorage.setItem("namma_thanjai_saved_posts", JSON.stringify(updated));
        toast.info("Provider removed from saved.");
      }
    } catch (e) {}
  };

  const handleOpenPreContactModal = (e: React.MouseEvent, type: "call" | "whatsapp") => {
    e.preventDefault();
    e.stopPropagation();
    setContactType(type);
    setIsPreContactOpen(true);
  };

  const handleConfirmContact = () => {
    setIsPreContactOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_pending_feedback", JSON.stringify({
        id: post.id,
        name: post.name,
        phone: cleanPhone,
        status: "pending",
        timestamp: Date.now()
      }));
    }
    const handleReturnToApp = () => {
      if (document.visibilityState === "visible") {
        setIsFeedbackOpen(true);
        document.removeEventListener("visibilitychange", handleReturnToApp);
      }
    };
    document.addEventListener("visibilitychange", handleReturnToApp);

    if (contactType === "whatsapp") {
      window.open(whatsappUrl, "_blank");
    } else {
      window.location.href = callUrl;
    }
  };

  const getCategoryIllustrationSrc = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("plumber") || cat.includes("water") || cat.includes("pipe")) {
      return "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop";
    }
    if (cat.includes("electrician") || cat.includes("wire") || cat.includes("power")) {
      return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop";
    }
    if (cat.includes("carpenter") || cat.includes("wood") || cat.includes("furniture")) {
      return "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop";
    }
    if (cat.includes("paint")) {
      return "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop";
    }
    if (cat.includes("ac") || cat.includes("cool")) {
      return "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&auto=format&fit=crop";
  };

  const illustrationSrc = getCategoryIllustrationSrc(post.skill_category);

  const postedMonthText = React.useMemo(() => {
    try {
      const date = post.created_at ? (typeof (post.created_at as any)?.toDate === "function" ? (post.created_at as any).toDate() : new Date(post.created_at)) : new Date();
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch (e) {
      return "August 2026";
    }
  }, [post.created_at]);

  return (
    <div className="bg-white rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 font-sans border border-slate-200/90 relative h-full">
      <div className="flex flex-col gap-2.5 flex-1">

        {/* ── TOP HEADER BLOCK: Full-Width Title + Category Badge & Rating ── */}
        <div className="flex flex-col gap-2 w-full">
          {/* Top Row: Category Badge (left) + Rating Badge (right) */}
          <div className="flex items-center justify-between gap-2 w-full">
            <CategoryIcon category={post.skill_category} />
            {numericRating > 0 ? (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px] px-2 py-0.5 rounded-md shrink-0">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                <span>{ratingDisplay} ★</span>
              </span>
            ) : (
              <span className="text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0">
                VERIFIED SERVICE
              </span>
            )}
          </div>

          {/* Provider / Business Name Title */}
          <h3 className="font-sans font-extrabold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug">
            {post.name}
          </h3>
        </div>

        {/* ── MIDDLE SECTION: Fixed Height Description Box ── */}
        <div className="min-h-[4.25rem] bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl flex items-center">
          <p className="text-xs text-slate-700 font-normal leading-relaxed line-clamp-3">
            {post.description || "Verified trade professional serving Thanjavur region."}
          </p>
        </div>

        {/* ── ROW 3: Location + Posted Date on Left + 3 Utility Icon Buttons on Right ── */}
        <div className="flex items-center justify-between text-xs text-slate-600 border-t border-b border-slate-100 py-1.5 my-0.5 gap-2">
          {/* Location & Posted Month */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold truncate min-w-0">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{post.area_tag || "Thanjavur"}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 font-normal shrink-0">{postedMonthText}</span>
          </div>

          {/* 3 Square Action Icon Buttons (Save, Share, Report) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                saved
                  ? "bg-amber-50 border-amber-300 text-amber-600"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
              }`}
              title="Save Provider"
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-amber-600" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="w-7 h-7 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Share via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReport}
              className="w-7 h-7 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Report Provider"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ROW: Full-Width 2 Rectangular CTA Buttons (WhatsApp Outlined Black & Call Blue) ── */}
      <div className="pt-2 flex items-center gap-2 mt-auto">
        <button
          type="button"
          onClick={(e) => handleOpenPreContactModal(e, "whatsapp")}
          className="flex-1 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-heading font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[36px] shadow-2xs cursor-pointer transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#0F172A] fill-[#0F172A]/10 shrink-0 stroke-[2.5]" />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={(e) => handleOpenPreContactModal(e, "call")}
          className="flex-1 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-heading font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[36px] shadow-2xs cursor-pointer transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Call</span>
        </button>
      </div>

      {/* Pre-Contact Safety Rules Modal */}
      {isPreContactOpen && (
        <PreContactVerificationModal
          isOpen={isPreContactOpen}
          onClose={() => setIsPreContactOpen(false)}
          onConfirm={handleConfirmContact}
          contactType={contactType}
          targetName={post.name}
          phone={cleanPhone}
        />
      )}

      {/* Post-Call Quality Feedback Modal */}
      {isFeedbackOpen && (
        <ServiceFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          serviceId={post.id}
          serviceName={post.name}
          phone={cleanPhone}
        />
      )}
    </div>
  );
}
