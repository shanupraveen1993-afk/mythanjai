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
} from "@/lib/constants";
import {
  Check,
  Loader2,
  Tag,
  MapPin,
  Phone,
  Camera,
} from "lucide-react";

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
    firestoreCollection: "needs_and_sales" | "services" | "shops";
    categories: readonly string[];
    accentColor: string;
  }
> = {
  sell: {
    title: "Post Item for Sale",
    badge: "Sell Marketplace",
    buttonLabel: "Publish Sale Post →",
    redirectPath: "/sell",
    firestoreCollection: "needs_and_sales",
    categories: CLASSIFIED_CATEGORIES,
    accentColor: "bg-yellow-500 hover:bg-yellow-400 border-yellow-400 text-slate-950",
  },
  need: {
    title: "Post Requirement",
    badge: "Buyer Requirement",
    buttonLabel: "Publish Requirement →",
    redirectPath: "/need",
    firestoreCollection: "needs_and_sales",
    categories: CLASSIFIED_CATEGORIES,
    accentColor: "bg-blue-500 hover:bg-blue-400 border-blue-400 text-white",
  },
  service: {
    title: "Register Service Trade",
    badge: "Verified Skilled Trade",
    buttonLabel: "Publish Service Trade →",
    redirectPath: "/services",
    firestoreCollection: "services",
    categories: SERVICE_CATEGORIES,
    accentColor: "bg-green-600 hover:bg-green-500 border-green-500 text-white",
  },
  offer: {
    title: "Post Store Offer & Deal",
    badge: "Local Store Deal",
    buttonLabel: "Publish Store Offer →",
    redirectPath: "/shops",
    firestoreCollection: "shops",
    categories: SHOP_CATEGORIES,
    accentColor: "bg-purple-600 hover:bg-purple-500 border-purple-500 text-white",
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
  const [price, setPrice] = useState("");
  const [experience, setExperience] = useState("5+ Years");
  const [address, setAddress] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

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
          console.warn("Image upload fallback:", uploadErr);
          imageUrl = imagePreview || "";
        }
      }

      const timestamp = serverTimestamp();
      const uid = user?.uid || "guest_user";

      if (segment === "sell" || segment === "need") {
        await addDoc(collection(db, "needs_and_sales"), {
          userId: uid,
          type: segment === "sell" ? "SELL" : "NEED",
          title: title.trim(),
          description: description.trim(),
          raw_text: description.trim(),
          category,
          area_tag: area,
          price: price ? parseFloat(price) : null,
          phone: phone || "9876543210",
          image_url: imageUrl,
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
          area_tag: area,
          phone: phone || "9876543210",
          rating: 5.0,
          description: description.trim(),
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
          address_text: address || `${area}, Thanjavur`,
          hours: "9 AM - 9 PM",
          is_claimed: true,
          created_at: timestamp,
          offer_title: title.trim(),
          offer_description: description.trim(),
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

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-24 flex flex-col gap-5 font-sans">
      {/* Header */}
      <div className="flex flex-col items-center border-b border-slate-200 pb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {config.badge}
        </span>
        <h1 className="font-heading font-black text-base sm:text-lg text-slate-900 uppercase tracking-tight">
          {config.title}
        </h1>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-8 flex flex-col items-center text-center gap-3 animate-fade-in my-8">
          <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>
          <h2 className="font-heading font-black text-lg text-green-900">Post Published Successfully!</h2>
          <p className="text-xs text-green-700 font-semibold">Redirecting to feed...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Title / Item Name *
            </label>
            <input
              type="text"
              required
              placeholder={
                segment === "sell"
                  ? "e.g. 2400 Sqft CMDA Plot / Hero Splendor 2022"
                  : segment === "need"
                  ? "e.g. Need 2 BHK House near Medical College"
                  : segment === "service"
                  ? "e.g. Senthil Kumar — Home Electrician"
                  : "e.g. GLEN Kitchen Chimney — 50% OFF"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              {config.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Location in Thanjavur *
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer"
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {segment === "sell" ? "Price (₹)" : "Budget (₹)"}
              </label>
              <input
                type="number"
                placeholder="e.g. 12500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>
          )}

          {/* Experience (Service) */}
          {segment === "service" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Experience
              </label>
              <input
                type="text"
                placeholder="e.g. 8+ Years Experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>
          )}

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Contact Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Description / Details
            </label>
            <textarea
              rows={3}
              placeholder="Describe your posting details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 resize-none"
            />
          </div>

          {/* Photo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              Attach Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
            />
            {imagePreview && (
              <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-200 mt-1 relative">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 ${config.accentColor} font-black text-xs uppercase tracking-wider rounded-2xl border shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1`}
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
      )}
    </div>
  );
}
