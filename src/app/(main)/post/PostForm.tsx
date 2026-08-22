"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  X,
} from "lucide-react";
import ListingCard from "@/components/cards/ListingCard";
import ServiceCard from "@/components/cards/ServiceCard";
import ShopCard from "@/components/cards/ShopCard";
import ThanjavurLocationInput from "@/components/location/ThanjavurLocationInput";
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
    accentColor: "bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 font-black",
    imagePlaceholder: "📷 Upload item photo (max 5MB)",
    maxTitleChars: 70,
    maxDescChars: 1000,
  },
  need: {
    title: "Post Your Need",
    badge: "Need Request",
    buttonLabel: "Publish Requirement →",
    redirectPath: "/need",
    categories: CLASSIFIED_CATEGORIES,
    accentColor: "bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 font-black",
    imagePlaceholder: "📷 Upload reference photo (Optional)",
    maxTitleChars: 70,
    maxDescChars: 500,
  },
  service: {
    title: "Register Service Profile",
    badge: "Verified Local Trade",
    buttonLabel: "Publish Service →",
    redirectPath: "/services",
    categories: SERVICE_CATEGORIES,
    accentColor: "bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 font-black",
    imagePlaceholder: "📷 Upload profile or workplace photo",
    maxTitleChars: 60,
    maxDescChars: 800,
  },
  offer: {
    title: "Post Store Offer",
    badge: "Local Store Deal",
    buttonLabel: "Publish Store Offer →",
    redirectPath: "/shops",
    categories: SHOP_CATEGORIES,
    accentColor: "bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 font-black",
    imagePlaceholder: "📷 Upload visiting card or flyer poster",
    maxTitleChars: 70,
    maxDescChars: 600,
  },
};

export default function PostForm({ segment }: PostFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [editCol, setEditCol] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setEditId(params.get("edit"));
      setEditCol(params.get("col"));
    }
  }, []);

  const config = SEGMENT_CONFIG[segment];
  const { user, profile, isVerified, loading: authLoading } = useAuth();
  const isAuthVerified = isVerified;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>("");
  const [category, setCategory] = useState<string>(config.categories[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  // Sell: supports up to 3 images
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [price, setPrice] = useState("");
  const [hasSpecificPrice, setHasSpecificPrice] = useState<boolean>(true);
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
  const [aiRefining, setAiRefining] = useState(false);

  useEffect(() => {
    if (!description.trim()) {
      setAiRefining(false);
      return;
    }
    setAiRefining(true);
    const timer = setTimeout(() => {
      setAiRefining(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [description]);

  // Unauthenticated Guest Protection: Wait for auth to finish loading before checking guest status
  useEffect(() => {
    if (!authLoading && !isAuthVerified) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
    }
  }, [authLoading, isAuthVerified]);

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

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500 font-heading font-bold text-xs gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
        <span>Loading details...</span>
      </div>
    );
  }

  if (!isAuthVerified) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-900 font-heading font-black text-center text-sm">
        <p className="max-w-xs leading-relaxed text-slate-600 font-bold">
          Please verify your WhatsApp mobile number to create and publish listings on Namma Thanjai.
        </p>
      </div>
    );
  }

  const getApiUrl = (endpoint: string) => {
    if (typeof window !== "undefined") {
      const isNative = (window as any).Capacitor?.isNativePlatform() || window.location.protocol === "file:" || window.location.origin.includes("localhost");
      if (isNative) {
        return `https://mythanjai.vercel.app${endpoint}`;
      }
    }
    return endpoint;
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        toast.error("Video file size must be under 25MB.");
        return;
      }
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      toast.success("Store Video Flyer attached!");
    }
  };

  const handleBlurDescription = async () => {
    if (!description.trim()) return;
    setIsAiRewriting(true);
    try {
      const res = await fetch(getApiUrl("/api/gemini-format"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawDescription: description,
          type: segment,
        }),
      });
      const data = await res.json();
      if (data.success && data.formattedText) {
        setPreviewDescription(data.formattedText);
        if (data.extractedFields && segment === "offer") {
          const { shop_name, valid_from: extFrom, valid_to: extTo, area_tag, category: extCategory } = data.extractedFields;
          if (shop_name && !title) setTitle(shop_name);
          if (extFrom) setValidFrom(extFrom);
          if (extTo) setValidTo(extTo);
          if (area_tag) setArea(area_tag);
          if (extCategory && config.categories.includes(extCategory)) setCategory(extCategory);
          toast.success("AI extracted details & formatted description!");
        } else {
          toast.success("AI polished description!");
        }
      }
    } catch (err) {
      console.warn("AI format failed:", err);
      setPreviewDescription(description.trim());
    } finally {
      setIsAiRewriting(false);
    }
  };

  // Zero-Click Live AI Auto-Refining Effect (Debounced)
  useEffect(() => {
    if (!description.trim()) {
      setPreviewDescription("");
      return;
    }
    setPreviewDescription(description.trim());
    const timer = setTimeout(() => {
      handleBlurDescription();
    }, 650);
    return () => clearTimeout(timer);
  }, [description, segment]);

  // Track if user has manually edited the phone — prevents profile auto-fill from overwriting edits
  const userEditedPhone = React.useRef(false);

  // Auto-fill user profile phone (only if user hasn't manually touched the field)
  useEffect(() => {
    if (profile?.phone && !userEditedPhone.current) {
      setPhone(profile.phone);
    }
  }, [profile]);

  // Offer: single image with OCR; Sell: multi-image up to 3
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (segment === "sell") {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const remaining = 3 - selectedImages.length;
      const toAdd = files.slice(0, remaining);
      const newFiles = [...selectedImages, ...toAdd].slice(0, 3);
      setSelectedImages(newFiles);
      // Generate previews for new files
      const previews = await Promise.all(
        newFiles.map(
          (f) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(f);
            })
        )
      );
      setImagePreviews(previews);
      return;
    }
    // Offer single image
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    if (segment === "offer") {
      setIsOcrScanning(true);
      try {
        const compressed = await compressImage(file, 800, 800, 0.7);
        const apiEndpoint = getApiUrl("/api/gemini-ocr");
        const res = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: compressed.base64, mimeType: compressed.blob.type }) });
        const result = await res.json();
        if (result.success && result.data) {
          const { shop_name, detected_area, category: ocrCat, phone: ocrPhone } = result.data;
          if (shop_name) setTitle(shop_name);
          if (detected_area) setArea(detected_area);
          if (ocrCat && config.categories.includes(ocrCat)) setCategory(ocrCat);
          if (ocrPhone) setPhone(ocrPhone);
          toast.success("AI extracted Company Name, Location, Category & Phone!");
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

    // ── STEP 0: Quota Enforcement (Max 3 Posts per phone, Unlimited for 9994837342 & Admins) ──
    const targetPhone = (phone || profile?.phone || "").replace(/\D/g, "");
    const isAdminUser = targetPhone.includes("9994837342") || profile?.isAdmin;

    if (!isAdminUser && targetPhone) {
      try {
        const localPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
        const matchingLocal = localPosts.filter((p: any) => String(p.phone || "").replace(/\D/g, "").includes(targetPhone));
        if (matchingLocal.length >= 3) {
          toast.error(`Posting Quota Exceeded! Mobile number +91 ${targetPhone.slice(-10)} has reached the limit of 3 posts. Please delete an older post from your profile to publish a new one.`);
          return;
        }
      } catch (e) {}
    }

    setLoading(true);

    const timestamp = serverTimestamp();
    const uid = user?.uid || "guest_user";
    const cleanDesc = description.trim();
    const newPostId = `user_post_${Date.now()}`;

    // ── STEP 1: Build local record immediately ───────────────────────────────
    const safeFirestoreImageUrl =
      imagePreview && !imagePreview.startsWith("data:")
        ? imagePreview
        : segment === "offer"
        ? "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop"
        : "/thanjavur_temple_illustration.png";

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
      localPostRecord.price = price || null;
      localPostRecord.show_phone = showPhone;
      localPostRecord.image_url =
        segment === "sell" && imagePreviews.length > 0
          ? imagePreviews[0]
          : imagePreview || safeFirestoreImageUrl;
      if (segment === "sell" && imagePreviews.length > 0) {
        localPostRecord.image_urls = imagePreviews;
      }
    } else if (segment === "service") {
      localPostRecord.name = title.trim();
      localPostRecord.skill_category = category;
      localPostRecord.is_available_now = isAvailable;
      localPostRecord.experience = allWorkingDays === "Yes" ? "All Working Days" : "Flexible Days";
      localPostRecord.working_hours = sundayLeave === "Yes" ? "Sunday Off" : "Open 7 Days";
      localPostRecord.description = cleanDesc;
      localPostRecord.image_url = imagePreview || safeFirestoreImageUrl;
    } else if (segment === "offer") {
      localPostRecord.shop_name = title.trim();
      localPostRecord.offer_title = title.trim();
      localPostRecord.offer_description = cleanDesc;
      localPostRecord.image_url = imagePreview || safeFirestoreImageUrl;
      localPostRecord.video_url = videoPreview || youtubeUrl || "";
      localPostRecord.address_text = area ? `${area}, Thanjavur` : "Thanjavur";
    }

    // ── STEP 2: Persist locally & redirect IMMEDIATELY (optimistic) ──────────
    try {
      const storedPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      storedPosts.unshift(localPostRecord);
      localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(storedPosts.slice(0, 50)));
    } catch (e) {}

    setSuccess(true);
    setLoading(false);
    toast.success("Post published! Syncing in background...");
    router.push(config.redirectPath);

    // ── STEP 3: Upload images + Firestore write in background (non-blocking) ──
    (async () => {
      try {
        let imageUrl = safeFirestoreImageUrl;
        let imageUrls: string[] = [];

        // Only upload if a new local File was chosen (not an existing URL)
        if (segment === "sell" && selectedImages.length > 0) {
          imageUrls = await Promise.all(
            selectedImages.map(async (img) => {
              const compressed = await compressImage(img);
              const storageRef = ref(storage, `postings/${Date.now()}_${img.name}`);
              const snapshot = await uploadBytes(storageRef, compressed.blob);
              return getDownloadURL(snapshot.ref);
            })
          );
          imageUrl = imageUrls[0] || imageUrl;
        } else if (selectedImage) {
          try {
            const compressed = await compressImage(selectedImage);
            const storageRef = ref(storage, `postings/${Date.now()}_${selectedImage.name}`);
            const snapshot = await uploadBytes(storageRef, compressed.blob);
            imageUrl = await getDownloadURL(snapshot.ref);
            imageUrls = [imageUrl];
          } catch {
            imageUrl = safeFirestoreImageUrl;
          }
        }

        if (segment === "sell" || segment === "need") {
          await addDoc(collection(db, "needs_and_sales"), {
            userId: uid,
            type: segment === "sell" ? "SELL" : "NEED",
            title: title.trim(),
            description: cleanDesc,
            raw_text: cleanDesc,
            category,
            area_tag: area,
            price: price || null,
            phone: phone || "9876543210",
            show_phone: showPhone,
            image_url: imageUrl,
            image_urls: imageUrls.length > 0 ? imageUrls : undefined,
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
            is_available_now: isAvailable,
            experience: allWorkingDays === "Yes" ? "All Working Days" : "Flexible Days",
            working_hours: sundayLeave === "Yes" ? "Sunday Off" : "Open 7 Days",
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
          let uploadedVideoUrl = "";
          if (selectedVideo) {
            try {
              const videoRef = ref(storage, `offer_reels/${Date.now()}_${selectedVideo.name}`);
              const snap = await uploadBytes(videoRef, selectedVideo);
              uploadedVideoUrl = await getDownloadURL(snap.ref);
            } catch (vErr) {
              console.warn("Video reel upload fallback:", vErr);
            }
          }
          await addDoc(collection(db, "shops"), {
            userId: uid,
            shop_name: title.trim(),
            category,
            area_tag: area,
            phone: phone || "9876543210",
            image_url: imageUrl,
            latitude: 10.787,
            longitude: 79.1378,
            google_maps_url: googleMapsUrl.trim() || "",
            address_text: area ? `${area}, Thanjavur` : "Thanjavur",
            hours: "Special Local Offer",
            is_claimed: true,
            created_at: timestamp,
            offer_title: title.trim(),
            offer_description: cleanDesc,
            valid_from: validFrom || null,
            valid_to: validTo || null,
            show_phone: showPhone,
            video_url: uploadedVideoUrl || "",
          });
        }
      } catch (bgErr) {
        console.warn("Background Firestore sync error (post already in local feed):", bgErr);
      }
    })();
  };

  // Direct 1:1 Live Preview Cards Data
  const previewSellOrNeedPost = useMemo<NeedOrSalePost>(() => {
    const activeCover = (imagePreviews && imagePreviews.length > 0) ? imagePreviews[0] : (imagePreview || "/thanjavur_temple_illustration.png");
    return {
      id: "preview_post",
      userId: user?.uid || "preview_user",
      type: segment === "sell" ? "SELL" : "NEED",
      raw_text: description.trim(),
      title: title.trim() || (segment === "sell" ? "Sample Item Title" : "Sample Requirement Title"),
      description: previewDescription || description.trim() || "Live preview description will appear here after AI optimization...",
      category: category || config.categories[0],
      area_tag: area || TANJORE_LOCALITIES[0],
      price: price || (segment === "sell" ? "2500000" : "10000"),
      phone: phone || profile?.phone || "+91 9994837342",
      image_url: activeCover,
      image_urls: imagePreviews,
      show_phone: showPhone,
      is_verified: true,
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 86400000) as any,
    };
  }, [title, description, previewDescription, category, area, price, phone, profile, imagePreview, imagePreviews, segment, user, config.categories, showPhone]);

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
  }, [title, description, previewDescription, category, area, allWorkingDays, sundayLeave, phone, imagePreview, user, config.categories]);

  const previewShopPost = useMemo<ShopPost>(() => {
    return {
      id: "preview_shop",
      userId: user?.uid || "preview_user",
      shop_name: title.trim() || "GLEN Exclusive Store",
      category: category || config.categories[0],
      address_text: area ? `${area}, Thanjavur` : "Thanjavur",
      landmark: "Near Main Road",
      hours: "Valid 30 Days",
      valid_from: validFrom || undefined,
      valid_to: validTo || undefined,
      phone: phone || "9876543210",
      area_tag: area || TANJORE_LOCALITIES[0],
      offer_title: title.trim() || "Exclusive Discount Offer",
      offer_description: previewDescription || description.trim() || "Special offer details and promotion terms...",
      image_url: imagePreview || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
      latitude: 10.7870,
      longitude: 79.1378,
      show_phone: showPhone,
      is_claimed: true,
      created_at: new Date() as any,
    };
  }, [title, description, previewDescription, category, area, validFrom, validTo, showPhone, phone, imagePreview, user, config.categories]);

  const formattedPriceBadge = formatIndianCurrencyText(price);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 pb-24 flex flex-col gap-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col items-center border-b border-slate-200 pb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
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
            {/* OFFER FORM INPUTS IN REVISED REQUESTED ORDER */}
            {segment === "offer" ? (
              <>
                {/* 1. UPLOAD VISITING CARD / FLYER PHOTO (TOP) */}
                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all group relative">
                  {isOcrScanning && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-xl z-20 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
                      <span className="text-xs font-bold text-slate-800">Reading Store Name & Location from Card...</span>
                    </div>
                  )}
                  {imagePreview ? (
                    <div className="relative w-full max-h-48 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <img src={imagePreview} alt="Visiting card preview" className="w-full h-48 object-cover" />
                      <label className="absolute bottom-2 right-2 bg-slate-950/85 hover:bg-slate-950 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 backdrop-blur-xs">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <label className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer py-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-heading font-bold text-xs text-slate-900">
                          Upload Visiting Card / Flyer Photo *
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5 max-w-sm font-medium">
                          Fills Store Name & Location directly into Live Preview!
                        </span>
                      </div>
                      <span className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all border border-amber-400 shadow-2xs mt-0.5">
                        Upload Card Photo →
                      </span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>

                {/* OPTIONAL VIDEO FLYER UPLOAD (FOR STORE OFFER) — Styled identical to Card Photo Upload */}
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Store Video Promo / Reel (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-medium">MP4/MOV &lt; 25MB</span>
                  </label>
                  {videoPreview ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 group flex items-center justify-center">
                      <video src={videoPreview} className="w-full h-full object-cover" controls muted />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoPreview("");
                          setSelectedVideo(null);
                        }}
                        className="absolute top-2 right-2 z-20 bg-slate-900/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow cursor-pointer"
                        title="Remove Video"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 hover:bg-amber-500/5 group">
                      <Video className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors mb-1" />
                      <span className="text-xs font-bold text-slate-800">Upload Store Video Promo / Reel</span>
                      <span className="text-[10px] text-slate-500 font-medium">Click to attach video file</span>
                      <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                    </label>
                  )}
                </div>

                {/* 2. EXPLICIT SHOP NAME INPUT */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Shop Name *
                    </label>
                    <span className={`text-xs font-medium ${title.length >= config.maxTitleChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
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
                </div>

                {/* 3. OFFER DESCRIPTION */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-700">Offer Description *</label>
                      <button
                        type="button"
                        onClick={handleBlurDescription}
                        disabled={isAiRewriting || !description.trim()}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isAiRewriting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>AI Formatting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                            <span>✨ AI Auto-Format</span>
                          </>
                        )}
                      </button>
                    </div>
                    <span className={`text-xs font-medium ${description.length >= config.maxDescChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
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
                    className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 ring-1 ring-slate-400 transition-colors leading-relaxed"
                  />
                </div>

                {/* 4. OFFER VALIDITY RANGE (VALID FROM TO VALID TO DATES) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" /> Valid From Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" /> Valid To Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* 5. ADDRESS */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Shop Address & Locality *</span>
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Type your shop address or location..."
                    className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>

                {/* 7. PHONE NUMBER VISIBILITY TOGGLE (YES / NO) */}
                <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Show Phone Number on Card (Yes / No)</span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Default is OFF. Turn ON to display your phone number on the offer card.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={showPhone}
                        onChange={(e) => setShowPhone(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                    </label>
                  </div>
                </div>
              </>
            ) : (
              /* NON-OFFER FORMS (SELL, NEED, SERVICE) */
              <>
                {/* ROW 1: Category only (full width for non-offer) */}
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

                {/* ROW 2: Title (for sell/need) or Name (for service) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {segment === "service" ? "Your Full Name *" : "Posting title or item name *"}
                    </label>
                    <span className={`text-xs font-medium ${title.length >= config.maxTitleChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
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

                {/* Service: Location below name */}
                {segment === "service" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      Service Location / Area *
                    </label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Anna Nagar, Medical College Rd, Vallam"
                      className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                )}

                {/* PRICE + LOCATION in 1 row (FOR SELL) */}
                {segment === "sell" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                          Price (₹)
                        </label>
                        {formattedPriceBadge && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {formattedPriceBadge}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 25,00,000 or 1200/sqft"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        Address / Location *
                      </label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Type your address or location..."
                        className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* BUDGET + LOCATION in 1 row (FOR NEED) */}
                {segment === "need" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                        Budget From (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 5000 (Optional)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        Preferred Locations (Up to 3) *
                      </label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. Medical College Rd, Old Bus Stand, Vallam"
                        className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* SERVICE SPECIFIC FIELDS: Phone (Editable) */}
                {segment === "service" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Contact phone number (Editable) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9994837342"
                      value={phone}
                      onChange={(e) => { userEditedPhone.current = true; setPhone(e.target.value); }}
                      className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                )}

                {/* SELL/NEED: Phone field (below location, above description) */}
                {(segment === "sell" || segment === "need") && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Contact phone number (Editable) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9994837342"
                      value={phone}
                      onChange={(e) => { userEditedPhone.current = true; setPhone(e.target.value); }}
                      className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                )}

                {/* Description with Character Limit Counter */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {segment === "service" ? "Work Experience & Skill Details *" : "Description or details *"}
                    </label>
                    <span className={`text-xs font-medium ${description.length >= config.maxDescChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
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
            )}

            {/* Sell Specific Phone Toggle */}
            {segment === "sell" && (
              <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Display your phone number publicly</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ON — Buyers can call or WhatsApp you directly from the listing. OFF — Phone is hidden.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>
            )}

            {/* Image Upload — Sell: multi (up to 3), Offer: handled separately above */}
            {segment === "sell" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Photos — up to 3 images (tap to add)</span>
                </label>

                {/* Preview strip */}
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs shrink-0">
                        <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = selectedImages.filter((_, i) => i !== idx);
                            const newPreviews = imagePreviews.filter((_, i) => i !== idx);
                            setSelectedImages(newFiles);
                            setImagePreviews(newPreviews);
                          }}
                          className="absolute top-0.5 right-0.5 bg-slate-950/80 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black cursor-pointer"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add more button — visible until 3 images */}
                {imagePreviews.length < 3 && (
                  <label className="w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 p-4 rounded-lg flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-2xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800">
                      {imagePreviews.length === 0 ? "Click to Upload Photos" : `Add More (${imagePreviews.length}/3)`}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">JPEG, PNG, WebP up to 5MB each</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </form>

          {/* RIGHT COLUMN: Instant 1:1 Live Preview Card */}
          <div className="lg:col-span-5 sticky top-20 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700">
                Live Card Preview
              </span>
              <span className="text-xs text-slate-400">Instant preview</span>
            </div>

            {/* AI Refinement Status Badge */}
            {aiRefining && (
              <div className="text-xs font-black text-amber-800 bg-amber-100 border border-amber-300 px-3.5 py-2 rounded-xl animate-pulse flex items-center justify-center gap-2 max-w-sm mx-auto shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                <span>✨ AI is refining your description...</span>
              </div>
            )}

            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col gap-3 relative">
              {isAiRewriting && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-800 font-bold text-xs animate-pulse shadow-2xs">
                  <Sparkles className="w-4 h-4 text-amber-600 fill-amber-400 animate-spin" />
                  <span>AI is rewriting & optimizing description...</span>
                </div>
              )}
              {segment === "sell" || segment === "need" ? (
                <ListingCard listing={previewSellOrNeedPost as any} />
              ) : segment === "service" ? (
                <ServiceCard post={previewServicePost} isPreview={true} />
              ) : (
                <ShopCard post={previewShopPost} isPreview={true} />
              )}
            </div>

            {/* Primary Submit Button Positioned Directly Below Live Preview Card */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 sm:py-4 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-md transition-all select-none mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F172A]" />
                  <span>Publishing Post...</span>
                </>
              ) : (
                <span>{config.buttonLabel}</span>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
