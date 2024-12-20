interface IAssignmentOutline {
  id: number;
  template_id: number;
  created_at: Date;
  released_at: Date | null;
  name: string;
  classroom_id: number;
  rubric_id: number | null;
  group_assignment: boolean;
  main_due_date: Date | null;
  default_score: number;
}

interface IAssignmentOutlineResponse {
  assignment_outline: IAssignmentOutline;
}

interface IAssignmentTemplate {
  template_id: number;
  template_repo_owner: string;
  template_repo_name: string;
  created_at: Date;
}

interface IAssignmentToken {
  assignment_id: number;
  token: string;
  expires_at: string | null;
  created_at: string;
}

interface IAssignmentAcceptResponse extends ITokenUseResponse {
  repo_url: string;
}

interface IAssignmentCommitDate {
  assignment_id: number;
  first_commit_at: Date;
}
