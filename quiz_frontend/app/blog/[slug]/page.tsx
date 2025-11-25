import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts';
import { siteConfig } from '@/lib/config/site';

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = true;

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return {};
  }

  const baseUrl = siteConfig.url.replace(/\/$/, '');
  const url = `${baseUrl}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.metadata?.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      url,
      authors: [post.author],
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <Layout>
      <article className="py-10">
        <header className="mb-12">
          {post.heroEyebrow && (
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.25em] mb-4">
              {post.heroEyebrow}
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">{post.title}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mb-6">{post.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>By {post.author}</span>
            <span aria-hidden="true">•</span>
            <span>{new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span aria-hidden="true">•</span>
            <span>{post.readingTime}</span>
          </div>
        </header>

        <div className="space-y-10 prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
          {post.sections.map((section, index) => (
            <section key={`${section.heading ?? 'intro'}-${index}`}>
              {section.heading && <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>}
              {section.paragraphs?.map((paragraph, idx) => (
                <p key={idx} className="text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {post.conclusion && (
          <section className="mt-12">
            <p className="text-xl text-gray-800 font-medium">{post.conclusion}</p>
          </section>
        )}

        {post.cta && (
          <section className="mt-16 border border-gray-200 rounded-2xl p-8 bg-gradient-to-br from-white to-indigo-50">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">{post.cta.title}</h3>
            <p className="text-gray-600 mb-6">{post.cta.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={post.cta.primaryHref}>
                <Button variant="primary">{post.cta.primaryLabel}</Button>
              </Link>
              {post.cta.secondaryLabel && post.cta.secondaryHref && (
                <Link href={post.cta.secondaryHref}>
                  <Button variant="outline">{post.cta.secondaryLabel}</Button>
                </Link>
              )}
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
}

