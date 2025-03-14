import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  getPaginationRowModel
} from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import WaveLayout from '@/layouts/wave-layout';
import { QueryBuilderShadcnUi } from '@/components/querybuilder';
import {
  QueryBuilder,
  type RuleGroupType,
  type Field,
  defaultOperators,
  toFullOption,
  formatQuery,
  parseNumber
} from 'react-querybuilder';
import {
  MongoLanguage,
  sampleAuthor,
  sampleProject,
  searchAuthor,
  searchProject
} from '@/api/mongo';
import JsonView from 'react18-json-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useSWR from 'swr';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { authorFields, projectFields } from './fields';
import useSWRMutation from 'swr/mutation';
import { format } from 'date-fns';
import { useWindowSize } from 'react-use';

// const QueryBuilderPanel = ({
//   fields,
//   variant,
//   fetcher
// }: {
//   fields: Field[];
//   variant: 'author' | 'project';
//   fetcher: typeof searchAuthor;
// }) => {
//   const [query, setQuery] = useState<RuleGroupType>({
//     combinator: 'and',
//     rules: []
//   });
//   const [mongoQueryObj, setMongoQueryObj] = useState<Record<string, any>>({});
//   const { data, isLoading, error } = useSWR(
//     `/search/${variant}/${JSON.stringify(mongoQueryObj)}`,
//     (key, query) => fetcher(query)
//   );

//   return (
//     <div className="flex w-full flex-col gap-2">
//       <QueryBuilderShadcnUi>
//         <QueryBuilder
//           fields={fields}
//           query={query}
//           onQueryChange={(newQuery) => {
//             setQuery(newQuery);
//             setMongoQueryObj(formatQuery(newQuery, 'mongodb_query'));
//           }}
//         />
//       </QueryBuilderShadcnUi>
//       <Card className="bg-foreground/5 h-[376px] w-[360px] w-full overflow-auto p-2">
//         <JsonView src={mongoQueryObj} />
//       </Card>
//     </div>
//   );
// };

export default function SamplePage() {
  const [query, setQuery] = useState<RuleGroupType>({
    combinator: 'and',
    rules: []
  });
  const [selectedPane, setSelectedPane] = useState<string>('author');
  const [mongoQueryObj, setMongoQueryObj] = useState<Record<string, any>>({});
  const [sampleNum, setSampleNum] = useState(10);

  const {
    data: queryResult,
    isMutating,
    trigger,
    reset,
    error
  } = useSWRMutation(
    `/search/${selectedPane}/sample?q=${JSON.stringify(mongoQueryObj)}&limit=${sampleNum}`,
    async () => {
      if (selectedPane === 'author') {
        return await sampleAuthor(mongoQueryObj, sampleNum);
      } else {
        return await sampleProject(mongoQueryObj, sampleNum);
      }
    }
  );

  // reset query result on queryObject change
  useEffect(() => reset(), [mongoQueryObj]);
  // reset everything on error
  useEffect(() => {
    if (error) {
      reset();
    }
  }, [error]);

  function formatMongoQuery(query: RuleGroupType, fieldObject?: Field[]) {
    let rules = query.rules.map((rule) => {
      console.log(rule);
      if ('field' in rule) {
        if (
          rule.field === 'EarliestCommitDate' ||
          rule.field === 'LatestCommitDate'
        ) {
          // parse date into timestamp
          return { ...rule, value: new Date(rule.value).getTime() / 1000 };
        }
        if (rule.field === 'FileInfo') {
          return {
            ...rule,
            field: 'FileInfo.' + rule.value,
            operator: '=',
            value: { $exists: true }
          };
        }
        if (
          fieldObject &&
          fieldObject.filter((f) => f.name == rule.field)[0].inputType ==
            'number'
        ) {
          return { ...rule, value: parseFloat(rule.value) };
        }
      }
      return rule;
    });
    return formatQuery({ ...query, rules }, 'mongodb_query');
  }

  function downloadObjectAsJson(exportObj: any, exportName: string) {
    var dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(exportObj, null, 2));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', exportName + '.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  const { width } = useWindowSize();

  const btns = (
    <>
      <Button
        className="w-full gap-1"
        onClick={() => {
          setQuery({
            combinator: 'and',
            rules: []
          });
          setMongoQueryObj(formatMongoQuery({ combinator: 'and', rules: [] }));
          reset();
        }}
        disabled={isMutating}
      >
        <div className="i-solar:restart-line-duotone size-4" />
        Reset
      </Button>
      {!!queryResult ? (
        <Button
          className="bg-green-4 hover:bg-green-5 w-full gap-1 text-black"
          onClick={() => {
            downloadObjectAsJson(
              queryResult,
              `${selectedPane}_samples_${format(new Date(), 'yyMMdd_HHmmss')}`
            );
          }}
        >
          <div className="i-solar:download-bold-duotone size-4" />
          Export
        </Button>
      ) : (
        <Button
          className="bg-yellow-4 hover:bg-yellow-5 w-full gap-1 text-black"
          onClick={trigger}
          disabled={isMutating}
        >
          <div className="i-solar:rocket-2-bold-duotone size-4" />
          Execute
        </Button>
      )}
    </>
  );

  return (
    <WaveLayout>
      <div className="flex h-full w-full flex-col items-center justify-center">
        <Tabs
          defaultValue="author"
          className="max-w-[min(98vw,600px)]"
          onValueChange={(pane) => {
            setSelectedPane(pane);
            setQuery({
              combinator: 'and',
              rules: []
            });
            setMongoQueryObj(
              formatMongoQuery({ combinator: 'and', rules: [] })
            );
            reset();
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="author" className="px-5">
                Authors
              </TabsTrigger>
              <TabsTrigger value="project" className="px-5">
                Projects
              </TabsTrigger>
            </TabsList>
            <Select onValueChange={(e) => setSampleNum(parseInt(e))}>
              <SelectTrigger>
                <SelectValue placeholder="# Samples" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            {width > 600 && btns}
          </div>
          {width <= 600 && (
            <div className="mt-2 flex flex-col items-center gap-2">{btns}</div>
          )}
          <TabsContent value="author">
            <div className="flex w-full flex-col gap-2">
              <QueryBuilderShadcnUi>
                <QueryBuilder
                  fields={authorFields}
                  query={query}
                  onQueryChange={(newQuery) => {
                    setQuery(newQuery);
                    setMongoQueryObj(formatMongoQuery(newQuery, authorFields));
                  }}
                  disabled={isMutating}
                />
              </QueryBuilderShadcnUi>
              <Card className="bg-foreground/5 h-[376px] w-[360px] w-full overflow-auto p-2">
                {isMutating ? (
                  <div className="flex h-full items-center justify-center gap-1">
                    <div className="i-line-md:loading-twotone-loop"></div>
                    <div> Loading ... </div>
                  </div>
                ) : (
                  <JsonView src={queryResult ? queryResult : mongoQueryObj} />
                )}
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="project">
            <div className="flex w-full flex-col gap-2">
              <QueryBuilderShadcnUi>
                <QueryBuilder
                  fields={projectFields}
                  query={query}
                  onQueryChange={(newQuery) => {
                    setQuery(newQuery);
                    setMongoQueryObj(formatMongoQuery(newQuery, projectFields));
                  }}
                />
              </QueryBuilderShadcnUi>
              <Card className="bg-foreground/5 h-[376px] w-[360px] w-full overflow-auto p-2">
                {isMutating ? (
                  <div className="flex h-full items-center justify-center gap-1">
                    <div className="i-line-md:loading-twotone-loop"></div>
                    <div> Loading ... </div>
                  </div>
                ) : (
                  <JsonView src={queryResult ? queryResult : mongoQueryObj} />
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </WaveLayout>
  );
}
