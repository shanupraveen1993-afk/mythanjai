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

      // 1. Filter by specific user if looking at personal listings on profile tab
      if (onlyUserPosted) {
        constraints.push(where("userId", "==", onlyUserPosted));
      }

      // 2. Filter by area tag unless "All Areas" is selected
      if (areaTag !== "All Areas" && !onlyUserPosted) {
        constraints.push(where("area_tag", "==", areaTag));
      }

      // 3. Filter by sub-category chip unless "All" is selected
      if (category && category !== "All") {
        if (collectionName === "needs_and_sales") {
          constraints.push(where("category", "==", category));
        } else if (collectionName === "services") {
          constraints.push(where("skill_category", "==", category));
        } else if (collectionName === "shops") {
          constraints.push(where("category", "==", category));
        } else if (collectionName === "offers") {
          constraints.push(where("category", "==", category));
        }
      }

      // 3.5. Filter by classified postType (need/sale)
      if (postType && collectionName === "needs_and_sales") {
        constraints.push(where("type", "==", postType));
      }

      // 4. Default sorting and limits
      constraints.push(orderBy("created_at", "desc"));
      constraints.push(limit(50));

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
          const data = doc.data();

          // 7-day auto-expiry check: filter out expired posts
          if (data.expires_at) {
            const expiryDate = data.expires_at.toDate
              ? data.expires_at.toDate()
              : new Date(data.expires_at);

            if (expiryDate <= now) {
              return; // Skip this document as it is expired
            }
          }

          items.push({
            id: doc.id,
            ...data,
          });
        });

        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, areaTag, category, onlyUserPosted, postType]);

  return { data, loading, error };
}
