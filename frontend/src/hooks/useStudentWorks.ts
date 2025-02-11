import { useQuery } from "@tanstack/react-query";
import { getStudentWorks } from "@/api/student_works";

/**
 * Provides the student works for an assignment.
 * 
 * @param classroomId - The ID of the classroom to fetch the student works for.
 * @param assignmentId - The ID of the assignment to fetch the student works for.
 * @param enabled - Manually enable or disable the query.
 * @returns The student works for the assignment.
 */
export const useStudentWorks = (
  classroomId: number | undefined,
  assignmentId: number | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['studentWorks', classroomId, assignmentId],
    queryFn: () => getStudentWorks(classroomId!, assignmentId!),
    enabled: !!classroomId && !!assignmentId && enabled,
  });
}; 