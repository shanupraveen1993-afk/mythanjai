"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/image-compressor";
import { useAuth } from "@/hooks/use-auth";
import {
  TANJORE_LOCALITIES,
  CLASSIFIED_CATEGORIES,
  SERVICE_CATEGORIES,
  SHOP_CATEGORIES,
  formatIndianCurrencyText,
} from "@/lib/constants";
import {
  Check,
  Loader2,
  Tag,
  MapPin,
  Phone,
  Camera,
  Sparkles,
  Video,
  Globe,
  Clock,
  Calendar,
  IndianRupee,
  Wand2,
} from "lucide-react";
import NeedCard from "@/components/cards/NeedCard";
import ServiceCard from "@/components/cards/ServiceCard";
import ShopCard from "@/components/cards/ShopCard";
import { NeedOrSalePost, ServiceProviderPost, ShopPost } from "@/types";

type SegmentType = "sell" | "need" | "service" | "offer";

interface PostFormProps {
  segment: SegmentType;
}

const SEGMENT_CONFIG: Record<
  SegmentType,
  {
    title: string;
    badge: string;
    buttonLabel: string;
    redirectPath: string;
    categories: readonly string[];
    accentColor: string;
  }
> = {
  sell: {
    title: "Post Item for Sale",
    badge: "Sell Marketplace",
    buttonLabel: "Publish Sale Post →",
    redirectPath: "/sell",
    categories: CLASSIFIED_CATEGORIES,
    accentColor: "bg-yellow-500 hover:bg-yellow-400 border-yellow-400 text-slate-950",
  },
  need: {
    title: "Post Buyer Requirement",
    badge: "Need Request",
    buttonLabel: "Publish Requirement →",
    redirectPath: "/need",
    categories: CLASSIFIED_CATEGORIES,
    accentColor: "bg-blue-500 hover:bg-blue-400 border-blue-400 text-white",
  },
  service: {
    title: "Register Skilled Service",
    badge: "Verified Local Trade",
    buttonLabel: "Publish Service Listing →",
    redirectPath: "/services",
    categories: SERVICE_CATEGORIES,
    accentColor: "bg-green-600 hover:bg-green-500 border-green-500 text-white",
  },
  offer: {
    title: "Post Store Offer & Deal",
    badge: "Local Store Deal",
    buttonLabel: "Publish Store Offer →",
    redirectPath: "/shops",
    categories: SHOP_CATEGORIES,
    accentColor: "bg-purple-600 hover:bg-purple-500 border-purple-500 text-white",
  },
};

export default function PostForm({ segment }: PostFormProps) {
  const router = useRouter();
  const config = SEGMENT_CONFIG[segment];
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Common Form Fields
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>(TANJORE_LOCALITIES[0]);
  const [category, setCategory] = useState<string>(config.categories[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aiPolishedDesc, setAiPolishedDesc] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Custom Segment Specific Fields
  const [price, setPrice] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [experience, setExperience] = useState("5+ Years");
  const [workingHours, setWorkingHours] = useState("9 AM – 8 PM");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  // Auto-fill user profile phone
  useEffect(() => {
    if (profile?.phone && !phone) {
      setPhone(profile.phone);
    }
  }, [profile, phone]);

  // Trigger AI formatting explicitly
  const runAiPolisher = async (textToFormat: string) => {
    if (!textToFormat.trim() || textToFormat.trim().length < 6) return;
    setAiLoading(true);

    try {
      const res = await fetch("/api/gemini-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription: textToFormat, type: segment }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.formattedText) {
          setAiPolishedDesc(data.formattedText);
        }
      }
    } catch (err) {
      console.warn("AI Polish error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Automated AI Description Refinement (800ms debounced trigger)
  useEffect(() => {
    if (!description.trim() || description.trim().length < 8) {
      setAiPolishedDesc(description);
      return;
    }

    const timer = setTimeout(() => {
      runAiPolisher(description);
    }, 800);

    return () => clearTimeout(timer);
  }, [description]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Indian Currency Quick Selectors
  const handleAddPrice = (addAmount: number) => {
    const current = parseFloat(price) || 0;
    const nextVal = current + addAmount;
    setPrice(String(nextVal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title for your posting.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";

      if (selectedImage) {
        try {
          const compressed = await compressImage(selectedImage);
          const storageRef = ref(storage, `postings/${Date.now()}_${selectedImage.name}`);
          const snapshot = await uploadBytes(storageRef, compressed.blob);
          imageUrl = await getDownloadURL(snapshot.ref);
        } catch (uploadErr) {
          console.warn("Image upload fallback to preview:", uploadErr);
          imageUrl = imagePreview || "";
        }
      }

      const timestamp = serverTimestamp();
      const uid = user?.uid || "guest_user";
      const finalDesc = aiPolishedDesc.trim() || description.trim();

      if (segment === "sell" || segment === "need") {
        await addDoc(collection(db, "needs_and_sales"), {
          userId: uid,
          type: segment === "sell" ? "SELL" : "NEED",
          title: title.trim(),
          description: finalDesc,
          raw_text: description.trim(),
          category,
          area_tag: area,
          price: price ? parseFloat(price) : null,
          phone: phone || "9876543210",
          image_url: imageUrl,
          youtube_url: youtubeUrl.trim() || "",
          google_maps_url: googleMapsUrl.trim() || "",
          is_verified: true,
          created_at: timestamp,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      } else if (segment === "service") {
        await addDoc(collection(db, "services"), {
          userId: uid,
          name: title.trim(),
          skill_category: category,
          experience: experience || "5+ Years",
          working_hours: workingHours || "9 AM – 8 PM",
          area_tag: area,
          phone: phone || "9876543210",
          rating: 5.0,
          negative_reports_count: 0,
          status: "active",
          description: finalDesc,
          image_url: imageUrl,
          is_verified: true,
          created_at: timestamp,
        });
      } else if (segment === "offer") {
        await addDoc(collection(db, "shops"), {
          userId: uid,
          shop_name: title.trim(),
          category,
          area_tag: area,
          phone: phone || "9876543210",
          image_url: imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
          latitude: 10.7870,
          longitude: 79.1378,
          google_maps_url: googleMapsUrl.trim() || "",
          address_text: `${area}, Thanjavur`,
          hours: workingHours || "9 AM – 9 PM",
          is_claimed: true,
          created_at: timestamp,
          offer_title: title.trim(),
          offer_description: finalDesc,
          valid_from: validFrom || null,
          valid_to: validTo || null,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(config.redirectPath);
      }, 1000);
    } catch (err) {
      console.error("Posting submission error:", err);
      alert("Failed to submit posting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Live Interactive Preview Cards Data
  const previewSellOrNeedPost = useMemo<NeedOrSalePost>(() => {
    return {
      id: "preview_post",
      userId: user?.uid || "preview_user",
      type: segment === "sell" ? "SELL" : "NEED",
      raw_text: description.trim(),
      title: title.trim() || (segment === "sell" ? "Sample Item Title" : "Sample Requirement Title"),
      description: aiPolishedDesc.trim() || description.trim() || "Live AI preview description will appear here as you type...",
      category: category || config.categories[0],
      area_tag: area || TANJORE_LOCALITIES[0],
      price: price || (segment === "sell" ? "2500000" : "10000"),
      phone: phone || "9876543210",
      image_url: imagePreview || "/thanjavur_temple_illustration.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 86400000) as any,
    };
  }, [title, description, aiPolishedDesc, category, area, price, phone, imagePreview, segment, user, config.categories]);

  const previewServicePost = useMemo<ServiceProviderPost>(() => {
    return {
      id: "preview_service",
      userId: user?.uid || "preview_user",
      name: title.trim() || "Technician / Provider Name",
      skill_category: category || config.categories[0],
      experience: experience || "5+ Years",
      area_tag: area || TANJORE_LOCALITIES[0],
      phone: phone || "9876543210",
      rating: 5.0,
      description: aiPolishedDesc.trim() || description.trim() || "Skilled service description and availability details...",
      image_url: imagePreview || "/hero_building_visual.png",
      is_verified: true,
      created_at: new Date() as any,
    };
  }, [title, description, aiPolishedDesc, category, area, experience, phone, imagePreview, user, config.categories]);

  const previewShopPost = useMemo<ShopPost>(() => {
    return {
      id: "preview_shop",
      userId: user?.uid || "preview_user",
      shop_name: title.trim() || "Store Name & Deal Title",
      category: category || config.categories[0],
      address_text: `${area}, Thanjavur`,
      landmark: "Near Main Road",
      hours: workingHours || "9 AM – 9 PM",
      phone: phone || "9876543210",
      area_tag: area || TANJORE_LOCALITIES[0],
      offer_title: title.trim() || "Exclusive Discount Offer",
      offer_description: aiPolishedDesc.trim() || description.trim() || "Special offer details and promotion terms...",
      image_url: imagePreview || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
      latitude: 10.7870,
      longitude: 79.1378,
      is_claimed: true,
      created_at: new Date() as any,
    };
  }, [title, description, aiPolishedDesc, category, area, workingHours, phone, imagePreview, user, config.categories]);

  const formattedPriceBadge = formatIndianCurrencyText(price);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 pb-24 flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-col items-center border-b border-slate-200 pb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {config.badge}
        </span>
        <h1 className="font-heading font-black text-lg sm:text-xl text-slate-900 uppercase tracking-tight">
          {config.title}
        </h1>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-8 flex flex-col items-center text-center gap-3 animate-fade-in my-8 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="font-heading font-black text-xl text-green-900">Post Published Successfully!</h2>
          <p className="text-xs text-green-700 font-semibold">Redirecting to feed...</p>
        </div>
      ) : (
        /* 2-COLUMN SPLIT LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-4 bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm">
            
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {segment === "service" ? "Service / Technician Name *" : segment === "offer" ? "Store Name & Deal Title *" : "Posting Title / Item Name *"}
              </label>
              <input
                type="text"
                required
                placeholder={
                  segment === "sell"
                    ? "e.g. 2 BHK House / Hero Splendor / Commercial Land"
                    : segment === "need"
                    ? "e.g. Need 2 BHK House near Medical College"
                    : segment === "service"
                    ? "e.g. Senthil Kumar — Home Electrician"
                    : "e.g. GLEN Kitchen Chimney — 50% OFF"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {config.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Location in Thanjavur *
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {TANJORE_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* PRICE INPUT WITH INDIAN CURRENCY FORMATTER & QUICK BUTTONS */}
            {(segment === "sell" || segment === "need") && (
              <div className="flex flex-col gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    {segment === "sell" ? "Price (₹)" : "Budget (₹)"}
                  </label>
                  {formattedPriceBadge && (
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      💰 {formattedPriceBadge}
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="e.g. 2500000 (25 Lakhs) or 25000000 (2.5 Crore)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900"
                />

                {/* Indian Unit Quick Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Quick Add:</span>
                  <button
                    type="button"
                    onClick={() => handleAddPrice(100000)}
                    className="text-[11px] font-bold bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    + ₹1 Lakh
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPrice(500000)}
                    className="text-[11px] font-bold bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    + ₹5 Lakhs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPrice(1000000)}
                    className="text-[11px] font-bold bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    + ₹10 Lakhs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPrice(10000000)}
                    className="text-[11px] font-bold bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    + ₹1 Crore
                  </button>
                  {price && (
                    <button
                      type="button"
                      onClick={() => setPrice("")}
                      className="text-[10px] font-bold text-red-600 hover:text-red-800 ml-auto cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Service Specific Fields */}
            {segment === "service" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8+ Years Experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Working Hours
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9 AM – 8 PM"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Offer Specific Dates & Maps */}
            {segment === "offer" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Valid From Date
                    </label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Valid To Date
                    </label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Exact Google Maps Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </>
            )}

            {/* Sell Specific Links */}
            {segment === "sell" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-red-500" /> YouTube Video URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-500" /> Google Maps URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>

            {/* DESCRIPTION WITH AI POLISH BUTTON & AUTOMATED TRIGGER */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Description / Details
                </label>

                <button
                  type="button"
                  onClick={() => runAiPolisher(description)}
                  disabled={aiLoading || !description.trim()}
                  className="flex items-center gap-1 text-[11px] font-black text-yellow-950 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-2xs border border-yellow-300"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Formatting AI Copy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-yellow-950" />
                      <span>✨ AI Format & Polish</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={4}
                placeholder="Describe your item, features, or service details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 resize-none"
              />
            </div>

            {/* Photo / Visiting Card Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                {segment === "offer" ? "Visiting Card / Poster Photo" : "Attach Photo (Optional)"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 ${config.accentColor} font-black text-xs uppercase tracking-wider rounded-2xl border shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Post...</span>
                </>
              ) : (
                <span>{config.buttonLabel}</span>
              )}
            </button>
          </form>

          {/* RIGHT COLUMN: Live Interactive Preview Card */}
          <div className="lg:col-span-5 sticky top-20 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                Live Interactive Preview
              </span>
              {aiLoading ? (
                <span className="text-[10px] font-black text-yellow-600 animate-pulse flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Polishing Copy...
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400">Updates in real-time</span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-4 shadow-sm flex flex-col gap-3 relative">
              {aiLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-30 rounded-3xl flex flex-col items-center justify-center gap-2 text-center p-4">
                  <Loader2 className="w-7 h-7 text-yellow-500 animate-spin" />
                  <span className="text-xs font-black text-slate-900">✨ AI Refining Tamil/English Copy...</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Applying competitor-standard structured layout</span>
                </div>
              )}

              {segment === "sell" || segment === "need" ? (
                <NeedCard post={previewSellOrNeedPost} />
              ) : segment === "service" ? (
                <ServiceCard post={previewServicePost} />
              ) : (
                <ShopCard post={previewShopPost} />
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
