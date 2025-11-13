/**
 * Site-wide configuration and metadata
 * Centralized location for all site information, contact details, and metadata
 */

export const siteConfig = {
  // Basic Site Information
  name: "Quiz Hub",
  title: "Quiz Hub - AI-Powered Learning Platform",
  description: "Generate quizzes, flashcards, and essay questions from URLs and PDFs using AI. Perfect for students and educators.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://quizhub.com",
  
  // Contact Information
  contact: {
    name: "Mohammad Alnajdawi",
    email: "najdawimohamed@gmail.com",
    phone: "+43681843116564",
    address: {
      street: "", // Add street address if available
      city: "Linz",
      country: "Austria",
      postalCode: "", // Add postal code if available
      full: "Linz, Austria",
    },
  },

  // Social Media (add when available)
  social: {
    twitter: "", // Add Twitter handle if available
    linkedin: "", // Add LinkedIn URL if available
    github: "", // Add GitHub URL if available
  },

  // Legal Information (for Austrian Impressum requirements)
  legal: {
    companyName: "Quiz Hub",
    responsiblePerson: "Mohammad Alnajdawi",
    vatNumber: "", // Add VAT/UID number if available
    companyRegister: "", // Add company register number if available
  },

  // SEO Metadata
  seo: {
    keywords: [
      "quiz generator",
      "AI quiz maker",
      "flashcard generator",
      "essay questions",
      "learning platform",
      "education technology",
      "study tools",
      "PDF quiz generator",
      "URL quiz generator",
    ],
    author: "Mohammad Alnajdawi",
    locale: "en_US",
    type: "website",
  },
} as const;

// Helper function to format phone number for display
export function formatPhoneNumber(phone: string): string {
  // Format: +43 681 843116564
  if (phone.startsWith("+43")) {
    const cleaned = phone.replace("+43", "").trim();
    if (cleaned.length >= 10) {
      return `+43 ${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
  }
  return phone;
}

// Helper function to get full address string
export function getFullAddress(): string {
  const { address, contact } = siteConfig;
  if (address.street && address.postalCode) {
    return `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;
  }
  return `${address.city}, ${address.country}`;
}

