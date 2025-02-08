import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { usePathname } from '@/hooks/use-pathname';
import { cn } from '@/lib/utils';
import { NavItem } from '@/types';
import { useEffect } from 'react';
import { useWindowSize } from 'react-use';
import Icon from './icon';

export default function NavBar({ items }: { items: NavItem[] }) {
  const path = usePathname();

  if (!items?.length) {
    return null;
  }

  const { width } = useWindowSize();

  return (
    <nav className="supports-[backdrop-filter]:bg-background/60 fixed inset-x-0 top-0 z-50 bg-white shadow-sm backdrop-blur dark:bg-gray-950/90">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <a href="/" className="flex items-center">
            <Icon
              icon={width < 768 ? '/woc_mini.webp' : '/woc.webp'}
              className="h-7"
            />
            <span className="sr-only">WoC</span>
          </a>
          <nav className="flex gap-2">
            {items.map((item, index) => {
              const stripEndSlash = (str: string) => str.replace(/\/$/, '');
              const isActive = stripEndSlash(path) === stripEndSlash(item.href);
              return (
                <a
                  key={index}
                  href={item.href}
                  className={cn(
                    'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md p-2 text-sm font-medium transition-colors hover:ease-in-out focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                    isActive
                      ? 'text-muted-foreground cursor-default'
                      : 'text-black dark:text-white'
                  )}
                >
                  {item.icon && <div className={cn('size-4.25', item.icon)} />}
                  {width < 768 ? '' : item.title}
                </a>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <a
              className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-0 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              href="https://x.com/worldofcode_ssc"
              target="_blank"
            >
              <div className="i-simple-icons:x size-4" />
            </a>
            <a
              className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-0 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
              href="https://github.com/woc-hack/tutorial"
              target="_blank"
            >
              <div className="i-simple-icons:github size-4" />
            </a>
            <a href="/auth/signin" className="ml-2">
              <Button size="sm" className="h-7">
                Login
              </Button>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
