import PageHead from '@/components/page-head.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import RecentSales from './components/recent-sales.js';
import WaveLayout from '@/layouts/wave-layout';
import { useContext, useEffect, useState } from 'react';
import {
  revokeToken,
  getUserTokens,
  type User,
  type Token,
  createToken
} from '@/api/auth';
import { UAParser } from 'ua-parser-js';
import { UserContext } from '@/providers/user-provider.js';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button.js';
import { cn } from '@/lib/utils.js';
import useSWR from 'swr';
import { toast } from '@/hooks/use-toast.js';
import { parseError } from '@/lib/error.js';

function UALabel({ userAgent }: { userAgent: string }) {
  const getBrowserIconName = (browser: string) => {
    if (browser.indexOf('Chrome') > -1) return 'i-simple-icons:googlechrome';
    if (browser.indexOf('Firefox') > -1) return 'i-simple-icons:firefoxbrowser';
    if (browser.indexOf('Safari') > -1) return 'i-simple-icons:safari';
    if (browser.indexOf('Edge') > -1) return 'i-simple-icons:microsoftedge';
    if (browser.indexOf('IE') > -1) return 'i-simple-icons:internetexplorer';
    if (browser.indexOf('Opera') > -1) return 'i-simple-icons:opera';
    if (browser.indexOf('Arc') > -1) return 'i-simple-icons:arc';
    if (browser.indexOf('WeChat') > -1) return 'i-simple-icons:wechat';
    return 'i-solar:question-square-line-duotone';
  };
  const getOSIconName = (os: string) => {
    if (os.indexOf('Windows') > -1) return 'i-simple-icons:windows10';
    if (os.indexOf('Android') > -1) return 'simple-icons:android';
    if (os.indexOf('mac') > -1) return 'i-simple-icons:apple';
    if (os.indexOf('Harmony') > -1) return 'simple-icons:huawei';
    if (os.indexOf('Chrome') > -1) return 'i-simple-icons:googlechrome';
    if (os.indexOf('iOS') > -1) return 'simple-icons:ios';
    return 'i-simple-icons:linux';
  };
  const ua = new UAParser(userAgent);
  const browser = ua.getBrowser();
  const os = ua.getOS();
  return (
    <div className="color-foreground flex items-center gap-1">
      <div className={getBrowserIconName(browser.name)} />
      {browser.major}
      <div className={cn('ml-1', getOSIconName(os.name))} />
      {os.version}
    </div>
  );
}

function TokenLabel({ token }: { token: Token }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="i-material-symbols:alarm-off-rounded" />
        {format(new Date(token.expires), 'MM-dd HH:mm:ss')}
      </div>
      {token.user_agent && (
        <UALabel userAgent={token.user_agent} key={token._id} />
      )}
      {token.request_ip && (
        <div className="flex items-center gap-2">
          <div className="i-iconoir:ip-address-tag" />
          {token.request_ip.length < 20
            ? token.request_ip
            : token.request_ip.substring(0, 17) + '...'}
        </div>
      )}
    </div>
  );
}

function TokenPopover({ onTerminate }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="secondary" onClick={() => setOpen(!open)}>
          <div className="i-solar:trash-bin-2-bold-duotone size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <CardTitle className="mb-1">Terminate Session</CardTitle>
        <CardDescription>
          The user on this session will be logged out immediately.
        </CardDescription>
        <div className="mt-2 flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onTerminate();
            }}
          >
            Terminate
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SessionsPanel() {
  const {
    data: sessionTokens,
    isLoading,
    error,
    mutate
  } = useSWR(
    '/auth/token?token_type=session',
    async () => {
      let r = await getUserTokens('session');
      r.sort((a, b) => a.expires - b.expires);
      return r;
    },
    {
      suspense: true,
      keepPreviousData: true
    }
  );

  const revokeSession = async (sessionId) => {
    // Make the API call
    let oldTokens = sessionTokens;
    try {
      mutate(
        sessionTokens.filter((session) => session._id !== sessionId),
        false // Don't revalidate immediately
      );
      await revokeToken(sessionId);
      // Revalidate to make sure our optimistic update was correct
      mutate();
    } catch (error) {
      toast(parseError(error));
      mutate(oldTokens);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="">Expires</TableHead>
          <TableHead>Device</TableHead>
          <TableHead className="max-w-[100px]">IP Address</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessionTokens &&
          sessionTokens.map((token) => {
            return (
              <TableRow key={token._id}>
                <TableCell className="w-30 font-medium">
                  {format(new Date(token.expires), 'MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell className="w-30">
                  <UALabel userAgent={token.user_agent} />
                </TableCell>
                <TableCell className="w-30 max-w-40 truncate">
                  {token.request_ip}
                </TableCell>
                <TableCell className="w-6 text-right">
                  <TokenPopover onTerminate={() => revokeSession(token._id)} />
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}

function APIKeysPanel() {
  const {
    data: APITokens,
    isLoading,
    error,
    mutate
  } = useSWR(
    '/auth/token?token_type=api',
    async () => {
      let r = await getUserTokens('api');
      r.sort((a, b) => a.expires - b.expires);
      return r;
    },
    {
      suspense: true,
      keepPreviousData: true
    }
  );
  const revokeAPIToken = async (tokenId) => {
    // Make the API call
    let oldTokens = APITokens;
    try {
      mutate(
        APITokens.filter((session) => session._id !== tokenId),
        false // Don't revalidate immediately
      );
      await revokeToken(tokenId);
      // Revalidate to make sure our optimistic update was correct
      mutate();
    } catch (error) {
      toast(parseError(error));
      mutate(oldTokens);
    }
  };
  const createAPIToken = async () => {
    // Make the API call
    let oldTokens = APITokens;
    try {
      await createToken();
      mutate();
    } catch (error) {
      toast(parseError(error));
    }
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="">Expires</TableHead>
          <TableHead>Device</TableHead>
          <TableHead className="max-w-[100px]">IP Address</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {APITokens &&
          APITokens.map((token) => {
            return (
              <TableRow key={token._id}>
                <TableCell className="w-30 font-medium">
                  {format(new Date(token.expires), 'MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell className="w-30 max-w-30">
                  <UALabel userAgent={token.user_agent} />
                </TableCell>
                <TableCell className="w-30 max-w-40 truncate">
                  {token.request_ip}
                </TableCell>
                <TableCell className="w-6 text-right">
                  <TokenPopover onTerminate={() => revokeAPIToken(token._id)} />
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
      <TableFooter>
        <TableCell colSpan={3}>Need a new API Key?</TableCell>
        <TableCell>+1</TableCell>
      </TableFooter>
    </Table>
  );
}

export default function DashboardPage() {
  const { user, setUser } = useContext(UserContext);

  return (
    <WaveLayout>
      <div className="max-h-screen flex-1 space-y-4 overflow-y-auto p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Hi, {user?.name}! 👋
          </h2>
        </div>
        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          </TabsList>
          <TabsContent value="sessions" className="space-y-4">
            <SessionsPanel />
          </TabsContent>
          <TabsContent value="apikeys" className="space-y-4">
            <APIKeysPanel />
          </TabsContent>
        </Tabs>
      </div>
    </WaveLayout>
  );
}
