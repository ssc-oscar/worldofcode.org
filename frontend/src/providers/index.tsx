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
import { ToastAction } from '@/components/ui/toast';

const ErrorFallback = ({ error }: FallbackProps) => {
  console.log('error', error);
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center"
      role="alert"
    >
      <h2 className="text-2xl">Ooops, something went really wrong :{'( '}</h2>
      <code className="p-4">
        <pre className="bg-slate-1 overflow-clip rounded-t-xl p-4 text-sm font-bold text-red-500">
          {error.message}
        </pre>
        <pre className="bg-slate-2 rounded-b-xl p-4 text-sm text-red-500">
          {error.stack}
        </pre>
      </code>
      <div className="flex-center flex justify-center gap-4">
        <button
          className="bg-slate-8 text-secondary hover:filter-contrast-80 rounded-lg px-4 py-2"
          onClick={() => {
            // clean cache
            localStorage.clear();
            sessionStorage.clear();
            document.cookie = '';
            window.location.reload();
          }}
        >
          Clear Cache and Reload
        </button>
        <a
          href="https://github.com/ssc-oscar/woc-frontend/issues/new"
          target="_blank"
        >
          <button className="bg-slate-6 text-secondary hover:filter-contrast-80 rounded-lg px-4 py-2">
            Submit an Issue
          </button>
        </a>
      </div>
    </div>
  );
};

const LoadingFallback = () => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="i-line-md:loading-twotone-loop text-primary/80 size-12 animate-spin" />
      <p className="text-primary/80 mt-4 text-lg">Loading...</p>
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
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <HelmetProvider>
          <SWRConfig
            value={{
              onError: SWRErrorHandler,
              revalidateOnFocus: false
            }}
          >
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
              <UserContextProvider>{children}</UserContextProvider>
              <Toaster />
            </ThemeProvider>
          </SWRConfig>
        </HelmetProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
