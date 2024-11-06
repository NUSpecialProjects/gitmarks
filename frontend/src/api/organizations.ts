const base_url: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

export const getAppInstallations =
  async (): Promise<IOrganizationsResponse> => {
    const response = await fetch(`${base_url}/orgs/installations`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json() as Promise<IOrganizationsResponse>;
  };

export const getOrganizationDetails = async (
  login: string
): Promise<IOrganization> => {
  const response = await fetch(`${base_url}/orgs/org/${login}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const resp = (await response.json()) as { org: IOrganization };
  return resp.org;
};