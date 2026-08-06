export const APP_CONFIG = {
  NAME: "Namma Thanjai",
  TAGLINE: "Thanjavur's Hyper-Local Network",
  DEFAULT_LOCATION: "Thanjavur, Tamil Nadu",
  DEFAULT_EXPIRY_NEEDS_DAYS: 7,
  DEFAULT_EXPIRY_OFFERS_DAYS: 3,
  SUPPORT_WHATSAPP: "919994837342", // Replace with your actual WhatsApp Business number
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
] as const;

export type TanjoreLocality = typeof TANJORE_LOCALITIES[number];

// Categories for Tab 1: Needs & Buy/Sell
export const CLASSIFIED_CATEGORIES = [
  "Property Rental",
  "Plot / Real Estate",
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
  "Mechanic (Bike/Car)",
  "Carpenter",
  "Painter",
  "Cleaning & Housekeeping",
  "Caterer / Cooking",
  "Driver",
  "General Technician",
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

// Categories for Tab 3: Shops & Business Directory
export const SHOP_CATEGORIES = [
  "Cafe & Restaurant",
  "Grocery & Supermarket",
  "Textiles & Readymades",
  "Gold & Jewelry",
  "Medical & Pharmacy",
  "Electronics & Mobiles",
  "Hardware & Electricals",
  "Automobile Showroom",
  "Education & Coaching",
  "General Store",
] as const;

export type ShopCategory = typeof SHOP_CATEGORIES[number];

// Categories for Tab 4: Offers & Social Buzz
export const OFFER_CATEGORIES = [
  "Food & Dining",
  "Clothing & Shopping",
  "Real Estate Launch",
  "Electronics Sale",
  "Festival Special",
  "Local Event",
] as const;

export type OfferCategory = typeof OFFER_CATEGORIES[number];
