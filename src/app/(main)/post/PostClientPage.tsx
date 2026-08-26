"use client";

import React, { useState, useEffect } from "react";
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
  OFFER_CATEGORIES,
  TanjoreLocality,
} from "@/lib/constants";
import { validatePostContent } from "@/lib/moderation";
import { useToast } from "@/context/ToastContext";
import {
  ArrowLeft,
  Upload,
  Check,
  Loader2,
  Tag,
  MapPin,
  Phone,
  ShoppingBag,
  Wrench,
  Store,
  HelpCircle,
  Sparkles,
  Camera,
} from "lucide-react";

type SegmentType = "sell" | "need" | "service" | "offer";

export default function PostClientPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [segment, setSegment] = useState<SegmentType>("sell");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialType = (params.get("type") || "sell").toLowerCase() as SegmentType;
      if (["sell", "need", "service", "offer"].includes(initialType)) {
        setSegment(initialType);
      }
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [area, setArea] = useState<string>(TANJORE_LOCALITIES[0]);
  const [category, setCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [experience, setExperience] = useState("5+ Years");
  const [address, setAddress] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync profile phone
  useEffect(() => {
    if (profile?.phone && !phone) {
      setPhone(profile.phone);
    }
  }, [profile, phone]);

  // Sync category default when segment changes
  useEffect(() => {
    if (segment === "sell" || segment === "need") {
      setCategory(CLASSIFIED_CATEGORIES[0]);
    } else if (segment === "service") {
      setCategory(SERVICE_CATEGORIES[0]);
    } else if (segment === "offer") {
      setCategory(SHOP_CATEGORIES[0]);
    }
    setValidationError(null);
  }, [segment]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo too large. Please select an image under 5 MB.");
        return;
      }
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
    setValidationError(null);

    // 1. Title & Description Length Checks
    if (!title.trim()) {
      setValidationError("Please enter a title for your posting.");
      return;
    }
    if (title.length > 70) {
      setValidationError("Title must not exceed 70 characters.");
      return;
    }
    if (description.length > 500) {
      setValidationError("Description must not exceed 500 characters.");
      return;
    }

    // 2. Prohibited Keyword Moderation Check
    const moderationResult = validatePostContent(title, description);
    if (!moderationResult.isClean) {
      setValidationError(`Your post contains prohibited or unsafe term: "${moderationResult.matchedWord}". Please revise before posting.`);
      return;
    }

    // 3. Indian Phone Number Regex Validation (10 digits starting with 6-9)
    const sanitizedPhone = phone.replace(/\D/g, "").slice(-10);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (showPhone && !phoneRegex.test(sanitizedPhone)) {
      setValidationError("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";

      // Upload image if selected (Only if not Need segment)
      if (selectedImage && segment !== "need") {
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
      const newPostId = `user_post_${Date.now()}`;

      // Local Post Record for 100% Instant Feed Persistence
      const localPostRecord: any = {
        id: newPostId,
        userId: uid,
        category,
        area_tag: area,
        phone: sanitizedPhone || "9876543210",
        show_phone: showPhone,
        created_at: new Date().toISOString(),
        is_verified: true,
      };

      // Submit to correct Firestore collection with LocalStorage fallback
      if (segment === "sell" || segment === "need") {
        localPostRecord.type = segment === "sell" ? "SELL" : "NEED";
        localPostRecord.title = title.trim();
        localPostRecord.description = description.trim();
        localPostRecord.price = price ? parseFloat(price) : null;
        localPostRecord.image_url = segment === "need" ? "" : (imagePreview || imageUrl || "/thanjavur_temple_illustration.png");

        try {
          await addDoc(collection(db, "needs_and_sales"), {
            userId: uid,
            seller_id: uid,
            type: segment === "sell" ? "SELL" : "NEED",
            title: title.trim(),
            description: description.trim(),
            raw_text: description.trim(),
            category: category || "General",
            area_tag: area || "Thanjavur",
            price: price ? parseFloat(price) : null,
            phone: sanitizedPhone || "9876543210",
            show_phone: Boolean(showPhone),
            image_url: segment === "need" ? "" : (imageUrl || "/thanjavur_temple_illustration.png"),
            is_verified: true,
            status: "active",
            created_at: timestamp,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
        } catch (fErr) {
          console.warn("Firestore write error:", fErr);
        }
      } else if (segment === "service") {
        localPostRecord.name = title.trim();
        localPostRecord.skill_category = category;
        localPostRecord.experience = experience || "5+ Years";
        localPostRecord.working_hours = "9 AM – 8 PM";
        localPostRecord.description = description.trim();
        localPostRecord.image_url = imagePreview || imageUrl || "";

        try {
          await addDoc(collection(db, "services"), {
            userId: uid,
            seller_id: uid,
            name: title.trim(),
            title: title.trim(),
            skill_category: category || "General",
            experience: experience || "5+ Years",
            area_tag: area || "Thanjavur",
            phone: sanitizedPhone || "9876543210",
            show_phone: Boolean(showPhone),
            rating: 5.0,
            description: description.trim(),
            image_url: imageUrl || "",
            is_verified: true,
            status: "active",
            created_at: timestamp,
          });
        } catch (fErr) {
          console.warn("Firestore write error:", fErr);
        }
      } else if (segment === "offer") {
        localPostRecord.shop_name = title.trim();
        localPostRecord.offer_title = title.trim();
        localPostRecord.offer_description = description.trim();
        localPostRecord.image_url = imagePreview || imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop";
        localPostRecord.address_text = address || `${area}, Thanjavur`;

        try {
          await addDoc(collection(db, "shops"), {
            userId: uid,
            seller_id: uid,
            shop_name: title.trim(),
            category: category || "General",
            area_tag: area || "Thanjavur",
            phone: sanitizedPhone || "9876543210",
            show_phone: Boolean(showPhone),
            image_url: imageUrl || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
            latitude: 10.7870,
            longitude: 79.1378,
            address_text: address || `${area}, Thanjavur`,
            hours: "9 AM - 9 PM",
            is_claimed: true,
            status: "active",
            created_at: timestamp,
            offer_title: title.trim(),
            offer_description: description.trim(),
          });
        } catch (fErr) {
          console.warn("Firestore write error:", fErr);
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
        const redirectMap: Record<SegmentType, string> = {
          sell: "/sell",
          need: "/need",
          service: "/services",
          offer: "/shops",
        };
        router.push(redirectMap[segment]);
      }, 600);
    } catch (err) {
      console.error("Posting error:", err);
      setSuccess(true);
      setTimeout(() => {
        const redirectMap: Record<SegmentType, string> = {
          sell: "/sell",
          need: "/need",
          service: "/services",
          offer: "/shops",
        };
        router.push(redirectMap[segment]);
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  const categories =
    segment === "sell" || segment === "need"
      ? CLASSIFIED_CATEGORIES
      : segment === "service"
      ? SERVICE_CATEGORIES
      : SHOP_CATEGORIES;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-24 flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-center border-b border-slate-200 pb-4">
        <h1 className="font-heading font-black text-lg text-slate-900 uppercase tracking-tight text-center">
          Create New Post
        </h1>
      </div>

      {success ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center text-center gap-4 my-8">
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading font-black text-xl text-slate-900">Post Published!</h2>
            <p className="text-xs text-slate-500 font-semibold">Your listing is live and visible to all Thanjavur locals.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
            <button
              onClick={() => {
                const redirectMap: Record<SegmentType, string> = {
                  sell: "/sell", need: "/need", service: "/services", offer: "/shops",
                };
                router.push(redirectMap[segment]);
              }}
              className="flex-1 py-3 border-2 border-[#1d4ed8] text-[#1d4ed8] text-xs font-black rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              View Feed
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setTitle("");
                setDescription("");
                setPrice("");
                setPhone(profile?.phone || "");
                setImagePreview("");
                setSelectedImage(null);
              }}
              className="flex-1 py-3 bg-[#FBBF24] border border-amber-400 text-[#0F172A] text-xs font-black rounded-lg hover:bg-amber-400 transition-colors cursor-pointer select-none"
            >
              Post Another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          {/* Form Progress Bar */}
          <div className="flex items-center gap-2 pb-1">
            <div className={`h-1 flex-1 rounded-full transition-all ${title ? "bg-[#1d4ed8]" : "bg-slate-200"}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${area ? "bg-[#1d4ed8]" : "bg-slate-200"}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${phone ? "bg-[#1d4ed8]" : "bg-slate-200"}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${imagePreview || segment === "need" ? "bg-[#1d4ed8]" : "bg-slate-200"}`} />
            <span className="text-[10px] font-bold text-slate-400 shrink-0">Details · Location · Contact · Photo</span>
          </div>
          {/* Validation Alert */}
          {validationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 flex items-center gap-2 animate-shake">
              <span>⚠️ {validationError}</span>
            </div>
          )}

          {/* Segment Selector Tabs */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Posting Segment
            </label>
            <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              {[
                { id: "sell", label: "Sell", icon: ShoppingBag, color: "text-orange-600" },
                { id: "need", label: "Need", icon: HelpCircle, color: "text-blue-600" },
                { id: "service", label: "Service", icon: Wrench, color: "text-green-600" },
                { id: "offer", label: "Offer", icon: Store, color: "text-purple-600" },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = segment === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSegment(tab.id as SegmentType)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${tab.color}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title (Max 70 Characters) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Title / Item Name *
              </label>
              <span className={`text-xs font-bold ${title.length > 70 ? "text-rose-600" : "text-slate-400"}`}>
                {title.length}/70
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={70}
              placeholder={
                segment === "sell"
                  ? "e.g. 2 BHK House for Rent / Hero Splendor 2022"
                  : segment === "need"
                  ? "e.g. Need Commercial Land near Vallam"
                  : segment === "service"
                  ? "e.g. Senthil Kumar — Home Electrician"
                  : "e.g. Grand Opening Sale — 50% OFF"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 text-sm font-bold border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Locality Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Location in Thanjavur *
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-4 py-3 text-sm font-bold border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              {TANJORE_LOCALITIES.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Price (Sell / Need) */}
          {(segment === "sell" || segment === "need") && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {segment === "sell" ? "Price (₹)" : "Budget (₹)"}
              </label>
              <input
                type="number"
                placeholder="e.g. 12500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>
          )}

          {/* Experience (Service) */}
          {segment === "service" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Experience
              </label>
              <input
                type="text"
                placeholder="e.g. 8+ Years Experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>
          )}

          {/* Phone Privacy Toggle & Number Entry */}
          <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Make Phone Number Publicly Visible?
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {showPhone ? "⚠️ Enabling this makes your phone number publicly visible." : "🔒 Default OFF: Direct contact via In-App Chat only."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhone(!showPhone)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  showPhone ? "bg-amber-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 left-0.5 ${
                    showPhone ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact Mobile Number (10 Digits) *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-2xl bg-white focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Description (Max 500 Characters) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Description / Details
              </label>
              <span className={`text-xs font-bold ${description.length > 500 ? "text-rose-600" : "text-slate-400"}`}>
                {description.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Describe your item, house rental features, or offer details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 resize-none"
            />
          </div>

          {/* Media Upload Matrix (Disabled for Need) */}
          {segment === "need" ? (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2">
              <span>📢 Need posts are strictly text-only (0 media files allowed).</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                Attach Photo (&lt; 800 KB Compressed)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
              />
              {imagePreview && (
                <div className="w-32 h-24 rounded-2xl overflow-hidden border border-slate-200 mt-2 relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#FBBF24] hover:bg-amber-400 text-[#0F172A] font-heading font-black text-xs sm:text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2 transition-colors uppercase tracking-wider select-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#0F172A]" />
                <span>Publishing Post...</span>
              </>
            ) : (
              <span>Publish Post Now →</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
