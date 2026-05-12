import WaveLayout from '@/layouts/wave-layout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { HomePageItem } from '@/config';
import { CITATION, updateBanner, useCaseItems, tryItItems, learnMoreItems } from '@/config';
import CountUp from 'react-countup';
import Icon from '@/components/icon';
import { getMapCount, getObjectCount, ObjectName } from '@/api/lookup';
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/gradient-text.css';
import { Separator } from '@/components/ui/separator';

export function WocNumberTicker({
  variant = 'project',
  title,
  subtitle,
  className,
  ...props
}: {
  variant: string;
  title?: string | React.ReactNode;
  subtitle?: string;
  className?: string;
  [key: string]: any;
}) {
  const { data, isLoading, error } = useSWR(
    `/lookup/object/${variant}/count`,
    () => {
      if (['commit', 'tree', 'blob'].includes(variant)) {
        return getObjectCount(variant as ObjectName);
      } else {
        return getMapCount(variant);
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false
    }
  );

  if (isLoading) {
    return (
      <div className="w-45 flex flex-col items-center justify-center gap-2">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Separator className="color-primary/40 opacity-50" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-45 flex flex-col items-center justify-center gap-2">
        <p className="text-destructive/80 text-lg">Error</p>
        <Separator className="bg-destructive/50" />
        <p className="text-destructive/80 text-xs">{title || variant}</p>
      </div>
    );
  }

  return (
    <div className="hover:scale-102 w-45 flex flex-col items-center justify-center gap-1 transition-all duration-300">
      <CountUp
        end={data}
        className={cn(
          'font-600 text-primary/80 inline-block text-2xl tabular-nums tracking-wider',
          className
        )}
        {...props}
      />
      <Separator className="color-primary/80 w-3/4 transition-all duration-300 group-hover:w-full" />
      <p className="text-primary/80 text-md font-medium">{title || variant}</p>
      {subtitle && (
        <p className="text-primary/50 text-xs">{subtitle}</p>
      )}
    </div>
  );
}

function HomePageCardHeader({ ...props }: Partial<HomePageItem>) {
  if (props.title)
    return (
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'dark:border-slate-5 flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
            'hover:rotate-10 transform duration-200 ease-in-out',
            props.iconClassName
              ? props.iconClassName
              : 'dark:bg-slate-3 bg-slate-100'
          )}
        >
          <Icon
            icon={props.icon}
            className="w-1.2em text-align-center text-1.2em"
          />
        </div>
        <p>{props.title}</p>
      </div>
    );
  else
    return (
      <div
        className={cn(
          'dark:border-slate-5 flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
          'hover:rotate-10 transform duration-200 ease-in-out',
          props.iconClassName
            ? props.iconClassName
            : 'dark:bg-slate-3 bg-slate-100'
        )}
      >
        <Icon
          icon={props.icon}
          className="w-1.2em text-align-center text-1.2em"
        />
      </div>
    );
}

function HomePageCard({ ...props }: HomePageItem) {
  let linkArea = <></>;
  if (props.linkHref) {
    const isExternal = props.linkHref.startsWith('http');
    linkArea = (
      <a href={props.linkHref} target={isExternal ? '_blank' : undefined}>
        <Button size="lg" className={cn('w-full', props.linkClassName)}>
          {props.linkText ? props.linkText : 'Learn More'}
        </Button>
      </a>
    );
  }
  return (
    <div className="h-100% w-100% dark:bg-slate-8 max-w-80 rounded-xl bg-slate-50">
      <div className="h-100% flex flex-col justify-between gap-4 space-y-1.5 p-6">
        <HomePageCardHeader {...props} />
        <div className="text-1em text-wrap">
          {props.description.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        {linkArea}
      </div>
    </div>
  );
}

function UpdateBanner() {
  return (
    <div className="z-1 dark:bg-slate-8/80 flex items-center gap-3 rounded-lg bg-slate-100/80 px-4 py-2 text-sm backdrop-blur-sm">
      <span className="i-fluent-emoji-flat:warning text-lg" />
      <span className="text-primary/70">{updateBanner.text}</span>
      <a href={updateBanner.linkHref} className="text-primary/90 font-medium underline underline-offset-2">
        {updateBanner.linkText}
      </a>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="w-full max-w-5xl px-4 pt-4">
      <h2 className="text-primary/80 text-2xl font-semibold">{title}</h2>
      {subtitle && <p className="text-primary/50 mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}

function WocLogoAndButtons() {
  const { toast } = useToast();
  return (
    <>
      <h1 className="z-1 gradient-text text-center text-6xl font-bold">
        World of Code
      </h1>
      <p className="z-1 text-primary/60 max-w-xl text-center text-lg">
        Every public git commit. Every author. Every project. Cross-referenced.
      </p>
      <div className="z-1 mb-2 flex flex-wrap items-center justify-center gap-6">
        <a href="docs/#/capabilities">
          <Button
            size="lg"
            className="hover:bg-slate-6 dark:bg-slate-2 gap-1 bg-slate-500 px-6"
          >
            <div className="i-solar:running-2-bold-duotone size-4.5" />
            What WoC Can Do
          </Button>
        </a>
        <a href="docs/#/tutorial" target="_blank">
          <Button
            size="lg"
            className="dark:bg-slate-3 hover:bg-slate-5 gap-1 bg-slate-700 px-6"
          >
            <div className="i-solar:book-2-bold-duotone size-4.5" />
            Tutorial
          </Button>
        </a>
        <Button
          size="lg"
          className="dark:bg-slate-4 gap-1 bg-slate-900 px-6"
          onClick={() => {
            navigator.clipboard.writeText(CITATION).then(() => {
              toast({
                title: 'Citation copied to clipboard',
                description: CITATION
              });
            });
          }}
        >
          <div className="i-solar:copyright-line-duotone size-4.5" />
          Cite the Paper
        </Button>
      </div>
      <div className="z-1 mb-2 flex flex-wrap items-center justify-center gap-6">
        <WocNumberTicker
          variant="a2c"
          subtitle="across all public repos"
          title={
            <div className="flex items-center gap-2">
              <span className="i-mdi:account-group" />
              Authors
            </div>
          }
        />
        <WocNumberTicker
          variant="p2c"
          subtitle="from every git forge"
          title={
            <div className="flex items-center gap-2">
              <span className="i-mdi:source-repository" />
              Projects
            </div>
          }
        />
        <WocNumberTicker
          variant="commit"
          subtitle="fully cross-referenced"
          title={
            <div className="flex items-center gap-2">
              <span className="i-mdi:source-commit" />
              Commits
            </div>
          }
        />
      </div>
      <UpdateBanner />
    </>
  );
}

export default function HomePage() {
  return (
    <WaveLayout>
      <div className="w-100% flex flex-col items-center justify-center gap-6 pt-12">
        <WocLogoAndButtons />

        <SectionHeader
          title="What can WoC do for you?"
          subtitle="The only dataset that connects all public git repositories into one searchable graph"
        />
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {useCaseItems.map((item) => (
            <li className="flex flex-col items-center justify-center" key={item.title}>
              <HomePageCard {...item} />
            </li>
          ))}
        </ul>

        <SectionHeader
          title="Try it now"
          subtitle="No setup required — explore WoC data directly in the browser"
        />
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tryItItems.map((item) => (
            <li className="flex flex-col items-center justify-center" key={item.title}>
              <HomePageCard {...item} />
            </li>
          ))}
        </ul>

        <SectionHeader
          title="Go deeper"
        />
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {learnMoreItems.map((item) => (
            <li className="flex flex-col items-center justify-center" key={item.title}>
              <HomePageCard {...item} />
            </li>
          ))}
        </ul>
      </div>
    </WaveLayout>
  );
}
