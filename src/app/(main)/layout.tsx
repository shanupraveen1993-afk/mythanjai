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

    const authParam = searchParams.get("auth");
    if (authParam === "popup" || authParam === "signin" || authParam === "register") {
      onAuthSync(true);
    }
  }, [searchParams, onAreaSync, onAuthSync]);

  useEffect(() => {
    const handleCustomOpen = () => onAuthSync(true);
    window.addEventListener("namma_thanjai_open_signin", handleCustomOpen);
    return () => window.removeEventListener("namma_thanjai_open_signin", handleCustomOpen);
  }, [onAuthSync]);

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

  // Selected Area filter state, synced with URL query params
  const [selectedArea, setSelectedArea] = useState<TanjoreLocality | "All Areas">("All Areas");
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Startup Flow State: Splash Screen strictly for Capacitor Native App (disabled on website)
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).Capacitor?.isNativePlatform());
  });
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
    
    let targetPath = "/home";
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
    <div className="w-full min-h-screen max-md:h-dvh max-md:max-h-dvh max-md:overflow-hidden flex flex-col relative bg-[#f4f5f8] font-sans md:h-auto md:max-h-none md:overflow-visible">
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

      {/* Top Header Section — Hidden for unauthenticated onboarding view or standalone view */}
      {(() => {
        const isAuthVerified = Boolean(profile?.isVerified || user);
        const isOnboardingView = !isAuthVerified && (pathname === "/" || pathname === "/onboarding");

        return (
          <>
            {!isStandaloneView && !isOnboardingView && (
              <React.Suspense fallback={null}>
                <TopHeader
                  selectedArea={selectedArea}
                  onAreaChange={handleAreaChange}
                  onSignInClick={() => setIsSignInOpen(true)}
                  onPostClick={() => {
                    if (!isAuthVerified) {
                      setIsSignInOpen(true);
                    } else {
                      router.push("/post/sell");
                    }
                  }}
                  activeTab={getActiveTab()}
                  onTabChange={handleTabChange}
                />
              </React.Suspense>
            )}

            {/* Universal Directory Search Bar (Hidden on Home, Profile, Chat, & Onboarding pages) */}
            {pathname !== "/" && pathname !== "/profile" && pathname !== "/onboarding" && !isChatRoute && !isOnboardingView && (
              <React.Suspense fallback={null}>
                <UniversalSearchBar />
              </React.Suspense>
            )}

            {/* Main Content Panel */}
            <main 
              className={`flex-1 w-full max-md:overflow-y-auto max-md:overscroll-contain md:overflow-visible md:h-auto bg-[#f4f5f8] ${
                isStandaloneView || isOnboardingView ? "p-0 max-w-none m-0 bg-[#0f172a]" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-12"
              }`}
              style={!isStandaloneView && !isOnboardingView ? {
                paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))",
                paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
              } : undefined}
            >
              {children}

              {/* Main Website Footer (Desktop View inside scroll container) */}
              {!isChatRoute && !isOnboardingView && (
                <React.Suspense fallback={null}>
                  <div className="hidden md:block mt-12">
                    <Footer />
                  </div>
                </React.Suspense>
              )}
            </main>

            {/* Scroll-driven Floating Post Button on Mobile */}
            {!isOnboardingView && <FloatingPostButton />}

            {/* Bottom Navigation Bar — Hidden for unauthenticated onboarding view */}
            {!isStandaloneView && !isOnboardingView && (
              <BottomTabBar
                activeTab={getActiveTab()}
                onTabChange={handleTabChange}
              />
            )}
          </>
        );
      })()}

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

