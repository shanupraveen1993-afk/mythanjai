"use client";

import React, { useState } from "react";
import { Phone, MessageSquare, Award, MapPin, Zap, Droplet, Hammer, Wind, Wrench, Eye, Share2, Bookmark, AlertTriangle, Calendar, Maximize2 } from "lucide-react";
import { ServiceProviderPost } from "@/types";
import { formatRelativeTime } from "@/lib/constants";
import ServiceFeedbackModal from "@/components/modals/ServiceFeedbackModal";
import ImageLightboxModal from "@/components/modals/ImageLightboxModal";

interface ServiceCardProps {
  post: ServiceProviderPost;
  isPreview?: boolean;
}

export default function ServiceCard({ post, isPreview = false }: ServiceCardProps) {
  const [saved, setSaved] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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
      case "Electrician": return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      case "Plumber": return <Droplet className="w-3.5 h-3.5 text-blue-400" />;
      case "Carpenter": return <Hammer className="w-3.5 h-3.5 text-amber-400" />;
      case "AC & Refrigeration": return <Wind className="w-3.5 h-3.5 text-cyan-400" />;
      default: return <Wrench className="w-3.5 h-3.5 text-emerald-400" />;
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

  const sampleAvatarUrl = (post as any).photo_url || (post as any).photo || `https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop`;

  return (
    <div className="bg-white -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 font-sans border-b border-slate-200/80 sm:border sm:border-slate-200/90 relative flex flex-row items-stretch overflow-hidden">
      
      {/* LEFT COLUMN: Avatar / Trade Media Box */}
      <div 
        onClick={() => setIsLightboxOpen(true)}
        className="w-28 sm:w-36 shrink-0 relative bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-2 group/img cursor-pointer border-r border-slate-100"
      >
        <img
          src={sampleAvatarUrl}
          alt={post.name}
          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors flex items-top justify-end p-1.5">
          <span className="bg-black/60 text-white p-1 rounded-md text-[9px] backdrop-blur-xs flex items-center gap-1">
            <Maximize2 className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Info & Actions */}
      <div className="flex-1 p-3.5 flex flex-col justify-between gap-2 min-w-0">
        
        {/* Header: Name & Verification */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 truncate">
                {post.name}
              </h3>

              {isPendingVerification && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-medium px-1.5 py-0.5 rounded-md text-[8px]">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  <span>Pending</span>
                </span>
              )}
            </div>

            {/* Badges: Category, Contacted Count */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[9px]">
                {getCategoryIllustration(post.skill_category)}
                <span>{post.skill_category}</span>
              </span>

              <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-md text-[9px]">
                <span>{contactedCount} Contacted</span>
              </span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* Experience & Locality */}
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
          <div className="flex items-center gap-1 min-w-0">
            <Award className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[90px]">{post.experience || "Expert tradesman"}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[90px]">{post.area_tag}</span>
          </div>
        </div>

        {/* Description Snippet with Read More */}
        {post.description && (
          <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-lg">
            <p className={`text-[11px] text-slate-700 font-medium leading-normal ${isDescExpanded ? "" : "line-clamp-2"}`}>
              {post.description}
            </p>
            {post.description.length > 80 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 mt-0.5 cursor-pointer"
              >
                {isDescExpanded ? "Show Less" : "...Read More"}
              </button>
            )}
          </div>
        )}

        {/* Social Bar */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Eye className="w-3 h-3 text-slate-400" />
            <span>{viewsCount}</span>
          </div>

          {!isPreview && (
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={handleShare}
                className="flex items-center gap-1 hover:text-slate-800 cursor-pointer transition-colors text-[9px]"
              >
                <Share2 className="w-3 h-3 text-slate-400" />
                <span>{sharesCount}</span>
              </button>
              <button 
                onClick={handleToggleSave}
                className={`flex items-center gap-1 cursor-pointer transition-colors text-[9px] ${saved ? "text-yellow-600 font-bold" : "hover:text-slate-800"}`}
              >
                <Bookmark className={`w-3 h-3 ${saved ? "fill-yellow-500 text-yellow-600" : "text-slate-400"}`} />
                <span>{saved ? "Saved" : "Save"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom CTA Action Bar */}
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <a
            href={callUrl}
            onClick={handleInitiateContact}
            className="flex items-center gap-1 h-7 bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 rounded-lg text-[10px] transition-all cursor-pointer"
          >
            <Phone className="w-3 h-3 fill-current" />
            <span>Call</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleInitiateContact}
            className="flex items-center gap-1 h-7 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-2.5 rounded-lg text-[10px] transition-all cursor-pointer"
          >
            <MessageSquare className="w-3 h-3 fill-white stroke-none" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          images={[sampleAvatarUrl]}
          initialIndex={0}
          title={post.name}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

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
