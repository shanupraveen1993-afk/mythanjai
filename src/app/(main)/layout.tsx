"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TopHeader from "@/components/layout/TopHeader";
import BottomTabBar, { AppTab } from "@/components/layout/BottomTabBar";
import { TanjoreLocality } from "@/lib/constants";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import SignInModal from "@/components/auth/SignInModal";

import UniversalSearchBar from "@/components/layout/UniversalSearchBar";

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

function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  // Selected Area filter state, synced with URL query params
  const [selectedArea, setSelectedArea] = useState<TanjoreLocality | "All Areas">("All Areas");
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Sync state from query params on load/update
  useEffect(() => {
    const areaParam = searchParams.get("area");
    if (areaParam) {
      setSelectedArea(areaParam as TanjoreLocality | "All Areas");
    } else {
      setSelectedArea("All Areas");
    }
  }, [searchParams]);

  // Sync auth popup state from URL parameters
  useEffect(() => {
    if (searchParams.get("auth") === "popup") {
      setIsSignInOpen(true);
    }
  }, [searchParams]);

  // Smooth Auth Trigger: open sign in modal without route flicker
  useEffect(() => {
    const isAuthVerified = Boolean(profile?.isVerified);

    if (!isAuthVerified && pathname !== "/") {
      setIsSignInOpen(true);
    }
  }, [pathname, profile]);

  const handleCloseSignIn = () => {
    setIsSignInOpen(false);
    const currentParams = new URLSearchParams(searchParams.toString());
    if (currentParams.has("auth")) {
      currentParams.delete("auth");
      
      const redirectPath = currentParams.get("redirect");
      if (redirectPath) {
        currentParams.delete("redirect");
        router.push(redirectPath);
      } else {
        // Auto-trigger form opening on successful sign-in if not on homepage
        if (profile?.isVerified && pathname !== "/") {
          currentParams.set("create", "true");
        }
        const queryString = currentParams.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
      }
    }
  };

  // Determine current active tab based on pathname
  const getActiveTab = (): AppTab => {
    if (pathname.includes("/classifieds")) return "classifieds";
    if (pathname.includes("/services")) return "services";
    if (pathname.includes("/shops")) return "shops";
    if (pathname.includes("/offers")) return "shops";
    if (pathname.includes("/profile")) return "profile";
    return "home";
  };

  const handleTabChange = (tab: AppTab) => {
    const isAuthVerified = Boolean(profile?.isVerified);

    if (tab !== "home" && !isAuthVerified) {
      setIsSignInOpen(true);
      return;
    }

    const currentParams = new URLSearchParams(searchParams.toString());
    const area = currentParams.get("area");
    
    let targetPath = "/";
    if (tab === "classifieds") targetPath = "/classifieds";
    else if (tab === "services") targetPath = "/services";
    else if (tab === "shops") targetPath = "/shops";
    else if (tab === "offers") targetPath = "/shops";
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
    const currentParams = new URLSearchParams(searchParams.toString());
    if (area === "All Areas") {
      currentParams.delete("area");
    } else {
      currentParams.set("area", area);
    }
    // Push updated query parameters
    const queryString = currentParams.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-white font-sans">
      {/* Top Header Section */}
      <TopHeader
        selectedArea={selectedArea}
        onAreaChange={handleAreaChange}
        onSignInClick={() => setIsSignInOpen(true)}
        onPostClick={() => {
          const currentTab = getActiveTab();
          let targetPath = "/classifieds";
          if (currentTab === "services") targetPath = "/services";
          else if (currentTab === "shops") targetPath = "/shops";
          else if (currentTab === "offers") targetPath = "/shops";

          const currentParams = new URLSearchParams(searchParams.toString());

          if (!profile?.isVerified) {
            setIsSignInOpen(true);
          } else {
            currentParams.set("create", "true");
            router.push(`${targetPath}?${currentParams.toString()}`);
          }
        }}
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
      />

      {/* Universal Directory Search Bar (Hidden on Profile page) */}
      {profile?.isVerified && pathname !== "/profile" && <UniversalSearchBar />}

      {/* Main Content Panel with Container Margins */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white pb-20 md:pb-8">
        {children}
      </main>

      {/* Bottom Navigation Bar (Rendered ONLY when logged in) */}
      {profile?.isVerified && (
        <BottomTabBar
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
        />
      )}

      {/* Sign-In Popup Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={handleCloseSignIn}
      />
    </div>
  );
}
