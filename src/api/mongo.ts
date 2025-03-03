import type {
  MongoAuthor,
  MongoAPI,
  MongoLanguage,
  MongoProject
} from '@/api/models.ts';
import { request } from './request.ts';

export type ValueCommitRoot = [string, number];
export type ValueFirstAuthor = [string, string, string];

export function getAuthor(author: string) {
  return request<MongoAuthor>(`/mongo/author/${author}`);
}

export function searchAuthor(author: string, limit: number = 10) {
  return request<MongoAuthor[]>(
    `/mongo/author/search?author=${author}&limit=${limit}`
  );
}

export function sampleAuthor(
  filter: Record<string, string>,
  limit: number = 10
) {
  return request<MongoAuthor[]>(
    `/mongo/author/sample?limit=${limit}&${new URLSearchParams(filter).toString()}`
  );
}

export function getProject(project: string) {
  return request<MongoProject>(`/mongo/project/${project}`);
}

export function searchProject(project: string, limit: number = 10) {
  return request<MongoProject[]>(
    `/mongo/project/search?project=${project}&limit=${limit}`
  );
}

export function sampleProject(
  filter: Record<string, string>,
  limit: number = 10
) {
  return request<MongoProject[]>(
    `/mongo/project/sample?limit=${limit}&${new URLSearchParams(filter).toString()}`
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
    `/mongo/api/sample?limit=${limit}&${new URLSearchParams(filter).toString()}`
  );
}
