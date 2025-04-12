const baseUrl: string = import.meta.env.VITE_PUBLIC_API_DOMAIN as string;

export const getRepoFromGithub = async (
    repoOwner: string,
  repoName: string
): Promise<IRepository> => {
  const result = await fetch(
    `${baseUrl}/github/repo/${repoOwner}/${repoName}`,
    {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  
    if (!result.ok) {
      console.log("error getting repo from github: ", result);
      throw new Error("Network response was not ok");
    }
  
    const data = await result.json();
    return data.repository as IRepository;
};