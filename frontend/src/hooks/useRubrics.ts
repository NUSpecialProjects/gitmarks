import { useQuery } from "@tanstack/react-query";
import { getRubricsInClassroom } from "@/api/rubrics";

export const useRubrics = (classroomId: number | undefined) => {
  return useQuery({
    queryKey: ['rubrics', classroomId],
    queryFn: () => getRubricsInClassroom(classroomId!),
    enabled: !!classroomId,
  });
};
