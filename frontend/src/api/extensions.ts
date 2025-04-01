const base_url: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;


export const createAssignmentExtension = async (
    classroomID: number,
    assignmentID: number,
    newDate: string,
  ): Promise<Date> => {
    const response = await fetch(
        `${base_url}/extension/assignment`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classroomID: classroomID,
            assignmentID: assignmentID,
            newDate:  newDate,
          }),
        }
      );
      const data = await response.json();

    // Assuming the API returns the new date as a string, parse it into a Date object
    if (!data.newDate) {
        throw new Error("Response is missing 'newDate' field");
    }

    return new Date(data.newDate);

};