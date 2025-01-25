import { useQuery } from "@tanstack/react-query";
import { getClassroomNames } from "@/api/classrooms";
import { checkClassroomExists } from "@/api/classrooms";

// accepts a function to automatically set the selected name on first load
export const useClassroomNames = () => {
  return useQuery({
    queryKey: ['classroomNames'],
    queryFn: async () => {
      return await getClassroomNames();
    }
  });
};

export const useClassroomValidation = (name: string) => {
  return useQuery({
    queryKey: ["classroomExists", name],
    queryFn: () => checkClassroomExists(name),
    enabled: !!name && name !== "Custom",
  });
};
