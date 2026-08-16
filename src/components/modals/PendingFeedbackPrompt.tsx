"use client";

import React, { useState, useEffect } from "react";
import ServiceFeedbackModal from "./ServiceFeedbackModal";

export default function PendingFeedbackPrompt() {
  const [pendingFeedback, setPendingFeedback] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkPendingFeedback = () => {
      if (typeof window === "undefined") return;
      try {
        const stored = localStorage.getItem("namma_thanjai_pending_feedback");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.status === "completed") return;

          // If status is remind_later, check if 5 minutes have passed or next session
          if (parsed.status === "remind_later") {
            const remindAt = parsed.remind_at || 0;
            if (Date.now() < remindAt) return;
          }

          setPendingFeedback({
            id: parsed.id,
            name: parsed.name,
            phone: parsed.phone,
          });
          setIsOpen(true);
        }
      } catch (e) {}
    };

    // Check on initial load after 3 seconds
    const timer = setTimeout(checkPendingFeedback, 3000);

    // Also check on window focus / visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkPendingFeedback();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!isOpen || !pendingFeedback) return null;

  return (
    <ServiceFeedbackModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      serviceId={pendingFeedback.id}
      serviceName={pendingFeedback.name}
      phone={pendingFeedback.phone}
    />
  );
}
