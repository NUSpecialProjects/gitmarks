const base_url: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

export const getPaginatedStudentWork = async (
  classroomID: number,
  assignmentID: number,
  studentWorkID: number
): Promise<IPaginatedStudentWorkResponse> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/works/work/${studentWorkID}`,
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
  const resp = (await response.json()) as IPaginatedStudentWorkResponse;
  return resp;
};

export const getStudentWorks = async (
  classroomID: number,
  assignmentID: number
): Promise<IStudentWork[]> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/works`,
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
  const data: IStudentWorkResponses = await response.json();
  return data.student_works;
};


export const getStudentWorkCommitsPerDay = async (
  classroomID: number,
  assignmentID: number,
  studentWorkID: number
): Promise<Map<Date, number>> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/works/work/${studentWorkID}/commits-per-day`,
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
  const resp = (await response.json() as ICommitsPerDayResponse);

  const commitsMap = new Map<Date, number>(
    Object.entries(resp.dated_commits).map(([key, value]) => [(new Date(key)), value])
  );
  console.log(commitsMap)

  return commitsMap;
}

export const getStudentWorkById = async (
  classroomID: number,
  assignmentID: number,
  studentWorkID: number
): Promise<IStudentWork> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/works/work/${studentWorkID}`,
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
  const resp = ((await response.json()) as IStudentWork);
  return resp;
}

export const getFirstCommit = async (
  classroomID: number,
  assignmentID: number,
  studentWorkID: number
): Promise<Date> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/works/work/${studentWorkID}/first-commit`,
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
  const resp = ((await response.json()) as Date);
  return resp;
}

export const getTotalCommits = async (
  classroomID: number,
  assignmentID: number,
  studentWorkID: number
): Promise<number> => {
  const response = await fetch(
    `${base_url}/classrooms/classroom/${classroomID}/assignments/assignment/${assignmentID}/works/work/${studentWorkID}/commit-count`,
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
  const resp = (await response.json());
  const count = resp.commit_count;
  return count;
}
