import type { LookupCommit, LookupTree } from '@/api/models.ts';
import { useQuery } from '@tanstack/react-query';
import { request } from './request.ts';
import { assert } from 'console';

export type ValueCommitRoot = [string, number];
export type ValueFirstAuthor = [string, string, string];

export const getCommit = async (key: string): Promise<LookupCommit> => {
  const [
    tree,
    parent,
    [author, author_timestamp, author_timezone],
    [committer, committer_timestamp, committer_timezone],
    message
  ] = await request<
    [string, string, [string, string, string], [string, string, string], string]
  >(`/lookup/object/commit/${key}`, 'GET');
  return {
    hash: key,
    tree,
    parent,
    author,
    authored_at: new Date(author_timestamp + ' ' + author_timezone),
    committer,
    committed_at: new Date(committer_timestamp + ' ' + committer_timezone),
    message
  };
};

export const useGetCommit = (key: string) =>
  useQuery({
    queryKey: ['commit', key],
    queryFn: async () => getCommit(key),
    enabled: !!key
  });

export const getBlob = async (key: string): Promise<string> =>
  await request<string>(`/lookup/object/blob/${key}`, 'GET');

export const useGetBlob = (key: string) =>
  useQuery({
    queryKey: ['blob', key],
    queryFn: async () => getBlob(key),
    enabled: !!key
  });

type RawTreeEntry = Array<[string, string, string | RawTreeEntry]>;
const decodeTreeEntry = (
  name: string,
  hash: string,
  entry: RawTreeEntry
): LookupTree => {
  const _tree: LookupTree = {
    mode: '40000',
    hash,
    name,
    entries: []
  };
  for (const [mode, name, hashOrTree] of entry) {
    if (mode != '40000' && typeof hashOrTree === 'string') {
      // a file, a submodule, or an unexplored tree
      _tree.entries?.push({
        mode,
        hash: hashOrTree,
        name
      });
    } else if (mode == '40000' && Array.isArray(hashOrTree)) {
      // an explored tree
      _tree.entries?.push(decodeTreeEntry(name, hash, hashOrTree));
    }
    // shall never happen
    assert(
      false,
      `Invalid tree entry${JSON.stringify([mode, name, hashOrTree])}`
    );
  }
  return _tree;
};

export const getTree = async (
  key: string,
  traverse: boolean
): Promise<LookupTree> => {
  const resp = await request<RawTreeEntry>(
    `/lookup/object/tree/${key}`,
    'GET',
    { traverse }
  );
  return decodeTreeEntry('', key, resp);
};

export const useGetTree = (key: string, traverse: boolean) =>
  useQuery({
    queryKey: ['tree', key, traverse],
    queryFn: async () => getTree(key, traverse),
    enabled: !!key
  });

export const getValue = async (map: string, key: string): Promise<unknown> => {
  const resp = await request<string>(`/lookup/map/${map}/${key}`, 'GET');
  return resp;
};

export const useGetValue = (map: string, key: string) =>
  useQuery({
    queryKey: ['value', map, key],
    queryFn: async () => getValue(map, key),
    enabled: !!map && !!key
  });
