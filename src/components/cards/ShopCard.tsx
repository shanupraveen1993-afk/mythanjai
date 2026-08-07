"use client";

import React from "react";
import Image from "next/image";
import { Phone, MessageSquare, MapPin, Clock, Compass, Sparkles, Navigation, Utensils, Shirt, ShoppingBag, Store } from "lucide-react";
import { ShopPost } from "@/types";

interface ShopCardProps {
  post: ShopPost;
  onMapToggle?: (post: ShopPost) => void;
  isMapActive?: boolean;
}

export default function ShopCard({ post, onMapToggle, isMapActive = false }: ShopCardProps) {
  const cleanPhone = post.phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${post.shop_name}, I saw your business page on Namma Thanjai (Area: ${post.area_tag}). Can you share more details?`
  )}`;

  // OpenStreetMap/Google Maps external navigation link
  const navUrl = post.latitude && post.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${post.latitude},${post.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${post.shop_name}, ${post.area_tag}, Thanjavur`)}`;

  const getCategoryIllustration = (cat: string) => {
    switch (cat) {
      case "Cafe & Restaurant": return <Utensils className="w-3 h-3 text-white" />;
      case "Textiles & Clothing": return <Shirt className="w-3 h-3 text-white" />;
      case "Jewelry Showroom": return <Sparkles className="w-3 h-3 text-white" />;
      case "Supermarket & Grocery": return <ShoppingBag className="w-3 h-3 text-white" />;
      default: return <Store className="w-3 h-3 text-white" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col relative transition-all active:scale-[0.99] hover:shadow-sm w-full">
      {/* Featured Star Overlay */}
      {post.is_featured && (
        <div className="absolute top-2.5 left-2.5 z-20 bg-yellow-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xl flex items-center gap-1 shadow-md animate-pulse">
          <Sparkles className="w-2.5 h-2.5 fill-current" />
          <span>Featured</span>
        </div>
      )}

      {/* Storefront Image */}
      <div className="relative aspect-video w-full bg-slate-50 border-b border-slate-100">
        <Image
          src={post.image_url || "/placeholder.webp"}
          alt={post.shop_name}
          fill
          sizes="(max-width: 480px) 100vw, 480px"
          priority={post.is_featured}
          className="object-cover"
          unoptimized
        />
        {/* Category tag */}
        <span className="absolute bottom-2.5 right-2.5 bg-black/77 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-0.5 rounded-xl flex items-center gap-1 shadow-xs border border-white/10">
          {getCategoryIllustration(post.category)}
          <span className="capitalize">{post.category}</span>
        </span>

        {/* Play Reel overlay if Instagram Reel link is present */}
        {post.offer_social_link && (
          <a
            href={post.offer_social_link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/40 hover:bg-black/25 flex items-center justify-center transition-all cursor-pointer group z-10"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 text-white flex items-center justify-center shadow-xl transform group-hover:scale-115 transition-transform border-2 border-white/80">
              <span className="text-lg font-black ml-0.5">▶</span>
            </div>
            <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-md flex items-center gap-1">
              <span>📸 Instagram Reel</span>
            </span>
          </a>
        )}
      </div>

      {/* Info Details */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-heading font-extrabold text-sm text-slate-800 leading-snug">
            {post.shop_name}
          </h3>
          {post.is_claimed && (
            <span className="text-[8px] bg-slate-105 text-slate-700 border border-slate-200 font-bold px-1.5 py-0.5 rounded shrink-0">
              Claimed
            </span>
          )}
        </div>

        {/* Address and Landmark */}
        <p className="text-[11px] text-slate-500 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
          {post.address_text}
          {post.landmark && (
            <span className="block mt-1 font-semibold text-slate-700">
              Near: {post.landmark}
            </span>
          )}
        </p>

        {/* Operating Hours and Area */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-500 font-bold mt-1">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{post.area_tag}</span>
          </div>
          {post.hours && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{post.hours}</span>
            </div>
          )}
        </div>

        {/* Active Promotion Offer Details & Full Reel Caption Content */}
        {post.offer_title && (
          <div className="bg-gradient-to-b from-yellow-50 to-amber-50/40 border border-yellow-250/70 rounded-xl p-3 flex flex-col gap-1.5 mt-1 text-slate-800 font-sans shadow-2xs">
            <div className="flex items-center gap-1.5 text-yellow-800 font-black text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-yellow-500 stroke-none" />
              <span>{post.offer_title}</span>
            </div>
            {post.offer_description && (
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed bg-white/90 p-2.5 rounded-lg border border-yellow-200/50">
                {post.offer_description}
              </p>
            )}
            {post.offer_social_link && (
              <a
                href={post.offer_social_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-black px-3 py-2 rounded-xl text-[11px] transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <span>Watch Reel on Instagram 📸</span>
              </a>
            )}
          </div>
        )}

        {/* Interactive Action Buttons */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 mt-1">
          <div className="flex gap-1.5">
            {/* Call */}
            <a
              href={callUrl}
              className="flex items-center justify-center gap-1 flex-1 border border-slate-250 bg-white hover:bg-slate-50 text-slate-750 font-bold py-1.5 rounded-xl text-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>Call</span>
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-1.5 rounded-xl text-xs transition-all shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="flex gap-1.5">
            {/* Map Toggle inline */}
            {post.latitude && post.longitude && onMapToggle && (
              <button
                onClick={() => onMapToggle(post)}
                className={`flex items-center justify-center gap-1 flex-1 border font-bold py-1.5 rounded-xl text-xs transition-colors ${
                  isMapActive
                    ? "bg-yellow-600 text-white border-yellow-600"
                    : "border-slate-250 bg-white hover:bg-slate-50 text-slate-750"
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${isMapActive ? "text-white" : "text-yellow-600"}`} />
                <span>{isMapActive ? "Close Map" : "Show Map"}</span>
              </button>
            )}

            {/* External Navigation Directions */}
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 flex-1 border border-slate-250 bg-white hover:bg-slate-50 text-slate-750 font-bold py-1.5 rounded-xl text-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-yellow-600" />
              <span>Directions</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
