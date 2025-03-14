import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WaveLayout from '@/layouts/wave-layout';
import { useEffect, useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
import {
  getMapNames,
  getValue,
  getCommit,
  getBlob,
  getTree
} from '@/api/lookup';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import '@/styles/search-button.css';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import {
  getProject,
  getAPI,
  getAuthor,
  searchProject,
  searchAuthor
} from '@/api/mongo';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

function getExampleSha(map: string) {
  if (map === 'author_email') {
    return 'audris@mockus.org';
  } else if (map === 'author') {
    return 'Audris Mockus';
  } else if (map.toLowerCase() == 'api') {
    return 'C:ASIOCodec.h';
  } else if (map.startsWith('b') || map.startsWith('obb')) {
    return '05fe634ca4c8386349ac519f899145c75fff4169';
  } else if (map.startsWith('c')) {
    return 'e4af89166a17785c1d741b8b1d5775f3223f510f';
  } else if (map.toLowerCase().startsWith('a')) {
    return 'Audris Mockus <audris@mockus.org>';
  } else if (map.toLowerCase().startsWith('p')) {
    return 'ArtiiQ_PocketMine-MP';
  } else if (map === 'tree') {
    return '706aa4dedb560358bff21c3120a0b09532d3484d';
  } else {
    return '';
  }
}

function RenderedResults({
  map,
  result,
  error,
  loading
}: {
  map: string;
  result: any;
  error?: Error;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-1">
        <div className="i-line-md:loading-twotone-loop"></div>
        <div> Loading ... </div>
      </div>
    );
  }
  if (error) {
    let auxmsg = '';
    if (error instanceof AxiosError) {
      if (error.response?.data?.detail) {
        auxmsg = error.response.data.detail;
      } else if (error.response?.data) {
        auxmsg = error.response.data;
      }
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <div className="flex items-center gap-1">
          <div className="i-fluent-emoji-flat:warning color-error" />
          <div> {error.message} </div>
        </div>
        {auxmsg && <div className="text-xs opacity-50"> {auxmsg} </div>}
      </div>
    );
  }
  if (!map || !result) {
    return (
      <div className="flex h-full items-center justify-center gap-1">
        <div className="i-fluent-emoji-flat:magnifying-glass-tilted-right color-accent"></div>
        <div> Press Query. </div>
      </div>
    );
  }
  if (map == 'blob') {
    return <pre className="text-sm">{result}</pre>;
  }
  return <JsonView src={result} className="text-sm" />;
}

export function QueryTabs() {
  // const useMapNames = () =>
  //   useQuery({
  //     queryKey: ['map-names'],
  //     queryFn: getMapNames
  //   });

  // const { data: mapNames, error: mapError, isLoading } = useMapNames();
  const {
    data: mapNames,
    error: mapError,
    isLoading
  } = useSWR('/map/names', getMapNames);

  const [mapName, setMapName] = useState<string>('');
  const [mapSha, setMapSha] = useState<string>('');
  const [defaultMapSha, setDefaultMapSha] = useState<string>('');

  useEffect(() => {
    setDefaultMapSha(getExampleSha(mapName));
  }, [mapName]);

  // const useGetResults = (map: string, key: string) =>
  //   useQuery({
  //     queryKey: ['value', map, key],
  //     queryFn: async () => {
  //       if (map === 'api') {
  //         return getAPI(key);
  //       } else if (map === 'author') {
  //         return getAuthor(key);
  //       } else if (map === 'project') {
  //         return getProject(key);
  //       } else if (map === 'blob') {
  //         return getBlob(key);
  //       } else if (map === 'commit') {
  //         return getCommit(key);
  //       } else if (map === 'tree') {
  //         return getTree(key, true);
  //       } else {
  //         return getValue(map, key);
  //       }
  //     },
  //     enabled: false
  //   });

  // const {
  //   data: queryData,
  //   refetch: fetchData,
  //   error: queryError,
  //   isLoading: isQueryLoading
  // } = useGetResults(mapName, mapSha || defaultMapSha);

  const getQueryResults = async (map: string, key: string) => {
    if (map === 'api') {
      return getAPI(key);
    } else if (map === 'author') {
      return searchAuthor(key);
    } else if (map === 'author_email') {
      return searchAuthor(key, 10, 'email');
    } else if (map === 'project') {
      return searchProject(key);
    } else if (map === 'blob') {
      return getBlob(key);
    } else if (map === 'commit') {
      return getCommit(key);
    } else if (map === 'tree') {
      return getTree(key, true);
    } else {
      return getValue(map, key);
    }
  };

  const useQueryResults = (mapName: string, mapSha: string) =>
    useSWRMutation(`/lookup/${mapName}/${mapSha}`, () =>
      getQueryResults(mapName, mapSha)
    );

  const {
    data: queryData,
    error: queryError,
    isMutating: isQueryLoading,
    trigger: fetchData
  } = useQueryResults(mapName, mapSha || defaultMapSha);

  const doFetchData = async () => {
    if (!mapSha && defaultMapSha) {
      setMapSha(defaultMapSha);
    }
    await fetchData();
  };

  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-5 p-3">
      <Tabs
        defaultValue="getValues"
        className="w-[360px]"
        onValueChange={() => setMapSha('')}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="showCnt">showCnt</TabsTrigger>
          <TabsTrigger value="entity">showEnt</TabsTrigger>
          <TabsTrigger value="getValues">getValues</TabsTrigger>
        </TabsList>
        <TabsContent value="showCnt">
          <Card>
            <CardHeader>
              <CardTitle>Show Content</CardTitle>
              <CardDescription>
                Display the content of Git objects, such as blobs, commits, and
                trees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="type">Object</Label>
                <Select onValueChange={(e) => setMapName(e)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a map ..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blob">Blob</SelectItem>
                    <SelectItem value="commit">Commit</SelectItem>
                    <SelectItem value="tree">Tree</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">Hash</Label>
                <Input
                  id="username"
                  type="search"
                  placeholder={defaultMapSha}
                  value={mapSha}
                  onChange={(e) => setMapSha(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => doFetchData()}>Query</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="getValues">
          <Card>
            <CardHeader>
              <CardTitle>Get Values</CardTitle>
              <CardDescription>
                Retrieve the relationships between entities in the World of Code
                dataset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="current">
                  <div className="flex items-center gap-0.5 py-[5px]">Map</div>
                </Label>
                <Select
                  disabled={isLoading || mapError != null}
                  onValueChange={(e) => setMapName(e)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoading
                          ? 'Loading available maps ...'
                          : (mapError?.message ?? 'Select a map ...')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {mapNames?.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="new">Hash or Name</Label>
                <Input
                  id="new"
                  type="search"
                  placeholder={defaultMapSha}
                  value={mapSha}
                  onChange={(e) => setMapSha(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => doFetchData()}>Query</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="entity">
          <Card>
            <CardHeader>
              <CardTitle>Show Entity</CardTitle>
              <CardDescription>
                Retrieve the attributes of an entity (Author, Project, API) in
                the World of Code dataset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="type">Entity</Label>
                <Select
                  disabled={isLoading || mapError != null}
                  onValueChange={(e) => setMapName(e)}
                >
                  <Select onValueChange={(e) => setMapName(e)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an entity ..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="author">Author (by Name)</SelectItem>
                      <SelectItem value="author_email">
                        Author (by Email)
                      </SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="new">Name</Label>
                <Input
                  id="new"
                  type="search"
                  placeholder={defaultMapSha}
                  value={mapSha}
                  onChange={(e) => setMapSha(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => doFetchData()}>Query</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="bg-foreground/5 h-[376px] w-[360px] overflow-auto p-2">
        <RenderedResults
          map={mapName}
          loading={isQueryLoading}
          result={queryData}
          error={queryError}
        />
      </Card>
    </div>
  );
}

export default function Lookup() {
  return (
    <WaveLayout>
      <QueryTabs />
    </WaveLayout>
  );
}
