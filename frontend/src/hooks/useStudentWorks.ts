import { useQuery } from "@tanstack/react-query";
import { getStudentWorks } from "@/api/student_works";

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