import { Navigation } from './Navigation';
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="w-full flex-1 px-4 sm:px-6 lg:px-10">{children}</main>
      <Footer />
    </div>
  );
}

