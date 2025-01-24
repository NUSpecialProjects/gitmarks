import { useQuery } from "@tanstack/react-query";
import { getClassroomNames } from "@/api/classrooms";
import { checkClassroomExists } from "@/api/classrooms";

// accepts a function to automatically set the selected name on first load
export const useClassroomNames = (onFirstName: (name: string) => void) => {
  return useQuery({
    queryKey: ['classroomNames'],
    queryFn: async () => {
      const names = await getClassroomNames();
      if (names.length > 0) {
        onFirstName(names[0]);
      }
      return names;
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
