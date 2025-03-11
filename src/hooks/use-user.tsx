import { type User, getUser, updateUser } from '@/api/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// export function useUser() {
//   const queryClient = useQueryClient();

//   const userQuery = useQuery({
//     queryKey: ['user'],
//     queryFn: async () => {
//       try {
//         return await getUser();
//       } catch (error) {
//         if (error instanceof AxiosError && error.response?.status === 401) {
//           return null;
//         }
//         throw error;
//       }
//     },
//     staleTime: 1000 * 60 * 5
//   });

//   const updateUserMutation = useMutation({
//     mutationFn: updateUser,
//     onSuccess: (updatedUser) => {
//       queryClient.setQueryData(['user'], updatedUser);
//     }
//   });

//   return {
//     user: userQuery.data,
//     isLoading: userQuery.isLoading,
//     isError: userQuery.isError,
//     error: userQuery.error,
//     updateUser: updateUserMutation.mutate,
//     refreshUser: userQuery.refetch,
//     isUpdating: updateUserMutation.isPending
//   };
// }

interface UserStore {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  error: any;
  updateUser: (name: string) => Promise<void>;
  refreshUser: () => void;
  isUpdating: boolean;
}

export const useUserStore = create<UserStore, any>(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isError: false,
      error: null,
      updateUser: async (name: string) => {
        set({ isUpdating: true });
        try {
          const updatedUser = await updateUser(name);
          set({ user: updatedUser, isError: false, error: null });
        } catch (error) {
          set({ isError: true, error });
        } finally {
          set({ isUpdating: false });
        }
      },
      refreshUser: async () => {
        set({ isLoading: true });
        try {
          const user = await getUser();
          set({ user, isError: false, error: null });
        } catch (error) {
          set({ isError: true, error });
        } finally {
          set({ isLoading: false });
        }
      },
      isUpdating: false
    }),
    { name: 'user' }
  )
);
