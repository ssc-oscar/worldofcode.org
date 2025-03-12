import { Button } from '@/components/ui/button';
import { useRouter } from '@/hooks/use-router';
// import {
//   QueryClient,
//   QueryCache,
//   QueryClientProvider
// } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import ThemeProvider from './theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { parseError } from '@/lib/error';
import { AxiosError } from 'axios';
import { SWRConfig } from 'swr';
import { UserContextProvider } from './user-provider';
import { Link, useLocation } from 'react-router-dom';
import { ToastAction } from '@/components/ui/toast';

// export const queryClient = new QueryClient({
//   queryCache: new QueryCache({
//     onError: async (error) => {
//       // handle 401 Error
//       if (error instanceof AxiosError) {
//         console.log('error', error);
//         if (error.response?.status === 401) {
//           // cancel all queries
//           queryClient.cancelQueries();
//           // remove 'user' from cache
//           queryClient.resetQueries({
//             queryKey: ['user'],
//             exact: true
//           });
//           return;
//         }
//         toast(parseError(error));
//         // throw error;
//       }
//     }
//   }),
//   defaultOptions: {
//     queries: {
//       refetchOnWindowFocus: false,
//       retry: false
//     }
//   }
// });

const ErrorFallback = ({ error }: FallbackProps) => {
  console.log('error', error);
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center"
      role="alert"
    >
      <h2 className="text-2xl">Ooops, something went really wrong :{'( '}</h2>
      <pre className="overflow-clip text-lg font-bold text-red-500">
        {error.message}
      </pre>
      <pre className="text-sm text-red-500">{error.stack}</pre>
      <div className="flex-center flex justify-center gap-4">
        <Button className="mt-4" onClick={() => (window.location.href = '/')}>
          Return to Home
        </Button>
        <a
          href="https://github.com/ssc-oscar/woc-frontend/issues/new"
          target="_blank"
        >
          <Button className="mt-4" variant="outline">
            Submit an Issue
          </Button>
        </a>
      </div>
    </div>
  );
};

const SWRErrorHandler = (error: Error) => {
  console.log('Reached SWR ERROR HANDLER', error);
  if (error instanceof AxiosError && error.response?.status === 401) {
    toast({
      ...parseError(error),
      action: (
        <a href="/auth/signin">
          <ToastAction altText="Authenticate">Authenticate</ToastAction>
        </a>
      )
    });
  } else {
    toast(parseError(error));
  }
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
          <SWRConfig
            value={{
              onError: SWRErrorHandler,
              revalidateOnFocus: false
            }}
          >
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <UserContextProvider>{children}</UserContextProvider>
              <Toaster />
            </ThemeProvider>
          </SWRConfig>
          {/* </QueryClientProvider> */}
        </ErrorBoundary>
      </HelmetProvider>
    </Suspense>
  );
}
