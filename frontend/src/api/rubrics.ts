const base_url: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

export const createRubric = async (
    rubric: IFullRubric
  ): Promise<IFullRubric> => {
    const response = await fetch(
      `${base_url}/rubrics/rubric`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rubric),
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data: IFullRubric = (await response.json() as IFullRubricResponse).full_rubric
    return data
  };


export const getRubric = async (
  rubricID: number
): Promise<IFullRubric> => {
  const result = await fetch(`${base_url}/rubrics/rubric/${rubricID}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!result.ok) {
    throw new Error('Network response was not ok');
  }

  const data: IFullRubric = (await result.json() as IFullRubricResponse).full_rubric
  return data
};


export const updateRubric = async (
  rubricID: number, 
  rubric: IFullRubric
): Promise<IFullRubric> => {
  const response = await fetch(
    `${base_url}/rubrics/rubric/${rubricID}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rubric),
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data: IFullRubric = (await response.json() as IFullRubricResponse).full_rubric
  
  return data
};

export const getRubricsInClassroom = async (
  classroomID: number
): Promise<IFullRubric[]> => {
  const result = await fetch(`${base_url}/classrooms/classroom/${classroomID}/rubrics`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!result.ok) {
    throw new Error('Network response was not ok');
  }

  const data: IFullRubric[] = (await result.json() as IFullRubricsResponse).full_rubrics  
  return data
}