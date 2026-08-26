import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type AuditActionType =
  | "POST_CREATED"
  | "POST_UPDATED"
  | "POST_DELETED"
  | "POST_REPORTED"
  | "USER_DELETED";

export interface AuditEventInput {
  action: AuditActionType;
  actorUid?: string;
  actorPhone?: string;
  actorName?: string;
  targetPostId?: string;
  targetPostTitle?: string;
  targetUserId?: string;
  targetUserPhone?: string;
  category?: string;
  details: string;
  visibilityState?: "public" | "private" | "archived" | "deleted";
}

/**
 * Standardized Logger for writing audit events to Firestore audit_logs collection.
 */
export async function logAuditEvent(input: AuditEventInput): Promise<boolean> {
  try {
    const logsRef = collection(db, "audit_logs");
    await addDoc(logsRef, {
      action: input.action,
      actorUid: input.actorUid || "anonymous_user",
      actorPhone: input.actorPhone || "Unknown",
      actorName: input.actorName || "Namma Thanjai User",
      targetPostId: input.targetPostId || null,
      targetPostTitle: input.targetPostTitle || null,
      targetUserId: input.targetUserId || null,
      targetUserPhone: input.targetUserPhone || null,
      category: input.category || "General",
      details: input.details,
      visibilityState: input.visibilityState || "public",
      timestamp: serverTimestamp(),
      created_at_iso: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn("Failed to write audit log entry:", err);
    return false;
  }
}
