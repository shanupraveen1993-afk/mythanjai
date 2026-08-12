"use client";

import React, { useState } from "react";
import { Phone, MessageSquare, Award, MapPin, ShieldCheck, Zap, Droplet, Hammer, Wind, Wrench, Eye, Share2, Bookmark, AlertTriangle, Calendar } from "lucide-react";
import { ServiceProviderPost } from "@/types";
import { formatRelativeTime } from "@/lib/constants";
import ServiceFeedbackModal from "@/components/modals/ServiceFeedbackModal";

interface ServiceCardProps {
  post: ServiceProviderPost;
  isPreview?: boolean;
}

export default function ServiceCard({ post, isPreview = false }: ServiceCardProps) {
  const [saved, setSaved] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const viewsCount = Math.floor(120 + (post.name?.length || 5) * 19);
  const sharesCount = Math.floor(18 + (post.name?.length || 5) * 3);

  // Public visible phone number
  const rawPhone = String(post.phone || "9876543210");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${post.name}, I found your listing as an ${post.skill_category} on Namma Thanjai (Area: ${post.area_tag}). Are you available for a work request?`
  )}`;

  const isPendingVerification = (post.negative_reports_count || 0) >= 5 || post.status === "pending";

  const getCategoryIllustration = (cat: string) => {
    switch (cat) {
      case "Electrician": return <Zap className="w-3 h-3 text-emerald-600" />;
      case "Plumber": return <Droplet className="w-3 h-3 text-emerald-600" />;
      case "Carpenter": return <Hammer className="w-3 h-3 text-emerald-600" />;
      case "AC & Refrigeration": return <Wind className="w-3 h-3 text-emerald-600" />;
      default: return <Wrench className="w-3 h-3 text-emerald-600" />;
    }
  };

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
      alert("Profile link copied to clipboard!");
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  const handleInitiateContact = () => {
    setTimeout(() => {
      setIsFeedbackOpen(true);
    }, 500);
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 w-full font-sans border-0 relative">
      
      {/* Top Section: Name & Category Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 line-clamp-1 truncate">
              {post.name}
            </h3>

            {isPendingVerification && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-medium px-2 py-0.5 rounded-md text-[9px]">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Pending verification</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold px-2 py-0.5 rounded-xl text-[9px]">
              {getCategoryIllustration(post.skill_category)}
              <span>{post.skill_category}</span>
            </span>

            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-xl border border-slate-200">
              📞 +91 {cleanPhone}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium shrink-0">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{formatRelativeTime(post.created_at)}</span>
        </div>
      </div>

      {/* Experience and Locality */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-semibold">
        <div className="flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[110px]">{post.experience || "Expert tradesman"}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[100px]">{post.area_tag}</span>
        </div>
      </div>

      {/* Description */}
      {post.description && (
        <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 line-clamp-2">
          {post.description}
        </p>
      )}

      {/* Social Engagement Bar (Hidden in Live Preview Mode) */}
      {!isPreview && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-t border-b border-slate-100 py-2 my-0.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{viewsCount} Views</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-slate-800 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{sharesCount} Shares</span>
            </button>
            <button 
              onClick={handleToggleSave}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${saved ? "text-yellow-600 font-bold" : "hover:text-slate-800"}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-yellow-500 text-yellow-600" : "text-slate-400"}`} />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Public Contact Action Buttons + Verification Trigger */}
      <div className="flex gap-2 pt-1">
        {/* Call Dialer Button */}
        <a
          href={callUrl}
          onClick={handleInitiateContact}
          className="flex items-center justify-center gap-1.5 flex-1 h-9 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
        >
          <Phone className="w-3.5 h-3.5 text-slate-700" />
          <span>Call Now</span>
        </a>

        {/* WhatsApp Deep Link */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleInitiateContact}
          className="flex items-center justify-center gap-1.5 flex-1 h-9 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
          <span>WhatsApp</span>
        </a>
      </div>

      {/* Mandatory Post-Contact Service Verification Feedback Modal */}
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
