import { getAppInstallations, getOrganizationDetails } from "@/api/organizations";
import { useQuery } from "@tanstack/react-query";
import { getClassroomsInOrg } from "@/api/classrooms";

export const useOrganizationDetails = (orgID: string) => { //TODO: login??
  return useQuery({
    queryKey: ['organization', orgID],
    queryFn: () => getOrganizationDetails(orgID),
    enabled: !!orgID
  });
};

export const useOrganizationClassrooms = (orgID: number | undefined) => {
  return useQuery({
    queryKey: ['classrooms', orgID],
    queryFn: async () => {
      if (!orgID || isNaN(Number(orgID))) {
        throw new Error("Invalid organization ID");
      }
      return getClassroomsInOrg(Number(orgID));
    },
    enabled: !!orgID && !isNaN(Number(orgID)),
    retry: false
  });
};


export const useAppInstallations = () => {
  return useQuery({
    queryKey: ['app-installations'],
    queryFn: getAppInstallations,
  });
};