"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export default function FloatingPostButton() {
  // Deprecated: Single persistent FAB is rendered inside BottomTabBar.tsx
  return null;
}
