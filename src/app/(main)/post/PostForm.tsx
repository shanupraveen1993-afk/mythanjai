"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
  X,
  ArrowLeft,
  Wrench,
  Home,
  Car,
  Heart,
  GraduationCap,
  Briefcase,
  UserCheck,
  ShoppingBag,
  Search,
} from "lucide-react";
import ListingCard from "@/components/cards/ListingCard";
import ServiceCard from "@/components/cards/ServiceCard";
import ShopCard from "@/components/cards/ShopCard";
import LocalitySelector from "@/components/forms/LocalitySelector";
import DraftProtectionModal from "@/components/modals/DraftProtectionModal";
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

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>("");
  const [p1Area, setP1Area] = useState<string>("");
  const [p2Specific, setP2Specific] = useState<string>("");

  useEffect(() => {
    if (p1Area || p2Specific) {
      setArea(p2Specific.trim() ? `${p1Area} - ${p2Specific.trim()}` : p1Area);
    }
  }, [p1Area, p2Specific]);
  const [category, setCategory] = useState<string>(segment === "service" ? "" : config.categories[0]);
  const [subCategory, setSubCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  // Sell: supports up to 3 images
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

  // Segment-Specific Draft Key
  const draftKey = `namma_thanjai_draft_${segment}`;
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Dynamic isDirty State Calculation
  const isDirty = useMemo(() => {
    return (
      title.trim() !== "" ||
      description.trim() !== "" ||
      price.trim() !== "" ||
      p1Area !== "" ||
      p2Specific.trim() !== ""
    );
  }, [title, description, price, p1Area, p2Specific]);

  // Restore Segment Draft on Mount
  useEffect(() => {
    if (typeof window !== "undefined" && !editId) {
      try {
        const savedDraftRaw = localStorage.getItem(draftKey);
        if (savedDraftRaw) {
          const saved = JSON.parse(savedDraftRaw);
          if (saved.title) setTitle(saved.title);
          if (saved.description) {
            setDescription(saved.description);
            setPreviewDescription(saved.description);
          }
          if (saved.category) setCategory(saved.category);
          if (saved.p1Area) setP1Area(saved.p1Area);
          if (saved.p2Specific) setP2Specific(saved.p2Specific);
          if (saved.price) setPrice(saved.price);
          if (saved.phone) setPhone(saved.phone);
          if (saved.validFrom) setValidFrom(saved.validFrom);
          if (saved.validTo) setValidTo(saved.validTo);
          toast.success("Draft restored from your last session!");
        }
      } catch (e) {}
    }
  }, [draftKey, editId]);

  // Handle Back Button Press
  const handleBackClick = () => {
    if (isDirty) {
      setShowDraftModal(true);
    } else {
      router.push(config.redirectPath);
    }
  };

  // Handle Save Draft Action
  const handleSaveDraft = () => {
    if (typeof window !== "undefined") {
      try {
        const draftData = {
          title,
          description,
          category,
          p1Area,
          p2Specific,
          price,
          phone,
          validFrom,
          validTo,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        toast.success("Draft saved successfully!");
      } catch (e) {}
    }
    setShowDraftModal(false);
    router.push(config.redirectPath);
  };

  // Handle Discard Action
  const handleDiscard = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(draftKey);
    }
    setShowDraftModal(false);
    router.push(config.redirectPath);
  };

  // Comprehensive Edit Mode Data Loader (Firestore + LocalStorage Fallback)
  useEffect(() => {
    if (!editId) return;

    const populateFields = (data: any) => {
      if (data.title || data.name || data.shop_name || data.offer_title) setTitle(data.title || data.name || data.shop_name || data.offer_title);
      if (data.description || data.offer_description || data.raw_text) {
        const desc = data.description || data.offer_description || data.raw_text;
        setDescription(desc);
        setPreviewDescription(desc);
      }
      if (data.category || data.skill_category) setCategory(data.category || data.skill_category);
      if (data.area_tag) setArea(data.area_tag);
      if (data.price !== undefined && data.price !== null) setPrice(String(data.price));
      if (data.phone) setPhone(data.phone);
      if (data.show_phone !== undefined) setShowPhone(Boolean(data.show_phone));
      if (data.google_maps_url) setGoogleMapsUrl(data.google_maps_url);
      if (data.youtube_url) setYoutubeUrl(data.youtube_url);
      if (data.video_url) setYoutubeUrl(data.video_url);
      if (data.valid_from) setValidFrom(data.valid_from);
      if (data.valid_to) setValidTo(data.valid_to);
      if (data.image_url) setImagePreview(data.image_url);
      if (data.image_urls && Array.isArray(data.image_urls) && data.image_urls.length > 0) {
        setImagePreviews(data.image_urls);
      } else if (data.image_url) {
        setImagePreviews([data.image_url]);
      }
    };

    // Fetch from Firestore for authoritative cloud data across all collections
    const candidateCols = editCol ? [editCol, "needs_and_sales", "services", "shops", "offers"] : [segment === "service" ? "services" : segment === "offer" ? "shops" : "needs_and_sales", "needs_and_sales", "services", "shops", "offers"];
    
    async function loadEditData() {
      if (!editId) return;
      for (const col of candidateCols) {
        try {
          const snap = await getDoc(doc(db, col, editId));
          if (snap.exists()) {
            setEditCol(col);
            populateFields(snap.data());
            toast.success("Loaded post data for editing!");
            break;
          }
        } catch (e) {}
      }
    }
    loadEditData();
  }, [editId]);



  const getApiUrl = (endpoint: string) => {
    if (typeof window !== "undefined") {
      const isNative = (window as any).Capacitor?.isNativePlatform() || window.location.protocol === "file:" || window.location.origin.includes("localhost");
      if (isNative) {
        return `https://mythanjai.vercel.app${endpoint}`;
      }
    }
    return endpoint;
  };



  const [isAiRefined, setIsAiRefined] = useState(false);

  const formatTextFallback = (text: string) => {
    if (!text || !text.trim()) return "";
    let lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 1 && lines[0].includes(",")) {
      const parts = lines[0].split(",").map((p) => p.trim()).filter((p) => p.length > 2);
      if (parts.length >= 2) lines = parts;
    }

    const formatted = lines.map((line) => {
      let cleaned = line.replace(/^[\s•\-\*\d\.\:\>]+/g, "").trim();
      if (!cleaned) return "";
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      return `• ${cleaned}`;
    }).filter(Boolean);

    return formatted.length > 0 ? formatted.join("\n") : text.trim();
  };

  const handleManualRefine = async () => {
    if (!description.trim()) {
      toast.info("Please type a description first to refine.");
      return;
    }
    setIsAiRewriting(true);
    let newDesc = "";
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
        newDesc = data.formattedText;
        if (data.extractedFields && segment === "offer") {
          const { shop_name, valid_from: extFrom, valid_to: extTo, area_tag } = data.extractedFields;
          if (shop_name && !title) setTitle(shop_name);
          if (extFrom) setValidFrom(extFrom);
          if (extTo) setValidTo(extTo);
          if (area_tag) setArea(area_tag);
        }
      } else {
        newDesc = formatTextFallback(description);
      }
    } catch (err) {
      newDesc = formatTextFallback(description);
    } finally {
      if (!newDesc || newDesc.trim() === description.trim()) {
        newDesc = formatTextFallback(description);
      }
      setDescription(newDesc);
      setPreviewDescription(newDesc);
      setIsAiRefined(true);
      setIsAiRewriting(false);
      toast.success("Description refined & updated in Live Preview!");
    }
  };

  // Live description sync to Live Card Preview
  useEffect(() => {
    setPreviewDescription(description.trim());
  }, [description]);

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
          toast.success("✓ Auto-filled Store Name, Location & Phone!");
        }
      } catch (err) {
        console.warn("OCR auto-extraction skipped:", err);
      } finally {
        setIsOcrScanning(false);
      }
    }
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!isAuthVerified) {
      toast.info("Please verify your WhatsApp mobile number to publish your ad.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }

    if (!title.trim()) {
      const fieldName = segment === "offer" ? "Shop Name" : segment === "service" ? "Full Name / Service Title" : "Title / Item Name";
      const err = `Required Field Missing: Please enter ${fieldName} *`;
      setValidationError(err);
      toast.error(err);
      return;
    }

    if (!category || !category.trim()) {
      const err = "Required Field Missing: Please select a Category *";
      setValidationError(err);
      toast.error(err);
      return;
    }

    const finalArea = area && area.trim() ? area.trim() : "Thanjavur";

    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      const err = "Required Field Missing: Please enter a valid 10-digit Contact Phone Number *";
      setValidationError(err);
      toast.error(err);
      return;
    }

    if (segment === "offer") {
      if (!selectedImage && !imagePreview && imagePreviews.length === 0) {
        const err = "Required: Please attach a photo of your shop offer or bill (Compulsory for Store Offers).";
        setValidationError(err);
        toast.error(err);
        return;
      }
      if (validFrom && validTo && new Date(validTo) < new Date(validFrom)) {
        const err = "Valid To date cannot be earlier than Valid From date!";
        setValidationError(err);
        toast.error(err);
        return;
      }
    }

    setLoading(true);

    const timestamp = serverTimestamp();
    const uid = profile?.memberId || user?.uid || (profile?.phone ? `NT-${profile.phone.replace(/\D/g, "").slice(-10)}` : "guest_user");
    const cleanDesc = description.trim();

    const defaultCoverImage =
      imagePreviews.length > 0
        ? imagePreviews[0]
        : imagePreview && !imagePreview.startsWith("data:")
        ? imagePreview
        : "/thanjavur_temple_illustration.png";

    // ── STEP 1: Content & Moderation Check ──
    try {
      const { checkPostSpamAndRateLimit } = await import("@/lib/spam-filter");
      const spamCheck = await checkPostSpamAndRateLimit({
        phone: phone || "9876543210",
        title: title.trim(),
        description: cleanDesc,
      });

      if (!spamCheck.isAllowed) {
        setLoading(false);
        const err = spamCheck.reason || "Post rejected by moderation filter.";
        setValidationError(err);
        toast.error(err);
        return;
      }
    } catch (e) {}

    // ── STEP 2: Upload Images to Firebase Storage (with 2.5s timeout & instant base64 fallback) ──
    let cloudImageUrl = defaultCoverImage;
    let cloudImageUrls: string[] = [];

    const uploadSingleImageWithTimeout = async (file: File, fallbackBase64: string): Promise<string> => {
      try {
        const compressed = await compressImage(file, 600, 600, 0.65).catch(() => null);
        const blobToUpload = compressed?.blob || file;
        const fileName = `postings/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const storageRef = ref(storage, fileName);

        const uploadPromise = uploadBytes(storageRef, blobToUpload).then((snap) => getDownloadURL(snap.ref));
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Storage upload timeout")), 2500)
        );

        return await Promise.race([uploadPromise, timeoutPromise]);
      } catch (err) {
        console.warn("Storage upload note (using instant WebP fallback):", err);
        return fallbackBase64 || defaultCoverImage;
      }
    };

    try {
      if (segment === "sell" && selectedImages.length > 0) {
        const uploaded = await Promise.all(
          selectedImages.map((img, idx) =>
            uploadSingleImageWithTimeout(img, imagePreviews[idx] || defaultCoverImage)
          )
        );
        cloudImageUrls = uploaded;
        cloudImageUrl = uploaded[0] || defaultCoverImage;
      } else if (selectedImage) {
        const uploadedUrl = await uploadSingleImageWithTimeout(selectedImage, imagePreview || defaultCoverImage);
        cloudImageUrl = uploadedUrl;
        cloudImageUrls = [uploadedUrl];
      } else if (imagePreviews.length > 0) {
        cloudImageUrls = imagePreviews;
        cloudImageUrl = imagePreviews[0] || defaultCoverImage;
      }
    } catch (storageErr) {
      console.warn("Storage processing note:", storageErr);
      cloudImageUrls = imagePreviews.length > 0 ? imagePreviews : [defaultCoverImage];
      cloudImageUrl = cloudImageUrls[0] || defaultCoverImage;
    }



    // ── STEP 3: Write Directly to Firestore (NO LOCALSTORAGE) ──
    if (editId && !editCol) {
      setLoading(false);
      const err = "Error: Could not locate original listing in cloud database to update.";
      setValidationError(err);
      toast.error(err);
      return;
    }

    const targetCol = editCol || (segment === "service" ? "services" : segment === "offer" ? "shops" : "needs_and_sales");
    let createdDocId = editId || "";
    const finalImageUrls = cloudImageUrls && cloudImageUrls.length > 0 ? cloudImageUrls : [cloudImageUrl || ""];

    try {
      let payloadToSave: any = null;

      if (segment === "sell" || segment === "need") {
        payloadToSave = {
          userId: uid,
          seller_id: uid,
          type: segment === "sell" ? "SELL" : "NEED",
          title: title.trim(),
          description: cleanDesc,
          raw_text: cleanDesc,
          area_tag: finalArea,
          category: category || "General",
          price: price ? price : null,
          phone: phone || "9876543210",
          show_phone: Boolean(showPhone),
          image_url: cloudImageUrl || "",
          image_urls: finalImageUrls,
          google_maps_url: googleMapsUrl.trim() || "",
          is_verified: true,
          status: "active",
        };
      } else if (segment === "service") {
        payloadToSave = {
          userId: uid,
          seller_id: uid,
          name: title.trim(),
          skill_category: category || "General Service",
          sub_category: subCategory || "",
          description: cleanDesc,
          area_tag: finalArea,
          phone: phone || "9876543210",
          show_phone: Boolean(showPhone),
          all_working_days: allWorkingDays,
          sunday_leave: sundayLeave,
          experience: "Verified Provider",
          rating: 5.0,
          rating_count: 1,
          badge: "VERIFIED TRADE",
          image_url: cloudImageUrl || "",
          is_verified: true,
          status: "active",
        };
      } else if (segment === "offer") {
        payloadToSave = {
          userId: uid,
          seller_id: uid,
          shop_name: title.trim(),
          category: category || "Retail Deals",
          address_text: finalArea,
          area_tag: finalArea,
          phone: phone || "9876543210",
          show_phone: Boolean(showPhone),
          offer_title: title.trim(),
          offer_description: cleanDesc,
          valid_from: validFrom || null,
          image_url: cloudImageUrl || "",
          image_urls: finalImageUrls,
          is_verified: true,
          status: "active",
        };
      }

      const saveOrUpdateDocument = async (col: string, id: string | null, dataPayload: any) => {
        if (id) {
          try {
            await updateDoc(doc(db, col, id), dataPayload);
          } catch (clientErr: any) {
            console.warn("Client updateDoc note, trying privileged server API:", clientErr?.message);
            const idToken = (await auth.currentUser?.getIdToken().catch(() => "")) || "";
            const apiRes = await fetch(getApiUrl("/api/post/update"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: idToken ? `Bearer ${idToken}` : "",
              },
              body: JSON.stringify({ postId: id, colName: col, payload: dataPayload }),
            }).then((r) => r.json());

            if (!apiRes || !apiRes.success) {
              throw new Error(apiRes?.error || clientErr?.message || "Missing or insufficient permissions");
            }
          }
        } else {
          try {
            const docRef = await addDoc(collection(db, col), {
              ...dataPayload,
              created_at: timestamp,
              ...((segment as string) === "sell" || (segment as string) === "need" ? { expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } : {}),
              ...((segment as string) === "service" ? { negative_reports_count: 0 } : {}),
            });
            if (docRef) createdDocId = docRef.id;
          } catch (clientCreateErr: any) {
            console.warn("Client addDoc failed, using privileged server API fallback:", clientCreateErr?.message);
            const apiRes = await fetch(getApiUrl("/api/post/create"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                colName: col,
                payload: {
                  ...dataPayload,
                  ...((segment as string) === "sell" || (segment as string) === "need" ? { expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } : {}),
                  ...((segment as string) === "service" ? { negative_reports_count: 0 } : {}),
                },
              }),
            }).then((r) => r.json());

            if (apiRes && apiRes.success && apiRes.id) {
              createdDocId = apiRes.id;
            } else {
              throw new Error(apiRes?.error || clientCreateErr?.message || "Failed to create post");
            }
          }
        }
      };

      await saveOrUpdateDocument(targetCol, editId, payloadToSave);

      // Store in my_posts local tracker for instant retrieval on My Listings page
      if (typeof window !== "undefined" && createdDocId) {
        try {
          const storedMyPosts: any[] = JSON.parse(localStorage.getItem("namma_thanjai_my_posts") || "[]");
          const existingIdx = storedMyPosts.findIndex((p) => p.id === createdDocId);
          const newPostItem = { id: createdDocId, colName: targetCol, ...payloadToSave, created_at: new Date().toISOString() };
          if (existingIdx >= 0) {
            storedMyPosts[existingIdx] = newPostItem;
          } else {
            storedMyPosts.unshift(newPostItem);
          }
          localStorage.setItem("namma_thanjai_my_posts", JSON.stringify(storedMyPosts));
        } catch (e) {}
      }

      // Log Audit Event
      try {
        const { logAuditEvent } = await import("@/lib/audit-logger");
        await logAuditEvent({
          action: editId ? "POST_UPDATED" : "POST_CREATED",
          actorUid: uid,
          actorPhone: phone || "Unknown",
          actorName: profile?.displayName || "Namma Thanjai User",
          targetPostId: createdDocId || "post_" + Date.now(),
          targetPostTitle: title.trim(),
          category: segment.toUpperCase(),
          details: `${editId ? "Updated" : "Created"} post "${title.trim()}" in category ${segment.toUpperCase()} at ${area}`,
          visibilityState: "public",
        });
      } catch (e) {}

      // ONLY WHEN FIRESTORE SUCCEEDS: Show success and navigate
      setSuccess(true);
      setLoading(false);
      toast.success(editId ? "Ad updated successfully! 🎉" : "Ad published successfully! 🎉");
      router.push(config.redirectPath);

    } catch (firestoreError: any) {
      // ON FIRESTORE FAILURE: DO NOT save to localStorage, DO NOT redirect, DO NOT show success
      console.error("Firestore persistence error:", firestoreError);
      setLoading(false);
      const errMsg = `Publish Failed: ${firestoreError?.message || "Connection error."} Please check your connection and try again.`;
      setValidationError(errMsg);
      toast.error(errMsg);
    }
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
    <div className="w-full flex flex-col gap-0 font-sans min-h-screen bg-[#f8fafc]">
      <DraftProtectionModal
        isOpen={showDraftModal}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
        onCancel={() => setShowDraftModal(false)}
      />
      {/* Full-Width White Post Form Header Bar — Back Button + Left-Aligned Title + Right (X) Discard Button */}
      <div className="w-full bg-white text-slate-900 border-b border-slate-200/90 py-3 px-4 sm:px-8 flex items-center justify-between shadow-sm shrink-0 sticky top-0 z-50 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile Web App & APK: Back Button */}
            <button
              type="button"
              onClick={handleBackClick}
              className="md:hidden px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Back to feed"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>

            {/* Desktop Website: Namma Thanjai Logo */}
            <img
              src="/namma_thanjai_logo.png"
              alt="Namma Thanjai"
              className="hidden md:block h-8 w-auto object-contain cursor-pointer shrink-0"
              onClick={handleBackClick}
            />

            <h1 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight truncate text-left">
              {config.title}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleBackClick}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-rose-600 transition-all cursor-pointer active:scale-95 shrink-0 ml-2"
            title="Close & Discard Form"
          >
            <X className="w-4.5 h-4.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-8 sm:pb-12 flex flex-col gap-3">

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 flex flex-col items-center text-center gap-3 animate-fade-in my-8 max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="font-heading font-bold text-lg text-emerald-900">Post Published Successfully!</h2>
          <p className="text-xs text-emerald-700 font-medium">Redirecting to feed...</p>
        </div>
      ) : (
        /* CLEAN 2-COLUMN SPLIT LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Form Controls (Container-less flat form layout) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-4 p-0 m-0 bg-transparent border-0 shadow-none">
            {/* Red Alert Box for Missing Required Fields */}
            {validationError && (
              <div className="w-full p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-2xs animate-shake">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>{validationError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="text-rose-600 hover:text-rose-900 font-bold text-xs uppercase cursor-pointer"
                >
                  ✕ Dismiss
                </button>
              </div>
            )}

            {/* CATEGORY & SUBCATEGORY SELECTION */}
            {segment === "service" ? (
              <div className="w-full flex flex-col gap-3.5 bg-slate-50 border border-slate-200/90 rounded-xl p-4 shadow-2xs">
                {/* Header */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-500" />
                      <span>Select Service Category &amp; Trade *</span>
                    </label>
                    <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                      {category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Select your service category and trade below</p>
                </div>

                {/* Neat Category Grid Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "Home Services", label: "Home Services", desc: "Plumber, Electrician", icon: Home },
                    { id: "Repair & Technicians", label: "Repair & Tech", desc: "AC, Fridge, TV, Mobile", icon: Wrench },
                    { id: "Vehicle Services", label: "Vehicle Care", desc: "Mechanic, Puncture", icon: Car },
                    { id: "Health & Personal Care", label: "Health & Care", desc: "Nursing, Beautician", icon: Heart },
                    { id: "Event & Media Services", label: "Event & Media", desc: "Photos, Catering", icon: Camera },
                    { id: "Education & Tutors", label: "Education", desc: "Tuition, Teachers", icon: GraduationCap },
                    { id: "Business & Professional", label: "Business & Legal", desc: "Tax, Printing, Legal", icon: Briefcase },
                    { id: "General Service", label: "General Trade", desc: "Helper, Laborer", icon: UserCheck },
                  ].map((catItem) => {
                    const IconComponent = catItem.icon;
                    const isSelected = category === catItem.id;
                    return (
                      <button
                        key={catItem.id}
                        type="button"
                        onClick={() => {
                          setCategory(catItem.id);
                          const subs = SERVICE_SUBCATEGORIES_MAP[catItem.id] || [];
                          setSubCategory(subs[0] || "");
                        }}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/30 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <div className={`p-1.5 rounded-lg mb-1.5 ${isSelected ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-100 text-slate-700"}`}>
                          <IconComponent className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <span className={`text-xs font-black line-clamp-1 ${isSelected ? "text-slate-950" : "text-slate-800"}`}>
                          {catItem.label}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1 font-medium">
                          {catItem.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Subcategory Trade Pills */}
                <div className="flex flex-col gap-1.5 pt-2.5 border-t border-slate-200/80">
                  <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Specific Trade / Profession *</span>
                    <span className="text-slate-400 font-medium normal-case">Tap your exact trade</span>
                  </label>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-thin p-2 bg-white border border-slate-200 rounded-xl">
                    {(SERVICE_SUBCATEGORIES_MAP[category] || ["General Helper"]).map((sub) => {
                      const isSubSelected = subCategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSubCategory(sub)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSubSelected
                              ? "bg-slate-900 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
                          }`}
                        >
                          {isSubSelected && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                          <span>{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Non-Service Categories Dropdown (Sell, Need, Offer) */
              <div className="w-full flex flex-col gap-1">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 cursor-pointer"
                >
                  {config.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* OFFER FORM INPUTS */}
            {segment === "offer" ? (
              <>
                {/* 1. UPLOAD VISITING CARD / FLYER PHOTO (TOP - OPTIONAL) */}
                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all group relative">
                  {isOcrScanning && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-xl z-20 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
                      <span className="text-xs font-bold text-slate-800">Reading Store Name &amp; Location from Card...</span>
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
                          Upload Visiting Card / Flyer Photo (Optional)
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5 max-w-sm font-medium">
                          Fills Store Name &amp; Location directly into Live Preview!
                        </span>
                      </div>
                      <span className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-lg transition-all border border-amber-400 shadow-2xs mt-0.5">
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
                    className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal pr-12"
                  />
                  <span className="absolute right-0 top-3 text-[11px] font-medium text-slate-400">
                    {title.length}/{config.maxTitleChars}
                  </span>
                </div>

                {/* 3. OFFER DESCRIPTION LINE */}
                <div className="relative w-full">
                  <textarea
                    rows={3}
                    maxLength={config.maxDescChars}
                    placeholder="Offer Description (Optional — Describe discount, terms, packages, or items)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full py-2.5 text-sm font-medium border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors leading-relaxed placeholder:text-slate-400"
                  />
                  <span className="absolute right-0 bottom-3 text-[11px] font-medium text-slate-400">
                    {description.length}/{config.maxDescChars}
                  </span>
                </div>

                {/* 4. OFFER VALIDITY DATES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" /> Valid From Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full py-1.5 text-xs font-bold border-b border-slate-300 bg-transparent focus:outline-none focus:border-amber-500 text-slate-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" /> Valid To Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full py-1.5 text-xs font-bold border-b border-slate-300 bg-transparent focus:outline-none focus:border-amber-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* 5. ADDRESS LINE — Freeform Location Input (FOR OFFER) */}
                <div className="w-full">
                  <input
                    type="text"
                    required
                    placeholder="Enter location / area *"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal"
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
                    className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal"
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
                    className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal pr-12"
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
                      className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Select Location *</option>
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
                        maxLength={12}
                        placeholder="Price or Rate (e.g. 5000, 5000rs)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal pr-20"
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
                        placeholder="Enter location / area *"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal"
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
                        maxLength={12}
                        placeholder="Budget (e.g. 5000, 5000rs - Optional)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>

                    <div className="w-full">
                      <select
                        required
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors cursor-pointer"
                      >
                        <option value="" disabled>Select Location *</option>
                        {THANJAVUR_TOWNS.map((town) => (
                          <option key={town} value={town}>{town}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* MANDATORY 2-TIER LOCALITY SELECTOR */}
                <div className="w-full">
                  <LocalitySelector
                    p1Area={p1Area}
                    setP1Area={setP1Area}
                    p2Specific={p2Specific}
                    setP2Specific={setP2Specific}
                  />
                </div>

                {/* CONTACT PHONE INPUT LINE */}
                <div className="w-full">
                  <input
                    type="tel"
                    required
                    placeholder="📞 Contact phone number * (e.g. 9994837342)"
                    value={phone}
                    onChange={(e) => { userEditedPhone.current = true; setPhone(e.target.value); }}
                    className="w-full py-2.5 text-sm font-semibold border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                {/* Description Input Container */}
                <div className="flex flex-col gap-1.5 w-full relative">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs font-semibold text-slate-700">
                      {segment === "service" ? "Work Experience & Skill Details (Optional)" : "Description or details (Optional)"}
                    </label>
                    <span className={`text-xs font-medium ${description.length >= config.maxDescChars ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                      {description.length}/{config.maxDescChars}
                    </span>
                  </div>

                  <div className="w-full">
                    <textarea
                      rows={4}
                      maxLength={config.maxDescChars}
                      placeholder={
                        segment === "service"
                          ? "Describe your trade skills, work experience, and services offered (Optional)..."
                          : "Describe your requirement, item condition, or service details (Optional)..."
                      }
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-amber-500 focus:bg-white text-slate-900 transition-all resize-y min-h-[100px] max-h-56 overflow-y-auto leading-relaxed"
                    />
                  </div>

                  {/* AI Refine Button Positioned Below Description Textarea */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleManualRefine}
                      disabled={isAiRewriting || !description.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-heading font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-amber-300 active:scale-95 disabled:opacity-40"
                      title="Click to auto-format and push refined description to Live Preview"
                    >
                      {isAiRewriting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          <span>Refining...</span>
                        </>
                      ) : (
                        <span>✨ AI Refine</span>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Sell Specific Links */}
            {segment === "sell" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-500" /> Google Maps URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  className="w-full py-2.5 text-xs font-medium border-b-2 border-slate-200 focus:border-amber-500 bg-transparent rounded-none focus:outline-none text-slate-900 transition-colors"
                />
              </div>
            )}

            {/* Sell/Need Phone Toggle */}
            {(segment === "sell" || segment === "need") && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 mt-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
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
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
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
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100 border-l-4 border-slate-800 rounded-r-xl shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-heading font-black text-xs sm:text-sm text-slate-900 tracking-tight">
                  LIVE CARD PREVIEW
                </h3>
              </div>
              <span className="text-[10px] font-black text-slate-800 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-md uppercase tracking-widest shadow-2xs">
                Real-Time
              </span>
            </div>

            <div className="w-full flex flex-col gap-3 relative pointer-events-none select-none opacity-95">
              {isAiRewriting && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-900 font-bold text-xs shadow-2xs">
                  <span>Formatting description text...</span>
                </div>
              )}
              {segment === "sell" || segment === "need" ? (
                <ListingCard listing={previewSellOrNeedPost as any} isPreview={true} />
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
              className="w-full px-6 py-3.5 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-md transition-all select-none active:scale-95 disabled:opacity-50"
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
    </div>
  );
}
