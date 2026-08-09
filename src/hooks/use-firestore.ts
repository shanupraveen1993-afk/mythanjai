"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  DocumentData,
  Query,
} from "firebase/firestore";
import { TanjoreLocality } from "@/lib/constants";

interface UseFirestoreOptions {
  collectionName: "needs_and_sales" | "services" | "shops" | "offers";
  areaTag: TanjoreLocality | "All Areas";
  category?: string | "All";
  onlyUserPosted?: string | null; // Filter by user ID if on the profile tab
  postType?: "need" | "sale" | null;
}

export function useFirestore<T = any>({
  collectionName,
  areaTag,
  category = "All",
  onlyUserPosted = null,
  postType = null,
}: UseFirestoreOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    let q: Query<DocumentData>;

    try {
      const colRef = collection(db, collectionName);
      const constraints: any[] = [];

      // Single-field Firestore query (prevents composite index requirements)
      if (onlyUserPosted) {
        constraints.push(where("userId", "==", onlyUserPosted));
      } else if (category && category !== "All") {
        if (collectionName === "needs_and_sales") {
          constraints.push(where("category", "==", category));
        } else if (collectionName === "services") {
          constraints.push(where("skill_category", "==", category));
        } else if (collectionName === "shops") {
          constraints.push(where("category", "==", category));
        } else if (collectionName === "offers") {
          constraints.push(where("category", "==", category));
        }
      } else if (areaTag !== "All Areas") {
        constraints.push(where("area_tag", "==", areaTag));
      } else if (postType && collectionName === "needs_and_sales") {
        constraints.push(where("type", "==", postType));
      }

      // Limit results
      constraints.push(limit(150));

      q = query(colRef, ...constraints);
    } catch (err: any) {
      console.error("Query building error:", err);
      setError(err);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: any[] = [];
        const now = new Date();

        snapshot.forEach((doc) => {
          const docData = doc.data();

          // Client-side secondary filters (avoids multi-field Firestore index requirements)
          if (onlyUserPosted && docData.userId !== onlyUserPosted) return;
          if (areaTag !== "All Areas" && docData.area_tag !== areaTag) return;

          if (category && category !== "All") {
            const catField = (collectionName === "services" ? docData.skill_category : docData.category) || "";
            const normalizeCat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (normalizeCat(catField) !== normalizeCat(category)) return;
          }

          if (postType && collectionName === "needs_and_sales") {
            const pType = docData.type?.toLowerCase();
            const targetType = postType.toLowerCase();
            const isSaleTarget = targetType === "sale" || targetType === "sell";
            const isSaleDoc = !pType || pType === "sale" || pType === "sell";
            const isNeedTarget = targetType === "need" || targetType === "buy";
            const isNeedDoc = pType === "need" || pType === "buy";

            if (isSaleTarget && !isSaleDoc) return;
            if (isNeedTarget && !isNeedDoc) return;
          }

          // 7-day auto-expiry check: filter out expired posts
          if (docData.expires_at) {
            try {
              const expiryDate = typeof docData.expires_at?.toDate === "function"
                ? docData.expires_at.toDate()
                : new Date(docData.expires_at);

              if (expiryDate instanceof Date && !isNaN(expiryDate.getTime()) && expiryDate <= now) {
                return;
              }
            } catch (e) {
              console.warn("Expiry date parse warning:", e);
            }
          }

          items.push({
            id: doc.id,
            ...docData,
          });
        });

        // Safe client-side sorting by creation time
        items.sort((a, b) => {
          const timeA = a.created_at?.seconds || (a.created_at ? new Date(a.created_at).getTime() / 1000 : 0);
          const timeB = b.created_at?.seconds || (b.created_at ? new Date(b.created_at).getTime() / 1000 : 0);
          return timeB - timeA;
        });

        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn("Firestore onSnapshot non-fatal warning:", err);
        // Fallback gracefully without crashing UI
        setData([]);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, [collectionName, areaTag, category, onlyUserPosted, postType]);

  return { data: data || [], loading, error };
}
