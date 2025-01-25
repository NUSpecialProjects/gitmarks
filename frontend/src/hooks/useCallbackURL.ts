import { useQuery } from "@tanstack/react-query";
import { getCallbackURL } from "@/api/auth";

/**
 * Provides a callback URL for authentication.
 * 
 * @returns The callback URL for authentication.
 */
export function useCallbackURL() {
  return useQuery({
    queryKey: ['callback'],
    queryFn: async () => {
      const resp = await getCallbackURL();
      if (!resp.url) {
        throw new Error("Callback URL is empty");
      }
      return resp;
    },
    retry: false,
  });
}
