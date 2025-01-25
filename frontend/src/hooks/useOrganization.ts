import { getAppInstallations, getOrganizationDetails } from "@/api/organizations";
import { useQuery } from "@tanstack/react-query";
import { getClassroomsInOrg } from "@/api/classrooms";

/**
 * Provides the details of an organization.
 * 
 * @param orgID - The ID of the organization to fetch the details for.
 * @returns The organization.
 */
export const useOrganizationDetails = (orgID: string) => {
  return useQuery({
    queryKey: ['organization', orgID],
    queryFn: () => getOrganizationDetails(orgID),
    enabled: !!orgID
  });
};

/**
 * Provides the classrooms in an organization.
 * 
 * @param orgID - The ID of the organization to fetch the classrooms for.
 * @returns The classrooms in the organization.
 */
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

/**
 * Provides the installationa of the GitHub App.
 * 
 * @returns The app installations
 */
export const useAppInstallations = () => {
  return useQuery({
    queryKey: ['app-installations'],
    queryFn: getAppInstallations,
  });
};