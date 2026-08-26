"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
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
    let isMounted = true;

    // Build Firestore query
    let q: Query<DocumentData>;
    try {
      const colRef = collection(db, collectionName);
      const constraints: any[] = [];

      // Only add userId constraint if specifically requesting a single user's profile
      if (onlyUserPosted) {
        constraints.push(where("userId", "==", onlyUserPosted));
      }

      // Limit results to last 200 items (newest first by Firestore insertion order)
      constraints.push(limit(200));

      q = query(colRef, ...constraints);
    } catch (err: any) {
      console.error("useFirestore: Query building error:", err);
      if (isMounted) {
        setError(err);
        setLoading(false);
      }
      return;
    }

    const processSnapshot = (snapshot: any) => {
      if (!isMounted) return;

      const items: any[] = [];

      snapshot.forEach((doc: any) => {
        const docData = doc.data();

        // Client-side secondary filters
        if (onlyUserPosted && docData.userId !== onlyUserPosted) return;
        if (!onlyUserPosted) {
          if (docData.is_sold || docData.is_inactive || docData.is_offline || docData.status === "inactive") return;
        }
        if (areaTag !== "All Areas" && docData.area_tag !== areaTag) return;

        if (category && category !== "All") {
          const catField =
            (collectionName === "services"
              ? docData.skill_category
              : docData.category) || "";
          const normalizeCat = (s: string) =>
            s.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (normalizeCat(catField) !== normalizeCat(category)) return;
        }

        if (postType && collectionName === "needs_and_sales") {
          const docType = (docData.type || "").toString().toUpperCase();
          if (
            postType.toLowerCase() === "need" ||
            postType.toLowerCase() === "buy"
          ) {
            if (docType !== "NEED") return;
          } else {
            // Sell feed: exclude NEEDs
            if (docType === "NEED") return;
          }
        }



        // 60-day expiry check
        if (docData.expires_at) {
          try {
            const expiryDate =
              typeof docData.expires_at?.toDate === "function"
                ? docData.expires_at.toDate()
                : new Date(docData.expires_at);

            if (
              expiryDate instanceof Date &&
              !isNaN(expiryDate.getTime()) &&
              expiryDate.getTime() <
                Date.now() - 60 * 24 * 60 * 60 * 1000
            ) {
              return;
            }
          } catch (e) {}
        }

        items.push({ id: doc.id, ...docData });
      });

      // Sort newest first
      const parseTimestamp = (val: any): number => {
        if (!val) return Date.now();
        if (typeof val.seconds === "number") return val.seconds * 1000;
        if (typeof val.toDate === "function") return val.toDate().getTime();
        const parsed = new Date(val).getTime();
        return isNaN(parsed) || parsed <= 0 ? Date.now() : parsed;
      };
      items.sort(
        (a, b) => parseTimestamp(b.created_at) - parseTimestamp(a.created_at)
      );

      setData(items as T[]);
      setLoading(false);
    };

    // Try real-time listener first
    const unsubscribe = onSnapshot(
      q,
      processSnapshot,
      async (snapshotErr) => {
        // onSnapshot failed — fall back to a one-time getDocs fetch
        console.warn(
          "useFirestore: onSnapshot error, falling back to getDocs:",
          snapshotErr
        );
        try {
          const snap = await getDocs(q);
          processSnapshot(snap);
        } catch (docsErr: any) {
          console.error(
            "useFirestore: getDocs fallback also failed:",
            docsErr
          );
          if (isMounted) {
            setError(docsErr);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [collectionName, category, areaTag, postType, onlyUserPosted]);

  return { data: data || [], loading, error };
}
