import { useState, useContext, useEffect, useCallback, createContext, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";

import { logout as logoutApi } from "@/api/auth";
import { SelectedClassroomContext } from "./selectedClassroom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { NavigateFunction } from "react-router-dom";

/**
 * The possible authentication states for a user.
 */
export enum AuthState {
  LOGGING_IN = "LOGGING_IN",
  LOGGED_IN = "LOGGED_IN",
  LOGGED_OUT = "LOGGED_OUT",
}

interface AuthContextType {
  currentUser: IUserResponse | null;
  authState: AuthState;
  loading: boolean;
  error: Error | null;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provides the authentication context.
 * 
 * @param children - The children to render.
 * @returns The authentication context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOGGING_IN);
  const { setSelectedClassroom } = useContext(SelectedClassroomContext);
  const { data: user, status, refetch, error } = useCurrentUser();

  useEffect(() => {
    switch (status) {
      case 'pending':
        setAuthState(AuthState.LOGGING_IN);
        break;
      case 'error':
        setAuthState(AuthState.LOGGED_OUT);
        break;
      case 'success':
        if (user) {
          setAuthState(AuthState.LOGGED_IN);
        } else {
          setAuthState(AuthState.LOGGED_OUT);
        }
        break;
    }
  }, [user, status]);

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      setSelectedClassroom(null);
      setAuthState(AuthState.LOGGED_OUT);
    },
    retry: false
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const value = {
    currentUser: user || null,
    authState,
    loading: status === 'pending',
    error,
    logout,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Provides the authentication context.
 * 
 * @returns The authentication context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Navigates to the redirect URL and clears it.
 * 
 * @param navigate - The navigation function.
 */
export const goToRedirectUrl = (navigate: NavigateFunction) => {
  const redirectUrl = getRedirectUrl();
  if (redirectUrl) {
    clearRedirectUrl();
    navigate(redirectUrl, { replace: true });
  }
}

/**
 * Sets the redirect URL to the current location.
 */
export const setRedirectUrl = () => {
  const currentUrl = location.pathname + location.search + location.hash;
  if (!currentUrl.startsWith('/oauth')) {
    localStorage.setItem("redirectAfterLogin", currentUrl);
  }
}

/**
 * Gets the redirect URL from local storage.
 * 
 * @returns The redirect URL.
 */
export const getRedirectUrl = () => localStorage.getItem("redirectAfterLogin");

/**
 * Clears the redirect URL from local storage.
 */
const clearRedirectUrl = () => localStorage.removeItem("redirectAfterLogin");
