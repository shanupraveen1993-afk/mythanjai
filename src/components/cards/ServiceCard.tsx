"use client";

import React from "react";
import { Phone, MessageSquare, Star, Award, MapPin, ShieldCheck, Zap, Droplet, Hammer, Wind, Wrench } from "lucide-react";
import { ServiceProviderPost } from "@/types";

interface ServiceCardProps {
  post: ServiceProviderPost;
}

export default function ServiceCard({ post }: ServiceCardProps) {
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

        {/* Rating & Verified Indicator */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-750 border border-yellow-250/60 font-bold px-2 py-0.5 rounded-xl text-xs">
            <Star className="w-3.5 h-3.5 fill-yellow-500 stroke-yellow-500" />
            <span>{post.rating || "4.8"}</span>
          </div>
          {post.is_verified && (
            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          )}
        </div>
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
