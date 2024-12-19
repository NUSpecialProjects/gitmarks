const base_url: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

export const fetchCurrentUser = async (): Promise<IUserResponse> => {
  const response = await fetch(`${base_url}/user`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Unauthorized");
    } else {
      throw new Error("Network response was not ok");
    }
  }

  const data: IUserResponse = await response.json();
  return data;
};

export const fetchUser = async (
  user_name: string
): Promise<IUserResponse> => {
  const response = await fetch(`${base_url}/users/user/${user_name}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
};
