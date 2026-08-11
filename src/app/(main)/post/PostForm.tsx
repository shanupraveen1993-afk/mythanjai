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
  Video,
  Globe,
  Clock,
  Calendar,
  IndianRupee,
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
    imagePlaceholder: string;
    maxTitleChars: number;
    maxDescChars: number;
  }
> = {
  sell: {
    title: "Post Item for Sale",
    badge: "Sell Marketplace",
    buttonLabel: "Publish Post →",
    redirectPath: "/sell",
    categories: CLASSIFIED_CATEGORIES,
    accentColor: "bg-yellow-500 hover:bg-yellow-400 border-yellow-400 text-slate-950 font-bold",
    imagePlaceholder: "📷 Upload product photo (JPEG/PNG, max 5MB)",
    maxTitleChars: 70,
    maxDescChars: 1000,
  },
  need: {
    title: "Post Buyer Requirement",
    badge: "Need Request",
    buttonLabel: "Publish Requirement →",
    redirectPath: "/need",
    categories: CLASSIFIED_CATEGORIES,
    accentColor: "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white font-bold",
    imagePlaceholder: "📷 Upload reference photo (Optional)",
    maxTitleChars: 70,
    maxDescChars: 500,
  },
  service: {
    title: "Register Skilled Service",
    badge: "Verified Local Trade",
    buttonLabel: "Publish Listing →",
    redirectPath: "/services",
    categories: SERVICE_CATEGORIES,
    accentColor: "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white font-bold",
    imagePlaceholder: "📷 Upload profile or workplace photo",
    maxTitleChars: 60,
    maxDescChars: 800,
  },
  offer: {
    title: "Post Store Offer & Deal",
    badge: "Local Store Deal",
    buttonLabel: "Publish Store Offer →",
    redirectPath: "/shops",
    categories: SHOP_CATEGORIES,
    accentColor: "bg-purple-600 hover:bg-purple-500 border-purple-500 text-white font-bold",
    imagePlaceholder: "📷 Upload visiting card or deal poster",
    maxTitleChars: 70,
    maxDescChars: 800,
  },
};

export default function PostForm({ segment }: PostFormProps) {
  const router = useRouter();
  const config = SEGMENT_CONFIG[segment];
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>(TANJORE_LOCALITIES[0]);
  const [category, setCategory] = useState<string>(config.categories[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
      const cleanDesc = description.trim();

      if (segment === "sell" || segment === "need") {
        await addDoc(collection(db, "needs_and_sales"), {
          userId: uid,
          type: segment === "sell" ? "SELL" : "NEED",
          title: title.trim(),
          description: cleanDesc,
          raw_text: cleanDesc,
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
          description: cleanDesc,
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
          offer_description: cleanDesc,
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

  // Direct 1:1 Live Preview Cards Data
  const previewSellOrNeedPost = useMemo<NeedOrSalePost>(() => {
    return {
      id: "preview_post",
      userId: user?.uid || "preview_user",
      type: segment === "sell" ? "SELL" : "NEED",
      raw_text: description.trim(),
      title: title.trim() || (segment === "sell" ? "Sample Item Title" : "Sample Requirement Title"),
      description: description.trim() || "Live preview description will appear here as you type...",
      category: category || config.categories[0],
      area_tag: area || TANJORE_LOCALITIES[0],
      price: price || (segment === "sell" ? "2500000" : "10000"),
      phone: phone || "9876543210",
      image_url: imagePreview || "/thanjavur_temple_illustration.png",
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 86400000) as any,
    };
  }, [title, description, category, area, price, phone, imagePreview, segment, user, config.categories]);

  const previewServicePost = useMemo<ServiceProviderPost>(() => {
    return {
      id: "preview_service",
      userId: user?.uid || "preview_user",
      name: title.trim() || "Senthil Kumar — Electrician",
      skill_category: category || config.categories[0],
      experience: experience || "5+ Years",
      working_hours: workingHours || "9 AM – 8 PM",
      phone: phone || "9876543210",
      area_tag: area || TANJORE_LOCALITIES[0],
      rating: 5.0,
      description: description.trim() || "Professional trade service details...",
      image_url: imagePreview || "",
      is_verified: true,
      created_at: new Date() as any,
    };
  }, [title, description, category, area, experience, workingHours, phone, imagePreview, user, config.categories]);

  const previewShopPost = useMemo<ShopPost>(() => {
    return {
      id: "preview_shop",
      userId: user?.uid || "preview_user",
      shop_name: title.trim() || "GLEN Exclusive Store",
      category: category || config.categories[0],
      address_text: `${area}, Thanjavur`,
      landmark: "Near Main Road",
      hours: workingHours || "9 AM – 9 PM",
      phone: phone || "9876543210",
      area_tag: area || TANJORE_LOCALITIES[0],
      offer_title: title.trim() || "Exclusive Discount Offer",
      offer_description: description.trim() || "Special offer details and promotion terms...",
      image_url: imagePreview || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
      latitude: 10.7870,
      longitude: 79.1378,
      is_claimed: true,
      created_at: new Date() as any,
    };
  }, [title, description, category, area, workingHours, phone, imagePreview, user, config.categories]);

  const formattedPriceBadge = formatIndianCurrencyText(price);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 pb-24 flex flex-col gap-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col items-center border-b border-slate-200 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {config.badge}
        </span>
        <h1 className="font-heading font-bold text-lg sm:text-xl text-slate-900 tracking-tight mt-0.5">
          {config.title}
        </h1>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 flex flex-col items-center text-center gap-3 animate-fade-in my-8 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="font-heading font-bold text-lg text-emerald-900">Post Published Successfully!</h2>
          <p className="text-xs text-emerald-700 font-medium">Redirecting to feed...</p>
        </div>
      ) : (
        /* PURE HUMAN 2-COLUMN SPLIT LAYOUT (OLX STANDARD) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Form Controls */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-4 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
            
            {/* TOP PRIMARY VISITING CARD / SHOP BANNER UPLOADER (FOR OFFERS & SERVICES) */}
            {(segment === "offer" || segment === "service") && (
              <div className="w-full bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-purple-500/10 border-2 border-dashed border-yellow-400 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 transition-all hover:border-yellow-500 group relative">
                {imagePreview ? (
                  <div className="relative w-full max-h-48 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={imagePreview} alt="Visiting card preview" className="w-full h-48 object-cover" />
                    <label className="absolute bottom-2 right-2 bg-slate-950/85 hover:bg-slate-950 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 backdrop-blur-xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change Photo</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer py-3">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-slate-950 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                      <Camera className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-heading font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight">
                        🎴 Snap or Upload Store Visiting Card / Banner *
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 mt-0.5 max-w-sm">
                        Upload your physical shop visiting card, store board photo, or offer flyer image for 1-tap local posting.
                      </span>
                    </div>
                    <span className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-yellow-400 shadow-2xs mt-1">
                      Upload Visiting Card Photo →
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {/* Title with Character Limit Counter */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  {segment === "service" ? "Service or technician name *" : segment === "offer" ? "Store name & deal title *" : "Posting title or item name *"}
                </label>
                <span className={`text-[10px] font-medium ${title.length >= config.maxTitleChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                  {title.length}/{config.maxTitleChars}
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={config.maxTitleChars}
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
                className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                {config.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Location in Thanjavur *
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 cursor-pointer"
              >
                {TANJORE_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* PRICE INPUT WITH INLINE BADGE (e.g. ₹2.5 Cr / ₹25 Lakhs) */}
            {(segment === "sell" || segment === "need") && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    {segment === "sell" ? "Price (₹)" : "Budget (₹)"}
                  </label>
                  {formattedPriceBadge && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {formattedPriceBadge}
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="Enter amount (e.g. 2500000 or 25000000)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            )}

            {/* Service Specific Fields */}
            {segment === "service" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8+ Years Experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Working Hours
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9 AM – 8 PM"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Offer Specific Dates & Maps */}
            {segment === "offer" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Valid From Date
                    </label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Valid To Date
                    </label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Exact Google Maps link (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>
              </>
            )}

            {/* Sell Specific Links */}
            {segment === "sell" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-red-500" /> YouTube video URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-500" /> Google Maps URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Contact Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact phone number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Description with Character Limit Counter */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Description or details
                </label>
                <span className={`text-[10px] font-medium ${description.length >= config.maxDescChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                  {description.length}/{config.maxDescChars}
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={config.maxDescChars}
                placeholder="Describe your item, features, or service details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>

            {/* Photo Upload (Only for Sell & Need, since Offer & Service use top visiting card upload container) */}
            {segment !== "offer" && segment !== "service" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>{config.imagePlaceholder}</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-xs text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 ${config.accentColor} text-xs uppercase tracking-wider rounded-lg border shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2`}
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

          {/* RIGHT COLUMN: Instant 1:1 Live Preview Card */}
          <div className="lg:col-span-5 sticky top-20 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700">
                Live Card Preview
              </span>
              <span className="text-[10px] text-slate-400">Instant preview</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col gap-3">
              {segment === "sell" || segment === "need" ? (
                <NeedCard post={previewSellOrNeedPost} isPreview={true} />
              ) : segment === "service" ? (
                <ServiceCard post={previewServicePost} isPreview={true} />
              ) : (
                <ShopCard post={previewShopPost} isPreview={true} />
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
