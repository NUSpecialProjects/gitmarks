import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/api/users";

/**
 * Provides the current authenticated user.
 * 
 * @returns The current user.
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await fetchCurrentUser();
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
    retry: false
  });
};
