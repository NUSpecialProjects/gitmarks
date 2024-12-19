import { useState, createContext, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { logout as logoutApi } from "@/api/auth";
import { SelectedClassroomContext } from "./selectedClassroom";
import { fetchCurrentUser } from "@/api/users";

interface IAuthContext {
  currentUser: IGitHubUser | null;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<IAuthContext>({
  currentUser: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { setSelectedClassroom } = useContext(SelectedClassroomContext);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    select: (data: IUserResponse) => {
      return data;
    },
    retry: false,
    staleTime: 0, 
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      setSelectedClassroom(null);
      setIsLoggedIn(false);
    },
    retry: false // Don't retry logout operations
  });

  const login = () => {
    setIsLoggedIn(true);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser: user?.github_user || null, 
        isLoggedIn, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
