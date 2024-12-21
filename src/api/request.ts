import { BASE_URL } from '@/config.ts';
import axios, { type AxiosRequestConfig, type AxiosHeaders } from 'axios';
import type { HTTPValidationError, WocResponse } from '@/api/models.ts';

export async function request<T>(
  url: string,
  method?: string,
  data?: unknown,
  headers?: AxiosHeaders
): Promise<T> {
  const response = await axios.request<WocResponse<T>>({
    url,
    method: method,
    baseURL: BASE_URL,
    params: data,
    headers: headers
  });
  if (
    200 <= response.status &&
    response.status < 300 &&
    'data' in response.data
  ) {
    return response.data.data;
  } else if (response.status === 422) {
    // validation error
    const resp = response.data as unknown as HTTPValidationError;
    throw Error(JSON.stringify(resp.detail?.map((e) => e.msg).join(', ')));
  } else if (response.status === 401) {
    // TODO: token expired
    throw Error(
      JSON.stringify(
        'detail' in response.data ? response.data.detail : response.data
      )
    );
  } else {
    throw Error(
      JSON.stringify(
        'detail' in response.data ? response.data.detail : response.data
      )
    );
  }
}
