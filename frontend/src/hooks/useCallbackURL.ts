import { useQuery } from "@tanstack/react-query";
import { getCallbackURL, sendCode } from "@/api/auth";
import { useEffect, useRef } from "react";
import { useState } from "react";

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

/**
 * Sends an authentication code after returning from the auth callback URL.
 * 
 * @param code - The code to send.
 * @param onSuccess - The function to call on success.
 * @param onError - The function to call on error.
 * @returns The loading state.
 */
export function useAuthCallback(code: string | null, onSuccess: () => void, onError: (err: Error) => void): boolean {
  const [isLoading, setIsLoading] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return; // prevent multiple executions
    hasRun.current = true;

    // Error if no code provided
    if (!code) {
      onError(new Error("No login code provided"));
      return;
    }

    sendCode(code)
      .then(() => {
        onSuccess();
        setIsLoading(false);
      })
      .catch((err: Error) => {
        onError(err);
      });
  }, [code]);

  return isLoading;
}
