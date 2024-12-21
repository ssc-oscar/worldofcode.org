import Logo from '@/components/shared/logo';
import { Button } from '@/components/ui/button';

export default function NavBar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white shadow-sm dark:bg-gray-950/90">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <a href="#" className="flex items-center">
            <Logo className="h-8" />
            <span className="sr-only">WoC</span>
          </a>
          <nav className="hidden gap-4 md:flex">
            <a
              href="/blog"
              className="flex items-center text-sm font-medium transition-colors hover:underline"
            >
              Blog
            </a>
            <a
              href="/lookup"
              className="flex items-center text-sm font-medium transition-colors hover:underline"
            >
              Lookup
            </a>
            <a
              href="/sample"
              className="flex items-center text-sm font-medium transition-colors hover:underline"
            >
              Sample
            </a>
            <a
              href="/explore"
              className="flex items-center text-sm font-medium transition-colors hover:underline"
            >
              Explore
            </a>
            <a
              href="/devdash"
              className="flex items-center text-sm font-medium transition-colors hover:underline"
            >
              DevDash
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="#/login">
              <Button size="sm">Login</Button>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
