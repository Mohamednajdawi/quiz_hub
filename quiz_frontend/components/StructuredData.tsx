import { siteConfig } from '@/lib/config/site';

/**
 * Structured Data (JSON-LD) component for SEO
 * Provides organization information to search engines
 */
export function StructuredData() {
  // Build address object conditionally to avoid readonly type issues
  const address: Record<string, string> = {
    "@type": "PostalAddress",
    addressLocality: siteConfig.contact.address.city,
    addressCountry: siteConfig.contact.address.country,
  };
  
  if (siteConfig.contact.address.street) {
    address.streetAddress = siteConfig.contact.address.street;
  }
  
  if (siteConfig.contact.address.postalCode) {
    address.postalCode = siteConfig.contact.address.postalCode;
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address,
    founder: {
      "@type": "Person",
      name: siteConfig.contact.name,
      email: siteConfig.contact.email,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationSchema),
      }}
    />
  );
}

