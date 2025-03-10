import { BASE_URL } from '@/config.ts';
import axios, { type AxiosRequestConfig, type AxiosHeaders } from 'axios';

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
    headers: headers,
    timeout: 10000
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
export type WocResponse<T> = {
  data: T;
  errors?: Record<string, unknown>;
};

export type ResponseType<T> = WocResponse<T> | ValidationError;
export type HTTPValidationError = {
  detail?: ValidationError[];
};

export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};
