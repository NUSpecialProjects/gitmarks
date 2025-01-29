const base_url: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

export async function postAssignmentToken(
  classroomID: number,
  assignmentID: number,
  duration?: number // Duration is optional
): Promise<IAssignmentToken> {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/token`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        duration: duration,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const resp: IAssignmentToken = await response.json();
  return resp;
}

export async function useAssignmentToken(
  token: string
): Promise<IAssignmentAcceptResponse> {
  const response = await fetch(
    // the classroom id doesn't matter here
    `${base_url}/classrooms/classroom/${0}/assignments/token/${token}`,
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

  const resp: IAssignmentAcceptResponse = await response.json();
  return resp;
}

export const getAssignments = async (
  classroomId: number
): Promise<IAssignmentOutline[]> => {
  const result = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/assignments`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!result.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await result.json();

  return data.assignment_outlines as IAssignmentOutline[];
};

export const getAssignmentIndirectNav = async (
  classroomID: number,
  assignmentID: number
): Promise<IAssignmentOutline> => {
  const result = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!result.ok) {
    throw new Error("Network response was not ok");
  }

  const data: IAssignmentOutline = (
    (await result.json()) as IAssignmentOutlineResponse
  ).assignment_outline;

  return data;
};

export const getAssignmentTemplate = async (
  classroomID: number,
  assignmentID: number
): Promise<IAssignmentTemplate> => {
  const result = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/template`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!result.ok) {
    throw new Error("Network response was not ok");
  }

  const data: IAssignmentTemplate = (await result.json()).assignment_template;
  return data;
};

export const createAssignment = async (
  templateRepoID: number,
  assignment: IAssignmentFormData
): Promise<IAssignmentFormData> => {
  const result = await fetch(
    `${base_url}/classrooms/classroom/${assignment.classroomId}/assignments`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: templateRepoID,
        name: assignment.assignmentName,
        classroom_id: assignment.classroomId,
        group_assignment: assignment.groupAssignment,
        main_due_date: assignment.mainDueDate,
        default_score: Number(assignment.defaultScore),
      }),
    }
  );

  if (!result.ok) {
    let errorMessage;

    // Attempt to parse the error message from the response body
    try {
      const errorData = await result.json();
      errorMessage = errorData.msg;
    } catch {
      errorMessage = "an unknown error occurred";
    }

    throw new Error(`Failed to create assignment: ${errorMessage}`);
  }

  const data = await result.json();
  return data.assignment_outline as IAssignmentFormData;
};

export const assignmentNameExists = async (
  classroomId: number,
  assignmentName: string
): Promise<boolean> => {
  const result = await fetch(
    `${base_url}/classrooms/classroom/${classroomId}/assignments/assignment/${assignmentName}/exists`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!result.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await result.json();

  return data.exists as boolean;
};

export const setAssignmentRubric = async (
  rubric_id: number,
  classroomID: number,
  assignmentID: number
): Promise<IAssignmentOutline> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/rubric`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rubric_id),
    }
  );

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data: IAssignmentOutline = (
    (await response.json()) as IAssignmentOutlineResponse
  ).assignment_outline;

  return data;
};

export const getAssignmentRubric = async (
  classroomID: number,
  assignmentID: number
): Promise<IFullRubric> => {
  const result = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/rubric`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!result.ok) {
    throw new Error("Network response was not ok");
  }

  return await result.json();
};

export const getAssignmentFirstCommit = async (
  classroomID: number,
  assignmentID: number
): Promise<Date> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/first-commit`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const resp = ((await response.json()) as IAssignmentCommitDate)
    .first_commit_at;
  return resp;
};

export const getAssignmentTotalCommits = async (
  classroomID: number,
  assignmentID: number
): Promise<number> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/commit-count`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const resp = await response.json();
  return resp;
};
