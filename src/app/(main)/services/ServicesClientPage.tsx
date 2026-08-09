"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore } from "@/hooks/use-firestore";
import ServiceCard from "@/components/cards/ServiceCard";
import { SERVICE_CATEGORIES, TANJORE_LOCALITIES, TanjoreLocality, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import { ServiceProviderPost } from "@/types";
import { Wrench, Plus, ChevronDown, ChevronUp, Loader2, ArrowRight, ArrowLeft, Upload, ShieldCheck, Tag, Calendar, Share2, Check, Zap, Droplet, Wind, Hammer, MapPin, MessageSquare, Search, Utensils } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";

export default function ServicesClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  
  const area = (searchParams.get("area") || "All Areas") as TanjoreLocality | "All Areas";
  const rawCat = searchParams.get("category");
  const urlCategory = rawCat ? decodeURIComponent(rawCat.replace(/\+/g, " ")) : null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(decodeURIComponent(cat.replace(/\+/g, " ")));
    }
  }, [searchParams]);

  const CATEGORY_STOCK_IMAGES: Record<string, string> = {
    "Electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
    "Plumber": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80",
    "AC & Fridge Repair": "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=400&q=80",
    "Carpenter": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80",
    "Painter": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80",
    "House Cleaning": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
    "Mechanic (Bike & Car)": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80",
    "Catering & Cooking": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    "Others": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
  };

  const CATEGORY_SAMPLE_TECHNICIANS: Record<string, { name: string; exp: string; desc: string }> = {
    "Electrician": {
      name: "Senthil Kumar - Home Electrician",
      exp: "8+ Years Experience",
      desc: "Expert house wiring, DB box installation, inverter assembly, three-phase connection & emergency electrical fixes."
    },
    "Plumber": {
      name: "Rajesh K - Expert Plumber",
      exp: "6+ Years Experience",
      desc: "Pipe fitting, water tank washing, Kaveri line tap connections, motor pump installation & leak repairs."
    },
    "AC & Fridge Repair": {
      name: "Muthu Cool Tech - AC & Fridge",
      exp: "7+ Years Experience",
      desc: "Split AC gas filling, deep foam wash cleaning, refrigerator compressor repairs & washing machine service."
    },
    "Carpenter": {
      name: "Venu Gopal - Wood Architect",
      exp: "10+ Years Experience",
      desc: "Modular kitchen woodworks, door laminations, door locks repairs, bespoke wardrobes & furniture."
    },
    "Painter": {
      name: "Murugan Professional Painters",
      exp: "12+ Years Experience",
      desc: "Interior & exterior wall painting, waterproof putty application, Asian Paints wall texture & wood polishing."
    },
    "House Cleaning": {
      name: "Thanjavur Deep Cleaning Services",
      exp: "5+ Years Experience",
      desc: "Full home deep cleaning, sofa shampooing, water tank disinfection & kitchen chimney degreasing."
    },
    "Mechanic (Bike & Car)": {
      name: "Raja Auto Care & Mechanic",
      exp: "9+ Years Experience",
      desc: "Two-wheeler general engine service, oil change, brake shoe replacement & car battery jumpstart."
    },
    "Catering & Cooking": {
      name: "Saraswathi Traditional Tanjore Catering",
      exp: "15+ Years Experience",
      desc: "Brahmin style traditional marriage feast cooking, small function catering, breakfast items & evening snacks."
    },
    "Others": {
      name: "Tanjore Local Service Specialist",
      exp: "5+ Years Experience",
      desc: "Professional home assistance, repair services & custom tasks."
    }
  };

  const getSampleTechnician = () => {
    const cat = selectedCategory || "Others";
    return CATEGORY_SAMPLE_TECHNICIANS[cat] || CATEGORY_SAMPLE_TECHNICIANS["Electrician"] || {
      name: "Experienced Tanjore Tradesman",
      exp: "5+ Years Experience",
      desc: "Verified local skilled technician available for immediate house calls."
    };
  };

  // Inline Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [experience, setExperience] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [availability, setAvailability] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [formArea, setFormArea] = useState("");

  const [uploading, setUploading] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);

  const displayTechName = serviceName || getSampleTechnician().name;
  const displayTechExp = experience || getSampleTechnician().exp;
  const displayTechDesc = serviceDescription || getSampleTechnician().desc;
  const previewImage = CATEGORY_STOCK_IMAGES[selectedCategory || "Others"] || CATEGORY_STOCK_IMAGES["Others"];

  const getVectorIcon = (category: string) => {
    switch (category) {
      case "Electrician": return <Zap className="w-3.5 h-3.5 text-slate-550" />;
      case "Plumber": return <Droplet className="w-3.5 h-3.5 text-slate-550" />;
      case "AC & Fridge Repair": return <Wind className="w-3.5 h-3.5 text-slate-550" />;
      case "Carpenter": return <Hammer className="w-3.5 h-3.5 text-slate-550" />;
      default: return <Wrench className="w-3.5 h-3.5 text-slate-550" />;
    }
  };

  // Seed initial sample technicians in local state
  const [localServices, setLocalServices] = useState<ServiceProviderPost[]>([
    {
      id: "senthil_electrician",
      userId: "sample_user_s1",
      name: "Senthil Kumar - Home Electrician",
      skill_category: "Electrician",
      experience: "8+ Years Experience",
      area_tag: "Tanjore Town",
      phone: "9876543213",
      rating: 4.9,
      description: "Expert house wiring, DB box installation, inverter assembly, three-phase connection & emergency electrical fixes.",
      is_verified: true,
      created_at: new Date() as any,
    },
    {
      id: "rajesh_plumber",
      userId: "sample_user_s2",
      name: "Rajesh K - Expert Plumber",
      skill_category: "Plumber",
      experience: "6+ Years Experience",
      area_tag: "Medical College Rd",
      phone: "9876543214",
      rating: 4.8,
      description: "Pipe fitting, water tank washing, Kaveri line tap connections, motor pump installation & leak repairs.",
      is_verified: true,
      created_at: new Date() as any,
    },
    {
      id: "venu_carpenter",
      userId: "sample_user_s3",
      name: "Venu Gopal - Wood Architect",
      skill_category: "Carpenter",
      experience: "10+ Years Experience",
      area_tag: "South Rampart Rd",
      phone: "9876543215",
      rating: 5.0,
      description: "Modular kitchen woodworks, door laminations, door locks repairs, bespoke wardrobes & furniture.",
      is_verified: true,
      created_at: new Date() as any,
    },
    {
      id: "muthu_ac_repair",
      userId: "sample_user_s4",
      name: "Muthu Cool Tech - AC & Fridge",
      skill_category: "AC & Fridge Repair",
      experience: "7+ Years Experience",
      area_tag: "Old Bus Stand",
      phone: "9876543216",
      rating: 4.9,
      description: "Split AC gas filling, deep foam wash cleaning, refrigerator compressor repairs & washing machine service.",
      is_verified: true,
      created_at: new Date() as any,
    },
    {
      id: "murugan_painter",
      userId: "sample_user_s5",
      name: "Murugan Professional Painters",
      skill_category: "Painter",
      experience: "12+ Years Experience",
      area_tag: "Vallam",
      phone: "9876543217",
      rating: 4.8,
      description: "Interior & exterior wall painting, waterproof putty application, Asian Paints wall texture & wood polishing.",
      is_verified: true,
      created_at: new Date() as any,
    },
    {
      id: "clean_home_service",
      userId: "sample_user_s6",
      name: "Thanjavur Deep Cleaning Services",
      skill_category: "House Cleaning",
      experience: "5+ Years Experience",
      area_tag: "New Bus Stand",
      phone: "9876543218",
      rating: 4.7,
      description: "Full home deep cleaning, sofa shampooing, water tank disinfection & kitchen chimney degreasing.",
      is_verified: true,
      created_at: new Date() as any,
    }
  ]);

  const targetPostId = searchParams.get("post");
  useEffect(() => {
    if (targetPostId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [targetPostId]);

  // Expand form if ?create=true is in URL query parameters
  const triggerCreate = searchParams.get("create") === "true";
  useEffect(() => {
    if (triggerCreate) {
      setIsFormOpen(true);
    }
  }, [triggerCreate]);

  // Firestore Real-time Query Subscription
  const { data: services, loading: servicesLoading } = useFirestore<ServiceProviderPost>({
    collectionName: "services",
    areaTag: area,
    category: selectedCategory || "All",
  });

  const combinedServices = React.useMemo(() => {
    const normSelected = (selectedCategory || "").toLowerCase().trim();
    const activeLocal = localServices.filter(s => {
      const sCat = (s.skill_category || "").toLowerCase().trim();
      return !normSelected || sCat === normSelected || sCat.includes(normSelected) || normSelected.includes(sCat);
    });
    const list = [...activeLocal, ...(services || [])];
    if (targetPostId) {
      list.sort((a, b) => {
        if (a.id === targetPostId) return -1;
        if (b.id === targetPostId) return 1;
        return 0;
      });
    }
    return list;
  }, [localServices, services, selectedCategory, targetPostId]);

  const handleCategorySelect = (category?: string | null) => {
    if (category && typeof category === "string") {
      setSelectedCategory(category);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", category);
      router.replace(`/services?${params.toString()}`, { scroll: false });
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    const queryString = params.toString();
    router.replace(queryString ? `/services?${queryString}` : "/services", { scroll: false });
  };

  const searchQuery = searchParams.get("query") || "";

  // Filter services by search query
  const filteredServices = React.useMemo(() => {
    return combinedServices.filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.skill_category?.toLowerCase().includes(q) ||
        s.area_tag?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    });
  }, [combinedServices, searchQuery]);

  return (
    <div className="flex flex-col gap-5 mt-3 md:mt-4 pt-1 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* HERO BANNER: Shown ONLY on Main Category Overview Page */}
      {!selectedCategory && (
        <div className="relative w-full min-h-[190px] sm:min-h-[210px] rounded-3xl overflow-hidden shadow-md border border-slate-800 bg-slate-955 text-white flex items-center p-6 sm:p-8">
          <img 
            src="/thanjavur_electrician_service.png" 
            alt="Local Services Banner" 
            className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover opacity-50 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-955 via-slate-955/90 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500 text-slate-955 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Direct Skilled Services
              </span>
              <span className="text-[11px] text-slate-300 font-bold">
                Thanjavur District
              </span>
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase leading-tight">
              Verified Local Services
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md">
              Find experienced electricians near Big Temple, plumbers on Medical College Rd, carpenters, AC technicians & painters.
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION OVERVIEW GRID */}
      {!selectedCategory ? (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
                Select Service Category
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Choose a skilled trade category to view verified technicians in Thanjavur
              </p>
            </div>
            
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-2xs shrink-0"
            >
              <Plus className={`w-4 h-4 text-slate-955 transition-transform duration-250 ${isFormOpen ? "rotate-45" : ""}`} />
              <span>Post Trade</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
            {SERVICE_CATEGORIES.map((cat) => {
              const getVectorIcon = (category: string) => {
                switch (category) {
                  case "Electrician": return <Zap className="w-6 h-6 text-yellow-600" />;
                  case "Plumber": return <Droplet className="w-6 h-6 text-blue-600" />;
                  case "AC & Fridge Repair": return <Wind className="w-6 h-6 text-cyan-500" />;
                  case "Mechanic (Bike & Car)": return <Wrench className="w-6 h-6 text-slate-700" />;
                  case "Carpenter": return <Hammer className="w-6 h-6 text-amber-700" />;
                  case "Catering & Cooking": return <Utensils className="w-6 h-6 text-orange-600" />;
                  default: return <Wrench className="w-6 h-6 text-slate-600" />;
                }
              };

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className="bg-white border border-slate-200 hover:border-slate-300 p-2.5 sm:p-3 rounded-2xl shadow-2xs text-left transition-all active:scale-[0.98] hover:shadow-xs flex flex-col gap-2.5 group w-full cursor-pointer overflow-hidden justify-between items-center"
                >
                  <div className="w-full h-12 sm:h-16 rounded-xl flex items-center justify-center bg-slate-100/80 group-hover:bg-slate-200/80 transition-colors border border-slate-200/50">
                    {getVectorIcon(cat)}
                  </div>
                  <div className="w-full text-center">
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 block group-hover:text-slate-700 transition-colors line-clamp-1">
                      {cat}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Horizontal Scrollable Preview Feed of Recent Technicians */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-sm sm:text-base text-slate-900 tracking-tight">
                Recent Service Listings
              </h2>
            </div>
            <div className="flex overflow-x-auto snap-x scrollbar-none gap-4 pb-2">
              {filteredServices.map((service) => (
                <div 
                  key={service.id} 
                  onClick={() => handleCategorySelect(service.skill_category)}
                  className="shrink-0 w-[280px] sm:w-[320px] snap-start cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <ServiceCard post={service} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: DETAILED FEED & REGISTRATION CARD FOR TRADE */
        <div className="flex flex-col gap-5">
          {/* Active Category Title Bar */}
          <div className="flex items-center justify-between bg-slate-100/90 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500 text-slate-955 font-black text-xs px-2.5 py-1 rounded-xl shadow-2xs">
                {selectedCategory}
              </span>
              <span className="text-xs text-slate-600 font-bold">
                ({filteredServices.length} {filteredServices.length === 1 ? "Technician" : "Technicians"})
              </span>
            </div>
            <button
              onClick={handleClearCategory}
              className="text-xs font-black text-slate-700 hover:text-slate-900 bg-white border border-slate-250 px-3 py-1 rounded-xl shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
            >
              ✕ All Categories
            </button>
          </div>

          <div className="sticky top-[57px] z-30 bg-white/95 backdrop-blur-md py-2 flex items-center justify-between gap-2">
            <select className="text-xs font-black bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer shrink-0 shadow-2xs">
              <option value="recent">Latest First</option>
              <option value="rating">Top Rated</option>
            </select>

            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-yellow-400 active:scale-95 shadow-2xs shrink-0"
            >
              <Plus className={`w-4 h-4 text-slate-955 transition-transform duration-250 ${isFormOpen ? "rotate-45" : ""}`} />
              <span>Post Trade</span>
            </button>
          </div>

          {/* Loading Feed skeleton */}
          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
                  <div className="w-24 h-4 bg-slate-200 rounded-full" />
                  <div className="w-full h-10 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200/60 rounded-2xl text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/80 text-slate-400">
                <Wrench className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm text-slate-800">No Technicians Found</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  No registered technicians in <span className="font-bold text-slate-800">{selectedCategory}</span> for {area} yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <div key={service.id} id={`post-${service.id}`} className="transition-all duration-500">
                  <ServiceCard post={service} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
