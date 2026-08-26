"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ListingCard, { ListingItem } from "@/components/cards/ListingCard";
import { NeedOrSalePost } from "@/types";
import { Plus, ShoppingBag, Loader2, Filter, ArrowUpDown, UserCheck, MessageSquare } from "lucide-react";
import { CLASSIFIED_CATEGORIES } from "@/lib/constants";
import { isListingQuarantined } from "@/lib/moderation";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { useAuth } from "@/hooks/use-auth";
import UniversalSearchBarRow from "@/components/layout/UniversalSearchBarRow";
import HomeCategorySegmentBar from "@/components/layout/HomeCategorySegmentBar";

const SAMPLE_POSTS: NeedOrSalePost[] = [
  {
    id: "sample_1",
    userId: "sample_user_1",
    title: "iPhone 14 Pro Max 256GB - Deep Purple (Mint Condition)",
    description: "Original box, bill, and Apple official Magsafe case included. Battery health 92%. Scratchless body. Selling to upgrade to 16 Pro.",
    price: "₹68,000",
    area_tag: "Medical College Rd",
    seller_name: "Praveen Focus",
    category: "Electronics",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
    phone: "9994837342",
    is_verified: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "sample_2",
    userId: "sample_user_2",
    title: "Hero Splendor Plus BS6 (2023 Single Owner)",
    description: "Mileage 65 km/l. Fully serviced at authorized Hero showroom. Showroom condition with 1 year insurance valid.",
    price: "₹55,000",
    area_tag: "Old Bus Stand",
    seller_name: "Senthil Nathan",
    category: "Vehicles",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80",
    phone: "9842412345",
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "sample_3",
    userId: "sample_user_3",
    title: "Teak Wood 6-Seater Dining Table Set with Cushioned Chairs",
    description: "Pure Burma teak wood, hand polished. No damage or scratches. Urgent sale due to relocation.",
    price: "₹18,500",
    area_tag: "New Housing Unit",
    seller_name: "Kavitha Rajan",
    category: "Furniture",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80",
    phone: "9443198765",
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "sample_4",
    userId: "sample_user_4",
    title: "Dell XPS 15 Laptop i7 12th Gen / 16GB RAM / 512GB SSD",
    description: "OLED Touch Display, NVIDIA RTX Graphics. Perfect for video editing and software engineering.",
    price: "₹72,000",
    area_tag: "Pullanaboot",
    seller_name: "Arun Kumar Tech",
    category: "Electronics",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80",
    phone: "9876543210",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "sample_5",
    userId: "sample_user_5",
    title: "Sony PlayStation 5 Disc Edition + 2 DualSense Controllers",
    description: "Includes God of War Ragnarok & Spider-Man 2 game discs. Works 100% fine. Reason for selling: switching to PC.",
    price: "₹38,000",
    area_tag: "Rajappa Nagar",
    seller_name: "Vignesh G",
    category: "Electronics",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80",
    phone: "9789012345",
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
  {
    id: "sample_6",
    userId: "sample_user_6",
    title: "Whirlpool 240L Triple Door Refrigerator (5 Star)",
    description: "Frost-free triple door fridge. Very low power usage. 2 years old, stainless steel finish.",
    price: "₹14,000",
    area_tag: "Medical College Rd",
    seller_name: "Manikandan S",
    category: "Home Appliances",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80",
    phone: "9944056789",
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: "sample_7",
    userId: "sample_user_7",
    title: "Royal Enfield Classic 350 Stealth Black (2022)",
    description: "Dual channel ABS. Alloy wheels & tubeless tires installed. Run 14,000 km only.",
    price: "₹1,65,000",
    area_tag: "Trichy Road",
    seller_name: "Karthik RE",
    category: "Vehicles",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
    phone: "9865012345",
    created_at: new Date(Date.now() - 60 * 3600000).toISOString(),
  },
  {
    id: "sample_8",
    userId: "sample_user_8",
    title: "Canon EOS 1500D DSLR Camera with 18-55mm + 55-250mm Lens",
    description: "Includes camera bag, 64GB SanDisk Extreme SD card, and extra battery. Barely used.",
    price: "₹26,500",
    area_tag: "Vilar Bypass",
    seller_name: "Pradeep Studio",
    category: "Electronics",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
    phone: "9442098765",
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
  {
    id: "sample_9",
    userId: "sample_user_9",
    title: "Solid Wood Study Desk with Bookshelf & Ergonomic Chair",
    description: "Spacious computer desk with drawer storage and adjustable executive swivel chair.",
    price: "₹7,500",
    area_tag: "Karanthai",
    seller_name: "Anand Home Furniture",
    category: "Furniture",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80",
    phone: "9790123456",
    created_at: new Date(Date.now() - 84 * 3600000).toISOString(),
  },
  {
    id: "sample_10",
    userId: "sample_user_10",
    title: "LG 1.5 Ton 5 Star Dual Inverter Split AC (Copper Condenser)",
    description: "Includes outdoor bracket & 10ft copper pipe. Super fast cooling with HD filter.",
    price: "₹24,000",
    area_tag: "Vallam",
    seller_name: "Murugan Cool Care",
    category: "Home Appliances",
    type: "SELL",
    image_url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
    phone: "9842098765",
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
  },
];

export default function SellClientPage() {
  const router = useRouter();
  const { user, profile, isVerified } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"recent" | "price_low" | "price_high">("recent");
  // NOTE: localStorage posts are ONLY for My Listings page.
  // Public feed always shows only Firestore data — never own posts.

  const categoryOptions = React.useMemo(() => [
    { label: "All Categories", value: "All" },
    ...CLASSIFIED_CATEGORIES.map((cat) => ({ label: cat, value: cat })),
  ], []);

  const sortOptions = React.useMemo(() => [
    { label: "Recently Added", value: "recent" },
    { label: "Price: Low to High", value: "price_low" },
    { label: "Price: High to Low", value: "price_high" },
  ], []);

  const isAuthVerified = isVerified;

  const handlePostItem = () => {
    if (!isAuthVerified) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("namma_thanjai_target_post_route", "/post/sell");
        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
      }
      return;
    }
    router.push("/post/sell");
  };

  const { data: firestorePosts, loading } = useFirestore<NeedOrSalePost>({
    collectionName: "needs_and_sales",
    areaTag: "All Areas",
    category: "All",
  });



  // Public feed: Firestore live query data + Sample posts fallback for localhost design preview
  const allPosts = React.useMemo(() => {
    const live = firestorePosts || [];
    if (live.length >= 2) return live;
    return [...live, ...SAMPLE_POSTS];
  }, [firestorePosts]);

  const filteredPosts = React.useMemo(() => {
    let list: NeedOrSalePost[] = allPosts.filter((p: any) => {
      if (p.status === "moderation_review") return false;
      if (isListingQuarantined(p.id)) return false;
      if (!p.title || p.title.trim() === "") return false;
      const pType = (p.type || "SELL").toUpperCase();
      if (pType === "NEED") return false;
      if (p.is_sold) return false;
      return true;
    });

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "price_low") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return list;
  }, [allPosts, selectedCategory, sortBy]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; // 5 rows for 1 page (3 cols x 5 rows)

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy]);

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) || 1;
  const paginatedPosts = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  return (
    <div className="flex flex-col gap-0 pb-24 w-full font-sans">
      <UniversalSearchBarRow />
      <HomeCategorySegmentBar />

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 flex flex-col gap-3 mt-2">
        {/* 1. TITLE BAR */}
        <div className="py-1.5 flex items-center justify-between gap-3 w-full border-b border-slate-200/80">
          <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
            Items for Sale (விற்பனை)
          </h2>
        </div>

      {/* LISTING CONTAINER */}
      <div className="flex flex-col gap-3">
        {/* Category & Sort Custom Dropdown Controls (Hug Content) */}
        <div className="py-1 flex items-center gap-2 sm:gap-3 bg-transparent w-full flex-wrap">
          {/* Category Dropdown */}
          <CustomDropdown
            options={categoryOptions}
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            icon={<Filter className="w-3.5 h-3.5" />}
            className="w-fit shrink-0"
          />

          {/* Sort By Dropdown */}
          <CustomDropdown
            options={sortOptions}
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            className="w-fit shrink-0"
          />
        </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-amber-600 animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <ShoppingBag className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No items listed yet.</p>
          <button onClick={handlePostItem} className="btn-tertiary text-xs px-4 py-2 uppercase tracking-wider cursor-pointer">+ Post Item</button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedPosts.map((post) => (
              <ListingCard key={post.id} listing={post as unknown as ListingItem} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-6 pb-2 border-t border-slate-200/80">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                Next
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
