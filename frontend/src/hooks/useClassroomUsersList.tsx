import { useQuery } from "@tanstack/react-query";
import { getClassroomUsers } from "@/api/classrooms";

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
