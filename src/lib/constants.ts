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

// Official 26 Thanjavur District Towns & Taluks
export const THANJAVUR_TOWNS = [
  "Thanjavur",
  "Kumbakonam",
  "Pattukottai",
  "Athirampattinam",
  "Aduthurai",
  "Ammapettai",
  "Ayyampettai",
  "Sozhapuram",
  "Tharasuram",
  "Madhukkur",
  "Melathirupanthuruthi",
  "Meladoor",
  "Orathanadu",
  "Papanasam",
  "Peravurani",
  "Perumahaloor",
  "Suvamimalai",
  "Thirukkattupalli",
  "Thirunageswaram",
  "Thirupanandhal",
  "Thirupuvanam",
  "Thiruvaiyaru",
  "Thiruvidaimaruthur",
  "Vallam",
  "Veppathur",
] as const;

export type TanjoreLocality = typeof TANJORE_LOCALITIES[number];

// OLX-Style Categories for Sell & Need (General as #1 First Category)
export const CLASSIFIED_CATEGORIES = [
  "General",
  "Mobiles & Accessories",
  "Electronics & Appliances",
  "Vehicles (Cars & Bikes)",
  "Real Estate & Properties",
  "Home & Furniture",
  "Fashion & Beauty",
  "Books, Sports & Hobbies",
  "Pets & Animals",
  "Jobs & Services",
  "Agriculture & Commercial",
] as const;

export type ClassifiedCategory = typeof CLASSIFIED_CATEGORIES[number];

// Main Categories for Tab 2: Service Providers
export const SERVICE_MAIN_CATEGORIES = [
  "General Service",
  "Home Services",
  "Repair & Technicians",
  "Vehicle Services",
  "Health & Personal Care",
  "Event & Media Services",
  "Education & Tutors",
  "Business & Professional",
] as const;

export const SERVICE_CATEGORIES = SERVICE_MAIN_CATEGORIES;

export const SERVICE_SUBCATEGORIES_MAP: Record<string, string[]> = {
  "General Service": ["General Helper", "Other Service"],
  "Home Services": [
    "Plumbing",
    "Electrical",
    "Carpentry & Furniture",
    "Painting & Wall Work",
    "Masonry & Civil Work",
    "Flooring & Tiles",
    "Roofing & Waterproofing",
    "Welding & Fabrication",
    "Aluminium, UPVC & Glass",
    "False Ceiling & Interior Work",
  ],
  "Repair & Technicians": [
    "AC & Refrigeration",
    "Home Appliance Repair",
    "TV & Electronics",
    "Mobile & Computer Repair",
    "CCTV & Security",
    "Internet & Network",
    "Inverter, UPS & Solar",
    "Water Purifier & Pump",
    "Generator & Machinery",
  ],
  "Vehicle Services": [
    "Car Repair",
    "Bike & Scooter Repair",
    "Auto Repair",
    "Auto Electrical",
    "Tyre & Puncture",
    "Battery Service",
    "Washing & Detailing",
    "Towing & Breakdown",
    "Vehicle Pickup / Drop",
  ],
  "Health & Personal Care": [
    "Home Nursing & Caretaker",
    "Physiotherapy & Fitness",
    "Beautician & Makeup",
    "Barber & Grooming",
  ],
  "Event & Media Services": [
    "Photography & Videography",
    "Event Management & Decor",
    "Catering & Cooking",
    "Sound, DJ & Lighting",
  ],
  "Education & Tutors": [
    "Home Tuition (School / College)",
    "Music & Dance Classes",
    "Language & Skill Training",
  ],
  "Business & Professional": [
    "Accounting & Tax Services",
    "Legal & Stamp Paper Services",
    "Printing, Flex & Designing",
  ],
};

export type ServiceCategory = typeof SERVICE_MAIN_CATEGORIES[number];

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

export const CATEGORY_IMAGE_MAP: Record<string, string> = {};

export const CATEGORY_ILLUSTRATIONS = CATEGORY_IMAGE_MAP;


/**
 * Format raw numbers into standard Indian Lakhs / Crores text (e.g. 25000000 -> ₹2.5 Crore)
 */
export function formatIndianCurrencyText(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const str = String(amount).trim();

  let suffix = "";
  let numericPart = str;
  if (str.includes("/")) {
    const parts = str.split("/");
    numericPart = parts[0];
    suffix = ` / ${parts[1]}`;
  }

  const num = parseFloat(numericPart.replace(/[^0-9.]/g, ""));
  if (isNaN(num) || num <= 0) return str;

  let formatted = "";
  if (num >= 10000000) {
    const cr = num / 10000000;
    formatted = `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  } else if (num >= 100000) {
    const lakh = num / 100000;
    formatted = `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(2)} Lakhs`;
  } else {
    formatted = `₹${num.toLocaleString("en-IN")}`;
  }

  return `${formatted}${suffix}`;
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
 * Namma Thanjai Unified Design System Badge Styling Mapping
 */
export function getCategoryBadgeStyle(category?: string): string {
  const cat = (category || "").toLowerCase();

  if (cat.includes("plots") || cat.includes("real estate") || cat.includes("land") || cat.includes("rental") || cat.includes("house") || cat.includes("flat") || cat.includes("apartment")) {
    return "bg-[#0F172A] text-amber-400 border border-amber-400/40 font-bold shadow-2xs";
  }
  if (cat.includes("vehicle") || cat.includes("bike") || cat.includes("car") || cat.includes("scooter") || cat.includes("electronic") || cat.includes("mobile") || cat.includes("gold")) {
    return "bg-amber-50 text-amber-900 border border-amber-300 font-bold";
  }
  if (cat.includes("electrician") || cat.includes("plumber") || cat.includes("carpenter") || cat.includes("technician") || cat.includes("mechanic") || cat.includes("clean")) {
    return "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold";
  }
  if (cat.includes("cafe") || cat.includes("restaurant") || cat.includes("food") || cat.includes("deal") || cat.includes("discount")) {
    return "bg-rose-50 text-rose-800 border border-rose-300 font-semibold";
  }
  return "bg-slate-100 text-slate-800 border border-slate-200 font-semibold";
}
