import { siteConfig } from '@/lib/config/site';

/**
 * Structured Data (JSON-LD) component for SEO
 * Provides organization information to search engines
 */
export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.contact.address.city,
      addressCountry: siteConfig.contact.address.country,
      ...(siteConfig.contact.address.street && {
        streetAddress: siteConfig.contact.address.street,
      }),
      ...(siteConfig.contact.address.postalCode && {
        postalCode: siteConfig.contact.address.postalCode,
      }),
    },
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

