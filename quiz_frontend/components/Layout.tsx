import { Navigation } from './Navigation';
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-surface flex flex-col text-brand">
      <Navigation />
      <main className="w-full flex-1 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

