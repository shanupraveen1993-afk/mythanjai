// ── Namma Thanjai Moderation & Safety Engine ──────────────────────────────

export const BANNED_KEYWORDS = [
  "casino", "gambling", "betting", "lottery", "porn", "adult", "weapon", "drugs", "hack", "scam",
  "சூதாட்டம்", "ஆபாசம்", "துப்பாக்கி", "போதை"
];

/**
 * Checks content against the banned keyword dictionary.
 */
export function validatePostContent(title: string, description: string = ""): { isClean: boolean; matchedWord?: string } {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  for (const keyword of BANNED_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      return { isClean: false, matchedWord: keyword };
    }
  }
  
  return { isClean: true };
}

/**
 * Reports a listing. Auto-quarantines if reports > 3.
 */
export function reportListing(listingId: string, reason: string = "Inappropriate content"): { success: boolean; isQuarantined: boolean; reportCount: number } {
  if (typeof window === "undefined") return { success: false, isQuarantined: false, reportCount: 0 };
  
  try {
    const reportsKey = `namma_thanjai_reports_${listingId}`;
    const currentCount = parseInt(localStorage.getItem(reportsKey) || "0", 10) + 1;
    localStorage.setItem(reportsKey, String(currentCount));
    
    // Store report entry in history log
    const historyKey = "namma_thanjai_reported_listings";
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    history.push({ listingId, reason, timestamp: new Date().toISOString() });
    localStorage.setItem(historyKey, JSON.stringify(history));

    const isQuarantined = currentCount > 3;
    if (isQuarantined) {
      const quarantinedKey = `namma_thanjai_quarantined_${listingId}`;
      localStorage.setItem(quarantinedKey, "true");
    }

    return { success: true, isQuarantined, reportCount: currentCount };
  } catch (e) {
    console.error("Failed to report listing:", e);
    return { success: false, isQuarantined: false, reportCount: 0 };
  }
}

/**
 * Checks if a listing is quarantined due to moderation flags (>3 reports).
 */
export function isListingQuarantined(listingId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`namma_thanjai_quarantined_${listingId}`) === "true";
}
