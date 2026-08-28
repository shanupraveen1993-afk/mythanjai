"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import TopHeader from "@/components/layout/TopHeader";
import TopAppShell from "@/components/layout/TopAppShell";
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
import PendingFeedbackPrompt from "@/components/modals/PendingFeedbackPrompt";
import NativePermissionsModal from "@/components/native/NativePermissionsModal";
import NotificationDrawer from "@/components/modals/NotificationDrawer";
import TamilSloganBanner from "@/components/layout/TamilSloganBanner";
import HomeCategorySegmentBar from "@/components/layout/HomeCategorySegmentBar";

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
  const pathname = usePathname() || "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
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
    }
  }, [pathname, onAreaSync, onAuthSync]);

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
  const pathname = usePathname() || "";
  const { user, profile, loading: authLoading } = useAuth();
  const isAuthVerified = Boolean(profile?.isVerified);
  
  // Attach native Android event listeners (Back button, Keyboard, Status Bar)
  useNativeApp();

  // Selected Area filter state, synced with URL query params
  const [selectedArea, setSelectedArea] = useState<TanjoreLocality | "All Areas">("All Areas");
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Startup Flow State: Native Splash (APK Only) -> Walkthrough -> Permissions -> Home
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const isNative = Boolean((window as any).Capacitor?.isNativePlatform() || window.navigator.userAgent.includes("Capacitor"));
      const hasCompletedOnboarding = Boolean(localStorage.getItem("namma_thanjai_onboarding_completed_v4"));

      if (isNative) {
        import("@capacitor/splash-screen")
          .then(({ SplashScreen: CapSplash }) => {
            CapSplash.hide().catch(() => {});
          })
          .catch(() => {});

        if (!hasCompletedOnboarding) {
          setShowWalkthrough(true);
        }
      }
    }
  }, []);

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false);
    setShowPermissionsModal(true);
  };

  const handlePermissionsComplete = () => {
    setShowPermissionsModal(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("namma_thanjai_onboarding_completed_v4", "true");
    }
    if (!user || !isAuthVerified) {
      setIsSignInOpen(true);
    }
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

  useEffect(() => {
    const handleOpenSignIn = () => setIsSignInOpen(true);
    window.addEventListener("namma_thanjai_open_signin", handleOpenSignIn);
    return () => window.removeEventListener("namma_thanjai_open_signin", handleOpenSignIn);
  }, []);

  // Automatic clean purge of legacy development test posts from browser storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isClean = localStorage.getItem("namma_thanjai_clean_v2");
      if (!isClean) {
        localStorage.removeItem("namma_thanjai_local_posts");
        localStorage.removeItem("namma_thanjai_saved_posts");
        localStorage.removeItem("my_thanjai_saved_posts");
        localStorage.setItem("namma_thanjai_clean_v2", "true");
      }
    }
  }, []);

  // Synchronous scroll-to-top BEFORE browser paint on route change
  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [pathname]);

  const isLandingMode = pathname === "/" || pathname === "/onboarding";
  const isChatRoute = pathname === "/chat";
  const isPostRoute = pathname.startsWith("/post");
  const isFeedPage = pathname === "/" || pathname === "/home" || pathname.includes("/sell") || pathname.includes("/need") || pathname.includes("/services") || pathname.includes("/shops") || pathname.includes("/offers") || pathname.includes("/classifieds");
  const isStandaloneView = false;
  const isOnboardingView = false;
  const isFullWidthPage = isLandingMode;
  if (showSplash) {
    return (
      <div className="w-full min-h-screen bg-[#0f172a]">
        <SplashScreen
          onComplete={() => {
            setShowSplash(false);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("namma_thanjai_splash_shown_v1", "true");
            }
          }}
        />
      </div>
    );
  }

  if (showWalkthrough) {
    return (
      <div className="w-full min-h-screen bg-white">
        <SwipeUpOnboarding onComplete={handleWalkthroughComplete} />
      </div>
    );
  }

  if (showPermissionsModal) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <NativePermissionsModal isOpen={true} onComplete={handlePermissionsComplete} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col relative bg-[#f1f5f9] font-sans">
      <React.Suspense fallback={null}>
        <SearchParamSync onAreaSync={setSelectedArea} onAuthSync={setIsSignInOpen} />
      </React.Suspense>

      {/* Unified Top App Shell — TopHeader + CategoryBar (Feed pages only) move as ONE UNIT */}
      {!isOnboardingView && !isChatRoute && !isPostRoute && (
        <TopAppShell>
          <React.Suspense fallback={null}>
            <TopHeader
              selectedArea={selectedArea}
              onAreaChange={handleAreaChange}
              onSignInClick={() => setIsSignInOpen(true)}
              onPostClick={() => {
                if (!isAuthVerified) {
                  setIsSignInOpen(true);
                } else {
                  if (typeof window !== "undefined") window.scrollTo(0, 0);
                  router.push("/post/sell");
                }
              }}
              activeTab={getActiveTab()}
              onTabChange={(tab) => {
                if (typeof window !== "undefined") window.scrollTo(0, 0);
                handleTabChange(tab);
              }}
            />
            {isFeedPage && (
              <>
                <HomeCategorySegmentBar />
                <TamilSloganBanner />
              </>
            )}
          </React.Suspense>
        </TopAppShell>
      )}

      {/* Main Content Panel — compensated with exact top shell height + safe area */}
      <main
        className={`flex-1 w-full flex flex-col p-0 m-0 bg-[#f8fafc] ${isChatRoute ? "h-screen overflow-hidden pb-0" : "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8"}`}
        style={{
          paddingTop: !isOnboardingView && !isChatRoute && !isPostRoute
            ? isFeedPage
              ? "calc(8.75rem + env(safe-area-inset-top, 0px))"
              : "calc(3.5rem + env(safe-area-inset-top, 0px))"
            : undefined,
        }}
      >

        {/* Stable height wrapper — prevents page collapse and footer jump on route transitions */}
        <div className="w-full flex-1 flex flex-col min-h-0">
          {children}
        </div>

        {/* Footer — desktop only */}
        {!isChatRoute && !isOnboardingView && !isPostRoute && (
          <React.Suspense fallback={null}>
            <div className="hidden md:block mt-auto pt-8">
              <Footer />
            </div>
          </React.Suspense>
        )}
      </main>

      {/* Bottom Navigation Bar & Original Standalone Floating Post Button */}
      {!isOnboardingView && !isSignInOpen && !isChatRoute && (
        <>
          <BottomTabBar
            activeTab={getActiveTab()}
            onTabChange={handleTabChange}
          />
          <FloatingPostButton />
        </>
      )}

      {/* Persistent Opinion Feedback Manager & Native Permissions Modal */}
      <NativePermissionsModal isOpen={showPermissionsModal} onComplete={handlePermissionsComplete} />
      <PendingFeedbackPrompt />
      <NotificationDrawer />

      {/* Sign-In Modal */}
      <React.Suspense fallback={null}>
        <SignInModal
          isOpen={isSignInOpen}
          onClose={handleCloseSignIn}
        />
      </React.Suspense>


    </div>
  );
}

