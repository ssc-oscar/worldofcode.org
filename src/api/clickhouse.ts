import { request } from './request.ts';

export type ClickhouseBlobDepsQuery = {
  start?: number;
  end?: number;
  limit?: number;
  offset?: number;
  blob?: string;
  language?: ClickhouseLanguage;
  author?: string;
  deps?: string;
  project?: string;
};

export type ClickhouseBlobDeps = {
  blob: string;
  commit: string;
  project: string;
  timestamp: number;
  author: string;
  language: ClickhouseLanguage;
  deps: string[];
};

export type ClickhouseCommitQuery = {
  start?: number;
  end?: number;
  limit?: number;
  offset?: number;
  author?: string;
  project?: string;
  comment?: string;
};

export type ClickhouseCommit = {
  hash: string;
  timestamp: number;
  tree: string;
  author: string;
  parent: string;
  comment: string;
  content: string;
};

export enum ClickhouseLanguage {
  Java = 'Java',
  Ruby = 'rb',
  CSharp = 'Cs',
  Perl = 'pl',
  Python = 'PY',
  Go = 'Go',
  Scala = 'Scala',
  JavaScript = 'JS',
  Fortran = 'F',
  Julia = 'jl',
  IPython = 'ipy',
  Rust = 'Rust',
  Dart = 'Dart',
  Kotlin = 'Kotlin',
  C_CPP = 'C',
  R = 'R',
  TypeScript = 'TypeScript'
}

export const getClickhouseCommit = async (
  q: ClickhouseCommitQuery
): Promise<ClickhouseCommit> =>
  await request<ClickhouseCommit>(
    '/clickhouse/commits',
    'GET',
    q,
    undefined,
    30000
  );

export const getClickhouseCommitCount = async (
  q: ClickhouseCommitQuery
): Promise<number> =>
  await request<number>('/clickhouse/commit/count', 'GET', q);

export const getClickhouseBlobDeps = async (
  q: ClickhouseBlobDepsQuery
): Promise<ClickhouseBlobDeps> =>
  await request<ClickhouseBlobDeps>('/clickhouse/deps', 'GET', q);

export const getClickhouseBlobDepsCount = async (
  q: ClickhouseBlobDepsQuery
): Promise<number> => await request<number>('/clickhouse/deps/count', 'GET', q);
