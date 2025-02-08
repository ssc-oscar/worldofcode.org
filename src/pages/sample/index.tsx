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
import { useGetValue, useMapNames } from '@/api/lookup';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getValue, getCommit, getBlob, getTree } from '@/api/lookup';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import '@/styles/search-button.css';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';

function getExampleSha(map: string) {
  if (map.startsWith('b') || map.startsWith('obb')) {
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
  error
}: {
  map: string;
  result: any;
  error?: Error;
}) {
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

export function TabsDemo() {
  const { data: mapNames, error: mapError, isLoading } = useMapNames();

  const [mapName, setMapName] = useState<string>('');
  const [mapSha, setMapSha] = useState<string>('');
  const [defaultMapSha, setDefaultMapSha] = useState<string>('');

  useEffect(() => {
    setDefaultMapSha(getExampleSha(mapName));
  }, [mapName]);

  const useGetResults = (map: string, key: string) =>
    useQuery({
      queryKey: ['value', map, key],
      queryFn: async () => {
        if (map === 'blob') {
          return getBlob(key);
        } else if (map === 'commit') {
          return getCommit(key);
        } else if (map === 'tree') {
          return getTree(key, true);
        } else {
          return getValue(map, key);
        }
      },
      enabled: false
    });

  const {
    data: queryData,
    refetch: fetchData,
    error: queryError
  } = useGetResults(mapName, mapSha || defaultMapSha);
  const doFetchData = async () => {
    if (!mapSha && defaultMapSha) {
      setMapSha(defaultMapSha);
    }
    await fetchData();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-5"></div>
  );
}

export default function Lookup() {
  return (
    <WaveLayout>
      <TabsDemo />
    </WaveLayout>
  );
}
