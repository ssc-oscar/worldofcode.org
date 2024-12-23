import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { usePathname } from '@/hooks/use-pathname';
import { cn } from '@/lib/utils';
import { NavItem } from '@/types';
import type { Dispatch, SetStateAction } from 'react';
import { Icons } from './icons';
import { GitHubLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons';

interface NavProps {
  items: NavItem[];
  setOpen?: Dispatch<SetStateAction<boolean>>;
  isMobileNav?: boolean;
}

export default function NavBar({ items, isMobileNav = false }: NavProps) {
  const path = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-gray-950/90">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <a href="/" className="flex items-center">
            <Logo className="h-8" />
            <span className="sr-only">WoC</span>
          </a>
          <nav className="hidden gap-4 md:flex">
            {items.map((item, index) => {
              const isActive = item.href === path;
              // const Icon = Icons[item.icon || 'arrowRight'];
              return (
                <a
                  key={index}
                  href={item.href}
                  className={cn(
                    'inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground hover:ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                    isActive
                      ? 'cursor-default text-muted-foreground'
                      : 'text-black dark:text-white'
                  )}
                >
                  {isMobileNav ? '' : item.title}
                </a>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <a
              className="inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-0 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              href="https://x.com/worldofcode_ssc"
              target="_blank"
            >
              <TwitterLogoIcon className="size-4" />
            </a>
            <a
              className="inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-0 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              href="https://github.com/woc-hack/tutorial"
              target="_blank"
            >
              <GitHubLogoIcon className="size-4" />
            </a>
            <a href="/auth/signin" className="ml-2">
              <Button size="sm" className="h-8">
                Login
              </Button>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
