"use client";

import React, { useState, useEffect } from "react";
import { Phone, MessageSquare, MapPin, Share2, Bookmark, Calendar, Star, Flag, Pencil } from "lucide-react";
import { ServiceProviderPost } from "@/types";
import ServiceFeedbackModal from "@/components/modals/ServiceFeedbackModal";
import { useToast } from "@/context/ToastContext";
import PreContactVerificationModal from "@/components/modals/PreContactVerificationModal";
import { useAuth } from "@/hooks/use-auth";
import { reportListing } from "@/lib/moderation";
import { formatRelativeTime } from "@/lib/constants";

import CategoryVectorIllustration from "@/components/ui/CategoryVectorIllustration";
import CategoryIcon from "@/components/ui/CategoryIcon";

import { useRouter } from "next/navigation";

interface ServiceCardProps {
  post: ServiceProviderPost;
  isPreview?: boolean;
}

export default function ServiceCard({ post, isPreview = false }: ServiceCardProps) {
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
  const [isPreContactOpen, setIsPreContactOpen] = useState(false);
  const [contactType, setContactType] = useState<"call" | "whatsapp">("call");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const skillBadge = React.useMemo(() => {
    return { label: "Verified Service", cls: "bg-slate-100 text-slate-700 border-slate-200 font-medium" };
  }, []);

  const hasRealReviews = Boolean((post as any).review_count && Number((post as any).review_count) > 0);

  const rawPhone = String(post.phone || "");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${post.name}! I found your service listing (${post.skill_category}) in ${post.area_tag} on Namma Thanjai. Are you available for work?`
  )}`;
  const whatsappGroupShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `🛠️ Verified Service in Thanjavur:\n*${post.name}* — ${post.skill_category} in ${post.area_tag}\nContact via Namma Thanjai!`
  )}`;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://mythanjai.vercel.app";
    const shareText = `Hire ${post.name} (${post.skill_category}) in ${post.area_tag || "Thanjavur"} on Namma Thanjai app:\n${shareUrl}`;

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: `${post.name} - ${post.skill_category}`,
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
        toast.success("Service profile link copied to clipboard!");
      }
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await reportListing(post.id, "services", "Inappropriate content", profile?.phone || user?.phoneNumber || "Anonymous");
    if (res.success) {
      toast.success("Thank you! Report submitted for verification.");
    } else {
      toast.error("Could not submit report. Please try again.");
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isVerified) {
      toast.info("Please verify your WhatsApp mobile number to save service providers to your profile.");
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
    return "";
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

  const isOwnPost = React.useMemo(() => {
    if (isPreview) return false;
    if (user?.uid && user.uid !== "guest_user" && post.userId === user.uid) return true;
    const normalizePhone = (p: string) => String(p || "").replace(/\D/g, "").slice(-10);
    if (profile?.phone && post.phone) {
      if (normalizePhone(profile.phone) === normalizePhone(post.phone)) return true;
    }
    return false;
  }, [user, profile, post, isPreview]);

  return (
    <div className="bg-white rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 font-sans border border-slate-200/90 relative h-full">
      <div className="flex flex-col gap-2.5 flex-1">

        {/* ── TOP HEADER BLOCK: Full-Width Title + Category Badge & Rating ── */}
        <div className="flex flex-col gap-2 w-full">
          {/* Top Row: Category Badge (left) + Skill Badge / Real Ratings (right) */}
          <div className="flex items-center justify-between gap-2 w-full">
            <CategoryIcon category={post.skill_category} />
            {hasRealReviews && (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px] px-2 py-0.5 rounded-md shrink-0">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                <span>{Number(post.rating || 0).toFixed(1)} ★ ({(post as any).review_count})</span>
              </span>
            )}
          </div>

          {/* Provider / Business Name Title */}
          <h3 className="font-sans font-bold text-base sm:text-lg text-slate-900 truncate line-clamp-1 whitespace-nowrap leading-snug">
            {post.name}
          </h3>
        </div>

        {/* ── MIDDLE SECTION: Fixed Height Description Box ── */}
        <div className="min-h-[4.25rem] bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl flex items-center">
          <p className="text-sm text-slate-700 font-medium leading-relaxed line-clamp-3">
            {post.description || "Skilled trade professional serving Thanjavur region."}
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

      {/* Footer Action Row: Plain Text Date Ago (Left) + Buttons (Right) */}
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

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          {isOwnPost ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/listings");
              }}
              className="bg-[#0F172A] hover:bg-slate-900 text-white font-heading font-black text-xs sm:text-sm py-2.5 px-4.5 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] border border-slate-800 shadow-sm cursor-pointer transition-colors whitespace-nowrap active:scale-95"
            >
              <Pencil className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPreview) return;
                  if (!isVerified) {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                    }
                    return;
                  }
                  const buyerPhone = profile?.phone ? `+91 ${profile.phone.replace(/\D/g, "").slice(-10)}` : "Registered User";
                  const callMsg = `📞 Call Back Request: Hello, a buyer (${buyerPhone}) requested a call back regarding your listing "${post.name}". Please call them back when free.`;
                  router.push(`/chat?listingId=${post.id}&sellerId=${post.userId || ""}&title=${encodeURIComponent(post.name)}&autoMsg=${encodeURIComponent(callMsg)}&autoSend=true`);
                }}
                className={`w-[128px] shrink-0 border-2 border-amber-500 text-amber-900 bg-amber-50 hover:bg-amber-100 font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
              >
                <Phone className="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
                <span>Call Back</span>
              </button>

              <button
                type="button"
                onClick={(e) => { if (isPreview) return; handleOpenPreContactModal(e, "call"); }}
                className={`w-[128px] shrink-0 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-heading font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[46px] shadow-2xs cursor-pointer transition-colors ${isPreview ? "opacity-60 pointer-events-none" : ""}`}
              >
                <Phone className="w-4 h-4 text-white shrink-0" />
                <span>Call</span>
              </button>
            </>
          )}
        </div>
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
