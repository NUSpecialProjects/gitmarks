import { StubProps } from "../../pages/Stub";

// Function to fetch stubs from the API
export const fetchStubs = async (): Promise<StubProps[]> => {
  const apiDomain = await import.meta.env.VITE_TEST_VAR;

  if (!apiDomain) {
    throw new Error(
      "PUBLIC_API_DOMAIN is not defined in the environment variables."
    );
  }

  const response = await fetch(`${apiDomain}/tests/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stubs");
  }

  const data: any[] = await response.json();

  const stubs: StubProps[] = data.map((stub: any) => ({
    stub_id: stub.id,
    stub_content: stub.content,
  }));
  return stubs;
};
/*
// Example usage of the fetchStubs function
fetchStubs()
  .then((stubs) => {
    console.log("Stubs:", stubs);
  })
  .catch((error) => {
    console.error("Error fetching stubs:", error);
  });
*/
