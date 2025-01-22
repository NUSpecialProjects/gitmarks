import { getOrganizationDetails } from "@/api/organizations";
import { useQuery } from "@tanstack/react-query";


export const useOrganizationDetails = (orgID: string) => {
  return useQuery({
    queryKey: ['organization', orgID],
    queryFn: () => getOrganizationDetails(orgID),
    enabled: !!orgID
  });
};
