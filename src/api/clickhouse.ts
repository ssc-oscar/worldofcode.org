import {
  ClickhouseBlobDeps,
  ClickhouseCommit,
  ClickhouseCommitQuery,
  ClickhouseBlobDepsQuery
} from '@/api/models.ts';
import { useQuery } from '@tanstack/react-query';
import { request } from './request.ts';

export const getClickhouseCommit = async (
  q: ClickhouseCommitQuery
): Promise<ClickhouseCommit> =>
  await request<ClickhouseCommit>('/clickhouse/commit', 'GET', q);

export const useGetClickhouseCommit = (q: ClickhouseCommitQuery) =>
  useQuery({
    queryKey: ['commit', q],
    queryFn: async () => getClickhouseCommit(q),
    enabled: !!q
  });

export const getClickhouseCommitCount = async (
  q: ClickhouseCommitQuery
): Promise<number> =>
  await request<number>('/clickhouse/commit/count', 'GET', q);

export const useGetClickhouseCommitCount = (q: ClickhouseCommitQuery) =>
  useQuery({
    queryKey: ['commit', q],
    queryFn: async () => getClickhouseCommitCount(q),
    enabled: !!q
  });

export const getClickhouseBlobDeps = async (
  q: ClickhouseBlobDepsQuery
): Promise<ClickhouseBlobDeps> =>
  await request<ClickhouseBlobDeps>('/clickhouse/deps', 'GET', q);

export const useGetClickhouseBlobDeps = (q: ClickhouseBlobDepsQuery) =>
  useQuery({
    queryKey: ['deps', q],
    queryFn: async () => getClickhouseBlobDeps(q),
    enabled: !!q
  });

export const getClickhouseBlobDepsCount = async (
  q: ClickhouseBlobDepsQuery
): Promise<number> => await request<number>('/clickhouse/deps/count', 'GET', q);

export const useGetClickhouseBlobDepsCount = (q: ClickhouseBlobDepsQuery) =>
  useQuery({
    queryKey: ['deps', q],
    queryFn: async () => getClickhouseBlobDepsCount(q),
    enabled: !!q
  });
