"use client";

import React from "react";
import {
  Wrench,
  Zap,
  Snowflake,
  Hammer,
  Paintbrush,
  Home,
  Car,
  Smartphone,
  Armchair,
  Utensils,
  ShoppingBag,
  Tag,
  Store,
  Briefcase,
  Layers,
} from "lucide-react";

interface CategoryIconProps {
  category?: string;
  className?: string;
  iconClassName?: string;
}

export default function CategoryIcon({
  category = "",
  className = "",
  iconClassName = "w-3.5 h-3.5 text-[#1D4ED8] shrink-0",
}: CategoryIconProps) {
  const cat = (category || "").toLowerCase();

  const getIcon = () => {
    if (cat.includes("plumber") || cat.includes("water") || cat.includes("pipe")) return Wrench;
    if (cat.includes("electrician") || cat.includes("wire") || cat.includes("power")) return Zap;
    if (cat.includes("ac") || cat.includes("cool") || cat.includes("fridge")) return Snowflake;
    if (cat.includes("carpenter") || cat.includes("wood")) return Hammer;
    if (cat.includes("paint")) return Paintbrush;

    if (
      cat.includes("real estate") ||
      cat.includes("plot") ||
      cat.includes("house") ||
      cat.includes("rental") ||
      cat.includes("land") ||
      cat.includes("property")
    )
      return Home;

    if (
      cat.includes("vehicle") ||
      cat.includes("car") ||
      cat.includes("bike") ||
      cat.includes("scooter") ||
      cat.includes("auto")
    )
      return Car;

    if (
      cat.includes("electronic") ||
      cat.includes("mobile") ||
      cat.includes("laptop") ||
      cat.includes("tv") ||
      cat.includes("phone")
    )
      return Smartphone;

    if (
      cat.includes("household") ||
      cat.includes("furniture") ||
      cat.includes("appliance")
    )
      return Armchair;

    if (cat.includes("cafe") || cat.includes("food") || cat.includes("restaurant"))
      return Utensils;

    if (cat.includes("textiles") || cat.includes("fashion") || cat.includes("cloth"))
      return ShoppingBag;

    if (cat.includes("store") || cat.includes("shop") || cat.includes("deal"))
      return Store;

    return Tag;
  };

  const IconComponent = getIcon();

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 truncate ${className}`}>
      <IconComponent className={iconClassName} />
      <span className="truncate">{category || "General"}</span>
    </span>
  );
}
