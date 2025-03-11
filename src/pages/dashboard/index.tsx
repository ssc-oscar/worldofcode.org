import PageHead from '@/components/page-head.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs.js';
import RecentSales from './components/recent-sales.js';
import { useUserStore } from '@/hooks/use-user';
import WaveLayout from '@/layouts/wave-layout';
import { useEffect, useState } from 'react';
import { revokeToken, getUserTokens, type User, type Token } from '@/api/auth';
import { type IBrowser, type IOS, UAParser } from 'ua-parser-js';
import { cn } from '@/lib/utils';

function UAIcons({ uaString: uastring }: { uaString: string }) {
  const [os, setOS] = useState<IOS | null>(null);
  const [browser, setBrowser] = useState<IBrowser | null>(null);

  useEffect(() => {
    const ua = new UAParser(uastring);
    setBrowser(ua.getBrowser());
    setOS(ua.getOS());
  }, []);

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

  const trimVersion = (version: string) => {
    return version.split('.')[0];
  };

  return (
    <div className="flex size-4 flex-row items-center gap-2">
      {browser && browser.name && (
        <div
          className={cn(
            getBrowserIconName(browser.version),
            'h-4',
            'w-4',
            'color-primary'
          )}
        ></div>
      )}
      {browser && browser.version && (
        <div className="size-4">{trimVersion(browser.version)}</div>
      )}
      {os && os.name && <div className={getOSIconName(os.name)}></div>}
      {os && os.version && (
        <div className="size-4">{trimVersion(os.version)}</div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useUserStore();
  const [userTokens, setUserTokens] = useState<Token[]>([]);

  useEffect(() => {
    refreshUser();
  }, []);
  useEffect(() => {
    getUserTokens().then((data) => setUserTokens(data));
  }, []);

  return (
    <WaveLayout>
      <div className="max-h-screen flex-1 space-y-4 overflow-y-auto p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Hi, {user?.name}! 👋
          </h2>
        </div>
        <ul>
          {userTokens.map((token) => (
            <li key={token._id}>
              <UAIcons uaString={token.user_agent} />
            </li>
          ))}
        </ul>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="text-muted-foreground h-4 w-4"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-muted-foreground text-xs">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Subscriptions
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="text-muted-foreground h-4 w-4"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+2350</div>
                  <p className="text-muted-foreground text-xs">
                    +180.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="text-muted-foreground h-4 w-4"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12,234</div>
                  <p className="text-muted-foreground text-xs">
                    +19% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Now
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="text-muted-foreground h-4 w-4"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-muted-foreground text-xs">
                    +201 since last hour
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">{/* <Overview /> */}</CardContent>
              </Card>
              <Card className="col-span-4 md:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>
                    You made 265 sales this month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </WaveLayout>
  );
}
