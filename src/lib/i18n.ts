export type Language = "en" | "ta";

export const translations = {
  en: {
    // Navigation
    home: "Home",
    sell: "Sell",
    need: "Need",
    services: "Service",
    offers: "Offer",
    chat: "Chat",
    profile: "Profile",
    
    // Actions & CTAs
    callNow: "Call Now",
    call: "Call",
    whatsApp: "WhatsApp",
    getDirection: "Get Direction",
    location: "Location",
    forward: "Forward",
    save: "Save",
    saved: "Saved",
    views: "views",
    contacted: "Contacted",
    yourPost: "Your Post",
    markSold: "✓ Mark Sold",
    unmarkSold: "Unmark Sold",
    delete: "Delete",
    markedSold: "✓ MARKED SOLD",
    
    // Status Badges
    newListing: "New Listing",
    offerExpired: "Offer Expired",
    claimed: "Claimed",
    featuredStore: "Featured Store",
    
    // Post Buttons
    postRequirement: "+ Post Requirement",
    sellItem: "+ Sell Item",
    publishPost: "Publish Post →",

    // Safety Modal (Set 1)
    safetyTitle: "Contact & Safety Verification",
    connectingWith: "Connecting with",
    safetyRule1: "Confirm pricing upfront & verify availability before scheduling work.",
    safetyRule2: "Verify exact shop/workplace location in Thanjavur.",
    safetyWarning: "Never pay advance money online to unverified callers.",
    proceedCall: "Proceed to Call →",
    proceedWhatsApp: "Proceed to WhatsApp →",
    cancel: "Cancel",

    // Feedback Modal (Set 2)
    experienceBadge: "Service Experience Check",
    experienceTitle: "How was the experience with",
    optAnswered: "Answered & Service Confirmed",
    optAnsweredSub: "Responded, verified work & pricing",
    optUnanswered: "Not Answered",
    optUnansweredSub: "Line busy or no response",
    optReport: "Report Issue",
    optReportSub: "Incorrect details or misconduct",
    rateQuality: "Rate Service Quality:",
    describeIssue: "Describe Issue (Required):",
    submitFeedback: "Submit Verification",
    askLater: "Ask Later",

    // Matchmaker Banner
    matchmakerTitle: "Local Matchmaker — Connect in Tanjore",
    matchmakerDesc: "Post what you want to Buy, Sell, or Rent. We automatically match you directly with Tanjore residents!",

    // Toast notices
    switchedToTamil: "Switched to English",
    switchedToEnglish: "Switched to English",
  },
  ta: {
    // Navigation
    home: "Home",
    sell: "Sell",
    need: "Need",
    services: "Service",
    offers: "Offer",
    chat: "Chat",
    profile: "Profile",
    
    // Actions & CTAs
    callNow: "Call Now",
    call: "Call",
    whatsApp: "WhatsApp",
    getDirection: "Get Direction",
    location: "Location",
    forward: "Forward",
    save: "Save",
    saved: "Saved",
    views: "views",
    contacted: "Contacted",
    yourPost: "Your Post",
    markSold: "✓ Mark Sold",
    unmarkSold: "Unmark Sold",
    delete: "Delete",
    markedSold: "✓ MARKED SOLD",
    
    // Status Badges
    newListing: "New Listing",
    offerExpired: "Offer Expired",
    claimed: "Claimed",
    featuredStore: "Featured Store",
    
    // Post Buttons
    postRequirement: "+ Post Requirement",
    sellItem: "+ Sell Item",
    publishPost: "Publish Post →",

    // Safety Modal (Set 1)
    safetyTitle: "Contact & Safety Verification",
    connectingWith: "Connecting with",
    safetyRule1: "Confirm pricing upfront & verify availability before scheduling work.",
    safetyRule2: "Verify exact shop/workplace location in Thanjavur.",
    safetyWarning: "Never pay advance money online to unverified callers.",
    proceedCall: "Proceed to Call →",
    proceedWhatsApp: "Proceed to WhatsApp →",
    cancel: "Cancel",

    // Feedback Modal (Set 2)
    experienceBadge: "Service Experience Check",
    experienceTitle: "How was the experience with",
    optAnswered: "Answered & Service Confirmed",
    optAnsweredSub: "Responded, verified work & pricing",
    optUnanswered: "Not Answered",
    optUnansweredSub: "Line busy or no response",
    optReport: "Report Issue",
    optReportSub: "Incorrect details or misconduct",
    rateQuality: "Rate Service Quality:",
    describeIssue: "Describe Issue (Required):",
    submitFeedback: "Submit Verification",
    askLater: "Ask Later",

    // Matchmaker Banner
    matchmakerTitle: "Local Matchmaker — Connect in Tanjore",
    matchmakerDesc: "Post what you want to Buy, Sell, or Rent. We automatically match you directly with Tanjore residents!",

    // Toast notices
    switchedToTamil: "Switched to English",
    switchedToEnglish: "Switched to English",
  },
};

export const categoryTamilMap: Record<string, string> = {
  "Plots & Real Estate": "Plots & Real Estate",
  "Property Rental": "Property Rental",
  "Used Vehicles": "Used Vehicles",
  "Electronics & Mobiles": "Electronics & Mobiles",
  "Electrician": "Electrician",
  "Plumber": "Plumber",
  "Carpenter": "Carpenter",
  "Painter": "Painter",
  "AC Technician": "AC Technician",
  "Auto Mechanic": "Auto Mechanic",
  "Cleaning & Housekeeping": "Cleaning & Housekeeping",
  "Kitchen & Electronics": "Kitchen & Electronics",
  "Degree Coffee Deals": "Degree Coffee Deals",
  "Handloom Silk & Textiles": "Handloom Silk & Textiles",
  "Gold & Jewelry Mart": "Gold & Jewelry Mart",
};

export function getTamilCategory(category?: string): string {
  if (!category) return "";
  return category;
}
