import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const BANNED_KEYWORDS = [
  "casino", "gambling", "betting", "poker", "lottery", "matka",
  "hack", "crack", "cheat", "scam", "fraud", "free money", "double money",
  "bitcoin giveaway", "crypto bonus", "porn", "adult site", "escort"
];

export interface SpamCheckInput {
  uid?: string;
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
 * Validates post content (banned keywords only).
 * Rate limiting is handled server-side via Firestore — not localStorage.
 */
export async function checkPostSpamAndRateLimit(input: SpamCheckInput): Promise<SpamCheckResult> {
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

  return { isAllowed: true };
}
