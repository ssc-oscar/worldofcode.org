import { getUser, updateUser } from '@/api/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export function useUser() {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await getUser();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5
  });

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user'], updatedUser);
    }
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isError: userQuery.isError,
    error: userQuery.error,
    updateUser: updateUserMutation.mutate,
    refreshUser: userQuery.refetch,
    isUpdating: updateUserMutation.isPending
  };
}
