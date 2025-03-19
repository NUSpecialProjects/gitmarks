import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentClassroomUser, getClassroomUsers } from "@/api/classrooms";
import { ClassroomRole, ClassroomUserStatus, requireAtLeastClassroomRole } from "@/types/enums";
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { sendOrganizationInviteToUser, revokeOrganizationInvite, removeUserFromClassroom } from "@/api/classrooms";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Provides the currently selected classroom based on the selected classroom cookie.
 * 
 * @returns The currently selected classroom.
 */
export function useCurrentClassroom() {
  const context = useContext(SelectedClassroomContext);
  if (context === null) {
    throw new Error('useCurrentClassroom must be used within a SelectedClassroomProvider');
  }
  return context;
}

/**
 * Provides the currently selected classroom user.
 * Optionally redirects the user if they do not have the required role.
 * 
 * @param requiredRole - (Optional) The role required to access the page.
 * @param redirectPath - (Optional) The path to redirect to if the user does not have the required role.
 * @returns The currently selected classroom user.
 */
export function useClassroomUser(requiredRole?: ClassroomRole, redirectPath?: string) {
  const context = useContext(SelectedClassroomContext);
  if (context === null) {
    throw new Error('useClassroomUser must be used within a SelectedClassroomProvider');
  }

  const classroomId = context.selectedClassroom?.id;

  const navigate = useNavigate();
  const { error: currentUserError } = useCurrentUser();

  const { data: classroomUser, error, status } = useQuery({
    queryKey: ['classroomUser', classroomId],
    queryFn: async () => {
      if (!classroomId) return null;
      try {
        const classroomUser = await getCurrentClassroomUser(classroomId);
        if (requiredRole && redirectPath) {
          if (classroomUser.classroom_id !== classroomId) {
            throw new Error("User is not in the specified classroom");
          }
          if (classroomUser.status !== ClassroomUserStatus.ACTIVE) {
            throw new Error("User is not active in this classroom");
          }
          if (requiredRole && !requireAtLeastClassroomRole(classroomUser.classroom_role, requiredRole)) {
            throw new Error("User does not have the required role");
          }
        }
        return classroomUser;
      } catch (error) {
        if (requiredRole && redirectPath) {
          navigate(redirectPath, { replace: true });
          return null;
        }
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    enabled: !!classroomId,
    retry: false
  });

  return { 
    classroomUser: classroomUser || null, 
    error: error || currentUserError,
    status: status,
    loading: status === "pending"
  };
}

/**
 * Provides the list of classroom users.
 * 
 * @param classroomId - The ID of the classroom to fetch users for.
 * @returns The list of classroom users.
 */
export function useClassroomUsersList(classroomId: number | undefined) {
  const { data: classroomUsers, error, isLoading } = useQuery({
    queryKey: ['classroomUsers', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      return await getClassroomUsers(classroomId);
    },
    enabled: !!classroomId
  });

  return { 
    classroomUsers: classroomUsers || [], 
    error: error as Error | null,
    loading: isLoading 
  };
}

function removeFromSet(set: Set<number>, value: number) {
  const newSet = new Set(set);
  newSet.delete(value);
  return newSet;
}

/**
 * Provides a function to invite a user to the classroom.
 * 
 * @param classroomId - The ID of the classroom to invite the user to.
 * @returns The function to invite a user to the classroom.
 */
export function useInviteClassroomUser(classroomId: number | undefined) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const inviteUser = async (userId: number, roleType: ClassroomRole, setLoadingUserIds: (cb: (prev: Set<number>) => Set<number>) => void) => {
    try {
      setLoadingUserIds(prev => new Set(prev).add(userId));
      const response = await sendOrganizationInviteToUser(classroomId!, roleType, userId);
      queryClient.setQueryData(
        ['classroomUsers', classroomId],
        (oldData: IClassroomUser[] = []) => {
          return oldData.map(user => 
            user.id === response.user.id ? response.user : user
          );
        }
      );
      setError(null);
      return response;
    } catch (error) {
      setError("Failed to invite user. Please try again.");
      throw error; // throws the error so it can be handled at the component/page level
    } finally {
      setLoadingUserIds(prev => {
        return removeFromSet(prev, userId);
      });
    }
  };

  return { inviteUser, error };
}

/**
 * Provides a function to revoke an invite to a user.
 * 
 * @param classroomId - The ID of the classroom to revoke the invite from.
 * @returns The function to revoke an invite to a user.
 */
export function useRevokeClassroomInvite(classroomId: number | undefined) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const revokeInvite = async (userId: number, setLoadingUserIds: (cb: (prev: Set<number>) => Set<number>) => void) => {
    try {
      setLoadingUserIds(prev => new Set(prev).add(userId));
      const response = await revokeOrganizationInvite(classroomId!, userId);
      queryClient.setQueryData(
        ['classroomUsers', classroomId],
        (oldData: IClassroomUser[] = []) => {
          return oldData.filter(user => user.id !== userId);
        }
      );
      setError(null);
      return response;
    } catch (error) {
      setError("Failed to revoke invite. Please try again.");
      throw error;
    } finally {
      setLoadingUserIds(prev => {
        return removeFromSet(prev, userId);
      });
    }
  };

  return { revokeInvite, error };
}

/**
 * Provides a function to remove a user from the classroom.
 * 
 * @param classroomId - The ID of the classroom to remove the user from.
 * @param currentUserId - The ID of the current user.
 * @returns The function to remove a user from the classroom.
 */
export function useRemoveClassroomUser(classroomId: number | undefined, currentUserId: number | undefined) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const removeUser = async (userId: number, setLoadingUserIds: (cb: (prev: Set<number>) => Set<number>) => void) => {
    if (userId === currentUserId) {
      setError("You cannot remove yourself from the classroom.");
      return;
    }

    try {
      setLoadingUserIds(prev => new Set(prev).add(userId));
      const response = await removeUserFromClassroom(classroomId!, userId);
      queryClient.setQueryData(
        ['classroomUsers', classroomId],
        (oldData: IClassroomUser[] = []) => {
          return oldData.filter(user => user.id !== userId);
        }
      );
      setError(null);
      return response;
    } catch (error) {
      setError("Failed to remove user. Please try again.");
      throw error;
    } finally {
      setLoadingUserIds(prev => {
        return removeFromSet(prev, userId);
      });
    }
  };

  return { removeUser, error };
}
