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

// In-Memory Fast Cache for 0ms Instant Synchronous Initial State
const globalMemoryCache: Record<string, any[]> = {};

export function useFirestore<T = any>({
  collectionName,
  areaTag,
  category = "All",
  onlyUserPosted = null,
  postType = null,
}: UseFirestoreOptions) {
  const cacheKey = `namma_thanjai_cache_${collectionName}_${postType || "all"}_${category}_${onlyUserPosted || "public"}`;

  // Synchronous Initial State Hydration (0ms Instant Load — Zero Spinner Flash)
  const [data, setData] = useState<T[]>(() => {
    if (globalMemoryCache[cacheKey]) return globalMemoryCache[cacheKey];
    if (typeof window !== "undefined") {
      try {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            globalMemoryCache[cacheKey] = parsed;
            return parsed;
          }
        }
      } catch (e) {}
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (globalMemoryCache[cacheKey] && globalMemoryCache[cacheKey].length > 0) return false;
    if (typeof window !== "undefined") {
      try {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      } catch (e) {}
    }
    return true;
  });

  const [error, setError] = useState<Error | null>(null);

  // 2. Real-Time Firestore Synchronization
  useEffect(() => {
    let isMounted = true;

    // Build Firestore query
    let q: Query<DocumentData>;
    try {
      const colRef = collection(db, collectionName);
      const constraints: any[] = [];

      if (onlyUserPosted) {
        constraints.push(where("userId", "==", onlyUserPosted));
      }

      // Limit initial feed transfer to 20 items max (instant payload)
      constraints.push(limit(20));

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

        // Expiry check (60 days)
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

      // Sort newest first strictly
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

      globalMemoryCache[cacheKey] = items;
      setData(items as T[]);
      setLoading(false);

      // Persist top 40 items in localStorage for instant 0ms hydration on next visit
      if (typeof window !== "undefined" && items.length > 0) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(items.slice(0, 40)));
        } catch (e) {}
      }
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        processSnapshot(snapshot);
      },
      async (snapshotErr) => {
        console.warn("useFirestore: onSnapshot fallback to getDocs:", snapshotErr);
        try {
          const snap = await getDocs(q);
          processSnapshot(snap);
        } catch (docsErr: any) {
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
  }, [collectionName, category, areaTag, postType, onlyUserPosted, cacheKey]);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !data || data.length === 0) return;
    setLoadingMore(true);
    try {
      const { collection, query, getDocs, limit, where } = await import("firebase/firestore");
      const colRef = collection(db, collectionName);
      const constraints: any[] = [];
      if (onlyUserPosted) constraints.push(where("userId", "==", onlyUserPosted));
      constraints.push(limit(40));

      const snapshot = await getDocs(query(colRef, ...constraints));
      const nextItems: any[] = [];
      const seenIds = new Set(data.map((item: any) => item.id));

      snapshot.forEach((docSnap) => {
        if (!seenIds.has(docSnap.id)) {
          const docData = docSnap.data();
          if (!docData.is_sold && !docData.is_inactive && docData.status !== "inactive") {
            nextItems.push({ id: docSnap.id, ...docData });
          }
        }
      });

      if (nextItems.length === 0) {
        setHasMore(false);
      } else {
        setData((prev) => [...prev, ...nextItems as T[]]);
      }
    } catch (e) {
      console.warn("loadMore pagination note:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  return { data: data || [], loading, error, loadMore, hasMore, loadingMore };
}
