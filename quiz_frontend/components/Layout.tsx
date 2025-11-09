import { Navigation } from './Navigation';
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

