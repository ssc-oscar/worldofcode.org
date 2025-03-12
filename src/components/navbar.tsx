import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { usePathname } from '@/hooks/use-pathname';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config';
import React, { useEffect, useContext } from 'react';
import { useWindowSize } from 'react-use';
import useSWR from 'swr';
import { getUser } from '@/api/auth';
import { UserContext } from '@/providers/user-provider';

import TooltipContainer from './tooltip-container';
import Icon from './icon';
import { AxiosError } from 'axios';

const stripEndSlash = (str: string) => str.replace(/\/$/, '');

function UserAvatar() {
  const path = usePathname();
  const getUserIgnore401 = async () => {
    try {
      return await getUser();
    } catch (error) {
      if (error instanceof AxiosError && error.response.status == 401) {
        // This is normal
        return null;
      } else {
        throw error;
      }
    }
  };
  const {
    data: userData,
    error,
    isLoading
  } = useSWR('/api/auth/user', getUserIgnore401, {
    suspense: true,
    keepPreviousData: true
  });
  const { user, isAuthenticated, setUser } = useContext(UserContext);
  useEffect(() => {
    setUser(userData);
  }, [userData]);

  if (user?.name) {
    if (stripEndSlash(path) !== '/dashboard')
      return (
        <a href="/dashboard" className="flex items-center gap-2">
          <div className="hover:transform-rotate-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-200 transition-transform ease-in-out dark:bg-red-500">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </a>
      );
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition-transform ease-in-out dark:bg-gray-400">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <a href="/auth/signin" className="flex items-center gap-2">
      <div className="hover:transform-rotate-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition-transform ease-in-out">
        <span className="i-line-md:login size-4 text-sm font-semibold text-gray-800 dark:text-gray-200"></span>
      </div>
    </a>
  );
}

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
            {items.map((item) => {
              const isActive = stripEndSlash(path) === stripEndSlash(item.href);
              return (
                <TooltipContainer tooltip={item.description} key={item.title}>
                  {isActive ? (
                    <div
                      className={cn(
                        'pointer-events-none inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md p-2 text-sm font-medium opacity-50 transition-colors hover:ease-in-out [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                        'text-muted-foreground cursor-default'
                      )}
                    >
                      {item.icon && (
                        <div className={cn('size-4.25', item.icon)} />
                      )}
                      {width < 768 ? '' : item.title}
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      className={cn(
                        'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md p-2 text-sm font-medium transition-colors hover:ease-in-out focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                        'text-black dark:text-white'
                      )}
                    >
                      {item.icon && (
                        <div className={cn('size-4.25', item.icon)} />
                      )}
                      {width < 768 ? '' : item.title}
                    </a>
                  )}
                </TooltipContainer>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <TooltipContainer tooltip="Follow us on Twitter!">
              <a
                className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-0 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                href="https://x.com/worldofcode_ssc"
                target="_blank"
              >
                <div className="i-simple-icons:x size-4" />
              </a>
            </TooltipContainer>
            <TooltipContainer tooltip="GitHub Organization">
              <a
                className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-0 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                href="https://github.com/woc-hack/tutorial"
                target="_blank"
              >
                <div className="i-simple-icons:github size-4" />
              </a>
            </TooltipContainer>
            <TooltipContainer tooltip="User Settings">
              <UserAvatar />
            </TooltipContainer>
          </div>
        </div>
      </div>
    </nav>
  );
}
