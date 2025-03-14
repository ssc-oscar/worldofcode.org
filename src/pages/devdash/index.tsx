import WaveLayout from '@/layouts/wave-layout';
import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pie, type PieConfig } from '@ant-design/charts';
import { useLocation } from 'react-router-dom';
import { getAuthor, MongoAuthor, searchAuthor } from '@/api/mongo';
import useSWR from 'swr';
import { DebouncedState, useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react';
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

import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import JsonView from 'react18-json-view';

const fruits = [
  {
    value: 'apple',
    label: 'Apple'
  },
  {
    value: 'banana',
    label: 'Banana'
  },
  {
    value: 'blueberry',
    label: 'Blueberry'
  },
  {
    value: 'grapes',
    label: 'Grapes'
  },
  {
    value: 'pineapple',
    label: 'Pineapple'
  }
];

function AuthorIDBadge({ authorId }: { authorId: string }) {
  let _emailIdx = authorId.indexOf('<');
  let name = _emailIdx === -1 ? authorId : authorId.slice(0, _emailIdx);
  let email = _emailIdx === -1 ? '' : authorId.slice(_emailIdx);
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
      {name}
      <div className="ml-1.5">{email}</div>
    </span>
  );
}

function UserSearchBar({ setAuthor }: { setAuthor: (MongoAuthor) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedQuery] = useDebounce(
    searchQuery,
    1000
  );
  const authorProfiles = useRef<MongoAuthor[]>([]);

  const {
    data: authorCandidates,
    mutate: refreshAuthorCandidates,
    isLoading,
    error
  } = useSWR(`/mongo/author/search&q=${debouncedSearchQuery}`, async () => {
    if (debouncedSearchQuery === '') return [];
    let r = [];
    if (debouncedSearchQuery.indexOf('@') !== -1) {
      r = await searchAuthor(debouncedSearchQuery, 100, 'email');
    } else {
      r = await searchAuthor(debouncedSearchQuery, 100);
    }
    authorProfiles.current.push(...r);
    return r;
  });

  const form = useForm({
    defaultValues: {
      authorIds: []
    }
  });

  function mergeDicts<T extends string | number>(
    a: Record<T, number>,
    b: Record<T, number>
  ) {
    const result: Record<T, number> = {} as Record<T, number>;
    for (let key in a) {
      result[key] = a[key];
    }
    for (let key in b) {
      result[key] = (result[key] || 0) + b[key];
    }
    return result;
  }

  function mergeAuthors(author: MongoAuthor, author2: MongoAuthor) {
    return {
      Alias: Array.from(
        new Set([...author.Alias, ...author2.Alias, author2.AuthorID])
      ),
      AuthorID: author.AuthorID,
      EarliestCommitDate: Math.min(
        author.EarliestCommitDate,
        author2.EarliestCommitDate
      ),
      FileInfo: mergeDicts(author.FileInfo, author2.FileInfo),
      Gender: author.Gender || author2.Gender,
      LatestCommitDate: Math.max(
        author.LatestCommitDate,
        author2.LatestCommitDate
      ),
      MonNcm: mergeDicts(author.MonNcm, author2.MonNcm),
      MonNprj: mergeDicts(author.MonNprj, author2.MonNprj),
      NumActiveMon: author.NumActiveMon + author2.NumActiveMon,
      NumAlias: author.NumAlias + author2.NumAlias,
      NumCommits: author.NumCommits + author2.NumCommits,
      NumFiles: author.NumFiles + author2.NumFiles,
      NumOriginatingBlobs:
        author.NumOriginatingBlobs + author2.NumOriginatingBlobs,
      NumProjects: author.NumProjects + author2.NumProjects
    } satisfies MongoAuthor;
  }

  function onSubmit(data: { authorIds: string[] }) {
    let filteredAuthorProfiles = authorProfiles.current.filter((author) =>
      data.authorIds.includes(author.AuthorID)
    );
    if (filteredAuthorProfiles.length == 0) return null;
    let author = filteredAuthorProfiles[0];
    for (let i = 1; i < filteredAuthorProfiles.length; i++) {
      author = mergeAuthors(author, filteredAuthorProfiles[i]);
    }
    setAuthor(author);
    return author;
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Developer Dashboard</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-360px space-y-3"
        >
          <CardContent>
            <FormField
              control={form.control}
              name="authorIds"
              render={({ field }) => (
                <FormItem>
                  <Combobox
                    type="multiple"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="w-full"
                  >
                    <FormControl>
                      <ComboboxTagsInput
                        placeholder="Search by Name or Email ..."
                        onInput={(e) => {
                          const value = (e.target as HTMLInputElement).value;
                          setSearchQuery(value);
                          if (!value) setDebouncedQuery('');
                        }}
                      >
                        {field.value.map((value) => (
                          <ComboboxTag key={value} value={value}>
                            {value}
                          </ComboboxTag>
                        ))}
                      </ComboboxTagsInput>
                    </FormControl>
                    <ComboboxContent>
                      {searchQuery ? (
                        <>
                          {isLoading || searchQuery !== debouncedSearchQuery ? (
                            <ComboboxLoading />
                          ) : (
                            <ComboboxEmpty>No author found.</ComboboxEmpty>
                          )}
                          {authorCandidates &&
                            authorCandidates.map((author) => (
                              <ComboboxItem
                                key={author.AuthorID}
                                value={author.AuthorID}
                              >
                                {author.AuthorID}
                              </ComboboxItem>
                            ))}
                        </>
                      ) : (
                        <ComboboxEmpty>Have Anything?</ComboboxEmpty>
                      )}
                    </ComboboxContent>
                  </Combobox>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                // clear form
                form.reset();
                setAuthor(null);
              }}
              className="inline-flex gap-1"
            >
              <div className="i-solar:restart-line-duotone size-4" />
              Reset
            </Button>
            <Button type="submit" className="inline-flex gap-1">
              <div className="i-solar:upload-bold-duotone size-4" />
              Submit
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
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
  };
  return <Pie {...defaultConfig} {...props} />;
}

function AuthorDashboard({ author }: { author: MongoAuthor }) {
  if (author)
    return (
      <div>
        <h2>{author.AuthorID}</h2>
        <p>{author.EarliestCommitDate}</p>
        <p>{author.Alias}</p>
        <div id="container">
          <FileInfoPie fileInfo={author.FileInfo} />
        </div>
        <JsonView src={author} />
      </div>
    );
  return <div>Loading...</div>;
}

export default function DashboardPage() {
  const [author, setAuthor] = useState<MongoAuthor | null>(null);
  return (
    <WaveLayout>
      {author ? (
        <AuthorDashboard author={author} />
      ) : (
        <UserSearchBar setAuthor={setAuthor} />
      )}
    </WaveLayout>
  );
}
