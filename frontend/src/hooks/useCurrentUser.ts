import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/api/users";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    select: (data: IUserResponse) => data,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};
