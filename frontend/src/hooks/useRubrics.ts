import { useQuery } from "@tanstack/react-query";
import { getRubricsInClassroom } from "@/api/rubrics";

/**
 * Provides the rubrics in a classroom.
 * 
 * @param classroomId - The ID of the classroom to fetch the rubrics for.
 * @returns The rubrics in the classroom.
 */
export const useRubrics = (classroomId: number | undefined) => {
  return useQuery({
    queryKey: ['rubrics', classroomId],
    queryFn: () => getRubricsInClassroom(classroomId!),
    enabled: !!classroomId,
  });
};
