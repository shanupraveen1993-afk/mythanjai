"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Camera,
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
import confetti from "canvas-confetti";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/image-compressor";
import {
  TANJORE_LOCALITIES,
  CLASSIFIED_CATEGORIES,
  SERVICE_CATEGORIES,
  SHOP_CATEGORIES,
  OFFER_CATEGORIES,
  TanjoreLocality,
} from "@/lib/constants";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultArea?: TanjoreLocality;
  defaultType?: PostType;
  defaultCategory?: string;
  defaultClassifiedType?: "NEED" | "SELL";
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
}: CreatePostModalProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<PostType>(defaultType);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Common Form Fields
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Need/Sale Specific State
  const [classifiedType, setClassifiedType] = useState<"NEED" | "SELL">("NEED");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
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

  useEffect(() => {
    if (defaultArea) setArea(defaultArea);
    if (defaultType) setType(defaultType);
    if (defaultClassifiedType) setClassifiedType(defaultClassifiedType);
    if (defaultCategory) {
      if (CLASSIFIED_CATEGORIES.includes(defaultCategory as any)) setClassifiedCategory(defaultCategory as any);
      if (SERVICE_CATEGORIES.includes(defaultCategory as any)) setServiceCategory(defaultCategory as any);
      if (SHOP_CATEGORIES.includes(defaultCategory as any)) setShopCategory(defaultCategory as any);
    }
  }, [defaultArea, defaultType, defaultCategory, defaultClassifiedType, isOpen]);

  if (!isOpen) return null;

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

        // Flash message or visual cue
        confetti({ particleCount: 30, spread: 40, colors: ["#fbbf24"] });
      } else {
        alert("Could not extract details. Please fill manually.");
      }
    } catch (error) {
      console.error("OCR error:", error);
      alert("Error scanning card. Please fill manually.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePublish = async () => {
    if (!phone) {
      alert("Please enter your contact phone number.");
      return;
    }

    if (!area || !area.trim()) {
      alert("Please add a specific location in Thanjavur District.");
      return;
    }

    setLoading(true);

    // AI Location Verification for Thanjavur District
    const { aiLocalityCheck } = await import("@/lib/ai-locality-check");
    const isThanjavur = await aiLocalityCheck(area);
    if (!isThanjavur) {
      alert("Please add a specific location in Thanjavur District.");
      setLoading(false);
      return;
    }
    try {
      const currentUser = auth.currentUser;
      const uid = currentUser ? currentUser.uid : "anonymous_guest";

      // 1. AI Formatting of user description
      let finalDescription = description;
      let finalOfferDesc = offerDesc;

      if (type === "needs") {
        try {
          const formatRes = await fetch("/api/gemini-format", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawDescription: description, type: classifiedType?.toLowerCase() }),
          });
          const formatData = await formatRes.json();
          if (formatData.success && formatData.formattedText) {
            finalDescription = formatData.formattedText;
          }
        } catch (err) {
          console.error("AI format failed for classifieds:", err);
        }
      } else if (type === "services") {
        try {
          const formatRes = await fetch("/api/gemini-format", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawDescription: description, type: "services" }),
          });
          const formatData = await formatRes.json();
          if (formatData.success && formatData.formattedText) {
            finalDescription = formatData.formattedText;
          }
        } catch (err) {
          console.error("AI format failed for services:", err);
        }
      } else if (type === "shops" || type === "offers") {
        if (offerDesc) {
          try {
            const formatRes = await fetch("/api/gemini-format", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rawDescription: offerDesc, type: "shops" }),
            });
            const formatData = await formatRes.json();
            if (formatData.success && formatData.formattedText) {
              finalOfferDesc = formatData.formattedText;
            }
          } catch (err) {
            console.error("AI format failed for shop/offer:", err);
          }
        }
      }

      let imageUrl = "";
      // Upload compressed image if selected and is allowed type (Shops, Offers, or Selling classifieds)
      const isUploadAllowed = type === "shops" || type === "offers" || (type === "needs" && classifiedType === "SELL");
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
      const timestamp = serverTimestamp();
      
      try {
        if (type === "needs") {
          await addDoc(collection(db, "needs_and_sales"), {
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
            created_at: timestamp,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day auto-expiry
          });
        } else if (type === "services") {
          await addDoc(collection(db, "services"), {
            userId: uid,
            name: serviceName,
            skill_category: serviceCategory,
            experience: experience || "Licensed Helper",
            area_tag: area,
            phone,
            rating: 4.8,
            description: finalDescription,
            image_url: "",
            is_verified: false, // Moderated verification
            created_at: timestamp,
          });
        } else if (type === "shops") {
          const coords = AREA_COORDINATES[area] || AREA_COORDINATES["Tanjore Town (General)"];
          await addDoc(collection(db, "shops"), {
            userId: uid,
            shop_name: shopName,
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
            created_at: timestamp,
            offer_title: offerTitle || "",
            offer_description: finalOfferDesc || "",
            offer_social_link: socialLink || "",
          });
        } else if (type === "offers") {
          // Detect platform from link
          let platform: "instagram" | "facebook" | "whatsapp" | "other" = "other";
          if (socialLink.includes("instagram.com")) platform = "instagram";
          else if (socialLink.includes("facebook.com")) platform = "facebook";
          else if (socialLink.includes("wa.me") || socialLink.includes("whatsapp.com")) platform = "whatsapp";

          await addDoc(collection(db, "offers"), {
            userId: uid,
            title: offerTitle,
            description: finalOfferDesc,
            category: offerCategory,
            area_tag: area,
            thumbnail_url: imageUrl || "/placeholder.webp",
            social_link: socialLink || "https://instagram.com",
            platform,
            created_at: timestamp,
          });
        }
      } catch (firestoreErr) {
        console.warn("Firestore document creation skipped or fallback applied:", firestoreErr);
      }

      // Success Celebratory feedback
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Reset & Close
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error publishing post:", error);
      confetti({ particleCount: 80, spread: 60 });
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

  const CATEGORY_SAMPLE_POSTS: Record<string, { title: string; price?: string; description?: string; experience?: string; hours?: string; address?: string; landmark?: string; offerTitle?: string; offerDesc?: string }> = {
    // Classifieds
    "Plot / Real Estate": {
      title: "1200 Sq.Ft Premium Corner Plot for Sale in Srinivasapuram",
      price: "1850000",
      description: "Excellent DTCP approved residential corner plot available for sale in a fast-developing neighborhood. North-facing, 30 feet wide road access. Located just 1.5 km from the main road, with excellent groundwater source and compound wall. Clear titles ready for registration. Price negotiable for immediate buyers."
    },
    "Property Rental": {
      title: "Premium 2 BHK House for Rent near South Rampart",
      price: "12500",
      description: "Beautiful 2 BHK spacious house available for rent immediately. Features modular kitchen, built-in wardrobes, 2 bathrooms, 24/7 Kaveri water supply, and dedicated covered car parking. Located in a peaceful residential street close to schools, supermarkets, and temples. Family preferred."
    },
    "Motor Vehicle": {
      title: "First-Owner Honda Activa 6G (2022 Model) for Sale",
      price: "64000",
      description: "Well-maintained Honda Activa 6G in matte grey colour. Driven only 8,500 kms, single owner, insurance active till December. Serviced regularly at authorized centers, brand new rear tyre, excellent fuel mileage of 50 km/l. Selling due to relocation."
    },
    "Electronics": {
      title: "iPhone 13 (128GB, Blue) - Excellent Condition with Bill",
      price: "38500",
      description: "Selling iPhone 13 in excellent condition with 88% battery health. No scratches or dents, always used with screen protector and protective case. Comes with original box, Apple charging cable, and purchase bill. Fully functional face ID and original display."
    },
    "Others": {
      title: "Looking for Experienced Full-Time Accountant for Showroom",
      price: "18000",
      description: "We are hiring a full-time accountant for our retail showroom in Gandhiji Road. Must have minimum 2 years experience in Tally Prime, daily ledger maintenance, and GST filing. Working hours: 10 AM to 8 PM. Good communication skills in Tamil required."
    },
    
    // Services
    "Electrician": {
      title: "Senthil Kumar - Certified Home Electrician",
      experience: "8 Years",
      description: "All residential electrical wiring, DB box installations, inverter assembly, and appliance repair services. Specialise in water heater fittings, LED lighting layouts, and identifying short circuits. Available 24/7 for emergency repair calls across Tanjore Town."
    },
    "Plumber": {
      title: "Karthik - Professional Plumbing Works",
      experience: "6 Years",
      description: "Complete house plumbing services, pipe blockages clearance, water tank cleanings, and sanitary ware fittings. Experts in bathroom renovation pipeline work and leakage detection. Prompt response and neat workmanship guaranteed."
    },
    "AC & Refrigeration": {
      title: "Ramesh AC & Fridge Service Center",
      experience: "10 Years",
      description: "Split and Window AC installations, gas filling, general wet servicing, and refrigerator motherboard troubleshooting. Repairing all leading brands with genuine spare parts. 30-day service warranty provided."
    },
    "Carpenter": {
      title: "Thangaraj - Fine Woodworking & Carpentry",
      experience: "12 Years",
      description: "Modular kitchen woodwork, custom wardrobe fittings, door assembly, and antique furniture restoration. Specialists in wooden partitions, safety locks installations, and general wood repairs. High-quality work at fair pricing."
    },
    "General Technician": {
      title: "General Home Repair & Painting Services",
      experience: "5 Years",
      description: "Professional interior and exterior house painting, wall crack filling, and damp-proof coatings. Also offering general repair help, door hinges adjustment, and screen mesh fittings. Contact for free quote estimate."
    },
    
    // Shops
    "Cafe & Restaurant": {
      title: "Famous Tanjore Degree Coffee & Tiffin House",
      hours: "6:00 AM - 10:00 PM",
      address: "12, East Car Street, Tanjore",
      landmark: "Opposite Brihadeeswarar Temple Main Entrance",
      offerTitle: "Get 1 Free Degree Coffee on billing above ₹200!",
      offerDesc: "Valid on all weekdays. Show this card at the counter."
    },
    "Supermarket & Grocery": {
      title: "Sri Meenakshi Supermarket & Provision Stores",
      hours: "8:00 AM - 9:30 PM",
      address: "45, Gandhiji Road, Srinivasapuram, Tanjore",
      landmark: "Near Government Hospital Junction",
      offerTitle: "Flat 5% OFF on monthly grocery packages!",
      offerDesc: "Free home delivery for orders above ₹1,000."
    },
    "Textiles & Clothing": {
      title: "Tanjore Silks & Readymade Showroom",
      hours: "9:30 AM - 10:00 PM",
      address: "102, South Rampart Street, Tanjore",
      landmark: "Next to Old Bus Stand Clock Tower",
      offerTitle: "Flat 30% OFF on Wedding Silk collection!",
      offerDesc: "Offer valid till Sunday. Free silk threads with purchase."
    },
    "Jewelry Showroom": {
      title: "Golden Palace Jewelry & Heritage Showroom",
      hours: "10:00 AM - 8:30 PM",
      address: "88, West Main Street, Tanjore",
      landmark: "Opposite Royal Palace Entry Arch",
      offerTitle: "Zero making charges on silver items!",
      offerDesc: "Offer valid on pure silver ornaments and vessels."
    },
    "General Shop": {
      title: "Thanjai Organic Herbals & General Store",
      hours: "9:00 AM - 9:00 PM",
      address: "14, Medical College Road, Tanjore",
      landmark: "Opposite Raja Mirasudar Hospital",
      offerTitle: "10% OFF on all natural organic cosmetic items!",
      offerDesc: "Present this digital noticeboard card to redeem."
    }
  };

  const getSamplePost = () => {
    return CATEGORY_SAMPLE_POSTS[activeCategory] || CATEGORY_SAMPLE_POSTS["Others"] || {
      title: "Sample Noticeboard Post Title",
      description: "Sample post description details will render here. Formatted neatly."
    };
  };

  const displayTitle = (() => {
    if (type === "needs") return title || getSamplePost().title;
    if (type === "services") return serviceName || getSamplePost().title;
    if (type === "shops") return shopName || getSamplePost().title;
    return offerTitle || getSamplePost().title;
  })();

  const displayDescription = (() => {
    if (type === "needs") return description || getSamplePost().description;
    if (type === "services") return description || getSamplePost().description;
    if (type === "shops") {
      const addr = address || getSamplePost().address || "";
      const land = landmark || getSamplePost().landmark || "";
      const off = offerTitle || getSamplePost().offerTitle || "";
      return `${addr}${land ? ` (Near ${land})` : ""}${off ? `\n\nPromo Offer: ${off}` : ""}`;
    }
    return offerDesc || getSamplePost().description;
  })();

  const displayPrice = price || getSamplePost().price;
  const displayExperience = experience || getSamplePost().experience || "8 Years";
  const displayHours = hours || getSamplePost().hours || "9:00 AM - 9:00 PM";

  const CATEGORY_STOCK_IMAGES: Record<string, string> = {
    // Classifieds
    "Plot / Real Estate": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
    "Property Rental": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80",
    "Motor Vehicle": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80",
    "Electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80",
    "Others": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80",
    
    // Services
    "Electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
    "Plumber": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80",
    "AC & Refrigeration": "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80",
    "Carpenter": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
    
    // Shops
    "Cafe & Restaurant": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80",
    "Supermarket & Grocery": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    "Textiles & Clothing": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80",
    "Jewelry Showroom": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80",
    "General Shop": "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80",
  };

  const activeCategory: string = (() => {
    if (type === "needs") return classifiedCategory;
    if (type === "services") return serviceCategory;
    if (type === "shops") return shopCategory;
    if (type === "offers") return offerCategory;
    return "Others";
  })();

  const previewImage = imagePreview || CATEGORY_STOCK_IMAGES[activeCategory] || "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80";

  const getPreviewIcon = () => {
    switch (activeCategory) {
      // Classifieds
      case "Plot / Real Estate": return <Compass className="w-3.5 h-3.5 text-slate-500" />;
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
                          <label className="flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-2 rounded-xl text-xs cursor-pointer transition-colors shadow-sm">
                            {ocrLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>AI Parsing Details...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4" />
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
                              I Need / Looking for
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
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Title</label>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="e.g. 2BHK House for rent, Used Splendor Bike"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Details (Description)</label>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Describe requirement, size, features..."
                              rows={3}
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Price (₹, Text Supported)</label>
                              <input
                                type="text"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g. ₹2 Lakhs"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                              <select
                                value={classifiedCategory}
                                onChange={(e) => setClassifiedCategory(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                              >
                                {CLASSIFIED_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {classifiedType === "SELL" && (
                            <div className="flex flex-col gap-3 pt-1">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">YouTube Video Link (Optional)</label>
                                <input
                                  type="url"
                                  value={youtubeUrl}
                                  onChange={(e) => setYoutubeUrl(e.target.value)}
                                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">Google Maps Location Link (Optional)</label>
                                <input
                                  type="url"
                                  value={googleMapsUrl}
                                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                  placeholder="e.g. https://maps.google.com/..."
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {type === "services" && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Provider/Technician Name</label>
                            <input
                              type="text"
                              value={serviceName}
                              onChange={(e) => setServiceName(e.target.value)}
                              placeholder="e.g. Senthil Kumar"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">What Services Do You Offer? (Description)</label>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Describe specific jobs you perform, price guides, or consultation terms. e.g. Specialise in water heater repairs and house plumbing."
                              rows={3}
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Category Skill</label>
                              <select
                                value={serviceCategory}
                                onChange={(e) => setServiceCategory(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                              >
                                {SERVICE_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Experience (Years/Text)</label>
                              <input
                                type="text"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                placeholder="e.g. 8 Years"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {type === "shops" && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Shop / Business Name</label>
                            <input
                              type="text"
                              value={shopName}
                              onChange={(e) => setShopName(e.target.value)}
                              placeholder="e.g. Famous Tanjore Degree Coffee"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                              <select
                                value={shopCategory}
                                onChange={(e) => setShopCategory(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                              >
                                {SHOP_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">Hours</label>
                              <input
                                type="text"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                placeholder="e.g. 9 AM - 9 PM"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Address</label>
                            <input
                              type="text"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Shop address text"
                              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
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

                      {/* Photo Upload widget for Shops/Offers/Sales */}
                      {(type === "shops" || type === "offers" || (type === "needs" && classifiedType === "SELL")) && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            {type === "needs" ? "Product Photo Upload (Optional)" : "Storefront / Visiting Card Image Upload"}
                          </label>
                          <div className="flex gap-3 items-center">
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl w-24 h-24 hover:border-yellow-500/60 hover:bg-yellow-50/10 transition-colors cursor-pointer shrink-0">
                              <Upload className="w-5 h-5 text-slate-400" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                            {imagePreview ? (
                              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 font-bold leading-snug">
                                No image uploaded. Default placeholder will display.
                              </p>
                            )}
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
                      <h3 className="font-heading font-extrabold text-sm text-slate-800 leading-snug line-clamp-2">
                        {displayTitle}
                      </h3>
                      
                      {/* Price/Exp Metadata details */}
                      {type === "needs" && displayPrice && (
                        <div className="text-yellow-600 font-black text-xs mt-1">
                          ₹{Number(displayPrice).toLocaleString("en-IN")}
                        </div>
                      )}
                      {type === "services" && (
                        <div className="text-slate-500 text-[10px] font-bold mt-1">
                          Experience: {displayExperience}
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
                          src={previewImage}
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
                </div>

              </div>

              {/* ACTION BUTTONS: Rendered at the bottom of both columns, centered */}
              {step === 2 && (
                <div className="flex justify-center w-full mt-4 pb-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black px-8 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Continue to Step 3</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="flex justify-center gap-3 w-full mt-4 pb-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center justify-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black px-8 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-yellow-500/10 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Publish Live Post</span>
                      </>
                    )}
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
