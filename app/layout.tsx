import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MFO - Max Facility Operations",
  description: "Ice Rink Management SaaS Platform",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
