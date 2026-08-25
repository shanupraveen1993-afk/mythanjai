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

      // Only add userId constraint if specifically requesting a single user's profile
      if (onlyUserPosted) {
        constraints.push(where("userId", "==", onlyUserPosted));
      }

      // Limit results to last 150 items
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
            const docType = (docData.type || "").toString().toUpperCase();
            if (postType.toLowerCase() === "need" || postType.toLowerCase() === "buy") {
              if (docType !== "NEED") return;
            } else {
              // Target is SELL/SALE: Only exclude if explicitly type == "NEED"
              if (docType === "NEED") return;
            }
          }

          // 60-day validity check (safely ignore invalid or missing dates)
          if (docData.expires_at) {
            try {
              const expiryDate = typeof docData.expires_at?.toDate === "function"
                ? docData.expires_at.toDate()
                : new Date(docData.expires_at);

              if (expiryDate instanceof Date && !isNaN(expiryDate.getTime()) && expiryDate.getTime() < Date.now() - 60 * 24 * 60 * 60 * 1000) {
                return;
              }
            } catch (e) {}
          }

          items.push({
            id: doc.id,
            ...docData,
          });
        });

        // Client-side sorting by creation time (descending - newest first)
        const parseTimestamp = (val: any) => {
          if (!val) return Date.now();
          if (typeof val.seconds === "number") return val.seconds * 1000;
          if (typeof val.toDate === "function") return val.toDate().getTime();
          const parsed = new Date(val).getTime();
          return isNaN(parsed) || parsed === 0 ? Date.now() : parsed;
        };

        items.sort((a, b) => parseTimestamp(b.created_at) - parseTimestamp(a.created_at));

        setData(items);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore snapshot listener note:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, category, areaTag, postType, onlyUserPosted]);

  return { data: data || [], loading, error };
}
