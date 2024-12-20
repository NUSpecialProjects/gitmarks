const base_url: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

export async function getCurrentClassroomUser(
  classroomId: number
): Promise<IClassroomUser> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/user`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    console.log("Error getting current classroom user:", response.statusText);
    throw new Error(response.statusText);
  }
  const resp: { user: IClassroomUser } = await response.json();
  return resp.user;
}

export async function getClassroomUsers(
  classroomId: number
): Promise<IClassroomUser[]> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/students`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const resp: { users: IClassroomUser[] } = await response.json();
  return resp.users;
}

export async function getClassroomsInOrg(
  orgId: number
): Promise<IClassroomUsersListResponse> {
  const response = await fetch(`${base_url}/orgs/org/${orgId}/classrooms`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const resp: IClassroomUsersListResponse = await response.json();
  return resp;
}

export async function postClassroom(
  classroom: Omit<IClassroom, "id" | "created_at">
): Promise<IClassroom> {
  const response = await fetch(`${base_url}/classrooms`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(classroom),
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const resp: IClassroomResponse = await response.json();
  return resp.classroom;
}

export async function postClassroomToken(
  classroomId: number,
  role: string,
  duration?: number // Duration is optional
): Promise<IClassroomToken> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/token`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classroom_role: role,
        duration: duration,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const resp: IClassroomToken = await response.json();
  return resp;
}

export async function useClassroomToken(
  token: string
): Promise<IClassroomJoinResponse> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/token/${token}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const resp: IClassroomJoinResponse = await response.json();
  return resp;
}

export async function sendOrganizationInvitesToRequestedUsers(
  classroomId: number,
  role: string
): Promise<IClassroomInvitedUsersListResponse> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/invite/role/${role}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return await response.json();
}

export async function sendOrganizationInviteToUser(
  classroomId: number,
  role: string,
  userId: number
): Promise<IClassroomUserResponse> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/invite/role/${role}/user/${userId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return await response.json();
}

export async function denyRequestedUser(
  classroomId: number,
  userId: number
): Promise<void> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/deny/user/${userId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }
}

export async function revokeOrganizationInvite(
  classroomId: number,
  userId: number
): Promise<void> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/revoke/user/${userId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }
}

export async function removeUserFromClassroom(
  classroomId: number,
  userId: number
): Promise<void> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/students/${userId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }
}

export async function getClassroomNames(): Promise<string[]> {
  const response = await fetch(`${base_url}/classrooms/names`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const resp: { semester_names: string[] } = await response.json();
  return resp.semester_names;
}
