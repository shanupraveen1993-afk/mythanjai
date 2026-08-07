"use client";

import React, { useState } from "react";
import { Phone, MessageSquare, Award, MapPin, ShieldCheck, Zap, Droplet, Hammer, Wind, Wrench, Eye, Share2, Bookmark } from "lucide-react";
import { ServiceProviderPost } from "@/types";

interface ServiceCardProps {
  post: ServiceProviderPost;
}

export default function ServiceCard({ post }: ServiceCardProps) {
  const [saved, setSaved] = useState(false);
  const viewsCount = Math.floor(120 + (post.name?.length || 5) * 19);
  const sharesCount = Math.floor(18 + (post.name?.length || 5) * 3);

  // Format numbers for dialing and deep linking
  const cleanPhone = post.phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${post.name}, I found your listing as an ${post.skill_category} on Namma Thanjai (Area: ${post.area_tag}). Are you available for a work request?`
  )}`;

  const getCategoryIllustration = (cat: string) => {
    switch (cat) {
      case "Electrician": return <Zap className="w-3 h-3 text-yellow-750" />;
      case "Plumber": return <Droplet className="w-3 h-3 text-yellow-750" />;
      case "Carpenter": return <Hammer className="w-3 h-3 text-yellow-750" />;
      case "AC & Refrigeration": return <Wind className="w-3 h-3 text-yellow-750" />;
      default: return <Wrench className="w-3 h-3 text-yellow-750" />;
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

  return (
    <div className="bg-white border border-slate-200/95 rounded-2xl p-4 shadow-xs flex flex-col gap-3.5 transition-all active:scale-[0.99] hover:shadow-sm w-full">
      {/* Top Section: Name & Category Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading font-extrabold text-sm text-slate-800">
            {post.name}
          </h3>
          <span className="inline-flex items-center gap-1 mt-1 bg-yellow-50 border border-yellow-250/60 text-yellow-750 font-bold px-2 py-0.5 rounded-xl text-[9px] uppercase tracking-wide">
            {getCategoryIllustration(post.skill_category)}
            <span>{post.skill_category}</span>
          </span>
        </div>

        {/* Verified Indicator */}
        {post.is_verified && (
          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified
          </span>
        )}
      </div>

      {/* Experience and Locality */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-bold">
        <div className="flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{post.experience || "Expert tradesman"}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{post.area_tag}</span>
        </div>
      </div>

      {/* Services Description / Bio */}
      {post.description && (
        <p className="text-xs text-slate-500 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
          {post.description}
        </p>
      )}

      {/* Facebook-Style Social Engagement Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold border-t border-b border-slate-100 py-2 my-0.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>{viewsCount} Views</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShare}
            className="flex items-center gap-1 hover:text-yellow-600 cursor-pointer transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{sharesCount} Shares</span>
          </button>
          <button 
            onClick={handleToggleSave}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${saved ? "text-amber-600 font-extrabold" : "hover:text-amber-600"}`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-slate-100 mt-0.5">
        {/* Call Dialer Button */}
        <a
          href={callUrl}
          className="flex items-center justify-center gap-1.5 flex-1 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          <span>Call Now</span>
        </a>

        {/* WhatsApp Deep Link */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
