import {
  X,
  Copy,
  Unlock,
  Lock,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import type {
  Classnames,
  Controls,
  FullField,
  Translations
} from 'react-querybuilder';
import { getCompatContextProvider } from 'react-querybuilder';
import { ShadcnUiActionElement } from './action-element';
import { ShadcnUiActionElementIcon } from './action-element-icon';
import { ShadcnUiValueEditor } from './value-editor';
import { ShadcnUiValueSelector } from './value-selector';
import { ShadcnUiNotToggle } from './not-toggle';
import { ShadcnUiDragHandle } from './drag-handle';

import './styles.css';

export * from './action-element';
export * from './value-selector';

export const shadcnUiControlClassnames = {
  ruleGroup: 'rounded-lg shadow-sm border bg-background'
} satisfies Partial<Classnames>;

export const shadcnUiControlElements = {
  actionElement: ShadcnUiActionElement,
  removeGroupAction: ShadcnUiActionElementIcon,
  removeRuleAction: ShadcnUiActionElementIcon,
  valueSelector: ShadcnUiValueSelector,
  valueEditor: ShadcnUiValueEditor,
  notToggle: ShadcnUiNotToggle,
  dragHandle: ShadcnUiDragHandle
} satisfies Partial<Controls<FullField, string>>;

export const shadcnUiTranslations = {
  addRule: {
    label: (
      <>
        <Plus className="mr-2 h-4 w-4" /> Rule
      </>
    )
  },
  addGroup: {
    label: (
      <>
        <Plus className="mr-2 h-4 w-4" /> Group
      </>
    )
  },
  removeGroup: { label: <X className="h-4 w-4" /> },
  removeRule: { label: <X className="h-4 w-4" /> },
  cloneRuleGroup: { label: <Copy className="h-4 w-4" /> },
  cloneRule: { label: <Copy className="h-4 w-4" /> },
  lockGroup: { label: <Unlock className="h-4 w-4" /> },
  lockRule: { label: <Unlock className="h-4 w-4" /> },
  lockGroupDisabled: { label: <Lock className="h-4 w-4" /> },
  lockRuleDisabled: { label: <Lock className="h-4 w-4" /> },
  shiftActionDown: { label: <ChevronDown className="h-4 w-4" /> },
  shiftActionUp: { label: <ChevronUp className="h-4 w-4" /> }
} satisfies Partial<Translations>;

export const QueryBuilderShadcnUi = getCompatContextProvider({
  key: 'shadcn/ui',
  controlClassnames: shadcnUiControlClassnames,
  controlElements: shadcnUiControlElements,
  translations: shadcnUiTranslations
});
