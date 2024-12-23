import WaveLayout from '@/layouts/wave-layout';
import {
  GitBranch,
  GitCommit,
  LucideIcon,
  Server,
  Smile,
  SmileIcon,
  TestTube2,
  TimerIcon,
  VideoIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CITATION } from '@/config';
import '@/styles/gradient-text.css';
import '@/styles/grid-container.css';
import GithubLogin from './auth/github';
import { GitHubLogoIcon } from '@radix-ui/react-icons';

function TypologyCard({ icon: Icon, content, iconClassName = 'bg-cyan-50' }) {
  return (
    <div className="h-fit max-w-80 rounded-xl bg-muted/50 text-card-foreground">
      <div className="flex flex-col gap-4 space-y-1.5 p-6">
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
            iconClassName
          )}
        >
          <Icon className="size-6" />
        </div>
        <blockquote className="text-md space-y-2">
          <p>{content}</p>
        </blockquote>
      </div>
    </div>
  );
}

function TypologyCardWithAction({
  icon: Icon,
  content,
  iconClassName = 'bg-cyan-50'
}) {
  return (
    <div className="h-fit max-w-80 rounded-xl bg-muted/50 text-card-foreground">
      <div className="flex flex-col gap-4 space-y-1.5 p-6">
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
            iconClassName
          )}
        >
          <Icon className="size-6" />
        </div>
        <blockquote className="text-md space-y-2">
          <p>{content}</p>
        </blockquote>
        <Button size="lg" className="bg-slate-800">
          Sign up
        </Button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { toast } = useToast();
  return (
    <WaveLayout>
      <div className="flex h-full flex-col items-center justify-center p-20">
        <div className="flex flex-col items-center justify-center gap-8">
          <h1 className="gradient-text scroll-m-20 font-extrabold tracking-tight lg:text-6xl">
            World of Code
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="https://github.com/woc-hack/tutorial" target="_blank">
              <Button
                size="lg"
                onClick={() => console.log('clicked')}
                className="bg-slate-500"
              >
                Get Started
              </Button>
            </a>
            <a href="https://github.com/ssc-oscar/lookup" target="_blank">
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
                  toast({ description: 'Citation copied to clipboard' });
                });
              }}
            >
              Cite the Paper
            </Button>
          </div>
          <div className="relative flex h-full flex-wrap items-center justify-center gap-10 p-10 text-white dark:border-r lg:flex">
            <TypologyCard
              icon={GitBranch}
              iconClassName="bg-cyan-50"
              content="Complete, Curated, Cross-referenced, and Current Collection of Open Source Version Control Data."
            />
            <TypologyCard
              icon={TestTube2}
              iconClassName="bg-green-50"
              content="Get stratified samples from OSS, cross-project code flow, developer/code networks, and more."
            />
            <TypologyCard
              icon={SmileIcon}
              iconClassName="bg-yellow-50"
              content="Make study of global OSS properties not only possible, but approachable and fun."
            />

            <div className="h-fit max-w-80 rounded-xl bg-muted/50 text-card-foreground">
              <div className="flex flex-col gap-4 space-y-1.5 p-6">
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
                    'bg-red-50'
                  )}
                >
                  <TimerIcon className="size-6" />
                </div>
                <blockquote className="text-md space-y-2">
                  <p>
                    Next World of Code Hackathon: &nbsp; &nbsp; Nov 17-19,
                    Knoxville, TN
                  </p>
                </blockquote>
                <a
                  href="https://github.com/woc-hack/hackathon-knoxville-2023"
                  target="_blank"
                >
                  <Button size="lg" className="w-full bg-slate-600">
                    Sign up
                  </Button>
                </a>
              </div>
            </div>
            <div className="h-fit max-w-80 rounded-xl bg-muted/50 text-card-foreground">
              <div className="flex flex-col gap-4 space-y-1.5 p-6">
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
                    'bg-fuchsia-50'
                  )}
                >
                  <Server className="size-6" />
                </div>
                <blockquote className="text-md space-y-2">
                  <p>General World of Code Infrastructure Overview</p>
                </blockquote>
                <a href="https://x.com/worldofcode_ssc" target="_blank">
                  <Button size="lg" className="w-full bg-slate-700">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>
            <div className="h-fit max-w-80 rounded-xl bg-muted/50 text-card-foreground">
              <div className="flex flex-col gap-4 space-y-1.5 p-6">
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg border-[2px] border-slate-200',
                    'bg-orange-50'
                  )}
                >
                  <VideoIcon className="size-6" />
                </div>
                <blockquote className="text-md space-y-2">
                  <p>
                    Essence of World of Code: &nbsp; &nbsp; Elements and
                    Structure
                  </p>
                </blockquote>
                <a href="https://youtu.be/c0uFPwT5SZI" target="_blank">
                  <Button size="lg" className="w-full bg-slate-800">
                    Watch on YouTube
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WaveLayout>
  );
}
