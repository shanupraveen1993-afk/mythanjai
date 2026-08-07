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

// High quality square medium category illustrations
export const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  // Classifieds
  "Property Rental": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop",
  "Plot / Real Estate": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop",
  "Used Vehicles": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop",
  "Electronics & Mobiles": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop",
  "Household Goods": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop",
  "Jobs & Opportunities": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop",
  "General Requirement": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop",

  // Services
  "Electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop",
  "Plumber": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop",
  "AC & Fridge Repair": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop",
  "Mechanic (Bike/Car)": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop",
  "Carpenter": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop",
  "Painter": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop",
  "Cleaning & Housekeeping": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop",
  "Caterer / Cooking": "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&auto=format&fit=crop",
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
