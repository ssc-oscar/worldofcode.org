import {
  QueryBuilder,
  type RuleGroupType,
  type Field,
  defaultOperators,
  toFullOption,
  formatQuery
} from 'react-querybuilder';

export const authorFields: Field[] = [
  {
    name: 'EarliestCommitDate',
    label: 'Earliest Commit Date',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    ),
    inputType: 'date'
    // defaultValue: new Date(1700000000)
  },
  {
    name: 'LatestCommitDate',
    label: 'Latest Commit Date',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    ),
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
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumAlias',
    label: 'Aliases',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumCommits',
    label: 'Commits',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumFiles',
    label: 'Created Files',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumOriginatingBlobs',
    label: 'Originating Blobs',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumProjects',
    label: 'Associated Projects',
    inputType: 'number',
    defaultValue: 10,
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
    inputType: 'date'
    // defaultValue: new Date(1700000000)
  },
  {
    name: 'LatestCommitDate',
    label: 'Latest Commit Date',
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    ),
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
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumActiveMon',
    label: 'Active Months',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumAuthors',
    label: 'Authors',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumBlobs',
    label: 'Blobs',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumCommits',
    label: 'Commits',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumFiles',
    label: 'Created Files',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  },
  {
    name: 'NumForks',
    label: 'Forks',
    inputType: 'number',
    defaultValue: 10,
    operators: defaultOperators.filter((op) =>
      ['=', '>', '<', '>=', '<='].includes(op.name)
    )
  }
];
