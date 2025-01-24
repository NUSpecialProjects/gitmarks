import { useQuery } from "@tanstack/react-query";
import { postClassroomToken } from "@/api/classrooms";
import { ClassroomRole } from "@/types/enums";

export const useClassroomInviteLink = (classroomId: number | undefined, role: ClassroomRole, enabled: boolean = true) => {
  const base_url: string = import.meta.env.VITE_PUBLIC_FRONTEND_DOMAIN as string;

  return useQuery({
    queryKey: ['classroomToken', classroomId, role],
    queryFn: async () => {
      if (!classroomId) return null;
      const data = await postClassroomToken(classroomId, role);
      return `${base_url}/token/classroom/join?token=${data.token}`;
    },
    enabled: !!classroomId && enabled
  });
};
