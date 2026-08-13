import type { Metadata, Viewport } from "next";
import { Inter, Red_Hat_Display } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Namma Thanjai - Thanjavur's Local Directory",
  description: "Browse requirements, verified services, shop directory, and recent offers in Thanjavur (Tanjore), Tamil Nadu.",
  manifest: "/manifest.json",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${redHatDisplay.variable} h-full bg-[#f4f5f8]`}>
      <body className="h-full bg-[#f4f5f8] font-sans antialiased text-slate-900 flex flex-col min-h-screen overflow-x-hidden">
        <ToastProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
