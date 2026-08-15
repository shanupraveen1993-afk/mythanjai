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

import SplashScreen from "@/components/ui/SplashScreen";
import SwipeUpOnboarding from "@/components/ui/SwipeUpOnboarding";

import { useNativeApp } from "@/hooks/use-native-app";
import FloatingPostButton from "@/components/layout/FloatingPostButton";

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
  const { user, profile, loading: authLoading } = useAuth();
  
  // Attach native Android event listeners (Back button, Keyboard, Status Bar)
  useNativeApp();

  // Authentication Guard: Unauthenticated users are routed to Onboarding Robo Page
  useEffect(() => {
    if (!authLoading && !user && pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [user, authLoading, pathname, router]);

  // Selected Area filter state, synced with URL query params
  const [selectedArea, setSelectedArea] = useState<TanjoreLocality | "All Areas">("All Areas");
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Startup Flow State: Splash -> Walkthrough -> Robot Hero Onboarding -> Main Feed
  const [showSplash, setShowSplash] = useState(true);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    // Dismiss native Capacitor Splash Screen on Android/iOS when React app mounts
    import("@capacitor/splash-screen")
      .then(({ SplashScreen }) => {
        SplashScreen.hide().catch(() => {});
      })
      .catch(() => {});
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (typeof window !== "undefined") {
      const hasSeenWalkthrough = localStorage.getItem("namma_thanjai_has_seen_walkthrough_v3");
      if (!hasSeenWalkthrough) {
        setShowWalkthrough(true);
      }
    }
  };

  const handleWalkthroughComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_has_seen_walkthrough_v3", "true");
    }
    setShowWalkthrough(false);
    router.push("/onboarding");
  };

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

  const isChatRoute = pathname === "/chat";
  const isStandaloneView = isChatRoute;

  return (
    <div className="w-full h-dvh max-h-dvh overflow-hidden flex flex-col relative bg-[#f4f5f8] font-sans">
      {/* 1. Animated Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* 2. Interactive 3-Slide Walkthrough Overlay */}
      {showWalkthrough && (
        <SwipeUpOnboarding onComplete={handleWalkthroughComplete} />
      )}

      <React.Suspense fallback={null}>
        <SearchParamSync onAreaSync={setSelectedArea} onAuthSync={setIsSignInOpen} />
      </React.Suspense>

      {/* Top Header Section — Always visible except full-screen chat */}
      {!isStandaloneView && (
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
      )}

      {/* Universal Directory Search Bar (Hidden on Home, Profile, & Chat pages) */}
      {pathname !== "/" && pathname !== "/profile" && !isChatRoute && (
        <React.Suspense fallback={null}>
          <UniversalSearchBar />
        </React.Suspense>
      )}

      {/* Main Content Panel — Independent Scroll Viewport Box */}
      <main 
        className={`flex-1 w-full overflow-y-auto overscroll-contain bg-[#f4f5f8] ${
          isStandaloneView ? "p-0 max-w-none m-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-8"
        }`}
        style={!isStandaloneView ? {
          paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
        } : undefined}
      >
        {children}

        {/* Main Website Footer (Desktop View inside scroll container) */}
        {!isChatRoute && (
          <React.Suspense fallback={null}>
            <div className="hidden md:block mt-8">
              <Footer />
            </div>
          </React.Suspense>
        )}
      </main>

      {/* Scroll-driven Floating Post Button on Mobile */}
      <FloatingPostButton />

      {/* Bottom Navigation Bar — Fixed at thumb position */}
      {!isStandaloneView && (
        <BottomTabBar
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
        />
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

