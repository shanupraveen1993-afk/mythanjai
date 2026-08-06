"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TopHeader from "@/components/layout/TopHeader";
import BottomTabBar, { AppTab } from "@/components/layout/BottomTabBar";
import { TanjoreLocality } from "@/lib/constants";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import SignInModal from "@/components/auth/SignInModal";

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

  const isLandingPage = pathname === "/";

  return (
    <>
      {isLandingPage ? (
        <div className="w-full min-h-screen bg-slate-50 relative">
          <main className="w-full">
            {children}
          </main>
          {/* Sign-In Popup Modal */}
          <SignInModal
            isOpen={isSignInOpen}
            onClose={handleCloseSignIn}
          />
        </div>
      ) : (
        <div className="flex flex-col h-screen w-full relative bg-white">
          {/* Top Header Section (Hidden on mobile for home onboarding page) */}
          <div className={pathname === "/" ? "hidden md:block" : ""}>
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
                  currentParams.set("auth", "popup");
                  currentParams.set("redirect", `${targetPath}?create=true`);
                  router.push(`${targetPath}?${currentParams.toString()}`);
                } else {
                  currentParams.set("create", "true");
                  router.push(`${targetPath}?${currentParams.toString()}`);
                }
              }}
              activeTab={getActiveTab()}
              onTabChange={handleTabChange}
            />
          </div>

          {/* Main Scrollable Content Panel */}
          <main className="flex-1 overflow-y-auto no-scrollbar">
            <div className={pathname === "/" ? "w-full" : "w-full max-w-5xl mx-auto px-4 py-4 md:py-8 pb-24 md:pb-8"}>
              {children}
            </div>
          </main>

          {/* Bottom Fixed Navigation Bar */}
          <BottomTabBar
            activeTab={getActiveTab()}
            onTabChange={handleTabChange}
          />

          {/* Sign-In Popup Modal */}
          <SignInModal
            isOpen={isSignInOpen}
            onClose={handleCloseSignIn}
          />
        </div>
      )}
    </>
  );
}
