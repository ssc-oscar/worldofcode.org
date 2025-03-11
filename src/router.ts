// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client';

export type Path =
  | `///`
  | `/auth/signin`
  | `/dashboard`
  | `/dashboard/components/overview`
  | `/dashboard/components/recent-sales`
  | `/form`
  | `/lookup`
  | `/sample`
  | `/sample/ch-table`
  | `/students`
  | `/students/StudentDetailPage`
  | `/students/components/bio`
  | `/students/components/count-card`
  | `/students/components/feed`
  | `/students/components/interest-channel`
  | `/students/components/parent-detail-card`
  | `/students/components/student-feed-table`
  | `/students/components/student-feed-table/cell-action`
  | `/students/components/student-feed-table/columns`
  | `/students/components/student-feed-table/student-table-action`
  | `/students/components/student-forms/student-create-form`
  | `/students/components/students-table`
  | `/students/components/students-table/cell-action`
  | `/students/components/students-table/columns`
  | `/students/components/students-table/student-table-action`
  | `/students/components/time-spent-card`;

export type Params = {};

export type ModalPath = never;

export const { Link, Navigate } = components<Path, Params>();
export const { useModals, useNavigate, useParams } = hooks<
  Path,
  Params,
  ModalPath
>();
export const { redirect } = utils<Path, Params>();
