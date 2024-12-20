interface IGitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  url: string;
  name: string | null;
  email: string | null;
}

interface IGitHubUserResponse {
  user: IGitHubUser;
}

interface IUser {
  id: number;
  first_name: string;
  last_name: string;
  github_username: string;
  github_user_id: number;
}

interface IClassroomUser extends IUser {
  classroom_id: number;
  classroom_name: string;
  classroom_created_at: Date;
  classroom_role: ClassroomRole;
  status: ClassroomUserStatus;
  org_id: number;
  org_name: string;
}

interface IClassroomUserResponse {
  message: string;
  user: IClassroomUser;
}

interface IClassroomInvitedUsersListResponse {
  message: string;
  invited_users: IClassroomUser[];
  requested_users: IClassroomUser[];
}


