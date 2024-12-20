interface IClassroom {
  id: number;
  name: string;
  org_id: number;
  org_name: string;
  created_at: Date;
}

interface IClassroomResponse {
  classroom: IClassroom;
}

interface IUserOrgsAndClassroomsResponse {
  orgs_and_classrooms: Map<IOrganization, IClassroom[]>;
}

interface IClassroomUsersListResponse {
  classroom_users: IClassroomUser[];
  org_role: OrgRole;
}

interface IClassroomToken {
  classroom_id: number;
  classroom_role: string;
  token: string;
  expires_at: string | null;
  created_at: string;
}

interface IClassroomJoinResponse extends ITokenUseResponse {
  classroom: IClassroom;
}
