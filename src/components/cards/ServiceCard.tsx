"use client";

import React, { useState, useEffect } from "react";
import { Phone, MessageSquare, Award, MapPin, Zap, Droplet, Hammer, Wind, Wrench, Eye, Share2, Bookmark, AlertTriangle, Calendar, Paintbrush, Car, Sparkles, Star, Check, Flag } from "lucide-react";
import { ServiceProviderPost } from "@/types";
import { formatRelativeTime } from "@/lib/constants";
import ServiceFeedbackModal from "@/components/modals/ServiceFeedbackModal";
import { useToast } from "@/context/ToastContext";

import PreContactVerificationModal from "@/components/modals/PreContactVerificationModal";

import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { reportListing } from "@/lib/moderation";

interface ServiceCardProps {
  post: ServiceProviderPost;
  isPreview?: boolean;
}

export default function ServiceCard({ post, isPreview = false }: ServiceCardProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [isPreContactOpen, setIsPreContactOpen] = useState(false);
  const [contactType, setContactType] = useState<"call" | "whatsapp">("call");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Check if provider has a valid rating > 0 (if 0 or missing, hide completely)
  const numericRating = Number(post.rating || 0);
  const hasRating = numericRating > 0;
  const ratingDisplay = hasRating ? numericRating.toFixed(1) : null;

  // Dynamic View, Share & Contacted counts stored in localStorage per provider
  const [viewsCount] = useState(() => {
    if (typeof window === "undefined") return 180;
    const stored = localStorage.getItem(`views_service_${post.id}`);
    if (stored) return parseInt(stored, 10);
    const initial = Math.floor(180 + (post.name?.length || 5) * 14 + Math.random() * 30);
    localStorage.setItem(`views_service_${post.id}`, String(initial));
    return initial;
  });

  const [sharesCount, setSharesCount] = useState(() => {
    if (typeof window === "undefined") return 12;
    const stored = localStorage.getItem(`shares_service_${post.id}`);
    if (stored) return parseInt(stored, 10);
    return Math.floor(12 + (post.name?.length || 5) * 2);
  });

  const [contactedCount, setContactedCount] = useState(() => {
    if (typeof window === "undefined") return 45;
    const stored = localStorage.getItem(`contacted_service_${post.id}`);
    if (stored) return parseInt(stored, 10);
    return Math.floor(45 + (post.name?.length || 5) * 3);
  });

  const [isRequestSent, setIsRequestSent] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`request_sent_service_${post.id}`) === "true";
  });

  const handleSendRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRequestSent) return;
    setIsRequestSent(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`request_sent_service_${post.id}`, "true");
    }
    toast.success(`Request sent to ${post.name}! They will contact you shortly.`);
  };

  // Public visible phone number
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

  const isPendingVerification = (post as any).status === "pending" || !post.is_verified;

  const getCategoryIllustration = (category: string) => {
    switch (category?.toLowerCase()) {
      case "plumber": return <Wrench className="w-3.5 h-3.5 text-[#1d4ed8]" />;
      case "electrician": return <Zap className="w-3.5 h-3.5 text-[#1d4ed8]" />;
      case "carpenter": return <Hammer className="w-3.5 h-3.5 text-[#1d4ed8]" />;
      case "painter": return <Paintbrush className="w-3.5 h-3.5 text-[#1d4ed8]" />;
      case "ac technician": return <Wind className="w-3.5 h-3.5 text-[#1d4ed8]" />;
      case "auto mechanic": return <Car className="w-3.5 h-3.5 text-[#1d4ed8]" />;
      case "cleaning & housekeeping": return <Sparkles className="w-3.5 h-3.5 text-[#1d4ed8]" />;
      default: return <Wrench className="w-3.5 h-3.5 text-[#1d4ed8]" />;
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedShares = sharesCount + 1;
    setSharesCount(updatedShares);
    if (typeof window !== "undefined") {
      localStorage.setItem(`shares_service_${post.id}`, String(updatedShares));
    }
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pending = localStorage.getItem("namma_thanjai_pending_feedback");
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.id === post.id && parsed.status === "pending") {
            setIsFeedbackOpen(true);
          }
        } catch (e) {}
      }
    }
  }, [post.id]);

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
    setSaved(!saved);
  };

  // SET 1: Trigger Safety & Contact Verification Modal
  const handleOpenPreContactModal = (e: React.MouseEvent, type: "call" | "whatsapp") => {
    e.preventDefault();
    e.stopPropagation();
    setContactType(type);
    setIsPreContactOpen(true);
  };

  // SET 1 -> Executed: Open Call / WhatsApp AND listen for user return to show SET 2 Feedback Modal
  const handleConfirmContact = () => {
    setIsPreContactOpen(false);

    // Update contacted count
    const updatedContacted = contactedCount + 1;
    setContactedCount(updatedContacted);
    if (typeof window !== "undefined") {
      localStorage.setItem(`contacted_service_${post.id}`, String(updatedContacted));
      localStorage.setItem("namma_thanjai_pending_feedback", JSON.stringify({
        id: post.id,
        name: post.name,
        phone: cleanPhone,
        status: "pending",
        timestamp: Date.now()
      }));
    }

    // Register return listener (SET 2)
    const handleReturnToApp = () => {
      if (document.visibilityState === "visible") {
        setIsFeedbackOpen(true); // Open Set 2 Feedback Modal when user returns
        document.removeEventListener("visibilitychange", handleReturnToApp);
      }
    };
    document.addEventListener("visibilitychange", handleReturnToApp);

    // Execute phone dialer or WhatsApp link
    if (contactType === "whatsapp") {
      window.open(whatsappUrl, "_blank");
    } else {
      window.location.href = callUrl;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_3px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition-all duration-200 font-sans border border-slate-200/90 relative group h-full">

      {/* Line 1: Name (only) on LEFT + Rating Badge (if > 0) on RIGHT */}
      <div className="flex items-center justify-between gap-3 w-full">
        <h3 className="font-heading font-bold text-base sm:text-lg text-slate-800 line-clamp-1 leading-snug">
          {post.name}
        </h3>

        {/* Rating Badge: ONLY displayed if rating > 0 */}
        {hasRating && (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-950 font-semibold px-2.5 py-0.5 rounded-md text-xs shadow-2xs shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{ratingDisplay} ★</span>
          </span>
        )}
      </div>

      {/* Line 2: Outlined Royal Blue Category Tag (No fill, blue text, blue border, blue icon) */}
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 border border-[#1d4ed8] text-[#1d4ed8] bg-transparent font-semibold px-2.5 py-0.5 rounded-md text-xs">
          {getCategoryIllustration(post.skill_category)}
          <span>{post.skill_category}</span>
        </span>
      </div>

      {/* Line 3: Description */}
      {post.description && (
        <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3 bg-slate-50/80 border border-slate-200/60 p-3 rounded-lg">
          {post.description}
        </p>
      )}

      {/* Line 4: Location/Address on LEFT + Save & Share Icons on RIGHT */}
      <div className="flex items-center justify-between text-xs text-slate-600 font-normal border-t border-b border-slate-100 py-2.5 my-0.5">
        {/* Standardized Location Tag */}
        <div className="flex items-center gap-1 text-xs text-slate-600 font-normal">
          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">{post.area_tag || "Thanjavur"}</span>
        </div>

        {/* Right: Save & Share Icons (No views count) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
              saved
                ? "bg-amber-50 border-amber-300 text-amber-600"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            }`}
            title="Save Service Provider"
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-amber-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(whatsappGroupShareUrl, "_blank");
            }}
            className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Share via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReport}
            className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Report Provider"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Line 5 (Footer Row): Action CTA Buttons (Chat Teal & Call Amber) */}
      <div className="flex items-center gap-2 w-full pt-1 mt-auto">
        <button
          type="button"
          onClick={(e) => handleOpenPreContactModal(e, "whatsapp")}
          className="bg-[#128C7E] text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 min-h-[38px] shadow-2xs cursor-pointer flex-1"
        >
          <MessageSquare className="w-4 h-4 text-white fill-current" />
          <span>Chat</span>
        </button>

        <button
          type="button"
          onClick={(e) => handleOpenPreContactModal(e, "call")}
          className="bg-[#f59e0b] text-slate-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 min-h-[38px] shadow-2xs cursor-pointer flex-1"
        >
          <Phone className="w-4 h-4 text-slate-950" />
          <span>Call</span>
        </button>
      </div>

      {/* SET 1: Pre-Contact Safety Rules Modal */}
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

      {/* SET 2: Post-Call Quality Feedback Modal (Fires when user returns to app) */}
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
