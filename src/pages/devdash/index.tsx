import WaveLayout from '@/layouts/wave-layout';
import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pie, type PieConfig } from '@ant-design/charts';
import { useLocation } from 'react-router-dom';
import { getAuthor, getProject, MongoAuthor, searchAuthor } from '@/api/mongo';
import useSWR from 'swr';
import { VirtualizedList } from '@/components/ui/virtualized';
import { DebouncedState, useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import {
  CustomContainerComponentProps,
  CustomItemComponentProps
} from 'virtua';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLoading,
  ComboboxTag,
  ComboboxTagsInput
} from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Virtualized,
  VirtualizedVirtualizer
} from '@/components/ui/virtualized';
import UserSearchBar from './_search';

import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

import JsonView from 'react18-json-view';
import { getValues } from '@/api/lookup';
import { AxiosError } from 'axios';
import { cn } from '@/lib/utils';
import TooltipContainer from '@/components/tooltip-container';

function AuthorIDBadge({ authorId }: { authorId: string }) {
  let _emailIdx = authorId.indexOf('<');
  let name = _emailIdx === -1 ? authorId : authorId.slice(0, _emailIdx);
  let email =
    _emailIdx === -1 ? '' : authorId.slice(_emailIdx + 1, authorId.length - 1);
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
      {name}
      <a
        href={`mailto:${email}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-primary/10 ml-1.5 rounded-full px-2 py-1"
      >
        {email}
      </a>
    </span>
  );
}

function FileInfoPie(
  props: Partial<PieConfig> & { fileInfo: Record<string, number> } = {
    fileInfo: {
      Perl: 31,
      Rust: 67,
      Java: 1,
      other: 13784,
      'C/C++': 1278,
      Ruby: 123,
      JavaScript: 1343,
      Python: 189,
      Go: 30587
    }
  }
) {
  let values = Object.entries(props.fileInfo).map(([name, value]) => ({
    name,
    value
  }));
  values.sort((a, b) => b.value - a.value);
  let defaultConfig = {
    data: {
      value: values
    },
    autoFit: true,
    angleField: 'value',
    colorField: 'name',
    legend: true,
    innerRadius: 0.6,
    labels: [
      { text: 'name', style: { fontSize: 10, fontWeight: 'bold' } },
      {
        text: (d, i, data) => (i < data.length - 3 ? d.value : ''),
        style: {
          fontSize: 9,
          dy: 12
        }
      }
    ],
    style: {
      stroke: '#fff',
      inset: 1,
      radius: 10
    },
    scale: {
      color: {
        palette: 'spectral',
        offset: (t) => t * 0.8 + 0.1
      }
    }
  } satisfies PieConfig;
  return <Pie {...defaultConfig} {...props} />;
}

function ProjectTableRow({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useSWR(`/mongo/project/${projectId}`, () =>
    getProject(projectId)
  );
  return data ? (
    <>
      <TableCell className="font-medium">{data.ProjectID}</TableCell>
      <TableCell>{data.NumCommits.toLocaleString()}</TableCell>
      <TableCell>{data.NumFiles.toLocaleString()}</TableCell>
      <TableCell>{data.NumAuthors.toLocaleString()}</TableCell>
      <TableCell>
        {new Date(data.EarliestCommitDate * 1000).toLocaleDateString()} -
        {new Date(data.LatestCommitDate * 1000).toLocaleDateString()}
      </TableCell>
    </>
  ) : null;
}

const VirtualizedTableRow = React.forwardRef<
  React.ElementRef<typeof TableRow>,
  CustomItemComponentProps
>((props, ref) => <TableRow ref={ref} {...props} />);
VirtualizedTableRow.displayName = 'VirtualizedTableRow';

const VirtualizedTableBody = React.forwardRef<
  React.ElementRef<typeof TableBody>,
  CustomContainerComponentProps
>((props, ref) => <TableBody ref={ref} className="max-h-96" {...props} />);
VirtualizedTableBody.displayName = 'VirtualizedTableBody';

export function VirtualizerTable({ projectIds }: { projectIds: string[] }) {
  return (
    <Virtualized className="h-96 overflow-y-auto">
      <table className="w-full table-fixed caption-bottom border-separate border-spacing-0 text-sm">
        <TableHeader className="bg-background sticky top-0 z-10 [&_tr>*]:border-b">
          <TableRow>
            <TableHead className="w-[120px]">Invoice</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[200px]">Method</TableHead>
            <TableHead className="w-[120px] text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <VirtualizedVirtualizer
          as={VirtualizedTableBody}
          item={VirtualizedTableRow}
          startMargin={48}
        >
          {projectIds.map((projectId) => (
            <ProjectTableRow projectId={projectId} key={projectId} />
          ))}
        </VirtualizedVirtualizer>
      </table>
    </Virtualized>
  );
}

function AuthorDashboard({ author }: { author: MongoAuthor }) {
  if (author) {
    // Format dates from timestamps
    const earliestDate = new Date(
      author.EarliestCommitDate * 1000
    ).toLocaleDateString();
    const latestDate = new Date(
      author.LatestCommitDate * 1000
    ).toLocaleDateString();

    const {
      data: a2p,
      isLoading,
      error
    } = useSWR(`/lookup/map/a2P&q=${author.AuthorID}`, async () => {
      const allQueries = [author.AuthorID, ...author.Alias];
      const results: string[] = [];

      // Split queries into batches of 10 and execute them concurrently
      // ignore 404
      const batchPromises: Promise<Record<string, string[]> | null>[] = [];
      for (let i = 0; i < allQueries.length; i += 10) {
        const batchQueries = allQueries.slice(i, i + 10);
        batchPromises.push(
          (async () => {
            try {
              return await getValues<string[]>('a2P', batchQueries);
            } catch (e) {
              if (e instanceof AxiosError && e.response?.status === 404) {
                return null;
              }
              throw e;
            }
          })()
        );
      }
      // Wait for all batches to complete
      const batchResults = await Promise.all(batchPromises);
      console.log(batchResults);
      // Merge all batch results into the final results object
      batchResults.forEach((batchResults) => {
        if (batchResults) {
          results.push(...Object.values(batchResults).flat());
        }
      });
      console.log(results);
      // Sort
      results.sort((a, b) => a.localeCompare(b));
      return results;
    });

    const getGenderEmoji = (gender?: string) => {
      if (gender === 'male') return 'i-fluent-emoji-flat:man-technologist';
      if (gender === 'female') return 'i-fluent-emoji-flat:woman-technologist';
      return 'i-fluent-emoji-flat:person';
    };

    return (
      <>
        <div className="bg-primary/2 border-primary/10 mb-8 rounded-full border-2 p-2">
          <div className="flex items-center gap-1">
            <TooltipContainer
              tooltip={author.Gender ? author.Gender : 'Unknown'}
            >
              <div className="bg-primary/20 rounded-full p-2">
                <div className={cn('size-6', getGenderEmoji(author.Gender))} />
              </div>
            </TooltipContainer>
            <h1 className="text-xl font-bold">
              <AuthorIDBadge authorId={author.AuthorID} />
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-sm font-medium">Activity Summary</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-foreground/5 rounded-md p-3">
                  <p className="text-muted-foreground text-xs">Commits</p>
                  <p className="text-xl font-bold">
                    {author.NumCommits.toLocaleString()}
                  </p>
                </div>
                <div className="bg-foreground/5 rounded-md p-3">
                  <p className="text-muted-foreground text-xs">Projects</p>
                  <p className="text-xl font-bold">
                    {author.NumProjects.toLocaleString()}
                  </p>
                </div>
                <div className="bg-foreground/5 rounded-md p-3">
                  <p className="text-muted-foreground text-xs">Files Created</p>
                  <p className="text-xl font-bold">
                    {author.NumFiles.toLocaleString()}
                  </p>
                </div>
                <div className="bg-foreground/5 rounded-md p-3">
                  <p className="text-muted-foreground text-xs">
                    Originating Blobs
                  </p>
                  <p className="text-xl font-bold">
                    {author.NumOriginatingBlobs.toLocaleString()}
                  </p>
                </div>
                <div className="bg-foreground/5 rounded-md p-3">
                  <p className="text-muted-foreground text-xs">Active Months</p>
                  <p className="text-xl font-bold">
                    {author.NumActiveMon.toLocaleString()}
                  </p>
                </div>
                <div className="bg-foreground/5 rounded-md p-3">
                  <p className="text-muted-foreground text-xs">Active Period</p>
                  <p className="text-xl font-bold">
                    {earliestDate} - {latestDate}
                  </p>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                <div className="bg-foreground/5 rounded-md p-3">
                  <p className="text-muted-foreground text-xs">Known Aliases</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {author.Alias.slice(0, 6).map((alias, i) => (
                      <span
                        key={i}
                        className="bg-primary/3 rounded-full py-1 pl-2 pr-0 text-xs"
                      >
                        <AuthorIDBadge authorId={alias} />
                      </span>
                    ))}
                    {author.Alias.length > 6 && (
                      <span className="bg-primary/3 inline-flex items-center rounded-full px-3 py-1 text-xs">
                        +{author.Alias.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-sm font-medium">Language Distribution</h2>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <FileInfoPie fileInfo={author.FileInfo} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-auto">
                <JsonView src={author} className="text-sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <VirtualizerTable projectIds={a2p || []} />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }
  return (
    <div className="flex h-64 items-center justify-center">Loading...</div>
  );
}

export default function DashboardPage() {
  const [author, setAuthor] = useState<MongoAuthor | null>(null);
  return (
    <WaveLayout className="p-4">
      {author ? (
        <AuthorDashboard author={author} />
      ) : (
        <UserSearchBar setAuthor={setAuthor} />
      )}
    </WaveLayout>
  );
}
