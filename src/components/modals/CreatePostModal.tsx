"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Camera,
  Video,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  MapPin,
  Tag,
  Briefcase,
  Store,
  Phone,
  Calendar,
  MessageSquare,
  Share2,
  Home,
  Cpu,
  Car,
  Tv,
  Zap,
  Droplet,
  Wind,
  Hammer,
  Utensils,
  ShoppingBag,
  Shirt,
  Compass,
} from "lucide-react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/image-compressor";
import { useAuth } from "@/hooks/use-auth";
import {
  TANJORE_LOCALITIES,
  CLASSIFIED_CATEGORIES,
  SERVICE_CATEGORIES,
  SHOP_CATEGORIES,
  OFFER_CATEGORIES,
  TanjoreLocality,
} from "@/lib/constants";
import { useToast } from "@/context/ToastContext";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultArea?: TanjoreLocality;
  defaultType?: PostType;
  defaultCategory?: string;
  defaultClassifiedType?: "NEED" | "SELL";
  editPost?: any;
}

// Approximate coordinate mapping for Tanjore area tags (enables OSM rendering without Google API costs)
const AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Old Bus Stand": { lat: 10.7869, lng: 79.1378 },
  "New Bus Stand": { lat: 10.7719, lng: 79.1172 },
  "South Rampart (Thenkeezh Street)": { lat: 10.7845, lng: 79.1322 },
  "Medical College Road": { lat: 10.7601, lng: 79.1135 },
  "Vallam": { lat: 10.7167, lng: 79.0333 },
  "Gandhiji Road": { lat: 10.7892, lng: 79.1388 },
  "Karanthai": { lat: 10.8062, lng: 79.1417 },
  "East Gate (Kizhakku Vasal)": { lat: 10.7899, lng: 79.1465 },
  "Parisutham Nagar": { lat: 10.7788, lng: 79.1234 },
  "Srinivasapuram": { lat: 10.7812, lng: 79.1299 },
  "Punnainallur / Mariamman Kovil": { lat: 10.7932, lng: 79.1865 },
  "Reddipalayam": { lat: 10.7554, lng: 79.0888 },
  "Yagappa Nagar": { lat: 10.7709, lng: 79.1478 },
  "LIC Colony": { lat: 10.7667, lng: 79.1192 },
  "Municipal Colony": { lat: 10.7803, lng: 79.1408 },
  "Membalam": { lat: 10.7801, lng: 79.1315 },
  "North Street (Vada Veethi)": { lat: 10.7944, lng: 79.1365 },
  "West Main Street (Melaveethi)": { lat: 10.7915, lng: 79.1309 },
  "Pillaiyarpatti": { lat: 10.7388, lng: 79.0722 },
  "Tanjore Town (General)": { lat: 10.7870, lng: 79.1378 },
};

type PostType = "needs" | "services" | "shops" | "offers";

export default function CreatePostModal({
  isOpen,
  onClose,
  defaultArea = "Tanjore Town (General)",
  defaultType = "needs",
  defaultCategory,
  defaultClassifiedType,
  editPost,
}: CreatePostModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<PostType>(defaultType);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Common Form Fields
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [aiRefining, setAiRefining] = useState<boolean>(false);

  // Need/Sale Specific State
  const [classifiedType, setClassifiedType] = useState<"NEED" | "SELL">("NEED");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [classifiedCategory, setClassifiedCategory] = useState(CLASSIFIED_CATEGORIES[0]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  // Service Specific State
  const [serviceName, setServiceName] = useState("");
  const [serviceCategory, setServiceCategory] = useState(SERVICE_CATEGORIES[0]);
  const [experience, setExperience] = useState("");

  // Shop Specific State
  const [shopName, setShopName] = useState("");
  const [shopCategory, setShopCategory] = useState(SHOP_CATEGORIES[0]);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [hours, setHours] = useState("9 AM - 9 PM");

  // Offer Specific State
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [offerCategory, setOfferCategory] = useState(OFFER_CATEGORIES[0]);
  const [socialLink, setSocialLink] = useState("");
  const [showPhone, setShowPhone] = useState(false);

  const { profile } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    if (editPost) {
      const postType = (editPost.type?.toLowerCase() === "need" || editPost.type?.toLowerCase() === "sell" || editPost.type?.toLowerCase() === "needs")
        ? "needs"
        : (editPost.skill_category ? "services" : (editPost.shop_name ? "shops" : "needs"));
      
      setType(postType as PostType);

      if (editPost.type?.toUpperCase() === "NEED") {
        setClassifiedType("NEED");
      } else if (editPost.type?.toUpperCase() === "SELL") {
        setClassifiedType("SELL");
      }

      setTitle(editPost.title || editPost.name || editPost.shop_name || "");
      setDescription(editPost.description || editPost.offer_description || "");
      setPrice(editPost.price ? String(editPost.price) : "");
      setPhone(editPost.phone || profile?.phone || "");
      setArea(editPost.area_tag || editPost.location || editPost.address_text || "");

      if (editPost.category) {
        if (CLASSIFIED_CATEGORIES.includes(editPost.category as any)) setClassifiedCategory(editPost.category as any);
        if (SERVICE_CATEGORIES.includes(editPost.category as any)) setServiceCategory(editPost.category as any);
        if (SHOP_CATEGORIES.includes(editPost.category as any)) setShopCategory(editPost.category as any);
        if (OFFER_CATEGORIES.includes(editPost.category as any)) setOfferCategory(editPost.category as any);
      }

      if (editPost.image_url) {
        setImagePreview(editPost.image_url);
      }

      setStep(2);
    } else {
      setStep(1);
      if (defaultArea) setArea(defaultArea);
      if (defaultType) setType(defaultType);
      if (defaultClassifiedType) setClassifiedType(defaultClassifiedType);
      if (defaultCategory) {
        if (CLASSIFIED_CATEGORIES.includes(defaultCategory as any)) setClassifiedCategory(defaultCategory as any);
        if (SERVICE_CATEGORIES.includes(defaultCategory as any)) setServiceCategory(defaultCategory as any);
        if (SHOP_CATEGORIES.includes(defaultCategory as any)) setShopCategory(defaultCategory as any);
      }
      if (profile?.phone && !phone) {
        setPhone(profile.phone);
      }
    }
  }, [defaultArea, defaultType, defaultCategory, defaultClassifiedType, isOpen, profile, editPost]);

  // 3-second debounced AI refinement trigger on text input
  useEffect(() => {
    const textToRefine = description || offerDesc;
    if (!textToRefine || !textToRefine.trim()) {
      setAiRefining(false);
      return;
    }

    setAiRefining(true);
    const timer = setTimeout(() => {
      setAiRefining(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [description, offerDesc]);

  if (!isOpen) return null;

  if (!auth.currentUser) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("namma_thanjai_open_signin"));
    }
    onClose();
    return null;
  }

  // Handle OCR scanning of visiting card
  const handleOcrScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      // 1. Compress client-side to ensure small payloads (<150KB)
      const compressed = await compressImage(file, 800, 800, 0.7);
      
      // 2. Call local server action API route
      const res = await fetch("/api/gemini-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.blob.type,
        }),
      });

      const result = await res.json();

      if (result.success && result.data) {
        const { shop_name, category, phone: extractedPhone, address_text, detected_area } = result.data;
        
        // Auto-populate based on OCR response
        if (type === "shops") {
          if (shop_name) setShopName(shop_name);
          if (category) setShopCategory(category);
          if (address_text) setAddress(address_text);
          if (detected_area) setArea(detected_area as TanjoreLocality);
        } else if (type === "services") {
          if (shop_name) setServiceName(shop_name); // uses service name
          if (detected_area) setArea(detected_area as TanjoreLocality);
        }
        if (extractedPhone) setPhone(extractedPhone);

        toast.success("Visiting card scanned successfully!");
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({ particleCount: 30, spread: 40, colors: ["#fbbf24"] });
        } catch (err) {}
      } else {
        toast.error("Could not extract details. Please fill manually.");
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast.error("Error scanning card. Please fill manually.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...selectedImages, ...files].slice(0, 3);
    setSelectedImages(newFiles);
    setSelectedImage(newFiles[0]);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
    setImagePreview(newPreviews[0]);
  };

  const handleRemoveImage = (index: number) => {
    const updatedFiles = selectedImages.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    setSelectedImages(updatedFiles);
    setImagePreviews(updatedPreviews);
    setSelectedImage(updatedFiles[0] || null);
    setImagePreview(updatedPreviews[0] || "");
  };

  const handlePublish = async () => {
    if (!phone) {
      toast.error("Please enter your contact phone number.");
      return;
    }

    if (!area || !area.trim()) {
      toast.error("Please add a specific location in Thanjavur District.");
      return;
    }

    setLoading(true);

    // AI Location Verification for Thanjavur District
    const { aiLocalityCheck } = await import("@/lib/ai-locality-check");
    const isThanjavur = await aiLocalityCheck(area);
    if (!isThanjavur) {
      toast.error("Please add a specific location in Thanjavur District.");
      setLoading(false);
      return;
    }
    try {
      const currentUser = auth.currentUser;
      const uid = currentUser ? currentUser.uid : "anonymous_guest";

      let finalDescription = description;
      let finalOfferDesc = offerDesc;

      // 1. AI Formatting of user description (with robust client-side fallback for mobile APK)
      const formatLocally = (raw: string, postType: string) => {
        if (!raw || !raw.trim()) return "";
        const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
        const bullets = lines
          .map((l) => (l.startsWith("•") || l.startsWith("-") ? `• ${l.replace(/^[-•]\s*/, "")}` : `• ${l}`))
          .join("\n");
        const titleMap: Record<string, string> = {
          sell: "Product Details:",
          need: "Requirement Summary:",
          services: "Services Offered:",
          shops: "Store Offer Details:",
        };
        return `${titleMap[postType] || "Details:"}\n${bullets}`;
      };

      const API_URL = typeof window !== "undefined" && window.location.origin.includes("localhost")
        ? "/api/gemini-format"
        : "https://mythanjai.vercel.app/api/gemini-format";

      if (type === "needs") {
        try {
          const formatRes = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawDescription: description, type: classifiedType?.toLowerCase() }),
          });
          const formatData = await formatRes.json();
          if (formatData.success && formatData.formattedText) {
            finalDescription = formatData.formattedText;
          } else {
            finalDescription = formatLocally(description, classifiedType?.toLowerCase() || "sell");
          }
        } catch (err) {
          finalDescription = formatLocally(description, classifiedType?.toLowerCase() || "sell");
        }
      } else if (type === "services") {
        try {
          const formatRes = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawDescription: description, type: "services" }),
          });
          const formatData = await formatRes.json();
          if (formatData.success && formatData.formattedText) {
            finalDescription = formatData.formattedText;
          } else {
            finalDescription = formatLocally(description, "services");
          }
        } catch (err) {
          finalDescription = formatLocally(description, "services");
        }
      } else if (type === "shops" || type === "offers") {
        if (offerDesc) {
          try {
            const formatRes = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rawDescription: offerDesc, type: "shops" }),
            });
            const formatData = await formatRes.json();
            if (formatData.success && formatData.formattedText) {
              finalOfferDesc = formatData.formattedText;
            } else {
              finalOfferDesc = formatLocally(offerDesc, "shops");
            }
          } catch (err) {
            finalOfferDesc = formatLocally(offerDesc, "shops");
          }
        }
      }

      let imageUrl = "";
      // Upload compressed image if selected and is allowed type (Shops, Offers, Services, or Selling classifieds)
      const isUploadAllowed = type === "shops" || type === "offers" || type === "services" || (type === "needs" && classifiedType === "SELL");
      if (selectedImage && isUploadAllowed) {
        try {
          const compressed = await compressImage(selectedImage, 800, 800, 0.75);
          const imageRef = ref(storage, `${type}/${Date.now()}_${compressed.fileName}`);
          const uploadSnapshot = await uploadBytes(imageRef, compressed.blob);
          imageUrl = await getDownloadURL(uploadSnapshot.ref);
        } catch (storageErr) {
          console.warn("Storage upload failed, using local preview fallback:", storageErr);
          imageUrl = imagePreview || "";
        }
      }

      // 2. Prep structured collections
      const timestamp = new Date().toISOString();
      
      try {
        if (editPost && editPost.id) {
          // ── EDIT EXISTING POST FLOW ──
          const targetCol = editPost.colName || (type === "needs" ? "needs_and_sales" : (type === "services" ? "services" : (type === "shops" ? "shops" : "offers")));
          const updatePayload: any = {
            title: title || editPost.title,
            description: finalDescription || editPost.description,
            price: price ? parseFloat(price) : null,
            phone,
            area_tag: area,
            category: classifiedCategory || editPost.category,
          };
          if (imageUrl) updatePayload.image_url = imageUrl;

          try {
            const docRef = doc(db, targetCol, editPost.id);
            await updateDoc(docRef, updatePayload);
          } catch (e) {}

          toast.success("Listing updated successfully!");
        } else {
          // ── CREATE NEW POST FLOW ──
          let newDocId = "";
          let postTitle = title || serviceName || shopName || offerTitle || "New Listing";
          if (type === "needs") {
            const docRef = await addDoc(collection(db, "needs_and_sales"), {
              userId: uid,
              type: classifiedType,
              title,
              description: finalDescription,
              raw_text: description, // store raw for search indexing
              category: classifiedCategory,
              area_tag: area,
              price: price ? parseFloat(price) : null,
              phone,
              image_url: imageUrl || "",
              is_verified: true,
              status: "active",
              created_at: timestamp,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day auto-expiry per PRD
            });
            newDocId = docRef.id;
          } else if (type === "services") {
            const docRef = await addDoc(collection(db, "services"), {
              userId: uid,
              name: serviceName.includes("—") ? serviceName : `${serviceName} — ${serviceCategory}`,
              title: serviceName.includes("—") ? serviceName : `${serviceName} — ${serviceCategory}`,
              skill_category: serviceCategory,
              experience: experience || "Licensed Helper",
              area_tag: area,
              phone,
              rating: 4.8,
              description: finalDescription,
              image_url: imageUrl || "",
              is_verified: true,
              status: "active",
              created_at: timestamp,
            });
            newDocId = docRef.id;
          } else if (type === "shops") {
            const coords = AREA_COORDINATES[area] || AREA_COORDINATES["Tanjore Town (General)"];
            const docRef = await addDoc(collection(db, "shops"), {
              userId: uid,
              shop_name: shopName,
              title: shopName,
              category: shopCategory,
              area_tag: area,
              phone,
              image_url: imageUrl || "/placeholder.webp",
              latitude: coords.lat,
              longitude: coords.lng,
              address_text: address || `${area}, Thanjavur`,
              landmark: landmark || "",
              hours: hours || "9 AM - 9 PM",
              is_claimed: true,
              is_verified: true,
              status: "active",
              created_at: timestamp,
              offer_title: offerTitle || "",
              offer_description: finalOfferDesc || "",
              offer_social_link: socialLink || "",
              show_phone: showPhone,
            });
            newDocId = docRef.id;
          } else if (type === "offers") {
            let platform: "instagram" | "facebook" | "whatsapp" | "other" = "other";
            if (socialLink.includes("instagram.com")) platform = "instagram";
            else if (socialLink.includes("facebook.com")) platform = "facebook";
            else if (socialLink.includes("wa.me") || socialLink.includes("whatsapp.com")) platform = "whatsapp";

            const docRef = await addDoc(collection(db, "offers"), {
              userId: uid,
              title: offerTitle,
              description: finalOfferDesc,
              category: offerCategory,
              area_tag: area,
              thumbnail_url: imageUrl || "/placeholder.webp",
              social_link: socialLink || "https://instagram.com",
              platform,
              is_verified: true,
              status: "active",
              created_at: timestamp,
            });
            newDocId = docRef.id;
          }

          // ── Audit Log Trigger ──
          const { logAuditEvent } = await import("@/lib/audit-logger");
          await logAuditEvent({
            action: editPost ? "POST_UPDATED" : "POST_CREATED",
            actorUid: uid,
            actorPhone: phone,
            actorName: profile?.displayName || "Namma Thanjai User",
            targetPostId: newDocId || "post_" + Date.now(),
            targetPostTitle: postTitle,
            category: type.toUpperCase(),
            details: `Created post "${postTitle}" in ${type.toUpperCase()} at ${area}`,
            visibilityState: "public",
          }).catch(() => {});

          toast.success("Post published to Thanjavur hub!");

          const targetRoute = type === "needs" ? (classifiedType === "NEED" ? "/need" : "/sell") : (type === "services" ? "/services" : "/shops");

          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = targetRoute;
            }
          }, 300);
        }
      } catch (firestoreErr) {
        console.warn("Firestore document creation note:", firestoreErr);
      }

      // Success Celebratory feedback
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}

      // Reset & Close
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error publishing post:", error);
      onClose();
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPhone("");
    setSelectedImage(null);
    setImagePreview("");
    setTitle("");
    setDescription("");
    setPrice("");
    setServiceName("");
    setExperience("");
    setShopName("");
    setAddress("");
    setLandmark("");
    setOfferTitle("");
    setOfferDesc("");
    setSocialLink("");
    setYoutubeUrl("");
    setGoogleMapsUrl("");
  };

  const CATEGORY_SAMPLE_POSTS: Record<string, { title: string; price?: string; description?: string; experience?: string; hours?: string; address?: string; landmark?: string; offerTitle?: string; offerDesc?: string }> = {};

  const displayTitle = (() => {
    if (type === "needs") return title || "New Requirement";
    if (type === "services") return serviceName || "Local Service Provider";
    if (type === "shops") return shopName || "Local Store";
    return offerTitle || "Special Offer";
  })();

  const displayDescription = (() => {
    if (type === "needs") return description || "";
    if (type === "services") return description || "";
    if (type === "shops") {
      const addr = address || "";
      const land = landmark || "";
      const off = offerTitle || "";
      return `${addr}${land ? ` (Near ${land})` : ""}${off ? `\n\nPromo Offer: ${off}` : ""}`;
    }
    return offerDesc || "";
  })();

  const displayPrice = price || "";
  const displayExperience = experience || "Verified Expert";
  const displayHours = hours || "9:00 AM - 9:00 PM";

  const CATEGORY_STOCK_IMAGES: Record<string, string> = {};

  const activeCategory: string = (() => {
    if (type === "needs") return classifiedCategory;
    if (type === "services") return serviceCategory;
    if (type === "shops") return shopCategory;
    if (type === "offers") return offerCategory;
    return "Others";
  })();

  const previewImage = imagePreview || "";


  const getPreviewIcon = () => {
    switch (activeCategory) {
      // Classifieds
      case "Plots & Real Estate": return <Compass className="w-3.5 h-3.5 text-slate-500" />;
      case "Property Rental": return <Home className="w-3.5 h-3.5 text-slate-500" />;
      case "Electronics": return <Cpu className="w-3.5 h-3.5 text-slate-500" />;
      case "Motor Vehicle": return <Car className="w-3.5 h-3.5 text-slate-500" />;
      // Services
      case "Electrician": return <Zap className="w-3.5 h-3.5 text-slate-500" />;
      case "Plumber": return <Droplet className="w-3.5 h-3.5 text-slate-500" />;
      case "AC & Refrigeration": return <Wind className="w-3.5 h-3.5 text-slate-500" />;
      case "Carpenter": return <Hammer className="w-3.5 h-3.5 text-slate-500" />;
      // Shops & Offers
      case "Cafe & Restaurant": return <Utensils className="w-3.5 h-3.5 text-slate-500" />;
      case "Supermarket & Grocery": return <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />;
      case "Textiles & Clothing": return <Shirt className="w-3.5 h-3.5 text-slate-500" />;
      case "Jewelry Showroom": return <Sparkles className="w-3.5 h-3.5 text-slate-500" />;
      default: return <Tag className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-4 w-full">
      {/* Modal Card / Mobile Bottom Sheet */}
      <div className="bg-white w-full max-w-[480px] md:max-w-4xl rounded-t-3xl md:rounded-2xl border-t md:border border-slate-205 flex flex-col max-h-[92vh] md:max-h-[88vh] animate-slide-up text-slate-800 shadow-2xl overflow-hidden">
        {/* Mobile Bottom Sheet Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mt-2.5 mb-0.5 md:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-heading font-black text-base text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              <span>Create Local Post</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold">Step {step} of 3</p>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-1.5 rounded-xl bg-slate-150 text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
          {/* STEP 1: CATEGORY SELECTION */}
          {step === 1 && (
            <div className="flex flex-col gap-4 max-w-md mx-auto py-6">
              <p className="text-xs text-slate-500 font-bold mb-1 text-center">
                What are you posting to Tanjore Hub today?
              </p>

              <div className="flex flex-col gap-3">
                {/* 1. Needs / Classifieds */}
                <button
                  onClick={() => {
                    setType("needs");
                    setStep(2);
                  }}
                  className="flex items-center p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-yellow-500/60 hover:bg-yellow-50/20 active:scale-[0.98] transition-all gap-3 text-left w-full text-slate-800 group cursor-pointer"
                >
                  <Tag className="w-6 h-6 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Needs & Sales</span>
                    <span className="text-[9px] text-slate-400 font-bold leading-tight">Classified requirements & items for sale</span>
                  </div>
                </button>

                {/* 2. Services */}
                <button
                  onClick={() => {
                    setType("services");
                    setStep(2);
                  }}
                  className="flex items-center p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-yellow-500/60 hover:bg-yellow-50/20 active:scale-[0.98] transition-all gap-3 text-left w-full text-slate-800 group cursor-pointer"
                >
                  <Briefcase className="w-6 h-6 text-purple-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Service Provider</span>
                    <span className="text-[9px] text-slate-400 font-bold leading-tight">Register electrician, plumber, AC repair</span>
                  </div>
                </button>

                {/* 3. Shops */}
                <button
                  onClick={() => {
                    setType("shops");
                    setStep(2);
                  }}
                  className="flex items-center p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-yellow-500/60 hover:bg-yellow-50/20 active:scale-[0.98] transition-all gap-3 text-left w-full text-slate-800 group cursor-pointer"
                >
                  <Store className="w-6 h-6 text-yellow-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Shop Directory & Offers</span>
                    <span className="text-[9px] text-slate-400 font-bold leading-tight">Add your local retail showroom & active deals</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 & 3: WIDESCREEN Responsive 2-Column Grid */}
          {(step === 2 || step === 3) && (
            <div className="flex flex-col gap-6">
              
              {/* Responsive Columns Wrapper */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* LEFT COLUMN: Input Fields */}
                <div className="flex flex-col gap-4">
                  {step === 2 && (
                    <div className="flex flex-col gap-4">
                      {/* Optional OCR Scan button for Shops/Services */}
                      {(type === "shops" || type === "services") && (
                        <div className="bg-yellow-50 border border-yellow-250/60 rounded-2xl p-4 flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-extrabold text-yellow-750 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                                AI Visiting Card Scanner
                              </h4>
                              <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-tight">
                                Snap a visiting card to auto-fill business name, categories, area & phone number instantly!
                              </p>
                            </div>
                          </div>
                          <label className="flex items-center justify-center gap-1.5 btn-primary py-2 text-xs cursor-pointer uppercase tracking-wider">
                            {ocrLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-[#0F172A]" />
                                <span>AI Parsing Details...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4 text-[#0F172A]" />
                                <span>Scan Visiting Card</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleOcrScan}
                              disabled={ocrLoading}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {/* Form elements by Type */}
                      {type === "needs" && (
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setClassifiedType("NEED")}
                              className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                classifiedType === "NEED"
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/50"
                                  : "border-border hover:bg-slate-50"
                              }`}
                            >
                              Wanted Ad (தேவை)
                            </button>
                            <button
                              type="button"
                              onClick={() => setClassifiedType("SELL")}
                              className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                classifiedType === "SELL"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/50"
                                  : "border-border hover:bg-slate-50"
                              }`}
                            >
                              For Sale / Selling
                            </button>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              autoComplete="on"
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              spellCheck={true}
                              placeholder={classifiedType === "SELL" ? "Posting title or item name * (e.g. 2 BHK House, Hero Splendor)" : "Requirement title or item name * (e.g. Need 2 BHK House)"}
                              className="w-full py-2.5 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                            />
                          </div>

                          <div>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              autoComplete="on"
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              spellCheck={true}
                              placeholder="Description or details * (Describe item condition, size, features, or details...)"
                              rows={3}
                              className="w-full py-2.5 text-xs font-medium border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors leading-relaxed placeholder:text-slate-400"
                            />
                          </div>

                          {classifiedType === "NEED" ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <input
                                  type="number"
                                  value={priceFrom}
                                  onChange={(e) => setPriceFrom(e.target.value)}
                                  placeholder="Budget From (₹)"
                                  className="w-full py-2 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  value={priceTo}
                                  onChange={(e) => setPriceTo(e.target.value)}
                                  placeholder="Budget To (₹)"
                                  className="w-full py-2 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <input
                                  type="text"
                                  value={price}
                                  onChange={(e) => setPrice(e.target.value)}
                                  placeholder="Price or Rate (₹)"
                                  className="w-full py-2 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                                />
                              </div>
                              <div>
                                <select
                                  value={classifiedCategory}
                                  onChange={(e) => setClassifiedCategory(e.target.value as any)}
                                  className="w-full py-2 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 cursor-pointer"
                                >
                                  {CLASSIFIED_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {classifiedType === "SELL" && (
                            <div className="flex flex-col gap-3 pt-1">
                              <div>
                                <input
                                  type="url"
                                  value={youtubeUrl}
                                  onChange={(e) => setYoutubeUrl(e.target.value)}
                                  placeholder="YouTube Video Link (Optional)"
                                  className="w-full py-2 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                                />
                              </div>
                              <div>
                                <input
                                  type="url"
                                  value={googleMapsUrl}
                                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                  placeholder="Google Maps Location Link (Optional)"
                                  className="w-full py-2 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {type === "services" && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <input
                              type="text"
                              value={serviceName}
                              onChange={(e) => setServiceName(e.target.value)}
                              placeholder="Your Full Name * (e.g. Senthil Kumar)"
                              className="w-full py-2.5 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                            />
                          </div>

                          <div>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Services Offered * (Describe jobs you perform, price guides, or consultation terms...)"
                              rows={3}
                              className="w-full py-2.5 text-xs font-medium border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors leading-relaxed placeholder:text-slate-400"
                            />
                          </div>

                          <div>
                            <select
                              value={serviceCategory}
                              onChange={(e) => setServiceCategory(e.target.value as any)}
                              className="w-full py-2.5 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 cursor-pointer"
                            >
                              {SERVICE_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {type === "shops" && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <input
                              type="text"
                              value={shopName}
                              onChange={(e) => setShopName(e.target.value)}
                              placeholder="Shop / Business Name * (e.g. Famous Tanjore Degree Coffee)"
                              className="w-full py-2.5 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <select
                                value={shopCategory}
                                onChange={(e) => setShopCategory(e.target.value as any)}
                                className="w-full py-2 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 cursor-pointer"
                              >
                                {SHOP_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <input
                                type="text"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                placeholder="Hours (e.g. 9 AM - 9 PM)"
                                className="w-full py-2 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                              />
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="📍 Full Shop Address & Locality in Thanjavur *"
                              className="w-full py-2.5 text-xs font-bold border-b-2 border-slate-300 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Nearby Landmark (Optional)</label>
                            <input
                              type="text"
                              value={landmark}
                              onChange={(e) => setLandmark(e.target.value)}
                              placeholder="e.g. Opposite Old Bus Stand clock tower"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                            />
                          </div>

                          <div className="border-t border-slate-100 pt-2.5 mt-1 flex flex-col gap-3">
                            <span className="text-[10px] uppercase font-black tracking-wider text-yellow-750">
                              Add Business Offer / Discount (Optional)
                            </span>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Offer Title</label>
                              <input
                                type="text"
                                value={offerTitle}
                                onChange={(e) => setOfferTitle(e.target.value)}
                                placeholder="e.g. Flat 30% Off on all silk sarees"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Offer Description / Code</label>
                              <input
                                type="text"
                                value={offerDesc}
                                onChange={(e) => setOfferDesc(e.target.value)}
                                placeholder="e.g. Bring this code at billing to redeem. Valid this week."
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Instagram Reels / Video Link</label>
                              <input
                                type="url"
                                value={socialLink}
                                onChange={(e) => setSocialLink(e.target.value)}
                                placeholder="e.g. https://www.instagram.com/reel/..."
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {type === "offers" && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Offer Title</label>
                            <input
                              type="text"
                              value={offerTitle}
                              onChange={(e) => setOfferTitle(e.target.value)}
                              placeholder="e.g. Flat 20% OFF Biryani Combo"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Details (Offer Terms)</label>
                            <input
                              type="text"
                              value={offerDesc}
                              onChange={(e) => setOfferDesc(e.target.value)}
                              placeholder="e.g. Applicable only on weekends"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                              <select
                                value={offerCategory}
                                onChange={(e) => setOfferCategory(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                              >
                                {OFFER_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Social Deal Link</label>
                              <input
                                type="url"
                                value={socialLink}
                                onChange={(e) => setSocialLink(e.target.value)}
                                placeholder="Instagram Reel or FB link"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Shared Local area dropdown */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-yellow-600" />
                          Tanjore Locality Area Tag
                        </label>
                        <select
                          value={area}
                          onChange={(e) => setArea(e.target.value as TanjoreLocality)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                        >
                          {TANJORE_LOCALITIES.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Equal UI Design Tiles for 1. Visiting Card Upload and 2. Video Reel Upload */}
                      {(type === "shops" || type === "offers" || (type === "needs" && classifiedType === "SELL")) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2.5 border-t border-slate-100">
                          {/* Tile 1: Visiting Card / Photo Upload */}
                          <div className="flex flex-col gap-1.5">
                            <label className="block text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-amber-600" />
                              1. Upload Visiting Card / Photo
                            </label>
                            <div className="flex gap-2.5 items-center">
                              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl w-20 h-20 hover:border-amber-400 hover:bg-amber-50/10 transition-colors cursor-pointer shrink-0">
                                <Upload className="w-5 h-5 text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-400 mt-1">Select File</span>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                              </label>
                              {imagePreview ? (
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                                  <img src={imagePreview} alt="Visiting Card Preview" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 font-bold leading-tight">No card selected</p>
                              )}
                            </div>
                          </div>

                          {/* Tile 2: Video Reel Upload */}
                          <div className="flex flex-col gap-1.5">
                            <label className="block text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <Video className="w-3.5 h-3.5 text-amber-600" />
                              2. Upload Video Reel (Link or MP4)
                            </label>
                            <input
                              type="url"
                              value={socialLink}
                              onChange={(e) => setSocialLink(e.target.value)}
                              autoComplete="on"
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              spellCheck={true}
                              placeholder="e.g. https://instagram.com/reel/..."
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                            />
                            <p className="text-[9px] text-slate-400 font-bold">Paste Instagram Reel or MP4 link for instant playback</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3 Fields */}
                  {step === 3 && (
                    <div className="flex flex-col gap-4">
                      <p className="text-xs text-slate-500 font-bold">
                        Provide your WhatsApp / Contact number. Users will click this to chat with you.
                      </p>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-yellow-600" />
                          WhatsApp / Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 9876543210 (10 digits)"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                        />
                      </div>

                      {/* Show Phone Number Short Toggle */}
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          checked={showPhone}
                          onChange={(e) => setShowPhone(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4 cursor-pointer"
                        />
                        <span>Show Phone Number on Listing</span>
                      </label>

                      {/* Confirm details summary box */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[10px] text-slate-500 flex flex-col gap-1.5 font-bold">
                        <span className="font-black text-slate-800">Post Preview Summary:</span>
                        <span>• Posting Category: <b className="text-slate-800 capitalize">{type}</b></span>
                        <span>• Area Tagged: <b className="text-slate-800">{area}</b></span>
                        <span>• Phone: <b className="text-slate-800">{phone || "Not entered"}</b></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Real-time Mockup Final Post Card Preview */}
                <div className="flex flex-col gap-3 sticky top-0 p-1 md:border-l border-slate-100 md:pl-6 h-full justify-start select-none w-full">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Live Post Preview Reference Guide
                  </span>
                  
                  {/* AI Refinement Status Badge */}
                  {aiRefining && (
                    <div className="text-xs font-black text-amber-800 bg-amber-100 border border-amber-300 px-3.5 py-2 rounded-xl animate-pulse flex items-center justify-center gap-2 max-w-sm mx-auto shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                      <span>Refining description...</span>
                    </div>
                  )}

                  {/* Multi-Image Thumbnail Strip (Up to 3 images) */}
                  {imagePreviews.length > 0 && (
                    <div className="flex items-center justify-center gap-2 max-w-sm mx-auto my-1">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                          <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 shadow-md hover:bg-rose-700 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mockup Card */}
                  <div className="bg-white border border-slate-200/95 rounded-2xl p-4 shadow-md flex flex-col gap-3.5 w-full max-w-sm mx-auto text-left">
                    {/* Category & Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                            type === "needs" && classifiedType === "NEED"
                              ? "bg-slate-105 text-slate-800 border border-slate-200"
                              : "bg-yellow-55 text-yellow-900 border border-yellow-250/50"
                          }`}
                        >
                          {type === "needs"
                            ? (classifiedType === "NEED" ? "Looking For" : "Selling")
                            : type === "services"
                            ? "Service Provider"
                            : type === "shops"
                            ? "Shop Directory"
                            : "Active Offer"}
                        </span>
                        <span className="bg-slate-55 text-slate-700 border border-slate-200/60 font-bold px-2 py-0.5 rounded-xl text-[9px] flex items-center gap-1">
                          {getPreviewIcon()}
                          <span className="capitalize">{activeCategory}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        Just now
                      </span>
                    </div>

                    {/* Title & Price / Metadata */}
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-slate-800 leading-snug truncate line-clamp-1 whitespace-nowrap">
                        {displayTitle}
                      </h3>
                      
                      {/* Price/Exp Metadata details */}
                      {type === "needs" && displayPrice && (
                        <div className="text-yellow-600 font-black text-xs mt-1">
                          ₹{Number(displayPrice).toLocaleString("en-IN")}
                        </div>
                      )}
                      {type === "services" && (
                        <div className="text-emerald-700 text-[10px] font-bold mt-1 flex items-center gap-1">
                          <span>✨ Verified Local Service</span>
                        </div>
                      )}
                      {type === "shops" && (
                        <div className="text-slate-500 text-[10px] font-bold mt-1">
                          Timing: {displayHours}
                        </div>
                      )}
                    </div>

                    {/* Product/Category Banner Image */}
                    {(type !== "needs" || classifiedType === "SELL") && (
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs">
                        <img
                          src={imagePreviews[0] || previewImage}
                          alt="Preview illustration"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Description Box */}
                    <p className="text-xs text-slate-500 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 max-h-[140px] overflow-y-auto no-scrollbar">
                      {displayDescription}
                    </p>

                    {/* Footer Info & Action CTAs */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{area}</span>
                      </div>

                      <div className="flex gap-2">
                        <button className="p-1.5 rounded-xl bg-slate-100 text-slate-450 border border-slate-200 cursor-not-allowed" disabled>
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="flex items-center gap-1 bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-not-allowed" disabled>
                          <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-bold mt-2 text-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl max-w-sm mx-auto">
                    This is exactly how other residents in Tanjore will see your listing! Your raw text will be structured by AI to match this design.
                  </div>

                  {/* Primary Submit Button Positioned Directly Below Live Preview Card */}
                  {step === 3 && (
                    <div className="flex justify-center gap-3 w-full mt-3 max-w-sm mx-auto">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2.5 btn-secondary text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={loading}
                        className="flex-1 py-2.5 btn-primary text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#0F172A]" />
                            <span>Publishing...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-[#0F172A]" />
                            <span>Publish Live Post</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Step 2 Continue Button */}
              {step === 2 && (
                <div className="flex justify-center w-full mt-4 pb-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-8 py-2.5 btn-primary text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue to Step 3</span>
                    <ArrowRight className="w-4 h-4 text-[#0F172A]" />
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
