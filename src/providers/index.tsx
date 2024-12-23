import { Button } from '@/components/ui/button';
import { useRouter } from '@/hooks/use-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
// import { BrowserRouter } from 'react-router-dom';
import ThemeProvider from './theme-provider';
import { SidebarProvider } from '@/hooks/use-sidebar';
import { Toaster } from '@/components/ui/toaster';

export const queryClient = new QueryClient();

const ErrorFallback = ({ error }: FallbackProps) => {
  const router = useRouter();
  console.log('error', error);
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center text-red-500"
      role="alert"
    >
      <h2 className="text-2xl font-semibold">
        Ooops, something went wrong :({' '}
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
