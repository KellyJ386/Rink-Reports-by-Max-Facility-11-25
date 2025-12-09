import type { Metadata } from "next";
import "./globals.css";
import PWARegistration from "@/components/PWARegistration";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Rink Reports by Max Facility",
  description: "Ice Rink Management Platform",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MFO Rinks",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PWARegistration />
        <OfflineIndicator />
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
