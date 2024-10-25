import { GradeEntry } from "@/components/Viz/BoxPlot/Boxplot";


const base_url: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

export const getGrades = async (assID: number): Promise<GradeEntry[]> => {
    const response = await fetch(`${base_url}/grades/autograding/assignment/${assID}`, {
        method: "GET",
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return await response.json() as GradeEntry[];

    // Coerce response into an array of GradeEntry objects
    // return data.map((item: any) => ({
    //     name: item.name,   
    //     value: item.value    
    // })) as GradeEntry[];
};

export const getUserGrades = async (userGH: string): Promise<GradeEntry[]> => {
    const response = await fetch(`${base_url}/grades/autograding/user/${userGH}`, {
        method: "GET",
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return await response.json() as GradeEntry[];

    // Coerce response into an array of GradeEntry objects
    // return data.map((item: any) => ({
    //     name: item.name,   
    //     value: item.value    
    // })) as GradeEntry[];
};



export const getUserGradeByAssID = async (assID: number, userGH: string): Promise<GradeEntry> => {
    const response = await fetch(`${base_url}/grades/autograding/assignment/${assID}/user/${userGH}`, {
        method: "GET",
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    const data = await response.json();

    // Coerce response into an array of GradeEntry objects
    return {
        name: data.name,
        value: data.value 
        } as GradeEntry;
};