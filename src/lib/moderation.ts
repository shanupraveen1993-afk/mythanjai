// ── Namma Thanjai Moderation & Safety Engine ──────────────────────────────
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";

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
 * Reports a listing directly to Firestore reports collection.
 */
export async function reportListing(
  listingId: string,
  colName: string = "needs_and_sales",
  reason: string = "Inappropriate content",
  reporterPhone: string = "Anonymous"
): Promise<{ success: boolean }> {
  try {
    // 1. Add record to Firestore reports collection
    await addDoc(collection(db, "reports"), {
      postId: listingId,
      colName,
      reason,
      reporterPhone,
      created_at: serverTimestamp(),
      status: "pending",
    });

    // 2. Increment negative_reports_count & flag on target document in Firestore
    try {
      const targetDocRef = doc(db, colName, listingId);
      await updateDoc(targetDocRef, {
        negative_reports_count: increment(1),
        is_reported: true,
      });
    } catch (e) {}

    return { success: true };
  } catch (e) {
    console.error("Failed to report listing to Firestore:", e);
    return { success: false };
  }
}

/**
 * Checks if a listing is quarantined (retained for backward compatibility).
 * Real quarantine filtering is driven by Firestore is_reported / negative_reports_count.
 */
export function isListingQuarantined(listingId?: string): boolean {
  return false;
}
