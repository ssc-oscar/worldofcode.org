import { Button } from '@/components/ui/button';
import { useRouter } from '@/hooks/use-router';
import {
  QueryClient,
  QueryCache,
  QueryClientProvider
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import ThemeProvider from './theme-provider';
import { SidebarProvider } from '@/hooks/use-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { parseError } from '@/lib/error';
import { AxiosError } from 'axios';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: async (error) => {
      // handle 401 Error
      if (error instanceof AxiosError) {
        console.log('error', error);
        if (error.response?.status === 401) {
          // cancel all queries
          queryClient.cancelQueries();
          // remove 'user' from cache
          queryClient.resetQueries({
            queryKey: ['user'],
            exact: true
          });
          return;
        }
        toast(parseError(error));
        // throw error;
      }
    }
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

const ErrorFallback = ({ error }: FallbackProps) => {
  const router = useRouter();
  console.log('error', error);
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center text-red-500"
      role="alert"
    >
      <h2 className="text-2xl font-semibold">
        Ooops, something went wrong :{'( '}
      </h2>
      <pre className="text-2xl font-bold">{error.message}</pre>
      <pre>{error.stack}</pre>
      <Button className="mt-4" onClick={() => router.back()}>
        Go back
      </Button>
    </div>
  );
};

export default function AppProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <HelmetProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools />
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <SidebarProvider>{children}</SidebarProvider>
              <Toaster />
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </Suspense>
  );
}
