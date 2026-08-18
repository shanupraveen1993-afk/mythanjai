export const APP_CONFIG = {
  NAME: "Namma Thanjai",
  TAGLINE: "Thanjavur's Hyper-Local Network",
  DEFAULT_LOCATION: "Thanjavur, Tamil Nadu",
  DEFAULT_EXPIRY_NEEDS_DAYS: 7,
  DEFAULT_EXPIRY_OFFERS_DAYS: 3,
  SUPPORT_WHATSAPP: "919994837342",
};

// Top 20 Localities in Tanjore (Thanjavur) for normalized DB search tags
export const TANJORE_LOCALITIES = [
  "Old Bus Stand",
  "New Bus Stand",
  "South Rampart (Thenkeezh Street)",
  "Medical College Road",
  "Vallam",
  "Gandhiji Road",
  "Karanthai",
  "East Gate (Kizhakku Vasal)",
  "Parisutham Nagar",
  "Srinivasapuram",
  "Punnainallur / Mariamman Kovil",
  "Reddipalayam",
  "Yagappa Nagar",
  "LIC Colony",
  "Municipal Colony",
  "Membalam",
  "North Street (Vada Veethi)",
  "West Main Street (Melaveethi)",
  "Pillaiyarpatti",
  "Tanjore Town (General)",
  "Pudukkottai Road",
  "Trichy Road",
  "MC Road",
  "Vilar Road",
  "Mary's Corner",
  "Ramanathan Hospital Road",
  "New Housing Unit",
  "Rajappa Nagar",
  "Nataraj Nagar",
] as const;

export type TanjoreLocality = typeof TANJORE_LOCALITIES[number];

// Categories for Tab 1: Needs & Buy/Sell
export const CLASSIFIED_CATEGORIES = [
  "Property Rental",
  "Plots & Real Estate",
  "Used Vehicles",
  "Electronics & Mobiles",
  "Household Goods",
  "Jobs & Opportunities",
  "General Requirement",
] as const;

export type ClassifiedCategory = typeof CLASSIFIED_CATEGORIES[number];

// Categories for Tab 2: Service Providers
export const SERVICE_CATEGORIES = [
  "Electrician",
  "Plumber",
  "AC & Fridge Repair",
  "Mechanic (Bike & Car)",
  "Carpenter",
  "Painter",
  "Cleaning & Housekeeping",
  "Catering & Cooking",
  "Driver",
  "General Technician",
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

// Categories for Tab 3: Shops & Offers
export const SHOP_CATEGORIES = [
  "Electronics & Mobiles",
  "Cafe & Restaurant",
  "Grocery & Supermarket",
  "Textiles & Readymades",
  "Gold & Jewelry",
  "Medical & Pharmacy",
  "Hardware & Electricals",
  "Automobile Showroom",
  "Education & Coaching",
  "General Store",
] as const;

export type ShopCategory = typeof SHOP_CATEGORIES[number];

export const OFFER_CATEGORIES = [
  "Grand Opening Sale",
  "Festival Offer",
  "Special Discount",
  "Clearance Sale",
  "Buy 1 Get 1",
  "Weekend Deal",
] as const;

// Unsplash high quality localized category cover fallbacks
export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // Classifieds
  "Property Rental": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop",
  "Plots & Real Estate": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop",
  "Used Vehicles": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop",
  "Electronics & Mobiles": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop",
  "Household Goods": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop",
  "Jobs & Opportunities": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop",
  "General Requirement": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop",

  // Services
  "Electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop",
  "Plumber": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop",
  "AC & Fridge Repair": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop",
  "Mechanic (Bike & Car)": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop",
  "Carpenter": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop",
  "Painter": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop",
  "Cleaning & Housekeeping": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop",
  "Catering & Cooking": "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&auto=format&fit=crop",
  "Driver": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop",
  "General Technician": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop",

  // Shops
  "Cafe & Restaurant": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
  "Grocery & Supermarket": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop",
  "Textiles & Readymades": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop",
  "Gold & Jewelry": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop",
  "Medical & Pharmacy": "https://images.unsplash.com/photo-1586015555751-63c2057d59b2?w=600&auto=format&fit=crop",
  "Hardware & Electricals": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop",
  "Automobile Showroom": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop",
  "Education & Coaching": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop",
  "General Store": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&auto=format&fit=crop",
};

export const CATEGORY_ILLUSTRATIONS = CATEGORY_IMAGE_MAP;

/**
 * Format raw numbers into standard Indian Lakhs / Crores text (e.g. 25000000 -> ₹2.5 Crore)
 */
export function formatIndianCurrencyText(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const num = typeof amount === "number" ? amount : parseFloat(String(amount).replace(/,/g, ""));
  if (isNaN(num) || num <= 0) return String(amount);

  if (num >= 10000000) {
    const cr = num / 10000000;
    const formattedCr = cr % 1 === 0 ? cr : cr.toFixed(2);
    return `₹${formattedCr} Cr`;
  }
  if (num >= 100000) {
    const lakh = num / 100000;
    const formattedLakh = lakh % 1 === 0 ? lakh : lakh.toFixed(2);
    return `₹${formattedLakh} Lakhs`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
}

/**
 * Format timestamp into user-friendly relative duration:
 * - < 1 hr: "Xm ago" or "Just now"
 * - < 24 hrs: "Xh ago"
 * - 1 to 30 days: "1 day ago", "20 days ago", "30 days ago"
 * - > 30 days: "1 month 2 days ago", "2 months 5 days ago"
 */
export function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return "Just now";
  let date: Date;
  try {
    date = typeof timestamp?.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    if (!(date instanceof Date) || isNaN(date.getTime())) return "Just now";
  } catch (e) {
    return "Just now";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "Just now";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  if (diffDays <= 30) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }

  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;

  const monthStr = months === 1 ? "1 month" : `${months} months`;
  if (remainingDays === 0) {
    return `${monthStr} ago`;
  }
  const dayStr = remainingDays === 1 ? "1 day" : `${remainingDays} days`;
  return `${monthStr} ${dayStr} ago`;
}

/**
 * Vibrant Multicolor Per-Category Badge Styling Mapping (Design System Essential)
 */
export function getCategoryBadgeStyle(category?: string): string {
  const cat = (category || "").toLowerCase();

  if (cat.includes("plots") || cat.includes("real estate") || cat.includes("land")) {
    return "bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold";
  }
  if (cat.includes("rental") || cat.includes("house") || cat.includes("flat") || cat.includes("2 bhk") || cat.includes("apartment")) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold";
  }
  if (cat.includes("vehicle") || cat.includes("bike") || cat.includes("car") || cat.includes("scooter") || cat.includes("automobile")) {
    return "bg-amber-50 text-amber-800 border border-amber-300/80 font-semibold";
  }
  if (cat.includes("electronic") || cat.includes("mobile") || cat.includes("phone") || cat.includes("laptop")) {
    return "bg-cyan-50 text-cyan-800 border border-cyan-200/80 font-semibold";
  }
  if (cat.includes("household") || cat.includes("furniture") || cat.includes("sofa") || cat.includes("appliances")) {
    return "bg-orange-50 text-orange-700 border border-orange-200/80 font-semibold";
  }
  if (cat.includes("job") || cat.includes("work") || cat.includes("opportunity") || cat.includes("coaching") || cat.includes("education")) {
    return "bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold";
  }
  if (cat.includes("cafe") || cat.includes("restaurant") || cat.includes("food") || cat.includes("bakery")) {
    return "bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold";
  }
  if (cat.includes("textile") || cat.includes("readymade") || cat.includes("fashion") || cat.includes("cloth") || cat.includes("saree")) {
    return "bg-pink-50 text-pink-700 border border-pink-200/80 font-semibold";
  }
  if (cat.includes("gold") || cat.includes("jewel")) {
    return "bg-amber-100 text-amber-900 border border-amber-400 font-bold";
  }
  if (cat.includes("medical") || cat.includes("pharmacy")) {
    return "bg-teal-50 text-teal-700 border border-teal-200/80 font-semibold";
  }
  if (cat.includes("electrician") || cat.includes("plumber") || cat.includes("carpenter") || cat.includes("technician") || cat.includes("hardware")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200 font-semibold";
}
