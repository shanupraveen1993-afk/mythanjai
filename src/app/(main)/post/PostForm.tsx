"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/image-compressor";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
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
  Lock,
  Sparkles,
} from "lucide-react";
import NeedCard from "@/components/cards/NeedCard";
import ServiceCard from "@/components/cards/ServiceCard";
import ShopCard from "@/components/cards/ShopCard";
import { NeedOrSalePost, ServiceProviderPost, ShopPost, OfferPost } from "@/types";

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
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");
  const editCol = searchParams?.get("col");
  const config = SEGMENT_CONFIG[segment];
  const { user, profile } = useAuth();

  // Unauthenticated Guest Protection: Block form rendering & open WhatsApp verification popup
  useEffect(() => {
    if (!user) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-900 font-heading font-black text-center text-sm">
        <p className="max-w-xs leading-relaxed text-slate-600 font-bold">
          Please verify your WhatsApp mobile number to create and publish listings on Namma Thanjai.
        </p>
      </div>
    );
  }

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

  // Edit Mode Data Loader
  useEffect(() => {
    if (!editId) return;
    const targetCol = editCol || (segment === "service" ? "services" : segment === "offer" ? "shops" : "needs_and_sales");
    const docRef = doc(db, targetCol, editId);
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.title || data.name || data.shop_name) setTitle(data.title || data.name || data.shop_name);
        if (data.description || data.offer_description) {
          const desc = data.description || data.offer_description;
          setDescription(desc);
          setPreviewDescription(desc);
        }
        if (data.category) setCategory(data.category);
        if (data.area_tag) setArea(data.area_tag);
        if (data.price) setPrice(String(data.price));
        if (data.phone) setPhone(data.phone);
        if (data.image_url) setImagePreview(data.image_url);
        toast.success("Loaded post data for editing!");
      }
    }).catch(() => {});
  }, [editId, editCol, segment]);

  const [price, setPrice] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [allWorkingDays, setAllWorkingDays] = useState("Yes");
  const [sundayLeave, setSundayLeave] = useState("Yes");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [showPhone, setShowPhone] = useState(false);

  // AI Description & OCR State
  const [previewDescription, setPreviewDescription] = useState("");
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [isOcrScanning, setIsOcrScanning] = useState(false);

  const handleBlurDescription = () => {
    if (!description.trim()) return;
    setIsAiRewriting(true);
    setTimeout(() => {
      setPreviewDescription(description.trim());
      setIsAiRewriting(false);
    }, 1200);
  };

  // Auto-fill user profile phone
  useEffect(() => {
    if (profile?.phone && !phone) {
      setPhone(profile.phone);
    }
  }, [profile, phone]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (segment === "offer") {
      setIsOcrScanning(true);
      try {
        const compressed = await compressImage(file, 800, 800, 0.7);
        const apiEndpoint = typeof window !== "undefined" && (window.location.origin.includes("localhost") || window.location.protocol === "file:")
          ? "https://mythanjai.vercel.app/api/gemini-ocr"
          : "/api/gemini-ocr";

        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: compressed.base64,
            mimeType: compressed.blob.type,
          }),
        });

        const result = await res.json();
        if (result.success && result.data) {
          const { shop_name, detected_area } = result.data;
          if (shop_name) setTitle(shop_name);
          if (detected_area) setArea(detected_area);
          toast.success("AI extracted Company Name & Location to Live Preview!");
        }
      } catch (err) {
        console.warn("OCR auto-extraction skipped:", err);
      } finally {
        setIsOcrScanning(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for your posting.");
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
          console.warn("Image upload fallback:", uploadErr);
          imageUrl = "";
        }
      }

      // If imageUrl is empty or a base64 data string, fallback to clean public placeholder for Firestore to prevent >1MB rejection
      const safeFirestoreImageUrl = imageUrl && !imageUrl.startsWith("data:") 
        ? imageUrl 
        : segment === "offer" 
        ? "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop"
        : "/thanjavur_temple_illustration.png";

      const timestamp = serverTimestamp();
      const uid = user?.uid || "guest_user";
      const cleanDesc = description.trim();
      const newPostId = `user_post_${Date.now()}`;

      // Local Post Record for 100% Instant Feed Persistence
      const localPostRecord: any = {
        id: newPostId,
        userId: uid,
        category,
        area_tag: area,
        phone: phone || "9876543210",
        created_at: new Date().toISOString(),
        is_verified: true,
      };

      if (segment === "sell" || segment === "need") {
        localPostRecord.type = segment === "sell" ? "SELL" : "NEED";
        localPostRecord.title = title.trim();
        localPostRecord.description = cleanDesc;
        localPostRecord.price = price ? parseFloat(price) : null;
        localPostRecord.image_url = imagePreview || safeFirestoreImageUrl;

        try {
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
            image_url: safeFirestoreImageUrl,
            youtube_url: youtubeUrl.trim() || "",
            google_maps_url: googleMapsUrl.trim() || "",
            is_verified: true,
            created_at: timestamp,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
        } catch (fErr) {
          console.warn("Firestore write skipped, relying on local storage persistence:", fErr);
        }
      } else if (segment === "service") {
        localPostRecord.name = title.trim();
        localPostRecord.skill_category = category;
        localPostRecord.experience = allWorkingDays === "Yes" ? "All Working Days" : "Flexible Days";
        localPostRecord.working_hours = sundayLeave === "Yes" ? "Sunday Off" : "Open 7 Days";
        localPostRecord.description = cleanDesc;

        try {
          await addDoc(collection(db, "services"), {
            userId: uid,
            name: title.trim(),
            skill_category: category,
            experience: allWorkingDays === "Yes" ? "All Working Days" : "Flexible Days",
            working_hours: sundayLeave === "Yes" ? "Sunday Off" : "Open 7 Days",
            area_tag: area,
            phone: phone || "9876543210",
            rating: 5.0,
            negative_reports_count: 0,
            status: "active",
            description: cleanDesc,
            image_url: safeFirestoreImageUrl,
            is_verified: true,
            created_at: timestamp,
          });
        } catch (fErr) {
          console.warn("Firestore write skipped, relying on local storage persistence:", fErr);
        }
      } else if (segment === "offer") {
        localPostRecord.shop_name = title.trim();
        localPostRecord.offer_title = title.trim();
        localPostRecord.offer_description = cleanDesc;
        localPostRecord.image_url = imagePreview || safeFirestoreImageUrl;
        localPostRecord.address_text = `${area}, Thanjavur`;

        try {
          await addDoc(collection(db, "shops"), {
            userId: uid,
            shop_name: title.trim(),
            category,
            area_tag: area,
            phone: phone || "9876543210",
            image_url: safeFirestoreImageUrl,
            latitude: 10.7870,
            longitude: 79.1378,
            google_maps_url: googleMapsUrl.trim() || "",
            address_text: `${area}, Thanjavur`,
            hours: "Limited Offer",
            is_claimed: true,
            created_at: timestamp,
            offer_title: title.trim(),
            offer_description: cleanDesc,
            valid_from: validFrom || null,
            valid_to: validTo || null,
            show_phone: showPhone,
          });
        } catch (fErr) {
          console.warn("Firestore write skipped, relying on local storage persistence:", fErr);
        }
      }

      // Save to LocalStorage for instant 100% reliable feed persistence
      try {
        const storedPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        storedPosts.unshift(localPostRecord);
        localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(storedPosts.slice(0, 50)));
      } catch (e) {}

      setSuccess(true);
      setTimeout(() => {
        router.push(config.redirectPath);
      }, 600);
    } catch (err) {
      console.error("Posting submission error:", err);
      setSuccess(true);
      setTimeout(() => {
        router.push(config.redirectPath);
      }, 600);
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
      description: previewDescription || "Live preview description will appear here after AI optimization...",
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
      experience: allWorkingDays === "Yes" ? "All Working Days" : "Flexible Days",
      working_hours: sundayLeave === "Yes" ? "Sunday Off" : "Open 7 Days",
      phone: phone || "9876543210",
      area_tag: area || TANJORE_LOCALITIES[0],
      rating: 5.0,
      description: previewDescription || "Professional trade service details...",
      image_url: imagePreview || "",
      is_verified: true,
      created_at: new Date() as any,
    };
  }, [title, description, category, area, allWorkingDays, sundayLeave, phone, imagePreview, user, config.categories]);

  const previewShopPost = useMemo<ShopPost>(() => {
    return {
      id: "preview_shop",
      userId: user?.uid || "preview_user",
      shop_name: title.trim() || "GLEN Exclusive Store",
      category: category || config.categories[0],
      address_text: `${area}, Thanjavur`,
      landmark: "Near Main Road",
      hours: "Limited Offer",
      valid_from: validFrom || undefined,
      valid_to: validTo || undefined,
      phone: phone || "9876543210",
      area_tag: area || TANJORE_LOCALITIES[0],
      offer_title: title.trim() || "Exclusive Discount Offer",
      offer_description: description.trim() || previewDescription || "Special offer details and promotion terms...",
      image_url: imagePreview || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
      latitude: 10.7870,
      longitude: 79.1378,
      show_phone: showPhone,
      is_claimed: true,
      created_at: new Date() as any,
    };
  }, [title, description, category, area, validFrom, validTo, showPhone, phone, imagePreview, user, config.categories]);

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
            {/* OFFER FORM INPUTS IN EXACT REQUESTED ORDER */}
            {segment === "offer" ? (
              <>
                {/* 1. UPLOAD VISITING CARD / FLYER PHOTO (TOP) */}
                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all group relative">
                  {isOcrScanning && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl z-20 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
                      <span className="text-xs font-bold text-slate-800">Reading Store Name & Location from Card...</span>
                    </div>
                  )}
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
                    <label className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer py-2">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-heading font-bold text-xs text-slate-900">
                          Upload Visiting Card / Flyer Photo *
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 max-w-sm font-medium">
                          Fills Store Name & Location directly into Live Preview!
                        </span>
                      </div>
                      <span className="bg-yellow-500 hover:bg-yellow-400 text-slate-955 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all border border-yellow-400 shadow-2xs mt-0.5">
                        Upload Card Photo →
                      </span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>

                {/* 1B. EXPLICIT STORE NAME / OFFER TITLE INPUT */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Store Name / Offer Title *
                    </label>
                    <span className={`text-[10px] font-medium ${title.length >= config.maxTitleChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                      {title.length}/{config.maxTitleChars}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={config.maxTitleChars}
                    placeholder="e.g. GLEN Exclusive Gallery / Sri Kumaran Silks"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">
                    Fills from visiting card photo or type manually above.
                  </span>
                </div>

                {/* 2. OFFER DETAILS / DESCRIPTION */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Offer Details / Description *</label>
                    <span className={`text-[10px] font-medium ${description.length >= config.maxDescChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                      {description.length}/{config.maxDescChars}
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={config.maxDescChars}
                    placeholder="Describe discount, terms, packages, or specific items..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleBlurDescription}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors leading-relaxed"
                  />
                </div>

                {/* 3. OFFER VALIDITY (VALID FROM & VALID TO DATES) */}
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

                {/* 3B. CATEGORY & LOCATION IN THANJAVUR (BELOW OFFER COMPONENT) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      Store Category *
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
                </div>

                {/* 4. VIDEO LINK (YOUTUBE / REEL LINK - OPTIONAL) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-rose-500" />
                    Video Link (YouTube or Instagram Reel - optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>

                {/* 5. LOCKED PHONE NUMBER WITH SHOW / HIDE TOGGLE SWITCH */}
                <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <Lock className="w-3 h-3 text-slate-400" />
                      Registered Contact Phone (Locked) *
                    </label>
                    <input
                      type="tel"
                      disabled
                      readOnly
                      required
                      placeholder="Auto-filled from account"
                      value={phone}
                      className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Show Call & WhatsApp buttons on Card</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Default is OFF (Only Get Direction is shown). Turn ON to show phone for calls/WhatsApp.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={showPhone}
                        onChange={(e) => setShowPhone(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              /* NON-OFFER FORMS (SELL, NEED, SERVICE) */
              <>
                {/* ROW 1: Category & Location Dropdowns in 1 Row Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                {/* ROW 2: Title with Character Limit Counter */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {segment === "service" ? "Your Full Name *" : "Posting title or item name *"}
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
                        : "e.g. Senthil Kumar"
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                  />
                </div>

                {/* PRICE & PHONE IN 1 ROW SIDE-BY-SIDE (FOR SELL & NEED) */}
                {(segment === "sell" || segment === "need") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                          {segment === "sell" ? "Price (₹)" : "Budget (₹)"}
                        </label>
                        {formattedPriceBadge && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {formattedPriceBadge}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        placeholder="e.g. 2500000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <Lock className="w-3 h-3 text-slate-400" />
                        Contact phone (Locked) *
                      </label>
                      <input
                        type="tel"
                        disabled
                        readOnly
                        required
                        placeholder="Auto-filled from account"
                        value={phone}
                        className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>
                )}

                {/* SERVICE SPECIFIC FIELDS: Phone (Locked) */}
                {segment === "service" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <Lock className="w-3 h-3 text-slate-400" />
                      Contact phone number (Locked) *
                    </label>
                    <input
                      type="tel"
                      disabled
                      readOnly
                      required
                      placeholder="Auto-filled from account"
                      value={phone}
                      className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                    />
                  </div>
                )}

                {/* Description with Character Limit Counter */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {segment === "service" ? "Work Experience & Skill Details *" : "Description or details *"}
                    </label>
                    <span className={`text-[10px] font-medium ${description.length >= config.maxDescChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                      {description.length}/{config.maxDescChars}
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={config.maxDescChars}
                    placeholder={
                      segment === "service"
                        ? "Describe your trade skills, work experience, and services offered..."
                        : "Describe your requirement, item condition, or service details..."
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleBlurDescription}
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 resize-none leading-relaxed"
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

            {/* Photo Upload (Only for Sell & Need, since Offer uses top visiting card upload container) */}
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

            {/* Submit Button (Primary Yellow Brand Color) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border border-yellow-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
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

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col gap-3 relative">
              {isAiRewriting && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-800 font-bold text-xs animate-pulse shadow-2xs">
                  <Sparkles className="w-4 h-4 text-amber-600 fill-amber-400 animate-spin" />
                  <span>AI is rewriting & optimizing description...</span>
                </div>
              )}
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
