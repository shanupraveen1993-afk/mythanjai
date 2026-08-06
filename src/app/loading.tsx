import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="relative flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <div className="absolute w-2 h-2 rounded-full bg-amber-500 animate-ping" />
      </div>
      <p className="text-xs text-muted font-medium tracking-wide">
        Loading Tanjore Hub...
      </p>
    </div>
  );
}
