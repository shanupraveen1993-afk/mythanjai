"use client";

import React, { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  Shield,
  Trash2,
  CheckCircle,
  Star,
  Tag,
  Wrench,
  Store,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Video,
  Upload,
  Copy,
  Film,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { TANJORE_LOCALITIES } from "@/lib/constants";

type ModerationItem = {
  id: string;
  colName: string;
  title: string;
  name?: string;
  shop_name?: string;
  phone: string;
  area_tag: string;
  is_verified?: boolean;
  is_featured?: boolean;
  price?: number | null;
  category: string;
  created_at: any;
};

export default function AdminClientPage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [passcode, setPasscode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Video Upload & AI Offer Publisher States
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoArea, setVideoArea] = useState<string>(TANJORE_LOCALITIES[0]);
  const [publishToOffers, setPublishToOffers] = useState(true);
  const [isAiFormatting, setIsAiFormatting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");

  // Auto-verify Admin if user mobile is 9994837342
  useEffect(() => {
    const rawPhone = String(profile?.phone || user?.phoneNumber || "");
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.includes("9994837342") || profile?.isAdmin) {
      setIsAdmin(true);
    }
  }, [profile, user]);

  const fetchModerationQueue = async () => {
    setLoading(true);
    const collectionsToQuery = ["needs_and_sales", "services", "shops", "offers"];
    const mergedListings: ModerationItem[] = [];

    try {
      for (const colName of collectionsToQuery) {
        const querySnapshot = await getDocs(collection(db, colName));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          mergedListings.push({
            id: docSnap.id,
            colName,
            title: data.title || data.name || data.shop_name || "Untitled",
            phone: data.phone || "",
            area_tag: data.area_tag || "Tanjore Town",
            is_verified: data.is_verified || false,
            is_featured: data.is_featured || false,
            price: data.price !== undefined ? data.price : null,
            category: data.category || "General",
            created_at: data.created_at,
          });
        });
      }
      // Sort by creation time (descending)
      mergedListings.sort((a, b) => {
        const timeA = a.created_at?.seconds || 0;
        const timeB = b.created_at?.seconds || 0;
        return timeB - timeA;
      });
      setItems(mergedListings);
    } catch (error) {
      console.error("Error loading queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchModerationQueue();
    }
  }, [isAdmin]);

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "tanjoreadmin") {
      setIsAdmin(true);
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 50, spread: 60 });
      } catch (err) {}
    } else {
      alert("Invalid Admin Passcode! (Hint: use 'tanjoreadmin')");
    }
  };

  const handleDelete = async (id: string, colName: string) => {
    if (!confirm("Delete this listing permanently?")) return;
    try {
      await deleteDoc(doc(db, colName, id));
      setItems((prev) => prev.filter((item) => item.id !== id));
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 20, colors: ["#ef4444"] });
      } catch (err) {}
    } catch (error) {
      alert("Error deleting: " + error);
    }
  };

  const handleToggleVerify = async (item: ModerationItem) => {
    try {
      const nextVerify = !item.is_verified;
      await updateDoc(doc(db, item.colName, item.id), {
        is_verified: nextVerify,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_verified: nextVerify } : i))
      );
      if (nextVerify) {
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({ particleCount: 15, colors: ["#10b981"] });
        } catch (err) {}
      }
    } catch (error) {
      alert("Error updating status: " + error);
    }
  };

  const handleToggleFeatured = async (item: ModerationItem) => {
    try {
      const nextFeatured = !item.is_featured;
      await updateDoc(doc(db, item.colName, item.id), {
        is_featured: nextFeatured,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_featured: nextFeatured } : i))
      );
      if (nextFeatured) {
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({ particleCount: 20, colors: ["#fbbf24"] });
        } catch (err) {}
      }
    } catch (error) {
      alert("Error updating promotion: " + error);
    }
  };

  const handleFormatWithAi = async () => {
    if (!videoDescription.trim()) {
      toast.error("Please enter raw offer notes or details to analyze with AI.");
      return;
    }
    setIsAiFormatting(true);
    try {
      const res = await fetch("/api/gemini-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "shops",
          rawDescription: videoDescription,
        }),
      });
      const data = await res.json();
      if (data.success && data.formattedText) {
        setVideoDescription(data.formattedText);
        toast.success("Gemini AI analyzed and polished your offer summary!");
      } else {
        toast.error(data.error || "Failed to format description with AI.");
      }
    } catch (err) {
      console.error("AI format error:", err);
      toast.error("Network error while formatting with AI.");
    } finally {
      setIsAiFormatting(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file (.mp4, .webm, .mov).");
        return;
      }
      setSelectedVideo(file);
      if (!videoTitle) {
        setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo) {
      toast.error("Please select a video file to upload.");
      return;
    }

    setVideoUploading(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `admin_videos/${Date.now()}_${selectedVideo.name}`);
      const uploadTask = uploadBytesResumable(storageRef, selectedVideo);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Video upload error:", error);
          toast.error("Video upload failed. Check network or storage rules.");
          setVideoUploading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadedVideoUrl(downloadUrl);

          // 1. Record in Firestore admin_videos collection
          try {
            await addDoc(collection(db, "admin_videos"), {
              title: videoTitle || selectedVideo.name,
              video_url: downloadUrl,
              created_at: serverTimestamp(),
              uploaded_by: profile?.phone || "admin_9994837342",
            });
          } catch (e) {}

          // 2. Publish Live Offer to Firestore shops & offers collections if toggle checked
          if (publishToOffers) {
            try {
              const offerRecord = {
                userId: user?.uid || "admin_9994837342",
                shop_name: videoTitle.trim() || selectedVideo.name.replace(/\.[^/.]+$/, ""),
                category: "Local Offers & Deals",
                area_tag: videoArea,
                address_text: `${videoArea}, Thanjavur`,
                phone: profile?.phone || "9994837342",
                image_url: "/thanjavur_temple_illustration.png",
                offer_social_link: downloadUrl,
                offer_title: videoTitle.trim() || "Exclusive Discount Offer",
                offer_description: videoDescription.trim() || "Special promotional offer with video reel.",
                is_featured: true,
                is_verified: true,
                is_claimed: true,
                hours: "Limited Time Offer",
                created_at: serverTimestamp(),
                show_phone: true,
              };

              await addDoc(collection(db, "shops"), offerRecord);
              await addDoc(collection(db, "offers"), offerRecord);
              toast.success("Video Offer Published Live to Offers Page (/offers)!");
            } catch (pubErr) {
              console.warn("Live offer publishing error:", pubErr);
            }
          } else {
            toast.success("Video uploaded successfully to Firebase Storage!");
          }

          setVideoUploading(false);
          try {
            const confetti = (await import("canvas-confetti")).default;
            confetti({ particleCount: 70, spread: 80 });
          } catch (err) {}
        }
      );
    } catch (error: any) {
      console.error("Upload initiation error:", error);
      toast.error("Failed to start video upload.");
      setVideoUploading(false);
    }
  };

  const handleCopyVideoUrl = () => {
    if (!uploadedVideoUrl) return;
    navigator.clipboard.writeText(uploadedVideoUrl);
    toast.success("Firebase Video URL copied to clipboard!");
  };

  const [seeding, setSeeding] = useState(false);

  const handleSeedData = async () => {
    if (seeding) return;
    if (!confirm("Populate Firestore with sample Tanjore directory data for all segments?")) return;
    setSeeding(true);

    try {
      const now = new Date();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // 1. Needs and Buy/Sell
      const needs = [
        {
          userId: "sample_user_1",
          type: "need",
          title: "Looking for 2BHK rental house near Big Temple",
          description: "Urgent requirement for a family of four. Ground floor preferred with 24/7 water supply and car parking. Budget up to ₹12,000.",
          raw_text: "Urgent requirement for a family of four. Ground floor preferred with 24/7 water supply and car parking. Budget up to ₹12,000.",
          category: "Property Rental",
          area_tag: "Big Temple Area",
          price: 12000,
          phone: "9994837342",
          is_verified: true,
          created_at: now,
          expires_at: expiresAt,
        },
        {
          userId: "sample_user_2",
          type: "sale",
          title: "Used Royal Enfield Classic 350 (2021 Model)",
          description: "Excellent condition Classic 350 Gunmetal Grey, single owner, 15,000 kms run. Well maintained, new tires, active insurance.",
          raw_text: "Excellent condition Classic 350 Gunmetal Grey, single owner, 15,000 kms run. Well maintained, new tires, active insurance.",
          category: "Motor Vehicle",
          area_tag: "Medical College Road",
          price: 165000,
          phone: "9876543210",
          is_verified: true,
          created_at: now,
          expires_at: expiresAt,
        },
        {
          userId: "sample_user_3",
          type: "need",
          title: "2400 sq.ft residential plot for sale in Vallam",
          description: "Premium DTCP approved housing plot for sale near PRIST University campus, Vallam. North facing, 30 feet wide road, clear titles.",
          raw_text: "Premium DTCP approved housing plot for sale near PRIST University campus, Vallam. North facing, 30 feet wide road, clear titles.",
          category: "Plot / Real Estate",
          area_tag: "Vallam",
          price: 1800000,
          phone: "9443588231",
          is_verified: true,
          created_at: now,
          expires_at: expiresAt,
        },
        {
          userId: "sample_user_4",
          type: "need",
          title: "3BHK independent villa for lease in Yagappa Nagar",
          description: "Spacious independent villa with private terrace and garden space. Available for 3-year lease. Excellent residential neighborhood.",
          raw_text: "Spacious independent villa with private terrace and garden space. Available for 3-year lease. Excellent residential neighborhood.",
          category: "Property Rental",
          area_tag: "Yagappa Nagar",
          price: 1200000,
          phone: "9042211985",
          is_verified: true,
          created_at: now,
          expires_at: expiresAt,
        },
        {
          userId: "sample_user_5",
          type: "sale",
          title: "Sony Bravia 43-inch 4K Smart LED TV",
          description: "Mint condition smart TV with Android OS, HDR, Dolby Audio. 1.5 years old, selling due to relocation. Box and bill available.",
          raw_text: "Mint condition smart TV with Android OS, HDR, Dolby Audio. 1.5 years old, selling due to relocation. Box and bill available.",
          category: "Electronics",
          area_tag: "East Gate",
          price: 22000,
          phone: "9629088776",
          is_verified: true,
          image_url: "/placeholder.webp",
          created_at: now,
          expires_at: expiresAt,
        },
        {
          userId: "sample_user_6",
          type: "need",
          title: "Looking for used Maruti Swift VXI (2018-2020)",
          description: "Looking to buy a well-maintained Swift VXI in petrol. Kilometers run should be under 50k. Budget up to ₹4.5 Lakhs.",
          raw_text: "Looking to buy a well-maintained Swift VXI in petrol. Kilometers run should be under 50k. Budget up to ₹4.5 Lakhs.",
          category: "Motor Vehicle",
          area_tag: "Old Bus Stand",
          price: 450000,
          phone: "9789345221",
          is_verified: true,
          created_at: now,
          expires_at: expiresAt,
        },
        {
          userId: "sample_user_7",
          type: "sale",
          title: "Solid Teak Wood Dining Table (6-Seater)",
          description: "Heavy solid teak wood dining table with glass top and 6 cushioned chairs. Excellent condition, no scratches.",
          raw_text: "Heavy solid teak wood dining table with glass top and 6 cushioned chairs. Excellent condition, no scratches.",
          category: "Electronics",
          area_tag: "Medical College Road",
          price: 18500,
          phone: "9150023455",
          is_verified: true,
          image_url: "/placeholder.webp",
          created_at: now,
          expires_at: expiresAt,
        }
      ];

      // 2. Services
      const services = [
        {
          userId: "sample_user_8",
          name: "Senthil Kumar",
          title: "Senthil Kumar - AC & Electrician",
          skill_category: "Electrician",
          area_tag: "New Housing Unit",
          phone: "9948373420",
          is_verified: true,
          experience: "8+ Years Experience",
          description: "Services Offered:\n• House wiring & DB box installations\n• Inverter setup & battery maintenance\n• AC repair, filter cleaning & gas charge\n\nExpertise:\n• 8+ Years Experience\n• Covers Tanjore town, Srinivasapuram, NHU\n• ₹150 visiting charge",
          created_at: now,
        },
        {
          userId: "sample_user_9",
          name: "Ganesh Plumber",
          title: "Ganesh Plumbing Solutions",
          skill_category: "Plumber",
          area_tag: "Srinivasapuram",
          phone: "9845612300",
          is_verified: true,
          experience: "5 Years",
          description: "Services Offered:\n• Bathroom fittings & sanitary repairs\n• Leakage detection & pipeline replacements\n• Water heater / geyser installations\n\nExpertise:\n• 5 Years Experience\n• Fully equipped toolkits\n• Free consultation on layout remodeling",
          created_at: now,
        },
        {
          userId: "sample_user_10",
          name: "Balakrishnan Carpenter",
          title: "Balakrishnan Modular Woodworks",
          skill_category: "Carpenter",
          area_tag: "Karanthai",
          phone: "9444122334",
          is_verified: true,
          experience: "12+ Years",
          description: "Services Offered:\n• Custom wood furniture & table building\n• Door frame mounting & lock repairs\n• Wardrobes & modular kitchen carpentry\n\nExpertise:\n• 12+ Years Experience\n• Custom sizing design consults\n• Native wood artisan",
          created_at: now,
        },
        {
          userId: "sample_user_11",
          name: "Mani AC Tech",
          title: "Mani Cool Air Solutions",
          skill_category: "AC & Refrigeration",
          area_tag: "Medical College Road",
          phone: "9894055667",
          is_verified: true,
          experience: "6 Years Experience",
          description: "Services Offered:\n• Inverter AC card repair & chip diagnostics\n• Fridge cooling coil replacement & gas topup\n• Deep washing & fan motor repairs\n\nExpertise:\n• 6 Years Experience\n• Home inspection within 2 hours",
          created_at: now,
        },
        {
          userId: "sample_user_12",
          name: "Karthick Laptop Service",
          title: "Karthick Tech Care Systems",
          skill_category: "Electrician",
          area_tag: "Old Bus Stand",
          phone: "7502441122",
          is_verified: true,
          experience: "Chip-Level Specialist",
          description: "Services Offered:\n• Motherboard chip-level repair & soldering\n• Broken screen & laptop hinge adjustments\n• Data backup & operating system setup\n\nExpertise:\n• Certified technician\n• Doorstep pickup & drop-off option available",
          created_at: now,
        },
        {
          userId: "sample_user_13",
          name: "Rajan Home Appliances",
          title: "Rajan Fridge & Washing Machine Repair",
          skill_category: "AC & Refrigeration",
          area_tag: "East Gate",
          phone: "9600123456",
          is_verified: true,
          experience: "Home Visits Undertaken",
          description: "Services Offered:\n• Washing machine drum & belt repair\n• Refrigerator fan & thermostat services\n• Microwave magnetron replacement\n\nExpertise:\n• Multi-brand home appliance support\n• Original spare parts replacement with warranty",
          created_at: now,
        }
      ];

      // 3. Shops
      const shops = [
        {
          userId: "sample_user_14",
          shop_name: "Sree Balaji Traditional Tanjore Paintings",
          category: "Textiles & Clothing",
          area_tag: "Mariamman Kovil",
          phone: "9443218765",
          address_text: "No. 45, Mariamman Kovil Street, Thanjavur",
          latitude: 10.7935,
          longitude: 79.1825,
          is_verified: true,
          is_featured: true,
          is_claimed: true,
          hours: "9:00 AM - 9:00 PM",
          created_at: now,
          offer_title: "Flat 30% Off Tanjore Art Plates",
          offer_description: "Artisan direct sale discount on brass and copper plates above ₹5,000.",
          offer_social_link: "https://www.instagram.com/reel/C7p4K-xSo2a/",
        },
        {
          userId: "sample_user_15",
          shop_name: "Hotel Gnanam Restaurant",
          category: "Cafe & Restaurant",
          area_tag: "New Bus Stand",
          phone: "04362278500",
          address_text: "Anna Salai, Market Road, Near New Bus Stand, Thanjavur",
          latitude: 10.7852,
          longitude: 79.1162,
          is_verified: true,
          is_featured: true,
          is_claimed: true,
          hours: "7:00 AM - 10:30 PM",
          created_at: now,
          offer_title: "Dine-in Combo Deal: ₹199 Only",
          offer_description: "Chicken Biryani + Cool Drink special combo. Valid for family checks on weekends.",
          offer_social_link: "https://www.facebook.com/reel/C8q4L-xSo3b/",
        },
        {
          userId: "sample_user_16",
          shop_name: "Sathya Agencies Electronics",
          category: "Supermarket & Grocery",
          area_tag: "Medical College Road",
          phone: "04362241989",
          address_text: "Medical College Road, Thanjavur",
          latitude: 10.7588,
          longitude: 79.1092,
          is_verified: true,
          is_featured: false,
          is_claimed: true,
          hours: "9:30 AM - 9:30 PM",
          created_at: now,
          offer_title: "Flat ₹10,000 Cashback on ACs",
          offer_description: "Flat cashback and zero down-payment EMI plans on leading smart AC models.",
          offer_social_link: "",
        },
        {
          userId: "sample_user_17",
          shop_name: "The Chennai Silks Thanjavur",
          category: "Textiles & Clothing",
          area_tag: "Old Bus Stand",
          phone: "04362235555",
          address_text: "No. 12, South Rampart Street, Old Bus Stand, Thanjavur",
          latitude: 10.7905,
          longitude: 79.1385,
          is_verified: true,
          is_featured: true,
          is_claimed: true,
          hours: "9:00 AM - 9:30 PM",
          created_at: now,
          offer_title: "Aadi Special: Buy 1 Get 1 Free",
          offer_description: "Massive annual festival discount on select Kanchipuram and Thanjavur silk sarees.",
          offer_social_link: "https://www.instagram.com/reel/C8z5M-xSo4c/",
        },
        {
          userId: "sample_user_18",
          shop_name: "Kumhari Handicrafts & Pottery Shop",
          category: "Jewelry Showroom",
          area_tag: "Big Temple Area",
          phone: "9444087654",
          address_text: "West Main Street, Near Big Temple Entrance, Thanjavur",
          latitude: 10.7915,
          longitude: 79.1305,
          is_verified: true,
          is_featured: false,
          is_claimed: true,
          hours: "9:00 AM - 8:30 PM",
          created_at: now,
          offer_title: "Terracotta Toys: Buy 2 Get 1 Free",
          offer_description: "Artisan direct sale on traditional clay dolls and terracotta vases. Valid till Sunday.",
          offer_social_link: "",
        },
        {
          userId: "sample_user_19",
          shop_name: "Sree Ariya Bhavan Vegetarian",
          category: "Cafe & Restaurant",
          area_tag: "Old Bus Stand",
          phone: "04362230400",
          address_text: "South Rampart, Old Bus Stand Area, Thanjavur",
          latitude: 10.7905,
          longitude: 79.1385,
          is_verified: true,
          is_featured: false,
          is_claimed: true,
          hours: "6:00 AM - 11:00 PM",
          created_at: now,
          offer_title: "Ghee Roast Special Filter Coffee Combo",
          offer_description: "Enjoy our famous Golden Ghee Roast and Filter Coffee combo at just ₹99 daily from 4-7 PM.",
          offer_social_link: "",
        },
        {
          userId: "sample_user_20",
          shop_name: "GRT Jewellers Thanjavur",
          category: "Jewelry Showroom",
          area_tag: "South Rampart",
          phone: "04362272222",
          address_text: "South Rampart Road, Near Old Bus Stand, Thanjavur",
          latitude: 10.7858,
          longitude: 79.1285,
          is_verified: true,
          is_featured: true,
          is_claimed: true,
          hours: "10:00 AM - 8:30 PM",
          created_at: now,
          offer_title: "15% Off Jewelry Making Charges",
          offer_description: "Special seasonal discount on gold, silver, and diamond designs. Show this screen at billing.",
          offer_social_link: "https://www.instagram.com/reel/C9a6N-xSo5d/",
        },
        {
          userId: "sample_user_21",
          shop_name: "Nilgiris Supermarket",
          category: "Supermarket & Grocery",
          area_tag: "Srinivasapuram",
          phone: "04362280900",
          address_text: "Trichy Road, Srinivasapuram, Thanjavur",
          latitude: 10.7765,
          longitude: 79.1315,
          is_verified: true,
          is_featured: false,
          is_claimed: true,
          hours: "8:00 AM - 10:00 PM",
          created_at: now,
          offer_title: "Flat 10% Off on Dairy Products",
          offer_description: "Flat 10% off on cheese, butter, paneer, and local fresh milk. Every Wednesday.",
          offer_social_link: "",
        }
      ];

      // Sequential uploads
      for (const item of needs) {
        await addDoc(collection(db, "needs_and_sales"), item);
      }
      for (const item of services) {
        await addDoc(collection(db, "services"), item);
      }
      for (const item of shops) {
        await addDoc(collection(db, "shops"), item);
      }

      alert("Sample Tanjore directory data successfully seeded!");
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 100, spread: 70 });
      } catch (err) {}
      fetchModerationQueue();
    } catch (err: any) {
      console.error("Seeding failed:", err);
      alert("Seeding failed: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const getColIcon = (colName: string) => {
    switch (colName) {
      case "needs_and_sales":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "services":
        return <Wrench className="w-4 h-4 text-purple-600" />;
      case "shops":
        return <Store className="w-4 h-4 text-amber-600" />;
      case "offers":
        return <Tag className="w-4 h-4 text-pink-600" />;
      default:
        return null;
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return item.colName === activeTab;
  });

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800 min-h-screen">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="font-heading font-black text-xl text-slate-900">Admin Moderation Console</h2>
            <p className="text-xs text-slate-500">Protected dashboard area for post checks</p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="flex flex-col gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Security Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md active:scale-98"
            >
              Verify & Enter
            </button>
          </form>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mt-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Tanjore Hub Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 text-slate-800 flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600 animate-pulse" />
          <h2 className="font-heading font-bold text-sm text-slate-900">Moderation Queue</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full font-bold hover:bg-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {seeding ? "Seeding..." : "Seed Sample Data"}
          </button>
          <Link
            href="/"
            className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-850 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 flex flex-col gap-4 max-w-7xl mx-auto w-full">
        {/* Tab Filters */}
        <div className="flex gap-1.5 bg-slate-200 p-1.5 rounded-2xl border border-slate-300/40 overflow-x-auto no-scrollbar">
          {["all", "needs_and_sales", "services", "shops", "offers", "video_upload"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === tab
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-300/40"
              }`}
            >
              {tab === "video_upload" && <Video className="w-3.5 h-3.5 text-yellow-400" />}
              <span>{tab === "all" ? "All Queue" : tab === "video_upload" ? "📹 Upload Video" : tab.replace(/_and_/, "/").replace(/_/, " ")}</span>
            </button>
          ))}
        </div>

        {/* DEDICATED FIREBASE STORAGE VIDEO UPLOADER SECTION */}
        {activeTab === "video_upload" ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-5 max-w-2xl mx-auto w-full my-4 font-sans">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center border border-yellow-500/20 shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>Firebase Storage Video Uploader</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold uppercase">Admin 9994837342</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Upload video reels to Firebase Storage & publish AI-analyzed live offers to /offers.
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadVideo} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Store / Offer Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GLEN Kitchen Chimney — 50% OFF"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Location in Thanjavur</label>
                  <select
                    value={videoArea}
                    onChange={(e) => setVideoArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-yellow-500 cursor-pointer"
                  >
                    {TANJORE_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Offer Description with Gemini AI Polish Engine */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Offer Details & Notes</span>
                    <span className="text-[10px] text-slate-400 font-normal">(AI Analyzed)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFormatWithAi}
                    disabled={isAiFormatting || !videoDescription.trim()}
                    className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAiFormatting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                        <span>✨ AI Polish Summary</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter raw offer notes (e.g. 50% discount on GLEN Chimney, free installation, valid till Sunday near Medical College Road)..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-yellow-500 leading-relaxed resize-none"
                />
              </div>

              {/* Video File Input Dropzone */}
              <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-yellow-500 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer">
                <label className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <div className="w-11 h-11 rounded-2xl bg-yellow-500/15 text-yellow-600 flex items-center justify-center font-bold">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="font-heading font-bold text-xs text-slate-900">
                    {selectedVideo ? selectedVideo.name : "Select or drag Video Reel (.mp4, .webm, .mov) *"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {selectedVideo ? `${(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB` : "Video stored on Firebase Storage CDN & linked to live offer"}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Toggle: Publish directly to Local Offers directory */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-pink-600" />
                    <span>Publish live to Offers directory (/offers)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Creates an active video offer card visible to all Tanjore users immediately!
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={publishToOffers}
                    onChange={(e) => setPublishToOffers(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              {/* Real-time Progress Bar */}
              {videoUploading && (
                <div className="flex flex-col gap-1.5 bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-600" />
                      <span>Uploading Video & Publishing Live Offer...</span>
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={videoUploading || !selectedVideo}
                className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-955 font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border border-yellow-400 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                {videoUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-955" />
                    <span>Uploading & Publishing ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload Video & Publish Live Offer</span>
                  </>
                )}
              </button>
            </form>

            {/* Uploaded Video Success & Copy URL Result Card */}
            {uploadedVideoUrl && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col gap-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Video Uploaded & Live!</span>
                  </span>
                  <button
                    onClick={handleCopyVideoUrl}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Video URL</span>
                  </button>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-emerald-200 bg-black max-h-56">
                  <video src={uploadedVideoUrl} controls className="w-full h-48 object-contain" />
                </div>

                <p className="text-[10px] text-emerald-700 font-mono break-all bg-white p-2 rounded border border-emerald-200">
                  {uploadedVideoUrl}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* List items */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
            No listings in this category moderation queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Header item */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5">
                    {getColIcon(item.colName)}
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                      {item.colName.replace(/_/g, " ")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id, item.colName)}
                    className="p-1.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors shrink-0"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div>
                  <h4 className="font-bold text-sm text-slate-800 leading-snug">{item.title}</h4>
                  {item.price !== null && item.price !== undefined && (
                    <span className="text-xs text-amber-600 font-extrabold block mt-0.5">
                      Price: ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Locality: <b className="text-slate-700">{item.area_tag}</b>
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Contact: <b className="text-slate-700">{item.phone}</b>
                  </span>
                </div>

                {/* Toggle controls */}
                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-1">
                  {/* Toggle Verified for Services */}
                  {item.colName === "services" && (
                    <button
                      onClick={() => handleToggleVerify(item)}
                      className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors ${
                        item.is_verified
                          ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                          : "bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{item.is_verified ? "Approved" : "Approve Check"}</span>
                    </button>
                  )}

                  {/* Toggle Featured for Shops & Offers */}
                  {(item.colName === "shops" || item.colName === "offers") && (
                    <button
                      onClick={() => handleToggleFeatured(item)}
                      className={`flex items-center justify-center gap-1 flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors ${
                        item.is_featured
                          ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                          : "bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.is_featured ? "fill-current" : ""}`} />
                      <span>{item.is_featured ? "Sponsor Pinned" : "Pin Sponsor"}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
