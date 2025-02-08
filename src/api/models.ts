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

export type HTTPValidationError = {
  detail?: ValidationError[];
};

export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

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

export type WocResponse<T> = {
  data: T;
  errors?: Record<string, unknown>;
};

export type ResponseType<T> = WocResponse<T> | ValidationError;
