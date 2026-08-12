"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TopHeader from "@/components/layout/TopHeader";
import BottomTabBar, { AppTab } from "@/components/layout/BottomTabBar";
import { TanjoreLocality } from "@/lib/constants";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import SignInModal from "@/components/auth/SignInModal";
import UniversalSearchBar from "@/components/layout/UniversalSearchBar";

import Footer from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthProvider>
  );
}

function SearchParamSync({
  onAreaSync,
  onAuthSync,
}: {
  onAreaSync: (area: TanjoreLocality | "All Areas") => void;
  onAuthSync: (isOpen: boolean) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const areaParam = searchParams.get("area");
    if (areaParam) {
      onAreaSync(areaParam as TanjoreLocality | "All Areas");
    } else {
      onAreaSync("All Areas");
    }

    if (searchParams.get("auth") === "popup") {
      onAuthSync(true);
    } else {
      onAuthSync(false);
    }
  }, [searchParams, onAreaSync, onAuthSync]);

  return null;
}

function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();

  // Selected Area filter state, synced with URL query params
  const [selectedArea, setSelectedArea] = useState<TanjoreLocality | "All Areas">("All Areas");
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const handleCloseSignIn = () => {
    setIsSignInOpen(false);
    const currentParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (currentParams.has("auth")) {
      currentParams.delete("auth");
      
      const redirectPath = currentParams.get("redirect");
      if (redirectPath) {
        currentParams.delete("redirect");
        router.push(redirectPath);
      } else {
        const queryString = currentParams.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
      }
    }
  };

  // Determine current active tab based on pathname
  const getActiveTab = (): AppTab => {
    if (pathname.includes("/sell") || pathname.includes("/post/sell")) return "sell";
    if (pathname.includes("/need") || pathname.includes("/post/need")) return "need";
    if (pathname.includes("/services") || pathname.includes("/post/service")) return "services";
    if (pathname.includes("/shops") || pathname.includes("/post/offer")) return "shops";
    if (pathname.includes("/profile")) return "profile";
    return "home";
  };

  const handleTabChange = (tab: AppTab) => {
    const currentParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const area = currentParams.get("area");
    
    let targetPath = "/";
    if (tab === "sell") targetPath = "/sell";
    else if (tab === "need") targetPath = "/need";
    else if (tab === "services") targetPath = "/services";
    else if (tab === "shops") targetPath = "/shops";
    else if (tab === "profile") targetPath = "/profile";

    // Maintain selected locality across tabs
    if (area) {
      router.push(`${targetPath}?area=${encodeURIComponent(area)}`);
    } else {
      router.push(targetPath);
    }
  };

  const handleAreaChange = (area: TanjoreLocality | "All Areas") => {
    setSelectedArea(area);
    const currentParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (area === "All Areas") {
      currentParams.delete("area");
    } else {
      currentParams.set("area", area);
    }
    // Push updated query parameters
    const queryString = currentParams.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
  };

  const isGuestLanding = pathname === "/" && !profile?.isVerified;
  const isChatRoute = pathname === "/chat";

  let layoutClasses = "min-h-screen";
  if (isChatRoute) {
    layoutClasses = "h-dvh max-h-dvh overflow-hidden";
  } else if (isGuestLanding) {
    layoutClasses = "h-dvh max-h-dvh overflow-hidden md:h-auto md:max-h-none md:overflow-visible md:min-h-screen";
  }

  const isStandaloneView = isGuestLanding || isChatRoute;

  return (
    <div className={`w-full flex flex-col relative bg-[#f4f5f8] font-sans ${layoutClasses}`}>
      <React.Suspense fallback={null}>
        <SearchParamSync onAreaSync={setSelectedArea} onAuthSync={setIsSignInOpen} />
      </React.Suspense>

      {/* Top Header Section (Hidden for guest onboarding landing & dedicated /chat view) */}
      {!isStandaloneView && (
        <div className="block">
          <React.Suspense fallback={null}>
            <TopHeader
              selectedArea={selectedArea}
              onAreaChange={handleAreaChange}
              onSignInClick={() => setIsSignInOpen(true)}
              onPostClick={() => {
                router.push("/post/sell");
              }}
              activeTab={getActiveTab()}
              onTabChange={handleTabChange}
            />
          </React.Suspense>
        </div>
      )}

      {/* Universal Directory Search Bar (Hidden on Home, Profile, & Chat pages) */}
      {profile?.isVerified && pathname !== "/" && pathname !== "/profile" && !isChatRoute && (
        <React.Suspense fallback={null}>
          <UniversalSearchBar />
        </React.Suspense>
      )}

      {/* Main Content Panel (0 Padding for Guest Onboarding View & Full-Screen Chat) */}
      <main className={`flex-1 w-full bg-[#f4f5f8] ${isStandaloneView ? "p-0 max-w-none m-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-14 pb-24 md:pb-8"}`}>
        {children}
      </main>

      {/* Bottom Navigation Bar (Hidden for guest onboarding landing & dedicated /chat view) */}
      {!isStandaloneView && (
        <BottomTabBar
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
        />
      )}

      {/* Main Website Footer */}
      {!isChatRoute && (
        <React.Suspense fallback={null}>
          <div className="hidden md:block">
            <Footer />
          </div>
        </React.Suspense>
      )}

      {/* Sign-In Popup Modal */}
      <React.Suspense fallback={null}>
        <SignInModal
          isOpen={isSignInOpen}
          onClose={handleCloseSignIn}
        />
      </React.Suspense>

    </div>
  );
}
