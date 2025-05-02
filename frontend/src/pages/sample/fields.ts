import {
  QueryBuilder,
  type RuleGroupType,
  type Field,
  defaultOperators,
  toFullOption,
  formatQuery
} from 'react-querybuilder';
import { MongoLanguage } from '@/api/mongo';

export const authorFields: Field[] = [
  {
    name: 'EarliestCommitDate',
    label: 'Earliest Commit Date',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    ),
    defaultOperator: '>=',
    inputType: 'date'
    // defaultValue: new Date(1700000000)
  },
  {
    name: 'LatestCommitDate',
    label: 'Latest Commit Date',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    ),
    defaultOperator: '<=',
    inputType: 'date'
    // defaultValue: new Date()
  },
  {
    name: 'AuthorID',
    label: 'Name and Email',
    inputType: 'string',
    defaultValue: ''
  },
  {
    name: 'Gender',
    label: 'Gender',
    operators: defaultOperators.filter((op) => op.name === '='),
    valueEditorType: 'radio',
    values: [
      { name: 'male', label: 'Male' },
      { name: 'female', label: 'Female' },
      { name: null, label: 'Unknown' }
    ]
  },
  {
    name: 'NumActiveMon',
    label: 'Active Months',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumAlias',
    label: 'Aliases',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumCommits',
    label: 'Commits',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumFiles',
    label: 'Created Files',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumOriginatingBlobs',
    label: 'Originating Blobs',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumProjects',
    label: 'Associated Projects',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  }
];

export const projectFields: Field[] = [
  {
    name: 'EarliestCommitDate',
    label: 'Earliest Commit Date',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    ),
    defaultOperator: '>=',
    inputType: 'date'
    // defaultValue: new Date(1700000000)
  },
  {
    name: 'LatestCommitDate',
    label: 'Latest Commit Date',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    ),
    defaultOperator: '<=',
    inputType: 'date'
    // defaultValue: new Date()
  },
  {
    name: 'ProjectID',
    label: 'Platform and Name',
    inputType: 'string',
    defaultValue: ''
  },
  {
    name: 'CommunitySize',
    label: 'Number of Core Contributors',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumActiveMon',
    label: 'Active Months',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumAuthors',
    label: 'Authors',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumBlobs',
    label: 'Blobs',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumCommits',
    label: 'Commits',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumFiles',
    label: 'Created Files',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumForks',
    label: 'Forks',
    inputType: 'number',
    defaultValue: 10,
    defaultOperator: '>=',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'FileInfo',
    label: 'Languages',
    inputType: 'radio',
    operators: defaultOperators.filter((op) => op.name === 'contains'),
    defaultOperator: 'contains',
    valueEditorType: 'select',
    values: [
      {
        name: MongoLanguage.IPython,
        label: 'IPython'
      },
      {
        name: MongoLanguage.Ruby,
        label: 'Ruby'
      },
      {
        name: MongoLanguage.TypeScript,
        label: 'TypeScript'
      },
      {
        name: MongoLanguage.SQL,
        label: 'SQL'
      },
      {
        name: MongoLanguage.Swift,
        label: 'Swift'
      },
      {
        name: MongoLanguage.Cobol,
        label: 'Cobol'
      },
      {
        name: MongoLanguage.OCaml,
        label: 'OCaml'
      },
      {
        name: MongoLanguage.Kotlin,
        label: 'Kotlin'
      },
      {
        name: MongoLanguage.Ada,
        label: 'Ada'
      },
      {
        name: MongoLanguage.Erlang,
        label: 'Erlang'
      },
      {
        name: MongoLanguage.Perl,
        label: 'Perl'
      },
      {
        name: MongoLanguage.Julia,
        label: 'Julia'
      },
      {
        name: MongoLanguage.FML,
        label: 'FML'
      },
      {
        name: MongoLanguage.Basic,
        label: 'Basic'
      },
      {
        name: MongoLanguage.Dart,
        label: 'Dart'
      },
      {
        name: MongoLanguage.C_CPP,
        label: 'C/C++'
      },
      {
        name: MongoLanguage.Lisp,
        label: 'Lisp'
      },
      {
        name: MongoLanguage.Java,
        label: 'Java'
      },
      {
        name: MongoLanguage.JavaScript,
        label: 'JavaScript'
      },
      {
        name: MongoLanguage.Other,
        label: 'Other'
      },
      {
        name: MongoLanguage.Python,
        label: 'Python'
      },
      {
        name: MongoLanguage.Clojure,
        label: 'Clojure'
      },
      {
        name: MongoLanguage.Rust,
        label: 'Rust'
      },
      {
        name: MongoLanguage.PHP,
        label: 'PHP'
      },
      {
        name: MongoLanguage.R,
        label: 'R'
      },
      {
        name: MongoLanguage.Go,
        label: 'Go'
      },
      {
        name: MongoLanguage.Fortran,
        label: 'Fortran'
      }
    ]
  }
];
