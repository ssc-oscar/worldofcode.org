import { request } from './request.ts';

export type MongoAPI = {
  API: string;
  EarliestCommitDate: number;
  FileInfo: Record<MongoLanguage, number>;
  LatestCommitDate: number;
  NumAuthors: number;
  NumCommits: number;
  NumProjects: number;
};

export type MongoAuthor = {
  Alias: string[];
  AuthorID: string;
  EarliestCommitDate: number;
  FileInfo: Record<MongoLanguage, number>;
  Gender?: string | null;
  LatestCommitDate: number;
  MonNcm: Record<string, number>;
  MonNprj: Record<string, number>;
  NumActiveMon: number;
  NumAlias: number;
  NumCommits: number;
  NumFiles: number;
  NumOriginatingBlobs: number;
  NumProjects: number;
};

export enum MongoLanguage {
  IPython = 'ipy',
  Ruby = 'Ruby',
  TypeScript = 'TypeScript',
  SQL = 'Sql',
  Swift = 'Swift',
  Cobol = 'Cobol',
  OCaml = 'OCaml',
  Kotlin = 'Kotlin',
  Ada = 'Ada',
  Erlang = 'Erlang',
  Perl = 'Perl',
  Julia = 'Julia',
  FML = 'fml',
  Basic = 'Basic',
  Dart = 'Dart',
  C_CPP = 'C/C++',
  Lisp = 'Lisp',
  Java = 'Java',
  JavaScript = 'JavaScript',
  Other = 'other',
  Python = 'Python',
  Clojure = 'Clojure',
  Rust = 'Rust',
  PHP = 'PHP',
  R = 'R',
  Go = 'Go',
  Fortran = 'Fortran',
  Lua = 'Lua',
  Scala = 'Scala'
}

export type MongoProject = {
  CommunitySize: number;
  Core: Record<string, unknown>;
  EarliestCommitDate: number;
  FileInfo: Record<MongoLanguage, number>;
  LatestCommitDate: number;
  MonNauth: Record<string, number>;
  MonNcm: Record<string, number>;
  NumActiveMon: number;
  NumAuthors: number;
  NumBlobs: number;
  NumCommits: number;
  NumCore: number;
  NumFiles: number;
  NumForks: number;
  NumProjects: number;
  ProjectID: string;
};

export function getAuthor(author: string) {
  return request<MongoAuthor>(`/mongo/author/${author}`);
}

export function searchAuthor(
  author: string,
  limit: number = 10,
  by: 'author' | 'email' = 'author'
) {
  if (by === 'email') {
    return request<MongoAuthor[]>(
      `/mongo/author/search?q=${author}&limit=${limit}&by=email`
    );
  }
  return request<MongoAuthor[]>(
    `/mongo/author/search?q=${author}&limit=${limit}`
  );
}

export function sampleAuthor(
  filter: Record<string, string>,
  limit: number = 10
) {
  return request<MongoAuthor[]>(
    `/mongo/author/sample?limit=${limit}&filter=${JSON.stringify(filter)}`,
    'GET',
    undefined,
    undefined,
    30000
  );
}

export function getProject(project: string) {
  return request<MongoProject>(`/mongo/project/${project}`);
}

export function searchProject(project: string, limit: number = 10) {
  return request<MongoProject[]>(
    `/mongo/project/search?q=${project}&limit=${limit}`
  );
}

export function sampleProject(
  filter: Record<string, string>,
  limit: number = 10
) {
  return request<MongoProject[]>(
    `/mongo/project/sample?limit=${limit}&filter=${JSON.stringify(filter)}`,
    'GET',
    undefined,
    undefined,
    30000
  );
}

export function getAPI(api: string) {
  return request<MongoAPI>(`/mongo/api/${api}`);
}

export function searchAPI(api: string, limit: number = 10) {
  return request<MongoAPI[]>(`/mongo/api/search?api=${api}&limit=${limit}`);
}

export function sampleAPI(filter: Record<string, string>, limit: number = 10) {
  return request<MongoAPI[]>(
    `/mongo/api/sample?limit=${limit}&filter=${JSON.stringify(filter)}`,
    'GET',
    undefined,
    undefined,
    30000
  );
}
