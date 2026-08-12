"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Phone, MessageSquare, MapPin, Store, Sparkles, ShoppingBag, Utensils, Shirt, Calendar, Maximize2, Tag } from "lucide-react";
import { ShopPost } from "@/types";
import { formatRelativeTime } from "@/lib/constants";
import ImageLightboxModal from "@/components/modals/ImageLightboxModal";

function formatOfferValidity(validFrom?: any, validTo?: any, createdAt?: any) {
  if (validFrom && validTo) {
    try {
      const fromDate = new Date(validFrom.seconds ? validFrom.seconds * 1000 : validFrom);
      const toDate = new Date(validTo.seconds ? validTo.seconds * 1000 : validTo);
      const fromMonth = fromDate.toLocaleString('default', { month: 'short' });
      const toMonth = toDate.toLocaleString('default', { month: 'short' });
      return `${fromMonth} ${fromDate.getDate()} - ${toMonth} ${toDate.getDate()}`;
    } catch (e) {}
  }
  return "Limited Time Offer";
}

interface ShopCardProps {
  post: ShopPost;
  isPreview?: boolean;
}

export default function ShopCard({ post, isPreview = false }: ShopCardProps) {
  const [saved, setSaved] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const rawPhone = String((post as any).whatsapp_phone || post.phone || "9876543210");
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  
  const callUrl = `tel:${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Hello ${post.shop_name}, I saw your offer "${post.offer_title || "Special Offer"}" on Namma Thanjai! Is it currently available?`
  )}`;

  const images = React.useMemo(() => {
    const rawList = (post as any).image_urls || [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.filter((url: any): url is string => typeof url === "string" && url.trim().length > 0);
    }
    if (typeof post.image_url === "string" && post.image_url.trim().length > 0) {
      return [post.image_url];
    }
    return ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop"];
  }, [post]);

  const validityText = formatOfferValidity(post.valid_from, post.valid_to, post.created_at);

  return (
    <div className="bg-white -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full sm:rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all duration-200 font-sans border-b border-slate-200/80 sm:border sm:border-slate-200/90 relative flex flex-row items-stretch overflow-hidden">
      
      {/* LEFT COLUMN: Shop / Offer Media Box */}
      <div 
        onClick={() => setIsLightboxOpen(true)}
        className="w-28 sm:w-36 shrink-0 relative bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-2 group/img cursor-pointer border-r border-slate-100"
      >
        <Image
          src={images[0]}
          alt={post.shop_name}
          fill
          className="object-cover group-hover/img:scale-105 transition-transform duration-300"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors flex items-top justify-end p-1.5">
          <span className="bg-black/60 text-white p-1 rounded-md text-[9px] backdrop-blur-xs flex items-center gap-1">
            <Maximize2 className="w-3 h-3" />
            {images.length > 1 && <span>{images.length}</span>}
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Info Details */}
      <div className="flex-1 p-3.5 flex flex-col justify-between gap-2 min-w-0">
        
        {/* Header: Shop Name & Category */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-1 truncate">
              {post.shop_name}
            </h3>

            {post.category && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[9px] mt-1">
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                <span className="truncate max-w-[100px]">{post.category}</span>
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* Offer Title & Validity */}
        {post.offer_title && (
          <div className="bg-yellow-50/70 border border-yellow-200/80 rounded-lg p-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-yellow-900 font-extrabold text-[11px] truncate">
              <Sparkles className="w-3 h-3 fill-yellow-500 text-yellow-600 shrink-0" />
              <span className="truncate">{post.offer_title}</span>
            </div>
            <span className="text-[9px] text-amber-800 font-bold flex items-center gap-1">
              Valid: {validityText}
            </span>
          </div>
        )}

        {/* Description Snippet with Read More */}
        {post.offer_description && (
          <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-lg">
            <p className={`text-[11px] text-slate-700 font-medium leading-normal ${isDescExpanded ? "" : "line-clamp-2"}`}>
              {post.offer_description}
            </p>
            {post.offer_description.length > 80 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 mt-0.5 cursor-pointer"
              >
                {isDescExpanded ? "Show Less" : "...Read More"}
              </button>
            )}
          </div>
        )}

        {/* Location & Area Tag */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate max-w-[140px]">{post.area_tag || post.address_text}</span>
        </div>

        {/* Bottom CTA Action Bar */}
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <a
            href={callUrl}
            className="flex items-center gap-1 h-7 bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 rounded-lg text-[10px] transition-all cursor-pointer"
          >
            <Phone className="w-3 h-3 fill-current" />
            <span>Call</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 h-7 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-2.5 rounded-lg text-[10px] transition-all cursor-pointer"
          >
            <MessageSquare className="w-3 h-3 fill-white stroke-none" />
            <span>Offer Chat</span>
          </a>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && images.length > 0 && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          images={images}
          initialIndex={0}
          title={post.shop_name}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}
