import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getAllPosts } from '@/lib/blog/posts';
import { siteConfig } from '@/lib/config/site';

export const metadata = {
  title: 'Blog',
  description: 'Insights on AI study workflows, product updates, and learning science from the QuizHub team.',
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <Layout>
      <section className="py-10">
        <div className="mb-10 text-center space-y-4">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.25em]">Insights</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">QuizHub Blog</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Product thinking, learning science, and practical strategies for building AI-powered study experiences.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Card key={post.slug} className="p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <span>{new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span aria-hidden="true">•</span>
                <span>{post.readingTime}</span>
              </div>
              <Link href={`/blog/${post.slug}`} className="group inline-block">
                <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="text-gray-600 mt-4 mb-6">
                {post.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <Button variant="primary">
                  Read article
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
}

