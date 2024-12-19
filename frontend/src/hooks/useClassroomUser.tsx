import { useQuery } from "@tanstack/react-query";
import { getCurrentClassroomUser } from "@/api/classrooms";
import { ClassroomRole, requireAtLeastClassroomRole } from "@/types/enums";
import { useNavigate } from "react-router-dom";

export function useClassroomUser(classroomId?: number, requiredRole: ClassroomRole = ClassroomRole.TA, redirectPath: string = "/access-denied") {
  const navigate = useNavigate();

  const { data: classroomUser, error, isLoading } = useQuery({
    queryKey: ['classroomUser', classroomId],
    queryFn: async () => {
      if (!classroomId) return null;
      const user = await getCurrentClassroomUser(classroomId);
      if (user.classroom_id !== classroomId) {
        throw new Error("User is not in the specified classroom");
      }
      if (requiredRole && redirectPath && !requireAtLeastClassroomRole(user.classroom_role, requiredRole)) {
        navigate(redirectPath, { replace: true });
      }
      return user;
    },
    enabled: !!classroomId,
    retry: false
  });

  return { 
    classroomUser: classroomUser || null, 
    error: error as Error | null,
    loading: isLoading 
  };
}
