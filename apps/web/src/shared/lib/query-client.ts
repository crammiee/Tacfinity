import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          return error.status >= 500 && failureCount < 3; // only retry 5xx, not 4xx
        }
        return failureCount < 3;
      },
    },
  },
});
