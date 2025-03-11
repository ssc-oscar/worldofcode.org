import { AxiosError } from 'axios';
import type { Toast } from '@/hooks/use-toast';

export function parseError(error: Error): Toast {
  console.error(error);
  let error_title = 'Error';
  let error_msg = 'Unknown error';
  if (error instanceof AxiosError) {
    error_title = error.message;
    if ('response' in error && error.response) {
      if ('detail' in error.response.data) {
        // 422
        if (error.response.status === 422) {
          error_msg = error.response.data.detail
            .map((e: any) => e.msg)
            .join(', ');
        } else {
          error_msg = error.response.data.detail;
        }
      } else {
        error_msg = error.response.data;
      }
    }
  } else {
    error_msg = 'message' in Error ? error.message : String(error);
  }
  error_msg = String(error_msg);
  if (error_msg.length > 500) {
    error_msg = error_msg.slice(0, 500) + '...';
  }
  return {
    title: error_title,
    description: error_msg,
    variant: 'destructive'
  };
}
