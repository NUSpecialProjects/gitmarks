import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentClassroomUser, getClassroomUsers } from "@/api/classrooms";
import { ClassroomRole, ClassroomUserStatus, requireAtLeastClassroomRole } from "@/types/enums";
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";
import { sendOrganizationInviteToUser, revokeOrganizationInvite, removeUserFromClassroom } from "@/api/classrooms";

export function useCurrentClassroom() {
  const context = useContext(SelectedClassroomContext);
  if (context === null) {
    throw new Error('useCurrentClassroom must be used within a SelectedClassroomProvider');
  }
  return context;
}

export function useClassroomUser(requiredRole?: ClassroomRole, redirectPath?: string) {
  const navigate = useNavigate();
  const context = useContext(SelectedClassroomContext);
  if (context === null) {
    throw new Error('useClassroomUser must be used within a SelectedClassroomProvider');
  }

  const classroomId = context.selectedClassroom?.id;

  const { data: classroomUser, error, status } = useQuery({
    queryKey: ['classroomUser', classroomId],
    queryFn: async () => { //TODO: redirect is not working :(
      if (!classroomId) return null;
      try {
        const user = await getCurrentClassroomUser(classroomId);
        if (requiredRole && redirectPath) {
          if (user.classroom_id !== classroomId) {
            throw new Error("User is not in the specified classroom");
          }
          if (user.status !== ClassroomUserStatus.ACTIVE) {
            throw new Error("User is not active in this classroom");
          }
          if (requiredRole && !requireAtLeastClassroomRole(user.classroom_role, requiredRole)) {
            throw new Error("User does not have the required role");
          }
        }
        return user;
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
    error: error as Error | null,
    status: status,
    loading: status === "pending"
  };
}

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
    } catch (_) {
      setError("Failed to invite user. Please try again.");
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return { inviteUser, error };
}

export function useRevokeClassroomInvite(classroomId: number | undefined) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const revokeInvite = async (userId: number, setLoadingUserIds: (cb: (prev: Set<number>) => Set<number>) => void) => {
    try {
      setLoadingUserIds(prev => new Set(prev).add(userId));
      await revokeOrganizationInvite(classroomId!, userId);
      queryClient.setQueryData(
        ['classroomUsers', classroomId],
        (oldData: IClassroomUser[] = []) => {
          return oldData.filter(user => user.id !== userId);
        }
      );
      setError(null);
    } catch (_) {
      setError("Failed to revoke invite. Please try again.");
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return { revokeInvite, error };
}

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
      await removeUserFromClassroom(classroomId!, userId);
      queryClient.setQueryData(
        ['classroomUsers', classroomId],
        (oldData: IClassroomUser[] = []) => {
          return oldData.filter(user => user.id !== userId);
        }
      );
      setError(null);
    } catch (_) {
      setError("Failed to remove user. Please try again.");
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return { removeUser, error };
}
