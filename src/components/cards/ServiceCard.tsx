"use client";

import React, { useState } from "react";
import { Phone, MessageSquare, Award, MapPin, Zap, Droplet, Hammer, Wind, Wrench, Eye, Share2, Bookmark, AlertTriangle, Calendar } from "lucide-react";
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
  const contactedCount = Math.floor(11 + (post.name?.length || 5) * 1.8);

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
      case "Electrician": return <Zap className="w-3.5 h-3.5 text-emerald-600" />;
      case "Plumber": return <Droplet className="w-3.5 h-3.5 text-emerald-600" />;
      case "Carpenter": return <Hammer className="w-3.5 h-3.5 text-emerald-600" />;
      case "AC & Refrigeration": return <Wind className="w-3.5 h-3.5 text-emerald-600" />;
      default: return <Wrench className="w-3.5 h-3.5 text-emerald-600" />;
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
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-[0_3px_8px_rgba(0,0,0,0.03)] transition-all duration-200 font-sans border border-slate-200/80 relative">
      
      {/* Top Section: Name & Category Badges */}
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

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-xl text-[10px]">
              {getCategoryIllustration(post.skill_category)}
              <span>{post.skill_category}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium shrink-0">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{formatRelativeTime(post.created_at)}</span>
        </div>
      </div>

      {/* Locality Tag */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-semibold">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Location: <strong className="text-slate-800">{post.area_tag}</strong></span>
      </div>

      {/* Description */}
      {post.description && (
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {post.description}
          </p>
        </div>
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

      {/* Footer Info & Action CTAs — Contacted Count Badge in First Position */}
      <div className="flex items-center justify-between pt-1">
        <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold px-2.5 py-1.5 rounded-xl text-xs">
          <span>{contactedCount} Contacted</span>
        </span>

        <div className="flex items-center gap-2">
          <a
            href={callUrl}
            onClick={handleInitiateContact}
            className="flex items-center gap-1.5 h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>Call Now</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleInitiateContact}
            className="flex items-center gap-1.5 h-9 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-3.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Feedback Modal */}
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
