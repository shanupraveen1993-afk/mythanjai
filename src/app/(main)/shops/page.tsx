"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ShopCard from "@/components/cards/ShopCard";
import { SHOP_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";
import { ShopPost } from "@/types";
import { Store, Plus, ChevronDown, ChevronUp, Loader2, ArrowRight, ArrowLeft, Upload, Compass, X, MapPin, Sparkles, Check, Calendar, Share2, MessageSquare, Video, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";

// Locality coordinates centers to auto-coordinate map markers
const LOCALITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Tanjore Town (General)": { lat: 10.7870, lng: 79.1378 },
  "Big Temple Area": { lat: 10.7915, lng: 79.1305 },
  "Medical College Road": { lat: 10.7588, lng: 79.1092 },
  "New Bus Stand": { lat: 10.7852, lng: 79.1162 },
  "Old Bus Stand": { lat: 10.7905, lng: 79.1385 },
  "Vallam": { lat: 10.7161, lng: 79.0305 },
  "East Gate": { lat: 10.7955, lng: 79.1485 },
  "South Rampart": { lat: 10.7858, lng: 79.1285 },
  "Srinivasapuram": { lat: 10.7765, lng: 79.1315 },
  "Yagappa Nagar": { lat: 10.7688, lng: 79.1495 },
  "Pillaiyarpatti": { lat: 10.7551, lng: 79.0705 },
  "Karanthai": { lat: 10.8095, lng: 79.1415 },
  "Pookara Street": { lat: 10.7825, lng: 79.1445 },
  "Nanjikottai Road": { lat: 10.7495, lng: 79.1405 },
  "Vilar Road": { lat: 10.7585, lng: 79.1555 },
  "Ramanathan Hospital Area": { lat: 10.7785, lng: 79.1255 },
  "New Housing Unit": { lat: 10.7795, lng: 79.1125 },
  "Mariamman Kovil": { lat: 10.7935, lng: 79.1825 },
  "Sanjivi Nagar": { lat: 10.7635, lng: 79.1625 },
  "Manojipatti": { lat: 10.7485, lng: 79.0885 },
};

// Load LeafletMap client-side only
const LeafletMap = dynamic(() => import("@/components/maps/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-105 animate-pulse flex items-center justify-center text-xs text-slate-550">
      Loading OpenStreetMap Assets...
    </div>
  ),
});

export default function ShopsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Store Offers...</div>}>
      <ShopsPageContent />
    </React.Suspense>
  );
}

function ShopsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  
  const area = (searchParams.get("area") || "All Areas") as TanjoreLocality | "All Areas";
  const selectedCategory = searchParams.get("category") || null;
  const mapShop = searchParams.get("map") ? JSON.parse(decodeURIComponent(searchParams.get("map") || "")) : null;

  const CATEGORY_STOCK_IMAGES: Record<string, string> = {
    "Cafe & Restaurant": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80",
    "Supermarket & Grocery": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    "Textiles & Clothing": "https://images.unsplash.com/photo-1524255684952-d7185b509571?auto=format&fit=crop&w=400&q=80",
    "Jewelry Showroom": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80",
    "Electronics Shop": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80",
    "Others": "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=400&q=80",
  };

  const CATEGORY_SAMPLE_POSTS: Record<string, { shopName: string; address: string; hours: string; landmark: string; offerTitle?: string; offerDescription?: string }> = {
    "Cafe & Restaurant": {
      shopName: "Famous Tanjore Degree Coffee & Tiffin House",
      address: "No. 12, East Main Street, Near Big Temple Entrance",
      hours: "6:00 AM - 10:00 PM",
      landmark: "Opposite Temple Car Parking",
      offerTitle: "Degree Coffee + Ghee Roast Deal",
      offerDescription: "Get 1 Free Degree Coffee with every Ghee Roast ordered between 4 PM to 7 PM!"
    },
    "Supermarket & Grocery": {
      shopName: "Sri Murugan Super Grocery Mart",
      address: "Plot 45, Medical College Road, Srinivasapuram",
      hours: "8:00 AM - 10:00 PM",
      landmark: "Near Rajah Serfoji College Gate",
      offerTitle: "Flat 10% Off On Rice Bags",
      offerDescription: "10% direct discount on purchase of 25KG Ponni Rice bags. Free home delivery within 3 kms."
    },
    "Textiles & Clothing": {
      shopName: "Tanjore Handloom Silk & Cotton House",
      address: "Shop 8, South Rampart Road",
      hours: "9:30 AM - 9:00 PM",
      landmark: "Beside Old Housing Board Buildings",
      offerTitle: "Flat 20% Off Silk Sarees",
      offerDescription: "20% off on all pure Tanjore handloom silk sarees. Perfect for wedding season!"
    },
    "Jewelry Showroom": {
      shopName: "Sree Balaji Gold & Diamond Mart",
      address: "Shop No. 78, Gandhiji Road, Tanjore Town",
      hours: "10:00 AM - 8:30 PM",
      landmark: "Near Old Bus Stand Junction",
      offerTitle: "Zero Making Charges On Silver Items",
      offerDescription: "Celebrate the festival with 0% making charges on all silver lamps, plates, and gift items."
    },
    "Electronics Shop": {
      shopName: "Tanjore Digital Mobile & Laptop Hub",
      address: "Door No. 34, New Bus Stand Main Road",
      hours: "9:00 AM - 9:30 PM",
      landmark: "Adjacent to New Bus Stand Ingate",
      offerTitle: "Free Premium Temper Glass + Cover",
      offerDescription: "Get premium screen guard and transparent case free on every new mobile purchase."
    },
    "Others": {
      shopName: "Raja General Stores & Toys Palace",
      address: "No. 15, Yagappa Nagar Main Street",
      hours: "9:00 AM - 9:30 PM",
      landmark: "Opposite Pillayar Temple",
      offerTitle: "Buy 2 Get 1 Free on Soft Toys",
      offerDescription: "Special weekend offer on all wooden toys and premium soft toys. Bring children for free balloons!"
    }
  };

  const getSamplePost = () => {
    const cat = selectedCategory || "Others";
    return CATEGORY_SAMPLE_POSTS[cat] || CATEGORY_SAMPLE_POSTS["Others"];
  };

  // Seed initial sample shops in local state
  const [localShops, setLocalShops] = useState<ShopPost[]>([
    {
      id: "glen_gallery",
      userId: "sample_user_shop1",
      shop_name: "GLEN EXCLUSIVE GALLERY",
      category: "Electronics Shop",
      address_text: "New Busstand Road, Thanjavur",
      landmark: "Near New Bus Stand",
      hours: "9:30 AM - 9:00 PM",
      phone: "9876543216",
      area_tag: "New Busstand Rd",
      offer_title: "Up to 60% OFF - Grand Opening Sale",
      offer_description: "Grand Opening Sale! Up to 60% discount on all kitchen chimneys, built-in hobs, cooktops & gas stoves.",
      video_url: "/videos/glen_gallery_offer.mp4",
      image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
      latitude: 10.7852,
      longitude: 79.1162,
      is_claimed: true,
      created_at: new Date() as any,
    },
    {
      id: "degree_coffee",
      userId: "sample_user_shop2",
      shop_name: "Tanjore Degree Coffee",
      category: "Cafe & Restaurant",
      address_text: "Gandhiji Road, Thanjavur",
      landmark: "Near Railway Station",
      hours: "6:00 AM - 10:00 PM",
      phone: "9876543217",
      area_tag: "Gandhiji Rd",
      offer_title: "Buy 1 Get 1 Free Degree Coffee",
      offer_description: "Authentic traditional filter coffee brewed fresh with pure cow milk. Buy 1 Ghee Roast & Get 1 Free Degree Coffee.",
      image_url: "/thanjavur_temple_illustration.png",
      latitude: 10.7915,
      longitude: 79.1305,
      is_claimed: true,
      created_at: new Date() as any,
    }
  ]);

  const targetPostId = searchParams.get("post");
  useEffect(() => {
    if (targetPostId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetPostId]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [hours, setHours] = useState("9:00 AM - 9:00 PM");
  const [phone, setPhone] = useState("");
  const [formArea, setFormArea] = useState("");
  const [latitude, setLatitude] = useState(10.7870);
  const [longitude, setLongitude] = useState(79.1378);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerSocialLink, setOfferSocialLink] = useState("");
  const [offerExpiryDate, setOfferExpiryDate] = useState("");
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const displayShopName = shopName || getSamplePost().shopName;
  const displayAddress = address || getSamplePost().address;
  const displayHours = hours || getSamplePost().hours;
  const displayLandmark = landmark || getSamplePost().landmark;
  const displayOfferTitle = offerTitle || getSamplePost().offerTitle || "";
  const displayOfferDesc = offerDescription || getSamplePost().offerDescription || "";
  const previewImage = imagePreview || CATEGORY_STOCK_IMAGES[selectedCategory || "Others"] || CATEGORY_STOCK_IMAGES["Others"];

  // Expand form if ?create=true is in URL query parameters
  const triggerCreate = searchParams.get("create") === "true";
  useEffect(() => {
    if (triggerCreate && !loading) {
      if (!profile?.isVerified) {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set("auth", "popup");
        router.push(`/shops?${currentParams.toString()}`);
      } else {
        setIsFormOpen(true);
      }
    }
  }, [triggerCreate, profile, loading]);

  const handleFormAreaChange = (newArea: string) => {
    setFormArea(newArea);
    const coords = LOCALITY_COORDS[newArea];
    if (coords) {
      setLatitude(coords.lat);
      setLongitude(coords.lng);
    }
  };

  const { data: shops, loading: shopsLoading } = useFirestore<ShopPost>({
    collectionName: "shops",
    areaTag: area,
    category: selectedCategory || "All",
  });

  const combinedShops = React.useMemo(() => {
    const activeLocal = localShops.filter(s => !selectedCategory || s.category === selectedCategory);
    return [...activeLocal, ...(shops || [])];
  }, [localShops, shops, selectedCategory]);


  const handleCategorySelect = (category: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("category", category);
    router.push(`/shops?${currentParams.toString()}`);
  };

  const handleClearCategory = () => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("category");
    currentParams.delete("create");
    router.push(`/shops?${currentParams.toString()}`);
  };

  const handleMapToggle = (shop: ShopPost) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    if (mapShop && mapShop.id === shop.id) {
      currentParams.delete("map");
    } else {
      currentParams.set("map", encodeURIComponent(JSON.stringify(shop)));
    }
    router.push(`/shops?${currentParams.toString()}`);
  };

  // OCR visiting card scan for shops
  const handleOcrScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const { compressImage } = await import("@/lib/image-compressor");
      const compressed = await compressImage(file, 800, 800, 0.7);

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
        const { shop_name, phone: extractedPhone, address_text, detected_area } = result.data;
        
        if (shop_name) setShopName(shop_name);
        if (extractedPhone) setPhone(extractedPhone);
        if (address_text) setAddress(address_text);
        if (detected_area) {
          setFormArea(detected_area);
        }

        confetti({ particleCount: 30, colors: ["#fbbf24"] });
      } else {
        alert("Details extraction failed. Please fill manually.");
      }
    } catch (error) {
      console.error("OCR scan error:", error);
      alert("Error scanning card. Please fill manually.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Session not ready. Please try again.");
      return;
    }
    if (!selectedImage) {
      alert("Please upload a photo of your business card or storefront signboard to scan details.");
      return;
    }
    if (!shopName || !phone || !address || !selectedCategory) {
      alert("Verification Details missing. Please scan your business card first, or review expanded details.");
      return;
    }
    if (!offerDescription) {
      alert("Please enter details of your special discount offer.");
      return;
    }

    if (!formArea || !formArea.trim()) {
      alert("Please add a specific location in Thanjavur District.");
      return;
    }

    setUploading(true);

    // AI Location Verification for Thanjavur District
    const { aiLocalityCheck } = await import("@/lib/ai-locality-check");
    const isThanjavur = await aiLocalityCheck(formArea);
    if (!isThanjavur) {
      alert("Please add a specific location in Thanjavur District.");
      setUploading(false);
      return;
    }
    try {
      // 1. AI Format raw offer description if it exists
      let formattedOfferDesc = offerDescription || "";
      if (offerDescription) {
        try {
          const formatRes = await fetch("/api/gemini-format", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawDescription: offerDescription, type: "shops" }),
          });
          const formatData = await formatRes.json();
          if (formatData.success && formatData.formattedText) {
            formattedOfferDesc = formatData.formattedText;
          }
        } catch (err) {
          console.error("AI format failed, using raw description:", err);
        }
      }

      let imageUrl = "";

      // Upload Shop Banner
      if (selectedImage) {
        try {
          const { compressImage } = await import("@/lib/image-compressor");
          const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const { storage } = await import("@/lib/firebase");

          const compressed = await compressImage(selectedImage, 800, 800, 0.75);
          const imageRef = ref(storage, `shops/${Date.now()}_${compressed.fileName}`);
          const uploadSnapshot = await uploadBytes(imageRef, compressed.blob);
          imageUrl = await getDownloadURL(uploadSnapshot.ref);
        } catch (storageErr) {
          console.warn("Storage upload failed, using fallback preview image:", storageErr);
          imageUrl = imagePreview || CATEGORY_STOCK_IMAGES[selectedCategory || "Others"] || CATEGORY_STOCK_IMAGES["Others"];
        }
      }

      await addDoc(collection(db, "shops"), {
        userId: user.uid,
        shop_name: shopName,
        title: shopName,
        phone,
        area_tag: formArea,
        category: selectedCategory,
        address_text: address,
        landmark: landmark || "",
        hours: hours || "9:00 AM - 9:00 PM",
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        image_url: imageUrl || "",
        is_verified: true,
        is_featured: false,
        is_claimed: true,
        created_at: serverTimestamp(),
        offer_title: offerTitle || "Special Offer",
        offer_description: formattedOfferDesc,
        offer_social_link: offerSocialLink || "",
        offer_expires_at: offerExpiryDate ? new Date(offerExpiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Clear Form & Close
      setShopName("");
      setAddress("");
      setLandmark("");
      setPhone("");
      setHours("9:00 AM - 9:00 PM");
      setSelectedImage(null);
      setImagePreview("");
      setOfferTitle("");
      setOfferDescription("");
      setOfferSocialLink("");
      setOfferExpiryDate("");
      setIsFormOpen(false);

      confetti({ particleCount: 80, spread: 60 });
    } catch (error: any) {
      console.error("Shop registry failed:", error);
      alert("Registration failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Admin Instagram Reel Link AI Importer State
  const [reelUrlInput, setReelUrlInput] = useState("");
  const [reelAnalyzing, setReelAnalyzing] = useState(false);
  const isAdminUser = profile?.phone?.includes("9994837342") || user?.phoneNumber?.includes("9994837342") || profile?.isAdmin;

  const handleImportReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelUrlInput.trim()) {
      alert("Please paste a valid Instagram Reel link.");
      return;
    }
    setReelAnalyzing(true);
    const link = reelUrlInput.trim();

    // Call Gemini Caption / AI Analyzer
    let offerTitle = "📸 Instagram Video Reel Deal";
    let shopName = "Thanjavur Partner Offer";
    let category = "Cafe & Restaurant";
    let formattedCaption = "Exclusive promotional deal extracted from Instagram Reel! Tap 'Watch Reel' to view video offer on Instagram.";
    let thumbnailUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop";

    try {
      const res = await fetch("/api/gemini-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reelUrl: link }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.headline) offerTitle = data.headline;
        if (data.shopName) shopName = data.shopName;
        if (data.category) category = data.category;
        if (data.caption) formattedCaption = data.caption;
        if (data.thumbnailUrl) thumbnailUrl = data.thumbnailUrl;
      }
    } catch (err) {
      console.error("Gemini Reel AI analysis failed:", err);
    }

    const newReelItem: ShopPost = {
      id: `reel_${Date.now()}`,
      userId: user?.uid || "admin_account",
      shop_name: shopName,
      category: category as any,
      area_tag: formArea || "Tanjore Town (General)",
      phone: profile?.phone || "919994837342",
      image_url: thumbnailUrl,
      latitude: 10.7870,
      longitude: 79.1378,
      address_text: "Thanjavur",
      is_claimed: true,
      is_featured: true,
      created_at: new Date() as any,
      offer_title: offerTitle,
      offer_description: formattedCaption,
      offer_social_link: link,
    };

    setLocalShops((prev) => [newReelItem, ...prev]);

    try {
      await addDoc(collection(db, "shops"), {
        userId: user?.uid || "admin_account",
        shop_name: shopName,
        category: category,
        area_tag: formArea || "Tanjore Town (General)",
        phone: profile?.phone || "919994837342",
        image_url: thumbnailUrl,
        is_verified: true,
        is_featured: true,
        is_claimed: true,
        created_at: serverTimestamp(),
        offer_title: offerTitle,
        offer_description: formattedCaption,
        offer_social_link: link,
      });
    } catch (e) {
      console.warn("Firestore reel doc add skipped, local reel added:", e);
    }

    setReelUrlInput("");
    setReelAnalyzing(false);
    confetti({ particleCount: 100, spread: 70 });
  };

  const searchQuery = searchParams.get("query") || "";

  // Filter shops by search query
  const filteredShops = React.useMemo(() => {
    return combinedShops.filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.shop_name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.address_text?.toLowerCase().includes(q) ||
        s.offer_title?.toLowerCase().includes(q) ||
        s.offer_description?.toLowerCase().includes(q)
      );
    });
  }, [combinedShops, searchQuery]);

  return (
    <div className="flex flex-col gap-5 mt-3 md:mt-4 pt-1 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HERO BANNER: Shown ONLY on Main Category Overview Page */}
      {!selectedCategory && (
        <div className="relative w-full min-h-[190px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-md border border-slate-800 bg-slate-950 text-white flex items-center p-6 sm:p-8">
          <img 
            src="/thanjavur_hero_banner.png" 
            alt="Local Offers Banner" 
            className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover opacity-50 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-xl flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full w-fit">
              Local Discounts & Video Deals
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight uppercase leading-tight">
              Local Store Offers & Discounts
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Explore active store discounts, restaurant deals, clothing sales, and video offers in Thanjavur.
            </p>
          </div>
        </div>
      )}

      {/* DIRECT OFFERS FEED & STICKY ACTION BAR */}
      <div className="flex flex-col gap-5">
        {/* UNIVERSAL STICKY ACTION BAR */}
        <div className="sticky top-[57px] z-30 bg-white/95 backdrop-blur-md py-2.5 px-3.5 border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-2">
          <span className="font-heading font-black text-xs sm:text-sm text-slate-800 uppercase tracking-tight">
            {selectedCategory || "Local Offers & Store Deals"}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <select className="text-xs font-black bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer shrink-0 shadow-2xs">
              <option value="recent">Latest First</option>
            </select>

            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-2xs shrink-0"
            >
              <Plus className={`w-4 h-4 text-slate-955 transition-transform duration-250 ${isFormOpen ? "rotate-45" : ""}`} />
              <span>Post Offer</span>
            </button>
          </div>
        </div>



      {/* Inline Collapsible Shop Registration Form */}
      {isFormOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 p-4">
          <form onSubmit={handleRegisterShop} className="flex flex-col gap-5 bg-white">
                
                {/* Widescreen Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Column: Inputs */}
                  <div className="flex flex-col gap-3.5">
                    {/* AI Visiting Card Scan Section */}
                    <div className="bg-yellow-50 border border-yellow-250/60 rounded-xl p-3.5 text-center flex flex-col gap-2 relative">
                      <span className="text-[10px] font-black text-yellow-755 uppercase tracking-widest flex items-center justify-center gap-1">
                        <Compass className="w-3.5 h-3.5 fill-current animate-spin-slow text-yellow-650" />
                        AI Business Card / Signboard Scan (Required)
                      </span>
                      <p className="text-[10px] text-slate-500 leading-normal max-w-[280px] mx-auto font-bold">
                        Upload your storefront signboard or business card. Gemini will read it and automatically pre-fill details!
                      </p>
                      
                      <label className="mx-auto flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs active:scale-98">
                        {ocrLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                            <span>AI Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-yellow-600" />
                            <span>Upload Business Card</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleOcrScan} disabled={ocrLoading} className="hidden" />
                      </label>

                      {imagePreview && (
                        <div className="mx-auto mt-2 relative w-28 h-16 rounded-lg overflow-hidden border border-slate-200">
                          <img src={imagePreview} alt="Preview store" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Collapsible details review */}
                    {shopName && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-100/60 hover:bg-slate-100 transition-colors text-left text-slate-700 font-bold"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-black">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Verify Business Info (Auto-Filled)</span>
                          </div>
                          {isDetailsExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </button>

                        {isDetailsExpanded && (
                          <div className="p-3.5 border-t border-slate-200 flex flex-col gap-3.5 bg-white transition-all">
                            {/* Shop Name */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Shop Name
                              </label>
                              <input
                                type="text"
                                required
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                              />
                            </div>

                            {/* Address & Hours */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Street Address & Hours
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  required
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={hours}
                                  onChange={(e) => setHours(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                                />
                              </div>
                            </div>

                            {/* Landmark & Contact Phone */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                  Landmark
                                </label>
                                <input
                                  type="text"
                                  value={landmark}
                                  onChange={(e) => setLandmark(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  required
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                                />
                              </div>
                            </div>

                            {/* Locality & Coordinates */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Locality & Map Coordinates
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  value={formArea}
                                  onChange={(e) => handleFormAreaChange(e.target.value as TanjoreLocality)}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2 py-2 text-[10px] focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                                >
                                  {TANJORE_LOCALITIES.map((loc) => (
                                    <option key={loc} value={loc}>
                                      {loc}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  step="0.000001"
                                  required
                                  value={latitude}
                                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2 py-2 text-[10px] focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                                />
                                <input
                                  type="number"
                                  step="0.000001"
                                  required
                                  value={longitude}
                                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2 py-2 text-[10px] focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Required Offer Fields */}
                    <div className="border border-yellow-250 bg-yellow-50 rounded-xl p-3.5 flex flex-col gap-3.5">
                      <span className="text-[10px] font-black text-yellow-755 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-yellow-500 stroke-none" />
                        Offer Description & Expiry (Required)
                      </span>
                      
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Offer Details / Description
                        </label>
                        <textarea
                          required
                          value={offerDescription}
                          onChange={(e) => setOfferDescription(e.target.value)}
                          placeholder="e.g. Flat 30% off on all sarees, Dine-in special combo meal..."
                          rows={3}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Validity Expiry Date
                          </label>
                          <input
                            type="date"
                            required
                            value={offerExpiryDate}
                            onChange={(e) => setOfferExpiryDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none font-bold cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Instagram Reel Link (Optional)
                          </label>
                          <input
                            type="url"
                            value={offerSocialLink}
                            onChange={(e) => setOfferSocialLink(e.target.value)}
                            placeholder="Video reel link"
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Mockup Card Preview */}
                  <div className="flex flex-col gap-3 sticky top-0 p-1 md:border-l border-slate-100 md:pl-6 h-full justify-start select-none w-full">
                  {/* Right Column: Static Sample Offer Reference Box (NO EMULATOR) */}
                  <div className="flex flex-col gap-3 p-1 md:border-l border-slate-100 md:pl-6 h-full justify-start font-sans w-full">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Sample Offer Listing Reference
                    </span>

                    {/* Clean Static Reference Card */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3 w-full max-w-sm mx-auto text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-purple-950 bg-purple-400 px-2 py-0.5 rounded-md">
                          Flat 20% Off Deal
                        </span>
                        <span className="text-xs font-black text-purple-600">
                          Valid 15 Days
                        </span>
                      </div>
                      
                      <h4 className="font-heading font-extrabold text-sm text-slate-800">
                        Tanjore Handloom Silk Saree Festival Offer
                      </h4>

                      <p className="text-xs text-slate-600 font-semibold leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                        Get 20% direct store discount on pure silk sarees & wedding collections. Free gift voucher on purchases above ₹5,000.
                      </p>

                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
                        <span>South Rampart Rd, Tanjore</span>
                        <span>Sample Only</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-bold mt-2 text-center bg-yellow-50 border border-yellow-200/60 p-3 rounded-xl max-w-sm mx-auto">
                      <strong>AI Auto-Refinement:</strong> Upload visiting card or enter offer details. Gemini AI automatically structures your promotion before publishing live.
                    </div>
                  </div>

                </div>

                {/* Centered actions */}
                <div className="flex justify-center w-full mt-4 pb-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black px-12 py-3 rounded-xl text-xs transition-colors shadow-md shadow-yellow-500/10 cursor-pointer font-bold"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Registering Shop...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                        <span>Register Business Shop</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

          {/* Dynamic Leaflet Map Overlay Pane */}
          {mapShop && mapShop.latitude && mapShop.longitude && (
            <div className="sticky top-[86px] z-30 bg-white border border-yellow-500/35 rounded-2xl p-3 shadow-lg flex flex-col gap-2.5 animate-slide-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-600 animate-spin-slow" />
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[280px]">
                    {mapShop.shop_name} Location
                  </span>
                </div>
                <button
                  onClick={() => {
                    const currentParams = new URLSearchParams(searchParams.toString());
                    currentParams.delete("map");
                    router.push(`/shops?${currentParams.toString()}`);
                  }}
                  className="p-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-44 w-full rounded-xl overflow-hidden relative">
                <LeafletMap
                  latitude={mapShop.latitude}
                  longitude={mapShop.longitude}
                  popupText={mapShop.shop_name}
                />
              </div>
            </div>
          )}

          {/* List Feed */}
          {shopsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden flex flex-col gap-3 animate-pulse">
                  <div className="w-full aspect-video bg-slate-200" />
                </div>
              ))}
            </div>
          ) : (localShops.length + (shops?.length || 0)) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200/60 rounded-2xl text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/80 text-slate-400">
                <Store className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm text-slate-800">No Shops Found</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  No showrooms registered in <span className="font-bold text-slate-800">{selectedCategory}</span> for {area} yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const list = [...localShops, ...(shops || [])];
                if (targetPostId) {
                  list.sort((a, b) => {
                    if (a.id === targetPostId) return -1;
                    if (b.id === targetPostId) return 1;
                    return 0;
                  });
                }
                return list.map((shop) => (
                  <div key={shop.id} id={`post-${shop.id}`} className="transition-all duration-500">
                    <ShopCard
                      post={shop}
                      onMapToggle={handleMapToggle}
                      isMapActive={mapShop?.id === shop.id}
                    />
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
    </div>
  );
}
