import { useQuery } from "@tanstack/react-query";
import { getCurrentClassroomUser, getClassroomUsers } from "@/api/classrooms";
import { ClassroomRole, ClassroomUserStatus, requireAtLeastClassroomRole } from "@/types/enums";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { SelectedClassroomContext } from "@/contexts/selectedClassroom";

export function useCurrentClassroom() {
  const context = useContext(SelectedClassroomContext);
  if (context === null) {
    throw new Error('useCurrentClassroom must be used within a SelectedClassroomProvider');
  }
  return context;
}

export function useClassroomUser(requiredRole: ClassroomRole | null = null, redirectPath: string | null = null) {
  const navigate = useNavigate();
  const context = useContext(SelectedClassroomContext);
  if (context === null) {
    throw new Error('useClassroomUser must be used within a SelectedClassroomProvider');
  }

  const classroomId = context.selectedClassroom?.id;

  const { data: classroomUser, error, status } = useQuery({
    queryKey: ['classroomUser', classroomId],
    queryFn: async () => {
      if (!classroomId) return null;
      try {
        const user = await getCurrentClassroomUser(classroomId);
        if (user.classroom_id !== classroomId) {
          throw new Error("User is not in the specified classroom");
        }
        if (user.status !== ClassroomUserStatus.ACTIVE) {
          throw new Error("User is not active in this classroom");
        }
        if (requiredRole && !requireAtLeastClassroomRole(user.classroom_role, requiredRole)) {
          throw new Error("User does not have the required role");
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

export function useClassroomUsersList(classroomId?: number) {
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
