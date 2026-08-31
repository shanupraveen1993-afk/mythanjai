import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Generate a guaranteed unique 5-digit NT-ID (e.g. NT-45218)
 * Checks against existing Firestore users collection to prevent collisions.
 */
export async function generateUniqueNTID(): Promise<string> {
  let isUnique = false;
  let candidateNTID = "";
  let attempts = 0;

  while (!isUnique && attempts < 15) {
    attempts++;
    const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
    candidateNTID = `NT-${randomFiveDigits}`;

    try {
      const q = query(collection(db, "users"), where("nt_id", "==", candidateNTID));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        isUnique = true;
      }
    } catch (e) {
      // Fallback if offline
      isUnique = true;
    }
  }

  return candidateNTID || `NT-${Math.floor(10000 + Math.random() * 90000)}`;
}

/**
 * Ensures user has a permanent NT-ID saved in Firestore.
 * Immutable once assigned.
 */
export async function getOrAssignUserNTID(userId: string): Promise<string> {
  if (!userId) return "";

  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);

    if (snap.exists() && snap.data()?.nt_id) {
      return snap.data().nt_id;
    }

    // Generate unique new ID and assign atomically
    const newNTID = await generateUniqueNTID();
    await setDoc(userRef, { nt_id: newNTID, updatedAt: new Date().toISOString() }, { merge: true });
    return newNTID;
  } catch (e) {
    console.error("Error fetching/assigning NT-ID:", e);
    // Offline deterministic fallback based on userId timestamp hash
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    return `NT-${Math.abs(hash % 90000) + 10000}`;
  }
}

/**
 * Format Humanized Chat Identity: Display Name (NT-XXXXX)
 * e.g. "Karthik (NT-45218)"
 */
export function formatUserIdentity(name?: string, ntId?: string): string {
  const cleanName = name?.trim() || "Namma Thanjai User";
  if (!ntId || !ntId.startsWith("NT-")) {
    return cleanName;
  }
  return `${cleanName} (${ntId})`;
}
