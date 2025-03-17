import WaveLayout from '@/layouts/wave-layout';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { HomePageItem } from '@/config';
import { CITATION, homePageItems } from '@/config';

import Icon from '@/components/icon';

import { NumberTicker } from '@/components/magicui/number-ticker';
import { getMapCount, getObjectCount, ObjectName } from '@/api/lookup';
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';

export function WocNumberTicker({
  variant = 'project',
  title
}: {
  variant: string;
  title?: string;
}) {
  const { data, isLoading, error } = useSWR(
    `/lookup/object/${variant}/count`,
    () => {
      if (['commit', 'tree', 'blob'].includes(variant)) {
        return getObjectCount(variant as ObjectName);
      } else {
        return getMapCount(variant);
      }
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
    <div className="hover:scale-102 w-45 flex flex-col items-center justify-center gap-2 transition-all duration-300">
      <NumberTicker
        value={data}
        className="color-primary/80 text-2xl font-bold"
      />
      <Separator className="color-primary/80 w-3/4 transition-all duration-300 group-hover:w-full" />
      <p className="text-primary/80 text-md font-medium">{title || variant}</p>
    </div>
  );
}

import '@/styles/gradient-text.css';
import { Separator } from '@/components/ui/separator';

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
    linkArea = (
      <a href={props.linkHref} target="_blank">
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
            <p key={index}>{line}</p> // now newline char works
          ))}
        </div>
        {linkArea}
      </div>
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
      <div className="z-1 mb-2 flex flex-wrap items-center justify-center gap-6">
        <a href="docs/#/tutorial" target="_blank">
          <Button
            size="lg"
            onClick={() => console.log('clicked')}
            className="hover:bg-slate-6 dark:bg-slate-2 gap-1 bg-slate-500 px-6"
          >
            <div className="i-solar:running-2-bold-duotone size-4.5" />
            Get Started
          </Button>
        </a>
        <a href="docs/" target="_blank">
          <Button
            size="lg"
            onClick={() => console.log('clicked')}
            className="dark:bg-slate-3 hover:bg-slate-5 gap-1 bg-slate-700 px-6"
          >
            <div className="i-solar:book-2-bold-duotone size-4.5" />
            Read the Docs
          </Button>
        </a>
        <Button
          size="lg"
          className="dark:bg-slate-4 gap-1 bg-slate-900 px-6"
          onClick={() => {
            navigator.clipboard.writeText(CITATION).then(() => {
              console.log('copied');
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
        <WocNumberTicker variant="p2c" title="Projects" />
        <WocNumberTicker variant="commit" title="Commits" />
        <WocNumberTicker variant="a2c" title="Authors" />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <WaveLayout>
      <div className="w-100% flex flex-col items-center justify-center gap-8 pt-12">
        <WocLogoAndButtons />
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {homePageItems.map((item) => (
            <li
              className="flex flex-col items-center justify-center gap-4"
              key={item.icon}
            >
              <HomePageCard {...item} />
            </li>
          ))}
        </ul>
      </div>
    </WaveLayout>
  );
}
