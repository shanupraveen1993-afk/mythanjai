import type { Metadata, Viewport } from "next";
import { Red_Hat_Display, Red_Hat_Text, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { LanguageProvider } from "@/context/LanguageContext";

const redHatText = Red_Hat_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-tamil",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Namma Thanjai - Thanjavur's Local Directory",
  description: "Browse requirements, verified services, shop directory, and recent offers in Thanjavur (Tanjore), Tamil Nadu.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Namma Thanjai",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${redHatText.variable} ${redHatDisplay.variable} ${notoSansTamil.variable} h-full bg-[#fff8eb]`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  var TARGET_VERSION = 'v71.0_clean_project';
                  var currentVer = localStorage.getItem('namma_thanjai_cache_version');
                  if (currentVer !== TARGET_VERSION) {
                    localStorage.setItem('namma_thanjai_cache_version', TARGET_VERSION);
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for (var i = 0; i < registrations.length; i++) {
                          registrations[i].unregister();
                        }
                      });
                    }
                    if ('caches' in window) {
                      caches.keys().then(function(names) {
                        for (var j = 0; j < names.length; j++) {
                          caches.delete(names[j]);
                        }
                      });
                    }
                    setTimeout(function() {
                      window.location.reload(true);
                    }, 200);
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className="h-full bg-[#fff8eb] font-sans antialiased text-slate-900 flex flex-col min-h-screen overflow-x-hidden">
        <ToastProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
