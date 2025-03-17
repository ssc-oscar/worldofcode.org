import { Button } from '@/components/ui/button';
import { usePathname } from '@/hooks/use-pathname';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config';
import React, { useEffect, useContext } from 'react';
import { useCookie, useWindowSize } from 'react-use';
import useSWR from 'swr';
import { getUser } from '@/api/auth';
import { UserContext } from '@/providers/user-provider';
import { Skeleton } from './ui/skeleton';
import TooltipContainer from './tooltip-container';
import Icon from './icon';
import { AxiosError } from 'axios';
import { useTheme } from '@/providers/theme-provider';
import { Link } from 'react-router-dom';

const stripEndSlash = (str: string) => str.replace(/\/$/, '');

function UserAvatar() {
  const [token, setToken, deleteToken] = useCookie('token');
  const path = usePathname();
  const getUserIgnore401 = async () => {
    try {
      return await getUser();
    } catch (error) {
      if (error instanceof AxiosError && error.response.status == 401) {
        if (token) {
          deleteToken();
        }
        return null;
      } else {
        throw error;
      }
    }
  };
  const { user, isAuthenticated, setUser } = useContext(UserContext);
  const {
    data: userData,
    error,
    isLoading
  } = useSWR(token && `/api/auth/user?token=${token}`, getUserIgnore401, {
    // skip if no token
    suspense: false, // Changed from true to false to prevent blocking
    keepPreviousData: true,
    revalidateOnMount: true,
    revalidateIfStale: false,
    onSuccess: (data) => {
      setUser(data);
    }
  });

  // is loading
  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  // has logged in
  if (user?.name) {
    if (stripEndSlash(path) !== '/dashboard')
      return (
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="hover:transform-rotate-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-200 transition-transform ease-in-out dark:bg-red-500">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </Link>
      );
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition-transform ease-in-out dark:bg-gray-400">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  // not logged in
  return (
    <Link to="/auth/signin" className="flex items-center gap-2">
      <div className="hover:transform-rotate-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 transition-transform ease-in-out">
        <span className="i-line-md:login size-4 text-sm font-semibold text-gray-800"></span>
      </div>
    </Link>
  );
}

export default function NavBar({ items }: { items: NavItem[] }) {
  const path = usePathname();

  if (!items?.length) {
    return null;
  }

  const { theme, setTheme } = useTheme();

  const { width } = useWindowSize();

  return (
    <nav className="supports-[backdrop-filter]:bg-background/60 fixed inset-x-0 top-0 z-50 bg-white shadow-sm backdrop-blur dark:bg-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Icon
              icon={width < 768 ? '/woc_mini.webp' : '/woc.webp'}
              className="h-7 hover:brightness-90 dark:invert"
            />
            <span className="sr-only">WoC</span>
          </Link>
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
                    <Link
                      to={item.href}
                      target={item.external ? '_blank' : undefined}
                      className={cn(
                        'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md p-2 text-sm font-medium transition-colors hover:ease-in-out focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
                        'text-foreground'
                      )}
                    >
                      {item.icon && (
                        <div className={cn('size-4.25', item.icon)} />
                      )}
                      {width < 768 ? '' : item.title}
                    </Link>
                  )}
                </TooltipContainer>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {width >= 480 && (
              <TooltipContainer tooltip="Follow us on Twitter!">
                <a
                  className="hover:bg-accent hover:text-accent-foreground text-foreground focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-0 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  href="https://x.com/worldofcode_ssc"
                  target="_blank"
                >
                  <div className="i-simple-icons:x size-4" />
                </a>
              </TooltipContainer>
            )}
            {width >= 480 && (
              <TooltipContainer tooltip="GitHub Organization">
                <a
                  className="hover:bg-accent hover:text-accent-foreground text-foreground focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-0 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  href="https://github.com/woc-hack/tutorial"
                  target="_blank"
                >
                  <div className="i-simple-icons:github size-4" />
                </a>
              </TooltipContainer>
            )}
            {width >= 480 && (
              <TooltipContainer tooltip="Toggle Theme">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setTheme(
                      theme === 'dark'
                        ? 'system'
                        : theme === 'system'
                          ? 'light'
                          : 'dark'
                    )
                  }
                  className="text-foreground"
                >
                  {theme === 'dark' ? (
                    <Icon icon="i-solar:moon-bold-duotone" className="size-4" />
                  ) : theme === 'light' ? (
                    <Icon
                      icon="i-solar:sun-2-bold-duotone"
                      className="size-4"
                    />
                  ) : (
                    <Icon
                      icon="i-solar:monitor-smartphone-bold-duotone"
                      className="size-4"
                    />
                  )}
                </Button>
              </TooltipContainer>
            )}
            <TooltipContainer tooltip="User Settings">
              <UserAvatar />
            </TooltipContainer>
          </div>
        </div>
      </div>
    </nav>
  );
}
