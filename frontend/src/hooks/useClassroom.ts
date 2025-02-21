import { useQuery } from "@tanstack/react-query";
import { getClassroomNames, postClassroomToken } from "@/api/classrooms";
import { checkClassroomExists } from "@/api/classrooms";
import { ClassroomRole } from "@/types/enums";

/**
 * Provides the list of predefined classroom names.
 * 
 * @returns The list of classroom names.
 */
export const useClassroomNames = () => {
  return useQuery({
    queryKey: ['classroomNames'],
    queryFn: async () => {
      return await getClassroomNames();
    }
  });
};

/**
 * Provides the validation of a classroom name.
 * 
 * @param name - The name of the classroom to validate.
 * @returns The validation of the classroom name.
 */
export const useClassroomValidation = (name: string) => {
  return useQuery({
    queryKey: ["classroomExists", name],
    queryFn: () => checkClassroomExists(name),
    enabled: !!name && name !== "Custom",
    staleTime: 1000,
    gcTime: 0,
    retry: false
  });
};

/**
 * Provides an invite link for a classroom.
 * 
 * @param classroomId - The ID of the classroom to fetch the invite link for.
 * @param role - The role of the user to fetch the invite link for.
 * @param enabled - Manually enable or disable the query.
 * @returns The invite link for the classroom.
 */
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