import React, { useRef, useState } from 'react';
import { getAuthor, getProject, MongoAuthor, searchAuthor } from '@/api/mongo';
import useSWR from 'swr';
import { DebouncedState, useDebounce } from 'use-debounce';
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
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function UserSearchBar({
  setAuthor
}: {
  setAuthor: (MongoAuthor) => void;
}) {
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

  const naiveInputFilter = (
    value: string,
    search: string,
    keywords?: string[]
  ) => {
    if (value.toLocaleLowerCase().includes(search.toLocaleLowerCase())) {
      return 1;
    }
    return 0.5;
  };

  function onSubmit(data: { authorIds: string[] }) {
    let filteredAuthorProfiles = authorProfiles.current.filter((author) =>
      data.authorIds.includes(author.AuthorID)
    );
    if (filteredAuthorProfiles.length == 0) {
      toast({
        title: 'No author selected',
        description: 'Please select an author from the dropdown.',
        variant: 'destructive'
      });
      return null;
    }
    let author = filteredAuthorProfiles[0];
    for (let i = 1; i < filteredAuthorProfiles.length; i++) {
      author = mergeAuthors(author, filteredAuthorProfiles[i]);
    }
    setAuthor(author);
    return author;
  }

  const exampleQueries = [
    'Guido van Rossum',
    'brendan@mozilla.org',
    'ry@tinyclouds.org',
    'Audris Mockus',
    'hrz6976@hotmail.com',
    'zhouminghui'
  ];

  function sampleOne<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot sample from an empty array');
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  return (
    <Card className="mb-4 w-[350px]">
      <CardHeader>
        <CardTitle>Developer Dashboard</CardTitle>
        <CardDescription>
          Search author profiles by name or email.
        </CardDescription>
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
                    filter={naiveInputFilter}
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
                            <ComboboxEmpty>
                              <div className="flex items-center justify-center gap-2">
                                <div className="i-fluent-emoji-flat:sad-but-relieved-face size-5" />
                                No author found.
                              </div>
                            </ComboboxEmpty>
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
                        <ComboboxEmpty className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="i-fluent-emoji-flat:thinking-face size-5" />
                            Have no idea?
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Try <b>{sampleOne(exampleQueries)}</b>.
                          </div>
                        </ComboboxEmpty>
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
