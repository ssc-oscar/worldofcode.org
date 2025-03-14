// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client';

export type Path =
  | `///`
  | `/auth/signin`
  | `/dashboard`
  | `/devdash`
  | `/devdash/:slug`
  | `/explore`
  | `/form`
  | `/lookup`
  | `/sample`;

export type Params = {
  '/devdash/:slug': { slug: string };
};

export type ModalPath = never;

export const { Link, Navigate } = components<Path, Params>();
export const { useModals, useNavigate, useParams } = hooks<
  Path,
  Params,
  ModalPath
>();
export const { redirect } = utils<Path, Params>();
