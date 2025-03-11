import { BASE_URL } from '@/config.ts';
import axios, {
  type AxiosRequestConfig,
  type AxiosHeaders,
  AxiosError
} from 'axios';

export type WocResponse<T> = {
  data: T;
  errors?: Record<string, unknown>;
};

export type ResponseType<T> = WocResponse<T> | ValidationError;
export type HTTPValidationError = {
  detail?: ValidationError[];
};

export type WocError = {
  detail: string;
  status_code?: number;
};

export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export async function request<T>(
  url: string,
  method?: string,
  data?: unknown,
  headers?: AxiosHeaders
): Promise<T> {
  let _token = localStorage.getItem('token');
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const response = await axios.request<
    WocResponse<T> | HTTPValidationError | WocError
  >({
    url,
    method: method,
    baseURL: BASE_URL,
    params: data,
    headers: headers,
    timeout: 10000
  });
  if (!('data' in response.data)) {
    throw Error(
      `Failed to unpack WocResponse: ${JSON.stringify(response.data)}`
    );
  }
  return response.data.data;
}
