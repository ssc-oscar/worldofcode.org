import WaveLayout from '@/layouts/wave-layout';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { HomePageItem } from '@/types';
import styles from './index.module.css';
import { CITATION, homePageItems } from '@/config';
import Icon from '@/components/icon';

function HomePageCardHeader({ ...props }: Partial<HomePageItem>) {
  if (props.title)
    return (
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
            'hover:rotate-10 transform duration-200 ease-in-out',
            props.iconClassName ? props.iconClassName : 'bg-slate-100'
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
          'flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
          'hover:rotate-10 transform duration-200 ease-in-out',
          props.iconClassName ? props.iconClassName : 'bg-slate-100'
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
    <div className="bg-muted/50 text-card-foreground h-100% w-100% max-w-80 rounded-xl">
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
      <h1 className={cn('z-1 text-6xl font-bold', styles.gradientText)}>
        World of Code
      </h1>
      <div className="z-1 mb-6 flex flex-wrap items-center justify-center gap-6">
        <a href="docs/#/tutorial" target="_blank">
          <Button
            size="lg"
            onClick={() => console.log('clicked')}
            className="bg-slate-500"
          >
            Get Started
          </Button>
        </a>
        <a href="docs/" target="_blank">
          <Button
            size="lg"
            onClick={() => console.log('clicked')}
            className="bg-slate-700"
          >
            Read the Docs
          </Button>
        </a>
        <Button
          size="lg"
          className="bg-slate-900"
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
          Cite the Paper
        </Button>
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
