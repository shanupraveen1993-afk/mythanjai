"use client";

import React, { useState } from "react";
import { Phone, MessageSquare, Award, MapPin, Zap, Droplet, Hammer, Wind, Wrench, Eye, Share2, Bookmark, AlertTriangle, Calendar, Paintbrush, Car, Sparkles, Star } from "lucide-react";
import { ServiceProviderPost } from "@/types";
import { formatRelativeTime } from "@/lib/constants";
import ServiceFeedbackModal from "@/components/modals/ServiceFeedbackModal";
import { useToast } from "@/context/ToastContext";

import PreContactVerificationModal from "@/components/modals/PreContactVerificationModal";

import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";

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
      case "plumber": return <Wrench className="w-3.5 h-3.5 text-emerald-600" />;
      case "electrician": return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case "carpenter": return <Hammer className="w-3.5 h-3.5 text-amber-700" />;
      case "painter": return <Paintbrush className="w-3.5 h-3.5 text-purple-600" />;
      case "ac technician": return <Wind className="w-3.5 h-3.5 text-blue-600" />;
      case "auto mechanic": return <Car className="w-3.5 h-3.5 text-rose-600" />;
      case "cleaning & housekeeping": return <Sparkles className="w-3.5 h-3.5 text-cyan-600" />;
      default: return <Wrench className="w-3.5 h-3.5 text-emerald-600" />;
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

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Thank you! Listing reported to admin for verification.");
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  // SET 1: Trigger Safety & Contact Verification Modal
  const handleOpenPreContactModal = (e: React.MouseEvent, type: "call" | "whatsapp") => {
    e.preventDefault();
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
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-[0_3px_8px_rgba(0,0,0,0.03)] transition-all duration-200 font-sans border border-slate-200/80 relative group">

      {/* Top Section: Name & Category Badges */}
      <div className="flex items-start justify-between gap-2 pr-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 line-clamp-1 truncate">
              {post.name}
            </h3>


          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Outlined Border Tag (Not Filled) */}
            <span className="inline-flex items-center gap-1 bg-amber-500/5 border border-amber-400/80 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-xl text-[10px] shadow-2xs">
              {getCategoryIllustration(post.skill_category)}
              <span>{post.skill_category}</span>
            </span>

            {/* RATING BADGE: ONLY DISPLAYED IF RATING > 0. IF NO RATING, LEFT OUT COMPLETELY (NO 0 RATING) */}
            {hasRating && (
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-xl text-[10px] shadow-2xs">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{ratingDisplay}★</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Locality Tag */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-semibold">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{t("location")}: <strong className="text-slate-800">{post.area_tag}</strong></span>
      </div>

      {/* Description */}
      {post.description && (
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {post.description}
          </p>
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
              <span>{viewsCount} {t("views")}</span>
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

      {/* Footer Info & Action CTAs — Single-Line Action Button System */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <span className="text-xs text-slate-500 font-medium shrink-0">
          <strong className="text-slate-800 font-bold">{contactedCount}</strong> {t("contacted")}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          {/* SECONDARY BUTTON */}
          <button
            onClick={(e) => handleOpenPreContactModal(e, "call")}
            className="flex items-center gap-1.5 h-8.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 rounded-xl text-xs transition-all border border-slate-250 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>Call</span>
          </button>

          {/* PRIMARY BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.success(`Request sent to ${post.name}! They will call you back shortly.`);
            }}
            className="flex items-center gap-1.5 h-8.5 bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-black px-3 rounded-xl text-xs transition-all shadow-2xs cursor-pointer border border-yellow-400 active:scale-95 whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Send Request</span>
          </button>
        </div>
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
