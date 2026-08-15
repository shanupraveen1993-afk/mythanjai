"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center font-bold text-xs text-slate-400">
      Loading Namma Thanjavur...
    </div>
  );
}
