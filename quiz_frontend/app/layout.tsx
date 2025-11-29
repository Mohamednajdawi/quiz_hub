import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { StructuredData } from "@/components/StructuredData";
import { siteConfig } from "@/lib/config/site";

// Using system fonts for BMB compliance (Google Fonts forbidden per Clause 16)
// System fonts ensure no external connections and full EU/EEA compliance

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.seo.keywords],
  authors: [{ name: siteConfig.seo.author }],
  creator: siteConfig.seo.author,
  publisher: siteConfig.name,
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  
  // Open Graph / Facebook
  openGraph: {
    type: siteConfig.seo.type,
    locale: siteConfig.seo.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  
  // Additional metadata
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
  
  // Contact information
  other: {
    "contact:email": siteConfig.contact.email,
    "contact:phone": siteConfig.contact.phone,
    "contact:address": siteConfig.contact.address.full,
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StructuredData />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
