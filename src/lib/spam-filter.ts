import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const BANNED_KEYWORDS = [
  "casino", "gambling", "betting", "poker", "lottery", "matka",
  "hack", "crack", "cheat", "scam", "fraud", "free money", "double money",
  "bitcoin giveaway", "crypto bonus", "porn", "adult site", "escort"
];

export interface SpamCheckInput {
  phone: string;
  title: string;
  description: string;
  userPosts?: any[];
}

export interface SpamCheckResult {
  isAllowed: boolean;
  reason?: string;
}

/**
 * Validates post rate limits (max 3 posts per 24h) and checks for spam/banned keywords.
 */
export async function checkPostSpamAndRateLimit(input: SpamCheckInput): Promise<SpamCheckResult> {
  const cleanPhone = (input.phone || "").replace(/\D/g, "");
  const phone10 = cleanPhone.slice(-10);

  // Super-Admin bypass
  if (phone10.includes("9994837342")) {
    return { isAllowed: true };
  }

  // 1. Check Banned Keywords
  const fullContent = `${input.title} ${input.description}`.toLowerCase();
  for (const word of BANNED_KEYWORDS) {
    if (fullContent.includes(word)) {
      return {
        isAllowed: false,
        reason: `Your listing contains prohibited content ("${word}"). Please remove it to post.`,
      };
    }
  }

  // 2. Check LocalStorage Rate Limits (Max 3 posts / 24 hours)
  if (typeof window !== "undefined") {
    try {
      const storedLocal = JSON.parse(localStorage.getItem("namma_thanjai_local_posts") || "[]");
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      const recentLocalPosts = storedLocal.filter((p: any) => {
        const pPhone = String(p.phone || "").replace(/\D/g, "").slice(-10);
        const pTime = p.created_at ? new Date(p.created_at).getTime() : 0;
        return pPhone === phone10 && pTime > oneDayAgo;
      });

      // Check exact duplicate title from same phone number
      const isDuplicate = storedLocal.some((p: any) => {
        const pPhone = String(p.phone || "").replace(/\D/g, "").slice(-10);
        return pPhone === phone10 && p.title?.trim().toLowerCase() === input.title.trim().toLowerCase();
      });

      if (isDuplicate) {
        return {
          isAllowed: false,
          reason: "You have already posted a listing with this exact title. Duplicate posts are not allowed.",
        };
      }

      if (recentLocalPosts.length >= 3) {
        return {
          isAllowed: false,
          reason: "Daily posting limit reached (Max 3 listings per 24 hours). Please try again tomorrow.",
        };
      }
    } catch (e) {}
  }

  // 3. Firestore Cloud Rate Limit Check
  if (phone10) {
    try {
      const oneDayAgoDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const cols = ["needs_and_sales", "services", "shops"];
      let cloudRecentCount = 0;

      await Promise.all(
        cols.map(async (colName) => {
          const colRef = collection(db, colName);
          const q = query(colRef, where("phone", "==", phone10));
          const snap = await getDocs(q).catch(() => null);
          if (snap && !snap.empty) {
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              const createdAt = data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at || 0);
              if (createdAt >= oneDayAgoDate) {
                cloudRecentCount++;
              }
            });
          }
        })
      );

      if (cloudRecentCount >= 3) {
        return {
          isAllowed: false,
          reason: "Daily limit reached (Max 3 posts per 24 hours). Upgrade to a verified store account for unlimited listings.",
        };
      }
    } catch (e) {}
  }

  return { isAllowed: true };
}
