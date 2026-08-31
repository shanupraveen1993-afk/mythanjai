// src/types/index.ts

import { TanjoreLocality } from "@/lib/constants";

export interface UserProfile {
  uid: string;
  memberId?: string; // Permanent Immutable Member ID (e.g. NT-9994837342)
  phone: string;
  isVerified: boolean;
  createdAt: any; // Firestore Timestamp
  displayName?: string;
}

export interface NeedOrSalePost {
  id: string;
  userId: string;
  type: "NEED" | "SELL";
  raw_text: string;
  title: string;
  description: string;
  category: string;
  area_tag: TanjoreLocality | string;
  price: number | string | null;
  phone: string;
  is_verified: boolean;
  created_at: any; // Firestore Timestamp
  expires_at: any; // Firestore Timestamp
  image_url?: string;
  image_urls?: string[];
  youtube_url?: string;
  youtube_thumbnail?: string;
  is_fulfilled?: boolean;
  pinned?: boolean;
}

export interface ServiceProviderPost {
  id: string;
  userId: string;
  name: string;
  skill_category: string;
  experience?: string;
  area_tag: TanjoreLocality | string;
  phone: string;
  rating: number;
  is_verified: boolean;
  created_at: any; // Firestore Timestamp
  description?: string;
  negative_reports_count?: number;
  status?: "active" | "pending" | "inactive";
  pinned?: boolean;
}

export interface ShopPost {
  id: string;
  userId: string;
  shop_name: string;
  category: string;
  area_tag: TanjoreLocality | string;
  phone: string;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url?: string;
  address_text: string;
  landmark?: string;
  hours?: string;
  is_claimed: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
  created_at: any; // Firestore Timestamp
  offer_title?: string;
  offer_description?: string;
  offer_social_link?: string;
  video_url?: string;
  offer_expires_at?: any; // Firestore Timestamp
  valid_from?: string;
  valid_to?: string;
  show_phone?: boolean;
}

export interface OfferPost {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  area_tag: TanjoreLocality | string;
  thumbnail_url: string;
  social_link: string;
  platform: "instagram" | "facebook" | "whatsapp" | "other";
  is_featured?: boolean;
  created_at: any; // Firestore Timestamp
  expires_at: any; // Firestore Timestamp
}
