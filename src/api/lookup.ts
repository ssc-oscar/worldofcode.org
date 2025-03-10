import { request } from './request.ts';

export type ObjectName = 'blob' | 'commit' | 'tree';

type LookupGitObject = {
  hash: string;
};
type LookupNamedObject = {
  name: string;
};

export type LookupCommit = LookupGitObject & {
  tree: string;
  parent: string;
  author: string;
  authored_at: Date;
  committer: string;
  committed_at: Date;
  message: string;
};

export type LookupAuthor = LookupNamedObject & {
  author_name: string;
  email: string;
};

export type LookupFile = LookupGitObject &
  LookupNamedObject & {
    mode: string;
  };

export type LookupTree = LookupFile & {
  entries: Array<LookupFile | LookupTree> | undefined;
};

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
    authored_at: new Date(parseInt(author_timestamp) * 1000),
    committer,
    committed_at: new Date(parseInt(committer_timestamp) * 1000),
    message
  };
};

export const getBlob = async (key: string): Promise<string> =>
  await request<string>(`/lookup/object/blob/${key}`, 'GET');

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
    console.assert(
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

export const getValue = async (map: string, key: string): Promise<unknown> => {
  const resp = await request<string>(`/lookup/map/${map}/${key}`, 'GET');
  return resp;
};

export const getMapNames = async (): Promise<string[]> => {
  const resp = await request<string[]>('/lookup/map', 'GET');
  return resp;
};
