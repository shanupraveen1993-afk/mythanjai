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
  THANJAVUR_TOWNS,
  CLASSIFIED_CATEGORIES,
  SERVICE_CATEGORIES,
  SERVICE_SUBCATEGORIES_MAP,
  SHOP_CATEGORIES,
  formatIndianCurrencyText,
} from "@/lib/constants";
import GooglePlacesInput from "@/components/ui/GooglePlacesInput";
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
      setEditId(params.get("editId") || params.get("edit"));
      setEditCol(params.get("editCol") || params.get("col"));
    }
  }, []);

  const config = SEGMENT_CONFIG[segment];
  const { user, profile, isVerified, loading: authLoading } = useAuth();
  const isAuthVerified = isVerified;

  // Admin check at render level (used to show/hide admin-only UI like video upload)
  const isAdminUser = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("admin") === "true") return true;
      const storedPhone = localStorage.getItem("namma_thanjai_phone") || localStorage.getItem("my_thanjai_phone") || "";
      if (storedPhone.replace(/\D/g, "").includes("9994837342")) return true;
    }
    const rawPhone = String(profile?.phone || user?.phoneNumber || "");
    const cleanPhone = rawPhone.replace(/\D/g, "");
    return cleanPhone.includes("9994837342") || Boolean(profile?.isAdmin);
  }, [profile, user]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>("");
  const [category, setCategory] = useState<string>(config.categories[0]);
  const [subCategory, setSubCategory] = useState<string>("");
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
  const [sundayLeave, setSundayLeave] = useState("No");
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

  // Form submission handler
  // Unauthenticated Guest Protection: Handled on submit so guests can draft their post freely

  // Comprehensive Edit Mode Data Loader (Firestore + LocalStorage Fallback)
  useEffect(() => {
    if (!editId) return;

    const populateFields = (data: any) => {
      if (data.title || data.name || data.shop_name) setTitle(data.title || data.name || data.shop_name);
      if (data.description || data.offer_description) {
        const desc = data.description || data.offer_description;
        setDescription(desc);
        setPreviewDescription(desc);
      }
      if (data.area_tag) setArea(data.area_tag);
      if (data.price !== undefined && data.price !== null) setPrice(String(data.price));
      if (data.phone) setPhone(data.phone);
      if (data.show_phone !== undefined) setShowPhone(Boolean(data.show_phone));
      if (data.google_maps_url) setGoogleMapsUrl(data.google_maps_url);
      if (data.valid_from) setValidFrom(data.valid_from);
      if (data.valid_to) setValidTo(data.valid_to);
      if (data.image_url) setImagePreview(data.image_url);
      if (data.image_urls && Array.isArray(data.image_urls) && data.image_urls.length > 0) {
        setImagePreviews(data.image_urls);
      } else if (data.image_url) {
        setImagePreviews([data.image_url]);
      }
    };

    // 1. Try local storage first for instant load
    try {
      const localPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      const match = localPosts.find((p: any) => p.id === editId);
      if (match) {
        populateFields(match);
      }
    } catch (e) {}

    // 2. Fetch from Firestore for authoritative cloud data
    const targetCol = editCol || (segment === "service" ? "services" : segment === "offer" ? "shops" : "needs_and_sales");
    const docRef = doc(db, targetCol, editId);
    getDoc(docRef)
      .then((snap) => {
        if (snap.exists()) {
          populateFields(snap.data());
          toast.success("Loaded post data for editing!");
        }
      })
      .catch(() => {});
  }, [editId, editCol, segment]);



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

  const [isAiRefined, setIsAiRefined] = useState(false);

  const handleBlurDescription = async (textToFormat: string) => {
    if (!textToFormat.trim()) return;
    setIsAiRewriting(true);
    try {
      const res = await fetch(getApiUrl("/api/gemini-format"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawDescription: textToFormat,
          type: segment,
        }),
      });
      const data = await res.json();
      if (data.success && data.formattedText) {
        setPreviewDescription(data.formattedText);
        setIsAiRefined(true);
        if (data.extractedFields && segment === "offer") {
          const { shop_name, valid_from: extFrom, valid_to: extTo, area_tag, category: extCategory } = data.extractedFields;
          if (shop_name && !title) setTitle(shop_name);
          if (extFrom) setValidFrom(extFrom);
          if (extTo) setValidTo(extTo);
          if (area_tag) setArea(area_tag);
        }
      }
    } catch (err) {
      console.warn("AI format failed:", err);
    } finally {
      setIsAiRewriting(false);
    }
  };

  // Zero-Click Live AI Auto-Refining Effect (Debounced 600ms)
  useEffect(() => {
    if (!description.trim()) {
      setPreviewDescription("");
      setIsAiRefined(false);
      return;
    }
    setPreviewDescription(description.trim());
    setIsAiRefined(false);
    const timer = setTimeout(() => {
      handleBlurDescription(description);
    }, 600);
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
      // Compress selected images into lightweight WebP previews (<30KB per image)
      const previews = await Promise.all(
        newFiles.map(async (f) => {
          try {
            const comp = await compressImage(f, 600, 600, 0.6);
            return comp.base64;
          } catch {
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(f);
            });
          }
        })
      );
      setImagePreviews(previews);
      return;
    }
    // Offer single image
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    try {
      const comp = await compressImage(file, 600, 600, 0.6);
      setImagePreview(comp.base64);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    if (segment === "offer") {
      setIsOcrScanning(true);
      try {
        const compressed = await compressImage(file, 800, 800, 0.7);
        const apiEndpoint = getApiUrl("/api/gemini-ocr");
        const res = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: compressed.base64, mimeType: compressed.blob.type }) });
        const result = await res.json();
        if (result.success && result.data) {
          const { shop_name, detected_area, phone: ocrPhone } = result.data;
          if (shop_name) setTitle(shop_name);
          if (detected_area) setArea(detected_area);
          if (ocrPhone) setPhone(ocrPhone);
          toast.success("AI extracted Company Name, Location & Phone!");
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
    if (!isAuthVerified) {
      toast.info("Please verify your WhatsApp mobile number to publish your ad.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
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

    if (segment === "offer" && validFrom && validTo) {
      if (new Date(validTo) < new Date(validFrom)) {
        toast.error("Valid To date cannot be earlier than Valid From date!");
        return;
      }
    }

    setLoading(true);

    const timestamp = serverTimestamp();
    const uid = user?.uid || "guest_user";
    const cleanDesc = description.trim();
    const targetPostId = editId || `user_post_${Date.now()}`;

    const defaultCoverImage =
      imagePreviews.length > 0
        ? imagePreviews[0]
        : imagePreview && !imagePreview.startsWith("data:")
        ? imagePreview
        : segment === "offer"
        ? "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop"
        : "/thanjavur_temple_illustration.png";

    // ── STEP 1: Build & Persist Local Record IMMEDIATELY (0ms Delay) ─────────
    const localPostRecord: any = {
      id: targetPostId,
      userId: uid,
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
      localPostRecord.image_url = defaultCoverImage;
      if (imagePreviews.length > 0) {
        localPostRecord.image_urls = imagePreviews;
      }
    } else if (segment === "service") {
      localPostRecord.name = title.trim();
      localPostRecord.is_available_now = isAvailable;
      localPostRecord.experience = allWorkingDays === "Yes" ? "All Working Days" : "Flexible Days";
      localPostRecord.working_hours = sundayLeave === "Yes" ? "Sunday Off" : "Open 7 Days";
      localPostRecord.description = cleanDesc;
      localPostRecord.image_url = defaultCoverImage;
    } else if (segment === "offer") {
      localPostRecord.shop_name = title.trim();
      localPostRecord.offer_title = title.trim();
      localPostRecord.offer_description = cleanDesc;
      localPostRecord.image_url = defaultCoverImage;
      localPostRecord.video_url = videoPreview || youtubeUrl || "";
      localPostRecord.address_text = area ? `${area}, Thanjavur` : "Thanjavur";
    }

    try {
      let storedPosts = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      if (editId) {
        storedPosts = storedPosts.map((p: any) => (p.id === editId ? { ...p, ...localPostRecord } : p));
      } else {
        storedPosts.unshift(localPostRecord);
      }
      localStorage.setItem("namma_thanjai_local_posts", JSON.stringify(storedPosts.slice(0, 50)));
    } catch (e) {}

    // Instant UI Response & Navigation
    setSuccess(true);
    setLoading(false);
    toast.success(editId ? "Post updated successfully!" : "Post published successfully!");
    router.push(config.redirectPath);

    // ── STEP 2: Background Storage Upload & Firestore Cloud Sync ──────────────
    (async () => {
      try {
        let imageUrl = defaultCoverImage;
        let imageUrls: string[] = [];

        if (segment === "sell" && selectedImages.length > 0) {
          imageUrls = await Promise.all(
            selectedImages.map(async (img) => {
              try {
                const compressed = await compressImage(img);
                const storageRef = ref(storage, `postings/${Date.now()}_${img.name}`);
                const snapshot = await uploadBytes(storageRef, compressed.blob);
                return await getDownloadURL(snapshot.ref);
              } catch {
                const compressed = await compressImage(img);
                return compressed.base64 || defaultCoverImage;
              }
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
            try {
              const compressed = await compressImage(selectedImage);
              imageUrl = compressed.base64 || defaultCoverImage;
            } catch {
              imageUrl = defaultCoverImage;
            }
          }
        }

        const targetCol = editCol || (segment === "service" ? "services" : segment === "offer" ? "shops" : "needs_and_sales");

        if (segment === "sell" || segment === "need") {
          const payload: any = {
            userId: uid,
            type: segment === "sell" ? "SELL" : "NEED",
            title: title.trim(),
            description: cleanDesc,
            raw_text: cleanDesc,
            area_tag: area,
            price: price || null,
            phone: phone || "9876543210",
            show_phone: showPhone,
            image_url: imageUrl,
            image_urls: imageUrls.length > 0 ? imageUrls : undefined,
            youtube_url: youtubeUrl.trim() || "",
            google_maps_url: googleMapsUrl.trim() || "",
            is_verified: true,
          };
          if (editId) {
            try {
              await updateDoc(doc(db, targetCol, editId), payload);
            } catch {
              await addDoc(collection(db, targetCol), { ...payload, created_at: timestamp });
            }
          } else {
            await addDoc(collection(db, targetCol), {
              ...payload,
              created_at: timestamp,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
          }
        } else if (segment === "service") {
          const payload: any = {
            userId: uid,
            name: title.trim(),
            is_available_now: isAvailable,
            experience: allWorkingDays === "Yes" ? "All Working Days" : "Flexible Days",
            working_hours: sundayLeave === "Yes" ? "Sunday Off" : "Open 7 Days",
            area_tag: area,
            phone: phone || "9876543210",
            rating: 5.0,
            description: cleanDesc,
            image_url: imageUrl,
            is_verified: true,
          };
          if (editId) {
            try {
              await updateDoc(doc(db, targetCol, editId), payload);
            } catch {
              await addDoc(collection(db, targetCol), { ...payload, created_at: timestamp });
            }
          } else {
            await addDoc(collection(db, targetCol), {
              ...payload,
              negative_reports_count: 0,
              status: "active",
              created_at: timestamp,
            });
          }
        } else if (segment === "offer") {
          let uploadedVideoUrl = videoPreview || "";
          if (selectedVideo) {
            try {
              const videoRef = ref(storage, `offer_reels/${Date.now()}_${selectedVideo.name}`);
              const snap = await uploadBytes(videoRef, selectedVideo);
              uploadedVideoUrl = await getDownloadURL(snap.ref);
            } catch (vErr) {
              console.warn("Video reel upload fallback:", vErr);
            }
          }
          const payload: any = {
            userId: uid,
            shop_name: title.trim(),
            area_tag: area,
            phone: phone || "9876543210",
            image_url: imageUrl,
            latitude: 10.787,
            longitude: 79.1378,
            google_maps_url: googleMapsUrl.trim() || "",
            address_text: area ? `${area}, Thanjavur` : "Thanjavur",
            hours: "Special Local Offer",
            is_claimed: true,
            offer_title: title.trim(),
            offer_description: cleanDesc,
            valid_from: validFrom || null,
            valid_to: validTo || null,
            show_phone: showPhone,
            video_url: uploadedVideoUrl || "",
          };
          if (editId) {
            try {
              await updateDoc(doc(db, targetCol, editId), payload);
            } catch {
              await addDoc(collection(db, targetCol), { ...payload, created_at: timestamp });
            }
          } else {
            await addDoc(collection(db, targetCol), { ...payload, created_at: timestamp });
          }
        }
      } catch (bgSyncErr) {
        console.warn("Background Firestore sync warning:", bgSyncErr);
      }
    })();
  };

  // Direct 1:1 Live Preview Cards Data
  const previewSellOrNeedPost = useMemo<NeedOrSalePost>(() => {
    const activeCover = (imagePreviews && imagePreviews.length > 0) ? imagePreviews[0] : (imagePreview || "");
    return {
      id: "preview_post",
      userId: user?.uid || "preview_user",
      type: segment === "sell" ? "SELL" : "NEED",
      raw_text: description.trim(),
      title: title.trim() || (segment === "sell" ? "Your Item Title" : "Your Requirement"),
      description: previewDescription || description.trim() || "Live preview description will appear here...",
      area_tag: area || TANJORE_LOCALITIES[0],
      price: price || "",
      phone: phone || profile?.phone || "",
      image_url: activeCover,
      image_urls: imagePreviews,
      show_phone: showPhone,
      is_verified: true,
      category: category || config.categories[0] || "General",
      created_at: new Date() as any,
      expires_at: new Date(Date.now() + 30 * 86400000) as any,
    };
  }, [title, description, previewDescription, area, price, phone, profile, imagePreview, imagePreviews, segment, user, showPhone]);

  const previewServicePost = useMemo<ServiceProviderPost>(() => {
    return {
      id: "preview_service",
      userId: user?.uid || "preview_user",
      name: title.trim() || "Your Name",
      experience: allWorkingDays === "Yes" ? "All Working Days" : "Flexible Days",
      working_hours: sundayLeave === "Yes" ? "Sunday Off" : "Open 7 Days",
      phone: phone || "",
      area_tag: area || TANJORE_LOCALITIES[0],
      rating: 5.0,
      description: previewDescription || "Your trade service details...",
      image_url: imagePreview || "",
      skill_category: category || config.categories[0] || "General",
      is_verified: true,
      created_at: new Date() as any,
    };
  }, [title, description, previewDescription, area, allWorkingDays, sundayLeave, phone, imagePreview, user]);

  const previewShopPost = useMemo<ShopPost>(() => {
    return {
      id: "preview_shop",
      userId: user?.uid || "preview_user",
      shop_name: title.trim() || "Your Store Name",
      address_text: area ? `${area}, Thanjavur` : "Thanjavur",
      landmark: "Near Main Road",
      hours: "Valid 30 Days",
      valid_from: validFrom || undefined,
      valid_to: validTo || undefined,
      phone: phone || "",
      area_tag: area || TANJORE_LOCALITIES[0],
      offer_title: title.trim() || "Store Offer",
      offer_description: previewDescription || description.trim() || "Special offer details...",
      image_url: imagePreview || "",
      latitude: 10.7870,
      longitude: 79.1378,
      show_phone: showPhone,
      is_claimed: true,
      category: category || config.categories[0] || "General",
      created_at: new Date() as any,
    };
  }, [title, description, previewDescription, area, validFrom, validTo, showPhone, phone, imagePreview, user]);


  const formattedPriceBadge = formatIndianCurrencyText(price);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500 font-heading font-bold text-xs gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
        <span>Loading details...</span>
      </div>
    );
  }


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
        /* PURE HUMAN 2-COLUMN SPLIT LAYOUT (FREE BORDERLESS DESIGN) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Form Controls (Borderless Free Design) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-4 bg-transparent border-0 p-0 sm:p-1">
            {/* Primary Category Selection Line */}
            <div className="w-full flex flex-col gap-3">
              <select
                required
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  if (segment === "service") {
                    const subs = SERVICE_SUBCATEGORIES_MAP[newCat] || [];
                    setSubCategory(subs[0] || "");
                  }
                }}
                className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 cursor-pointer"
              >
                {config.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Dynamic Subcategory Dropdown for Services */}
              {segment === "service" && (
                <select
                  required
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full py-2 text-xs font-bold border-b border-amber-400 bg-amber-50/50 focus:border-amber-500 rounded-none focus:outline-none text-slate-800 cursor-pointer"
                >
                  {(SERVICE_SUBCATEGORIES_MAP[category] || ["General Helper"]).map((sub) => (
                    <option key={sub} value={sub}>
                      ↳ Subcategory: {sub}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* OFFER FORM INPUTS IN OLX CLEAN LINE STYLE */}
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
                      <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setSelectedImage(null);
                          }}
                          className="bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 backdrop-blur-xs shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                        <label className="bg-slate-950/85 hover:bg-slate-950 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 backdrop-blur-xs shadow">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      </div>
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

                {/* 2. SHOP NAME LINE */}
                <div className="relative w-full">
                  <input
                    type="text"
                    required
                    maxLength={config.maxTitleChars}
                    placeholder="Shop Name * (e.g. GLEN Exclusive Gallery / Sri Kumaran Silks)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium pr-12"
                  />
                  <span className="absolute right-0 top-3 text-[11px] font-medium text-slate-400">
                    {title.length}/{config.maxTitleChars}
                  </span>
                </div>

                {/* 3. OFFER DESCRIPTION LINE */}
                <div className="relative w-full">
                  <textarea
                    required
                    rows={3}
                    maxLength={config.maxDescChars}
                    placeholder="Offer Description * (Describe discount, terms, packages, or specific items...)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full py-2.5 text-sm font-medium border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors leading-relaxed placeholder:text-slate-400"
                  />
                  <span className="absolute right-0 bottom-3 text-[11px] font-medium text-slate-400">
                    {description.length}/{config.maxDescChars}
                  </span>
                </div>

                {/* 4. OFFER VALIDITY DATES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" /> Valid From Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full py-1.5 text-xs font-bold border-b border-slate-300 bg-transparent focus:outline-none focus:border-amber-500 text-slate-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" /> Valid To Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full py-1.5 text-xs font-bold border-b border-slate-300 bg-transparent focus:outline-none focus:border-amber-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* 5. ADDRESS LINE — Freeform Location Input */}
                <div className="w-full">
                  <input
                    type="text"
                    required
                    placeholder="📍 Shop Address & Locality in Thanjavur *"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>

                {/* 6. OFFER PHONE INPUT LINE */}
                <div className="w-full">
                  <input
                    type="tel"
                    required
                    placeholder="📞 Contact phone number * (e.g. 9994837342)"
                    value={phone}
                    onChange={(e) => { userEditedPhone.current = true; setPhone(e.target.value); }}
                    className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>

                {/* 7. PHONE NUMBER VISIBILITY TOGGLE */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-600" />
                    <span>Show Phone Number on Card</span>
                  </span>
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
              </>
            ) : (
              /* NON-OFFER FORMS (SELL, NEED, SERVICE) */
              <>
                {/* TITLE OR NAME INPUT LINE */}
                <div className="relative w-full">
                  <input
                    type="text"
                    required
                    maxLength={config.maxTitleChars}
                    placeholder={
                      segment === "sell"
                        ? "Posting title or item name * (e.g. 2 BHK House, Hero Splendor)"
                        : segment === "need"
                        ? "Posting title or requirement name * (e.g. Need 2 BHK House)"
                        : "Your Full Name * (e.g. Senthil Kumar)"
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium pr-12"
                  />
                  <span className="absolute right-0 top-3 text-[11px] font-medium text-slate-400">
                    {title.length}/{config.maxTitleChars}
                  </span>
                </div>

                {/* SERVICE LOCATION & AVAILABILITY */}
                {segment === "service" && (
                  <div className="flex flex-col gap-3">
                    <select
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors cursor-pointer"
                    >
                      <option value="" disabled>📍 Select Thanjavur Town / Taluk Location *</option>
                      {THANJAVUR_TOWNS.map((town) => (
                        <option key={town} value={town}>{town}</option>
                      ))}
                    </select>

                    {/* Combined Availability Single Pill Toggle */}
                    <div className="flex flex-col gap-1.5">
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setAllWorkingDays("Yes");
                            setSundayLeave("No");
                          }}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                            allWorkingDays === "Yes"
                              ? "bg-amber-400 text-slate-950 font-black border border-amber-500 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Available 7 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAllWorkingDays("No");
                            setSundayLeave("Yes");
                          }}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                            sundayLeave === "Yes"
                              ? "bg-amber-400 text-slate-950 font-black border border-amber-500 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Sunday Holiday
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PRICE & DEDICATED FREEFORM TYPING LOCATION (FOR SELL) */}
                {segment === "sell" && (
                  <>
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Price or Rate (e.g. 5000, 5000rs, or 5000/month)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium pr-20"
                      />
                      {formattedPriceBadge && (
                        <span className="absolute right-0 top-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {formattedPriceBadge}
                        </span>
                      )}
                    </div>

                    <div className="w-full">
                      <input
                        type="text"
                        required
                        placeholder="📍 Address / Dedicated Typing Location in Thanjavur *"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                      />
                    </div>
                  </>
                )}

                {/* BUDGET & THANJAVUR TOWN DROPDOWN (FOR NEED) */}
                {segment === "need" && (
                  <>
                    <div className="w-full">
                      <input
                        type="text"
                        placeholder="Budget From (e.g. 5000, 5000rs - Optional)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                      />
                    </div>

                    <div className="w-full">
                      <select
                        required
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors cursor-pointer"
                      >
                        <option value="" disabled>📍 Select Preferred Thanjavur Town / Taluk *</option>
                        {THANJAVUR_TOWNS.map((town) => (
                          <option key={town} value={town}>{town}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* CONTACT PHONE INPUT LINE */}
                <div className="w-full">
                  <input
                    type="tel"
                    required
                    placeholder="📞 Contact phone number * (e.g. 9994837342)"
                    value={phone}
                    onChange={(e) => { userEditedPhone.current = true; setPhone(e.target.value); }}
                    className="w-full py-2.5 text-sm font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>

                {/* Description Input */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">
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
                    className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-100/80 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-slate-900 transition-all resize-none leading-relaxed"
                  />
                </div>
              </>
            )}

            {/* Sell Specific Links */}
            {segment === "sell" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-500" /> Google Maps URL
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-100/80 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-slate-900 transition-all"
                />
              </div>
            )}

            {/* Sell/Need Phone Toggle */}
            {(segment === "sell" || segment === "need") && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 mt-1">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span>Display your phone number publicly</span>
                </span>
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

            {/* Image Upload */}
            {segment === "sell" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-slate-400" />
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

                {/* Add more button */}
                {imagePreviews.length < 3 && (
                  <label className="w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-2xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-800">
                      {imagePreviews.length === 0 ? "Click to Upload Photos" : `Add More (${imagePreviews.length}/3)`}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">JPEG, PNG, WebP up to 5MB each</span>
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

          {/* RIGHT COLUMN: Instant 1:1 Live Preview Card (PROMINENT HIGHLIGHTED HEADER) */}
          <div className="lg:col-span-5 sticky top-20 flex flex-col gap-3">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-l-4 border-slate-800 rounded-r-xl shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-heading font-black text-sm text-slate-900 tracking-tight">
                  LIVE CARD PREVIEW
                </h3>
              </div>
              <span className="text-[10px] font-black text-slate-800 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-md uppercase tracking-widest shadow-2xs">
                Real-Time
              </span>
            </div>

            <div className="w-full flex flex-col gap-3 relative">
              {isAiRewriting && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-900 font-bold text-xs shadow-2xs">
                  <span>Formatting description text...</span>
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
              className="w-full sm:w-auto sm:min-w-[240px] px-8 py-3.5 sm:py-4 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-md transition-all select-none mt-2 mb-28 md:mb-6 active:scale-95 sm:self-end"
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
